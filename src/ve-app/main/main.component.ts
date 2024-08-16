import 'angular-growl-v2';

import { StateService, Transition, TransitionService, UIRouter } from '@uirouter/angularjs';
import angular, { IComponentController, IHttpResponse } from 'angular';
import Rx from 'rx-lite';

import { WorkingTimeModalResolveFn, WorkingTimeObject } from '@ve-app/main/modals/working-modal.component';
import { ApplicationService, RootScopeService } from '@ve-utils/application';
import { EditService, EventService } from '@ve-utils/core';
import { ApiService, AuthService, ElementService, HttpService, URLService } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

import { VeComponentOptions, VeHttpResponse, VeHttpService } from '@ve-types/angular';
import veConfig from '@ve-types/config';
import { ParamsObject } from '@ve-types/mms';
import { VeModalService } from '@ve-types/view-editor';

class MainController implements IComponentController {
    static $inject = [
        '$scope',
        '$timeout',
        '$location',
        '$window',
        '$uibModal',
        '$interval',
        '$http',
        'growl',
        'hotkeys',
        'growlMessages',
        '$uiRouter',
        '$transitions',
        '$state',
        'URLService',
        'ApiService',
        'HttpService',
        'AuthService',
        'ElementService',
        'ApplicationService',
        'RootScopeService',
        'EditService',
        'EventService',
    ];

    //local
    public subs: Rx.IDisposable[];
    openEdits = {};

    private hidePanes: boolean = false;
    private hideRight: boolean = false;
    private closeRight: boolean = false;
    private hideLeft: boolean = false;
    private closeLeft: boolean = false;

    showLogin: boolean = true;
    mmsWorkingTime: WorkingTimeObject;
    workingModalOpen = false;

    topSize: number = 0;
    topPx: string = '1px';
    bannerTopEl: JQuery<HTMLElement>;
    navEl: JQuery<HTMLElement>;
    bannerBottomEl: JQuery<HTMLElement>;
    menuEl: JQuery<HTMLElement>;

    readonly paneClosed: boolean = false;

    constructor(
        private $scope: angular.IScope,
        private $timeout: angular.ITimeoutService,
        private $location: angular.ILocationService,
        private $window: angular.IWindowService,
        private $uibModal: VeModalService,
        private $interval: angular.IIntervalService,
        private $http: VeHttpService,
        private growl: angular.growl.IGrowlService,
        private hotkeys: angular.hotkeys.HotkeysProvider,
        private growlMessages: angular.growl.IGrowlMessagesService,
        private $uiRouter: UIRouter,
        private $transitions: TransitionService,
        private $state: StateService,
        private uRLSvc: URLService,
        private apiSvc: ApiService,
        private httpSvc: HttpService,
        private authSvc: AuthService,
        private elementSvc: ElementService,
        private applicationSvc: ApplicationService,
        private rootScopeSvc: RootScopeService,
        private editSvc: EditService,
        private eventSvc: EventService
    ) {}

    $onInit(): void {
        this.eventSvc.$init(this);
        this.rootScopeSvc.init();

        this.subs.push(
            this.eventSvc.binding(this.rootScopeSvc.constants.VETITLE, (value: string) => {
                this.$window.document.title = value + ' | View Editor';
            })
        );

        this.subs.push(
            this.eventSvc.binding(this.rootScopeSvc.constants.VESHOWLOGIN, (value: boolean) => {
                this.showLogin = value;
            })
        );

        this.subs.push(
            this.eventSvc.binding(this.rootScopeSvc.constants.VEHIDEPANES, (value: boolean) => {
                this.hidePanes = value;
            })
        );

        this.subs.push(
            this.eventSvc.binding(this.rootScopeSvc.constants.VEHIDELEFT, (value: boolean) => {
                this.hideLeft = value;
            })
        );

        this.subs.push(
            this.eventSvc.binding(this.rootScopeSvc.constants.VEHIDERIGHT, (value: boolean) => {
                this.hideRight = value;
            })
        );

        this.$window.addEventListener('beforeunload', (event) => {
            if (this.editSvc.openEdits() > 0) {
                const message = 'You may have unsaved changes, are you sure you want to leave?';
                event.returnValue = message;
                return message;
            }
        });

        this.hotkeys
            .bindTo(this.$scope)
            .add({
                combo: 'alt+m',
                description: 'close all messages',
                callback: () => {
                    this.growlMessages.destroyAllMessages();
                },
            })
            .add({
                combo: '@',
                description: 'fast cf in editor',
                callback: () => {
                    // TODO: Something here?
                },
            });

        this.subs.push(
            this.eventSvc.$on('mms.working', (response: IHttpResponse<WorkingTimeObject>) => {
                this.rootScopeSvc.veViewContentLoading(false);
                if (this.workingModalOpen) {
                    return;
                }
                this.mmsWorkingTime = response.data;
                this.workingModalOpen = true;
                this.$uibModal
                    .open<WorkingTimeModalResolveFn, void>({
                        component: 'workingModal',
                        backdrop: true,
                        resolve: {
                            getWorkingTime: () => {
                                return this.mmsWorkingTime;
                            },
                        },
                        size: 'md',
                    })
                    .result.finally(() => {
                        this.workingModalOpen = false;
                    });
            })
        );

        // this.subs.push(
        //     this.eventSvc.$on('element.updated', (data: { element: ElementObject; continueEdit: boolean }) => {
        //         const element = data.element
        //         //if element is not being edited and there's a cached edit object, update the edit object also
        //         //so next time edit forms will show updated data (mainly for stomp updates)
        //         const editKey = this.apiSvc.makeCacheKey(this.apiSvc.makeRequestObject(element), element.id, true)
        //         const veEditsKey = element.id + '|' + element._projectId + '|' + element._refId
        //         if (this.autosaveSvc.getAll() && !this.autosaveSvc.get(veEditsKey) && this.cacheSvc.exists(editKey)) {
        //             this.elementSvc.cacheElement(
        //                 {
        //                     projectId: element._projectId,
        //                     refId: element._refId,
        //                     elementId: element.id,
        //                     commitId: 'latest',
        //                 },
        //                 _.cloneDeep(element),
        //                 true
        //             )
        //         }
        //     })
        // )

        this.$transitions.onStart({}, (trans) => {
            this.rootScopeSvc.veViewContentLoading(true);
            this.httpSvc.transformQueue();
            this.rootScopeSvc.veStateChanging(true);
            const from = trans.from().name;
            const to = trans.to().name;
            if (from.split('.').length >= to.split('.').length) {
                console.log(trans.router.viewService._pluginapi._activeViewConfigs());
                //Code to prune inactive previous leaf configs
                //console.log(
                trans.router.viewService._pluginapi
                    ._activeViewConfigs()
                    .filter((vc) => {
                        return from === vc.viewDecl.$context.name;
                    })
                    .forEach((value) => {
                        trans.router.viewService.deactivateViewConfig(value);
                    });
                console.log(trans.router.viewService._pluginapi._activeViewConfigs());
            }
        });

        this.$transitions.onError({}, (trans: Transition) => {
            this.rootScopeSvc.veStateChanging(false);
            this.rootScopeSvc.veViewContentLoading(false);
            //check if error is ticket error
            const error: VeHttpResponse<any> = trans.error().detail as VeHttpResponse<any>;
            if (
                !error ||
                error.status === 401 ||
                (error.status === 404 &&
                    error.config &&
                    error.config.url &&
                    error.config.url.indexOf('/authentication') !== -1)
            ) {
                //check if 404 if checking valid ticket
                trans.abort();
                this.rootScopeSvc.veRedirect({
                    toState: trans.to(),
                    toParams: trans.params(),
                });
                return this.$state.target('main.login', {
                    next: trans.$to().url,
                });
            }
            if (veConfig.enableDebug) {
                this.growl.warning('Error: ' + trans.error().message, {
                    ttl: 1000,
                });
            }
        });

        this.$transitions.onSuccess({}, (trans: Transition) => {
            this.rootScopeSvc.veStateChanging(false);
            if (this.$state.is('main.share')) {
                this.rootScopeSvc.veHidePanes(true);
                this.rootScopeSvc.veShowLogin(true);
            } else if (this.$state.includes('main.login')) {
                this.rootScopeSvc.veHidePanes(true);
                this.rootScopeSvc.veShowLogin(true);
            } else if (this.$state.includes('main.project.refs')) {
                this.rootScopeSvc.veHidePanes(true);
                this.rootScopeSvc.veShowLogin(false);
            } else {
                this.rootScopeSvc.veHidePanes(false);
                this.rootScopeSvc.veShowLogin(false);
            }

            if (this.rootScopeSvc.veRedirect() && this.$state.is(this.rootScopeSvc.veRedirect().toState.name)) {
                this.rootScopeSvc.veRedirect(null);
            }

            if (this.$state.includes('main.project.ref.view.present')) {
                this.applicationSvc.getState().inDoc = true;
                this.applicationSvc.getState().currentDoc = (trans.params() as ParamsObject).documentId;
                this.applicationSvc.getState().fullDoc = !!this.$state.includes(
                    'main.project.ref.view.present.document'
                );
            } else {
                this.applicationSvc.getState().inDoc = false;
                this.applicationSvc.getState().fullDoc = false;
            }
            this.rootScopeSvc.veViewContentLoading(false);
            if (this.$state.includes('main.project.ref.view.present') && !(trans.params() as ParamsObject).display) {
                const display = trans.$to().name.split('.')[trans.$to().name.split('.').length];
                void this.$state.go(trans.$to().name, { display });
            }
            if (
                this.$state.includes('main.project.ref') &&
                (trans.from().name === 'main.login' ||
                    trans.from().name === 'main.login.select' ||
                    trans.from().name === 'main.login.redirect')
            ) {
                void this.$timeout(
                    () => {
                        this.eventSvc.$broadcast('left-pane.toggle');
                    },
                    1,
                    false
                );
                void this.$timeout(
                    () => {
                        this.eventSvc.$broadcast('left-pane.toggle');
                    },
                    100,
                    false
                );
            }
        });

        if (this.$state.is('main')) {
            void this.$state.go('main.login');
        }
    }

    $postLink(): void {
        this.bannerTopEl = $('#banner-top');
        this.navEl = $('#nav-top');
        this.menuEl = $('#menu-top');
        console.log(this.bannerTopEl.height());
    }

    $doCheck(): void {
        if (!this.showLogin && this.bannerTopEl && this.navEl && this.menuEl) {
            const size = this.bannerTopEl.height() + this.navEl.height() + this.menuEl.height();
            if (size != this.topSize) {
                this.topSize = size;
                this.topPx = size.toString() + 'px';
                //console.log(this.topSize.toString() + 'px');
            }
        }
    }
}

const MainComponent: VeComponentOptions = {
    selector: 'main',
    transclude: true,
    template: `
    <div growl></div>
<div id="outer-wrap">
    <div id="login-overlay" ng-show="$ctrl.showLogin">
        <ui-view name="login"></ui-view>
    </div>
    <ng-pane pane-id="global" pane-anchor="center" pane-closed="$ctrl.showLogin" parent-ctrl="$ctrl" pane-no-scroll="true" pane-no-toggle="true" ng-hide="$ctrl.showLogin">
        <ng-pane pane-id="top" pane-anchor="north" pane-closed="$ctrl.paneClosed" pane-size="{{ $ctrl.topPx }}" parent-ctrl="$ctrl" pane-no-toggle="true">
            <ui-view name="banner-top" id="banner-top"></ui-view>
            <ui-view name="nav" id="nav-top"></ui-view>
            <ui-view name="menu" id="menu-top"></ui-view>
        </ng-pane>
        <ng-pane pane-id="main" pane-anchor="center" pane-closed="$ctrl.paneClosed" class="ng-pane" id="main-pane" parent-ctrl="$ctrl" ng-hide="$ctrl.hidePanes">
            <ng-pane pane-id="left-toolbar" pane-anchor="west" pane-size="41px" pane-no-toggle="true" parent-ctrl="$ctrl" pane-closed="$ctrl.paneClosed">
                <ui-view name="toolbar-left"></ui-view>
            </ng-pane>
            <ng-pane pane-id="left" pane-anchor="west" pane-size="20%" pane-handle="13" pane-min="20px" class="west-pane" pane-closed="$ctrl.closeLeft" ng-hide="$ctrl.hideLeft">
                <ui-view name="pane-left" class="container-pane-left"></ui-view>
            </ng-pane>
            <ng-pane pane-id="right-toolbar" pane-anchor="east" pane-size="41px" pane-no-toggle="true" parent-ctrl="$ctrl" pane-closed="$ctrl.paneClosed">
                <ui-view name="toolbar-right"></ui-view>
            </ng-pane>
            <ng-pane pane-id="content" pane-anchor="center" pane-closed="$ctrl.paneClosed" class="content-pane" parent-ctrl="$ctrl">
                <ng-pane pane-id="right" pane-anchor="east" pane-size="30%" pane-handle="14" pane-closed="$ctrl.closeRight" class="pane-right" ng-hide="$ctrl.hideRight">
                    <ui-view name="pane-right"></ui-view>
                </ng-pane>
                <ng-pane pane-id="center" pane-anchor="center" class="pane-center" pane-closed="$ctrl.paneClosed" pane-no-toggle="true">
                    <ui-view name="pane-center"></ui-view>
                </ng-pane>
            </ng-pane>
        </ng-pane>
        <ui-view name="banner-bottom"></ui-view>
        <i ng-show="$ctrl.hidePanes" class="pane-center-spinner fa fa-5x fa-spinner fa-spin"></i>
    </ng-pane>
</div>
`,
    controller: MainController,
};

veApp.component(MainComponent.selector, MainComponent);
