import angular, { IComponentController } from 'angular'
import _ from 'lodash'
import Rx from 'rx-lite'

import { veAppEvents } from '@ve-app/events'
import { ConfirmDeleteModalResolveFn } from '@ve-app/main/modals/confirm-delete-modal.component'
import { InsertViewData } from '@ve-components/insertions/components/insert-view.component'
import { ExtensionService } from '@ve-components/services'
import { TreeService } from '@ve-components/trees/services/Tree.service'
import {
    ButtonBarApi,
    ButtonBarService,
    ButtonWrapEvent,
} from '@ve-core/button-bar'
import { veCoreEvents } from '@ve-core/events'
import { IToolBarButton, ToolbarApi, ToolbarService } from '@ve-core/toolbar'
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
import {
    ElementObject,
    ProjectObject,
    RefObject,
    RefsResponse,
    ViewObject,
} from '@ve-types/mms'
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
 * @param {Object=} specSvc An empty object that'll be populated with api methods
 * @param {Object=} mmsElement An element object, if this is provided, a read only
 *      element spec for it would be shown, this will not use mms services to get the element
 */

class ViewTreesController implements IComponentController {
    //Bindings
    mmsProject: ProjectObject
    mmsRef: RefObject
    treesCategory: string

    //Local
    documentId: string
    viewId: string
    projectId: string
    refId: string
    commitId: string

    bars: string[]
    subs: Rx.IDisposable[]
    private tbApi: ToolbarApi
    private trees: string[]
    currentTree: string
    currentTitle: string
    show: {
        [key: string]: boolean
    } = {}

    protected errorType: string
    private bbSize: string
    protected squishSize: number = 250

    private insertData: InsertViewData

    public filterInputPlaceholder: string
    public treeSearch: string

    protected $globalTree: JQuery
    protected $documentTree: JQuery
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
        'SpecService',
        'ReorderService',
        'ExtensionService',
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

        this.$documentTree = $('#document-trees')
        this.$portalTree = $('#portal-trees')
        this.$globalTree = $('#global-trees')

        this.trees = this.extensionSvc.getExtensions('tree')
        this.trees.forEach((tree: string) => {
            this.subs.push(this.eventSvc.$on(tree, this.changeTree))
        })

        this.bbApi = this.buttonBarSvc.initApi(
            'tree-button-bar',
            this.bbInit,
            this
        )

        this.bbSize = '83px'

        this.subs.push(
            this.eventSvc.$on(
                this.bbApi.WRAP_EVENT,
                (data: ButtonWrapEvent) => {
                    if (data.oldSize != data.newSize) {
                        const calcSize = Math.round(data.newSize + 47.5 + 5)
                        this.bbSize = calcSize.toString(10) + 'px'
                        this.$scope.$apply()
                    }
                }
            )
        )

        // Initialize button-bar
        this.subs.push(
            this.eventSvc.$on<veCoreEvents.buttonClicked>(
                'button-clicked-tree-button-bar',
                (data) => {
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
                            this.eventSvc.$broadcast(TreeService.events.RELOAD)
                            break
                        }
                    }
                    data.$event.stopPropagation()
                }
            )
        )
    }

    $postLink(): void {
        if (!this.currentTree) {
            const newTree =
                this.treesCategory === 'portal'
                    ? 'tree-documents'
                    : 'tree-views'
            const inspect: IToolBarButton =
                this.toolbarSvc.getToolbarButton(newTree)
            this.toolbarSvc
                .waitForApi('left-toolbar')
                .then(
                    (result) => {
                        this.tbApi = result
                    },
                    () => {
                        console.log(
                            'Unable to connect to toolbar, attempting to start tools anyway'
                        )
                    }
                )
                .finally(() => {
                    this.eventSvc.$broadcast(inspect.id, {
                        id: inspect.id,
                        category: inspect.category,
                        title: inspect.tooltip,
                    })
                })
        }
    }

    bbInit = (api: ButtonBarApi): void => {
        api.buttons.length = 0
        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-expand'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-collapse'))
        if (this.treesCategory === 'portal') {
            api.addButton(
                this.buttonBarSvc.getButtonBarButton('tree-reorder-group')
            )
            api.setPermission(
                'tree-reorder-group',
                this.mmsProject &&
                    this.permissionsSvc.hasProjectEditPermission(
                        this.mmsProject.id
                    )
            )
            api.addButton(
                this.buttonBarSvc.getButtonBarButton(
                    'tree-add-document-or-group'
                )
            )
            api.addButton(
                this.buttonBarSvc.getButtonBarButton('tree-delete-document')
            )
            api.setPermission(
                'tree-add-document-or-group',
                this.mmsRef.type !== 'Tag' &&
                    this.permissionsSvc.hasBranchEditPermission(
                        this.mmsProject.id,
                        this.mmsRef.id
                    )
            )
            api.setPermission(
                'tree-delete-document',
                this.mmsRef.type !== 'Tag' &&
                    this.permissionsSvc.hasBranchEditPermission(
                        this.mmsProject.id,
                        this.mmsRef.id
                    )
            )
        } else if (this.treesCategory === 'document') {
            api.addButton(
                this.buttonBarSvc.getButtonBarButton('tree-reorder-view')
            )
            api.addButton(
                this.buttonBarSvc.getButtonBarButton('tree-full-document')
            )
            api.addButton(this.buttonBarSvc.getButtonBarButton('tree-add-view'))
            api.addButton(
                this.buttonBarSvc.getButtonBarButton('tree-delete-view')
            )
            api.addButton(this.buttonBarSvc.getButtonBarButton('tree-show-pe'))
            api.setPermission('tree-add-view', this.treeSvc.treeEditable)
            api.setPermission('tree-reorder-view', this.treeSvc.treeEditable)
            api.setPermission('tree-delete-view', this.treeSvc.treeEditable)
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
                    return this.mmsProject.id
                },
                getRefId: () => {
                    return this.mmsRef.id
                },
                getOrgId: () => {
                    return this.mmsProject.orgId
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
                                let prevBranch =
                                    this.treeSvc.getPrevBranch(newbranch)
                                while (prevBranch.type !== 'view') {
                                    prevBranch =
                                        this.treeSvc.getPrevBranch(prevBranch)
                                }
                                this.viewSvc
                                    .handleChildViews(
                                        result,
                                        this.insertData.newViewAggr,
                                        undefined,
                                        this.mmsProject.id,
                                        this.mmsRef.id,
                                        this.treeSvc.viewId2node,
                                        this.treeSvc.handleSingleView,
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
                                                    newbranch.data.id
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
                                if (!this.rootScopeSvc.veFullDocMode()) {
                                    this.eventSvc.$broadcast<veAppEvents.viewAddedData>(
                                        'view.added',
                                        {
                                            vId: result.id,
                                            curSec: curNum,
                                            prevSibId: prevBranch.data.id,
                                        }
                                    )
                                } else {
                                    if (prevBranch) {
                                        this.eventSvc.$broadcast<veAppEvents.viewAddedData>(
                                            'view.added',
                                            {
                                                vId: result.id,
                                                curSec: curNum,
                                                prevSibId: prevBranch.data.id,
                                            }
                                        )
                                    } else {
                                        this.eventSvc.$broadcast<veAppEvents.viewAddedData>(
                                            'view.added',
                                            {
                                                vId: result.id,
                                                curSec: curNum,
                                                prevSibId:
                                                    this.insertData.parentBranch
                                                        .data.id,
                                            }
                                        )
                                    }
                                }
                            }
                            this.eventSvc.$broadcast(TreeService.events.RELOAD)
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
        const prevBranch = this.treeSvc.getPrevBranch(branch)
        const type = this.viewSvc.getElementType(branch.data)
        if (this.treesCategory === 'document') {
            if (type == 'Document') {
                this.growl.warning(
                    'Cannot remove a document from this view. To remove this item, go to project home.'
                )
                return
            }
            if (branch.type !== 'view' || !this.apiSvc.isView(branch.data)) {
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
        const instance = this.$uibModal.open<ConfirmDeleteModalResolveFn, void>(
            {
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
                            const deferred: angular.IDeferred<void> =
                                this.$q.defer()
                            const resolve = (): void => {
                                deferred.resolve()
                            }
                            const reject = (reason): void => {
                                deferred.reject(reason)
                            }
                            if (branch.type === 'view') {
                                const parentBranch =
                                    this.treeSvc.getParent(branch)
                                if (this.treesCategory === 'document') {
                                    this.viewSvc
                                        .downgradeDocument(branch.data)
                                        .then(resolve, reject)
                                } else {
                                    this.viewSvc
                                        .removeViewFromParentView({
                                            projectId:
                                                parentBranch.data._projectId,
                                            refId: parentBranch.data._refId,
                                            parentViewId: parentBranch.data.id,
                                            viewId: branch.data.id,
                                        })
                                        .then(resolve, reject)
                                }
                            } else if (branch.type === 'group') {
                                this.viewSvc
                                    .removeGroup(branch.data)
                                    .then(resolve, reject)
                            } else {
                                deferred.resolve()
                            }
                            return deferred.promise
                        }
                    },
                },
            }
        )
        instance.result.then(
            () => {
                this.treeSvc.removeBranch(branch).then(
                    () => {
                        const parentBranch = this.treeSvc.getParent(branch)
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
                            this.treesCategory === 'document' &&
                            branch.type === 'view'
                        ) {
                            this.treeSvc.processDeletedViewBranch(branch)
                        }
                        let selectBranch: TreeBranch = null
                        if (prevBranch) {
                            selectBranch = prevBranch
                        } else if (parentBranch) {
                            selectBranch = parentBranch
                        }
                        this.treeSvc.selectBranch(selectBranch).then(
                            () => {
                                this.eventSvc.$broadcast(
                                    TreeService.events.RELOAD
                                )
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
            },
            (reason) => {
                this.growl.error(reason.message)
            }
        )
    }

    addViewSections = (view: ViewObject): void => {
        const node = this.treeSvc.viewId2node[view.id]
        this.treeSvc.addSectionElements(view, node, node)
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

            if (this.currentTree !== data.id) {
                switch (this.treesCategory) {
                    case 'document': {
                        this.filterInputPlaceholder = 'Filter table of contents'
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
                this.eventSvc.$broadcast<veCoreEvents.setToggleData>(
                    this.toolbarSvc.constants.SELECT,
                    {
                        id: data.id,
                        tbId: this.tbApi.id,
                        value: null,
                    }
                )
                if (this.currentTree !== '') {
                    this.show[_.camelCase(this.currentTree)] = false
                }
                this.currentTree = data.id
                const inspect: IToolBarButton =
                    this.toolbarSvc.getToolbarButton(data.id)
                if (!data.title) {
                    data.title = inspect.tooltip
                }
                if (!data.category) {
                    data.category = inspect.category
                }
                if (!this.show.hasOwnProperty(_.camelCase(data.id))) {
                    this.startTree(data.id, data.category)
                    this.show[_.camelCase(data.id)] = true
                } else {
                    this.show[_.camelCase(data.id)] = true
                }
            }
        }
    }

    private startTree = (id: string, category: string): void => {
        const tag = this.extensionSvc.getTagByType('spec', id)
        const treeId: string = _.camelCase(id)
        const newTree: JQuery = $(
            '<div id="' +
                treeId +
                '" class="container-fluid" ng-show="$ctrl.show.' +
                treeId +
                '"></div>'
        )
        if (tag === 'extensionError') {
            this.errorType = this.currentTree.replace('tree-', '')
            newTree.append(
                '<extension-error type="$ctrl.errorType" mms-element-id="$ctrl.mmsElementId" kind="Tree"></extension-error>'
            )
        } else {
            newTree.append('<' + tag + '></' + tag + '>')
        }

        switch (category) {
            case 'document': {
                this.$documentTree.append(newTree)
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
    selector: 'treesPane',
    template: `
    <ng-pane pane-anchor="north" pane-size="{{ $ctrl.bbSize }}" pane-no-toggle="true" pane-no-scroll="true" pane-closed="false" parent-ctrl="$ctrl">
    <div class="pane-left">
        <div class="pane-left-buttons" role="toolbar">
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
    <div class="pane-left" style="display:table;">
        <i ng-show="$ctrl.treeContentLoading" class="fa fa-spin fa-spinner"></i>
        <div id="trees" ng-hide="$ctrl.treeContentLoading" class="container-fluid">>
            <div id="document-trees" ng-show="$ctrl.treesCategory === 'document'"></div>
            <div id="portal-trees" ng-show="$ctrl.treesCategory === 'portal'"></div>
            <div id="global-trees"></div>
        </div>
        <div ng-click="$ctrl.userClicksPane()" style="height: 100%"></div>
    </div>
</ng-pane>
`,
    bindings: {
        mmsProject: '<',
        mmsRef: '<',
        treesCategory: '@',
    },
    controller: ViewTreesController,
}

veComponents.component(ViewTreesComponent.selector, ViewTreesComponent)
