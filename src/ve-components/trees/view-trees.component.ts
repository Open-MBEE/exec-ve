import angular, { IComponentController } from 'angular'
import _ from 'lodash'
import Rx from 'rx-lite'

import { veAppEvents } from '@ve-app/events'
import { ConfirmDeleteModalResolveFn } from '@ve-app/main/modals/confirm-delete-modal.component'
import { InsertViewData } from '@ve-components/insertions/components/insert-view.component'
import { ExtensionService } from '@ve-components/services'
import { TreeService } from '@ve-components/trees/services/Tree.service'
import { trees_default_buttons } from '@ve-components/trees/trees-buttons.config'
import {
    ButtonBarApi,
    ButtonBarService,
    ButtonWrapEvent,
} from '@ve-core/button-bar'
import { veCoreEvents } from '@ve-core/events'
import { IToolBarButton, ToolbarService } from '@ve-core/toolbar'
import { RootScopeService } from '@ve-utils/application'
import { EventService } from '@ve-utils/core'
import {
    ApiService,
    PermissionsService,
    ViewService,
} from '@ve-utils/mms-api-client'

import { veComponents } from '@ve-components'

import {
    VeComponentOptions,
    VePromise,
    VePromiseReason,
    VeQService,
} from '@ve-types/angular'
import { InsertResolveFn } from '@ve-types/components'
import { ElementObject, RefsResponse, ViewObject } from '@ve-types/mms'
import { TreeBranch } from '@ve-types/tree'
import { VeModalService, VeModalSettings } from '@ve-types/view-editor'

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

class ViewTreesController implements IComponentController {
    //Bindings
    treesCategory: string
    toolbarId: string = 'toolbar'
    buttonId: string

    //Local
    documentId: string
    viewId: string
    projectId: string
    refId: string
    commitId: string

    bars: string[]
    subs: Rx.IDisposable[]
    private trees: string[]
    currentTree: string
    currentTitle: string
    show: {
        [key: string]: boolean
    } = {}

    protected errorType: string
    private headerSize: string
    private
    protected squishSize: number = 250

    private insertData: InsertViewData

    public filterInputPlaceholder: string
    public treeSearch: string
    private spin: boolean = true

    protected $globalTree: JQuery
    protected $presentTree: JQuery
    protected $portalTree: JQuery

    bbApi: ButtonBarApi

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
    ]

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
        this.eventSvc.$init(this)

        this.buttonId = this.buttonId ? this.buttonId : 'tree-button-bar'
        this.toolbarId = this.toolbarId ? this.toolbarId : 'toolbar'

        this.headerSize = '93px'

        // Initialize button-bar event listeners
        this.subs.push(
            this.eventSvc.$on<veCoreEvents.buttonClicked>(
                this.buttonId,
                (data) => {
                    if (!this.bbApi) {
                        switch (data.clicked) {
                            case 'tree-expand': {
                                this.treeSvc.expandAll().then(
                                    () => {
                                        this.eventSvc.$broadcast(
                                            TreeService.events.RELOAD
                                        )
                                    },
                                    (reason) => {
                                        this.growl.error(
                                            TreeService.treeError(reason)
                                        )
                                    }
                                )
                                break
                            }
                            case 'tree-collapse': {
                                this.treeSvc.collapseAll().then(
                                    () => {
                                        this.eventSvc.$broadcast(
                                            TreeService.events.RELOAD
                                        )
                                    },
                                    (reason) => {
                                        this.growl.error(
                                            TreeService.treeError(reason)
                                        )
                                    }
                                )
                                break
                            }
                            case 'tree-add-document': {
                                this.insert('Document').then(
                                    () => {
                                        //Do Nothing
                                    },
                                    (reason) => {
                                        this.growl.error(reason.message)
                                    }
                                )
                                break
                            }
                            case 'tree-add-view': {
                                this.insert('View').catch((reason) => {
                                    this.growl.error(reason.message)
                                })
                                break
                            }
                            case 'tree-delete': {
                                this.deleteItem()
                                break
                            }

                            case 'tree-add-group': {
                                this.insert('Group').catch((reason) => {
                                    this.growl.error(reason.message)
                                })
                                break
                            }
                            case 'tree-show-pe': {
                                this.rootScopeSvc.treeShowPe(
                                    !this.rootScopeSvc.treeShowPe()
                                )
                                this.bbApi.setToggleState(
                                    'tree-show-pe',
                                    this.rootScopeSvc.treeShowPe()
                                )
                                this.eventSvc.$broadcast(
                                    TreeService.events.RELOAD
                                )
                                break
                            }
                        }
                    }
                    data.$event.stopPropagation()
                }
            )
        )

        this.subs.push(
            this.eventSvc.$on('tree.ready', () => {
                if (!this.bbApi) {
                    this.bbApi = this.buttonBarSvc.initApi(
                        this.buttonId,
                        this.bbInit,
                        this,
                        trees_default_buttons
                    )
                    this.subs.push(
                        this.eventSvc.$on(
                            this.bbApi.WRAP_EVENT,
                            (data: ButtonWrapEvent) => {
                                if (data.oldSize != data.newSize) {
                                    const title = $('.tree-view-title')
                                    const titleSize =
                                        title.outerHeight() +
                                        parseInt(title.css('marginTop')) +
                                        parseInt(title.css('marginBottom'))
                                    const treeOptions =
                                        $('.tree-options').outerHeight()
                                    const buttonSize =
                                        $('.tree-view-buttons').outerHeight()
                                    const calcSize = Math.round(
                                        titleSize + treeOptions + buttonSize
                                    )
                                    this.headerSize =
                                        calcSize.toString(10) + 'px'
                                    this.$scope.$apply()
                                }
                            }
                        )
                    )
                }
            })
        )
    }

    $postLink(): void {
        this.$presentTree = $('#present-trees')
        this.$portalTree = $('#portal-trees')
        this.$globalTree = $('#global-trees')

        //Initialize Toolbar Clicked Subject
        const newTree =
            this.treesCategory === 'portal'
                ? 'tree-of-documents'
                : 'tree-of-contents'
        const inspect: IToolBarButton =
            this.toolbarSvc.getToolbarButton(newTree)

        this.eventSvc.resolve<veCoreEvents.toolbarClicked>(this.toolbarId, {
            id: inspect.id,
            category: inspect.category,
            title: inspect.tooltip,
        })

        //Listen for Toolbar Clicked Subject
        this.subs.push(
            this.eventSvc.binding<veCoreEvents.toolbarClicked>(
                this.toolbarId,
                this.changeTree
            )
        )
    }

    bbInit = (api: ButtonBarApi): void => {
        api.buttons.length = 0
        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-expand'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-collapse'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-add'))
        api.setPermission(
            'tree-add',
            this.treeSvc.treeApi.refType !== 'Tag' && this.treeSvc.treeEditable
        )
        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-delete'))
        api.setPermission(
            'tree-delete',
            this.treeSvc.treeApi.refType !== 'Tag' && this.treeSvc.treeEditable
        )
        if (this.treesCategory === 'portal') {
            api.setActive('tree-add.group', true, 'tree-add')
            api.setPermission(
                'tree-add.group',
                this.permissionsSvc.hasProjectEditPermission(
                    this.treeSvc.treeApi.projectId
                )
            )
            api.setActive('tree-add.document', true, 'tree-add')
            api.setPermission(
                'tree-add.document',
                this.treeSvc.treeApi.refType !== 'Tag' &&
                    this.treeSvc.treeEditable
            )

            api.addButton(
                this.buttonBarSvc.getButtonBarButton('tree-reorder-group')
            )
            api.setPermission(
                'tree-reorder-group',
                this.permissionsSvc.hasProjectEditPermission(
                    this.treeSvc.treeApi.projectId
                )
            )
        } else if (this.treesCategory === 'present') {
            api.setActive('tree-add.view', true, 'tree-add')
            api.setPermission(
                'tree-add.view',
                this.treeSvc.treeApi.refType !== 'Tag' &&
                    this.treeSvc.treeEditable
            )

            api.addButton(
                this.buttonBarSvc.getButtonBarButton('tree-reorder-view')
            )
            api.addButton(
                this.buttonBarSvc.getButtonBarButton('tree-full-document')
            )
            api.addButton(this.buttonBarSvc.getButtonBarButton('tree-show-pe'))
            api.setPermission('tree-reorder-view', this.treeSvc.treeEditable)
            if (this.rootScopeSvc.veFullDocMode()) {
                api.setToggleState('tree-full-document', true)
            }
        }
        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-refresh'))
    }

    insert(itemType: string): VePromise<void, string> {
        const deferred = this.$q.defer<void>()
        this.insertData = {
            addType: 'item',
            type: itemType,
            newViewAggr: 'shared',
            parentBranch: null,
            seenViewIds: this.treeSvc.seenViewIds,
        }
        const branch = this.treeSvc.getSelectedBranch()
        if (itemType === 'Document') {
            this.addDocument(branch).then(
                (result) => {
                    this.insertModal(result)
                    deferred.resolve()
                },
                (reason: VePromiseReason<string>) => {
                    deferred.reject(reason)
                }
            )
        } else if (itemType === 'Group') {
            this.addGroup(branch).then(
                (result) => {
                    this.insertModal(result)
                    deferred.resolve()
                },
                (reason: VePromiseReason<string>) => {
                    deferred.reject(reason)
                }
            )
        } else if (itemType === 'View') {
            this.addView(branch).then(
                (result) => {
                    this.insertModal(result)
                    deferred.resolve()
                },
                (reason: VePromiseReason<string>) => {
                    deferred.reject(reason)
                }
            )
        } else {
            deferred.reject(
                'Add Item of Type ' + itemType + ' is not supported'
            )
        }
        return deferred.promise
    }

    insertModal = (branchType: string): void => {
        const settings: VeModalSettings<InsertResolveFn<InsertViewData>> = {
            component: 'insertElementModal',
            resolve: {
                getInsertData: () => {
                    return this.insertData
                },
                getProjectId: () => {
                    return this.treeSvc.treeApi.projectId
                },
                getRefId: () => {
                    return this.treeSvc.treeApi.refId
                },
                getOrgId: () => {
                    return this.treeSvc.treeApi.orgId
                },
            },
        }
        const instance = this.$uibModal.open<
            InsertResolveFn<InsertViewData>,
            ElementObject
        >(settings)
        instance.result.then(
            (result) => {
                if (!this.rootScopeSvc.veEditMode()) {
                    this.eventSvc.$broadcast('show-edits', true)
                }
                const newbranch: TreeBranch = {
                    label: result.name,
                    type: branchType,
                    data: result,
                    children: [],
                    aggr: '',
                }
                const top = this.insertData.type === 'Group'
                const addToFullDocView = (
                    node: TreeBranch,
                    curSection: string,
                    prevSysml: string
                ): string => {
                    let lastChild = prevSysml
                    if (node.children) {
                        let num = 1
                        for (let i = 0; i < node.children.length; i++) {
                            const cNode = node.children[i]
                            const data: veAppEvents.viewAddedData = {
                                vId: cNode.data.id,
                                curSec: `${curSection}.${num}`,
                                prevSibId: lastChild,
                            }
                            this.eventSvc.$broadcast('view.added', data)
                            lastChild = addToFullDocView(
                                cNode,
                                `${curSection}.${num}`,
                                cNode.data.id
                            )
                            num = num + 1
                        }
                    }
                    return lastChild
                }
                this.treeSvc
                    .addBranch(this.insertData.parentBranch, newbranch, top)
                    .then(
                        () => {
                            if (this.insertData.type === 'View') {
                                this.treeSvc.viewId2node[result.id] = newbranch
                                this.treeSvc.seenViewIds[result.id] = newbranch
                                newbranch.aggr = this.insertData.newViewAggr
                                const curNum =
                                    this.insertData.parentBranch.children[
                                        this.insertData.parentBranch.children
                                            .length - 1
                                    ].data._veNumber
                                this.treeSvc
                                    .getPrevBranch(newbranch, ['view'])
                                    .then(
                                        (prevBranch) => {
                                            this.viewSvc
                                                .handleChildViews(
                                                    result,
                                                    this.insertData.newViewAggr,
                                                    undefined,
                                                    this.treeSvc.treeApi
                                                        .projectId,
                                                    this.treeSvc.treeApi.refId,
                                                    this.treeSvc.viewId2node,
                                                    this.treeSvc
                                                        .handleSingleView,
                                                    this.treeSvc.handleChildren
                                                )
                                                .then(
                                                    (node) => {
                                                        // handle full doc mode
                                                        if (
                                                            this.rootScopeSvc.veFullDocMode()
                                                        ) {
                                                            addToFullDocView(
                                                                node as TreeBranch,
                                                                curNum,
                                                                newbranch.data
                                                                    .id
                                                            )
                                                        }
                                                        this.addViewSectionsRecursivelyForNode(
                                                            node as TreeBranch
                                                        )
                                                    },
                                                    (reason) => {
                                                        this.growl.error(
                                                            'Error processing new child views: ' +
                                                                reason.message
                                                        )
                                                    }
                                                )
                                            if (
                                                !this.rootScopeSvc.veFullDocMode()
                                            ) {
                                                this.eventSvc.$broadcast<veAppEvents.viewAddedData>(
                                                    'view.added',
                                                    {
                                                        vId: result.id,
                                                        curSec: curNum,
                                                        prevSibId:
                                                            prevBranch.data.id,
                                                    }
                                                )
                                            } else {
                                                this.eventSvc.$broadcast<veAppEvents.viewAddedData>(
                                                    'view.added',
                                                    {
                                                        vId: result.id,
                                                        curSec: curNum,
                                                        prevSibId:
                                                            prevBranch.data.id,
                                                    }
                                                )
                                            }
                                        },
                                        (reason) => {
                                            if (reason.status === 200) {
                                                this.eventSvc.$broadcast<veAppEvents.viewAddedData>(
                                                    'view.added',
                                                    {
                                                        vId: result.id,
                                                        curSec: curNum,
                                                        prevSibId:
                                                            this.insertData
                                                                .parentBranch
                                                                .data.id,
                                                    }
                                                )
                                            } else {
                                                this.growl.error(
                                                    'Error adding item to tree: ' +
                                                        reason.message
                                                )
                                            }
                                        }
                                    )
                                    .finally(() => {
                                        this.eventSvc.$broadcast(
                                            TreeService.events.RELOAD
                                        )
                                    })
                            } else {
                                this.eventSvc.$broadcast(
                                    TreeService.events.RELOAD
                                )
                            }
                        },
                        (reason) => {
                            this.growl.error(TreeService.treeError(reason))
                        }
                    )
            },
            () => {
                console.log('Uncaught Error')
            }
        )
    }

    addDocument(branch: TreeBranch): VePromise<string, string> {
        if (!branch) {
            this.insertData.parentBranch = null
            branch = null
        } else if (branch.type !== 'group') {
            return this.$q.reject({
                message: 'Select a group to add document under',
            })
        } else {
            this.insertData.parentBranch = branch
        }
        return this.$q.resolve('view')
    }

    addGroup(branch: TreeBranch): VePromise<string, string> {
        if (branch && branch.type === 'group') {
            this.insertData.parentBranch = branch
        } else if (branch && branch.type !== 'group') {
            return this.$q.reject({
                message: 'Select a group to add group under',
            })
        } else {
            this.insertData.parentBranch = null
            // Always create group at root level if the selected branch is not a group branch
            branch = null
        }
        return this.$q.resolve('group')
    }

    addView(branch: TreeBranch): VePromise<string, string> {
        if (!branch) {
            return this.$q.reject({
                message: 'Add View Error: Select parent view first',
            })
        } else if (branch.type === 'section') {
            return this.$q.reject({
                message: 'Add View Error: Cannot add a child view to a section',
            })
        } else if (branch.aggr === 'none') {
            return this.$q.reject({
                message:
                    'Add View Error: Cannot add a child view to a non-owned and non-shared view.',
            })
        }
        this.insertData.parentBranch = branch
        return this.$q.resolve('view')
    }

    deleteItem = (): void => {
        const branch = this.treeSvc.getSelectedBranch()
        if (!branch) {
            this.growl.warning('Select item to remove.')
            return
        }
        this.treeSvc.getPrevBranch(branch).then(
            (prevBranch) => {
                const type = this.viewSvc.getElementType(branch.data)
                if (this.treesCategory === 'present') {
                    if (type == 'Document') {
                        this.growl.warning(
                            'Cannot remove a document from this view. To remove this item, go to project home.'
                        )
                        return
                    }
                    if (
                        branch.type !== 'view' ||
                        !this.apiSvc.isView(branch.data)
                    ) {
                        this.growl.warning(
                            'Cannot remove non-view item. To remove this item, open it in the center pane.'
                        )
                        return
                    }
                } else {
                    if (
                        branch.type !== 'view' &&
                        !this.apiSvc.isDocument(branch.data) &&
                        (branch.type !== 'group' || branch.children.length > 0)
                    ) {
                        this.growl.warning(
                            'Cannot remove group with contents. Empty contents and try again.'
                        )
                        return
                    }
                }
                const instance = this.$uibModal.open<
                    ConfirmDeleteModalResolveFn,
                    void
                >({
                    component: 'confirmDeleteModal',
                    resolve: {
                        getType: () => {
                            let type = branch.type
                            if (this.apiSvc.isDocument(branch.data)) {
                                type = 'Document'
                            }
                            return type
                        },
                        getName: () => {
                            return branch.data.name
                        },
                        finalize: () => {
                            return (): VePromise<void, RefsResponse> => {
                                return new this.$q<void, RefsResponse>(
                                    (resolve, reject) => {
                                        if (branch.type === 'view') {
                                            this.treeSvc
                                                .getParent(branch)
                                                .then((parentBranch) => {
                                                    if (
                                                        this.treesCategory ===
                                                        'present'
                                                    ) {
                                                        this.viewSvc
                                                            .downgradeDocument(
                                                                branch.data
                                                            )
                                                            .then(
                                                                resolve,
                                                                reject
                                                            )
                                                    } else {
                                                        this.viewSvc
                                                            .removeViewFromParentView(
                                                                {
                                                                    projectId:
                                                                        parentBranch
                                                                            .data
                                                                            ._projectId,
                                                                    refId: parentBranch
                                                                        .data
                                                                        ._refId,
                                                                    parentViewId:
                                                                        parentBranch
                                                                            .data
                                                                            .id,
                                                                    viewId: branch
                                                                        .data
                                                                        .id,
                                                                }
                                                            )
                                                            .then(
                                                                resolve,
                                                                reject
                                                            )
                                                    }
                                                }, reject)
                                        } else if (branch.type === 'group') {
                                            this.viewSvc
                                                .removeGroup(branch.data)
                                                .then(resolve, reject)
                                        } else {
                                            resolve()
                                        }
                                    }
                                )
                            }
                        },
                    },
                })
                instance.result.then(
                    () => {
                        this.treeSvc.removeBranch(branch).then(
                            () => {
                                this.treeSvc.getParent(branch).then(
                                    (parentBranch) => {
                                        const data = {
                                            parentBranch,
                                            prevBranch,
                                            branch,
                                        }
                                        this.eventSvc.$broadcast<veAppEvents.viewDeletedData>(
                                            'view.deleted',
                                            data
                                        )
                                        if (
                                            this.treesCategory === 'present' &&
                                            branch.type === 'view'
                                        ) {
                                            this.treeSvc.processDeletedViewBranch(
                                                branch
                                            )
                                        }
                                        let selectBranch: TreeBranch = null
                                        if (prevBranch) {
                                            selectBranch = prevBranch
                                        } else if (parentBranch) {
                                            selectBranch = parentBranch
                                        }
                                        this.treeSvc
                                            .selectBranch(selectBranch)
                                            .then(
                                                () => {
                                                    this.eventSvc.$broadcast(
                                                        TreeService.events
                                                            .RELOAD
                                                    )
                                                },
                                                (reason) => {
                                                    this.growl.error(
                                                        TreeService.treeError(
                                                            reason
                                                        )
                                                    )
                                                }
                                            )
                                    },
                                    (reason) => {
                                        this.growl.error(
                                            TreeService.treeError(reason)
                                        )
                                    }
                                )
                            },

                            (reason) => {
                                this.growl.error(TreeService.treeError(reason))
                            }
                        )
                    },
                    (reason) => {
                        this.growl.error(reason.message)
                    }
                )
            },
            (reason) => {
                this.growl.error(reason.message)
            }
        )
    }

    addViewSections = (view: ViewObject): void => {
        const node = this.treeSvc.viewId2node[view.id]
        this.treeSvc.addSectionElements(view, node, node).catch((reason) => {
            this.growl.error('Error adding view sections:' + reason.message)
        })
    }

    addViewSectionsRecursivelyForNode = (node: TreeBranch): void => {
        this.addViewSections(node.data)
        for (let i = 0; i < node.children.length; i++) {
            if (node.children[i].type === 'view') {
                this.addViewSectionsRecursivelyForNode(node.children[i])
            }
        }
    }

    userClicksPane = (): void => {
        this.treeSvc.selectBranch().catch((reason) => {
            this.growl.error(TreeService.treeError(reason))
        })
    }

    searchInputChangeHandler = (): void => {
        if (this.treeSearch === '') {
            this.treeSvc.collapseAll().then(
                () => {
                    this.treeSvc.expandPathToSelectedBranch().then(
                        () => {
                            this.eventSvc.$broadcast(TreeService.events.RELOAD)
                        },
                        (reason) => {
                            this.growl.error(TreeService.treeError(reason))
                        }
                    )
                },
                (reason) => {
                    this.growl.error(TreeService.treeError(reason))
                }
            )
        } else {
            // expand all branches so that the filter works correctly
            this.treeSvc.expandAll().then(
                () => {
                    this.eventSvc.$broadcast(TreeService.events.RELOAD)
                },
                (reason) => {
                    this.growl.error(TreeService.treeError(reason))
                }
            )
        }
    }

    private changeTree = (data: {
        id: string
        category?: string
        title?: string
    }): void => {
        if (!this.currentTree) {
            this.currentTree = ''
        }
        if (this.currentTree !== data.id) {
            switch (this.treesCategory) {
                case 'present': {
                    this.filterInputPlaceholder = 'Filter document contents'
                    break
                }
                case 'portal': {
                    this.filterInputPlaceholder = 'Filter groups/docs'
                    break
                }
                default: {
                    this.filterInputPlaceholder = 'Filter tree data'
                }
            }
            if (this.currentTree !== '') {
                this.show[_.camelCase(this.currentTree)] = false
            }
            this.currentTree = data.id
            const inspect: IToolBarButton = this.toolbarSvc.getToolbarButton(
                data.id
            )

            if (!data.category) {
                data.category = inspect.category
            }

            this.currentTitle = data.title ? data.title : inspect.tooltip

            if (!this.show.hasOwnProperty(_.camelCase(data.id))) {
                this.startTree(data.id, data.category)
                this.show[_.camelCase(data.id)] = true
            } else {
                this.show[_.camelCase(data.id)] = true
            }
        }
    }

    private startTree = (id: string, category: string): void => {
        const tag = this.extensionSvc.getTagByType('treeOf', id)
        const treeId: string = _.camelCase(id)
        const newTree: JQuery = $(
            '<div id="' +
                treeId +
                '" ng-show="$ctrl.show.' +
                treeId +
                '"></div>'
        )
        if (tag === 'extensionError') {
            this.errorType = this.currentTree.replace('tree-of-', '')
            newTree.append(
                '<extension-error type="$ctrl.errorType" mms-element-id="$ctrl.mmsElementId" kind="Tree"></extension-error>'
            )
        } else {
            newTree.append(
                `<${tag} toolbar-id="${this.toolbarId}" button-id="${this.buttonId}"}></${tag}>`
            )
        }

        switch (category) {
            case 'document': {
                this.$presentTree.append(newTree)
                break
            }
            case 'portal': {
                this.$portalTree.append(newTree)
                break
            }
            default: {
                this.$globalTree.append(newTree)
            }
        }

        this.$compile(newTree)(this.$scope)
    }
}

const ViewTreesComponent: VeComponentOptions = {
    selector: 'viewTrees',
    template: `
<ng-pane pane-anchor="north" pane-size="{{ $ctrl.headerSize }}" pane-no-toggle="true" pane-no-scroll="true" pane-closed="false" parent-ctrl="$ctrl">
    <div class="tree-view">
        <div class="container-fluid">
            <h4 class="tree-view-title">{{$ctrl.currentTitle}}</h4>
        </div>
        <hr class="tree-title-divider">
        <i ng-hide="$ctrl.bbApi" class="fa fa-spinner fa-spin" style="margin: 5px 50%"></i>
        <div ng-show="$ctrl.bbApi" class="tree-view-buttons" role="toolbar">
            <button-bar button-api="$ctrl.bbApi"></button-bar>
        </div>
        <div class="tree-options">
            <button ng-show="$ctrl.$pane.targetSize < $ctrl.squishSize" uib-popover-template="'filterTemplate.html'" 
              popover-title="Filter Tree" popover-placement="right-bottom" popover-append-to-body="true" 
              popover-trigger="'outsideClick'" type="button" class="btn btn-tools btn-sm">
                <i class="fa-solid fa-filter fa-2x"></i>
            </button>
            <script type="text/ng-template" id="filterTemplate.html">
                  <input ng-show="$ctrl.$pane.targetSize < $ctrl.squishSize" class="ve-plain-input" ng-model-options="{debounce: 1000}"
                    ng-model="$ctrl.treeSearch" type="text" placeholder="{{$ctrl.filterInputPlaceholder}}"
                    ng-change="$ctrl.searchInputChangeHandler();" style="flex:2">
            </script>
            <input ng-hide="$ctrl.$pane.targetSize < $ctrl.squishSize" class="ve-plain-input" ng-model-options="{debounce: 1000}"
                ng-model="$ctrl.treeSearch" type="text" placeholder="{{$ctrl.filterInputPlaceholder}}"
                ng-change="$ctrl.searchInputChangeHandler();" style="flex:2">
        </div>
    </div>
</ng-pane>
<ng-pane pane-anchor="center" pane-no-toggle="true" pane-closed="false" parent-ctrl="$ctrl" >
    <div class="tree-view" style="display:table;">
        <div id="trees" class="container-fluid">
            <div id="present-trees" ng-show="$ctrl.treesCategory === 'present'"></div>
            <div id="portal-trees" ng-show="$ctrl.treesCategory === 'portal'"></div>
            <div id="global-trees"></div>
        </div>
        <div ng-click="$ctrl.userClicksPane()" style="height: 100%"></div>
    </div>
</ng-pane>
`,
    bindings: {
        treesCategory: '<',
        toolbarId: '@',
        buttonId: '@',
    },
    controller: ViewTreesController,
}

veComponents.component(ViewTreesComponent.selector, ViewTreesComponent)
