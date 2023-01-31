import { IPane } from '@openmbee/pane-layout'
import { IPaneManagerService } from '@openmbee/pane-layout/lib/PaneManagerService'
import {
    StateService,
    Transition,
    TransitionService,
    UIRouterGlobals,
} from '@uirouter/angularjs'
import angular, { IComponentController } from 'angular'
import Rx from 'rx-lite'

import { veAppEvents } from '@ve-app/events'
import { ConfirmDeleteModalResolveFn } from '@ve-app/main/modals/confirm-delete-modal.component'
import { AppUtilsService } from '@ve-app/main/services'
import { AddViewData } from '@ve-components/add-elements/components/add-view.component'
import {
    ButtonBarApi,
    ButtonBarService,
    ButtonWrapEvent,
} from '@ve-core/button-bar'
import { veCoreEvents } from '@ve-core/events'
import { TreeApi, TreeService } from '@ve-core/tree'
import {
    ApiService,
    DocumentMetadata,
    ElementService,
    PermissionsService,
    ProjectService,
    ViewService,
} from '@ve-utils/mms-api-client'
import { EventService, RootScopeService } from '@ve-utils/services'
import { onChangesCallback } from '@ve-utils/utils'

import { veApp } from '@ve-app'

import {
    VeComponentOptions,
    VePromise,
    VePromiseReason,
    VeQService,
} from '@ve-types/angular'
import { AddElementResolveFn } from '@ve-types/components'
import {
    DocumentObject,
    ElementObject,
    ExpressionObject,
    GroupObject,
    InstanceValueObject,
    ParamsObject,
    ProjectObject,
    RefObject,
    RefsResponse,
    ValueObject,
    ViewInstanceSpec,
    ViewObject,
} from '@ve-types/mms'
import { TreeBranch, TreeConfig, TreeOptions, TreeRow } from '@ve-types/tree'
import { VeModalService, VeModalSettings } from '@ve-types/view-editor'

class LeftPaneController implements IComponentController {
    //Scope
    public subs: Rx.IDisposable[]

    private $pane: IPane
    private paneClosed: boolean

    public bbApi: ButtonBarApi
    public bbSize: string
    public tbApi: ButtonBarApi
    public bars: string[]

    public treeOptions: TreeOptions

    public mainTree: TreeConfig
    public peTrees: TreeConfig[]
    public treeData: TreeBranch[]
    public treeRows: TreeRow[]

    private treeApi: TreeApi

    public activeMenu: { [id: string]: boolean } = {}
    public viewId2node: { [key: string]: TreeBranch } = {}
    public seenViewIds: { [key: string]: TreeBranch } = {}

    //Bindings
    private mmsParams: ParamsObject
    private mmsDocument: DocumentObject
    private mmsDocuments: DocumentObject[]
    private mmsProject: ProjectObject
    private mmsRef: RefObject
    private mmsGroups: GroupObject[]
    private docMeta: DocumentMetadata

    //Binding Values
    //protected project: ProjectObject
    // protected ref: RefObject
    // protected document: DocumentObject
    // protected documents: DocumentObject[]
    // protected docMeta: DocumentMetadata
    // protected groups: GroupObject[]

    //Local Variables
    public docEditable: boolean
    public addElementData: AddViewData
    protected squishSize: number = 250
    public filterInputPlaceholder: string
    private processed: string = ''
    private treeContentLoading: boolean

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
        'ApiService',
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
        public $q: VeQService,
        private $filter: angular.IFilterService,
        private $location: angular.ILocationService,
        private $uibModal: VeModalService,
        private $scope: angular.IScope,
        private $state: StateService,
        private $transitions: TransitionService,
        private $uiRouterGlobals: UIRouterGlobals,
        private $paneManager: IPaneManagerService,
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private apiSvc: ApiService,
        private viewSvc: ViewService,
        private projectSvc: ProjectService,
        private appUtilsSvc: AppUtilsService,
        private treeSvc: TreeService,
        private permissionsSvc: PermissionsService,
        private rootScopeSvc: RootScopeService,
        public eventSvc: EventService,
        private buttonBarSvc: ButtonBarService
    ) {
        //TODO: Make main tree more configurable; Add Toolbar?
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
        this.treeContentLoading = true
        const defaultTreeOptions = {
            typeIcons: this.treeSvc.getTreeTypes(),
            sectionNumbering: this.$state.includes('main.project.ref.document'),
            numberingDepth: 2,
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
        this.eventSvc.$init(this)
        this.paneClosed = false
        this.treeData = this.treeSvc.getTreeData()
        if (!this.treeData) {
            this.treeSvc.setTreeData([])
            this.treeData = this.treeSvc.getTreeData()
        }
        this.treeRows = this.treeSvc.getTreeRows()
        if (!this.treeRows) {
            this.treeSvc.setTreeRows([])
            this.treeRows = this.treeSvc.getTreeRows()
        }
        this.treeOptions = defaultTreeOptions
        if (
            !this.treeSvc.checkRef('contents', this.mmsRef) ||
            this.$state.includes('main.project.ref.document')
        ) {
            this.treeData.length = 0
            this.treeRows.length = 0
            this.mainTree = {
                id: 'contents',
                types: [],
            }
            this.treeApi = this.treeSvc.initApi(
                this.mainTree,
                this.treeOptions,
                this.mmsRef
            )
        } else {
            this.treeApi = this.treeSvc.getApi('contents')
            this.mainTree = this.treeApi.treeConfig
        }

        this.bbSize = '83px'

        if (
            this.$state.includes('main.project.ref.document.full') &&
            !this.rootScopeSvc.veFullDocMode()
        ) {
            this.rootScopeSvc.veFullDocMode(true)
        }

        this.changeDocument()

        this.$transitions.onSuccess({}, (trans: Transition) => {
            this.bbApi.resetButtons()
            this.tbApi.resetButtons()
        })

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
            this.eventSvc.$on<veCoreEvents.buttonClicked>(
                'button-clicked-tree-button-bar',
                (data) => {
                    switch (data.clicked) {
                        case 'tree-expand': {
                            void this.treeApi.expandAll()
                            break
                        }
                        case 'tree-collapse': {
                            void this.treeApi.collapseAll()
                            break
                        }
                        case 'tree-add-document': {
                            this.addElement('Document').then(
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
                            this.addElement('View').catch((reason) => {
                                this.growl.error(reason.message)
                            })
                            break
                        }
                        case 'tree-delete': {
                            this.deleteItem()
                            break
                        }
                        case 'tree-reorder-view': {
                            this.rootScopeSvc.veFullDocMode(false)
                            this.bbApi.setToggleState(
                                'tree-full-document',
                                false
                            )
                            void this.$state.go(
                                'main.project.ref.document.order',
                                {
                                    search: undefined,
                                }
                            )
                            break
                        }
                        case 'tree-reorder-group': {
                            void this.$state.go('main.project.ref.groupReorder')
                            break
                        }
                        case 'tree-add-group': {
                            this.addElement('Group').catch((reason) => {
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
                            this.setPeVisibility(
                                this.viewId2node[this.mmsDocument.id]
                            )
                            this.treeApi.refresh().catch((reason) => {
                                this.growl.error(TreeService.treeError(reason))
                            })
                            break
                        }
                        case 'tree-full-document': {
                            this.fullDocMode()
                            break
                        }
                        case 'tree-refresh': {
                            this.reloadData()
                            break
                        }
                    }
                    data.$event.stopPropagation()
                }
            )
        )

        this.subs.push(
            this.eventSvc.$on<veCoreEvents.buttonClicked>(
                'button-clicked-tree-tool-bar',
                (data) => {
                    switch (data.clicked) {
                        case 'tree-show-tables': {
                            this.toggle('table')
                            break
                        }
                        case 'tree-show-figures': {
                            this.toggle('figure')
                            break
                        }
                        case 'tree-show-equations': {
                            this.toggle('equation')
                            break
                        }
                        case 'tree-close-all': {
                            this.closeAll()
                            break
                        }
                    }
                }
            )
        )

        // Utils creates this event when deleting instances from the view
        this.subs.push(
            this.eventSvc.$on<ElementObject>(
                'viewctrl.delete.element',
                (elementData) => {
                    const branch = this.treeApi.getBranch(elementData)
                    if (branch) {
                        this.treeApi
                            .removeSingleBranch(branch)
                            .catch((reason) => {
                                this.growl.error(TreeService.treeError(reason))
                            })
                    }
                }
            )
        )

        this.subs.push(
            this.eventSvc.$on<string>('spec-reorder-saved', (id) => {
                const node: TreeBranch = this.viewId2node[id]
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

    $onChanges(onChangesObj: angular.IOnChangesObject): void {
        if (onChangesObj.$pane) {
            if (
                (onChangesObj.$pane.currentValue as IPane).closed !=
                this.rootScopeSvc.leftPaneClosed()
            ) {
                this.rootScopeSvc.leftPaneClosed(
                    (onChangesObj.$pane.currentValue as IPane).closed
                )
            }
        }
    }

    $onDestroy(): void {
        this.buttonBarSvc.destroy(this.bars)
        this.eventSvc.destroy(this.subs)
    }

    changeDocument: onChangesCallback<void> = () => {
        if (this.$state.includes('main.project.ref.document')) {
            this.filterInputPlaceholder = 'Filter table of contents'
        } else {
            this.filterInputPlaceholder = 'Filter groups/docs'
        }

        if (!this.mmsDocument || this.processed === this.mmsDocument.id) return
        this.processed = this.mmsDocument.id

        this.docEditable =
            this.mmsDocument &&
            this.mmsRef &&
            this.mmsRef.type === 'Branch' &&
            this.apiSvc.isView(this.mmsDocument) &&
            this.permissionsSvc.hasBranchEditPermission(
                this.mmsProject.id,
                this.mmsRef.id
            )

        if (this.rootScopeSvc.treeShowPe() === null) {
            this.rootScopeSvc.treeShowPe(false)
        }

        if (this.mmsDocument && this.docMeta) {
            this.treeOptions.numberingDepth = this.docMeta.numberingDepth
            this.treeOptions.numberingSeparator =
                this.docMeta.numberingSeparator
            this.treeOptions.startChapter = this.mmsDocument._startChapter
        }

        this.bbApi = this.buttonBarSvc.initApi(
            'tree-button-bar',
            this.bbInit,
            this
        )

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

        this.tbApi = this.buttonBarSvc.initApi(
            'tree-tool-bar',
            this.tbInit,
            this
        )

        if (
            this.treeData.length > 0 &&
            this.$state.includes('main.project.ref') &&
            !this.$state.includes('main.project.ref.document')
        ) {
            if (this.$state.includes('main.project.ref.portal')) {
                this.treeApi.clearSelectedBranch()
            }
            this.treeApi
                .refresh()
                .catch((reason) => {
                    this.growl.error(TreeService.treeError(reason))
                })
                .finally(() => {
                    this.treeContentLoading = false
                })
        } else if (
            this.$state.includes('main.project.ref') &&
            !this.$state.includes('main.project.ref.document')
        ) {
            this.treeData.length = 0
            this.mainTree.types.length = 0
            this.mainTree.types = ['group']
            if (this.mmsRef.type === 'Branch') {
                this.mainTree.types.push('view')
            } else {
                this.mainTree.types.push('snapshot')
            }
            this.projectSvc.getGroups(this.mmsProject.id, this.mmsRef.id).then(
                (groups) => {
                    this.mmsGroups = groups
                    this.viewSvc
                        .getProjectDocuments({
                            projectId: this.mmsProject.id,
                            refId: this.mmsRef.id,
                        })
                        .then(
                            (documents) => {
                                this.mmsDocuments = documents
                                this.treeData.push(
                                    ...this.treeSvc.buildTreeHierarchy(
                                        this.mmsGroups,
                                        'id',
                                        'group',
                                        '_parentId',
                                        this.groupLevel2Func
                                    )
                                )
                                this.mmsDocuments.forEach((document) => {
                                    if (
                                        !document._groupId ||
                                        document._groupId == this.mmsProject.id
                                    ) {
                                        this.treeData.push({
                                            label: document.name,
                                            type: 'view',
                                            data: document,
                                            children: [],
                                        })
                                    }
                                })
                                this.treeApi
                                    .initialSelect()
                                    .catch((reason) => {
                                        this.growl.error(
                                            TreeService.treeError(reason)
                                        )
                                    })
                                    .finally(() => {
                                        this.treeContentLoading = false
                                    })
                            },
                            (reason) => {
                                this.growl.error(
                                    'Error getting Documents: ' + reason.message
                                )
                                this.treeContentLoading = false
                            }
                        )
                },
                (reason) => {
                    this.growl.error('Error getting Groups: ' + reason.message)
                    this.treeContentLoading = false
                }
            )
        } else {
            this.mainTree.types.length = 0
            this.mainTree.types.push('view', 'section')
            if (!this.mmsDocument._childViews) {
                this.mmsDocument._childViews = []
            }
            this.seenViewIds = {}
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
                                this.treeData.push(
                                    this.viewId2node[this.mmsDocument.id]
                                )
                                this.treeApi
                                    .initialSelect()
                                    .catch((reason) => {
                                        this.growl.error(
                                            TreeService.treeError(reason)
                                        )
                                    })
                                    .finally(() => {
                                        this.treeContentLoading = false
                                    })
                            })
                    },
                    (reason) => {
                        TreeService.treeError(reason)
                        this.treeContentLoading = false
                    }
                )
        }
    }

    tbInit = (api: ButtonBarApi): void => {
        if (this.$state.includes('main.project.ref.document')) {
            api.addButton(
                this.buttonBarSvc.getButtonBarButton('tree-mode-dropdown')
            )
            //api.select(viewModeButton, this.rootScopeSvc.treeShowPe() ? this.buttonBarSvc.getButtonBarButton('tree-show-pe') : this.buttonBarSvc.getButtonBarButton('tree-show-views'));
        }
    }

    bbInit = (api: ButtonBarApi): void => {
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

    toggle = (id: string): void => {
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

    closeAll = (): void => {
        Object.keys(this.activeMenu).forEach((k) => {
            this.activeMenu[k] = false
        })
        this.tbApi.deselectAll('tree-mode-dropdown')
        this.tbApi.setActive('tree-close-all', false, 'tree-mode-dropdown')
    }

    groupLevel2Func = (groupOb: ElementObject, groupNode: TreeBranch): void => {
        groupNode.loading = true
        this.viewSvc
            .getProjectDocuments(
                {
                    projectId: this.mmsProject.id,
                    refId: this.mmsRef.id,
                },
                2
            )
            .then(
                (documentObs: ViewObject[]) => {
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
                                this.mmsRef.type === 'Branch'
                                    ? 'view'
                                    : 'snapshot',
                            data: docOb,
                            group: groupOb,
                            children: [],
                        })
                    }
                    groupNode.loading = false
                    this.treeApi.initialSelect().catch((reason) => {
                        this.growl.error(TreeService.treeError(reason))
                    })
                },
                (reason) => {
                    this.growl.error(
                        'Error getting project Documents: ' + reason.message
                    )
                }
            )
    }

    handleSingleView = (v: ViewObject, aggr: string): TreeBranch => {
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

    public handleChildren = (
        curNode: TreeBranch,
        childNodes: TreeBranch[]
    ): void => {
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
        curNode.children.push(...newChildNodes)
        curNode.loading = false
        this.treeApi.refresh().catch((reason) => {
            this.growl.error(TreeService.treeError(reason))
        })
    }

    processDeletedViewBranch = (branch: TreeBranch): void => {
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

    addSectionElements = (
        element: ElementObject,
        viewNode: TreeBranch,
        parentNode: TreeBranch,
        initial?: boolean
    ): void => {
        let contents: ValueObject | null = null

        const addContentsSectionTreeNode = (
            operand: InstanceValueObject[]
        ): void => {
            const bulkGet: string[] = []
            const i = 0
            operand.forEach((operator) => {
                bulkGet.push(operator.instanceId)
            })
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
                        this.$q.allSettled(instances).then(
                            (results) => {
                                let k = results.length - 1
                                for (; k >= 0; k--) {
                                    const instance: ElementObject =
                                        results[k].value
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
                                let promise: VePromise<void, void>
                                if (initial) {
                                    promise = this.treeApi.initialSelect()
                                } else {
                                    promise = this.treeApi.refresh()
                                }
                                promise.catch((reason) => {
                                    this.growl.error(
                                        TreeService.treeError(reason)
                                    )
                                })
                            },
                            (reason) => {
                                this.growl.error(TreeService.treeError(reason))
                            }
                        )
                    },
                    (reason) => {
                        this.growl.error(
                            'Error retrieving contained elements: ' +
                                reason.message
                        )
                    }
                )
        }

        if (element._contents) {
            contents = (element as ViewObject)._contents
        } else if (this.viewSvc.isSection(element) && element.specification) {
            contents = (element as ViewInstanceSpec).specification // For Sections, the contents expression is the specification
        } else {
            //bad?
        }
        if (contents && contents.operand) {
            addContentsSectionTreeNode((contents as ExpressionObject).operand)
        }
    }

    treeClickCallback = (branch: TreeBranch): void => {
        if (
            this.$state.includes('main.project.ref') &&
            !this.$state.includes('main.project.ref.document')
        ) {
            if (branch.type === 'group') {
                void this.$state.go('main.project.ref.portal.preview', {
                    documentId: 'site_' + branch.data.id + '_cover',
                    search: undefined,
                })
            } else if (branch.type === 'view' || branch.type === 'snapshot') {
                void this.$state.go('main.project.ref.portal.preview', {
                    documentId: branch.data.id,
                    search: undefined,
                })
            }
        } else if (this.$state.includes('main.project.ref.document')) {
            const viewId =
                branch.type !== 'view' ? branch.viewId : branch.data.id
            // var sectionId = branch.type === 'section' ? branch.data.id : null;
            const hash = branch.data.id
            this.eventSvc.$broadcast('mms-tree-click', branch)
            if (
                !this.rootScopeSvc.veFullDocMode() &&
                (branch.type === 'view' || branch.type === 'section')
            ) {
                void this.$state.go('main.project.ref.document.view', {
                    viewId: branch.data.id,
                    search: undefined,
                })
            } else {
                void this.$state.go('main.project.ref.document.view', {
                    viewId: viewId,
                    search: undefined,
                })
                void this.$timeout(
                    () => {
                        this.$location.hash(hash)
                        //this.$anchorScroll()
                    },
                    1000,
                    false
                )
            }
        }
    }

    treeDblClickCallback = (branch: TreeBranch): void => {
        if (
            this.$state.includes('main.project.ref') &&
            !this.$state.includes('main.project.ref.document')
        ) {
            if (branch.type === 'view' || branch.type === 'snapshot') {
                void this.$state.go('main.project.ref.document', {
                    documentId: branch.data.id,
                    search: undefined,
                })
            }
        } else if (this.$state.includes('main.project.ref.document')) {
            this.treeApi.expandBranch(branch).catch((reason) => {
                this.growl.error(TreeService.treeError(reason))
            })
        }
    }

    public fullDocMode = (): void => {
        if (this.rootScopeSvc.veFullDocMode()) {
            this.rootScopeSvc.veFullDocMode(false)
            this.bbApi.setToggleState('tree-full-document', false)
            const curBranch = this.treeApi.getSelectedBranch()
            if (curBranch) {
                let viewId: string
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
                void this.$state.go('main.project.ref.document.view', {
                    viewId,
                    search: undefined,
                })
            }
        } else {
            this.rootScopeSvc.veFullDocMode(true)
            this.bbApi.setToggleState('tree-full-document', true)
            void this.$state.go('main.project.ref.document.full', {
                search: undefined,
            })
        }
    }

    reloadData = (): void => {
        this.bbApi.toggleButtonSpinner('tree-refresh')
        this.processed = ''
        this.$state.reload().then(
            () => {
                this.treeApi.refresh().then(
                    () => {
                        this.tbApi.toggleButtonSpinner('tree-refresh')
                    },
                    (reason) => {
                        this.growl.error(TreeService.treeError(reason))
                    }
                )
            },
            (reason) => {
                if (typeof reason === 'string') {
                    this.growl.error('Error Reloading Page: ' + reason)
                } else if ((reason as VePromiseReason<void>).message) {
                    this.growl.error(
                        'Error Reloading Page: ' +
                            (reason as VePromiseReason<void>).message
                    )
                } else {
                    this.growl.error('Error Reloading Page')
                }
            }
        )
    }

    addElement(itemType: string): VePromise<void, string> {
        const deferred = this.$q.defer<void>()
        this.addElementData = {
            addType: 'item',
            type: itemType,
            newViewAggr: 'shared',
            parentBranch: null,
            seenViewIds: this.seenViewIds,
        }
        const branch = this.treeApi.getSelectedBranch()
        if (itemType === 'Document') {
            this.addDocument(branch).then(
                (result) => {
                    this.addElementModal(result)
                    deferred.resolve()
                },
                (reason: VePromiseReason<string>) => {
                    deferred.reject(reason)
                }
            )
        } else if (itemType === 'Group') {
            this.addGroup(branch).then(
                (result) => {
                    this.addElementModal(result)
                    deferred.resolve()
                },
                (reason: VePromiseReason<string>) => {
                    deferred.reject(reason)
                }
            )
        } else if (itemType === 'View') {
            this.addView(branch).then(
                (result) => {
                    this.addElementModal(result)
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

    addElementModal = (branchType: string): void => {
        const settings: VeModalSettings<AddElementResolveFn<AddViewData>> = {
            component: 'addElementModal',
            resolve: {
                getAddData: () => {
                    return this.addElementData
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
            AddElementResolveFn<AddViewData>,
            ElementObject
        >(settings)
        instance.result.then(
            (result) => {
                if (!this.rootScopeSvc.veEditMode()) {
                    void this.$timeout(
                        () => {
                            $('.show-edits').click()
                        },
                        0,
                        false
                    )
                }
                const newbranch: TreeBranch = {
                    label: result.name,
                    type: branchType,
                    data: result,
                    children: [],
                    aggr: '',
                }
                const top = this.addElementData.type === 'Group'
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
                this.treeApi
                    .addBranch(this.addElementData.parentBranch, newbranch, top)
                    .then(
                        () => {
                            if (this.addElementData.type === 'View') {
                                this.viewId2node[result.id] = newbranch
                                this.seenViewIds[result.id] = newbranch
                                newbranch.aggr = this.addElementData.newViewAggr
                                const curNum =
                                    this.addElementData.parentBranch.children[
                                        this.addElementData.parentBranch
                                            .children.length - 1
                                    ].data._veNumber
                                let prevBranch =
                                    this.treeApi.getPrevBranch(newbranch)
                                while (prevBranch.type !== 'view') {
                                    prevBranch =
                                        this.treeApi.getPrevBranch(prevBranch)
                                }
                                this.viewSvc
                                    .handleChildViews(
                                        result,
                                        this.addElementData.newViewAggr,
                                        undefined,
                                        this.mmsProject.id,
                                        this.mmsRef.id,
                                        this.viewId2node,
                                        this.handleSingleView,
                                        this.handleChildren
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
                                    void this.$state.go(
                                        'main.project.ref.document.view',
                                        {
                                            viewId: result.id,
                                            search: undefined,
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
                                                    this.addElementData
                                                        .parentBranch.data.id,
                                            }
                                        )
                                    }
                                }
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
            this.addElementData.parentBranch = null
            branch = null
        } else if (branch.type !== 'group') {
            return this.$q.reject({
                message: 'Select a group to add document under',
            })
        } else {
            this.addElementData.parentBranch = branch
        }
        return this.$q.resolve('view')
    }

    addGroup(branch: TreeBranch): VePromise<string, string> {
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
        this.addElementData.parentBranch = branch
        return this.$q.resolve('view')
    }

    deleteItem = (cb?: (branch: TreeBranch) => void): void => {
        const branch = this.treeApi.getSelectedBranch()
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
            if (branch.type !== 'view' || !this.apiSvc.isView(branch.data)) {
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
                                    this.treeApi.getParent(branch)
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
                this.treeApi.removeBranch(branch).then(
                    () => {
                        if (
                            this.$state.includes('main.project.ref.document') &&
                            branch.type === 'view'
                        ) {
                            this.eventSvc.$broadcast('view.deleted', branch)
                            this.processDeletedViewBranch(branch)
                        }
                        if (this.rootScopeSvc.veFullDocMode() && cb) {
                            cb(branch)
                        } else {
                            this.treeApi.selectBranch().catch((reason) => {
                                this.growl.error(TreeService.treeError(reason))
                            })
                            void this.$state.go('^', { search: undefined })
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

    addViewSections = (view: ViewObject): void => {
        const node = this.viewId2node[view.id]
        this.addSectionElements(view, node, node)
    }

    addViewSectionsRecursivelyForNode = (node: TreeBranch): void => {
        this.addViewSections(node.data)
        for (let i = 0; i < node.children.length; i++) {
            if (node.children[i].type === 'view') {
                this.addViewSectionsRecursivelyForNode(node.children[i])
            }
        }
    }

    setPeVisibility = (branch: TreeBranch): void => {
        if (!this.mainTree.types.includes(branch.type)) {
            branch.hide = !this.rootScopeSvc.treeShowPe()
        }
        for (let i = 0; i < branch.children.length; i++) {
            this.setPeVisibility(branch.children[i])
        }
    }

    userClicksPane = (): void => {
        this.treeApi.selectBranch().catch((reason) => {
            this.growl.error(TreeService.treeError(reason))
        })
    }

    searchInputChangeHandler = (): void => {
        if (this.treeOptions.search === '') {
            this.treeApi.collapseAll().then(
                () => {
                    this.treeApi
                        .expandPathToSelectedBranch()
                        .catch((reason) => {
                            this.growl.error(TreeService.treeError(reason))
                        })
                },
                (reason) => {
                    this.growl.error(TreeService.treeError(reason))
                }
            )
        } else {
            // expand all branches so that the filter works correctly
            this.treeApi.expandAll().catch((reason) => {
                this.growl.error(TreeService.treeError(reason))
            })
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
        <i ng-show="$ctrl.treeContentLoading" class="fa fa-spin fa-spinner"></i>
        <div ng-hide="$ctrl.treeContentLoading">
            <tree tree-config="$ctrl.mainTree" tree-options="$ctrl.treeOptions"></tree>
        </div>
        <div data-ng-repeat="view in $ctrl.peTrees" ng-if="$ctrl.activeMenu[view.id]">
            <tree-list tree-options="$ctrl.treeOptions" tree-config="view"></tree-list>
        </div>
        <div ng-click="$ctrl.userClicksPane()" style="height: 100%"></div>
    </div>
</ng-pane>
`,
    bindings: {
        mmsParams: '<paramsOb',
        mmsDocument: '<',
        mmsProject: '<',
        mmsRef: '<',
        mmsDocMeta: '<',
    },
    require: {
        $pane: '^ngPane',
    },
    controller: LeftPaneController,
}

veApp.component(LeftPaneComponent.selector, LeftPaneComponent)
