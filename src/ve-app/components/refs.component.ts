import * as angular from 'angular';
import {IWindowService} from 'angular';
import Rx from 'rx-lite';
import * as _ from 'lodash';

import {StateService} from '@uirouter/angularjs';
import {ApplicationService, ElementService, EventService, ProjectService, RootScopeService} from "@ve-utils/services";
import {AppUtilsService} from "../services/AppUtils.service";
import {VeComponentOptions} from "@ve-types/view-editor";
import {RefObject} from "@ve-types/mms";

import {veApp} from "@ve-app";

let RefsComponent: VeComponentOptions = {
    selector: 'refs',
    template: `
    <div class="container-fluid ve-no-panes">
    <div class="row">
        <div class="col-md-10 col-md-offset-1">
            <a class="back-to-docs" ui-sref="main.project.ref({refId: $ctrl.fromParams.id, search: undefined})"
               ui-sref-opts="{reload:true}">Back to Project Documents ({{$ctrl.fromParams.name}})</a>
            <h1 class="panel-title">Manage Project branches/tags</h1>
            <div class="panel panel-default">
                <div class="panel-body no-padding-panel">
                    <div ng-show="$ctrl.refManageView" class="col-md-4 ve-light-list-panels">
                        <ul class="ve-light-list">
                            <li class="ve-light-input">
                                <input placeholder="Filter branches/tags" class="ve-plain-input" ng-model="$ctrl.refFilter">
                            </li>
                            <li class="ref-title">
                                <h2><i class="fa fa-code-fork" aria-hidden="true"></i>Branches</h2>
                            </li>
                            <li class="ref-item" ng-repeat="branch in $ctrl.branches | orderBy:'name' | filter:{name:$ctrl.refFilter}" ng-click="$ctrl.refClickHandler(branch)"
                                ng-class="{'selected': branch.id === $ctrl.refSelected.id}">
                                <a>{{ branch.name }}</a>
                            </li>
                            <li class="ref-title">
                                <h2><i class="fa fa-tag" aria-hidden="true"></i>Tags</h2>
                            </li>
                            <li class="ref-item" ng-repeat="tag in $ctrl.tags | orderBy:'name' | filter:{name:$ctrl.refFilter}" ng-click="$ctrl.refClickHandler(tag)"
                                ng-class="{'selected': tag.id === $ctrl.refSelected.id}">
                                <a>{{ tag.name }}</a>
                            </li>
                            <li ng-if="!tags.length" class="ve-secondary-text">No Tags</li>
                        </ul>
                    </div>
                    <div class="col-md-8 ve-light-panels-detail" ng-show="$ctrl.refSelected">
                        <div class="panels-detail-title clearfix">
                            <h3 class="{{$ctrl.refSelected.type}}-icon">{{$ctrl.refSelected.name}}</h3>
                            <div class="ref-button-options" style="float:right">
                            <button class="btn btn-default" ng-disabled="$ctrl.refSelected.status === 'creating'" type="button" ng-click="$ctrl.deleteRef()" ng-if="$ctrl.refSelected.id != 'master'"><i class="fa fa-trash"></i> Delete</button>
                            <button class="btn btn-primary" ng-disabled="$ctrl.refSelected.status === 'creating'" type="button" ng-click="$ctrl.addTag()"><i class="fa fa-plus"></i> Tag</button>
                            <button class="btn btn-primary" ng-disabled="$ctrl.refSelected.status === 'creating'" type="button" ng-click="$ctrl.addBranch()"><i class="fa fa-plus"></i> Branch</button>
                            </div>
                            <!-- <button-bar buttons="buttons" mms-bb-api="bbApi"></button-bar> -->
                        </div>
                        <dl class="dl-horizontal ve-light-panels-detail-content">
                            <dt></dt>
                            <dd ng-hide="$ctrl.refSelected.status === 'creating'" class="link-section">
                                <a ui-sref="main.project.ref({refId: $ctrl.refSelected.id, search: undefined})" ui-sref-opts="{reload:true}">Project Documents</a>
                            </dd>
                            <dd ng-show="$ctrl.refSelected.status === 'creating'" class="link-section">
                                <span uib-tooltip-html="$ctrl.htmlTooltip" tooltip-placement="top" tooltip-trigger="mouseenter"
                                    tooltip-append-to-body="$ctrl.refSelected.status == 'creating'" tooltip-enable="$ctrl.refSelected.status == 'creating'"
                                    ng-class="{'branch-disabled': $ctrl.refSelected.status == 'creating'}">Project Documents</span>
                            </dd>
                            <dt>Id</dt>
                            <dd>{{$ctrl.refSelected.id}}</dd>
                            <dt>Type</dt>
                            <dd>{{$ctrl.refSelected.type}}</dd>
                            <dt>Description</dt>
                            <dd>{{$ctrl.refSelected.description}}</dd>
                            <span ng-if="refSelected.id != 'master'">
                            <dt>Time Created</dt>
                            <dd>{{$ctrl.refSelected._created}}</dd>
                            <dt>Creator</dt>
                            <dd>{{$ctrl.refSelected._creator}}</dd>
                            <!-- <dt>Last Modified</dt>
                            <dd>{{refSelected._modified}}</dd> -->
                            <dt>Modifier</dt>
                            <dd>{{$ctrl.refSelected._modifier}}</dd>
                            <dt>Parent Ref</dt>
                            <dd>{{$ctrl.refSelected.parentRefId}}</dd>
                            </span>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>      
`,
    bindings: {
        mmsOrg: "<",
        mmsProject: "<",
        mmsRef: "<",
        mmsRefs: "<",
        mmsTags: "<",
        mmsBranches: "<"
    },
    controller: class RefsController{
        static $inject = ['$sce', '$q', '$filter', '$location', '$uibModal', '$state', '$timeout', '$window', 'growl',
            'ElementService', 'ProjectService', 'AppUtilsService', 'ApplicationService', 'RootScopeService',
            'EventService']

        public subs: Rx.IDisposable[];

        //Bindings
         public mmsOrg
            mmsProject
            mmsRef
            mmsRefs
            mmsTags
            mmsBranches

        //Local
        public refManageView;
            refData
            bbApi
            buttons
            branches
            tags
            activeTab
            refSelected
            search
            view
            fromParams
            htmlTooltip
            addItemData

        constructor(private $sce: angular.ISCEService, private $q: angular.IQService,
                    private $filter: angular.IFilterService, private $location: angular.ILocationService,
                    private $uibModal: angular.ui.bootstrap.IModalService, private $state: StateService,
                    private $timeout: angular.ITimeoutService, private $window: IWindowService,
                    private growl: angular.growl.IGrowlService, private elementSvc: ElementService,
                    private projectSvc: ProjectService, private appUtilsSvc: AppUtilsService,
                    private applicationSvc: ApplicationService, private rootScopeSvc: RootScopeService,
                    private eventSvc: EventService) {}

        $onInit() {
            this.eventSvc.$init(this);

            this.rootScopeSvc.mmsRefOb(this.mmsRef);
            this.refManageView = true;
            this.refData = [];
            this.bbApi = {};
            this.buttons = [];
            this.branches = this.mmsBranches;
            this.tags = this.mmsTags;
            this.activeTab = 0;
            this.refSelected = null;
            this.search = null;
            this.view = null;
            this.fromParams = {};

            if (_.isEmpty(this.mmsRef)) {
                this.selectMasterDefault();
            } else {
                this.fromParams = this.mmsRef;
                this.refSelected = this.mmsRef;
            }

            this.htmlTooltip = this.$sce.trustAsHtml('Branch temporarily unavailable during duplication.');

            this.subs.push(this.eventSvc.$on('fromParamChange', (fromParams) => {
                let index = _.findIndex(this.mmsRefs, {name: fromParams.refId});
                if ( index > -1 ) {
                    this.fromParams = this.mmsRefs[index];
                }
            }));

        }

        selectMasterDefault() {
            var masterIndex = _.findIndex(this.mmsRefs, {name: 'master'});
            if (masterIndex > -1) {
                this.fromParams = this.mmsRefs[masterIndex];
                this.refSelected = this.mmsRefs[masterIndex];
            }
        };


        addBranch(e) {
            this.addItem('Branch');
        };

        addTag(e) {
            this.addItem('Tag');
        };

        deleteRef(e) {
            this.deleteItem();
        };


        refClickHandler(ref) {
            this.projectSvc.getRef(ref.id, this.mmsProject.id).then(
            (data) => {
                this.refSelected = data;
            },
            (error) => {
                this.growl.error("Ref click handler error: " + error );
                return;
            });
        };

        addItem(itemType) {
            this.addItemData = {
                itemType: itemType,
                createParentRefId: {},
                from: ""
            }
            let branch = this.refSelected;
            // Item specific setup:
            if (itemType === 'Branch') {
                if (!branch) {
                    this.growl.warning("Add Branch Error: Select a branch or tag first");
                    return;
                }
                if (branch.type === 'Tag') {
                    this.addItemData.from = 'Tag ' + branch.name;
                } else {
                    this.addItemData.from = 'Branch ' + branch.name;
                }
                this.addItemData.createParentRefId = branch.id;
            } else if (itemType === 'Tag') {
                if (!branch) {
                    this.growl.warning("Add Tag Error: Select a branch or tag first");
                    return;
                }
                this.addItemData.createParentRefId = branch.id;
            } else {
                this.growl.error("Add Item of Type " + itemType + " is not supported");
                return;
            }
            let instance = this.$uibModal.open({
                component: 'addItemModal',
                resolve: {
                    getAddData: () => {
                        return this.addItemData;
                    },
                    getFilter: () => {
                        return this.$filter;
                    },
                    getProjectOb: () => {
                        return this.mmsProject;
                    },
                    getRefOb: () => {
                        return this.mmsRef;
                    },
                    getOrgOb: () => {
                        return this.mmsOrg;
                    },
                    getSeenViewIds: () => {
                        return null;
                    }
                }
            });
        instance.result.then((data) => {
        //TODO add load handling once mms returns status
        let tag: RefObject[] = [];
        for (let i = 0; i < this.mmsRefs.length; i++) {
            if (this.mmsRefs[i].type === "Tag")
                tag.push(this.mmsRefs[i]);
        }
        this.tags = tag;

        let branches: RefObject[] = [];
        for (let j = 0; j < this.mmsRefs.length; j++) {
            if (this.mmsRefs[j].type === "Branch")
                branches.push(this.mmsRefs[j]);
        }
        this.branches = branches;
        if (data.type === 'Branch') {
            //data.loading = true;
            //$scope.branches.push(data);
            this.refSelected = data;
            this.activeTab = 0;
        } else {
            //data.loading = true;
            //$scope.tags.push(data);
            this.refSelected = data;
            this.activeTab = 1;
        }
    });
};

deleteItem() {
    let branch = this.refSelected;
    if (!branch) {
        this.growl.warning("Select item to delete.");
        return;
    }
    let instance = this.$uibModal.open({
        component: "confirmDeleteModal",
        resolve: {
            getName: () => {
                return branch.name;
            },
            getType: () => {
                if (branch.type === 'Tag') {
                    return 'Tag';
                } else if (branch.type === 'Branch') {
                    return 'Branch';
                }
            },
            ok: () => {
                let promise = this.projectSvc.deleteRef(branch.id, this.mmsProject.id);
                if (promise) {
                    promise.then(() => {
                        return true;
                    }, (reason) => {
                        return reason;
                    });
                }else {
                    return false;
                }
            }
        }
    });
    instance.result.then(() => {
        //TODO $state project with no selected ref
        let index;
        if (this.refSelected.type === 'Branch') {
            index = this.branches.indexOf(this.refSelected);
            this.branches.splice(index, 1);
            this.selectMasterDefault();
        } else if (this.refSelected.type === 'Tag') {
            index = this.tags.indexOf(this.refSelected);
            this.tags.splice(index, 1);
        }
        this.refSelected = null;
    });
        }
    }
}

veApp.component(RefsComponent.selector,RefsComponent);