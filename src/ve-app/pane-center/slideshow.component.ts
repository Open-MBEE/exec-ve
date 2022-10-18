import { StateService } from '@uirouter/angularjs'
import angular from 'angular'
import Rx from 'rx-lite'

import { AppUtilsService } from '@ve-app/main/services'
import { ContentWindowService } from '@ve-app/pane-center/services/ContentWindow.service'
import {
    IButtonBarButton,
    ButtonBarApi,
    ButtonBarService,
} from '@ve-core/button-bar'
import { TreeApi, TreeService } from '@ve-core/tree'
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
import { handleChange } from '@ve-utils/utils'

import { veApp } from '@ve-app'

import { ElementObject } from '@ve-types/mms'
import { VeComponentOptions } from '@ve-types/view-editor'

class SlideshowController implements angular.IComponentController {
    public orgOb
    projectOb
    refOb
    groupOb
    documentOb
    viewOb

    private treeApi: TreeApi
    subs: Rx.IDisposable[]
    vidLink: boolean
    viewContentLoading: boolean

    public bbApi
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
    buttons: any[]
    dynamicPopover: { templateUrl: 'shareUrlTemplate.html'; title: 'Share' }
    copyToClipboard: ($event: any) => void
    handleShareURL: any
    viewApi: ViewApi
    number: string

    static $inject = [
        '$scope',
        '$state',
        '$timeout',
        '$window',
        '$location',
        '$http',
        '$element',
        'growl',
        'hotkeys',
        'AppUtilsService',
        'URLService',
        'UtilsService',
        'ShortenUrlService',
        'ContentWindowService',
        'PermissionsService',
        'RootScopeService',
        'TreeService',
        'EventService',
        'ButtonBarService',
    ]

    constructor(
        private $scope: angular.IScope,
        private $state: StateService,
        private $timeout: angular.ITimeoutService,
        private $window: angular.IWindowService,
        private $location: angular.ILocationService,
        private $http: angular.IHttpService,
        private $element: JQuery<HTMLElement>,
        private growl: angular.growl.IGrowlService,
        private hotkeys: angular.hotkeys.HotkeysProvider,
        private appUtilsSvc: AppUtilsService,
        private uRLSvc: URLService,
        private utilsSvc: UtilsService,
        private shortenUrlSvc: ShortenUrlService,
        private contentWindowSvc: ContentWindowService,
        private permissionsSvc: PermissionsService,
        private rootScopeSvc: RootScopeService,
        private treeSvc: TreeService,
        private eventSvc: EventService,
        private buttonBarSvc: ButtonBarService
    ) {}

    $onInit() {
        this.treeApi = this.treeSvc.getApi()
        this.eventSvc.$init(this)
        if (this.$state.includes('main.project.ref.portal')) {
            this.contentWindowSvc.toggleLeftPane(false)
        }
        this.vidLink = false //whether to have go to document link
        if (
            this.$state.includes('main.project.ref.preview') &&
            this.viewOb &&
            this.viewOb.id.indexOf('_cover') < 0
        ) {
            this.vidLink = true
        }

        this.viewContentLoading = false
        this.rootScopeSvc.veNumberingOn(true)
        if (this.rootScopeSvc.veFullDocMode())
            this.rootScopeSvc.veFullDocMode(false)

        this.subs.push(
            this.eventSvc.$on(
                this.rootScopeSvc.constants.VEVIEWCONTENTLOADING,
                (newValue) => {
                    this.viewContentLoading = newValue
                }
            )
        )

        this.bbApi = this.buttonBarSvc.initApi(
            this.bbId,
            (api: ButtonBarApi) => {
                if (
                    this.viewOb &&
                    this.refOb.type === 'Branch' &&
                    this.permissionsSvc.hasBranchEditPermission(this.refOb)
                ) {
                    api.addButton(
                        this.buttonBarSvc.getButtonBarButton('show-edits')
                    )
                    api.setToggleState(
                        'show-edits',
                        this.rootScopeSvc.veEditMode()
                    )
                    // @ts-ignore
                    this.hotkeys.bindTo(this.$scope).add({
                        combo: 'alt+d',
                        description: 'toggle edit mode',
                        callback: () => {
                            this.eventSvc.$broadcast('show-edits')
                        },
                    })
                }
                api.addButton(
                    this.buttonBarSvc.getButtonBarButton('show-elements')
                )
                api.setToggleState(
                    'show-elements',
                    this.rootScopeSvc.veElementsOn()
                )
                api.addButton(
                    this.buttonBarSvc.getButtonBarButton('show-comments')
                )
                api.setToggleState(
                    'show-comments',
                    this.rootScopeSvc.veCommentsOn()
                )
                api.addButton(
                    this.buttonBarSvc.getButtonBarButton('show-numbering')
                )
                api.setToggleState(
                    'show-numbering',
                    this.rootScopeSvc.veNumberingOn()
                )

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
                        this.buttonBarSvc.getButtonBarButton(
                            'refresh-numbering'
                        )
                    )
                    // api.addButton(this.buttonBarSvc.getButtonBarButton('share-url'));
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
                            this.buttonBarSvc.getButtonBarButton(
                                'center-previous'
                            )
                        )
                        api.addButton(
                            this.buttonBarSvc.getButtonBarButton('center-next')
                        )
                        // Set hotkeys for toolbar
                        // @ts-ignore
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
                        api.addButton(
                            this.buttonBarSvc.getButtonBarButton('export')
                        )
                    }
                }
            },
            this
        )
        //Set BB ID after initalization to prevent bar from starting too soon

        this.buttons = this.bbApi.buttons

        this.subs.push(
            this.eventSvc.$on(TreeService.events.UPDATED, () => {
                if (this.treeApi.branch2viewNumber[this.viewOb.id]) {
                    this.number = this.rootScopeSvc.veNumberingOn()
                        ? this.treeApi.branch2viewNumber[this.viewOb.id]
                        : ''
                }
            })
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
            this.eventSvc.$on('show-numbering', (data?: boolean) => {
                this.bbApi.toggleButtonState(
                    'show-numbering',
                    data != null ? data : null
                )
                this.rootScopeSvc.veNumberingOn(
                    data != null ? data : !this.rootScopeSvc.veNumberingOn()
                )
                this.number = this.rootScopeSvc.veNumberingOn()
                    ? this.treeApi.branch2viewNumber[this.viewOb.id]
                    : ''
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

        this.subs.push(
            this.eventSvc.$on('center-previous', () => {
                let prev = this.treeApi.getPrevBranch(
                    this.treeApi.getSelectedBranch()
                )
                if (!prev) return
                while (prev.type !== 'view' && prev.type !== 'section') {
                    prev = this.treeApi.getPrevBranch(prev)
                    if (!prev) return
                }
                this.bbApi.toggleButtonSpinner('center-previous')
                this.treeApi.selectBranch(prev)
                this.bbApi.toggleButtonSpinner('center-previous')
            })
        )

        this.subs.push(
            this.eventSvc.$on('center-next', () => {
                let next = this.treeApi.getNextBranch(
                    this.treeApi.getSelectedBranch()
                )
                if (!next) return
                while (next.type !== 'view' && next.type !== 'section') {
                    next = this.treeApi.getNextBranch(next)
                    if (!next) return
                }
                this.bbApi.toggleButtonSpinner('center-next')
                this.treeApi.selectBranch(next)
                this.bbApi.toggleButtonSpinner('center-next')
            })
        )

        this.rootScopeSvc.veFullDocMode(false)
        if (this.rootScopeSvc.veCommentsOn())
            this.eventSvc.$broadcast('show-comments', false)
        if (this.rootScopeSvc.veElementsOn())
            this.eventSvc.$broadcast('show-elements', false)
        if (this.rootScopeSvc.veEditMode())
            this.eventSvc.$broadcast('show-edits', false)

        // Share URL button settings
        this.dynamicPopover = this.shortenUrlSvc.dynamicPopover
        this.copyToClipboard = this.shortenUrlSvc.copyToClipboard
        this.handleShareURL = this.shortenUrlSvc.getShortUrl.bind(
            null,
            this.$location.absUrl(),
            this
        )

        if (this.viewOb && this.$state.includes('main.project.ref')) {
            this.$timeout(() => {
                const data = {
                    elementOb: this.viewOb,
                    commitId: 'latest',
                }
                this.eventSvc.$broadcast('view.selected', data)
            }, 1000)
        }

        this.subs.push(
            this.eventSvc.$on('convert-pdf', () => {
                if (this.isPageLoading()) return
                this.appUtilsSvc
                    .printModal(
                        angular.element('#print-div'),
                        this.viewOb,
                        this.refOb,
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
                this.appUtilsSvc.printModal(
                    angular.element('#print-div'),
                    this.viewOb,
                    this.refOb,
                    false,
                    1
                )
            })
        )

        this.subs.push(
            this.eventSvc.$on('word', () => {
                if (this.isPageLoading()) return
                this.appUtilsSvc
                    .printModal(
                        angular.element('#print-div'),
                        this.viewOb,
                        this.refOb,
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
                        (reason) => {
                            this.growl.error(
                                'Exporting as Word file Failed: ' +
                                    reason.message
                            )
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
                this.treeApi.refresh().then(() => {
                    this.treeSvc.refreshPeTrees()
                    this.number = this.treeApi.branch2viewNumber[this.viewOb.id]
                })
            })
        )

        this.viewApi = {
            elementClicked: this.elementClicked,
            elementTranscluded: this.elementTranscluded,
        }

        this.number = this.treeApi.branch2viewNumber[this.viewOb.id]
    }

    $onChanges(onChangesObj: angular.IOnChangesObject) {
        handleChange(onChangesObj, 'viewOb', (newVal) => {
            if (newVal) console.log('View Change:' + newVal.id)
        })
    }

    $onDestroy() {
        this.eventSvc.$destroy(this.subs)
        this.buttonBarSvc.destroy(this.bars)
    }

    public elementTranscluded = (elementOb: ElementObject, type) => {
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

    public elementClicked = (elementOb: ElementObject) => {
        const data = {
            elementOb: elementOb,
            commitId: 'latest',
        }
        this.eventSvc.$broadcast('element.selected', data)
    }

    isPageLoading() {
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
    <div ng-if="$ctrl.viewOb !== null">
    <ng-pane pane-id="center-toolbar" pane-closed="false" pane-anchor="north" pane-size="36px" pane-no-toggle="true" pane-no-scroll="true" parent-ctrl="$ctrl">
        <div class="pane-center-toolbar">
            <div class="pane-center-btn-group">
                <button-bar button-api="$ctrl.bbApi" class="bordered-button-bar"></button-bar>
            </div>
        </div>
    </ng-pane>
    <ng-pane pane-id="center-view" pane-closed="false" pane-anchor="center" pane-no-toggle="true" parent-ctrl="$ctrl">
        <i class="pane-center-spinner fa fa-5x fa-spinner fa-spin" ng-show="$ctrl.viewContentLoading"></i>
        <div ng-hide="$ctrl.viewContentLoading" class="container-fluid">
            <div class="pane-center-inner">
                <div class="ve-notify-banner" ng-show="$ctrl.refOb.type === 'Tag'">
                    <span><strong>Tags are read only:</strong> Switch to a branch to edit</span>
                </div>
                <div class="ve-secondary-text">{{$ctrl.comments.count}} Comment<span ng-if="$ctrl.comments.count !== 1">s</span>
                    <span ng-if="$ctrl.comments.count > 0">
                        , Last Commented {{$ctrl.comments.lastCommented | date:'M/d/yy h:mm a'}} by <b>{{$ctrl.comments.lastCommentedBy}}</b></span>
                </div>
                <div id="print-div" ng-if="$ctrl.viewOb">
                    <view mms-element-id="{{$ctrl.viewOb.id}}" mms-commit-id="latest"
                              mms-project-id="{{$ctrl.projectOb.id}}" mms-ref-id="{{$ctrl.refOb.id}}"
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
        orgOb: '<',
        projectOb: '<',
        refOb: '<',
        groupOb: '<',
        documentOb: '<',
        viewOb: '<',
    },
    controller: SlideshowController,
}

veApp.component(SlideshowComponent.selector, SlideshowComponent)
