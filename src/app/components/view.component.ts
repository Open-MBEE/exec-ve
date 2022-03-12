import * as angular from 'angular';
import { StateService } from '@uirouter/angularjs';
import {AppUtilsService} from "../services/AppUtils.service";
import {URLService} from "../../mms/services/URLService.provider";
import {UxService} from "../../mms/services/UxService.service";
import {UtilsService} from "../../mms/services/UtilsService.service";
import {ShortenUrlService} from "../../mms/services/ShortenUrlService.service";
import {PermissionsService} from "../../mms/services/PermissionsService.service";
import {RootScopeService} from "../../mms/services/RootScopeService.service";
import {TreeApi, TreeService} from "../../mms/services/TreeService.service";
import {Utils} from "../../mms-directives/services/Utils.service";
import {EventService} from "../../mms/services/EventService.service";
import {ButtonBarService} from "../../mms-directives/services/ButtonBar.service";


var mmsApp = angular.module('mmsApp');


/* Controllers */
let ViewComponent: angular.ve.ComponentOptions = {
    selector: 'view',
    template: `
    <div ng-if="$ctrl.view !== null && $ctrl.search === null">
    <div fa-pane pane-anchor="north" pane-size="36px" pane-no-toggle="true" pane-no-scroll="true">
        <div class="pane-center-toolbar">
            <div class="pane-center-btn-group">
                <button-bar buttons="$ctrl.buttons" mms-bb-api="$ctrl.bbApi" class="bordered-button-bar"></button-bar>
            </div>
        </div>
    </div>
    <div fa-pane pane-anchor="center">
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
                    <mms-view mms-element-id="{{$ctrl.viewOb.id}}" mms-commit-id="latest"
                              mms-project-id="{{$ctrl.projectOb.id}}" mms-ref-id="{{$ctrl.refOb.id}}"
                                mms-link="$ctrl.vidLink"></mms-view>
                </div>
            </div>
        </div>
    </div>
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
        static $inject = ['$state', '$timeout', '$window', '$location',
            '$http', '$element', 'growl', 'hotkeys', 'AppUtilsService', 'UxService', 'URLService', 'UtilsService',
            'ShortenUrlService', 'Utils', 'search', 'orgOb', 'projectOb', 'refOb', 'groupOb', 'documentOb', 'viewOb',
            'PermissionsService', 'RootScopeService', 'TreeService', 'EventService']

        public search;
        orgOb;
        projectOb;
        refOb;
        groupOb;
        documentOb;
        viewOb;

        private treeApi: TreeApi;
        subs: Array<Promise<PushSubscription>>;
        vidLink: boolean;
        ve_viewContentLoading: boolean;

        public bbApi
        bbId = 'view-ctrl';
        comments = {
            count: 0,
            lastCommented: '',
            lastCommentedBy: '',
            map: {}
        };
        buttons: any;
        dynamicPopover: { templateUrl: "shareUrlTemplate.html"; title: "Share"; };
        copyToClipboard: ($event: any) => void;
        handleShareURL: any;
        searchOptions: { emptyDocTxt: string; searchInput: any; getProperties: boolean; closeable: boolean; callback: (elementOb: any) => void; relatedCallback: (doc: any, view: any, elem: any) => void; };

        constructor(private $state: StateService, private $timeout: angular.ITimeoutService,
                    private $window: angular.IWindowService, private $location: angular.ILocationService,
                    private $http: angular.IHttpService, private $element: angular.IRootElementService,
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

            this.bbApi = this.buttonBarSvc.initApi(this.bbId, () => {
                if (this.viewOb && this.refOb.type === 'Branch' && this.permissionsSvc.hasBranchEditPermission(this.refOb)) {
                    this.bbApi.addButton(this.uxSvc.getButtonBarButton('show-edits'));
                    this.bbApi.setToggleState('show-edits', this.rootScopeSvc.veEditMode());
                    // @ts-ignore
                    this.hotkeys.bindTo(this)
                        .add({
                            combo: 'alt+d',
                            description: 'toggle edit mode',
                            callback: () => {
                                this.eventSvc.$broadcast('show-edits');
                            }
                        });
                }
                this.bbApi.addButton(this.uxSvc.getButtonBarButton('show-elements'));
                this.bbApi.setToggleState('show-elements', this.rootScopeSvc.veElementsOn());
                this.bbApi.addButton(this.uxSvc.getButtonBarButton('show-comments'));
                this.bbApi.setToggleState('show-comments', this.rootScopeSvc.veCommentsOn());

                // Set hotkeys for toolbar
                // @ts-ignore
                this.hotkeys.bindTo(this)
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
                    this.bbApi.addButton(this.uxSvc.getButtonBarButton('refresh-numbering'));
                    // this.bbApi.addButton(this.uxSvc.getButtonBarButton('share-url'));
                    this.bbApi.addButton(this.uxSvc.getButtonBarButton('print'));
                    if (this.$state.includes('main.project.ref.document')) {
                        var exportButtons = this.uxSvc.getButtonBarButton('export');
                        exportButtons.dropdown_buttons.push(this.uxSvc.getButtonBarButton("convert-pdf"));
                        this.bbApi.addButton(exportButtons);
                        this.bbApi.addButton(this.uxSvc.getButtonBarButton('center-previous'));
                        this.bbApi.addButton(this.uxSvc.getButtonBarButton('center-next'));
                        // Set hotkeys for toolbar
                        // @ts-ignore
                        this.hotkeys.bindTo(this)
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
                        this.bbApi.addButton(this.uxSvc.getButtonBarButton('export'));
                    }
                }
            });


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
                var prev = this.treeApi.get_prev_branch(this.treeApi.get_selected_branch());
                if (!prev)
                    return;
                while (prev.type !== 'view' && prev.type !== 'section') {
                    prev = this.treeApi.get_prev_branch(prev);
                    if (!prev)
                        return;
                }
                this.bbApi.toggleButtonSpinner('center-previous');
                this.treeApi.select_branch(prev);
                this.bbApi.toggleButtonSpinner('center-previous');
            }));

            this.subs.push(this.eventSvc.$on('center-next', () => {
                var next = this.treeApi.get_next_branch(this.treeApi.get_selected_branch());
                if (!next)
                    return;
                while (next.type !== 'view' && next.type !== 'section') {
                    next = this.treeApi.get_next_branch(next);
                    if (!next)
                        return;
                }
                this.bbApi.toggleButtonSpinner('center-next');
                this.treeApi.select_branch(next);
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
                this.appUtilsSvc.refreshNumbering(this.treeApi.get_rows(), printElementCopy);
            }));
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


    }
}

mmsApp.component(ViewComponent.selector,ViewComponent);
