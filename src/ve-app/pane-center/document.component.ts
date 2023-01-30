import { IPaneScrollApi } from '@openmbee/pane-layout/lib/components/ng-pane'
import { StateService } from '@uirouter/angularjs'
import angular, { IComponentController } from 'angular'
import Rx from 'rx-lite'

import { veAppEvents } from '@ve-app/events'
import { AppUtilsService } from '@ve-app/main/services'
import { ContentWindowService } from '@ve-app/pane-center/services/ContentWindow.service'
import {
    IButtonBarButton,
    ButtonBarApi,
    ButtonBarService,
} from '@ve-core/button-bar'
import { TreeService } from '@ve-core/tree'
import {
    PermissionsService,
    ViewData,
    ViewService,
    URLService,
} from '@ve-utils/mms-api-client'
import {
    EventService,
    FullDocumentService,
    FullDocumentServiceFactory,
    RootScopeService,
    ShortenUrlService,
    UtilsService,
} from '@ve-utils/services'

import { veApp } from '@ve-app'

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular'
import {
    DocumentObject,
    ElementObject,
    ProjectObject,
    RefObject,
    ViewObject,
} from '@ve-types/mms'
import { TreeBranch, View2NodeMap } from '@ve-types/tree'

class FullDocumentController implements IComponentController {
    //Bindings
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
    fullDocumentSvc: FullDocumentService
    viewContentLoading: boolean
    buttons: IButtonBarButton[] = []
    latestElement: Date
    scrollApi: IPaneScrollApi
    views: ViewData[] = []
    view2Children: { [key: string]: string[] } = {}
    view2Node: View2NodeMap = {}
    num = 1
    seenViewIds = {}
    shortUrl: string = ''

    private dynamicPopover: {
        templateUrl: string
        title: string
    }

    static $inject = [
        '$q',
        '$scope',
        '$element',
        '$state',
        '$anchorScroll',
        '$location',
        '$timeout',
        '$http',
        'hotkeys',
        'growl',
        'FullDocumentService',
        'ShortenUrlService',
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
        private $anchorScroll: angular.IAnchorScrollService,
        private $location: angular.ILocationService,
        private $timeout: angular.ITimeoutService,
        private $http: angular.IHttpService,
        private hotkeys: angular.hotkeys.HotkeysProvider,
        private growl: angular.growl.IGrowlService,
        private fullDocumentFcty: FullDocumentServiceFactory,
        private shortenUrlSvc: ShortenUrlService,
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
        this.eventSvc.$init(this)

        this.treeSvc.waitForApi('contents').then(
            () => {
                this.bbApi = this.buttonBarSvc.initApi(
                    this.bbId,
                    this.bbInit,
                    this
                )

                this.view2Node[this.mmsDocument.id] = {
                    label: this.mmsDocument.name,
                    data: this.mmsDocument,
                    type: 'view',
                    children: [],
                }
                this.view2Children[this.mmsDocument.id] = []

                // Share URL button settings
                this.dynamicPopover = this.shortenUrlSvc.dynamicPopover

                this.shortUrl = this.shortenUrlSvc.getShortUrl({
                    orgId: this.mmsProject.orgId,
                    projectId: this.mmsProject.id,
                    refId: this.mmsRef.id,
                    documentId: this.mmsDocument.id,
                })

                this.viewContentLoading =
                    this.rootScopeSvc.veViewContentLoading(false)
            },
            (reason) => {
                console.log('Error: ' + reason.message)
            }
        )

        this.subs.push(
            this.eventSvc.$on<boolean>(
                this.rootScopeSvc.constants.VEVIEWCONTENTLOADING,
                (data) => {
                    this.viewContentLoading = data
                }
            )
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
            this.eventSvc.$on<TreeBranch>('mms-tree-click', (branch) => {
                this.fullDocumentSvc.handleClickOnBranch(branch, () => {
                    this.$location.hash(branch.data.id)
                    this.$anchorScroll()
                })
            })
        )

        this.subs.push(
            this.eventSvc.$on(
                'mmsView.deleted',
                (deletedBranch: TreeBranch) => {
                    this.fullDocumentSvc.handleViewDelete(deletedBranch)
                }
            )
        )

        this.subs.push(
            this.eventSvc.$on(
                'mmsView.added',
                (data: veAppEvents.viewAddedData) => {
                    this.fullDocumentSvc.handleViewAdd(
                        this._buildViewData(data.vId, data.curSec),
                        data.prevSibId
                    )
                }
            )
        )

        this.subs.push(
            this.eventSvc.$on('show-comments', (data?: boolean) => {
                this.bbApi.toggleButtonState(
                    'show-comments',
                    data != null ? data : null
                )
                this.rootScopeSvc.veCommentsOn(
                    data != null ? data : !this.rootScopeSvc.veCommentsOn()
                )
            })
        )

        this.subs.push(
            this.eventSvc.$on('show-elements', (data?: boolean) => {
                this.bbApi.toggleButtonState(
                    'show-elements',
                    data != null ? data : null
                )
                this.rootScopeSvc.veElementsOn(
                    data != null ? data : !this.rootScopeSvc.veElementsOn()
                )
                if (
                    !this.rootScopeSvc.veElementsOn() &&
                    this.rootScopeSvc.veEditMode()
                ) {
                    this.eventSvc.$broadcast('show-edits', false)
                }
            })
        )

        this.subs.push(
            this.eventSvc.$on('show-edits', (data?: boolean) => {
                this.bbApi.toggleButtonState(
                    'show-edits',
                    data != null ? data : null
                )
                this.rootScopeSvc.veEditMode(
                    data != null ? data : !this.rootScopeSvc.veEditMode()
                )
                if (
                    (this.rootScopeSvc.veElementsOn() &&
                        !this.rootScopeSvc.veEditMode()) ||
                    (!this.rootScopeSvc.veElementsOn() &&
                        this.rootScopeSvc.veEditMode())
                ) {
                    this.eventSvc.$broadcast(
                        'show-elements',
                        this.rootScopeSvc.veEditMode()
                    )
                }
            })
        )

        if (!this.rootScopeSvc.veFullDocMode())
            this.rootScopeSvc.veFullDocMode(true)
        if (this.rootScopeSvc.veCommentsOn())
            this.eventSvc.$broadcast('show-comments', false)
        if (this.rootScopeSvc.veElementsOn())
            this.eventSvc.$broadcast('show-elements', false)
        if (this.rootScopeSvc.veEditMode())
            this.eventSvc.$broadcast('show-edits', false)

        this.subs.push(
            this.eventSvc.$on('convert-pdf', () => {
                this.fullDocumentSvc.loadRemainingViews(() => {
                    this.appUtilsSvc
                        .printModal(
                            angular.element('#print-div'),
                            this.mmsDocument,
                            this.mmsRef,
                            true,
                            3
                        )
                        .then(
                            (ob) => {
                                this.growl.info(
                                    'Exporting as PDF file. Please wait for a completion email.',
                                    { ttl: -1 }
                                )
                            },
                            (reason) => {
                                this.growl.error(
                                    'Exporting as PDF file Failed: ' +
                                        reason.message
                                )
                            }
                        )
                })
            })
        )

        this.subs.push(
            this.eventSvc.$on('print', () => {
                this.fullDocumentSvc.loadRemainingViews(() => {
                    void this.appUtilsSvc.printModal(
                        angular.element('#print-div'),
                        this.mmsDocument,
                        this.mmsRef,
                        true,
                        1
                    )
                })
            })
        )

        this.subs.push(
            this.eventSvc.$on('word', () => {
                this.fullDocumentSvc.loadRemainingViews(() => {
                    this.appUtilsSvc
                        .printModal(
                            angular.element('#print-div'),
                            this.mmsDocument,
                            this.mmsRef,
                            true,
                            2
                        )
                        .then(
                            (ob) => {
                                this.growl.info(
                                    'Exporting as Word file. Please wait for a completion email.',
                                    { ttl: -1 }
                                )
                            },
                            (reason) => {
                                this.growl.error(
                                    'Exporting as Word file Failed: ' +
                                        reason.message
                                )
                            }
                        )
                })
            })
        )

        this.subs.push(
            this.eventSvc.$on('tabletocsv', () => {
                this.fullDocumentSvc.loadRemainingViews(() => {
                    this.appUtilsSvc.tableToCsv(
                        angular.element('#print-div'),
                        true
                    )
                })
            })
        )

        this.subs.push(
            this.eventSvc.$on('refresh-numbering', (reNumOnly: boolean) => {
                this.fullDocumentSvc.loadRemainingViews(() => {
                    if (!reNumOnly) {
                        this.treeSvc
                            .getApi('contents')
                            .refresh()
                            .then(
                                () => {
                                    this.views.forEach((view) => {
                                        if (
                                            this.treeSvc.getApi('contents')
                                                .branch2viewNumber[view.id]
                                        ) {
                                            view.number =
                                                this.treeSvc.getApi(
                                                    'contents'
                                                ).branch2viewNumber[view.id]
                                        }
                                    })
                                },
                                (reason) => {
                                    this.growl.error(
                                        TreeService.treeError(reason)
                                    )
                                }
                            )
                    } else {
                        this.views.forEach((view) => {
                            if (
                                this.treeSvc.getApi('contents')
                                    .branch2viewNumber[view.id]
                            ) {
                                view.number =
                                    this.treeSvc.getApi(
                                        'contents'
                                    ).branch2viewNumber[view.id]
                            }
                        })
                    }
                })
            })
        )
    }

    $postLink(): void {
        void this._createViews().then(() => {
            // The Controller codes get executed before all the directives'
            // code in its template ( full-doc.html ). As a result, use $timeout here
            // to let them finish first because in this case
            // we rely on ng-pane directive to setup isScrollVisible
            this.fullDocumentSvc = this.fullDocumentFcty.get(this.views)
            const scrollVisible = (): boolean => {
                return this.scrollApi.isScrollVisible()
            }
            this.fullDocumentSvc.addInitialViews(scrollVisible)
            this.views = this.fullDocumentSvc.viewsBuffer
        })
    }

    public bbInit = (api: ButtonBarApi): void => {
        if (
            this.mmsDocument &&
            this.mmsRef.type === 'Branch' &&
            this.permissionsSvc.hasBranchEditPermission(
                this.mmsProject.id,
                this.mmsRef.id
            )
        ) {
            api.addButton(this.buttonBarSvc.getButtonBarButton('show-edits'))
            api.setToggleState('show-edits', this.rootScopeSvc.veEditMode())

            this.hotkeys.bindTo(this.$scope).add({
                combo: 'alt+d',
                description: 'toggle edit mode',
                callback: () => {
                    this.eventSvc.$broadcast('show-edits')
                },
            })
        }
        api.addButton(this.buttonBarSvc.getButtonBarButton('share-url'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('show-elements'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('show-comments'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('refresh-numbering'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('print'))
        const exportButtons: IButtonBarButton =
            this.buttonBarSvc.getButtonBarButton('export')
        if (!exportButtons.dropdown_buttons) {
            exportButtons.dropdown_buttons = [] as IButtonBarButton[]
        }
        exportButtons.dropdown_buttons.push(
            this.buttonBarSvc.getButtonBarButton('convert-pdf')
        )

        api.addButton(exportButtons)
        api.setToggleState('show-comments', this.rootScopeSvc.veCommentsOn())
        api.setToggleState('show-elements', this.rootScopeSvc.veElementsOn())

        this.hotkeys
            .bindTo(this.$scope)
            .add({
                combo: 'alt+c',
                description: 'toggle show comments',
                callback: () => {
                    this.eventSvc.$broadcast('show-comments')
                },
            })
            .add({
                combo: 'alt+e',
                description: 'toggle show elements',
                callback: () => {
                    this.eventSvc.$broadcast('show-elements')
                },
            })
    }

    private _createViews = (): VePromise<void, void> => {
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
        return this.viewSvc
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

    private _elementTranscluded = (
        elementOb: ElementObject,
        type: string
    ): void => {
        if (elementOb && type !== 'Comment') {
            if (elementOb._modified && elementOb._modified > this.latestElement)
                this.latestElement = elementOb._modified
        }
    }

    private _elementClicked = (elementOb: ElementObject): void => {
        const data = {
            elementOb: elementOb,
            commitId: 'latest',
        }
        this.eventSvc.$broadcast('element.selected', data)
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

        if (
            this.view2Children[viewId] &&
            Array.isArray(this.view2Children[viewId])
        ) {
            let num = 1
            const childIds = this.view2Children[viewId]
            for (let i = 0; i < childIds.length; i++) {
                this._constructViews(
                    this.view2Children[viewId][i],
                    `${curSection}.${num}`
                )
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
        return this.fullDocumentSvc.handleDocumentScrolling()
    }

    public copyToClipboard = ($event: JQuery.ClickEvent): void => {
        this.shortenUrlSvc.copyToClipboard(this.$element, $event)
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
                <button-bar button-api="$ctrl.bbApi" class="bordered-button-bar"></button-bar>
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
        mmsDocument: '<',
    },
    controller: FullDocumentController,
}

veApp.component(DocumentComponent.selector, DocumentComponent)
