import angular, { IComponentController } from 'angular';
import _ from 'lodash';
import Rx from 'rx-lite';

import { veAppEvents } from '@ve-app/events';
import { InsertViewData } from '@ve-components/insertions/components/insert-view.component';
import { ExtensionService } from '@ve-components/services';
import { TreeService } from '@ve-components/trees/services/Tree.service';
import { ButtonBarApi, ButtonBarService } from '@ve-core/button-bar';
import { veCoreEvents } from '@ve-core/events';
import { IToolBarButton, ToolbarService } from '@ve-core/toolbar';
import { RootScopeService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { ApiService, PermissionsService, ViewService } from '@ve-utils/mms-api-client';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VePromise, VePromiseReason, VeQService } from '@ve-types/angular';
import { InsertResolveFn } from '@ve-types/components';
import { ElementObject, InstanceSpecObject, ViewObject } from '@ve-types/mms';
import { TreeBranch } from '@ve-types/tree';
import { VeModalService, VeModalSettings } from '@ve-types/view-editor';

/**
 * @ngdoc directive
 * @name veComponents.component:mmsSpec
 *
 * @requires veUtils/Utils
 * @required veUtils/URLService
 * @requires veUtils/AuthService
 * @requires veUtils/ElementService
 * @requires veUtils/ViewService
 * @requires veUtils/PermissionsService
 * @requires $compile
 * @requires $templateCache
 * @requires growl
 * @requires _
 *
 * * Outputs a "spec window" of the element whose id is specified. Spec includes name,
 * documentation, and value if the element is a property. Also last modified time,
 * last user, element id. Editability is determined by a param and also element
 * editability. Documentation and string values can have html and can transclude other
 * element properties. Conflict can occur during save based on last server read time
 * and offers choice of force save, discard edit or simple merge. To control saving
 * or editor pass in an api object that will be populated with methods (see methods seciton):
 *
 * ## Example spec with full edit (given permission)
 * ### controller (js)
 *  <pre>
 angular.module('app', ['veComponents'])
 .controller('SpecCtrl', ['$scope', function($scope) {
 $this.api = {}; //empty object to be populated by the spec api
 public edit = () => {
            $this.api.setEditing(true);
        };
 public save = () => {
            $this.api.save()
            .then((e) => {
                //success
            }, (reason) => {
                //failed
            });
        };
 }]);
 </pre>
 * ### template (html)
 *  <pre>
 <div ng-controller="SpecCtrl">
 <button ng-click="edit()">Edit</button>
 <button ng-click="save()">Save</button>
 <spec mms-eid="element_id" mms-edit-field="all" spec-api="api"></spec>
 </div>
 </pre>
 * ## Example for showing an element spec at a certain time
 *  <pre>
 <spec mms-eid="element_id" mms-version="2014-07-01T08:57:36.915-0700"></spec>
 </pre>
 * ## Example for showing a current element with nothing editable
 *  <pre>
 <spec mms-eid="element_id" mms-edit-field="none"></spec>
 </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {Object=} mmsElement An element object, if this is provided, a read only
 *      element spec for it would be shown, this will not use mms services to get the element
 */

class TreesController implements IComponentController {
    //Bindings
    toolbarId: string = 'toolbar';
    buttonId: string;

    //Local
    documentId: string;
    viewId: string;
    projectId: string;
    refId: string;
    commitId: string;

    subs: Rx.IDisposable[];

    currentTree: string;
    currentTitle: string;
    show: {
        [key: string]: { tree: boolean; pe: boolean };
    } = {};

    protected errorType: string;

    private insertData: InsertViewData;

    public filterInputPlaceholder: string;
    public treeSearch: string;
    private spin: boolean = true;

    protected $trees: JQuery;

    bbApi: ButtonBarApi;

    static $inject = [
        '$compile',
        '$scope',
        '$element',
        '$uibModal',
        '$q',
        '$timeout',
        'hotkeys',
        'growl',
        'ApiService',
        'ViewService',
        'PermissionsService',
        'RootScopeService',
        'EventService',
        'ToolbarService',
        'TreeService',
        'ExtensionService',
        'ButtonBarService',
    ];

    constructor(
        private $compile: angular.ICompileService,
        private $scope: angular.IScope,
        private $element: JQuery,
        private $uibModal: VeModalService,
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private hotkeys: angular.hotkeys.HotkeysProvider,
        private growl: angular.growl.IGrowlService,
        private apiSvc: ApiService,
        private viewSvc: ViewService,
        private permissionsSvc: PermissionsService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService,
        private toolbarSvc: ToolbarService,
        private treeSvc: TreeService,
        private extensionSvc: ExtensionService,
        protected buttonBarSvc: ButtonBarService
    ) {}

    $onInit(): void {
        this.eventSvc.$init(this);

        this.buttonId = this.buttonId ? this.buttonId : 'tree-button-bar';
        this.toolbarId = this.toolbarId ? this.toolbarId : 'toolbar';

        // Initialize button-bar event listeners
        this.subs.push(
            this.eventSvc.$on<veCoreEvents.buttonClicked>(this.buttonId, (data) => {
                if (!this.bbApi) {
                    switch (data.clicked) {
                        case 'tree-expand': {
                            this.treeSvc.expandAll().then(
                                () => {
                                    this.eventSvc.$broadcast(TreeService.events.RELOAD, this.currentTree);
                                },
                                (reason) => {
                                    this.growl.error(TreeService.treeError(reason));
                                }
                            );
                            break;
                        }
                        case 'tree-collapse': {
                            this.treeSvc.collapseAll().then(
                                () => {
                                    this.eventSvc.$broadcast(TreeService.events.RELOAD, this.currentTree);
                                },
                                (reason) => {
                                    this.growl.error(TreeService.treeError(reason));
                                }
                            );
                            break;
                        }
                        case 'tree-add-document': {
                            this.insert('Document').catch((reason) => {
                                this.growl.error(reason.message);
                            });
                            break;
                        }
                        case 'tree-add-view': {
                            this.insert('View').catch((reason) => {
                                this.growl.error(reason.message);
                            });
                            break;
                        }

                        case 'tree-add-group': {
                            this.insert('Group').catch((reason) => {
                                this.growl.error(reason.message);
                            });
                            break;
                        }
                        case 'tree-show-pe': {
                            this.show[_.camelCase(this.currentTree)].pe = !this.show[_.camelCase(this.currentTree)].pe;
                            break;
                        }
                    }
                }
                data.$event.stopPropagation();
            })
        );
    }

    $onDestroy(): void {
        this.eventSvc.$destroy(this.subs);
    }

    $postLink(): void {
        this.$trees = $('#trees');

        //Listen for Toolbar Clicked Subject
        this.subs.push(this.eventSvc.binding<veCoreEvents.toolbarClicked>(this.toolbarId, this.changeTree));
    }

    insert(itemType: string): VePromise<void, string> {
        const deferred = this.$q.defer<void>();
        this.insertData = {
            insertType: 'view',
            type: itemType,
            newViewAggr: 'shared',
            parentBranch: null,
            seenViewIds: this.treeSvc.seenViewIds,
        };
        const branch = this.treeSvc.getSelectedBranch();
        if (itemType === 'Document') {
            this.addDocument(branch).then(
                (result) => {
                    this.insertModal(result);
                    deferred.resolve();
                },
                (reason: VePromiseReason<string>) => {
                    deferred.reject(reason);
                }
            );
        } else if (itemType === 'Group') {
            this.addGroup(branch).then(
                (result) => {
                    this.insertModal(result);
                    deferred.resolve();
                },
                (reason: VePromiseReason<string>) => {
                    deferred.reject(reason);
                }
            );
        } else if (itemType === 'View') {
            this.addView(branch).then(
                (result) => {
                    this.insertModal(result);
                    deferred.resolve();
                },
                (reason: VePromiseReason<string>) => {
                    deferred.reject(reason);
                }
            );
        } else {
            deferred.reject('Add Item of Type ' + itemType + ' is not supported');
        }
        return deferred.promise;
    }

    insertModal = (branchType: string): void => {
        const settings: VeModalSettings<InsertResolveFn<InsertViewData>> = {
            component: 'insertElementModal',
            resolve: {
                getInsertData: () => {
                    return this.insertData;
                },
                getProjectId: () => {
                    return this.treeSvc.treeApi.projectId;
                },
                getRefId: () => {
                    return this.treeSvc.treeApi.refId;
                },
                getOrgId: () => {
                    return this.treeSvc.treeApi.orgId;
                },
            },
        };
        const instance = this.$uibModal.open<InsertResolveFn<InsertViewData>, ElementObject>(settings);
        instance.result.then(
            (result) => {
                if (!this.rootScopeSvc.veEditMode()) {
                    this.eventSvc.$broadcast('show-edits', true);
                }
                const newbranch: TreeBranch = {
                    label: result.name,
                    type: branchType,
                    data: result,
                    children: [],
                    aggr: '',
                };
                const top = this.insertData.type === 'Group';
                const addToFullDocView = (node: TreeBranch, curSection: string, prevSysml: string): string => {
                    let lastChild = prevSysml;
                    if (node.children) {
                        let num = 1;
                        for (let i = 0; i < node.children.length; i++) {
                            const cNode = node.children[i];
                            const data: veAppEvents.viewAddedData = {
                                vId: cNode.data.id,
                                curSec: `${curSection}.${num}`,
                                prevSibId: lastChild,
                            };
                            this.eventSvc.$broadcast('view.added', data);
                            lastChild = addToFullDocView(cNode, `${curSection}.${num}`, cNode.data.id);
                            num = num + 1;
                        }
                    }
                    return lastChild;
                };
                this.treeSvc.addBranch(this.insertData.parentBranch, newbranch, top).then(
                    () => {
                        if (this.insertData.type === 'View') {
                            this.treeSvc.viewId2node[result.id] = newbranch;
                            this.treeSvc.seenViewIds[result.id] = newbranch;
                            newbranch.aggr = this.insertData.newViewAggr;
                            const curNum =
                                this.insertData.parentBranch.children[this.insertData.parentBranch.children.length - 1]
                                    .data._veNumber;
                            this.treeSvc
                                .getPrevBranch(newbranch, ['view'])
                                .then(
                                    (prevBranch) => {
                                        this.viewSvc
                                            .handleChildViews(
                                                result,
                                                this.insertData.newViewAggr,
                                                undefined,
                                                this.treeSvc.treeApi.projectId,
                                                this.treeSvc.treeApi.refId,
                                                this.treeSvc.viewId2node,
                                                this.treeSvc.handleSingleView,
                                                this.treeSvc.handleChildren
                                            )
                                            .then(
                                                (node) => {
                                                    // handle full doc mode
                                                    if (this.rootScopeSvc.veFullDocMode()) {
                                                        addToFullDocView(node as TreeBranch, curNum, newbranch.data.id);
                                                    }
                                                    this.addViewSectionsRecursivelyForNode(node as TreeBranch);
                                                },
                                                (reason) => {
                                                    this.growl.error(
                                                        'Error processing new child views: ' + reason.message
                                                    );
                                                }
                                            );
                                        if (!this.rootScopeSvc.veFullDocMode()) {
                                            this.eventSvc.$broadcast<veAppEvents.viewAddedData>('view.added', {
                                                vId: result.id,
                                                curSec: curNum,
                                                prevSibId: prevBranch.data.id,
                                            });
                                        } else {
                                            this.eventSvc.$broadcast<veAppEvents.viewAddedData>('view.added', {
                                                vId: result.id,
                                                curSec: curNum,
                                                prevSibId: prevBranch.data.id,
                                            });
                                        }
                                    },
                                    (reason) => {
                                        if (reason.status === 200) {
                                            this.eventSvc.$broadcast<veAppEvents.viewAddedData>('view.added', {
                                                vId: result.id,
                                                curSec: curNum,
                                                prevSibId: this.insertData.parentBranch.data.id,
                                            });
                                        } else {
                                            this.growl.error('Error adding item to tree: ' + reason.message);
                                        }
                                    }
                                )
                                .finally(() => {
                                    this.eventSvc.$broadcast(TreeService.events.RELOAD, this.currentTree);
                                });
                        } else {
                            this.eventSvc.$broadcast(TreeService.events.RELOAD, this.currentTree);
                        }
                    },
                    (reason) => {
                        this.growl.error(TreeService.treeError(reason));
                    }
                );
            },
            (reason) => {
                if (reason && reason.status !== 444) {
                    this.growl.warning(`Error adding View: ${reason.message}`);
                } else {
                    this.growl.info('View Insert Cancelled', {
                        ttl: 1000,
                    });
                }
            }
        );
    };

    addDocument(branch: TreeBranch): VePromise<string, string> {
        if (!branch) {
            this.insertData.parentBranch = null;
            branch = null;
        } else if (branch.type !== 'group') {
            return this.$q.reject({
                message: 'Select a group to add document under',
            });
        } else {
            this.insertData.parentBranch = branch;
        }
        return this.$q.resolve('view');
    }

    addGroup(branch: TreeBranch): VePromise<string, string> {
        if (branch && branch.type === 'group') {
            this.insertData.parentBranch = branch;
        } else if (branch && branch.type !== 'group') {
            return this.$q.reject({
                message: 'Select a group to add group under',
            });
        } else {
            this.insertData.parentBranch = null;
            // Always create group at root level if the selected branch is not a group branch
            branch = null;
        }
        return this.$q.resolve('group');
    }

    addView(branch: TreeBranch): VePromise<string, string> {
        if (!branch) {
            return this.$q.reject({
                message: 'Add View Error: Select parent view first',
            });
        } else if (branch.type === 'section') {
            return this.$q.reject({
                message: 'Add View Error: Cannot add a child view to a section',
            });
        } else if (branch.aggr === 'none') {
            return this.$q.reject({
                message: 'Add View Error: Cannot add a child view to a non-owned and non-shared view.',
            });
        }
        this.insertData.parentBranch = branch;
        return this.$q.resolve('view');
    }

    addViewSections = (view: ViewObject): void => {
        const node = this.treeSvc.viewId2node[view.id];
        this.treeSvc.addSectionElements(view, node, node).catch((reason) => {
            this.growl.error('Error adding view sections:' + reason.message);
        });
    };

    addViewSectionsRecursivelyForNode = (node: TreeBranch): void => {
        this.addViewSections(node.data);
        for (let i = 0; i < node.children.length; i++) {
            if (node.children[i].type === 'view') {
                this.addViewSectionsRecursivelyForNode(node.children[i]);
            }
        }
    };

    userClicksPane = (): void => {
        this.treeSvc.selectBranch().catch((reason) => {
            this.growl.error(TreeService.treeError(reason));
        });
    };

    private changeTree = (data: { id: string; category?: string; title?: string }): void => {
        if (!this.currentTree) {
            this.currentTree = '';
        }
        if (this.currentTree !== data.id) {
            if (this.currentTree !== '') {
                this.show[_.camelCase(this.currentTree)].tree = false;
            }
            this.currentTree = data.id;
            const inspect: IToolBarButton = this.toolbarSvc.getToolbarButton(data.id);

            if (!data.category) {
                data.category = inspect.category;
            }

            this.currentTitle = data.title ? data.title : inspect.tooltip;

            if (!this.show.hasOwnProperty(_.camelCase(data.id))) {
                this.startTree(data.id);
                this.show[_.camelCase(data.id)] = { tree: true, pe: false };
            } else {
                this.eventSvc.$broadcast(TreeService.events.RELOAD, data.id);
                this.show[_.camelCase(data.id)].tree = true;
            }
        }
    };

    private startTree = (id: string): void => {
        const tag = this.extensionSvc.getTagByType('treeOf', id);
        const treeId: string = _.camelCase(id);
        const newTree: JQuery = $(`<div id="${treeId}" ng-show="$ctrl.show.${treeId}.tree"></div>`);
        if (tag === 'extensionError') {
            this.errorType = this.currentTree.replace('tree-of-', '');
            newTree.append(
                '<extension-error type="$ctrl.errorType" mms-element-id="$ctrl.mmsElementId" kind="Tree"></extension-error>'
            );
        } else {
            newTree.append(
                `<${tag} show-pe="$ctrl.show.${treeId}.pe" toolbar-id="${this.toolbarId}" button-id="${this.buttonId}"}></${tag}>`
            );
        }

        this.$trees.append(newTree);

        this.$compile(newTree)(this.$scope);
    };
}

const TreesComponent: VeComponentOptions = {
    selector: 'mmsTrees',
    template: `

<ng-pane pane-anchor="center" pane-no-toggle="true" pane-closed="false" parent-ctrl="$ctrl" >
    <div class="tree-view" style="display:table;">
        <!--
        <div class="container-fluid">
            <h4 class="tree-view-title">{{$ctrl.currentTitle}}</h4>
        </div>
        <hr class="tree-title-divider">
        -->
        <div id="trees" class="container-fluid">
        </div>
        <div ng-click="$ctrl.userClicksPane()" style="height: 100%"></div>
    </div>
</ng-pane>
`,
    bindings: {
        toolbarId: '@',
        buttonId: '@',
    },
    controller: TreesController,
};

veComponents.component(TreesComponent.selector, TreesComponent);
