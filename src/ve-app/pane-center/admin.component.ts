import { HookResult, Ng1Controller, StateService, UIRouterGlobals } from '@uirouter/angularjs';
import { Transition } from '@uirouter/core';

import { AppUtilsService, ResolveService } from '@ve-app/main/services';
import { pane_center_buttons } from '@ve-app/pane-center/pane-center-buttons.config';
import { ContentWindowService } from '@ve-app/pane-center/services/ContentWindow.service';
import { TreeService } from '@ve-components/trees';
import { ButtonBarApi, ButtonBarService, ButtonWrapEvent } from '@ve-core/button-bar';
import { veCoreEvents } from '@ve-core/events';
import { RootScopeService, ShortUrlService, UtilsService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { PermissionsService, URLService, ViewApi } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

import { VeComponentOptions, VeQService } from '@ve-types/angular';
import {
    AdminObject,
    DocumentObject,
    ElementObject,
    GroupObject,
    OrgObject,
    ParamsObject,
    PermissionsLookupObject,
    ProjectObject,
    RefObject,
    ViewObject,
} from '@ve-types/mms';

/**
 * Note: This controller is intended for navigating between 'views' and 'sections' only. If you wish to navigate between
 * other tree object types you will need to create a new one or modify this one to be more generic.
 */
class AdminController implements angular.IComponentController, Ng1Controller {
    //Bindings
    mmsParams: ParamsObject;
    mmsObject: AdminObject;

    subs: Rx.IDisposable[];
    vidLink: boolean;
    viewContentLoading: boolean;
    init: boolean = false;

    public bbApi: ButtonBarApi;
    bbId = 'view-ctrl';
    bbSize: string = '34px'
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
    private view: AdminObject
    private permissions: PermissionsLookupObject[]

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
        this.rootScopeSvc.veHideRight(true);
        this.eventSvc.$init(this);

        // this.bbApi = this.buttonBarSvc.initApi(this.bbId, this.bbInit, pane_center_buttons);
        // this._setToolbarHeight();

        // this.subs.push(
        //     this.eventSvc.$on(this.bbApi.WRAP_EVENT, (data: ButtonWrapEvent) => {
        //         if (data.oldSize != data.newSize) {
        //             this._setToolbarHeight();
        //         }
        //     })
        // )

        //Init/Reset Tree Updated Subject
        this.eventSvc.resolve<boolean>(TreeService.events.UPDATED, false);

        this.subs.push(
            this.eventSvc.binding<boolean>(this.rootScopeSvc.constants.VEVIEWCONTENTLOADING, (newValue) => {
                this.viewContentLoading = newValue;
            })
        );

        this.initView();

        // this.subs.push(
        //     this.eventSvc.$on<veCoreEvents.buttonClicked>(this.bbId, (data) => {
        //         if (data.clicked === 'show-comments') {
        //             this.bbApi.toggleButton(
        //                 'show-comments',
        //                 this.rootScopeSvc.veCommentsOn(!this.rootScopeSvc.veCommentsOn())
        //             );
        //             return;
        //         } else if (data.clicked === 'show-numbering') {
        //             this.bbApi.toggleButton(
        //                 'show-numbering',
        //                 this.rootScopeSvc.veNumberingOn(!this.rootScopeSvc.veNumberingOn())
        //             );
        //             return;
        //         } else if (data.clicked === 'show-elements') {
        //             this.bbApi.toggleButton(
        //                 'show-elements',
        //                 this.rootScopeSvc.veElementsOn(!this.rootScopeSvc.veElementsOn())
        //             );
        //             if (!this.rootScopeSvc.veElementsOn() && this.rootScopeSvc.veEditMode()) {
        //                 this.bbApi.toggleButton('show-edits', false);
        //                 this.rootScopeSvc.veEditMode(false);
        //             }
        //             return;
        //         } else if (data.clicked === 'show-edits') {
        //             this.bbApi.toggleButton(
        //                 'show-edits',
        //                 this.rootScopeSvc.veEditMode(!this.rootScopeSvc.veEditMode())
        //             );
        //             if (this.rootScopeSvc.veElementsOn() !== this.rootScopeSvc.veEditMode()) {
        //                 this.bbApi.toggleButton('show-elements', this.rootScopeSvc.veEditMode());
        //                 this.rootScopeSvc.veElementsOn(this.rootScopeSvc.veEditMode());
        //             }
        //             return;
        //         } else if (data.clicked === 'center-previous') {
        //             this.treeSvc.getPrevBranch(this.treeSvc.getSelectedBranch(), ['view', 'section']).then(
        //                 (prev) => {
        //                     this.bbApi.toggleButtonSpinner('center-previous');
        //                     this.treeSvc.selectBranch(prev).catch((reason) => {
        //                         this.growl.error(TreeService.treeError(reason));
        //                     });
        //                     this.bbApi.toggleButtonSpinner('center-previous');
        //                 },
        //                 (reason) => {
        //                     if (reason.status === 200) this.growl.info(reason.message);
        //                     else this.growl.error(reason.message);
        //                 }
        //             );
        //             return;
        //         } else if (data.clicked === 'center-next') {
        //             this.treeSvc.getNextBranch(this.treeSvc.getSelectedBranch(), ['view', 'section']).then(
        //                 (next) => {
        //                     this.bbApi.toggleButtonSpinner('center-next');
        //                     this.treeSvc.selectBranch(next).catch((reason) => {
        //                         this.growl.error(TreeService.treeError(reason));
        //                     });
        //                     this.bbApi.toggleButtonSpinner('center-next');
        //                 },
        //                 (reason) => {
        //                     if (reason.status === 200) this.growl.info(reason.message);
        //                     else this.growl.error(reason.message);
        //                 }
        //             );
        //             return;
        //         } else if (data.clicked === 'convert-pdf') {
        //             if (this.isPageLoading()) return;
        //             void this.appUtilsSvc.printModal(
        //                 angular.element('#print-div'),
        //                 this.mmsView,
        //                 this.mmsRef,
        //                 false,
        //                 3
        //             );
        //             return;
        //         } else if (data.clicked === 'print') {
        //             if (this.isPageLoading()) return;
        //             void this.appUtilsSvc.printModal(
        //                 angular.element('#print-div'),
        //                 this.mmsView,
        //                 this.mmsRef,
        //                 false,
        //                 1
        //             );
        //             return;
        //         } else if (data.clicked === 'word') {
        //             if (this.isPageLoading()) return;
        //             void this.appUtilsSvc.printModal(
        //                 angular.element('#print-div'),
        //                 this.mmsView,
        //                 this.mmsRef,
        //                 false,
        //                 2
        //             );
        //             return;
        //         } else if (data.clicked === 'tabletocsv') {
        //             if (this.isPageLoading()) return;
        //             this.appUtilsSvc.tableToCsv(angular.element('#print-div'), false);
        //             return;
        //         } else if (data.clicked === 'refresh-numbering') {
        //             this.utilsSvc.makeTablesAndFiguresTOC(this.treeSvc.getFirstBranch(), angular.element('#print-div'), true, false);
        //             return;
        //         }
        //     })
        // );
    }

    // private _setToolbarHeight(): void {
    //     const barHeight = $('.pane-center-btn-group').outerHeight()
    //     if (barHeight){
    //         this.bbSize = barHeight.toString(10) + 'px'
    //         this.$scope.$apply
    //     }
    // }

    uiOnParamsChanged(newValues: ParamsObject, $transition$: Transition): void {
        // if (newValues.viewId && newValues.viewId !== this.params.viewId)
        //     this.initView($transition$.params() as ParamsObject);
    }
    uiCanExit(transition: Transition): HookResult {
        //Do nothing
    }

    initView = (params?: ParamsObject): void => {
        this.rootScopeSvc.veViewContentLoading(true);

        this.viewId = this.view.id

        //this.permissionsSvc.getObjectPermissions
        this.rootScopeSvc.veViewContentLoading(false);
        
        const data = { 
            rootId: 'server', 
            elementId: this.viewId,
            projectId: null,
            refId: null
        }
        this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('view.selected', data);
        


        // this.contentWindowSvc.toggleLeftPane(false);

        // this.rootScopeSvc.veNumberingOn(true);

        // // Share URL button settings
        // this.dynamicPopover = this.shortUrlSvc.dynamicPopover;

        // this.viewApi = {
        //     elementClicked: this.elementClicked,
        //     elementTranscluded: this.elementTranscluded,
        // };
    };

    $onDestroy(): void {
        this.eventSvc.$destroy(this.subs);
        this.buttonBarSvc.destroy(this.bbId);
    }

    public bbInit = (api: ButtonBarApi): void => {};

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
        // if (type === 'Comment' && !this.comments.map.hasOwnProperty(elementOb.id)) {
        //     this.comments.map[elementOb.id] = elementOb;
        //     this.comments.count++;
        //     if (elementOb._modified > this.comments.lastCommented) {
        //         this.comments.lastCommented = elementOb._modified;
        //         this.comments.lastCommentedBy = elementOb._modifier;
        //     }
        // }
    };

    public elementClicked = (elementOb: ElementObject): void => {
        // const data = {
        //     rootOb: null,
        //     elementId: elementOb.id,
        //     projectId: elementOb._projectId,
        //     refId: elementOb._refId,
        //     commitId: 'latest',
        // };
        // this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('element.selected', data);
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
const AdminComponent: VeComponentOptions = {
    selector: 'admin',
    template: `
    <div ng-show="$ctrl.viewId">
    <ng-pane pane-id="center-toolbar" pane-closed="false" pane-anchor="north" pane-size="{{$ctrl.bbSize}}" pane-no-toggle="true" pane-no-scroll="true" parent-ctrl="$ctrl">
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
                <h1 class="view-title bm-level-1">{{$ctrl.title}}
                <div id="print-div" ng-show="$ctrl.viewId">

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
        mmsOrg: '<',
        mmsProject: '<',
        mmsRef: '<',
        mmsGroup: '<',
    },
    controller: AdminController,
};

veApp.component(AdminComponent.selector, AdminComponent);
