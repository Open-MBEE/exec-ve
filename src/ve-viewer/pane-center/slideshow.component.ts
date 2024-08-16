import { HookResult, Ng1Controller, StateService, UIRouterGlobals } from '@uirouter/angularjs';
import { Transition } from '@uirouter/core';

import { TreeService } from '@ve-components/trees';
import { BarButton, ButtonBarApi, ButtonBarService, IButtonBarButton } from '@ve-core/button-bar';
import { veCoreEvents } from '@ve-core/events';
import { RootScopeService, ShortUrlService, UtilsService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { PermissionService, ViewApi } from '@ve-utils/mms-api-client';
import { veViewer } from '@ve-viewer';
import { AppUtilsService } from '@ve-viewer/services';

import { pane_center_buttons } from './pane-center-buttons.config';
import { ContentWindowService } from './services/ContentWindow.service';

import { VeComponentOptions, VeQService } from '@ve-types/angular';
import {
    DocumentObject,
    ElementObject,
    ProjectGroupObject,
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
    mmsGroup: ProjectGroupObject;
    mmsDocument: DocumentObject;
    mmsView: ViewObject;

    subs: Rx.IDisposable[];
    vidLink: boolean;
    viewContentLoading: boolean;
    init: boolean = false;

    public bbApi: ButtonBarApi;
    bbId = 'view-ctrl';
    bbSize: string = '34px';
    buttons: IButtonBarButton[] = [];
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
        '$element',
        '$uiRouterGlobals',
        'growl',
        'hotkeys',
        'AppUtilsService',
        'UtilsService',
        'ShortUrlService',
        'ContentWindowService',
        'PermissionService',
        'RootScopeService',
        'TreeService',
        'EventService',
        'ButtonBarService',
    ];

    constructor(
        public $q: VeQService,
        private $scope: angular.IScope,
        private $state: StateService,
        private $element: JQuery<HTMLElement>,
        private $uiRouterGlobals: UIRouterGlobals,
        private growl: angular.growl.IGrowlService,
        private hotkeys: angular.hotkeys.HotkeysProvider,
        private appUtilsSvc: AppUtilsService,
        private utilsSvc: UtilsService,
        private shortUrlSvc: ShortUrlService,
        private contentWindowSvc: ContentWindowService,
        private permissionSvc: PermissionService,
        private rootScopeSvc: RootScopeService,
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

        //this.bbApi = this.buttonBarSvc.initApi(this.bbId, this.bbInit, pane_center_buttons);
        this.buttonBarSvc.registerButtons(pane_center_buttons);
        this.bbInit();
        this._setToolbarHeight();

        // this.subs.push(
        //     this.eventSvc.$on(this.bbApi.WRAP_EVENT, (data: ButtonWrapEvent) => {
        //         if (data.oldSize != data.newSize) {
        //             this._setToolbarHeight();
        //         }
        //     })
        // );

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
                switch (data.clicked) {
                    case 'show-comments': {
                        this.rootScopeSvc.veCommentsOn(!this.rootScopeSvc.veCommentsOn());
                        return;
                    }
                    case 'show-numbering': {
                        this.rootScopeSvc.veNumberingOn(!this.rootScopeSvc.veNumberingOn());
                        return;
                    }
                    case 'show-elements': {
                        this.toggleElementsOn();
                        return;
                    }
                    case 'show-edits': {
                        this.toggleEditMode();
                        return;
                    }
                    case 'center-previous': {
                        this.prevBranchAction(data.button);
                        return;
                    }
                    case 'center-next': {
                        this.nextBranchAction(data.button);
                        return;
                    }
                    case 'convert-pdf': {
                        if (this.isPageLoading()) return;
                        void this.appUtilsSvc.printModal(
                            angular.element('#print-div'),
                            this.mmsView,
                            this.mmsRef,
                            false,
                            3
                        );
                        return;
                    }
                    case 'print': {
                        if (this.isPageLoading()) return;
                        void this.appUtilsSvc.printModal(
                            angular.element('#print-div'),
                            this.mmsView,
                            this.mmsRef,
                            false,
                            1
                        );
                        return;
                    }
                    case 'word': {
                        if (this.isPageLoading()) return;
                        void this.appUtilsSvc.printModal(
                            angular.element('#print-div'),
                            this.mmsView,
                            this.mmsRef,
                            false,
                            2
                        );
                        return;
                    }
                    case 'tabletocsv': {
                        if (this.isPageLoading()) return;
                        this.appUtilsSvc.tableToCsv(angular.element('#print-div'), false);
                        return;
                    }
                    case 'refresh-numbering': {
                        this.utilsSvc.makeTablesAndFiguresTOC(
                            this.treeSvc.getFirstBranch(),
                            angular.element('#print-div'),
                            true,
                            false
                        );
                        return;
                    }
                }
            })
        );
    }

    private _setToolbarHeight = (): void => {
        const barHeight = $('.pane-center-btn-group').outerHeight();
        if (barHeight) {
            this.bbSize = barHeight.toString(10) + 'px';
            //this.$scope.$apply();
        }
    };

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

    public bbInit = (): void => {
        //const sharePage = this.buttonBarSvc.getButtonDefinition('copy');
        //this.buttons.push(sharePage);
        if (
            this.mmsRef.type === 'Branch' &&
            this.permissionSvc.hasBranchEditPermission(this.mmsProject.id, this.mmsRef.id)
        ) {
            const showEdits = this.buttonBarSvc.getButtonDefinition('show-edits');
            showEdits.toggleEvent = this.rootScopeSvc.constants.VEEDITMODE;
            this.buttons.push(showEdits);
            this.hotkeys.bindTo(this.$scope).add({
                combo: 'alt+d',
                description: 'toggle edit mode',
                callback: () => {
                    this.toggleEditMode();
                },
            });
        }
        const showElements = this.buttonBarSvc.getButtonDefinition('show-elements');
        showElements.toggleEvent = this.rootScopeSvc.constants.VEELEMENTSON;
        const showComments = this.buttonBarSvc.getButtonDefinition('show-comments');
        showComments.toggleEvent = this.rootScopeSvc.constants.VECOMMENTSON;
        const showNumbering = this.buttonBarSvc.getButtonDefinition('show-numbering');
        showNumbering.toggleEvent = this.rootScopeSvc.constants.VENUMBERINGON;
        this.buttons.push(showElements, showComments, showNumbering);

        // Set hotkeys for toolbar
        this.hotkeys
            .bindTo(this.$scope)
            .add({
                combo: 'alt+c',
                description: 'toggle show comments',
                callback: () => {
                    this.rootScopeSvc.veCommentsOn(!this.rootScopeSvc.veCommentsOn);
                },
            })
            .add({
                combo: 'alt+e',
                description: 'toggle show elements',
                callback: () => {
                    this.toggleElementsOn;
                },
            });

        if (this.$state.includes('**.present.**')) {
            this.buttons.push(this.buttonBarSvc.getButtonDefinition('refresh-numbering'));
            this.buttons.push(this.buttonBarSvc.getButtonDefinition('print'));
            this.buttons.push(this.buttonBarSvc.getButtonDefinition('export'));
            this.buttons.push(this.buttonBarSvc.getButtonDefinition('center-previous'));
            this.buttons.push(this.buttonBarSvc.getButtonDefinition('center-next'));
            // Set hotkeys for toolbar
            this.hotkeys
                .bindTo(this.$scope)
                .add({
                    combo: 'alt+.',
                    description: 'next',
                    callback: () => {
                        this.nextBranchAction();
                    },
                })
                .add({
                    combo: 'alt+,',
                    description: 'previous',
                    callback: () => {
                        this.prevBranchAction();
                    },
                });
        } else {
            this.buttons.push(this.buttonBarSvc.getButtonDefinition('export'));
        }
    };

    public toggleEditMode = (): void => {
        this.rootScopeSvc.veEditMode(!this.rootScopeSvc.veEditMode());
        if (this.rootScopeSvc.veElementsOn() !== this.rootScopeSvc.veEditMode()) {
            this.rootScopeSvc.veElementsOn(this.rootScopeSvc.veEditMode());
        }
    };

    public toggleElementsOn = (): void => {
        this.rootScopeSvc.veElementsOn(!this.rootScopeSvc.veElementsOn());
        if (!this.rootScopeSvc.veElementsOn() && this.rootScopeSvc.veEditMode()) {
            this.rootScopeSvc.veEditMode(false);
        }
    };

    public nextBranchAction = (button?: BarButton): void => {
        this.treeSvc
            .getNextBranch(this.treeSvc.getSelectedBranch(), ['view', 'section'])
            .then(
                (next) => {
                    this.treeSvc.selectBranch(next).catch((reason) => {
                        this.growl.error(TreeService.treeError(reason));
                    });
                },
                (reason) => {
                    if (reason.status === 200) this.growl.info(reason.message);
                    else this.growl.error(reason.message);
                }
            )
            .finally(() => {
                if (button) button.handleSpin(false);
            });
        return;
    };

    public prevBranchAction = (button?: BarButton): void => {
        this.treeSvc.getPrevBranch(this.treeSvc.getSelectedBranch(), ['view', 'section']).then(
            (prev) => {
                this.treeSvc
                    .selectBranch(prev)
                    .catch((reason) => {
                        this.growl.error(TreeService.treeError(reason));
                    })
                    .finally(() => {
                        if (button) button.handleSpin(false);
                    });
            },
            (reason) => {
                if (reason.status === 200) this.growl.info(reason.message);
                else this.growl.error(reason.message);
            }
        );
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
        if (type === 'Comment' && !Object.prototype.hasOwnProperty.call(this.comments.map, elementOb.id)) {
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
    <ng-pane pane-id="center-toolbar" pane-closed="false" pane-anchor="north" pane-size="{{$ctrl.bbSize}}" pane-no-toggle="true" pane-no-scroll="true" parent-ctrl="$ctrl">
        <div class="pane-center-toolbar">
            <div class="pane-center-btn-group">
                <button-bar bar-id="{{$ctrl.bbId}}" menu="true" class="bordered-button-bar" >
                    <bar-button ng-repeat="button in $ctrl.buttons"
                            activation-cb="$ctrl.$state.includes(state)"
                            button-id="{{button.buttonId}}"
                            icon="{{button.icon}}"
                            placement="{{button.placement}}"
                            selectable="button.selectable"
                            spinnable="button.spinnable"
                            spin-event="button.spinEvent"
                            title="{{button.title}}"
                            tooltip="{{button.tooltip}}"
                            toggleable="button.toggleable"
                            toggle-event="button.toggleEvent"
                            toggled-tooltip="{{button.toggledTooltip}}"
                            template-url="{{button.templateUrl}}"
                            disable-caret="button.disableCaret"
                            dropdown-ids="button.dropdownIds"
                            api="{{button.api}}"
                            action="button.action"
                            class-name="{{button.className ? button.className : ''}}"
                            label="button.label"
                            enabled-for="button.enabledFor"
                            disabled-for="button.disabledFor">
                    </bar-button>
                </button-bar>
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
    <button ng-click="$ctrl.copyToClipboard($event)" class="btn btn-sm btn-secondary"><i class="fa fa-copy"></i>Copy</button>
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

veViewer.component(SlideshowComponent.selector, SlideshowComponent);
