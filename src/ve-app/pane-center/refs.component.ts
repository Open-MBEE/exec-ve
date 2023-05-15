import { StateService } from '@uirouter/angularjs';
import angular, { IWindowService } from 'angular';
import _ from 'lodash';
import Rx from 'rx-lite';

import { AppUtilsService } from '@ve-app/main/services';
import { ContentWindowService } from '@ve-app/pane-center/services/ContentWindow.service';
import { InsertRefData } from '@ve-components/insertions/components/insert-ref.component';
import { ConfirmDeleteModalResolveFn } from '@ve-core/modals';
import { ApplicationService, RootScopeService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { ProjectService, ElementService } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

import { VeComponentOptions, VeQService } from '@ve-types/angular';
import { InsertResolveFn } from '@ve-types/components';
import { ProjectObject, RefObject } from '@ve-types/mms';
import { VeModalService, VeModalSettings } from '@ve-types/view-editor';

class RefsController {
    static $inject = [
        '$sce',
        '$q',
        '$filter',
        '$location',
        '$uibModal',
        '$state',
        '$timeout',
        '$window',
        'growl',
        'ElementService',
        'ProjectService',
        'AppUtilsService',
        'ContentWindowService',
        'ApplicationService',
        'RootScopeService',
        'EventService',
    ];

    public subs: Rx.IDisposable[];

    //Bindings
    mmsRefs: RefObject[];
    mmsProject: ProjectObject;
    mmsRef: RefObject;

    //Local
    public refManageView: boolean;
    isLoading: boolean;
    refData;
    bbApi;
    buttons;
    project: ProjectObject;
    refs: RefObject[];
    branches: RefObject[];
    tags: RefObject[];
    refSelected: RefObject;
    search;
    view;
    htmlTooltip: string;

    constructor(
        private $sce: angular.ISCEService,
        private $q: VeQService,
        private $filter: angular.IFilterService,
        private $location: angular.ILocationService,
        private $uibModal: VeModalService,
        private $state: StateService,
        private $timeout: angular.ITimeoutService,
        private $window: IWindowService,
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private projectSvc: ProjectService,
        private appUtilsSvc: AppUtilsService,
        private contentWindowSvc: ContentWindowService,
        private applicationSvc: ApplicationService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService
    ) {}

    $onInit(): void {
        this.eventSvc.$init(this);

        this.contentWindowSvc.toggleLeftPane(true);
        this.rootScopeSvc.veHideLeft(true);
        this.rootScopeSvc.veHideRight(true);
        this.refManageView = true;
        this.refData = [];
        this.bbApi = {};
        this.buttons = [];
        this.refSelected = this.mmsRef;
        this.search = null;
        this.view = null;

        this.refs = this.mmsRefs;
        this.branches = this.refs.filter((ref) => {
            return ref.type === 'Branch';
        });
        this.tags = this.refs.filter((ref) => {
            return ref.type === 'Tag';
        });

        this.project = this.mmsProject;

        this.htmlTooltip = this.$sce.trustAsHtml('Branch temporarily unavailable during duplication.') as string;
    }

    selectMasterDefault = (): void => {
        const masterIndex = _.findIndex(this.refs, { name: 'master' });
        if (masterIndex > -1) {
            this.refSelected = this.refs[masterIndex];
        }
    };

    addBranch = (e: JQuery.ClickEvent): void => {
        e.stopPropagation();
        this.insert('Branch');
    };

    addTag = (e: JQuery.ClickEvent): void => {
        e.stopPropagation();
        this.insert('Tag');
    };

    deleteRef = (e: JQuery.ClickEvent): void => {
        e.stopPropagation();
        this.deleteItem();
    };

    refClickHandler = (ref: RefObject): void => {
        this.projectSvc.getRef(ref.id, this.project.id).then(
            (data) => {
                this.refSelected = data;
            },
            (error) => {
                this.growl.error('Ref click handler error: ' + error.message);
                return;
            }
        );
    };

    insert = (itemType: string): void => {
        const insertData: InsertRefData = {
            type: itemType,
            parentRefId: '',
            parentTitle: '',
            insertType: 'ref',
            lastCommit: true,
        };
        const branch = this.refSelected;
        // Item specific setup:
        if (itemType === 'Branch') {
            if (!branch) {
                this.growl.warning('Add Branch Error: Select a branch or tag first');
                return;
            }
            if (branch.type === 'Tag') {
                insertData.parentTitle = 'Tag ' + branch.name;
            } else {
                insertData.parentTitle = 'Branch ' + branch.name;
            }
            insertData.parentRefId = branch.id;
        } else if (itemType === 'Tag') {
            if (!branch) {
                this.growl.warning('Add Tag Error: Select a branch or tag first');
                return;
            }
            insertData.parentRefId = branch.id;
        } else {
            this.growl.error('Add Item of Type ' + itemType + ' is not supported');
            return;
        }
        const instance = this.$uibModal.open<InsertResolveFn<InsertRefData>, RefObject>({
            component: 'insertElementModal',
            resolve: {
                getInsertData: () => {
                    return insertData;
                },
                getFilter: () => {
                    return this.$filter;
                },
                getProjectId: () => {
                    return this.project.id;
                },
                getRefId: () => {
                    return null;
                },
                getOrgId: () => {
                    return this.project.orgId;
                },
                getSeenViewIds: () => {
                    return null;
                },
            },
        });
        instance.result.then(
            (data) => {
                if (data.type === 'Branch') {
                    this.branches.push(data);
                    this.refSelected = data;
                } else {
                    this.tags.push(data);
                    this.refSelected = data;
                }
            },
            (reason?) => {
                if (reason && reason.status !== 444) {
                    this.growl.error('Ref Creation Error:' + reason.message);
                } else {
                    this.growl.info('Ref Creation Cancelled', {
                        ttl: 1000,
                    });
                }
            }
        );
    };

    deleteItem = (): void => {
        const branch = this.refSelected;
        if (!branch) {
            this.growl.warning('Select item to delete.');
            return;
        }
        const settings: VeModalSettings<ConfirmDeleteModalResolveFn> = {
            component: 'confirmDeleteModal',
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
                finalize: () => {
                    return () => {
                        return this.projectSvc.deleteRef(branch.id, this.project.id);
                    };
                },
            },
        };
        const instance = this.$uibModal.open<ConfirmDeleteModalResolveFn, void>(settings);
        instance.result.then(
            () => {
                //TODO $state project with no selected ref
                let index: number;
                if (this.refSelected.type === 'Branch') {
                    index = this.branches.indexOf(this.refSelected);
                    this.branches.splice(index, 1);
                } else if (this.refSelected.type === 'Tag') {
                    index = this.tags.indexOf(this.refSelected);
                    this.tags.splice(index, 1);
                }
                this.refSelected = null;
            },
            (reason?) => {
                if (reason) {
                    this.growl.error('Ref Deletion Error:' + reason.message);
                } else {
                    this.growl.info('Ref Deletion Cancelled', {
                        ttl: 1000,
                    });
                }
            }
        );
    };
}

const RefsComponent: VeComponentOptions = {
    selector: 'refs',
    template: `
    <div class="container-fluid ve-no-panes">
    <div class="row">
        <div class="col-md-10 col-md-offset-1">
            <a class="back-to-docs" ui-sref="main.project.ref.portal({refId: $ctrl.mmsRef.id, keywords: undefined})"
               ui-sref-opts="{reload:true}">Back to Project Documents ({{$ctrl.mmsRef.name}})</a>
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
                            <li ng-if="!$ctrl.tags.length" class="ve-secondary-text">No Tags</li>
                        </ul>
                    </div>
                    <div class="col-md-8 ve-light-panels-detail" ng-show="$ctrl.refSelected">
                        <div class="panels-detail-title clearfix">
                            <h3 class="{{$ctrl.refSelected.type}}-icon">{{$ctrl.refSelected.name}}</h3>
                            <div class="ref-button-options" style="float:right">
                            <button class="btn btn-default" ng-disabled="$ctrl.isLoading && $ctrl.refSelected.status === 'creating'" type="button" ng-click="$ctrl.deleteRef($event)" ng-if="$ctrl.refSelected.id != 'master'"><i class="fa fa-trash"></i> Delete</button>
                            <button class="btn btn-primary" ng-disabled="$ctrl.isLoading && $ctrl.refSelected.status === 'creating'" type="button" ng-click="$ctrl.addTag($event)"><i class="fa fa-plus"></i> Tag</button>
                            <button class="btn btn-primary" ng-disabled="$ctrl.isLoading && $ctrl.refSelected.status === 'creating'" type="button" ng-click="$ctrl.addBranch($event)"><i class="fa fa-plus"></i> Branch</button>
                            </div>
                            <!-- <button-bar button-api="bbApi"></button-bar> -->
                        </div>
                        <dl class="dl-horizontal ve-light-panels-detail-content">
                            <dt></dt>
                            <dd ng-hide="$ctrl.refSelected.status === 'creating'" class="link-section">
                                <a ui-sref="main.project.ref.portal({refId: $ctrl.refSelected.id, keywords: undefined})" ui-sref-opts="{reload:true}">Project Documents</a>
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
                           
                            <dt>Parent Ref</dt>
                            <dd>{{$ctrl.refSelected.parentRefId}}</dd>
                            <dt>Parent Commit</dt>
                            <dd>{{$ctrl.refSelected.parentCommitId}}</dd>
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
        mmsProject: '<',
        mmsRef: '<',
        mmsRefs: '<',
    },
    controller: RefsController,
};

veApp.component(RefsComponent.selector, RefsComponent);
