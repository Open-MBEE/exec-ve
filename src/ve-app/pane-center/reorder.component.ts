import { StateService } from '@uirouter/angularjs';
import angular, { IComponentController } from 'angular';
import _ from 'lodash';

import { AppUtilsService } from '@ve-app/main/services';
import { TreeService } from '@ve-components/trees';
import { EventService } from '@ve-utils/core';
import { ViewService, ElementService } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

import { VeComponentOptions, VePromise } from '@ve-types/angular';
import { DocumentObject, ViewObject } from '@ve-types/mms';
import { AngularUITree, TreeBranch, VeTreeNodeScope, View2NodeMap } from '@ve-types/tree';

/* Controllers */
/**
 * @name veApp/ReorderController * Controller for reordering view's in the tree
 *
 *
 * @requires StateService
 * @requires growl
 * @requires $scope
 * @requires veUtils/ElementService
 * @requires veUtils/ViewService
 * @requires veUtils/AppUtilsService
 * @requires veUtils/TreeService
 */
class ReorderController implements IComponentController {
    //bindings
    private mmsDocument: VePromise<DocumentObject>;

    //local
    protected doc: ViewObject;
    private viewIds2node: View2NodeMap = {};
    private origViews: { [key: string]: ViewObject } = {};
    public tree: TreeBranch[];
    public treeOptions: AngularUITree.ICallbacks;
    private seenViewIds: View2NodeMap = {};
    public saveClass: string = '';
    private saving: boolean = false;

    //injectables
    public subs: Rx.IDisposable[];

    static $inject = [
        '$state',
        '$timeout',
        'growl',
        '$scope',
        'ElementService',
        'ViewService',
        'AppUtilsService',
        'TreeService',
        'EventService',
    ];

    constructor(
        private $state: StateService,
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService,
        private $scope: angular.IScope,
        private elementSvc: ElementService,
        private viewSvc: ViewService,
        private appUtilsSvc: AppUtilsService,
        private treeSvc: TreeService,
        private eventSvc: EventService
    ) {}

    $onInit(): void {
        this.eventSvc.$init(this);

        this.mmsDocument.then(
            (doc) => {
                this.doc = doc;
                const name = this.doc.name ? this.doc.name : this.doc.id;

                this.viewIds2node[this.doc.id] = {
                    label: name,
                    type: 'view',
                    data: this.doc,
                    aggr: 'composite',
                    children: [],
                };

                this.viewSvc
                    .handleChildViews(
                        this.doc,
                        'composite',
                        undefined,
                        this.doc._projectId,
                        this.doc._refId,
                        this.viewIds2node,
                        this.handleSingleView,
                        this.handleChildren
                    )
                    .then(
                        (docNode: TreeBranch) => {
                            let num = 1;
                            docNode.children.forEach((node) => {
                                this.updateNumber(node, `${num}`, 'old');
                                this.updateNumber(node, `${num}`, 'new');
                                num++;
                            });
                            this.tree = [docNode];
                        },
                        (reason) => {
                            this.growl.error('Error Getting Child Views: ' + reason.message);
                        }
                    );
            },
            (reason) => {
                this.growl.error('Error Getting Child Views: ' + reason.message);
            }
        );

        this.subs.push(
            this.eventSvc.$on('foobar', () => {
                const root = this.tree;
                console.log(root);
            })
        );
        this.treeOptions = {
            dropped: (e): void => {
                void this.$timeout(() => {
                    for (let i = 0; i < this.tree.length; i++) {
                        const root = this.tree[i];
                        root.new = '';
                        let num = 1;
                        for (let j = 0; j < root.children.length; j++) {
                            this.updateNumber(root.children[j], `${num}`, 'new');
                            num++;
                        }
                    }
                }, 1);
            },
            // dragStop: (e) => {
            //     for (let i = 0; i < this.tree.length; i++) {
            //         var root = this.tree[i];
            //         root.new = '';
            //         var num = 1;
            //         for (var j = 0; j < root.children.length; j++) {
            //             this.updateNumber(root.children[j], num + '', 'new');
            //             num++;
            //         }
            //     }
            // },
            dragStart: (): void => {
                //Do Nothing
            },
            accept: (sourceNodeScope: VeTreeNodeScope, destNodeScope: VeTreeNodeScope, destIndex): boolean => {
                if (destNodeScope.$element.hasClass('root')) return false; //don't allow moving to outside doc
                return destNodeScope.node.aggr != 'none';
            },
        };
    }

    public updateNumber = (node: TreeBranch, curSection: string, key: string): void => {
        node[key] = curSection;
        let num = 1;
        for (let i = 0; i < node.children.length; i++) {
            this.updateNumber(node.children[i], `${curSection}.${num}`, key);
            num++;
        }
    };

    public handleSingleView = (v: ViewObject, aggr: string, propId: string): TreeBranch => {
        let curNode: TreeBranch = this.viewIds2node[v.id];
        if (!curNode) {
            curNode = {
                label: v.name ? v.name : v.id,
                data: v,
                aggr: aggr,
                propertyId: propId,
                type: v.type,
                children: [],
            };
            this.viewIds2node[v.id] = curNode;
        }
        this.origViews[v.id] = v;
        return curNode;
    };

    public handleChildren = (curNode: TreeBranch, childNodes: TreeBranch[]): void => {
        const newChildNodes: TreeBranch[] = [];
        for (let i = 0; i < childNodes.length; i++) {
            const node: TreeBranch = childNodes[i];
            if (this.seenViewIds[node.data.id]) {
                return;
            }
            this.seenViewIds[node.data.id] = node;
            newChildNodes.push(node);
        }
        curNode.children.push(...newChildNodes);
    };

    public save = (): void => {
        if (this.saving) {
            this.growl.info('please wait');
            return;
        }
        if (this.tree.length > 1 || this.tree[0].data.id !== this.doc.id) {
            this.growl.error('Views cannot be re-ordered outside the context of the current document.');
            return;
        }
        this.saving = true;
        this.saveClass = 'fa fa-spin fa-spinner';
        const toSave: ViewObject[] = [];
        for (const [id, node] of Object.entries(this.viewIds2node)) {
            if (node.aggr == 'none') {
                //cannot process views whose aggr is none since their children are not shown
                return;
            }
            const childViews: ViewObject[] = [];
            for (let i = 0; i < node.children.length; i++) {
                childViews.push({
                    id: node.children[i].data.id,
                    aggregation: node.children[i].aggr,
                    propertyId: node.children[i].propertyId,
                    _projectId: node.data._projectId,
                    _refId: node.data._refId,
                    type: node.data.type,
                });
            }
            const orig = this.origViews[id];
            if (
                ((!orig._childViews || orig._childViews.length === 0) && childViews.length > 0) ||
                (orig._childViews && !_.isEqual(orig._childViews, childViews))
            ) {
                toSave.push({
                    id: id,
                    name: orig.name,
                    _childViews: childViews,
                    _projectId: orig._projectId,
                    _refId: orig._refId,
                    type: orig.type,
                });
            }
        }

        if (toSave.length === 0) {
            this.growl.info('No changes to save!');
            this.saving = false;
            this.saveClass = '';
            return;
        }
        this.elementSvc
            .updateElements(toSave, true)
            .then(
                () => {
                    this.growl.success('Reorder Successful');
                    this.navigate(true);
                },
                (response) => {
                    const reason = response.data.failedRequests[0];
                    const errorMessage = reason.message;
                    if (reason.status === 409) {
                        this.growl.error("There's a conflict in the views you're trying to change!");
                    } else {
                        this.growl.error(errorMessage);
                    }
                }
            )
            .finally(() => {
                this.saveClass = '';
                this.saving = false;
            });
    };

    public cancel = (): void => {
        this.navigate(false);
    };

    public navigate = (reload: boolean): void => {
        const curBranch = this.treeSvc.getSelectedBranch();
        if (!curBranch) {
            void this.$state.go('main.project.ref.view.present', {}, { reload: true });
        } else {
            let goToId: string = curBranch.data.id;
            if (curBranch.type !== 'section' && curBranch.type !== 'view') {
                goToId = curBranch.viewId ? curBranch.viewId : '';
            }
            void this.$state.go('main.project.ref.view.present', { viewId: goToId }, { reload: reload });
        }
    };
}

const ReorderComponent: VeComponentOptions = {
    selector: 'reorderDocument',
    template: `
    <script type="text/ng-template" id="nodes_renderer.html">
    <div ui-tree-handle>
        {{node.old}} &rarr; {{node.new}} {{node.label}} ({{node.aggr}})
    </div>
    <ol ui-tree-nodes="" ng-model="node.children">
        <li ng-repeat="node in node.children" ui-tree-node ng-include="'nodes_renderer.html'">
        </li>
    </ol>
</script>

<div class="container-tree-reorder container-fluid">
    <button class="btn-tree-reorder-save btn btn-primary" ng-click="$ctrl.save()">Save <i class="{{$ctrl.saveClass}}"></i></button>
    <button class="btn-tree-reorder-save btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
    <br>
    <!--<p>Note: you cannot reorder views under a view that's labeled (none) - these views may have children but are not shown and is not part of this document</p>-->
    <p>To reorder text, tables, images, equations, and sections, use the <i class="fa fa-arrows-v"></i> in the right pane.</p>
    <div class="well" ui-tree="$ctrl.treeOptions">
        <ol ui-tree-nodes="" class="root" ng-model="$ctrl.tree">
            <li ng-repeat="node in $ctrl.tree" ui-tree-node ng-include="'nodes_renderer.html'"></li>
        </ol>
    </div>
</div>
`,
    bindings: {
        mmsDocument: '<',
    },
    controller: ReorderController,
};

veApp.component(ReorderComponent.selector, ReorderComponent);
