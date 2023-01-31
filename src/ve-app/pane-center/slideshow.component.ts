import { StateService, UIRouterGlobals } from '@uirouter/angularjs'
import angular, { IComponentController } from 'angular'
import Rx from 'rx-lite'

import { veAppEvents } from '@ve-app/events'
import { AppUtilsService, ResolveService } from '@ve-app/main/services'
import { ContentWindowService } from '@ve-app/pane-center/services/ContentWindow.service'
import {
    IButtonBarButton,
    ButtonBarApi,
    ButtonBarService,
} from '@ve-core/button-bar'
import { TreeService } from '@ve-core/tree'
import {
    PermissionsService,
    URLService,
    ViewApi,
} from '@ve-utils/mms-api-client'
import {
    EventService,
    RootScopeService,
    ShortenUrlService,
    UtilsService,
} from '@ve-utils/services'
import { onChangesCallback } from '@ve-utils/utils'

import { veApp } from '@ve-app'

import { VeComponentOptions, VeQService } from '@ve-types/angular'
import {
    DocumentObject,
    ElementObject,
    GroupObject,
    ParamsObject,
    ProjectObject,
    RefObject,
    ViewObject,
} from '@ve-types/mms'

class SlideshowController implements IComponentController {
    //Bindings
    mmsParams: ParamsObject
    mmsProject: ProjectObject
    mmsRef: RefObject
    mmsGroup: GroupObject
    mmsDocument: DocumentObject
    mmsView: ViewObject

    subs: Rx.IDisposable[]
    vidLink: boolean
    viewContentLoading: boolean
    init: boolean = false

    public bbApi: ButtonBarApi
    bbId = 'view-ctrl'
    bars: string[] = []
    comments: {
        count: number
        lastCommented: Date
        lastCommentedBy: string
        map: object
    } = {
        count: 0,
        lastCommented: null,
        lastCommentedBy: '',
        map: {},
    }
    dynamicPopover: { templateUrl: string; title: string }
    shortUrl: string
    viewApi: ViewApi
    number: string
    public viewId: string

    static $inject = [
        '$q',
        '$scope',
        '$state',
        '$timeout',
        '$window',
        '$location',
        '$http',
        '$element',
        '$uiRouterGlobals',
        'growl',
        'hotkeys',
        'AppUtilsService',
        'URLService',
        'UtilsService',
        'ShortenUrlService',
        'ContentWindowService',
        'PermissionsService',
        'RootScopeService',
        'ResolveService',
        'TreeService',
        'EventService',
        'ButtonBarService',
    ]

    constructor(
        public $q: VeQService,
        private $scope: angular.IScope,
        private $state: StateService,
        private $timeout: angular.ITimeoutService,
        private $window: angular.IWindowService,
        private $location: angular.ILocationService,
        private $http: angular.IHttpService,
        private $element: JQuery<HTMLElement>,
        private $uiRouterGlobals: UIRouterGlobals,
        private growl: angular.growl.IGrowlService,
        private hotkeys: angular.hotkeys.HotkeysProvider,
        private appUtilsSvc: AppUtilsService,
        private uRLSvc: URLService,
        private utilsSvc: UtilsService,
        private shortenUrlSvc: ShortenUrlService,
        private contentWindowSvc: ContentWindowService,
        private permissionsSvc: PermissionsService,
        private rootScopeSvc: RootScopeService,
        private resolveSvc: ResolveService,
        private treeSvc: TreeService,
        public eventSvc: EventService,
        private buttonBarSvc: ButtonBarService
    ) {}

    $onInit(): void {
        this.eventSvc.$init(this)
        // if (
        //     this.$state.includes('main.project.ref') &&
        //     !this.$state.includes('main.project.ref.document')
        // ) {
        //     watchChangeEvent(this, 'mmsDocument', this.changeAction, true)
        // } else {
        //     watchChangeEvent(this, 'mmsView', this.changeAction, true)
        // }

        this.treeSvc.waitForApi('contents').then(
            () => {
                this.changeAction()
            },
            (reason) => {
                TreeService.treeError(reason)
            }
        )

        this.subs.push(
            this.eventSvc.$on<boolean>(
                this.rootScopeSvc.constants.VEVIEWCONTENTLOADING,
                (newValue) => {
                    this.viewContentLoading = newValue
                }
            )
        )

        this.subs.push(
            this.eventSvc.$on(TreeService.events.UPDATED, () => {
                if (
                    this.mmsView &&
                    this.treeSvc.getApi('contents').branch2viewNumber[
                        this.mmsView.id
                    ]
                ) {
                    this.number =
                        this.treeSvc.getApi('contents').branch2viewNumber[
                            this.mmsView.id
                        ]
                }
            })
        )

        // this.subs.push(
        //     this.eventSvc.$on<TreeBranch>('mms-tree-click', (branch) => {
        //         if (branch.data.id != this.mmsView.id) {
        //             this.mmsView = branch.data
        //             this.changeAction()
        //         }
        //     })
        // )

        this.subs.push(
            this.eventSvc.$on('show-comments', (data?: boolean) => {
                this.bbApi.toggleButtonState(
                    'show-comments',
                    this.rootScopeSvc.veCommentsOn(
                        data != null ? data : !this.rootScopeSvc.veCommentsOn()
                    )
                )
            })
        )

        this.subs.push(
            this.eventSvc.$on('show-numbering', (data?: boolean) => {
                this.bbApi.toggleButtonState(
                    'show-numbering',
                    !this.rootScopeSvc.veNumberingOn(
                        data != null ? data : !this.rootScopeSvc.veNumberingOn()
                    )
                )
            })
        )

        this.subs.push(
            this.eventSvc.$on('show-elements', (data?: boolean) => {
                this.bbApi.toggleButtonState(
                    'show-elements',
                    this.rootScopeSvc.veElementsOn(
                        data != null ? data : !this.rootScopeSvc.veElementsOn()
                    )
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

        this.subs.push(
            this.eventSvc.$on('center-previous', () => {
                let prev = this.treeSvc
                    .getApi('contents')
                    .getPrevBranch(
                        this.treeSvc.getApi('contents').getSelectedBranch()
                    )
                if (!prev) return
                while (prev.type !== 'view' && prev.type !== 'section') {
                    prev = this.treeSvc.getApi('contents').getPrevBranch(prev)
                    if (!prev) return
                }
                this.bbApi.toggleButtonSpinner('center-previous')
                this.treeSvc
                    .getApi('contents')
                    .selectBranch(prev)
                    .catch((reason) => {
                        TreeService.treeError(reason)
                    })
                this.bbApi.toggleButtonSpinner('center-previous')
            })
        )

        this.subs.push(
            this.eventSvc.$on('center-next', () => {
                let next = this.treeSvc
                    .getApi('contents')
                    .getNextBranch(
                        this.treeSvc.getApi('contents').getSelectedBranch()
                    )
                if (!next) return
                while (next.type !== 'view' && next.type !== 'section') {
                    next = this.treeSvc.getApi('contents').getNextBranch(next)
                    if (!next) return
                }
                this.bbApi.toggleButtonSpinner('center-next')
                this.treeSvc
                    .getApi('contents')
                    .selectBranch(next)
                    .catch((reason) => {
                        TreeService.treeError(reason)
                    })
                this.bbApi.toggleButtonSpinner('center-next')
            })
        )

        this.subs.push(
            this.eventSvc.$on('convert-pdf', () => {
                if (this.isPageLoading()) return
                this.appUtilsSvc
                    .printModal(
                        angular.element('#print-div'),
                        this.mmsView,
                        this.mmsRef,
                        false,
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
        )

        this.subs.push(
            this.eventSvc.$on('print', () => {
                if (this.isPageLoading()) return
                void this.appUtilsSvc
                    .printModal(
                        angular.element('#print-div'),
                        this.mmsView,
                        this.mmsRef,
                        false,
                        1
                    )
                    .catch((reason?) => {
                        if (reason) {
                            this.growl.error('Print Error:' + reason.message)
                        } else {
                            this.growl.info('Print Cancelled', {
                                ttl: 1000,
                            })
                        }
                    })
            })
        )

        this.subs.push(
            this.eventSvc.$on('word', () => {
                if (this.isPageLoading()) return
                this.appUtilsSvc
                    .printModal(
                        angular.element('#print-div'),
                        this.mmsView,
                        this.mmsRef,
                        false,
                        2
                    )
                    .then(
                        (ob) => {
                            this.growl.info(
                                'Exporting as Word file. Please wait for a completion email.',
                                { ttl: -1 }
                            )
                        },
                        (reason?) => {
                            if (reason) {
                                this.growl.error(
                                    'Exporting as Word file Failed: ' +
                                        reason.message
                                )
                            } else {
                                this.growl.info('Export Cancelled', {
                                    ttl: 1000,
                                })
                            }
                        }
                    )
            })
        )

        this.subs.push(
            this.eventSvc.$on('tabletocsv', () => {
                if (this.isPageLoading()) return
                this.appUtilsSvc.tableToCsv(
                    angular.element('#print-div'),
                    false
                )
            })
        )

        this.subs.push(
            this.eventSvc.$on('refresh-numbering', () => {
                if (this.isPageLoading()) return
                this.treeSvc
                    .getApi('contents')
                    .refresh()
                    .then(
                        () => {
                            if (
                                this.mmsView &&
                                this.treeSvc.getApi('contents')
                                    .branch2viewNumber[this.mmsView.id]
                            ) {
                                this.number =
                                    this.treeSvc.getApi(
                                        'contents'
                                    ).branch2viewNumber[this.mmsView.id]
                            }
                        },
                        (reason) => {
                            this.growl.error(
                                'Unable to refresh numbering: ' + reason.message
                            )
                        }
                    )
            })
        )
    }

    $onDestroy(): void {
        this.eventSvc.$destroy(this.subs)
        this.buttonBarSvc.destroy(this.bars)
    }

    changeAction: onChangesCallback<void> = () => {
        this.viewContentLoading = true
        if (!this.init) {
            this.bbApi = this.buttonBarSvc.initApi(this.bbId, this.bbInit, this)
            this.init = true
        }

        this.mmsParams = this.$uiRouterGlobals.params

        if (this.mmsView || this.mmsDocument) {
            this.viewId = this.mmsView ? this.mmsView.id : this.mmsDocument.id
            this.viewContentLoading = false
        } else if (this.mmsParams.viewId || this.mmsParams.documentId) {
            if (this.$state.includes('main.project.ref.preview')) {
                void this.resolveSvc.getDocumentPreview(
                    this.mmsParams,
                    this.mmsRef
                )
                return
            }
        } else {
            return
        }

        this.vidLink = false //whether to have go to document link
        if (
            this.$state.includes('main.project.ref.preview') &&
            this.mmsDocument &&
            this.mmsDocument.id.indexOf('_cover') < 0
        ) {
            this.vidLink = true
        }

        this.shortUrl = this.shortenUrlSvc.getShortUrl({
            orgId: this.mmsProject.orgId,
            documentId:
                this.mmsParams.documentId &&
                !this.mmsParams.documentId.endsWith('_cover')
                    ? this.mmsParams.documentId
                    : '',
            viewId:
                this.mmsParams.viewId &&
                !this.mmsParams.documentId.endsWith('_cover')
                    ? this.mmsParams.viewId
                    : '',
            projectId: this.mmsParams.projectId,
            refId: this.mmsParams.refId,
        })

        if (this.$state.includes('main.project.ref')) {
            const data = {
                elementOb: this.mmsView ? this.mmsView : this.mmsDocument,
                commitId: 'latest',
            }
            this.eventSvc.$broadcast<veAppEvents.viewSelectedData>(
                'view.selected',
                data
            )
        }

        if (this.$state.includes('main.project.ref.portal')) {
            this.contentWindowSvc.toggleLeftPane(false)
        }

        this.rootScopeSvc.veNumberingOn(false)
        if (this.rootScopeSvc.veFullDocMode())
            this.rootScopeSvc.veFullDocMode(false)
        if (this.rootScopeSvc.veCommentsOn())
            this.eventSvc.$broadcast('show-comments', false)
        if (this.rootScopeSvc.veElementsOn())
            this.eventSvc.$broadcast('show-elements', false)
        if (this.rootScopeSvc.veEditMode())
            this.eventSvc.$broadcast('show-edits', false)

        // Share URL button settings
        this.dynamicPopover = this.shortenUrlSvc.dynamicPopover

        this.viewApi = {
            elementClicked: this.elementClicked,
            elementTranscluded: this.elementTranscluded,
        }
        if (
            this.mmsView &&
            this.treeSvc.getApi('contents').branch2viewNumber[this.mmsView.id]
        ) {
            this.number =
                this.treeSvc.getApi('contents').branch2viewNumber[
                    this.mmsView.id
                ]
        }
    }

    public bbInit = (api: ButtonBarApi): void => {
        if (
            this.mmsView &&
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
        api.addButton(this.buttonBarSvc.getButtonBarButton('show-elements'))
        api.setToggleState('show-elements', this.rootScopeSvc.veElementsOn())
        api.addButton(this.buttonBarSvc.getButtonBarButton('show-comments'))
        api.setToggleState('show-comments', this.rootScopeSvc.veCommentsOn())
        api.addButton(this.buttonBarSvc.getButtonBarButton('show-numbering'))
        api.setToggleState('show-numbering', !this.rootScopeSvc.veNumberingOn())

        // Set hotkeys for toolbar
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

        if (
            this.$state.includes('main.project.ref.preview') ||
            this.$state.includes('main.project.ref.document')
        ) {
            api.addButton(
                this.buttonBarSvc.getButtonBarButton('refresh-numbering')
            )
            api.addButton(this.buttonBarSvc.getButtonBarButton('print'))
            if (this.$state.includes('main.project.ref.document')) {
                const exportButtons: IButtonBarButton =
                    this.buttonBarSvc.getButtonBarButton('export')
                if (!exportButtons.dropdown_buttons)
                    exportButtons.dropdown_buttons = []
                exportButtons.dropdown_buttons.push(
                    this.buttonBarSvc.getButtonBarButton('convert-pdf')
                )
                api.addButton(exportButtons)
                api.addButton(
                    this.buttonBarSvc.getButtonBarButton('center-previous')
                )
                api.addButton(
                    this.buttonBarSvc.getButtonBarButton('center-next')
                )
                // Set hotkeys for toolbar
                this.hotkeys
                    .bindTo(this.$scope)
                    .add({
                        combo: 'alt+.',
                        description: 'next',
                        callback: () => {
                            this.eventSvc.$broadcast('center-next')
                        },
                    })
                    .add({
                        combo: 'alt+,',
                        description: 'previous',
                        callback: () => {
                            this.eventSvc.$broadcast('center-previous')
                        },
                    })
            } else {
                api.addButton(this.buttonBarSvc.getButtonBarButton('export'))
            }
        }
    }

    public copyToClipboard = ($event: JQuery.ClickEvent): void => {
        this.shortenUrlSvc.copyToClipboard(this.$element, $event)
    }

    public elementTranscluded = (elementOb: ElementObject, type): void => {
        if (
            type === 'Comment' &&
            !this.comments.map.hasOwnProperty(elementOb.id)
        ) {
            this.comments.map[elementOb.id] = elementOb
            this.comments.count++
            if (elementOb._modified > this.comments.lastCommented) {
                this.comments.lastCommented = elementOb._modified
                this.comments.lastCommentedBy = elementOb._modifier
            }
        }
    }

    public elementClicked = (elementOb: ElementObject): void => {
        const data = {
            elementOb: elementOb,
            commitId: 'latest',
        }
        this.eventSvc.$broadcast('element.selected', data)
    }

    public isPageLoading = (): boolean => {
        if (this.$element.find('.isLoading').length > 0) {
            this.growl.warning('Still loading!')
            return true
        }
        return false
    }
}

/* Controllers */
const SlideshowComponent: VeComponentOptions = {
    selector: 'slideshow',
    template: `
    <div ng-show="$ctrl.viewId">
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
        <div ng-hide="$ctrl.viewContentLoading" class="container-fluid">
            <div class="pane-center-inner">
                <div class="ve-notify-banner" ng-show="$ctrl.mmsRef.type === 'Tag'">
                    <span><strong>Tags are read only:</strong> Switch to a branch to edit</span>
                </div>
                <div class="ve-secondary-text">{{$ctrl.comments.count}} Comment<span ng-if="$ctrl.comments.count !== 1">s</span>
                    <span ng-if="$ctrl.comments.count > 0">
                        , Last Commented {{$ctrl.comments.lastCommented | date:'M/d/yy h:mm a'}} by <b>{{$ctrl.comments.lastCommentedBy}}</b></span>
                </div>
                <div id="print-div" ng-show="$ctrl.viewId">
                    <view mms-element-id="{{$ctrl.viewId}}" mms-commit-id="{{$ctrl.mmsParams.commitId ? $ctrl.mmsParams.commitId : 'latest'}}"
                              mms-project-id="{{$ctrl.mmsParams.projectId}}" mms-ref-id="{{$ctrl.mmsParams.refId}}"
                                mms-link="$ctrl.vidLink" mms-view-api="$ctrl.viewApi" mms-number="{{$ctrl.number}}"></view>
                </div>
            </div>
        </div>
    </ng-pane>
</div>



<script type="text/ng-template" id="shareUrlTemplate.html">
    <p id="ve-short-url">{{($ctrl.shortUrl)}}</p>
    <button ng-click="$ctrl.copyToClipboard($event)" class="btn btn-sm btn-default"><i class="fa fa-copy"></i>Copy</button>
</script>

`,
    bindings: {
        mmsParams: '<',
        mmsProject: '<',
        mmsRef: '<',
        mmsGroup: '<',
        mmsDocument: '<',
        mmsView: '<',
    },
    controller: SlideshowController,
}

veApp.component(SlideshowComponent.selector, SlideshowComponent)
