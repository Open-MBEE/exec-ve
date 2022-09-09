import * as angular from 'angular';
import Rx from 'rx-lite';
import {
    PermissionsService,
    ViewElement,
    ViewService,
    URLService
} from "@ve-utils/mms-api-client"
import {
    EventService,
    FullDocumentService,
    FullDocumentServiceFactory,
    RootScopeService,
    ShortenUrlService,
    TreeService,
    UtilsService,
} from "@ve-utils/core-services";
import {AppUtilsService} from "@ve-app/main/services";
import {IButtonBarButton, ButtonBarApi, ButtonBarService} from "@ve-utils/button-bar";
import {StateService} from '@uirouter/angularjs';
import {VeComponentOptions} from "@ve-types/view-editor";
import {ElementObject, ViewObject} from "@ve-types/mms";
import {View2NodeMap} from "@ve-types/tree";

import {veApp} from "@ve-app";
import {ContentWindowService} from "@ve-app/pane-center/services/ContentWindow.service";

class FullDocumentController implements angular.IComponentController {

    public subs: Rx.IDisposable[];
    bars: string[]
    bbApi: ButtonBarApi
    bbId = "full-doc"
    fullDocumentSvc: FullDocumentService;

    private projectOb;
    private refOb;
    private documentOb;

    public viewContentLoading
    treeApi
    buttons = [];
    latestElement: Date;
    scrollApi;
    views: ViewElement[] = [] as ViewElement[];
    view2Children: {[key: string]: string[]} = {};
    view2Node: View2NodeMap = {};
    num = 1;
    seenViewIds = {};


    private handleShareURL: any;
    private copyToClipboard: ($event) => void;
    private dynamicPopover: { templateUrl: "shareUrlTemplate.html"; title: "Share" };

    static $inject = ['$scope', '$window', '$state', '$anchorScroll', '$location', '$timeout', '$http', 'hotkeys', 'growl',
        'FullDocumentService', 'ShortenUrlService', 'AppUtilsService', 'ContentWindowService', 'URLService',
        'UtilsService', 'PermissionsService', 'RootScopeService', 'ViewService', 'TreeService', 'EventService', 'ButtonBarService']
    constructor(private $scope: angular.IScope, private $window: angular.IWindowService, private $state: StateService,
                private $anchorScroll: angular.IAnchorScrollService, private $location: angular.ILocationService,
                private $timeout: angular.ITimeoutService, private $http: angular.IHttpService,
                private hotkeys: angular.hotkeys.HotkeysProvider, private growl: angular.growl.IGrowlService,
                private fullDocumentFcty: FullDocumentServiceFactory, private shortenUrlSvc: ShortenUrlService,
                private appUtilsSvc: AppUtilsService, private contentWindowSvc: ContentWindowService,
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

        this.bbApi = this.buttonBarSvc.initApi(this.bbId,
            (api: ButtonBarApi) => {
                if (this.documentOb && this.refOb.type === 'Branch' && this.permissionsSvc.hasBranchEditPermission(this.refOb)) {
                    api.addButton(this.buttonBarSvc.getButtonBarButton('show-edits'));
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

                api.addButton(this.buttonBarSvc.getButtonBarButton('show-elements'));
                api.addButton(this.buttonBarSvc.getButtonBarButton('show-comments'));
                api.addButton(this.buttonBarSvc.getButtonBarButton('refresh-numbering'));
                api.addButton(this.buttonBarSvc.getButtonBarButton('print'));
                var exportButtons: IButtonBarButton = this.buttonBarSvc.getButtonBarButton('export');
                if (!exportButtons.dropdown_buttons) {
                    exportButtons.dropdown_buttons = [] as IButtonBarButton[]
                }
                exportButtons.dropdown_buttons.push(this.buttonBarSvc.getButtonBarButton("convert-pdf"));

                api.addButton(exportButtons);
                api.setToggleState('show-comments', this.rootScopeSvc.veCommentsOn());
                api.setToggleState('show-elements', this.rootScopeSvc.veElementsOn());
                // @ts-ignore
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
            },this);

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
            // we rely on ng-pane directive to setup isScrollVisible
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

        this.subs.push(
            this.eventSvc.$on('show-comments', (data?:boolean) => {

                this.bbApi.toggleButtonState('show-comments', (data != null) ? data : null);
                this.rootScopeSvc.veCommentsOn((data != null) ? data :
                    !this.rootScopeSvc.veCommentsOn()
                )
            })
        )

        this.subs.push(
            this.eventSvc.$on('show-elements', (data?: boolean) => {
                this.bbApi.toggleButtonState('show-elements', (data != null) ? data : null)
                this.rootScopeSvc.veElementsOn((data != null) ? data :
                    !this.rootScopeSvc.veElementsOn()
                )
                if ((!this.rootScopeSvc.veElementsOn() && this.rootScopeSvc.veEditMode())) {
                    this.eventSvc.$broadcast('show-edits', false);
                }
            })
        )

        this.subs.push(
            this.eventSvc.$on('show-edits', (data?:boolean) => {
                this.bbApi.toggleButtonState('show-edits', (data != null) ? data : null)
                this.rootScopeSvc.veEditMode((data != null) ? data :
                    !this.rootScopeSvc.veEditMode()
                )
                if ((this.rootScopeSvc.veElementsOn() && !this.rootScopeSvc.veEditMode()) || (!this.rootScopeSvc.veElementsOn() && this.rootScopeSvc.veEditMode())) {
                    this.eventSvc.$broadcast('show-elements', this.rootScopeSvc.veEditMode());
                }
            })
        )

        if (!this.rootScopeSvc.veFullDocMode())
            this.rootScopeSvc.veFullDocMode(true)
        if (this.rootScopeSvc.veCommentsOn())
            this.eventSvc.$broadcast('show-comments', false)
        if (this.rootScopeSvc.veElementsOn())
            this.eventSvc.$broadcast('show-elements', false)
        if (this.rootScopeSvc.veEditMode())
            this.eventSvc.$broadcast('show-edits', false)

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


    private _createViews = () => {
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

    private _elementTranscluded = (elementOb: ElementObject, type: string) => {
        if (elementOb && type !== 'Comment') {
            if (elementOb._modified && elementOb._modified > this.latestElement)
                this.latestElement = elementOb._modified;
        }
    }

    private _elementClicked = (elementOb) => {
        let data = {
            elementOb: elementOb,
            commitId: 'latest'
        };
        this.eventSvc.$broadcast('element.selected', data);
    }

    private _buildViewElement = (vId, curSec): ViewElement => {
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

    private _constructViews = (viewId, curSection) => {
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

    private _handleSingleView = (v: ViewObject, aggr: string): string[] => {
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

    public notifyOnScroll = () => {
        return this.fullDocumentSvc.handleDocumentScrolling();
    }
}

/* Controller */
let DocumentComponent: VeComponentOptions = {
    selector: 'document',
    template: `
    <div>
    <ng-pane pane-id="center-toolbar" pane-closed="false" pane-anchor="north" pane-size="36px" pane-no-toggle="true" pane-no-scroll="true" parent-ctrl="$ctrl">
        <div class="pane-center-toolbar">
            <div class="pane-center-btn-group">
                <button-bar button-api="$ctrl.bbApi" class="bordered-button-bar"></button-bar>
            </div>
        </div>
    </ng-pane>
    <ng-pane pane-id="center-view" pane-closed="false" pane-anchor="center" pane-no-toggle="true" parent-ctrl="$ctrl">
        <i class="pane-center-spinner fa fa-5x fa-spinner fa-spin" ng-show="viewContentLoading"></i>
        <div class="ve-notify-banner" ng-show="$ctrl.refOb.type === 'Tag'">
            <span><strong>Tags are read only:</strong> Switch to a branch to edit</span>
        </div>
        <div class="container-fluid ve-secondary-text"> Document Last Modified: {{ $ctrl.latestElement | date:'M/d/yy h:mm a' }}</div>
        <div class="pane-center container-fluid" id="print-div">
            <div ng-repeat="view in $ctrl.views track by view.id" ng-class="{chapter: view.topLevel, 'first-chapter': view.first}">
                <view mms-element-id="{{view.id}}" mms-commit-id="latest" mms-project-id="{{$ctrl.projectOb.id}}" mms-ref-id="{{$ctrl.refOb.id}}" mms-number="{{view.number}}" mms-view-api="view.api"></view>
            </div>
        </div>
    </ng-pane>
</div>

<script type="text/ng-template" id="shareUrlTemplate.html">
    <p id="ve-short-url">
        {{($ctrl.shortUrl)}}
    </p>
    <button ng-click="$ctrl.copyToClipboard($event)" class="btn btn-sm btn-default"><i class="fa fa-copy"></i>Copy</button>
</script>    
`,
    bindings: {
        projectOb: "<",
        refOb: "<",
        documentOb: "<"
    },
    controller: FullDocumentController
}

veApp.component(DocumentComponent.selector, DocumentComponent);
