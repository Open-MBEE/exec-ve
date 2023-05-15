import { StateService } from '@uirouter/angularjs';
import { IComponentController } from 'angular';
import _ from 'lodash';

import { TreeService } from '@ve-components/trees';
import { CacheService } from '@ve-utils/core';
import { ElementService } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

import { VeComponentOptions, VeQService } from '@ve-types/angular';
import { DocumentObject, ElementObject, GroupObject, ParamsObject, ProjectObject, RefObject } from '@ve-types/mms';
import { AngularUITree, VeTreeNodeScope } from '@ve-types/tree';

interface ReorderGroupNode {
    data: GroupObject | DocumentObject;
    children: ReorderGroupNode[];
    name: string;
    id: string;
    type: string;
    isChild?: boolean;
}

interface ReorderGroupResult {
    node: ReorderGroupNode;
    newOwnerId: string;
}

class ReorderGroupController implements IComponentController {
    params: ParamsObject;
    mmsProject: ProjectObject;
    mmsRef: RefObject;
    mmsGroups: GroupObject[];
    mmsDocuments: DocumentObject[];

    //Locals
    groups: GroupObject[];
    documents: DocumentObject[];
    isSaving = false;
    targetId = '';

    treeOptions: AngularUITree.ICallbacks;

    static $inject = ['$q', '$scope', '$state', 'growl', 'ElementService', 'CacheService', 'TreeService'];
    private tree: ReorderGroupNode[];

    constructor(
        private $q: VeQService,
        private $scope: angular.IScope,
        private $state: StateService,
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private cacheSvc: CacheService,
        private treeSvc: TreeService
    ) {}

    $onInit(): void {
        this.groups = this.mmsGroups;
        this.documents = this.mmsDocuments;

        const children = this.generateTree();
        this.sortRecursively(children);
        const root = this.createNode('Top Level', 'root', children, {
            id: 'root',
            _projectId: this.params.projectId,
            _refId: this.params.refId,
        });
        this.tree = [root];

        this.treeOptions = {
            dropped: (change): void => {
                this.sortRecursively(children);
                this.targetId = '';
            },
            accept: (sourceNodeScope: VeTreeNodeScope, destNodeScope: VeTreeNodeScope, destIndex): boolean => {
                // allow moving to the root or to a group
                const accept =
                    destNodeScope.node && (destNodeScope.node.type === 'group' || destNodeScope.node.type === 'root');
                if (accept) {
                    if (
                        destNodeScope.$nodeScope &&
                        destNodeScope.$nodeScope.$modelValue &&
                        (
                            destNodeScope.$nodeScope.$modelValue as {
                                id: string;
                            }
                        ).id
                    ) {
                        this.targetId = (
                            destNodeScope.$nodeScope.$modelValue as {
                                id: string;
                            }
                        ).id;
                    }
                }
                return accept;
            },
            dragStart: (data): void => {
                this.targetId = (
                    data.dest.nodesScope.$nodeScope.$modelValue as {
                        id: string;
                    }
                ).id;
            },
        };
    }

    public generateTree(): ReorderGroupNode[] {
        // create a node for each groupOb
        let tree = this.groups.map((groupOb) => {
            return this.createNode(groupOb.name, 'group', [], groupOb);
        });

        // add document to its group
        this.documents
            .filter((documentOb) => {
                return documentOb._groupId;
            })
            .forEach((documentOb) => {
                const parent = _.find(tree, (node) => {
                    return node.data.id === documentOb._groupId;
                });
                if (parent) {
                    parent.children.push(this.createNode(documentOb.name, 'view', [], documentOb));
                }
            });

        // for any group that has a parent group, establish that connection
        tree.forEach((groupNode) => {
            const foundParent = _.find(tree, (node) => {
                return node.data.id === groupNode.data._parentId;
            });
            if (foundParent) {
                groupNode.isChild = true;
                foundParent.children.push(groupNode);
            }
            return groupNode;
        });

        // only groups that don't have parents show up at root level
        tree = tree.filter((groupNode) => {
            return !groupNode.isChild;
        });

        // add all the documents that don't belong to any group
        this.documents
            .filter((documentOb) => {
                return !documentOb._groupId;
            })
            .forEach((documentOb) => {
                this.tree.push(this.createNode(documentOb.name, 'view', [], documentOb));
            });
        return tree;
    }

    public createNode(
        name: string,
        type: string,
        children: ReorderGroupNode[],
        data: GroupObject | DocumentObject
    ): ReorderGroupNode {
        return {
            name: name,
            type: type,
            children: children,
            data: data,
            id: data.id,
        };
    }

    public cancelReorder = (): void => {
        this.navigateAway(false);
    };

    public saveReorder = (): void => {
        if (!this.isSaving) {
            this.isSaving = true;
            const results: ReorderGroupResult[] = [];
            this.findNodesToUpdate(results);
            const elementsToUpdate: ElementObject[] = results.map((result) => {
                return {
                    id: result.node.data.id,
                    ownerId: result.newOwnerId,
                    _projectId: this.params.projectId,
                    _refId: this.params.refId,
                    type: result.node.data.type,
                };
            });
            this.elementSvc
                .updateElements(elementsToUpdate, false)
                .then(() => {
                    this.cleanupCache(results);
                    this.navigateAway(true);
                })
                .catch(() => {
                    this.growl.error('Failed to save the grouping!');
                })
                .finally(() => {
                    this.isSaving = false;
                });
        } else {
            this.growl.info('please wait');
        }
    };

    public findNodesToUpdate = (result: ReorderGroupResult[]): void => {
        // ignore root
        const root = this.tree[0];
        root.children.forEach((node) => {
            // handle node change at the root level
            if ((node.type === 'group' && node.data._parentId) || (node.type === 'view' && node.data._groupId)) {
                result.push({
                    node: node,
                    newOwnerId: 'holding_bin_' + this.params.projectId,
                });
            }

            // handle change at lower level
            helper(node, result);
        });

        const helper = (node: ReorderGroupNode, result: ReorderGroupResult[]): void => {
            node.children.forEach((childNode) => {
                if (
                    (childNode.type === 'group' && childNode.data._parentId !== node.data.id) ||
                    (childNode.type === 'view' && childNode.data._groupId !== node.data.id)
                ) {
                    result.push({
                        node: childNode,
                        newOwnerId: node.data.id,
                    });
                }
                helper(childNode, result);
            });
        };
    };

    public cleanupCache = (results: ReorderGroupResult[]): void => {
        // update cache for documents list and groups list
        const listOfDocInCache = this.cacheSvc.get<DocumentObject[]>([
            'documents',
            this.params.projectId,
            this.params.refId,
        ]);
        const listOfGroupInCache = this.cacheSvc.get<GroupObject[]>([
            'groups',
            this.params.projectId,
            this.params.refId,
        ]);
        results.forEach((result) => {
            // for group or document that is moved to the root, _parentId for "group" and _groupId for "document" need to be set to undefined
            const newOwnerId = result.newOwnerId.indexOf(this.params.projectId) !== -1 ? undefined : result.newOwnerId;

            if (result.node.type === 'group') {
                const cacheGroupOb = _.find(listOfGroupInCache, (groupOb) => {
                    return groupOb.id === result.node.data.id;
                });
                if (cacheGroupOb) {
                    cacheGroupOb._parentId = newOwnerId;
                }
            } else if (result.node.type === 'view') {
                const cacheDocument = _.find(listOfDocInCache, (documentOb) => {
                    return documentOb.id === result.node.data.id;
                });
                if (cacheDocument) {
                    cacheDocument._groupId = newOwnerId;
                }
            }
        });
    };

    public comparator = (a: ReorderGroupNode, b: ReorderGroupNode): number => {
        if (a.type === b.type) {
            return a.name.localeCompare(b.name);
        } else {
            if (a.type === 'group') {
                return -1;
            } else {
                return 1;
            }
        }
    };

    public sortRecursively = (nodes: ReorderGroupNode[]): void => {
        nodes.sort(this.comparator);
        nodes.forEach((node) => {
            this.sortRecursively(node.children);
        });
    };

    public navigateAway = (reload: boolean): void => {
        const curBranch = this.treeSvc.getSelectedBranch();
        if (curBranch) {
            const documentId = curBranch.type === 'group' ? 'site_' + curBranch.data.id + '_cover' : curBranch.data.id;
            void this.$state.go('main.project.ref.portal.preview', { preview: documentId }, { reload: reload });
        } else {
            void this.$state.go('main.project.ref.portal', {}, { reload: reload });
        }
    };
}

const ReorderGroupComponent: VeComponentOptions = {
    selector: 'reorderGroup',
    template: `
    <!-- Nested node template -->
<div class="group-reorder-container">
    <script type="text/ng-template" id="nodes_renderer_group.html">
        <div ng-class="targetId === node.id ? 'highlighted' : ''" ui-tree-handle>
            <i ng-class="node.type === 'view' ? 'fa-solid fa-file' : node.type === 'group' ? 'fa-solid fa-folder' : 'fa-solid fa-home'"></i> {{node.name}}
        </div>
        <ol ui-tree-nodes="" ng-model="node.children">
            <li ng-repeat="node in node.children" ui-tree-node ng-include="'nodes_renderer_group.html'">
            </li>
        </ol>
    </script>

    <div class="container-tree-reorder container-fluid">
        <button class="btn-tree-reorder-save btn btn-primary" ng-click="saveReorder()">Save <i ng-If="isSaving" class='fa fa-spin fa-spinner'></i></button>
        <button class="btn-tree-reorder-save btn btn-default" ng-click="cancelReorder()">Cancel</button>
        <br>
        <p>Move group/document to/from a group. Only Grouping is preserved. Ordering is not.</p>
        <div class="well" ui-tree="treeOptions">
            <ol ui-tree-nodes="" class="root" ng-model="tree">
                <li ng-repeat="node in tree" ui-tree-node ng-include="'nodes_renderer_group.html'"></li>
            </ol>
        </div>
    </div>
</div>

`,
    bindings: {
        mmsGroups: '<',
        mmsDocuments: '<',
    },
    controller: ReorderGroupController,
};

veApp.component(ReorderGroupComponent.selector, ReorderGroupComponent);
