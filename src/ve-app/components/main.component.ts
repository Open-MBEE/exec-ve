import * as angular from "angular";
import Rx from 'rx-lite';
import "angular-growl-v2";
import {StateService, Transition, TransitionService, UIRouter, UIRouterGlobals} from "@uirouter/angularjs";


import {
    ApplicationService,
    AuthService,
    CacheService,
    EditService,
    ElementService,
    EventService,
    HttpService,
    RootScopeService,
    URLService,
    UtilsService
} from "@ve-utils/services";
import {VeComponentOptions} from "@ve-types/view-editor";

import {veApp} from "@ve-app";

let MainComponent: VeComponentOptions = {
  selector: "main",
  transclude: true,
  template: `
    <div growl></div>

<div id="outer-wrap">
    <!--<div id="login-overlay" ng-show="showLogin" style="height: 100vh">-->
    <div id="login-overlay" ng-show="$ctrl.showLogin">
        <ui-view name="login"></ui-view>
    </div>

    <div id="inner-wrap">
        <ui-view name="banner"></ui-view>
        <ui-view name="nav"></ui-view>
        <ui-view name="menu"></ui-view>
        <ui-view name="manageRefs" ng-show="$ctrl.showManageRefs" style="height: 100vh"></ui-view>
        <div ng-hide="$ctrl.hidePanes">
            <ng-pane pane-anchor="center" pane-id="main" pane-closed="false" class="ng-pane" id="main-pane">
                <ng-pane pane-id="left" pane-anchor="west" pane-size="20%" pane-handle="13" pane-min="20px" class="west-tabs" pane-closed="false">
                    <ui-view name="pane-left" class="container-pane-left"></ui-view>
                </ng-pane>
                <ng-pane pane-id="toolbar" pane-anchor="east" pane-size="41px" pane-closed="false" pane-no-toggle="true">
                    <ui-view name="toolbar-right"></ui-view>
                </ng-pane>
                <ng-pane pane-id="center-view" pane-anchor="center" pane-closed="false" class="center-view">
                    <ng-pane pane-id="right-pane" pane-anchor="east" pane-size="30%" pane-handle="14" pane-closed="true" class="pane-right">
                        <ui-view name="pane-right"></ui-view>
                    </ng-pane>
                    <ng-pane pane-id="center" pane-anchor="center" class="pane-center" pane-closed="false" pane-no-toggle="true">
                        <ui-view name="pane-center">
                            <i class="pane-center-spinner fa fa-3x fa-spinner fa-spin"></i>
                        </ui-view>
                    </ng-pane>
                </ng-pane>
            </ng-pane>
        </div>
    <ui-view name="footer"></ui-view>
    </div>
</div>
`,
    controller: class MainController implements angular.IComponentController {

        static $inject = ['$scope', '$timeout', '$location', '$window', '$uibModal', '$interval', '$http',
            'growl', 'hotkeys', 'growlMessages','$uiRouter', '$transitions', '$state', 'URLService', 'UtilsService', 'HttpService', 'AuthService',
            'ElementService', 'CacheService', 'ApplicationService', 'RootScopeService', 'EditService', 'EventService']
        
        //local
        public subs: Rx.IDisposable[];
                openEdits = {};

        private hidePanes: boolean = false;
        showManageRefs: boolean = false;
        showLogin: boolean = true;
        mmsWorkingTime: any;
        workingModalOpen = false;

        $uiRouterGlobals: UIRouterGlobals = this.$uiRouter.globals;

        constructor(private $scope: angular.IScope, private $timeout: angular.ITimeoutService, private $location: angular.ILocationService,
                    private $window: angular.IWindowService, private $uibModal: angular.ui.bootstrap.IModalService,
                    private $interval: angular.IIntervalService, private $http: angular.IHttpService,
                    private growl: angular.growl.IGrowlService, private hotkeys, private growlMessages,
                    private $uiRouter: UIRouter, private $transitions: TransitionService, private $state: StateService, private uRLSvc: URLService, private utilsSvc: UtilsService, private httpSvc: HttpService,
                    private authSvc: AuthService, private elementSvc: ElementService, private cacheSvc: CacheService,
                    private applicationSvc: ApplicationService, private rootScopeSvc: RootScopeService, 
                    private editSvc: EditService, private eventSvc: EventService) {}
        
        $onInit() {
            this.eventSvc.$init(this);

            this.rootScopeSvc.veViewContentLoading(false);
            this.rootScopeSvc.treeInitialSelection('');
            this.rootScopeSvc.veFn(false);

            this.rootScopeSvc.veCommentsOn(false);
            this.rootScopeSvc.veElementsOn(false);
            this.rootScopeSvc.veEditMode(false);

            this.subs.push(this.eventSvc.$on(this.rootScopeSvc.constants.VETITLE, (value) => {
                this.$window.document.title = value + ' | View Editor';
            }));

            this.subs.push(this.eventSvc.$on(this.rootScopeSvc.constants.VESHOWLOGIN, (value) => {
                this.showLogin = value;
            }));

            this.subs.push(this.eventSvc.$on(this.rootScopeSvc.constants.VESHOWMANAGEREFS, (value) => {
                this.showManageRefs = value;
            }));

            this.subs.push(this.eventSvc.$on(this.rootScopeSvc.constants.VEHIDEPANES, (value) => {
                this.hidePanes = value;
            }));

            this.subs.push(this.eventSvc.$on(this.editSvc.EVENT, () => {
                this.openEdits = this.editSvc.getAll();
            }));


            this.$window.addEventListener('beforeunload', (event) => {
                if (Object.keys(this.openEdits).length > 0) {
                    var message = 'You may have unsaved changes, are you sure you want to leave?';
                    event.returnValue = message;
                    return message;
                }
            });

            this.hotkeys.bindTo(this.$scope)
                .add({
                    combo: 'alt+m',
                    description: 'close all messages',
                    callback: () => {this.growlMessages.destroyAllMessages();}
                }).add({
                combo: '@',
                description: 'fast cf in editor',
                callback: () => {}
            });


            this.subs.push(this.eventSvc.$on('mms.working', (response) => {
                this.rootScopeSvc.veViewContentLoading(false);
                if (this.workingModalOpen) {
                    return;
                }
                this.mmsWorkingTime = response.data;
                this.workingModalOpen = true;
                this.$uibModal.open({
                    component: 'workingModal',
                    backdrop: true,
                    resolve: {
                        getWorkingTime: () => {
                            return this.mmsWorkingTime
                        }
                    },
                    size: 'md'
                }).result.finally(() =>{
                    this.workingModalOpen = false;
                });
            }));

            this.subs.push(this.eventSvc.$on('element.updated', (data) => {
                let element = data.element;
                //if element is not being edited and there's a cached edit object, update the edit object also
                //so next time edit forms will show updated data (mainly for stomp updates)
                var editKey = this.utilsSvc.makeElementKey(element, true);
                var veEditsKey = element.id + '|' + element._projectId + '|' + element._refId;
                if (this.editSvc.getAll() && !this.editSvc.get(veEditsKey) && this.cacheSvc.exists(editKey)) {
                    this.elementSvc.cacheElement({projectId: element._projectId, refId: element._refId, elementId: element.id, commitId: 'latest'}, JSON.parse(JSON.stringify(element)), true);
                }
            }));

            this.$transitions.onStart({}, (trans) => {
                this.rootScopeSvc.veViewContentLoading(true);
                this.httpSvc.transformQueue();
                this.rootScopeSvc.veStateChanging(true);
            })

            this.$transitions.onError({}, (trans: Transition) => {
                this.rootScopeSvc.veStateChanging(false);
                this.rootScopeSvc.veViewContentLoading(false);
                //check if error is ticket error
                let error: angular.IHttpResponse<any> = trans.error().detail;
                if (!error || error.status === 401 ||
                    (error.status === 404 && error.config && error.config.url &&
                        error.config.url.indexOf('/authentication') !== -1)) { //check if 404 if checking valid ticket
                    trans.abort();
                    this.rootScopeSvc.veRedirect({toState: trans.to().name, toParams: trans.params()});
                    this.$state.target('main.login', {notify: false});
                }
                this.growl.error('Error: ' + trans.error().message);
            })

            this.$transitions.onSuccess({}, (trans: Transition) => {
                this.rootScopeSvc.veStateChanging(false);
                this.rootScopeSvc.veHidePanes(false);
                this.rootScopeSvc.veShowManageRefs(false);
                this.rootScopeSvc.veShowLogin(false);
                if (this.$uiRouterGlobals.$current.name === 'main.login' || this.$uiRouterGlobals.$current.name === 'main.login.select' || this.$uiRouterGlobals.$current.name === 'main.login.redirect') {
                    this.rootScopeSvc.veHidePanes(true);
                    this.rootScopeSvc.veShowLogin(true);
                } else if (this.$state.includes('project') && !(this.$state.includes('main.project.ref'))) {
                    this.rootScopeSvc.veHidePanes(true);
                    this.rootScopeSvc.veShowManageRefs(true);
                    this.eventSvc.$broadcast('fromParamChange', trans.params('from'));
                }
                if (this.$uiRouterGlobals.$current.name === 'main.project.ref') {
                    this.rootScopeSvc.treeInitialSelection(trans.params().refId);
                } else if (this.$uiRouterGlobals.$current.name === 'main.project.ref.preview') {
                    var index = trans.params().documentId.indexOf('_cover');
                    if (index > 0)
                        this.rootScopeSvc.treeInitialSelection(trans.params().documentId.substring(5, index));
                    else
                        this.rootScopeSvc.treeInitialSelection(trans.params().documentId);
                } else if (this.$state.includes('main.project.ref.document') && (this.$state.current.name !== 'main.project.ref.document.order')) {
                    if (trans.params().viewId !== undefined)
                        this.rootScopeSvc.treeInitialSelection(trans.params().viewId);
                    else
                        this.rootScopeSvc.treeInitialSelection(trans.params().documentId);
                }
                if (this.$state.includes('main.project.ref.document')) {
                    var state = this.applicationSvc.getState();
                    this.applicationSvc.getState().inDoc = true;
                    this.applicationSvc.getState().currentDoc = trans.params().documentId;
                    this.applicationSvc.getState().fullDoc = !!this.$state.includes('main.project.ref.document.full');
                } else {
                    this.applicationSvc.getState().inDoc = false;
                    this.applicationSvc.getState().fullDoc = false;
                }
                this.rootScopeSvc.veViewContentLoading(false);
                if (this.$state.includes('main.project.ref') && (trans.from().name === 'main.login' || trans.from().name === 'main.login.select' || trans.from().name === 'project' || trans.from().name === 'main.login.redirect')) {
                    this.$timeout(() => {
                        this.eventSvc.$broadcast('left-pane.toggle');
                    }, 1, false);
                    this.$timeout(() => {
                        this.eventSvc.$broadcast('left-pane.toggle');
                    }, 100, false);
                }
            });


            if (this.$uiRouterGlobals.$current.name == 'main') {
                this.$state.go('main.login');
            }
        }

    }
};

veApp.component(MainComponent.selector,MainComponent);

