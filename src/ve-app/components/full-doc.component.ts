import * as angular from 'angular';
import Rx from 'rx';
import {FullDocumentService, FullDocumentServiceFactory} from "../../ve-utils/services/FullDocument.service";
import {ShortenUrlService} from "../../ve-utils/services/ShortenUrl.service";
import {AppUtilsService} from "../services/AppUtils.service";
import {URLService} from "../../ve-utils/services/URL.provider";
import {UxService} from "../../ve-utils/services/Ux.service";
import {UtilsService} from "../../ve-utils/services/Utils.service";
import {PermissionsService} from "../../ve-utils/services/Permissions.service";
import {RootScopeService} from "../../ve-utils/services/RootScope.service";
import {TreeService} from "../../ve-utils/services/Tree.service";
import {EventService} from "../../ve-utils/services/Event.service";
import {Utils} from "../../ve-core/utilities/CoreUtils.service";
import {BButton, ButtonBarApi, ButtonBarService} from "../../ve-core/button-bar/ButtonBar.service";
import { StateService } from '@uirouter/angularjs';
import {ViewElement, ViewService} from "../../ve-utils/services/View.service";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";
import {ElementObject, ViewObject} from "../../ve-utils/types/mms";
import {TreeBranch, View2NodeMap} from "../../ve-utils/types/tree";

var veApp = angular.module('veApp');


/* Controller */
let FullDocumentComponent: VeComponentOptions = {
    selector: 'fullDocument',
    template: `
    <div ng-if="search === null">
    <fa-pane fa-pane="center-tb" pane-anchor="north" pane-size="36px" pane-no-toggle="true" pane-no-scroll="true" pane-closed="false">
        <div class="pane-center-toolbar">
            <div class="pane-center-btn-group">
                <button-bar bb-id="$ctrl.bbId" class="bordered-button-bar"></button-bar>
            </div>
        </div>
    </fa-pane>
    <fa-pane fa-pane="center" pane-anchor="center" pane-scroll-api="scrollApi" pane-closed="false">
        <i class="pane-center-spinner fa fa-5x fa-spinner fa-spin" ng-show="viewContentLoading"></i>
        <div class="ve-notify-banner" ng-show="refOb.type === 'Tag'">
            <span><strong>Tags are read only:</strong> Switch to a branch to edit</span>
        </div>
        <div class="container-fluid ve-secondary-text"> Document Last Modified: {{ $ctrl.latestElement | date:'M/d/yy h:mm a' }}</div>
        <div class="pane-center container-fluid" id="print-div">
            <div ng-repeat="view in $ctrl.views track by view.id" ng-class="{chapter: view.topLevel, 'first-chapter': view.first}">
                <view mms-element-id="view.id" mms-commit-id="latest" mms-project-id="$ctrl.projectOb.id" mms-ref-id="$ctrl.refOb.id" mms-number="view.number" mms-view-api="view.api"></view>
            </div>
        </div>
    </fa-pane>
</div>

<div ng-if="$ctrl.search !== null">
    <i class="pane-center-spinner fa fa-5x fa-spinner fa-spin" ng-show="viewContentLoading"></i>
    <mms-search mms-options="$ctrl.searchOptions" mms-project-id="$ctrl.projectOb.id" mms-ref-id="$ctrl.refOb.id"></mms-search>
</div>

<script type="text/ng-template" id="shareUrlTemplate.html">
    <p id="ve-short-url">
        {{($ctrl.shortUrl)}}
    </p>
    <button ng-click="copyToClipboard($event)" class="btn btn-sm btn-default"><i class="fa fa-copy"></i>Copy</button>
</script>    
`,
    bindings: {
        search: "<",
        projectOb: "<",
        refOb: "<",
        documentOb: "<" 
    },
    controller: class FullDocumentController implements angular.IComponentController {

        public subs: Rx.IDisposable[];
        bars: string[]
        bbApi: ButtonBarApi
        bbId = "full-doc"
        fullDocumentSvc: FullDocumentService;

        private search;
        private projectOb;
        private refOb;
        private documentOb;

        public viewContentLoading
        treeApi
        buttons = [];
        latestElement: Date;
        scrollApi;
        views: ViewElement[] = [] as ViewElement[];
        view2Children: {[key: string]: string[]}
        view2Node: View2NodeMap;
        num = 1;
        seenViewIds = {};


        private searchOptions: { searchInput: any; closeable: boolean; getProperties: boolean; relatedCallback: (doc, view, elem) => void; callback: (elementOb) => void; emptyDocTxt: string };
        private handleShareURL: any;
        private copyToClipboard: ($event) => void;
        private dynamicPopover: { templateUrl: "shareUrlTemplate.html"; title: "Share" };

        static $inject = ['$scope', '$window', '$state', '$anchorScroll', '$location', '$timeout', '$http', 'hotkeys', 'growl',
            'FullDocumentService', 'ShortenUrlService', 'AppUtilsService', 'Utils', 'UxService', 'URLService',
            'UtilsService', 'PermissionsService', 'RootScopeService', 'ViewService', 'TreeService', 'EventService', 'ButtonBarService']
        constructor(private $scope: angular.IScope, private $window: angular.IWindowService, private $state: StateService,
                    private $anchorScroll: angular.IAnchorScrollService, private $location: angular.ILocationService,
                    private $timeout: angular.ITimeoutService, private $http: angular.IHttpService,
                    private hotkeys: angular.hotkeys.HotkeysProvider, private growl: angular.growl.IGrowlService,
                    private fullDocumentFcty: FullDocumentServiceFactory, private shortenUrlSvc: ShortenUrlService,
                    private appUtilsSvc: AppUtilsService, private utils: Utils, private uxSvc: UxService,
                    private uRLSvc: URLService, private utilsSvc: UtilsService, private permissionsSvc: PermissionsService,
                    private rootScopeSvc: RootScopeService, private viewSvc: ViewService, private treeSvc: TreeService, private eventSvc: EventService,
                    private buttonBarSvc: ButtonBarService) {
            this.treeApi = this.treeSvc.getApi();
        }

        $onInit() {
            this.eventSvc.$init(this);
            this.viewContentLoading = false;

            this.subs.push(this.eventSvc.$on(this.rootScopeSvc.constants.VEVIEWCONTENTLOADING, (data) => {
                this.viewContentLoading = data;
            }));

            this.rootScopeSvc.veFullDocMode(true);
            if (!this.rootScopeSvc.veCommentsOn())
                this.rootScopeSvc.veCommentsOn(false);
            if (!this.rootScopeSvc.veElementsOn())
                this.rootScopeSvc.veElementsOn(false);
            if (!this.rootScopeSvc.veEditMode())
                this.rootScopeSvc.veEditMode(false);

            this.utils.toggleLeftPane(this.search);
            this.bbApi = this.buttonBarSvc.initApi(this.bbId,
                (api: ButtonBarApi) => {
                    if (this.documentOb && this.refOb.type === 'Branch' && this.permissionsSvc.hasBranchEditPermission(this.refOb)) {
                        api.addButton(this.uxSvc.getButtonBarButton('show-edits'));
                        api.setToggleState('show-edits', this.rootScopeSvc.veEditMode());
                        // @ts-ignore
                        this.hotkeys.bindTo(this.$scope)
                            .add({
                                combo: 'alt+d',
                                description: 'toggle edit mode',
                                callback: () => {
                                    this.eventSvc.$broadcast('show-edits');
                                }
                            });
                    }

                    api.addButton(this.uxSvc.getButtonBarButton('show-elements'));
                    api.addButton(this.uxSvc.getButtonBarButton('show-comments'));
                    api.addButton(this.uxSvc.getButtonBarButton('refresh-numbering'));
                    api.addButton(this.uxSvc.getButtonBarButton('print'));
                    var exportButtons: BButton = this.uxSvc.getButtonBarButton('export');
                    if (!exportButtons.dropdown_buttons) {
                        exportButtons.dropdown_buttons = [] as BButton[]
                    }
                        exportButtons.dropdown_buttons.push(this.uxSvc.getButtonBarButton("convert-pdf"));

                    api.addButton(exportButtons);
                    api.setToggleState('show-comments', this.rootScopeSvc.veCommentsOn());
                    api.setToggleState('show-elements', this.rootScopeSvc.veElementsOn());
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
                },this);

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
                        this.eventSvc.$broadcast('right-pane-toggle');
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
            // api to communicate with borderlayout library
            this.scrollApi = {
                notifyOnScroll: this.notifyOnScroll,
                isScrollVisible: () => {
                }, // pane's directive (in borderlayout) resets this to the right function
                throttleRate: 500, // how often should the wheel event triggered
                threshold: 3000, // how far from the bottom of the page before adding more views
                frequency: 100 // how fast to add more views
            };

            this.view2Node[this.documentOb.id] = {
                label: this.documentOb.name,
                data: this.documentOb,
                type: 'view',
                children: (this.documentOb._childViews) ? this.documentOb._childViews : []
            };
            this.view2Children[this.documentOb.id] = []

            this._createViews().then(() => {
                // The Controller codes get executed before all the directives'
                // code in its template ( full-doc.html ). As a result, use $timeout here
                // to let them finish first because in this case
                // we rely on fa-pane directive to setup isScrollVisible
                this.$timeout(() => {
                    this.fullDocumentSvc = this.fullDocumentFcty.get(this.views);
                    this.fullDocumentSvc.addInitialViews(this.scrollApi.isScrollVisible);
                    this.views = this.fullDocumentSvc.viewsBuffer;
                });
            });

            this.subs.push(this.eventSvc.$on('mms-tree-click', (branch) => {
                this.fullDocumentSvc.handleClickOnBranch(branch, () => {
                    this.$location.hash(branch.data.id);
                    this.$anchorScroll();
                });
            }));

            this.subs.push(this.eventSvc.$on('mms-full-doc-view-deleted', (deletedBranch) => {
                this.fullDocumentSvc.handleViewDelete(deletedBranch);
            }));

            this.subs.push(this.eventSvc.$on('mms-new-view-added', (data) => {
                this.fullDocumentSvc.handleViewAdd(this._buildViewElement(data.vId, data.curSec), data.prevSibId);
            }));

            this.subs.push(this.eventSvc.$on('show-comments', () => {
                this.bbApi.toggleButtonState('show-comments');
                this.rootScopeSvc.veCommentsOn(!this.rootScopeSvc.veCommentsOn());
            }));

            this.subs.push(this.eventSvc.$on('show-elements', () => {
                this.bbApi.toggleButtonState('show-elements');
                this.rootScopeSvc.veElementsOn(!this.rootScopeSvc.veElementsOn());
            }));

            this.subs.push(this.eventSvc.$on('show-edits', () => {
                var i = 0;
                if ((this.rootScopeSvc.veElementsOn() && this.rootScopeSvc.veEditMode()) || (!this.rootScopeSvc.veElementsOn() && !this.rootScopeSvc.veEditMode())) {
                    this.bbApi.toggleButtonState('show-elements');
                    this.rootScopeSvc.veElementsOn(!this.rootScopeSvc.veElementsOn());
                }
                this.bbApi.toggleButtonState('show-edits');
                this.rootScopeSvc.veEditMode(!this.rootScopeSvc.veEditMode());
            }));

            this.subs.push(this.eventSvc.$on('convert-pdf', () => {
                this.fullDocumentSvc.loadRemainingViews(() => {
                    this.appUtilsSvc.printModal(angular.element("#print-div"), this.documentOb, this.refOb, true, 3)
                        .then((ob) => {
                            this.growl.info('Exporting as PDF file. Please wait for a completion email.', {ttl: -1});
                        }, (reason) => {
                            this.growl.error("Exporting as PDF file Failed: " + reason.message);
                        });
                });
            }));

            this.subs.push(this.eventSvc.$on('print', () => {
                this.fullDocumentSvc.loadRemainingViews(() => {
                    this.appUtilsSvc.printModal(angular.element("#print-div"), this.documentOb, this.refOb, true, 1);
                });
            }));

            this.subs.push(this.eventSvc.$on('word', () => {
                this.fullDocumentSvc.loadRemainingViews(() => {
                    this.appUtilsSvc.printModal(angular.element("#print-div"), this.documentOb, this.refOb, true, 2)
                        .then((ob) => {
                            this.growl.info('Exporting as Word file. Please wait for a completion email.', {ttl: -1});
                        }, (reason) => {
                            this.growl.error("Exporting as Word file Failed: " + reason.message);
                        });
                });
            }));

            this.subs.push(this.eventSvc.$on('tabletocsv', () => {
                this.fullDocumentSvc.loadRemainingViews(() => {
                    this.appUtilsSvc.tableToCsv(angular.element("#print-div"), true);
                });
            }));

            this.subs.push(this.eventSvc.$on('refresh-numbering', () => {
                this.fullDocumentSvc.loadRemainingViews(() => {
                    this.appUtilsSvc.refreshNumbering(this.treeApi.getRows(), angular.element("#print-div"));
                });
            }));

            // Share URL button settings
            this.dynamicPopover = this.shortenUrlSvc.dynamicPopover;
            this.copyToClipboard = this.shortenUrlSvc.copyToClipboard;
            this.handleShareURL = this.shortenUrlSvc.getShortUrl.bind(null, this.$location.absUrl(), this);
        }


        private _createViews() {
            var loadingViewsFromServer = this.growl.info('Loading data from server!', {ttl: -1});
            this.views.push({
                id: this.documentOb.id,
                api:
                    {
                        elementTranscluded: this._elementTranscluded,
                        elementClicked: this._elementClicked
                    }
            });
            if (!this.documentOb._childViews) {
                this.documentOb._childViews = [];
            }
            return this.viewSvc.handleChildViews(this.documentOb, 'composite', undefined, this.projectOb.id,
                this.refOb.id, this.view2Node, this._handleSingleView)
                .then((childIds: string[]) => {
                    for (var i = 0; i < childIds.length; i++) {
                        this._constructViews(childIds[i], this.num);
                        this.num = this.num + 1;
                    }
                }).finally(loadingViewsFromServer.destroy);
        }

        private _elementTranscluded(elementOb: ElementObject, type: string) {
            if (elementOb && type !== 'Comment') {
                if (elementOb._modified && elementOb._modified > this.latestElement)
                    this.latestElement = elementOb._modified;
            }
        }

        private _elementClicked(elementOb) {
            let data = {
                elementOb: elementOb,
                commitId: 'latest'
            };
            this.eventSvc.$broadcast('elementSelected', data);
        }

        private _buildViewElement(vId, curSec): ViewElement {
            return {
                id: vId,
                api: {
                    elementTranscluded: this._elementTranscluded,
                    elementClicked: this._elementClicked
                },
                number: curSec,
                topLevel: (curSec ? (curSec.toString().indexOf('.') === -1) : false),
                first: curSec == 1
            };
        }

        private _constructViews(viewId, curSection) {
            this.views.push(this._buildViewElement(viewId, curSection));

            if (this.view2Children[viewId] && Array.isArray(this.view2Children[viewId])) {
                var num = 1;
                let childIds = this.view2Children[viewId] as string[];
                for (var i = 0; i < childIds.length; i++) {
                    this._constructViews(this.view2Children[viewId][i], curSection + '.' + num);
                    num = num + 1;
                }
            }
        }

        private _handleSingleView(v: ViewObject, aggr: string): string[] {
            var childIds = this.view2Children[v.id];
            if (!childIds) {
                childIds = [];
            }
            this.view2Children[v.id] = childIds;
            if (!v._childViews || v._childViews.length === 0 || aggr === 'none') {
                return childIds;
            }
            for (var i = 0; i < v._childViews.length; i++) {
                if (this.seenViewIds[v._childViews[i].id]) {
                    continue;
                }
                this.seenViewIds[v._childViews[i].id] = true;
                childIds.push(v._childViews[i].id);
            }
            return childIds;
        }

        public notifyOnScroll() {
            return this.fullDocumentSvc.handleDocumentScrolling();
        }
    }
}

veApp.component(FullDocumentComponent.selector, FullDocumentComponent);
