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

import { VeComponentOptions, VeQService } from '@ve-types/angular'
import {
    DocumentObject,
    ElementObject,
    ElementsRequest,
    ElementsResponse,
    ProjectObject,
    RefObject,
    RefsResponse,
    ViewObject,
} from '@ve-types/mms'
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
    private init: boolean
    toolbarId: string = 'left-toolbar'
    buttonId: string = 'tree-button-bar'
    private spin: boolean

    schema = 'cameo'

    static $inject = [
        '$q',
        '$compile',
        '$element',
        '$anchorScroll',
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
        private permissionsSvc: PermissionsService,
        private rootScopeSvc: RootScopeService,
        public eventSvc: EventService,
        private buttonBarSvc: ButtonBarService
    ) {}

    $onInit(): void {
        this.spin = true
        this.transitionCallback()

        this.eventSvc.$init(this)

        this.paneClosed = false

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
            this.eventSvc.$on<veAppEvents.elementSelectedData>(
                'view.selected',
                this.changeData
            ),
            this.eventSvc.$on<veAppEvents.viewDeletedData>(
                'view.deleted',
                (data) => {
                    let goto = '^.currentState'
                    let documentId = this.treeApi.rootId
                    let viewId: string
                    if (this.$state.includes('**.portal.**')) {
                        if (data.parentBranch) {
                            documentId = data.parentBranch.data.id
                        } else {
                            goto = 'main.project.ref.portal'
                            documentId = null
                        }
                    } else if (this.$state.includes('**.present.**')) {
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

        this.buttonBarSvc.waitForApi(this.buttonId).then(
            (api) => {
                this.bbApi = api
                this.subs.push(
                    this.eventSvc.$on<veCoreEvents.buttonClicked>(
                        this.buttonId,
                        (data) => {
                            switch (data.clicked) {
                                case 'tree-reorder-view': {
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
    }

    changeData = (data: veAppEvents.elementSelectedData): void => {
        //If the transitioning state detects a refresh, it will let us know to regenerate the tree
        if (data.refresh) this.treeSvc.processedRoot = ''
        const rootId =
            !data.rootId && data.elementId.endsWith('_cover')
                ? data.projectId + '_pm'
                : data.rootId
        const elementId = data.elementId
        const refId = data.refId
        const projectId = data.projectId
        const commitId = data.commitId ? data.commitId : null
        if (
            (rootId && this.treeSvc.processedRoot !== rootId && rootId != '') ||
            !this.treeApi
        ) {
            new this.$q<string, RefsResponse>((resolve, reject) => {
                if (
                    !this.treeApi ||
                    !this.treeApi.refType ||
                    refId != this.treeApi.refId ||
                    projectId != this.treeApi.projectId
                ) {
                    this.projectSvc.getRef(refId, projectId).then((ref) => {
                        resolve(ref.type)
                    }, reject)
                } else {
                    resolve(this.treeApi.refType)
                }
            }).then(
                (refType) => {
                    this.treeApi = {
                        rootId,
                        elementId,
                        projectId,
                        refType,
                        refId,
                        commitId,
                    }

                    this.treeApi.onSelect = this.treeClickCallback
                    this.treeApi.onDblClick = this.treeDblClickCallback

                    this.treeSvc.treeApi = this.treeApi
                    this.treeSvc.treeEditable =
                        this.permissionsSvc.hasBranchEditPermission(
                            this.mmsProject.id,
                            this.mmsRef.id
                        )

                    this.treeApi.sectionNumbering =
                        this.$state.includes('**.present.**')
                    this.treeApi.expandLevel = this.$state.includes(
                        '**.present.**'
                    )
                        ? 3
                        : this.$state.includes('**.portal.**')
                        ? 0
                        : 1
                    this.treeApi.sort = !this.$state.includes('**.present.**')

                    new this.$q<ElementObject, ElementsResponse<ElementObject>>(
                        (resolve, reject) => {
                            if (this.$state.includes('**.present.**')) {
                                const reqOb: ElementsRequest<string> = {
                                    elementId: this.treeApi.rootId,
                                    refId: this.treeApi.refId,
                                    projectId: this.treeApi.projectId,
                                }
                                this.elementSvc
                                    .getElement<ViewObject>(reqOb)
                                    .then((root) => {
                                        if (
                                            this.apiSvc.isDocument(root) &&
                                            this.$state.includes(
                                                '**.present.**'
                                            )
                                        ) {
                                            this.viewSvc
                                                .getDocumentMetadata({
                                                    elementId: root.id,
                                                    refId: root._refId,
                                                    projectId: root._projectId,
                                                })
                                                .then((result) => {
                                                    this.treeApi.numberingDepth =
                                                        result.numberingDepth
                                                    this.treeApi.numberingSeparator =
                                                        result.numberingSeparator
                                                    this.treeApi.startChapter =
                                                        (root as DocumentObject)
                                                            ._startChapter
                                                            ? (
                                                                  root as DocumentObject
                                                              )._startChapter
                                                            : 1

                                                    if (
                                                        !(
                                                            root as DocumentObject
                                                        )._childViews
                                                    )
                                                        (
                                                            root as DocumentObject
                                                        )._childViews = []
                                                    resolve(root)
                                                }, reject)
                                        } else {
                                            resolve(root)
                                        }
                                    }, reject)
                            } else {
                                resolve(null)
                            }
                        }
                    ).then(
                        (root) => {
                            if (!this.rootScopeSvc.treeInitialSelection()) {
                                this.treeApi.elementId = elementId
                            }
                            this.treeSvc.changeRoots(root).catch((reason) => {
                                this.growl.error(TreeService.treeError(reason))
                            })
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
        } else {
            if (!this.rootScopeSvc.treeInitialSelection()) {
                this.treeApi.elementId = elementId
            }
            this.treeSvc.changeElement().catch((reason) => {
                this.growl.error(TreeService.treeError(reason))
            })
        }
        this.initTrees()
    }

    initTrees = (): void => {
        if (!this.init) {
            this.init = true
            this.$trees = $(
                `<view-trees ng-hide="$ctrl.spin"  trees-category="$ctrl.treesCategory" toolbar-id="${this.toolbarId}" button-id="${this.buttonId}"></view-trees>`
            )
            $('.pane-left').append(this.$trees)
            this.spin = false
            this.$compile(this.$trees)(this.$scope)
        }
    }

    transitionCallback = (): void => {
        if (this.$state.includes('**.present.**')) {
            this.treesCategory = 'present'
        } else if (this.$state.includes('**.portal.**')) {
            this.treesCategory = 'portal'
        } else {
            this.treesCategory = 'global'
        }
        this.buttonBarSvc.waitForApi(this.buttonId).then(
            (api) => {
                this.bbApi = api
            },
            (reason) => {
                console.log(reason.message)
            }
        )
    }

    treeClickCallback = (branch: TreeBranch): void => {
        if (this.$state.includes('**.portal.**')) {
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
        } else if (this.$state.includes('**.present.**')) {
            const viewId =
                branch.type !== 'view' ? branch.viewId : branch.data.id

            // If clicked on a PE send the element.selected event for Tool Pane
            if (!(branch.type === 'view' || branch.type === 'section')) {
                const data = {
                    elementId: branch.data.id,
                    projectId: branch.data._projectId,
                    refId: branch.data._refId,
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
        if (this.$state.includes('**.portal.**')) {
            if (branch.type === 'view' || branch.type === 'snapshot') {
                void this.$state.go('main.project.ref.present.snapshot', {
                    documentId: branch.data.id,
                    search: undefined,
                })
            }
        } else if (this.$state.includes('**.present.**')) {
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
            void this.$state.go('main.project.ref.present.document', {
                viewId,
                search: undefined,
            })
        }
    }

    reloadData = (): void => {
        this.bbApi.toggleButtonSpinner('tree-refresh')
        this.treeSvc.processedRoot = ''
        const data: veAppEvents.elementSelectedData = {
            rootId: this.treeApi.rootId,
            elementId: this.treeApi.elementId,
            projectId: this.treeApi.projectId,
            refId: this.treeApi.refId,
            refType: this.treeApi.refType,
            commitId: 'latest',
        }
        this.eventSvc.$broadcast<veAppEvents.elementSelectedData>(
            'view.selected',
            data
        )
        const finished = this.eventSvc.$on('tree.ready', () => {
            this.bbApi.toggleButtonSpinner('tree-refresh')
            finished.dispose()
        })
    }
}

/* Controllers */
const LeftPaneComponent: VeComponentOptions = {
    selector: 'leftPane',
    transclude: true,
    template: `
    <div class="pane-left">
    <i ng-show="$ctrl.spin" class="tree-spinner fa fa-2x fa-spinner fa-spin"></i>
</div>
  
  
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
