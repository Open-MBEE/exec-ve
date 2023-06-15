import { HookResult, Ng1Controller, StateService, UIRouterGlobals } from '@uirouter/angularjs';
import { Transition } from '@uirouter/core';

import { AppUtilsService, ResolveService } from '@ve-app/main/services';
import { pane_center_buttons } from '@ve-app/pane-center/pane-center-buttons.config';
import { ContentWindowService } from '@ve-app/pane-center/services/ContentWindow.service';
import { TreeService } from '@ve-components/trees';
import { ButtonBarApi, ButtonBarService } from '@ve-core/button-bar';
import { veCoreEvents } from '@ve-core/events';
import { RootScopeService, ShortUrlService, UtilsService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { PermissionsService, URLService, ViewApi } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

import { VeComponentOptions, VeQService } from '@ve-types/angular';
import {
    DocumentObject,
    ElementObject,
    GroupObject,
    ParamsObject,
    ProjectObject,
    RefObject,
    ViewObject,
} from '@ve-types/mms';

/**
 * Note: This controller is intended for navigating between 'views' and 'sections' only. If you wish to navigate between
 * other tree object types you will need to create a new one or modify this one to be more generic.
 */
class SlideshowController implements angular.IComponentController, Ng1Controller {
    //Bindings
    mmsParams: ParamsObject;
    mmsProject: ProjectObject;
    mmsRef: RefObject;
    mmsGroup: GroupObject;
    mmsDocument: DocumentObject;
    mmsView: ViewObject;

    subs: Rx.IDisposable[];
    vidLink: boolean;
    viewContentLoading: boolean;
    init: boolean = false;

    public bbApi: ButtonBarApi;
    bbId = 'view-ctrl';
    bars: string[] = [];
    comments: {
        count: number;
        lastCommented: string;
        lastCommentedBy: string;
        map: object;
    } = {
        count: 0,
        lastCommented: null,
        lastCommentedBy: '',
        map: {},
    };
    dynamicPopover: { templateUrl: string; title: string };
    shortUrl: string;
    viewApi: ViewApi;
    number: string;
    private viewId: string;
    private params: ParamsObject;

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
        'ShortUrlService',
        'ContentWindowService',
        'PermissionsService',
        'RootScopeService',
        'ResolveService',
        'TreeService',
        'EventService',
        'ButtonBarService',
    ];

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
        private shortUrlSvc: ShortUrlService,
        private contentWindowSvc: ContentWindowService,
        private permissionsSvc: PermissionsService,
        private rootScopeSvc: RootScopeService,
        private resolveSvc: ResolveService,
        private treeSvc: TreeService,
        public eventSvc: EventService,
        private buttonBarSvc: ButtonBarService
    ) {}

    $onInit(): void {
        this.params = this.mmsParams;
        this.rootScopeSvc.veFullDocMode(false);
        this.rootScopeSvc.veHideLeft(false);
        this.rootScopeSvc.veHideRight(false);
        this.eventSvc.$init(this);

        this.bbApi = this.buttonBarSvc.initApi(this.bbId, this.bbInit, pane_center_buttons);

        //Init/Reset Tree Updated Subject
        this.eventSvc.resolve<boolean>(TreeService.events.UPDATED, false);

        this.subs.push(
            this.eventSvc.binding<boolean>(this.rootScopeSvc.constants.VEVIEWCONTENTLOADING, (newValue) => {
                this.viewContentLoading = newValue;
            })
        );

        this.initView();

        this.subs.push(
            this.eventSvc.$on<veCoreEvents.buttonClicked>(this.bbId, (data) => {
                if (data.clicked === 'show-comments') {
                    this.bbApi.toggleButton(
                        'show-comments',
                        this.rootScopeSvc.veCommentsOn(!this.rootScopeSvc.veCommentsOn())
                    );
                    return;
                } else if (data.clicked === 'show-numbering') {
                    this.bbApi.toggleButton(
                        'show-numbering',
                        this.rootScopeSvc.veNumberingOn(!this.rootScopeSvc.veNumberingOn())
                    );
                    return;
                } else if (data.clicked === 'show-elements') {
                    this.bbApi.toggleButton(
                        'show-elements',
                        this.rootScopeSvc.veElementsOn(!this.rootScopeSvc.veElementsOn())
                    );
                    if (!this.rootScopeSvc.veElementsOn() && this.rootScopeSvc.veEditMode()) {
                        this.bbApi.toggleButton('show-edits', false);
                        this.rootScopeSvc.veEditMode(false);
                    }
                    return;
                } else if (data.clicked === 'show-edits') {
                    this.bbApi.toggleButton(
                        'show-edits',
                        this.rootScopeSvc.veEditMode(!this.rootScopeSvc.veEditMode())
                    );
                    if (this.rootScopeSvc.veElementsOn() !== this.rootScopeSvc.veEditMode()) {
                        this.bbApi.toggleButton('show-elements', this.rootScopeSvc.veEditMode());
                        this.rootScopeSvc.veElementsOn(this.rootScopeSvc.veEditMode());
                    }
                    return;
                } else if (data.clicked === 'center-previous') {
                    this.treeSvc.getPrevBranch(this.treeSvc.getSelectedBranch(), ['view', 'section']).then(
                        (prev) => {
                            this.bbApi.toggleButtonSpinner('center-previous');
                            this.treeSvc.selectBranch(prev).catch((reason) => {
                                this.growl.error(TreeService.treeError(reason));
                            });
                            this.bbApi.toggleButtonSpinner('center-previous');
                        },
                        (reason) => {
                            if (reason.status === 200) this.growl.info(reason.message);
                            else this.growl.error(reason.message);
                        }
                    );
                    return;
                } else if (data.clicked === 'center-next') {
                    this.treeSvc.getNextBranch(this.treeSvc.getSelectedBranch(), ['view', 'section']).then(
                        (next) => {
                            this.bbApi.toggleButtonSpinner('center-next');
                            this.treeSvc.selectBranch(next).catch((reason) => {
                                this.growl.error(TreeService.treeError(reason));
                            });
                            this.bbApi.toggleButtonSpinner('center-next');
                        },
                        (reason) => {
                            if (reason.status === 200) this.growl.info(reason.message);
                            else this.growl.error(reason.message);
                        }
                    );
                    return;
                } else if (data.clicked === 'convert-pdf') {
                    if (this.isPageLoading()) return;
                    void this.appUtilsSvc.printModal(
                        angular.element('#print-div'),
                        this.mmsView,
                        this.mmsRef,
                        false,
                        3
                    );
                    return;
                } else if (data.clicked === 'print') {
                    if (this.isPageLoading()) return;
                    void this.appUtilsSvc.printModal(
                        angular.element('#print-div'),
                        this.mmsView,
                        this.mmsRef,
                        false,
                        1
                    );
                    return;
                } else if (data.clicked === 'word') {
                    if (this.isPageLoading()) return;
                    void this.appUtilsSvc.printModal(
                        angular.element('#print-div'),
                        this.mmsView,
                        this.mmsRef,
                        false,
                        2
                    );
                    return;
                } else if (data.clicked === 'tabletocsv') {
                    if (this.isPageLoading()) return;
                    this.appUtilsSvc.tableToCsv(angular.element('#print-div'), false);
                    return;
                } else if (data.clicked === 'refresh-numbering') {
                    this.utilsSvc.makeTablesAndFiguresTOC(this.treeSvc.getFirstBranch(), angular.element('#print-div'), true, false);
                    return;
                }
            })
        );
    }

    uiOnParamsChanged(newValues: ParamsObject, $transition$: Transition): void {
        if (newValues.viewId && newValues.viewId !== this.params.viewId)
            this.initView($transition$.params() as ParamsObject);
    }
    uiCanExit(transition: Transition): HookResult {
        //Do nothing
    }

    initView = (params?: ParamsObject): void => {
        this.rootScopeSvc.veViewContentLoading(true);

        if (params) {
            this.params = params;
            this.viewId = params.viewId;
        } else if (this.mmsDocument || this.mmsView) {
            this.viewId = this.mmsView ? this.mmsView.id : this.mmsDocument.id;
        } else {
            return;
        }

        this.rootScopeSvc.veViewContentLoading(false);

        this.vidLink = false; //whether to have go to document link
        if (
            this.$state.includes('main.project.ref.portal.preview') &&
            this.mmsDocument &&
            this.mmsDocument.id.indexOf('_cover') < 0
        ) {
            this.vidLink = true;
        }

        this.shortUrl = this.shortUrlSvc.getShortUrl({
            orgId: this.mmsProject.orgId,
            documentId: this.params.documentId ? this.params.documentId : '',
            viewId: this.params.viewId && !this.params.documentId.endsWith('_cover') ? this.params.viewId : '',
            projectId: this.params.projectId,
            refId: this.params.refId,
        });

        if (this.$state.includes('main.project.ref')) {
            const data = {
                rootId: this.$state.includes('**.portal.**') ? this.mmsProject.id : this.mmsDocument.id,
                elementId: this.viewId,
                commitId: 'latest',
                projectId: this.mmsProject.id,
                refId: this.mmsRef.id,
                refType: this.mmsRef.type,
                refresh: this.$uiRouterGlobals.transition.from().name === '',
            };
            this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('view.selected', data);
        }

        this.contentWindowSvc.toggleLeftPane(false);

        this.rootScopeSvc.veNumberingOn(true);

        // Share URL button settings
        this.dynamicPopover = this.shortUrlSvc.dynamicPopover;

        this.viewApi = {
            elementClicked: this.elementClicked,
            elementTranscluded: this.elementTranscluded,
        };
    };

    $onDestroy(): void {
        this.eventSvc.$destroy(this.subs);
        this.buttonBarSvc.destroy(this.bbId);
    }

    public bbInit = (api: ButtonBarApi): void => {
        if (this.mmsRef.type === 'Branch') {
            api.addButton(this.buttonBarSvc.getButtonBarButton('show-edits'));
            api.setPermission(
                'show-edits',
                this.permissionsSvc.hasBranchEditPermission(this.mmsProject.id, this.mmsRef.id)
            );
            api.toggleButton('show-edits', this.rootScopeSvc.veEditMode());
            this.hotkeys.bindTo(this.$scope).add({
                combo: 'alt+d',
                description: 'toggle edit mode',
                callback: () => {
                    this.eventSvc.$broadcast<veCoreEvents.buttonClicked>(this.bbId, {
                        clicked: 'show-edits',
                    });
                },
            });
        }
        api.addButton(this.buttonBarSvc.getButtonBarButton('show-elements'));
        api.toggleButton('show-elements', this.rootScopeSvc.veElementsOn());
        api.addButton(this.buttonBarSvc.getButtonBarButton('show-comments'));
        api.toggleButton('show-comments', this.rootScopeSvc.veCommentsOn());
        api.addButton(this.buttonBarSvc.getButtonBarButton('show-numbering'));
        api.toggleButton('show-numbering', this.rootScopeSvc.veNumberingOn());

        // Set hotkeys for toolbar
        this.hotkeys
            .bindTo(this.$scope)
            .add({
                combo: 'alt+c',
                description: 'toggle show comments',
                callback: () => {
                    this.eventSvc.$broadcast<veCoreEvents.buttonClicked>(this.bbId, {
                        clicked: 'show-comments',
                    });
                },
            })
            .add({
                combo: 'alt+e',
                description: 'toggle show elements',
                callback: () => {
                    this.eventSvc.$broadcast<veCoreEvents.buttonClicked>(this.bbId, {
                        clicked: 'show-elements',
                    });
                },
            });

        if (this.$state.includes('**.present.**')) {
            api.addButton(this.buttonBarSvc.getButtonBarButton('refresh-numbering'));
            api.addButton(this.buttonBarSvc.getButtonBarButton('print'));
            api.addButton(this.buttonBarSvc.getButtonBarButton('export'));
            api.addButton(this.buttonBarSvc.getButtonBarButton('center-previous'));
            api.addButton(this.buttonBarSvc.getButtonBarButton('center-next'));
            // Set hotkeys for toolbar
            this.hotkeys
                .bindTo(this.$scope)
                .add({
                    combo: 'alt+.',
                    description: 'next',
                    callback: () => {
                        this.eventSvc.$broadcast<veCoreEvents.buttonClicked>(this.bbId, {
                            clicked: 'center-next',
                        });
                    },
                })
                .add({
                    combo: 'alt+,',
                    description: 'previous',
                    callback: () => {
                        this.eventSvc.$broadcast<veCoreEvents.buttonClicked>(this.bbId, {
                            clicked: 'center-previous',
                        });
                    },
                });
        } else {
            api.addButton(this.buttonBarSvc.getButtonBarButton('export'));
        }
    };

    public copyToClipboard = ($event: JQuery.ClickEvent): void => {
        this.shortUrlSvc.copyToClipboard(this.$element, $event).then(
            () => {
                this.growl.info('Copied to clipboard!', { ttl: 2000 });
            },
            (err) => {
                this.growl.error('Unable to copy: ' + err.message);
            }
        );
    };

    public elementTranscluded = (elementOb: ElementObject, type): void => {
        if (type === 'Comment' && !this.comments.map.hasOwnProperty(elementOb.id)) {
            this.comments.map[elementOb.id] = elementOb;
            this.comments.count++;
            if (elementOb._modified > this.comments.lastCommented) {
                this.comments.lastCommented = elementOb._modified;
                this.comments.lastCommentedBy = elementOb._modifier;
            }
        }
    };

    public elementClicked = (elementOb: ElementObject): void => {
        const data = {
            rootOb: this.$state.includes('**.portal.**') ? null : this.mmsDocument.id,
            elementId: elementOb.id,
            projectId: elementOb._projectId,
            refId: elementOb._refId,
            commitId: 'latest',
        };
        this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('element.selected', data);
    };

    public isPageLoading = (): boolean => {
        if (this.$element.find('.isLoading').length > 0) {
            this.growl.warning('Still loading!');
            return true;
        }
        return false;
    };
}

/* Controllers */
const SlideshowComponent: VeComponentOptions = {
    selector: 'slideshow',
    template: `
    <div ng-show="$ctrl.viewId">
    <ng-pane pane-id="center-toolbar" pane-closed="false" pane-anchor="north" pane-size="46px" pane-no-toggle="true" pane-no-scroll="true" parent-ctrl="$ctrl">
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
                    <view mms-element-id="{{$ctrl.viewId}}" mms-commit-id="{{$ctrl.params.commitId ? $ctrl.params.commitId : 'latest'}}"
                              mms-project-id="{{$ctrl.mmsProject.id}}" mms-ref-id="{{$ctrl.mmsRef.id}}"
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
};

veApp.component(SlideshowComponent.selector, SlideshowComponent);
