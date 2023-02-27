import { IPane } from '@openmbee/pane-layout'
import { IPaneManagerService } from '@openmbee/pane-layout/lib/PaneManagerService'
import {
    StateService,
    TransitionService,
    UIRouterGlobals,
} from '@uirouter/angularjs'

import { veAppEvents } from '@ve-app/events'
import { AppUtilsService } from '@ve-app/main/services'
import { InsertViewData } from '@ve-components/insertions/components/insert-view.component'
import { TreeService } from '@ve-components/trees'
import { ButtonBarApi, ButtonBarService } from '@ve-core/button-bar'
import { veCoreEvents } from '@ve-core/events'
import { ToolbarApi, ToolbarService } from '@ve-core/toolbar'
import { RootScopeService } from '@ve-utils/application'
import { EventService } from '@ve-utils/core'
import {
    ApiService,
    ElementService,
    PermissionsService,
    ProjectService,
    ViewService,
} from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'

import { veApp } from '@ve-app'

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular'
import { DocumentObject, ProjectObject, RefObject } from '@ve-types/mms'
import { TreeApi, TreeBranch } from '@ve-types/tree'
import { VeModalService } from '@ve-types/view-editor'

class LeftPaneController implements angular.IComponentController {
    //Scope
    public subs: Rx.IDisposable[]

    private $pane: IPane
    private $trees: JQuery<HTMLElement>
    private paneClosed: boolean

    public bbApi: ButtonBarApi
    public bbSize: string
    public tbApi: ToolbarApi
    public bars: string[]

    protected treesCategory: string
    public treeSearch: string = ''

    //Bindings
    private mmsProject: ProjectObject
    private mmsRef: RefObject

    //Tree Api
    private treeApi: TreeApi

    //Local Variables
    public docEditable: boolean
    public insertData: InsertViewData

    private treeContentLoading: boolean

    schema = 'cameo'

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
        'SchemaService',
        'ViewService',
        'ProjectService',
        'AppUtilsService',
        'TreeService',
        'ToolbarService',
        'PermissionsService',
        'RootScopeService',
        'EventService',
        'ButtonBarService',
    ]

    constructor(
        private $q: VeQService,
        private $compile: angular.ICompileService,
        private $element: JQuery<HTMLElement>,
        private $anchorScroll: angular.IAnchorScrollService,
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
        private schemaSvc: SchemaService,
        private viewSvc: ViewService,
        private projectSvc: ProjectService,
        private appUtilsSvc: AppUtilsService,
        private treeSvc: TreeService,
        private toolbarSvc: ToolbarService,
        private permissionsSvc: PermissionsService,
        private rootScopeSvc: RootScopeService,
        public eventSvc: EventService,
        private buttonBarSvc: ButtonBarService
    ) {}

    $onInit(): void {
        if (this.treeSvc.treeApi) {
            this.treeApi = this.treeSvc.treeApi
        } else {
            this.treeSvc.treeApi = this.treeApi = {}
        }
        this.transitionCallback()
        this.treeApi.onSelect = this.treeClickCallback
        this.treeApi.onDblClick = this.treeDblClickCallback
        this.treeApi.treeContentLoading = true

        this.eventSvc.$init(this)

        this.paneClosed = false

        this.toolbarSvc.waitForApi('left-toolbar').then(
            (api) => {
                this.tbApi = api
            },
            (reason) => {
                this.growl.error(reason.message)
            }
        )

        this.bbSize = '83px'

        this.$transitions.onSuccess({}, () => {
            this.transitionCallback()
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

        // Start listening to change events
        this.subs.push(
            this.eventSvc.$on<veAppEvents.viewSelectedData>(
                'view.selected',
                (data): void => {
                    const changeRoot = false
                    const changeFocus = false
                    const rootOb = data.rootOb
                    const focusId = data.focusId
                    this.treeSvc.treeEditable =
                        this.permissionsSvc.hasBranchEditPermission(
                            this.mmsProject.id,
                            this.mmsRef.id
                        )

                    this.treeApi.sectionNumbering = this.$state.includes(
                        'main.project.ref.present'
                    )
                    this.treeApi.expandLevel = this.$state.includes(
                        'main.project.ref.present'
                    )
                        ? 3
                        : this.$state.includes('main.project.ref')
                        ? 0
                        : 1
                    this.treeApi.sort = !this.$state.includes(
                        'main.project.ref.present'
                    )

                    this.treeApi.projectId = this.mmsProject.id
                    this.treeApi.refId = this.mmsRef.id
                    this.treeApi.refType = this.mmsRef.type
                    this.treeApi.commitId = data.commitId
                        ? data.commitId
                        : rootOb._commitId
                    this.treeApi.focusId = focusId
                    if (this.treeSvc.processedRoot !== data.rootOb.id) {
                        this.treeContentLoading = true
                        this.treeApi.rootOb = rootOb
                        let rootType = ''
                        const promises: VePromise<void, void>[] = []
                        if (this.$state.includes('document')) {
                            rootType = 'document'
                            promises.push(
                                new this.$q<void>((resolve, reject) => {
                                    this.viewSvc
                                        .getDocumentMetadata({
                                            elementId: rootOb.id,
                                            refId: rootOb._refId,
                                            projectId: rootOb._projectId,
                                        })
                                        .then(
                                            (result) => {
                                                this.treeApi.numberingDepth =
                                                    result.numberingDepth
                                                this.treeApi.numberingSeparator =
                                                    result.numberingSeparator
                                                this.treeApi.startChapter = (
                                                    rootOb as DocumentObject
                                                )._startChapter
                                                    ? (rootOb as DocumentObject)
                                                          ._startChapter
                                                    : 1

                                                if (
                                                    !(rootOb as DocumentObject)
                                                        ._childViews
                                                )
                                                    (
                                                        rootOb as DocumentObject
                                                    )._childViews = []
                                                resolve()
                                            },
                                            (reason) => {
                                                reject(reason)
                                            }
                                        )
                                })
                            )
                        } else {
                            rootType = 'portal'
                            promises.push(this.$q.resolve())
                        }
                        this.$q.allSettled(promises).then(
                            () => {
                                this.rootScopeSvc.treeInitialSelection(focusId)
                                this.treeSvc
                                    .changeRoots(rootType)
                                    .catch((reason) => {
                                        this.growl.error(reason.message)
                                    })
                                    .finally(() => {
                                        this.treeContentLoading = false
                                    })
                            },
                            (reason) => {
                                this.growl.error(reason.message)
                            }
                        )
                    } else {
                        this.treeSvc.changeFocus(focusId).catch((reason) => {
                            this.growl.error(TreeService.treeError(reason))
                        })
                    }
                }
            ),
            this.eventSvc.$on<veAppEvents.viewDeletedData>(
                'view.deleted',
                (data) => {
                    let goto = '^.currentState'
                    let documentId = this.treeApi.rootOb.id
                    let viewId: string
                    if (this.$state.includes('portal')) {
                        if (data.parentBranch) {
                            documentId = data.parentBranch.data.id
                        } else {
                            goto = 'main.project.ref.portal'
                            documentId = null
                        }
                    } else if (this.$state.includes('present')) {
                        if (data.prevBranch) {
                            viewId = data.prevBranch.viewId
                                ? data.prevBranch.viewId
                                : data.prevBranch.data.id
                        } else if (data.parentBranch) {
                            viewId = data.parentBranch.viewId
                                ? data.parentBranch.viewId
                                : data.parentBranch.data.id
                        }
                    }
                    void this.$state.go(goto, {
                        documentId,
                        viewId,
                        search: undefined,
                    })
                }
            )
        )

        this.buttonBarSvc.waitForApi('tree-button-bar').then(
            (api) => {
                this.bbApi = api
                this.subs.push(
                    this.eventSvc.$on<veCoreEvents.buttonClicked>(
                        'button-clicked-tree-button-bar',
                        (data) => {
                            switch (data.clicked) {
                                case 'tree-reorder-view': {
                                    this.rootScopeSvc.veFullDocMode(false)
                                    this.bbApi.setToggleState(
                                        'tree-full-document',
                                        false
                                    )
                                    void this.$state.go(
                                        'main.project.ref.present.reorder',
                                        {
                                            search: undefined,
                                        }
                                    )
                                    break
                                }
                                case 'tree-reorder-group': {
                                    void this.$state.go(
                                        'main.project.ref.groupReorder'
                                    )
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
                        }
                    )
                )
            },
            (reason) => {
                console.log(reason.message)
            }
        )

        this.$trees = $(
            `<view-trees trees-category="$ctrl.treesCategory" mms-ref="$ctrl.mmsRef"></view-trees>`
        )
        this.$element.find('#trees').append(this.$trees)
        this.$compile(this.$trees)(this.$scope)
    }

    transitionCallback = (): void => {
        if (this.$state.includes('document')) {
            this.treesCategory = 'document'
        } else if (this.$state.includes('portal')) {
            this.treesCategory = 'portal'
        } else {
            this.treesCategory = 'global'
        }
        this.buttonBarSvc.waitForApi('tree-button-bar').then(
            (api) => {
                this.bbApi = api
            },
            (reason) => {
                console.log(reason.message)
            }
        )
    }

    treeClickCallback = (branch: TreeBranch): void => {
        if (this.$state.includes('portal')) {
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
        } else if (this.$state.includes('present')) {
            const viewId =
                branch.type !== 'view' ? branch.viewId : branch.data.id

            // If clicked on a PE send the element.selected event for Tool Pane
            if (!(branch.type === 'view' || branch.type === 'section')) {
                const data = {
                    elementOb: branch.data,
                    commitId: 'latest',
                }
                this.eventSvc.$broadcast<veAppEvents.elementSelectedData>(
                    'element.selected',
                    data
                )
            }
            let goTo = ''
            if (this.$state.includes('slideshow'))
                goTo = 'main.project.ref.present.slideshow'
            else if (this.$state.includes('document')) {
                goTo = 'main.project.ref.present.document.anchor'
            }
            void this.$state.go(goTo, {
                viewId: viewId,
                search: undefined,
            })
        }
    }

    treeDblClickCallback = (branch: TreeBranch): void => {
        if (this.$state.includes('portal')) {
            if (branch.type === 'view' || branch.type === 'snapshot') {
                void this.$state.go('main.project.ref.present.snapshot', {
                    documentId: branch.data.id,
                    search: undefined,
                })
            }
        } else if (this.$state.includes('present')) {
            this.treeSvc.expandBranch(branch).catch((reason) => {
                this.growl.error(TreeService.treeError(reason))
            })
        }
    }

    public fullDocMode = (): void => {
        const curBranch = this.treeSvc.getSelectedBranch()
        let viewId = ''
        if (curBranch) {
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
        }

        if (this.$state.includes('document')) {
            void this.$state.go('main.project.ref.present.slideshow', {
                viewId,
                search: undefined,
            })
        } else {
            this.rootScopeSvc.veFullDocMode(true)
            void this.$state.go('main.project.ref.present.document', {
                viewId,
                search: undefined,
            })
        }
    }

    reloadData = (): void => {
        this.bbApi.toggleButtonSpinner('tree-refresh')
        this.treeSvc.processedRoot = ''
        const data: veAppEvents.viewSelectedData = {
            rootOb: this.treeApi.rootOb,
            focusId: this.treeApi.focusId,
            commitId: 'latest',
        }
        this.eventSvc.$broadcast<veAppEvents.viewSelectedData>(
            'view.selected',
            data
        )
    }
}

/* Controllers */
const LeftPaneComponent: VeComponentOptions = {
    selector: 'leftPane',
    transclude: true,
    template: `
  
`,
    bindings: {
        mmsProject: '<',
        mmsRef: '<',
    },
    require: {
        $pane: '^ngPane',
    },
    controller: LeftPaneController,
}

veApp.component(LeftPaneComponent.selector, LeftPaneComponent)
