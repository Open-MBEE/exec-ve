import { IPane } from '@openmbee/pane-layout'
import { IPaneManagerService } from '@openmbee/pane-layout/lib/PaneManagerService'
import {
    StateService,
    Transition,
    TransitionService,
    UIRouterGlobals,
} from '@uirouter/angularjs'
import angular from 'angular'
import Rx from 'rx-lite'

import {
    AddElementData,
    AddElementResolveFn,
} from '@ve-app/main/modals/add-item-modal.component'
import { ConfirmDeleteModalResolveFn } from '@ve-app/main/modals/confirm-delete-modal.component'
import { AppUtilsService } from '@ve-app/main/services'
import {
    ButtonBarApi,
    ButtonBarService,
    ButtonWrapEvent,
} from '@ve-core/button-bar'
import { TreeApi, TreeService } from '@ve-core/tree'
import {
    ElementService,
    PermissionsService,
    ProjectService,
    ViewService,
} from '@ve-utils/mms-api-client'
import {
    EventService,
    RootScopeService,
    UtilsService,
} from '@ve-utils/services'
import { ValueSpec } from '@ve-utils/utils'

import { veApp } from '@ve-app'

import { VeComponentOptions, VePromise } from '@ve-types/angular'
import {
    DocumentObject,
    ElementObject,
    OrgObject,
    ProjectObject,
    RefObject,
    ValueObject,
    ViewObject,
} from '@ve-types/mms'
import { TreeBranch, TreeConfig, TreeOptions } from '@ve-types/tree'
import { VeModalService, VeModalSettings } from '@ve-types/view-editor'

class LeftPaneController implements angular.IComponentController {
    //Scope
    public subs: Rx.IDisposable[]

    private $pane: IPane
    private paneClosed: boolean

    public treeData: TreeBranch[]

    public bbApi: ButtonBarApi
    public bbSize: string
    public tbApi: ButtonBarApi
    public bars: string[]

    public treeOptions: TreeOptions
    public tableList
    public figureList
    public equationList
    public mainTree: TreeConfig
    public peTrees: TreeConfig[]

    private mainTreeApi: TreeApi
    private peTreeApis: { [treeId: string]: TreeApi } = {}

    public activeMenu: { [id: string]: boolean } = {}
    public viewId2node: { [key: string]: TreeBranch } = {}
    public seenViewIds: { [key: string]: TreeBranch } = {}
    public initialSelection

    //Bindings
    private mmsDocument: DocumentObject
    private mmsOrg: OrgObject
    private mmsProject: ProjectObject
    private mmsRef: RefObject
    private mmsGroups: ElementObject[]
    private docMeta

    //Local Variables
    public docEditable
    public addElementData: AddElementData
    protected squishSize: number = 250
    public filterInputPlaceholder: string

    static $inject = [
        '$anchorScroll',
        '$q',
        '$filter',
        '$location',
        '$uibModal',
        '$scope',
        '$state',
        '$transitions',
        '$uiRouterGlobals',
        '$paneManager',
        '$timeout',
        'growl',
        'ElementService',
        'UtilsService',
        'ViewService',
        'ProjectService',
        'AppUtilsService',
        'TreeService',
        'PermissionsService',
        'RootScopeService',
        'EventService',
        'ButtonBarService',
    ]

    constructor(
        private $anchorScroll: angular.IAnchorScrollService,
        private $q: angular.IQService,
        private $filter: angular.IFilterService,
        private $location: angular.ILocationService,
        private $uibModal: VeModalService,
        private $scope,
        private $state: StateService,
        private $transitions: TransitionService,
        private $uiRouterGlobals: UIRouterGlobals,
        private $paneManager: IPaneManagerService,
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private utilsSvc: UtilsService,
        private viewSvc: ViewService,
        private projectSvc: ProjectService,
        private appUtilsSvc: AppUtilsService,
        private treeSvc: TreeService,
        private permissionsSvc: PermissionsService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService,
        private buttonBarSvc: ButtonBarService
    ) {
        this.tableList = []
        this.figureList = []
        this.equationList = []

        //TODO: Make main tree more configurable; Add Toolbar?
        this.mainTree = {
            id: 'contents',
            types: [],
        }
        this.peTrees = [
            {
                id: 'table',
                title: 'Table of Tables',
                icon: 'fa-table',
                types: ['table'],
            },
            {
                id: 'figure',
                title: 'Table of Figures',
                icon: 'fa-image',
                types: ['figure', 'image'],
            },
            {
                id: 'equation',
                title: 'Table of Equations',
                icon: 'fa-superscript',
                types: ['equation'],
            },
        ]
    }

    $onInit(): void {
        this.paneClosed = false

        this.eventSvc.$init(this)
        this.bbSize = '78px'

        if (
            this.$state.includes('main.project.ref.document.full') &&
            !this.rootScopeSvc.veFullDocMode()
        ) {
            this.rootScopeSvc.veFullDocMode(true)
        }

        this.docEditable =
            this.mmsDocument &&
            this.mmsRef &&
            this.mmsRef.type === 'Branch' &&
            this.utilsSvc.isView(this.mmsDocument) &&
            this.permissionsSvc.hasBranchEditPermission(this.mmsRef)

        if (this.rootScopeSvc.treeShowPe() === null) {
            this.rootScopeSvc.treeShowPe(false)
        }

        this.treeOptions = {
            typeIcons: this.treeSvc.getTreeTypes(),
            sectionNumbering: !!this.$state.includes(
                'main.project.ref.document'
            ),
            numberingDepth: 0,
            numberingSeparator: '.',
            expandLevel: this.$state.includes('main.project.ref.document')
                ? 3
                : this.$state.includes('main.project.ref')
                ? 0
                : 1,
            search: '',
            onSelect: this.treeClickCallback,
            onDblClick: this.treeDblClickCallback,
            sort: !this.$state.includes('main.project.ref.document'),
        }
        if (this.mmsDocument && this.docMeta) {
            this.treeOptions.numberingDepth = this.docMeta.numberingDepth
            this.treeOptions.numberingSeparator =
                this.docMeta.numberingSeparator
            this.treeOptions.startChapter = this.mmsDocument._startChapter
        }

        this.mainTreeApi = this.treeSvc.getApi(this.mainTree)

        if (this.mainTreeApi.treeData.length > 0)
            this.mainTreeApi.treeData.length = 0
        this.treeData = this.mainTreeApi.treeData

        this.mainTreeApi.treeOptions = this.treeOptions
        if (this.rootScopeSvc.treeInitialSelection()) {
            this.mainTreeApi.initialSelection =
                this.rootScopeSvc.treeInitialSelection()
        }

        for (let i = 0; i < this.peTrees.length; i++) {
            const api = this.treeSvc.getPeApi(this.peTrees[i])
            if (api.treeData.length > 0) api.treeData.length = 0
            api.treeOptions = this.treeOptions
        }

        this.peTreeApis = this.treeSvc.getAllPeApi()

        this.bbApi = this.buttonBarSvc.initApi(
            'tree-button-bar',
            this.bbInit,
            this
        )
        this.tbApi = this.buttonBarSvc.initApi(
            'tree-tool-bar',
            this.tbInit,
            this
        )

        this.subs.push(
            this.eventSvc.$on(
                this.bbApi.WRAP_EVENT,
                (data: ButtonWrapEvent) => {
                    if (data.oldSize != data.newSize) {
                        const calcSize = Math.round(data.newSize + 47.5)
                        this.bbSize = calcSize.toString(10) + 'px'
                        this.$scope.$apply()
                    }
                }
            )
        )

        this.$transitions.onSuccess({}, (trans: Transition) => {
            this.bbApi.resetButtons()
            this.tbApi.resetButtons()
        })

        if (this.treeData.length > 0) {
            this.treeData.length = 0
        }

        //Init Pane Toggle Controls
        this.rootScopeSvc.leftPaneClosed(this.$pane.closed)

        this.subs.push(
            this.$pane.$toggled.subscribe(() => {
                this.rootScopeSvc.leftPaneClosed(this.$pane.closed)
            })
        )

        this.subs.push(
            this.eventSvc.$on('left-pane.toggle', (paneClosed) => {
                if (paneClosed === undefined) {
                    this.$pane.toggle()
                } else if (paneClosed && !this.$pane.closed) {
                    this.$pane.toggle()
                } else if (!paneClosed && this.$pane.closed) {
                    this.$pane.toggle()
                }
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-branch-selected', (branch) => {
                this.mainTreeApi.selectBranch(branch, true)
                Object.values(this.peTreeApis).forEach((api) => {
                    api.selectBranch(branch, true)
                })
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-expand', () => {
                this.mainTreeApi.expandAll()
                Object.values(this.peTreeApis).forEach((api) => api.expandAll())
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-collapse', () => {
                this.mainTreeApi.collapseAll()
                Object.values(this.peTreeApis).forEach((api) =>
                    api.collapseAll()
                )
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-add-document', () => {
                this.addElement('Document')
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-delete-document', () => {
                this.deleteItem()
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-add-view', () => {
                this.addElement('View')
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-delete', () => {
                this.deleteItem()
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-delete-view', () => {
                this.deleteItem((deleteBranch) => {
                    this.eventSvc.$broadcast(
                        'mms-full-doc-view-deleted',
                        deleteBranch
                    )
                })
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-reorder-view', () => {
                this.rootScopeSvc.veFullDocMode(false)
                this.bbApi.setToggleState('tree-full-document', false)
                this.$state.go('main.project.ref.document.order', {
                    search: undefined,
                })
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-reorder-group', () => {
                this.$state.go('main.project.ref.groupReorder')
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-add-group', () => {
                this.addElement('Group')
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-show-pe', () => {
                this.rootScopeSvc.treeShowPe(!this.rootScopeSvc.treeShowPe())
                this.bbApi.setToggleState(
                    'tree-show-pe',
                    this.rootScopeSvc.treeShowPe()
                )
                this.setPeVisibility(this.viewId2node[this.mmsDocument.id])
                this.mainTreeApi.refresh()
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-show-tables', () => {
                this.toggle('table')
            })
        )
        this.subs.push(
            this.eventSvc.$on('tree-show-figures', () => {
                this.toggle('figure')
            })
        )
        this.subs.push(
            this.eventSvc.$on('tree-show-equations', () => {
                this.toggle('equation')
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-close-all', () => {
                this.closeAll()
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-full-document', () => {
                this.fullDocMode()
            })
        )

        this.subs.push(
            this.eventSvc.$on('tree-refresh', () => {
                this.reloadData()
            })
        )

        if (
            this.$state.includes('main.project.ref') &&
            !this.$state.includes('main.project.ref.document')
        ) {
            this.mainTree.types = ['group']
            if (this.mmsRef.type === 'Branch') {
                this.mainTree.types.push('view')
            } else {
                this.mainTree.types.push('snapshot')
            }
            this.treeData.push(
                ...this.treeSvc.buildTreeHierarchy(
                    this.mmsGroups,
                    'id',
                    'group',
                    '_parentId',
                    this,
                    this.groupLevel2Func
                )
            )
            this.viewSvc
                .getProjectDocuments(
                    {
                        projectId: this.mmsProject.id,
                        refId: this.mmsRef.id,
                    },
                    2
                )
                .then((documentObs) => {
                    for (let i = 0; i < documentObs.length; i++) {
                        if (
                            !documentObs[i]._groupId ||
                            documentObs[i]._groupId == this.mmsProject.id
                        ) {
                            this.treeData.push({
                                label: documentObs[i].name,
                                type: 'view',
                                data: documentObs[i],
                                children: [],
                            })
                        }
                    }
                    this.mainTreeApi.initialSelect().then(() => {
                        this.treeSvc.refreshPeTrees()
                    })
                })
        } else {
            this.mainTree.types = ['view', 'section']
            if (!this.mmsDocument._childViews) {
                this.mmsDocument._childViews = []
            }
            this.viewSvc
                .handleChildViews(
                    this.mmsDocument,
                    'composite',
                    undefined,
                    this.mmsProject.id,
                    this.mmsRef.id,
                    this.viewId2node,
                    this.handleSingleView,
                    this.handleChildren
                )
                .then(
                    (node) => {
                        const bulkGet: string[] = []
                        for (const i in this.viewId2node) {
                            const view: ViewObject = this.viewId2node[i].data
                            if (view._contents && view._contents.operand) {
                                for (
                                    let j = 0;
                                    j < view._contents.operand.length;
                                    j++
                                ) {
                                    bulkGet.push(
                                        view._contents.operand[j].instanceId
                                    )
                                }
                            }
                        }
                        this.elementSvc
                            .getElements(
                                {
                                    elementId: bulkGet,
                                    projectId: this.mmsProject.id,
                                    refId: this.mmsRef.id,
                                },
                                0
                            )
                            .finally(() => {
                                for (const i in this.viewId2node) {
                                    this.addSectionElements(
                                        this.viewId2node[i].data,
                                        this.viewId2node[i],
                                        this.viewId2node[i],
                                        true
                                    )
                                }
                                this.mainTreeApi.initialSelect().then(() => {
                                    this.treeSvc.refreshPeTrees()
                                })
                            })
                    },
                    (reason) => {
                        console.log(reason)
                    }
                )
            this.treeData.push(this.viewId2node[this.mmsDocument.id])
        }

        if (this.$state.includes('project.ref.document')) {
            this.filterInputPlaceholder = 'Filter table of contents'
        } else {
            this.filterInputPlaceholder = 'Filter groups/docs'
        }

        // Utils creates this event when deleting instances from the view
        this.subs.push(
            this.eventSvc.$on('viewctrl.delete.element', (elementData) => {
                const branch = this.mainTreeApi.getBranch(elementData)
                if (branch) {
                    this.mainTreeApi.removeSingleBranch(branch).then(() => {
                        this.treeSvc.refreshPeTree(branch.type)
                    })
                }
            })
        )

        this.subs.push(
            this.eventSvc.$on('spec-reorder-saved', (data) => {
                const node: TreeBranch = this.viewId2node[data.id]
                let viewNode: TreeBranch = node
                const newChildren: TreeBranch[] = []
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i]
                    if (child.type === 'view') {
                        newChildren.push(child)
                    }
                }
                node.children = newChildren
                if (node.type === 'section') {
                    viewNode = this.viewId2node[node.data.id]
                    if (!viewNode) {
                        viewNode = node
                    }
                }
                this.addSectionElements(node.data, viewNode, node)
            })
        )
    }

    $onChanges(changes) {
        if (changes.$pane) {
            if (
                changes.$pane.currentValue.closed !=
                this.rootScopeSvc.leftPaneClosed()
            ) {
                this.rootScopeSvc.leftPaneClosed(
                    changes.$pane.currentValue.closed
                )
            }
        }
    }

    $onDestroy(): void {
        this.buttonBarSvc.destroy(this.bars)
        this.eventSvc.destroy(this.subs)
    }

    tbInit = (api: ButtonBarApi) => {
        if (this.$state.includes('main.project.ref.document')) {
            api.addButton(
                this.buttonBarSvc.getButtonBarButton('tree-mode-dropdown')
            )
            //api.select(viewModeButton, this.rootScopeSvc.treeShowPe() ? this.buttonBarSvc.getButtonBarButton('tree-show-pe') : this.buttonBarSvc.getButtonBarButton('tree-show-views'));
        }
    }

    bbInit = (api: ButtonBarApi) => {
        api.buttons.length = 0
        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-expand'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-collapse'))
        if (
            this.$state.includes('main.project.ref') &&
            !this.$state.includes('main.project.ref.document')
        ) {
            api.addButton(
                this.buttonBarSvc.getButtonBarButton('tree-reorder-group')
            )
            api.setPermission(
                'tree-reorder-group',
                this.mmsProject &&
                    this.permissionsSvc.hasProjectEditPermission(
                        this.mmsProject
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
                    this.permissionsSvc.hasBranchEditPermission(this.mmsRef)
            )
            api.setPermission(
                'tree-delete-document',
                this.mmsRef.type !== 'Tag' &&
                    this.permissionsSvc.hasBranchEditPermission(this.mmsRef)
            )
        } else if (this.$state.includes('main.project.ref.document')) {
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
            api.setPermission('tree-add-view', this.docEditable)
            api.setPermission('tree-reorder-view', this.docEditable)
            api.setPermission('tree-delete-view', this.docEditable)
            if (this.rootScopeSvc.veFullDocMode()) {
                api.setToggleState('tree-full-document', true)
            }
        }
        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-refresh'))
    }

    toggle = (id: string) => {
        if (typeof this.activeMenu[id] === 'undefined')
            this.activeMenu[id] = false
        this.activeMenu[id] = !this.activeMenu[id]
        if (this.tbApi instanceof ButtonBarApi) {
            if (Object.keys(this.activeMenu).some((k) => this.activeMenu[k])) {
                this.tbApi.setActive(
                    'tree-close-all',
                    true,
                    'tree-mode-dropdown'
                )
            } else {
                this.tbApi.setActive(
                    'tree-close-all',
                    false,
                    'tree-mode-dropdown'
                )
            }
        }
    }

    closeAll = () => {
        Object.keys(this.activeMenu).forEach((k) => {
            this.activeMenu[k] = false
        })
        this.tbApi.deselectAll('tree-mode-dropdown')
        this.tbApi.setActive('tree-close-all', false, 'tree-mode-dropdown')
    }

    groupLevel2Func = (
        ctrl: {
            mmsProject: ProjectObject
            mmsRef: RefObject
            treeApi: TreeApi
            viewSvc: ViewService
        },
        groupOb: ElementObject,
        groupNode: TreeBranch
    ) => {
        groupNode.loading = true
        ctrl.viewSvc
            .getProjectDocuments(
                {
                    projectId: ctrl.mmsProject.id,
                    refId: ctrl.mmsRef.id,
                },
                2
            )
            .then((documentObs: ViewObject[]) => {
                const docs: ViewObject[] = []
                let docOb: ViewObject, i
                for (let i = 0; i < documentObs.length; i++) {
                    docOb = documentObs[i]
                    if (docOb._groupId === groupOb.id) {
                        docs.push(docOb)
                    }
                }
                for (let i = 0; i < docs.length; i++) {
                    docOb = docs[i]
                    groupNode.children.unshift({
                        label: docOb.name,
                        type:
                            ctrl.mmsRef.type === 'Branch' ? 'view' : 'snapshot',
                        data: docOb,
                        group: groupOb,
                        children: [],
                    })
                }
                groupNode.loading = false
                this.mainTreeApi.initialSelect().then(() => {
                    this.treeSvc.refreshPeTrees()
                })
            })
    }

    handleSingleView = (v, aggr) => {
        let curNode = this.viewId2node[v.id]
        if (!curNode) {
            curNode = {
                label: v.name,
                type: 'view',
                data: v,
                children: [],
                loading: true,
                aggr: aggr,
            }
            this.viewId2node[v.id] = curNode
        }
        return curNode
    }

    public handleChildren = (curNode: TreeBranch, childNodes: TreeBranch[]) => {
        const newChildNodes: TreeBranch[] = []
        let node: TreeBranch
        for (let i = 0; i < childNodes.length; i++) {
            node = childNodes[i]
            if (this.seenViewIds[node.data.id]) {
                this.growl.error(
                    'Warning: View ' +
                        node.data.name +
                        ' have multiple parents! Duplicates not shown.'
                )
                continue
            }
            this.seenViewIds[node.data.id] = node
            newChildNodes.push(node)
        }
        curNode.children.push.apply(curNode.children, newChildNodes)
        curNode.loading = false
        this.mainTreeApi.refresh().then(() => {
            this.treeSvc.refreshPeTrees()
        })
    }

    processDeletedViewBranch(branch) {
        const id = branch.data.id
        if (this.seenViewIds[id]) {
            delete this.seenViewIds[id]
        }
        if (this.viewId2node[id]) {
            delete this.viewId2node[id]
        }
        for (let i = 0; i < branch.children.length; i++) {
            this.processDeletedViewBranch(branch.children[i])
        }
    }

    addSectionElements(
        element: ElementObject,
        viewNode: TreeBranch,
        parentNode: TreeBranch,
        initial?: boolean
    ) {
        let contents: ValueSpec | null = null

        const addContentsSectionTreeNode = (operand: ValueObject[]) => {
            const bulkGet: string[] = []
            const i = 0
            for (let i = 0; i < operand.length; i++) {
                bulkGet.push(operand[i].instanceId)
            }
            this.elementSvc
                .getElements(
                    {
                        elementId: bulkGet,
                        projectId: this.mmsProject.id,
                        refId: this.mmsRef.id,
                    },
                    0
                )
                .then(
                    (ignore) => {
                        const instances: VePromise<ElementObject>[] = []
                        for (let i = 0; i < operand.length; i++) {
                            instances.push(
                                this.elementSvc.getElement(
                                    {
                                        projectId: this.mmsProject.id,
                                        refId: this.mmsRef.id,
                                        elementId: operand[i].instanceId,
                                    },
                                    0
                                )
                            )
                        }
                        this.$q.all(instances).then(
                            (results) => {
                                let k = results.length - 1
                                for (; k >= 0; k--) {
                                    const instance: ElementObject = results[k]
                                    const hide = !this.rootScopeSvc.treeShowPe()
                                    if (this.viewSvc.isSection(instance)) {
                                        const sectionTreeNode = {
                                            label: instance.name
                                                ? instance.name
                                                : viewNode.data.id,
                                            type: 'section',
                                            viewId: viewNode.data.id,
                                            data: instance,
                                            children: [],
                                        }
                                        this.viewId2node[instance.id] =
                                            sectionTreeNode
                                        parentNode.children.unshift(
                                            sectionTreeNode
                                        )
                                        this.addSectionElements(
                                            instance,
                                            viewNode,
                                            sectionTreeNode,
                                            initial
                                        )
                                    } else if (
                                        this.viewSvc.getTreeType(instance) !==
                                        'none'
                                    ) {
                                        const otherTreeNode = {
                                            label: instance.name,
                                            type: this.viewSvc.getTreeType(
                                                instance
                                            ),
                                            viewId: viewNode.data.id,
                                            data: instance,
                                            hide: hide,
                                            children: [],
                                        }
                                        parentNode.children.unshift(
                                            otherTreeNode
                                        )
                                    }
                                }
                                let promise: Promise<boolean>
                                if (initial) {
                                    promise = this.mainTreeApi.initialSelect()
                                } else {
                                    promise = this.mainTreeApi.refresh()
                                }
                                promise.then(() => {
                                    this.treeSvc.refreshPeTrees()
                                })
                            },
                            (reason) => {
                                //view is bad
                            }
                        )
                    },
                    (reason) => {}
                )
        }

        if (element._contents) {
            contents = element._contents
        } else if (this.viewSvc.isSection(element) && element.specification) {
            contents = element.specification // For Sections, the contents expression is the specification
        } else {
            //bad?
        }
        if (contents && contents.operand) {
            addContentsSectionTreeNode(contents.operand)
        }
    }

    treeClickCallback = (branch: TreeBranch) => {
        if (
            this.$state.includes('main.project.ref') &&
            !this.$state.includes('main.project.ref.document')
        ) {
            if (branch.type === 'group') {
                this.$state.go('main.project.ref.preview', {
                    documentId: 'site_' + branch.data.id + '_cover',
                    search: undefined,
                })
            } else if (branch.type === 'view' || branch.type === 'snapshot') {
                this.$state.go('main.project.ref.preview', {
                    documentId: branch.data.id,
                    search: undefined,
                })
            }
        } else if (this.$state.includes('main.project.ref.document')) {
            const viewId =
                branch.type !== 'view' ? branch.viewId : branch.data.id
            // var sectionId = branch.type === 'section' ? branch.data.id : null;
            const hash = branch.data.id
            if (this.rootScopeSvc.veFullDocMode()) {
                this.eventSvc.$broadcast('mms-tree-click', branch)
            } else if (branch.type === 'view' || branch.type === 'section') {
                this.$state.go('main.project.ref.document.view', {
                    viewId: branch.data.id,
                    search: undefined,
                })
            } else {
                this.$state.go('main.project.ref.document.view', {
                    viewId: viewId,
                    search: undefined,
                })
                this.$timeout(
                    () => {
                        this.$location.hash(hash)
                        this.$anchorScroll()
                    },
                    1000,
                    false
                )
            }
        }
    }

    treeDblClickCallback = (branch) => {
        if (
            this.$state.includes('main.project.ref') &&
            !this.$state.includes('main.project.ref.document')
        ) {
            if (branch.type === 'view' || branch.type === 'snapshot') {
                this.$state.go('main.project.ref.document', {
                    documentId: branch.data.id,
                    search: undefined,
                })
            }
        } else if (this.$state.includes('main.project.ref.document')) {
            this.mainTreeApi.expandBranch(branch).then(() => {
                this.treeSvc.refreshPeTree(branch.type)
            })
        }
    }

    public fullDocMode = () => {
        if (this.rootScopeSvc.veFullDocMode()) {
            this.rootScopeSvc.veFullDocMode(false)
            this.bbApi.setToggleState('tree-full-document', false)
            const curBranch = this.mainTreeApi.getSelectedBranch()
            if (curBranch) {
                let viewId
                if (curBranch.type !== 'view') {
                    if (
                        curBranch.type === 'section' &&
                        curBranch.data.type === 'InstanceSpecification'
                    ) {
                        viewId = curBranch.data.id
                    } else {
                        viewId = curBranch.viewId
                    }
                } else {
                    viewId = curBranch.data.id
                }
                this.$state.go('main.project.ref.document.view', {
                    viewId: viewId,
                    search: undefined,
                })
            }
        } else {
            this.rootScopeSvc.veFullDocMode(true)
            this.bbApi.setToggleState('tree-full-document', true)
            this.$state.go('main.project.ref.document.full', {
                search: undefined,
            })
        }
    }

    reloadData() {
        this.bbApi.toggleButtonSpinner('tree-refresh')
        this.$state.reload().then(() => {
            this.mainTreeApi.refresh().then(() => {
                this.tbApi.toggleButtonSpinner('tree-refresh')
            })
        })
    }

    addElement(itemType: string) {
        const deferred = this.$q.defer()
        this.addElementData = {
            itemType: itemType,
            newViewAggr: { type: 'shared' },
            parentBranch: null,
            branchType: '',
        }
        const branch = this.mainTreeApi.getSelectedBranch()
        if (itemType === 'Document') {
            deferred.promise = this.addDocument(branch)
        } else if (itemType === 'Group') {
            deferred.promise = this.addGroup(branch)
        } else if (itemType === 'View') {
            deferred.promise = this.addView(branch)
        } else {
            deferred.reject(
                'Add Item of Type ' + itemType + ' is not supported'
            )
        }
        deferred.promise.then(
            () => {
                this.addElementModal()
            },
            (reason) => {
                this.growl.info(reason.message, { ttl: 2000 })
            }
        )
        return deferred.promise
    }

    addElementModal() {
        const settings: VeModalSettings = {
            component: 'addElementModal',
            resolve: <AddElementResolveFn>{
                getAddData: () => {
                    return this.addElementData
                },
                getFilter: () => {
                    return this.$filter
                },
                getProjectId: () => {
                    return this.mmsProject.id
                },
                getRefId: () => {
                    return this.mmsRef.id
                },
                getOrgId: () => {
                    return this.mmsOrg.id
                },
                getSeenViewIds: () => {
                    return this.seenViewIds
                },
            },
        }
        const instance = this.$uibModal.open(settings)
        instance.result.then((result) => {
            const data = result.$value
            if (!this.rootScopeSvc.veEditMode()) {
                this.$timeout(
                    () => {
                        $('.show-edits').click()
                    },
                    0,
                    false
                )
            }
            const newbranch: TreeBranch = {
                label: data.name,
                type: this.addElementData.branchType,
                data: data,
                children: [],
                aggr: '',
            }
            const top = this.addElementData.itemType === 'Group'
            const addToFullDocView = (node, curSection, prevSysml) => {
                let lastChild = prevSysml
                if (node.children) {
                    let num = 1
                    for (let i = 0; i < node.children.length; i++) {
                        const cNode = node.children[i]
                        const data = {
                            vId: cNode.data.id,
                            curSec: curSection + '.' + num,
                            prevSibId: lastChild,
                        }
                        this.eventSvc.$broadcast('mms-new-view-added', data)
                        lastChild = addToFullDocView(
                            cNode,
                            curSection + '.' + num,
                            cNode.data.id
                        )
                        num = num + 1
                    }
                }
                return lastChild
            }
            this.mainTreeApi
                .addBranch(this.addElementData.parentBranch, newbranch, top)
                .then(() => {
                    if (this.addElementData.itemType === 'View') {
                        this.viewId2node[data.id] = newbranch
                        this.seenViewIds[data.id] = newbranch
                        newbranch.aggr = this.addElementData.newViewAggr.type
                        const curNum =
                            this.addElementData.parentBranch.children[
                                this.addElementData.parentBranch.children
                                    .length - 1
                            ].data._veNumber
                        let prevBranch =
                            this.mainTreeApi.getPrevBranch(newbranch)
                        while (prevBranch.type !== 'view') {
                            prevBranch =
                                this.mainTreeApi.getPrevBranch(prevBranch)
                        }
                        this.viewSvc
                            .handleChildViews(
                                data,
                                this.addElementData.newViewAggr.type,
                                undefined,
                                this.mmsProject.id,
                                this.mmsRef.id,
                                this.viewId2node,
                                this.handleSingleView,
                                this.handleChildren
                            )
                            .then((node) => {
                                // handle full doc mode
                                if (this.rootScopeSvc.veFullDocMode()) {
                                    addToFullDocView(
                                        node,
                                        curNum,
                                        newbranch.data.id
                                    )
                                }
                                this.addViewSectionsRecursivelyForNode(node)
                            })
                        if (!this.rootScopeSvc.veFullDocMode()) {
                            this.$state.go('main.project.ref.document.view', {
                                viewId: data.id,
                                search: undefined,
                            })
                        } else {
                            if (prevBranch) {
                                this.eventSvc.$broadcast('mms-new-view-added', {
                                    vId: data.id,
                                    curSec: curNum,
                                    prevSibId: prevBranch.data.id,
                                })
                            } else {
                                this.eventSvc.$broadcast('mms-new-view-added', {
                                    vId: data.id,
                                    curSec: curNum,
                                    prevSibId:
                                        this.addElementData.parentBranch.data
                                            .id,
                                })
                            }
                        }
                    }
                })
        })
    }

    addDocument(branch: TreeBranch) {
        if (!branch) {
            this.addElementData.parentBranch = null
            branch = null
        } else if (branch.type !== 'group') {
            return this.$q.reject({
                message: 'Select a group to add document under',
            })
        } else {
            this.addElementData.parentBranch = branch
        }
        this.addElementData.branchType = 'view'
        return this.$q.resolve()
    }

    addGroup(branch: TreeBranch) {
        if (branch && branch.type === 'group') {
            this.addElementData.parentBranch = branch
        } else if (branch && branch.type !== 'group') {
            return this.$q.reject({
                message: 'Select a group to add group under',
            })
        } else {
            this.addElementData.parentBranch = null
            // Always create group at root level if the selected branch is not a group branch
            branch = null
        }
        this.addElementData.branchType = 'group'
        return this.$q.resolve()
    }

    addView(branch: TreeBranch) {
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
        this.addElementData.parentBranch = branch
        this.addElementData.branchType = 'view'
        return this.$q.resolve()
    }

    deleteItem(cb?) {
        const branch = this.mainTreeApi.getSelectedBranch()
        if (!branch) {
            this.growl.warning('Select item to remove.')
            return
        }
        const type = this.viewSvc.getElementType(branch.data)
        if (this.$state.includes('main.project.ref.document')) {
            if (type == 'Document') {
                this.growl.warning(
                    'Cannot remove a document from this view. To remove this item, go to project home.'
                )
                return
            }
            if (branch.type !== 'view' || !this.utilsSvc.isView(branch.data)) {
                this.growl.warning(
                    'Cannot remove non-view item. To remove this item, open it in the center pane.'
                )
                return
            }
        }

        // when in project.ref state, allow deletion for view/document/group
        if (
            this.$state.includes('main.project.ref') &&
            !this.$state.includes('main.project.ref.document')
        ) {
            if (
                branch.type !== 'view' &&
                !this.utilsSvc.isDocument(branch.data) &&
                (branch.type !== 'group' || branch.children.length > 0)
            ) {
                this.growl.warning(
                    'Cannot remove group with contents. Empty contents and try again.'
                )
                return
            }
        }
        const instance = this.$uibModal.open({
            component: 'confirmDeleteModal',
            resolve: <ConfirmDeleteModalResolveFn>{
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
                    return (): VePromise<boolean> => {
                        const deferred: angular.IDeferred<boolean> =
                            this.$q.defer()
                        const resolve = (): void => {
                            deferred.resolve(true)
                        }
                        const reject = (reason): void => {
                            deferred.reject(reason)
                        }
                        if (branch.type === 'view') {
                            const parentBranch =
                                this.mainTreeApi.getParent(branch)
                            if (
                                !this.$state.includes(
                                    'main.project.ref.document'
                                )
                            ) {
                                this.viewSvc
                                    .downgradeDocument(branch.data)
                                    .then(resolve, reject)
                            } else {
                                this.viewSvc
                                    .removeViewFromParentView({
                                        projectId: parentBranch.data._projectId,
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
                            deferred.resolve(false)
                        }
                        return deferred.promise
                    }
                },
            },
        })
        instance.result.then((data) => {
            this.mainTreeApi.removeBranch(branch).then(() => {
                if (
                    this.$state.includes('main.project.ref.document') &&
                    branch.type === 'view'
                ) {
                    this.processDeletedViewBranch(branch)
                }
                if (this.rootScopeSvc.veFullDocMode()) {
                    cb(branch)
                } else {
                    this.mainTreeApi.selectBranch()
                    this.$state.go('^', { search: undefined })
                }
            })
        })
    }

    addViewSections(view) {
        const node = this.viewId2node[view.id]
        this.addSectionElements(view, node, node)
    }

    addViewSectionsRecursivelyForNode(node) {
        this.addViewSections(node.data)
        for (let i = 0; i < node.children.length; i++) {
            if (node.children[i].type === 'view') {
                this.addViewSectionsRecursivelyForNode(node.children[i])
            }
        }
    }

    setPeVisibility(branch) {
        if (!this.mainTree.types.includes(branch.type)) {
            branch.hide = !this.rootScopeSvc.treeShowPe()
        }
        for (let i = 0; i < branch.children.length; i++) {
            this.setPeVisibility(branch.children[i])
        }
    }

    userClicksPane() {
        this.mainTreeApi.selectBranch()
    }

    searchInputChangeHandler() {
        if (this.treeOptions.search === '') {
            this.mainTreeApi.collapseAll().then(() => {
                this.mainTreeApi.expandPathToSelectedBranch()
            })
            Object.values(this.peTreeApis).forEach((api) => {
                api.collapseAll().then(() => {
                    api.expandPathToSelectedBranch()
                })
            })
        } else {
            // expand all branches so that the filter works correctly
            this.mainTreeApi.expandAll()
        }
    }
}

/* Controllers */
const LeftPaneComponent: VeComponentOptions = {
    selector: 'leftPane',
    transclude: true,
    template: `
  <ng-pane pane-anchor="north" pane-size="{{ $ctrl.bbSize }}" pane-no-toggle="true" pane-no-scroll="true" pane-closed="false" parent-ctrl="$ctrl">
    <div class="pane-left">
        <div class="pane-left-toolbar" role="toolbar">
            <button-bar button-api="$ctrl.bbApi"></button-bar>
        </div>
        <div class="tree-options">
            <button-bar button-api="$ctrl.tbApi"></button-bar>
            <button ng-show="$ctrl.$pane.targetSize < $ctrl.squishSize" uib-popover-template="'filterTemplate.html'" 
              popover-title="Filter Tree" popover-placement="right-bottom" popover-append-to-body="true" 
              popover-trigger="'outsideClick'" type="button" class="btn btn-tools btn-sm">
                <i class="fa-solid fa-filter fa-2x"></i>
            </button>
            <script type="text/ng-template" id="filterTemplate.html">
                  <input ng-show="$ctrl.$pane.targetSize < $ctrl.squishSize" class="ve-plain-input" ng-model-options="{debounce: 1000}"
                    ng-model="$ctrl.treeOptions.search" type="text" placeholder="{{$ctrl.filterInputPlaceholder}}"
                    ng-change="$ctrl.searchInputChangeHandler();" style="flex:2">
            </script>
            <input ng-hide="$ctrl.$pane.targetSize < $ctrl.squishSize" class="ve-plain-input" ng-model-options="{debounce: 1000}"
                ng-model="$ctrl.treeOptions.search" type="text" placeholder="{{$ctrl.filterInputPlaceholder}}"
                ng-change="$ctrl.searchInputChangeHandler();" style="flex:2">
        </div>
    </div>
</ng-pane>
<ng-pane pane-anchor="center" pane-no-toggle="true" pane-closed="false" parent-ctrl="$ctrl" >
    <div class="pane-left" style="display:table;">
        <tree tree-api="$ctrl.mainTreeApi" tree-options="$ctrl.treeOptions"></tree>
        <div data-ng-repeat="view in $ctrl.peTrees" ng-if="$ctrl.activeMenu[view.id]">
            <tree tree-api="$ctrl.peTreeApis[view.id]" tree-options="$ctrl.treeOptions"></tree>
        </div>
        <div ng-click="$ctrl.userClicksPane()" style="height: 100%"></div>
    </div>
</ng-pane>
`,
    bindings: {
        mmsDocument: '<',
        mmsOrg: '<',
        mmsProject: '<',
        mmsRef: '<',
        mmsGroups: '<',
        docMeta: '<',
    },
    require: {
        $pane: '^ngPane',
    },
    controller: LeftPaneController,
}

veApp.component(LeftPaneComponent.selector, LeftPaneComponent)
