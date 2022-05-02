import * as angular from 'angular';
import Rx from 'rx';

import { StateService } from '@uirouter/angularjs';
import {AppUtilsService} from "../services/AppUtils.service";
import {URLService} from "../../ve-utils/services/URL.provider";
import {UxService} from "../../ve-utils/services/Ux.service";
import {UtilsService} from "../../ve-utils/services/Utils.service";
import {ShortenUrlService} from "../../ve-utils/services/ShortenUrl.service";
import {PermissionsService} from "../../ve-utils/services/Permissions.service";
import {RootScopeService} from "../../ve-utils/services/RootScope.service";
import {TreeApi, TreeService} from "../../ve-utils/services/Tree.service";
import {Utils} from "../../ve-core/utilities/CoreUtils.service";
import {EventService} from "../../ve-utils/services/Event.service";
import {BButton, ButtonBarApi, ButtonBarService} from "../../ve-core/button-bar/ButtonBar.service";
import {handleChange} from "../../ve-utils/utils/change.util";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";


var veApp = angular.module('veApp');


/* Controllers */
let SingleViewComponent: VeComponentOptions = {
    selector: 'singleView',
    template: `
    <div ng-if="$ctrl.viewOb !== null && $ctrl.search === null">
    <fa-pane fa-pane="center-toolbar" pane-closed="false" pane-anchor="north" pane-size="36px" pane-no-toggle="true" pane-no-scroll="true" parent-ctrl="$ctrl">
        <div class="pane-center-toolbar">
            <div class="pane-center-btn-group">
                <button-bar button-api="$ctrl.bbApi" class="bordered-button-bar"></button-bar>
            </div>
        </div>
    </fa-pane>
    <fa-pane fa-pane="center-view" pane-closed="false" pane-anchor="center" pane-no-toggle="true" parent-ctrl="$ctrl">
        <i class="pane-center-spinner fa fa-5x fa-spinner fa-spin" ng-show="$ctrl.ve_viewContentLoading"></i>
        <div ng-hide="$ctrl.ve_viewContentLoading" class="container-fluid">
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
                                mms-link="$ctrl.vidLink"></view>
                </div>
            </div>
        </div>
    </fa-pane>
</div>

<div ng-if="$ctrl.search !== null">
    <i class="pane-center-spinner fa fa-5x fa-spinner fa-spin" ng-show="$ctrl.ve_viewContentLoading"></i>
    <mms-search mms-options="$ctrl.searchOptions" mms-project-id="{{$ctrl.projectOb.id}}" mms-ref-id="{{$ctrl.refOb.id}}"></mms-search>
</div>

<script type="text/ng-template" id="shareUrlTemplate.html">
    <p id="ve-short-url">{{($ctrl.shortUrl)}}</p>
    <button ng-click="$ctrl.copyToClipboard($event)" class="btn btn-sm btn-default"><i class="fa fa-copy"></i>Copy</button>
</script>

`,
    bindings: {
        search: "<",
        orgOb: "<",
        projectOb: "<",
        refOb: "<",
        groupOb: "<",
        documentOb: "<",
        viewOb: "<",
    },
    controller: class ViewController implements angular.IComponentController {

        public search;
        orgOb;
        projectOb;
        refOb;
        groupOb;
        documentOb;
        viewOb;

        private treeApi: TreeApi;
        subs: Rx.IDisposable[];
        vidLink: boolean;
        ve_viewContentLoading: boolean;

        public bbApi
        bbId = 'view-ctrl';
        bars: string[] = [];
        comments = {
            count: 0,
            lastCommented: '',
            lastCommentedBy: '',
            map: {}
        };
        buttons: any[];
        dynamicPopover: { templateUrl: "shareUrlTemplate.html"; title: "Share"; };
        copyToClipboard: ($event: any) => void;
        handleShareURL: any;
        searchOptions: { emptyDocTxt: string; searchInput: any; getProperties: boolean; closeable: boolean; callback: (elementOb: any) => void; relatedCallback: (doc: any, view: any, elem: any) => void; };

        static $inject = ['$scope', '$state', '$timeout', '$window', '$location',
            '$http', '$element', 'growl', 'hotkeys', 'AppUtilsService', 'UxService', 'URLService', 'UtilsService',
            'ShortenUrlService', 'Utils', 'PermissionsService', 'RootScopeService', 'TreeService', 'EventService',
            'ButtonBarService']

        constructor(private $scope: angular.IScope, private $state: StateService, private $timeout: angular.ITimeoutService,
                    private $window: angular.IWindowService, private $location: angular.ILocationService,
                    private $http: angular.IHttpService, private $element: JQuery<HTMLElement>,
                    private growl: angular.growl.IGrowlService, private hotkeys: angular.hotkeys.HotkeysProvider,
                    private appUtilsSvc: AppUtilsService, private uxSvc: UxService, private uRLSvc: URLService,
                    private utilsSvc: UtilsService, private shortenUrlSvc: ShortenUrlService, private utils: Utils,
                    private permissionsSvc: PermissionsService, private rootScopeSvc: RootScopeService,
                    private treeSvc: TreeService, private eventSvc: EventService, private buttonBarSvc: ButtonBarService) {


        }

        $onInit() {
            this.treeApi = this.treeSvc.getApi();
            this.eventSvc.$init(this);

            this.vidLink = false; //whether to have go to document link
            if (this.$state.includes('main.project.ref.preview') && this.viewOb && this.viewOb.id.indexOf('_cover') < 0) {
                this.vidLink = true;
            }

            this.ve_viewContentLoading = false;
            this.subs.push(this.eventSvc.$on(this.rootScopeSvc.constants.VEVIEWCONTENTLOADING, (newValue) => {
                this.ve_viewContentLoading = newValue;
            }));

            this.rootScopeSvc.veFullDocMode(false);
            if (!this.rootScopeSvc.veCommentsOn())
                this.rootScopeSvc.veCommentsOn(false);
            if (!this.rootScopeSvc.veElementsOn())
                this.rootScopeSvc.veElementsOn(false);
            if (!this.rootScopeSvc.veEditMode())
                this.rootScopeSvc.veEditMode(false);

            this.utils.toggleLeftPane(this.search);

            this.bbApi = this.buttonBarSvc.initApi(this.bbId, this.bbInit,this);
            //Set BB ID after initalization to prevent bar from starting too soon


            this.buttons = this.bbApi.buttons;


            this.subs.push(this.eventSvc.$on('show-comments', () => {
                this.bbApi.toggleButtonState('show-comments');
                this.rootScopeSvc.veCommentsOn(!this.rootScopeSvc.veCommentsOn());
            }));

            this.subs.push(this.eventSvc.$on('show-elements', () => {
                this.bbApi.toggleButtonState('show-elements');
                this.rootScopeSvc.veElementsOn(!this.rootScopeSvc.veElementsOn());
            }));

            this.subs.push(this.eventSvc.$on('show-edits', () => {
                if ((this.rootScopeSvc.veElementsOn() && this.rootScopeSvc.veEditMode()) || (!this.rootScopeSvc.veElementsOn() && !this.rootScopeSvc.veEditMode())) {
                    this.bbApi.toggleButtonState('show-elements');
                    this.rootScopeSvc.veElementsOn(!this.rootScopeSvc.veElementsOn());
                }
                this.bbApi.toggleButtonState('show-edits');
                this.rootScopeSvc.veEditMode(!this.rootScopeSvc.veEditMode());
            }));

            this.subs.push(this.eventSvc.$on('center-previous', () => {
                var prev = this.treeApi.getPrevBranch(this.treeApi.getSelectedBranch());
                if (!prev)
                    return;
                while (prev.type !== 'view' && prev.type !== 'section') {
                    prev = this.treeApi.getPrevBranch(prev);
                    if (!prev)
                        return;
                }
                this.bbApi.toggleButtonSpinner('center-previous');
                this.treeApi.selectBranch(prev);
                this.bbApi.toggleButtonSpinner('center-previous');
            }));

            this.subs.push(this.eventSvc.$on('center-next', () => {
                var next = this.treeApi.getNextBranch(this.treeApi.getSelectedBranch());
                if (!next)
                    return;
                while (next.type !== 'view' && next.type !== 'section') {
                    next = this.treeApi.getNextBranch(next);
                    if (!next)
                        return;
                }
                this.bbApi.toggleButtonSpinner('center-next');
                this.treeApi.selectBranch(next);
                this.bbApi.toggleButtonSpinner('center-next');
            }));

            // Share URL button settings
            this.dynamicPopover = this.shortenUrlSvc.dynamicPopover;
            this.copyToClipboard = this.shortenUrlSvc.copyToClipboard;
            this.handleShareURL = this.shortenUrlSvc.getShortUrl.bind(null, this.$location.absUrl(), this);

            if (this.viewOb && this.$state.includes('main.project.ref')) {
                this.$timeout(() => {
                    let data = {
                        elementOb: this.viewOb,
                        commitId: 'latest'
                    };
                    this.eventSvc.$broadcast('viewSelected', data);
                }, 1000);
            }

            this.searchOptions = {
                emptyDocTxt: 'This field is empty.',
                searchInput: this.search,
                getProperties: true,
                closeable: true,
                callback: (elementOb) => {
                    let data = {
                        elementOb: elementOb,
                        commitId: 'latest'
                    };
                    this.eventSvc.$broadcast('elementSelected', data);
                    if (typeof this.rootScopeSvc.rightPaneClosed() === 'boolean' && this.rootScopeSvc.rightPaneClosed())
                        this.eventSvc.$broadcast('right-pane-toggle', false);
                },
                relatedCallback: (doc, view, elem) => {//siteId, documentId, viewId) {
                    this.$state.go('main.project.ref.document.view', {
                        projectId: doc._projectId,
                        documentId: doc.id,
                        viewId: view.id,
                        refId: doc._refId,
                        search: undefined
                    });
                }
            };

            this.subs.push(this.eventSvc.$on('convert-pdf', () => {
                if (this.isPageLoading())
                    return;
                this.appUtilsSvc.printModal(angular.element("#print-div"), this.viewOb, this.refOb, false, 3)
                    .then((ob) => {
                        this.growl.info('Exporting as PDF file. Please wait for a completion email.', {ttl: -1});
                    }, (reason) => {
                        this.growl.error("Exporting as PDF file Failed: " + reason.message);
                    });
            }));

            this.subs.push(this.eventSvc.$on('print', () => {
                if (this.isPageLoading())
                    return;
                this.appUtilsSvc.printModal(angular.element("#print-div"), this.viewOb, this.refOb, false, 1);
            }));

            this.subs.push(this.eventSvc.$on('word', () => {
                if (this.isPageLoading())
                    return;
                this.appUtilsSvc.printModal(angular.element("#print-div"), this.viewOb, this.refOb, false, 2)
                    .then((ob) => {
                        this.growl.info('Exporting as Word file. Please wait for a completion email.', {ttl: -1});
                    }, (reason) => {
                        this.growl.error("Exporting as Word file Failed: " + reason.message);
                    });
            }));

            this.subs.push(this.eventSvc.$on('tabletocsv', () => {
                if (this.isPageLoading())
                    return;
                this.appUtilsSvc.tableToCsv(angular.element("#print-div"), false);
            }));

            this.subs.push(this.eventSvc.$on('refresh-numbering', () => {
                if (this.isPageLoading())
                    return;
                var printElementCopy = angular.element("#print-div");
                this.appUtilsSvc.refreshNumbering(this.treeApi.getRows(), printElementCopy);
            }));
        }

        $onChanges(onChangesObj: angular.IOnChangesObject) {
            handleChange(onChangesObj,'viewOb',(newVal => {
                if (newVal)
                    console.log("View Change:" + newVal.id)
            }));
        }

        $onDestroy() {
            this.eventSvc.$destroy(this.subs);
            this.buttonBarSvc.destroy(this.bars);
            console.log("Destroy View");
        }

        isPageLoading() {
            if (this.$element.find('.isLoading').length > 0) {
                this.growl.warning("Still loading!");
                return true;
            }
            return false;
        }

        elementTranscluded(elementOb, type) {
            if (type === 'Comment' && !this.comments.map.hasOwnProperty(elementOb.id)) {
                this.comments.map[elementOb.id] = elementOb;
                this.comments.count++;
                if (elementOb._modified > this.comments.lastCommented) {
                    this.comments.lastCommented = elementOb._modified;
                    this.comments.lastCommentedBy = elementOb._modifier;
                }
            }
        }

        elementClicked(elementOb) {
            let data = {
                elementOb: elementOb,
                commitId: 'latest'
            };
            this.eventSvc.$broadcast('elementSelected', data);
        }


        bbInit = (api:ButtonBarApi) => {
            if (this.viewOb && this.refOb.type === 'Branch' && this.permissionsSvc.hasBranchEditPermission(this.refOb)) {
                api.addButton(this.uxSvc.getButtonBarButton('show-edits'));
                api.setToggleState('show-edits', this.rootScopeSvc.veEditMode());
                // @ts-ignore
                this.hotkeys.bindTo(this.$scope).add({
                    combo: 'alt+d',
                    description: 'toggle edit mode',
                    callback: () => {
                        this.eventSvc.$broadcast('show-edits');
                    }
                });
            }
            api.addButton(this.uxSvc.getButtonBarButton('show-elements'));
            api.setToggleState('show-elements', this.rootScopeSvc.veElementsOn());
            api.addButton(this.uxSvc.getButtonBarButton('show-comments'));
            api.setToggleState('show-comments', this.rootScopeSvc.veCommentsOn());

            // Set hotkeys for toolbar
            this.hotkeys.bindTo(this.$scope)
                .add({
                    combo: 'alt+c',
                    description: 'toggle show comments',
                    callback: () => {
                        this.eventSvc.$broadcast('show-comments');
                    }
                }).add({
                combo: 'alt+e',
                description: 'toggle show elements',
                callback: () => {
                    this.eventSvc.$broadcast('show-elements');
                }
            });

            if (this.$state.includes('main.project.ref.preview') || this.$state.includes('main.project.ref.document')) {
                api.addButton(this.uxSvc.getButtonBarButton('refresh-numbering'));
                // api.addButton(this.uxSvc.getButtonBarButton('share-url'));
                api.addButton(this.uxSvc.getButtonBarButton('print'));
                if (this.$state.includes('main.project.ref.document')) {
                    var exportButtons: BButton = this.uxSvc.getButtonBarButton('export');
                    if (!exportButtons.dropdown_buttons)
                        exportButtons.dropdown_buttons = [];
                    exportButtons.dropdown_buttons.push(this.uxSvc.getButtonBarButton("convert-pdf"));
                    api.addButton(exportButtons);
                    api.addButton(this.uxSvc.getButtonBarButton('center-previous'));
                    api.addButton(this.uxSvc.getButtonBarButton('center-next'));
                    // Set hotkeys for toolbar
                    // @ts-ignore
                    this.hotkeys.bindTo(this.$scope)
                        .add({
                            combo: 'alt+.',
                            description: 'next',
                            callback: () => {
                                this.eventSvc.$broadcast('center-next');
                            }
                        }).add({
                        combo: 'alt+,',
                        description: 'previous',
                        callback: () => {
                            this.eventSvc.$broadcast('center-previous');
                        }
                    });
                } else {
                    api.addButton(this.uxSvc.getButtonBarButton('export'));
                }
            }
        }


    }
}

veApp.component(SingleViewComponent.selector,SingleViewComponent);
