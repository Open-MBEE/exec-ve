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
import { trees_default_buttons } from '@ve-components/trees/trees-buttons.config'
import {
    ButtonBarApi,
    ButtonBarService,
    ButtonWrapEvent,
} from '@ve-core/button-bar'
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
    ParamsObject,
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

    public bbApi: ButtonBarApi
    public bbSize: string
    public bars: string[]
    private headerSize: string = '93px'
    protected squishSize: number = 250

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
            this.eventSvc.binding(
                this.rootScopeSvc.constants.LEFTPANECLOSED,
                (paneClosed) => {
                    if (paneClosed !== this.$pane.closed) {
                        this.$pane.toggle()
                    }
                }
            )
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

        this.buttonBarSvc.waitForApi(this.buttonId).then(
            (api) => {
                this.bbApi = api
                this.subs.push(
                    this.eventSvc.$on<veCoreEvents.buttonClicked>(
                        this.buttonId,
                        (data) => {
                            switch (data.clicked) {
                                case 'tree-reorder-view': {
                                    this.bbApi.toggleButton(
                                        'tree-full-document',
                                        false
                                    )
                                    void this.$state.go(
                                        'main.project.ref.view.reorder',
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
        api.setPermission(
            'tree-add.group',
            this.permissionsSvc.hasProjectEditPermission(
                this.treeSvc.treeApi.projectId
            )
        )
        api.setPermission(
            'tree-add.document',
            this.treeSvc.treeApi.refType !== 'Tag' && this.treeSvc.treeEditable
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
        api.setPermission(
            'tree-add.view',
            this.treeSvc.treeApi.refType !== 'Tag' && this.treeSvc.treeEditable
        )

        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-reorder-view'))
        api.addButton(
            this.buttonBarSvc.getButtonBarButton('tree-full-document')
        )
        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-show-pe'))
        api.setPermission('tree-reorder-view', this.treeSvc.treeEditable)
        if (this.rootScopeSvc.veFullDocMode()) {
            api.toggleButton('tree-full-document', true)
        }
        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-refresh'))
        api.buttons.forEach((b) => {
            const button = b.config
            if (button) {
                if (button.enabledFor) {
                    b.active = false
                    for (const enableState of button.enabledFor) {
                        if (this.$state.includes(enableState)) {
                            b.active = true
                            break
                        }
                    }
                }
                if (button.disabledFor) {
                    for (const disableState of button.disabledFor) {
                        if (this.$state.includes(disableState)) {
                            b.active = false
                            break
                        }
                    }
                }
            }
        })
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
                            this.treeApi.elementId = elementId
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
            this.treeApi.elementId = elementId
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
            void this.$state.go(
                'main.project.ref.view.present.' +
                    (this.$uiRouterGlobals.params as ParamsObject).display,
                {
                    viewId,
                    search: undefined,
                }
            )
        }
    }

    treeDblClickCallback = (branch: TreeBranch): void => {
        if (this.$state.includes('**.portal.**')) {
            if (branch.type === 'view' || branch.type === 'snapshot') {
                void this.$state.go(
                    'main.project.ref.view.present.' +
                        (this.$uiRouterGlobals.params as ParamsObject).display,
                    {
                        documentId: branch.data.id,
                        search: undefined,
                    }
                )
            }
        } else if (this.$state.includes('**.present.**')) {
            this.treeSvc.expandBranch(branch).catch((reason) => {
                this.growl.error(TreeService.treeError(reason))
            })
        }
    }

    public fullDocMode = (): void => {
        let display = ''
        this.bbApi.toggleButton(
            'tree-full-document',
            this.rootScopeSvc.veFullDocMode(!this.rootScopeSvc.veFullDocMode())
        )
        if (this.rootScopeSvc.veFullDocMode()) {
            display = 'document'
        } else {
            display = 'slideshow'
        }
        void this.$state.go('main.project.ref.view.present.' + display, {
            search: undefined,
            display,
        })
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
    <ng-pane pane-anchor="north" pane-size="{{ $ctrl.headerSize }}" pane-no-toggle="true" pane-no-scroll="true" pane-closed="false" parent-ctrl="$ctrl">
    <div class="tree-view">
        
        <i ng-hide="$ctrl.bbApi" class="fa fa-spinner fa-spin" style="margin: 5px 50%"></i>
        <div ng-show="$ctrl.bbApi" class="tree-view-buttons" role="toolbar">
            <button-bar button-id="$ctrl.buttonId"></button-bar>
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
