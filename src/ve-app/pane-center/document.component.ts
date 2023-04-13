import { IPaneScrollApi } from '@openmbee/pane-layout/lib/components/ng-pane'
import { HookResult, Ng1Controller, StateService, TransitionService, UIRouterGlobals } from '@uirouter/angularjs'
import { Transition } from '@uirouter/core'
import angular, { IComponentController } from 'angular'
import Rx from 'rx-lite'

import { veAppEvents } from '@ve-app/events'
import { AppUtilsService, FullDocumentApi, FullDocumentService } from '@ve-app/main/services'
import { pane_center_buttons } from '@ve-app/pane-center/pane-center-buttons.config'
import { ContentWindowService } from '@ve-app/pane-center/services/ContentWindow.service'
import { TreeService } from '@ve-components/trees'
import { IButtonBarButton, ButtonBarApi, ButtonBarService } from '@ve-core/button-bar'
import { veCoreEvents } from '@ve-core/events'
import { RootScopeService, ShortUrlService, UtilsService } from '@ve-utils/application'
import { EventService } from '@ve-utils/core'
import { PermissionsService, ViewData, ViewService, URLService } from '@ve-utils/mms-api-client'

import { veApp } from '@ve-app'

import { VeComponentOptions, VeQService } from '@ve-types/angular'
import { DocumentObject, ElementObject, ParamsObject, ProjectObject, RefObject, ViewObject } from '@ve-types/mms'
import { TreeBranch, View2NodeMap } from '@ve-types/tree'

class FullDocumentController implements IComponentController, Ng1Controller {
    //Bindings
    public mmsView: ViewObject
    public mmsDocument: DocumentObject
    public mmsProject: ProjectObject
    public mmsRef: RefObject
    //
    // //Locals
    // public document: DocumentObject
    // public project: ProjectObject
    // public ref: RefObject

    public subs: Rx.IDisposable[]
    bars: string[]
    bbApi: ButtonBarApi
    bbId = 'full-doc'
    fullDocumentApi: FullDocumentApi
    viewContentLoading: boolean
    buttons: IButtonBarButton[] = []
    latestElement: string = ''
    scrollApi: IPaneScrollApi
    views: ViewData[] = []
    view2Children: { [key: string]: string[] } = {}
    view2Node: View2NodeMap = {}
    num = 1
    seenViewIds = {}
    shortUrl: string = ''
    processed: string

    private dynamicPopover: {
        templateUrl: string
        title: string
    }

    static $inject = [
        '$q',
        '$scope',
        '$element',
        '$state',
        '$uiRouterGlobals',
        '$transitions',
        '$anchorScroll',
        '$location',
        '$timeout',
        '$http',
        'hotkeys',
        'growl',
        'FullDocumentService',
        'ShortUrlService',
        'AppUtilsService',
        'ContentWindowService',
        'URLService',
        'UtilsService',
        'PermissionsService',
        'RootScopeService',
        'ViewService',
        'TreeService',
        'EventService',
        'ButtonBarService',
    ]
    constructor(
        private $q: VeQService,
        private $scope: angular.IScope,
        private $element: JQuery<HTMLElement>,
        private $state: StateService,
        private $uiRouterGlobals: UIRouterGlobals,
        private $transitions: TransitionService,
        private $anchorScroll: angular.IAnchorScrollService,
        private $location: angular.ILocationService,
        private $timeout: angular.ITimeoutService,
        private $http: angular.IHttpService,
        private hotkeys: angular.hotkeys.HotkeysProvider,
        private growl: angular.growl.IGrowlService,
        private fullDocumentSvc: FullDocumentService,
        private shortUrlSvc: ShortUrlService,
        private appUtilsSvc: AppUtilsService,
        private contentWindowSvc: ContentWindowService,
        private uRLSvc: URLService,
        private utilsSvc: UtilsService,
        private permissionsSvc: PermissionsService,
        private rootScopeSvc: RootScopeService,
        private viewSvc: ViewService,
        private treeSvc: TreeService,
        private eventSvc: EventService,
        private buttonBarSvc: ButtonBarService
    ) {}

    $onInit(): void {
        this.rootScopeSvc.veFullDocMode(true)
        this.rootScopeSvc.veHideLeft(false)
        this.rootScopeSvc.veHideRight(false)
        this.rootScopeSvc.veNumberingOn(true)
        this.eventSvc.$init(this)

        //Init/Reset Tree Updated Subject
        this.eventSvc.resolve<boolean>(TreeService.events.UPDATED, false)

        this.bbApi = this.buttonBarSvc.initApi(this.bbId, this.bbInit, pane_center_buttons)

        this.view2Node[this.mmsDocument.id] = {
            label: this.mmsDocument.name,
            data: this.mmsDocument,
            type: 'view',
            children: [],
        }
        this.view2Children[this.mmsDocument.id] = []

        // Share URL button settings
        this.dynamicPopover = this.shortUrlSvc.dynamicPopover

        this.shortUrl = this.shortUrlSvc.getShortUrl({
            orgId: this.mmsProject.orgId,
            projectId: this.mmsProject.id,
            refId: this.mmsRef.id,
            documentId: this.mmsDocument.id,
        })

        this.viewContentLoading = this.rootScopeSvc.veViewContentLoading(false)

        this.$transitions.onSuccess({}, (transition) => {
            this._scroll(transition.params().viewId as string)
        })

        this.subs.push(
            this.eventSvc.binding<boolean>(this.rootScopeSvc.constants.VEVIEWCONTENTLOADING, (data) => {
                this.viewContentLoading = data
            })
        )

        // api to communicate with borderlayout library
        this.scrollApi = {
            notifyOnScroll: this.notifyOnScroll,
            isScrollVisible: (): boolean => {
                return false
            }, // pane's directive (in borderlayout) resets this to the right function
            throttleRate: 500, // how often should the wheel event triggered
            threshold: 3000, // how far from the bottom of the page before adding more views
            frequency: 100, // how fast to add more views
        }

        this.subs.push(
            this.eventSvc.$on('view.deleted', (deletedBranch: TreeBranch) => {
                this.fullDocumentApi.handleViewDelete(deletedBranch)
            })
        )

        this.subs.push(
            this.eventSvc.$on('view.added', (data: veAppEvents.viewAddedData) => {
                this.fullDocumentApi.handleViewAdd(this._buildViewData(data.vId, data.curSec), data.prevSibId)
                this._scroll(data.vId)
                this.eventSvc.$broadcast('view.selected')
            })
        )

        this.subs.push(
            // this.eventSvc.$on<string>('view.scroll', (viewId) => {
            //     this._scroll(viewId)
            // }),
            this.eventSvc.$on<veCoreEvents.buttonClicked>(this.bbId, (data) => {
                switch (data.clicked) {
                    case 'show-comments':
                        this.bbApi.toggleButton(
                            'show-comments',
                            this.rootScopeSvc.veCommentsOn(!this.rootScopeSvc.veCommentsOn())
                        )
                        break

                    case 'show-elements':
                        this.bbApi.toggleButton(
                            'show-elements',
                            this.rootScopeSvc.veElementsOn(!this.rootScopeSvc.veElementsOn())
                        )
                        if (!this.rootScopeSvc.veElementsOn() && this.rootScopeSvc.veEditMode()) {
                            this.bbApi.toggleButton('show-edits', false)
                            this.rootScopeSvc.veEditMode(false)
                        }
                        break

                    case 'show-edits':
                        this.bbApi.toggleButton(
                            'show-edits',
                            this.rootScopeSvc.veEditMode(!this.rootScopeSvc.veEditMode())
                        )
                        if (this.rootScopeSvc.veElementsOn() !== this.rootScopeSvc.veEditMode()) {
                            this.bbApi.toggleButton('show-elements', this.rootScopeSvc.veEditMode())
                            this.rootScopeSvc.veElementsOn(this.rootScopeSvc.veEditMode())
                        }
                        break
                    case 'show-numbering':
                        this.bbApi.toggleButton(
                            'show-numbering',
                            this.rootScopeSvc.veNumberingOn(!this.rootScopeSvc.veNumberingOn())
                        )
                        break
                    case 'convert-pdf':
                        this.fullDocumentApi.loadRemainingViews(() => {
                            void this.appUtilsSvc.printModal(
                                angular.element('#print-div'),
                                this.mmsDocument,
                                this.mmsRef,
                                true,
                                3
                            )
                        })
                        break
                    case 'print':
                        this.fullDocumentApi.loadRemainingViews(() => {
                            void this.appUtilsSvc.printModal(
                                angular.element('#print-div'),
                                this.mmsDocument,
                                this.mmsRef,
                                true,
                                1
                            )
                        })
                        break
                    case 'word':
                        this.fullDocumentApi.loadRemainingViews(() => {
                            void this.appUtilsSvc.printModal(
                                angular.element('#print-div'),
                                this.mmsDocument,
                                this.mmsRef,
                                true,
                                2
                            )
                        })
                        break

                    case 'tabletocsv':
                        this.fullDocumentApi.loadRemainingViews(() => {
                            this.appUtilsSvc.tableToCsv(angular.element('#print-div'), true)
                        })
                        break

                    case 'refresh-numbering':
                        this.fullDocumentApi.loadRemainingViews(() => {
                            this.views.forEach((view) => {
                                if (this.treeSvc.branch2viewNumber[view.id]) {
                                    view.number = this.treeSvc.branch2viewNumber[view.id]
                                }
                            })
                        })
                        break
                }
            })
        )

        this.subs.push(
            this.eventSvc.binding<boolean>(TreeService.events.UPDATED, (data) => {
                if (!data) return
                this.fullDocumentApi.loadRemainingViews(() => {
                    this.views.forEach((view) => {
                        if (this.treeSvc.branch2viewNumber[view.id]) {
                            view.number = this.treeSvc.branch2viewNumber[view.id]
                        }
                    })
                })
            })
        )
    }

    $onDestroy(): void {
        this.eventSvc.$destroy(this.subs)
        this.buttonBarSvc.destroy(this.bbId)
    }

    $postLink(): void {
        // Send view to kick off tree compilation
        const data: veAppEvents.elementSelectedData = {
            rootId: this.mmsDocument.id,
            elementId: this.mmsView ? this.mmsView.id : this.mmsDocument.id,
            commitId: 'latest',
            projectId: this.mmsProject.id,
            refId: this.mmsRef.id,
            refType: this.mmsRef.type,
            refresh: this.$uiRouterGlobals.transition.$from().name === '',
        }

        this.eventSvc.$broadcast<veAppEvents.elementSelectedData>('view.selected', data)
        this.fullDocumentApi = this.fullDocumentSvc.get()
        this.views = this.fullDocumentApi.viewsBuffer
        this._createViews()
        const scrollVisible = (): boolean => {
            return this.scrollApi.isScrollVisible()
        }
        this.fullDocumentApi.addInitialViews(scrollVisible)
        if (this.mmsView && this.mmsView.id !== this.mmsDocument.id) {
            this._scroll(this.mmsView.id)
        }
    }

    uiOnParamsChanged(newValues: ParamsObject, $transition$: Transition): void {
        if (newValues.viewId !== this.processed) this._scroll(newValues.viewId)
    }
    uiCanExit(transition: Transition): HookResult {
        //Do nothing
    }
    public bbInit = (api: ButtonBarApi): void => {
        if (
            this.mmsDocument &&
            this.mmsRef.type === 'Branch' &&
            this.permissionsSvc.hasBranchEditPermission(this.mmsProject.id, this.mmsRef.id)
        ) {
            api.addButton(this.buttonBarSvc.getButtonBarButton('show-edits'))
            api.toggleButton('show-edits', this.rootScopeSvc.veEditMode())

            this.hotkeys.bindTo(this.$scope).add({
                combo: 'alt+d',
                description: 'toggle edit mode',
                callback: () => {
                    this.eventSvc.$broadcast<veCoreEvents.buttonClicked>(this.bbId, {
                        clicked: 'show-edits',
                    })
                },
            })
        }

        api.addButton(this.buttonBarSvc.getButtonBarButton('show-elements'))
        api.toggleButton('show-elements', this.rootScopeSvc.veElementsOn())
        api.addButton(this.buttonBarSvc.getButtonBarButton('show-comments'))
        api.toggleButton('show-comments', this.rootScopeSvc.veCommentsOn())
        api.addButton(this.buttonBarSvc.getButtonBarButton('show-numbering'))
        api.toggleButton('show-numbering', this.rootScopeSvc.veNumberingOn())
        api.addButton(this.buttonBarSvc.getButtonBarButton('refresh-numbering'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('print'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('export'))

        this.hotkeys
            .bindTo(this.$scope)
            .add({
                combo: 'alt+c',
                description: 'toggle show comments',
                callback: () => {
                    this.eventSvc.$broadcast<veCoreEvents.buttonClicked>(this.bbId, {
                        clicked: 'show-comments',
                    })
                },
            })
            .add({
                combo: 'alt+e',
                description: 'toggle show elements',
                callback: () => {
                    this.eventSvc.$broadcast<veCoreEvents.buttonClicked>(this.bbId, {
                        clicked: 'show-elements',
                    })
                },
            })
    }

    private _scroll = (viewId: string): void => {
        if (this.view2Children[viewId]) {
            const data = {
                rootId: this.$state.includes('**.portal.**') ? null : this.mmsDocument.id,
                elementId: viewId,
                commitId: 'latest',
                projectId: this.mmsProject.id,
                refId: this.mmsRef.id,
                refType: this.mmsRef.type,
            }

            this.eventSvc.$broadcast<veAppEvents.elementSelectedData>('element.selected', data)
            if (viewId === this.processed) return
            this.processed = viewId
            this.fullDocumentApi.handleClickOnBranch(viewId, () => {
                document.getElementById(viewId).scrollIntoView(true)
            })
        }
    }

    private _createViews = (): void => {
        const message = this._loadingViewsFromServer()
        this.views.push({
            id: this.mmsDocument.id,
            api: {
                elementTranscluded: this._elementTranscluded,
                elementClicked: this._elementClicked,
            },
        })
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
                this.view2Node,
                this._handleSingleView
            )
            .then((childIds: string[]) => {
                for (let i = 0; i < childIds.length; i++) {
                    this._constructViews(childIds[i], this.num.toString(10))
                    this.num = this.num + 1
                }
            })
            .finally(() => {
                message.destroy()
            })
    }

    private _loadingViewsFromServer = (): angular.growl.IGrowlMessage => {
        return this.growl.info('Loading data from server!', { ttl: -1 })
    }

    private _elementTranscluded = (elementOb: ElementObject, type: string): void => {
        if (elementOb && type !== 'Comment') {
            if (elementOb._modified && elementOb._modified > this.latestElement)
                this.latestElement = elementOb._modified
        }
    }

    private _elementClicked = (elementOb: ElementObject): void => {
        const data = {
            rootOb: this.$state.includes('**.portal.**') ? null : this.mmsDocument.id,
            elementId: elementOb.id,
            projectId: elementOb._projectId,
            refId: elementOb._refId,
            commitId: 'latest',
        }
        this.eventSvc.$broadcast<veAppEvents.elementSelectedData>('element.selected', data)
    }

    private _buildViewData = (vId: string, curSec: string): ViewData => {
        return {
            id: vId,
            api: {
                elementTranscluded: this._elementTranscluded,
                elementClicked: this._elementClicked,
            },
            number: curSec,
            topLevel: curSec ? curSec.toString().indexOf('.') === -1 : false,
            first: curSec == '1',
        }
    }

    private _constructViews = (viewId: string, curSection: string): void => {
        this.views.push(this._buildViewData(viewId, curSection))

        if (this.view2Children[viewId] && Array.isArray(this.view2Children[viewId])) {
            let num = 1
            const childIds = this.view2Children[viewId]
            for (let i = 0; i < childIds.length; i++) {
                this._constructViews(this.view2Children[viewId][i], `${curSection}.${num}`)
                num = num + 1
            }
        }
    }

    private _handleSingleView = (v: ViewObject, aggr: string): string[] => {
        let childIds = this.view2Children[v.id]
        if (!childIds) {
            childIds = []
        }
        this.view2Children[v.id] = childIds
        if (!v._childViews || v._childViews.length === 0 || aggr === 'none') {
            return childIds
        }
        for (let i = 0; i < v._childViews.length; i++) {
            if (this.seenViewIds[v._childViews[i].id]) {
                continue
            }
            this.seenViewIds[v._childViews[i].id] = true
            childIds.push(v._childViews[i].id)
        }
        return childIds
    }

    public notifyOnScroll = (): boolean => {
        return this.fullDocumentApi.handleDocumentScrolling()
    }

    public copyToClipboard = ($event: JQuery.ClickEvent): void => {
        this.shortUrlSvc.copyToClipboard(this.$element, $event).then(
            () => {
                this.growl.info('Copied to clipboard!', { ttl: 2000 })
            },
            (err) => {
                this.growl.error('Unable to copy: ' + err.message)
            }
        )
    }
}

/* Controller */
const DocumentComponent: VeComponentOptions = {
    selector: 'document',
    template: `
    <div>
    <ng-pane pane-id="center-toolbar" pane-closed="false" pane-anchor="north" pane-size="36px" pane-no-toggle="true" pane-no-scroll="true" parent-ctrl="$ctrl">
        <div class="pane-center-toolbar">
            <div class="share-link">
                <button type="button" class="btn btn-tools btn-sm share-url" uib-tooltip="Share Page" tooltip-placement="bottom" tooltip-popup-delay="100"
                popover-trigger="outsideClick" uib-popover-template="$ctrl.dynamicPopover.templateUrl" popover-title="{{$ctrl.dynamicPopover.title}}" popover-placement="bottom-left">
                <i class="fa-solid fa-share-from-square"></i></button>
            </div>
            <div class="pane-center-btn-group">
                <button-bar button-id="$ctrl.bbId" class="bordered-button-bar"></button-bar>
            </div>
        </div>
    </ng-pane>
    <ng-pane pane-id="center-view" pane-closed="false" pane-anchor="center" pane-no-toggle="true" parent-ctrl="$ctrl">
        <i class="pane-center-spinner fa fa-5x fa-spinner fa-spin" ng-show="$ctrl.viewContentLoading"></i>
        <div class="ve-notify-banner" ng-show="$ctrl.mmsRef.type === 'Tag'">
            <span><strong>Tags are read only:</strong> Switch to a branch to edit</span>
        </div>
        <div class="container-fluid ve-secondary-text"> Document Last Modified: {{ $ctrl.latestElement | date:'M/d/yy h:mm a' }}</div>
        <div class="pane-center container-fluid" id="print-div">
            <div ng-repeat="view in $ctrl.views track by view.id" ng-class="{chapter: view.topLevel, 'first-chapter': view.first}">
                <view mms-element-id="{{view.id}}" mms-commit-id="latest" mms-project-id="{{$ctrl.mmsProject.id}}" mms-ref-id="{{$ctrl.mmsRef.id}}" mms-number="{{view.number}}" mms-view-api="view.api"></view>
            </div>
        </div>
    </ng-pane>
</div>

<script type="text/ng-template" id="shareUrlTemplate.html">
    <p id="ve-short-url">
        {{($ctrl.shortUrl)}}
    </p>
    <button ng-click="$ctrl.copyToClipboard($event)" class="btn btn-sm btn-default"><i class="fa fa-copy"></i>Copy</button>
</script>    
`,
    bindings: {
        mmsProject: '<',
        mmsRef: '<',
        mmsView: '<',
        mmsDocument: '<',
    },
    controller: FullDocumentController,
}

veApp.component(DocumentComponent.selector, DocumentComponent)
