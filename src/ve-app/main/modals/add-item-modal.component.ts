import * as angular from 'angular';
import flatpickr from "flatpickr";
import Options = flatpickr.Options;

import {ElementService, ProjectService, ViewService} from "@ve-utils/mms-api-client"
import {ApplicationService, UtilsService} from "@ve-utils/core-services";
import {SchemaService} from "@ve-utils/model-schema";
import {CoreUtilsService} from "@ve-core/core";
import {
    VeModalComponent,
    VeModalResolve,
    VeModalController,
    VeSearchOptions, VeModalResolveFn
} from "@ve-types/view-editor";
import {CommitObject, ElementObject, MmsObject, RefObject, ViewObject} from "@ve-types/mms";
import {TreeBranch} from "@ve-types/tree";
import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller';

import {veApp} from "@ve-app";



export interface AddItemResolveFn extends VeModalResolveFn {
    getAddData(): any;
    getProjectId(): string;
    getRefId(): string;
    getOrgId(): string;
    getFilter?(): angular.IFilterService;
    getSeenViewIds?(): { [p: string]: TreeBranch };
    finalize?(): angular.IPromise<ElementObject>
    init?(): void
}

export interface AddItemResolve extends VeModalResolve {
    getAddData: AddItemData;
    getFilter?: angular.IFilterService;
    getProjectId: string;
    getRefId: string;
    getOrgId: string;
    getSeenViewIds?: { [p: string]: TreeBranch };
    finalize?(): angular.IPromise<ElementObject>
    init?(ctrl: VeModalControllerImpl): void
}

export interface AddItemData {
    itemType: string
    newViewAggr: { type: string };
    parentBranch: TreeBranch;
    branchType: string;
    addType?: 'item' | 'pe';
    viewOrSectionOb?: ViewObject
    addPeIndex?: number
    createParentRefId?: string
}


let AddItemModalComponent: VeModalComponent = {
    selector: "addItemModal",
    template: `
    <div>
    <div class="modal-header">
        <h4 class="item-type-{{$ctrl.itemType}}" ng-if="$ctrl.addType == 'item'">Create new {{$ctrl.itemType | lowercase}}</h4>
        <h4 class="pe-type-{{$ctrl.itemType}}" ng-if="$ctrl.addType == 'pe'">Add {{$ctrl.itemType | lowercase}}</h4>
        <span class="ve-notify-banner" ng-if="$ctrl.itemType === 'Tag'">Tags are read only</span>
    </div>

    <div class="modal-body">
        <div class="ve-light-tabs modal-top-tabs" ng-show="$ctrl.itemType === 'View' || $ctrl.addType === 'pe'">
            <ul class="nav nav-tabs" ng-show="$ctrl.itemType != 'Comment'">
                <li class="uib-tab nav-item tab-item" ng-class="{'active': $ctrl.createForm}">
                    <a class="nav-link" ng-click="$ctrl.createForm = true"><i class="fa fa-plus"></i>Create New</a>
                </li>
                <li class="uib-tab nav-item tab-item" ng-class="{'active': !$ctrl.createForm}">
                    <a class="nav-link" ng-click="$ctrl.createForm = false"><i class="fa fa-search"></i>Search for existing</a>
                </li>
            </ul>
        </div>
        <div class="modal-body comment-modal">
            <p class="modal-description" ng-show="$ctrl.itemType === 'Tag'">A <b>tag</b> is a read-only version of your project at a specific moment in time, typically a release or review.
    <!--            <a ui-sref="main.project.ref.document.view({documentId: '_18_0_2_8630260_1446850132083_177552_51111', viewId: 'MMS_1453977130045_239e2aee-1243-4480-a6f8-61ff7bed700f', projectId: 'PROJECT-ID_10_15_15_1_41_52_PM_5b84f7be_1506a83819c__6bce_cae_tw_jpl_nasa_gov_128_149_19_85', refId: 'master', search: undefined})">more</a></p>-->
            <p class="modal-description" ng-show="$ctrl.itemType === 'Branch'">A <b>branch</b> is a copy of your project for you to work on specific tasks or sandbox ideas, without interfering with other copies.
    <!--            <a ui-sref="main.project.ref.document.view({documentId: '_18_0_2_8630260_1446850132083_177552_51111', viewId: 'MMS_1453977130045_239e2aee-1243-4480-a6f8-61ff7bed700f', projectId: 'PROJECT-ID_10_15_15_1_41_52_PM_5b84f7be_1506a83819c__6bce_cae_tw_jpl_nasa_gov_128_149_19_85', refId: 'master', search: undefined})">more</a></p>-->
            <div class="comment-modal-input" ng-show="$ctrl.createForm">
                <div class="form-group">
                    <label>Name {{($ctrl.itemType === 'View' || $ctrl.addType === 'pe') ? '(optional):' : ':'}}</label>
                    <input class="form-control" ng-model="$ctrl.newItem.name" type="text"
                        ng-keyup="$event.keyCode == 13 ? $ctrl.ok() : null" placeholder="Type a name for your {{$ctrl.itemType | lowercase}} here" autofocus>
                </div>
            </div>
        </div>
        <div class="modal-body ve-new-ref" ng-show="$ctrl.createForm && ($ctrl.itemType === 'Tag' || $ctrl.itemType === 'Branch')">
            <div class="form-group">
                <label>Description</label>
                <textarea class="form-control" ng-model="$ctrl.newItem.description"></textarea>
            </div>
            <div class="form-group" ng-if="$ctrl.itemType === 'Branch'">
                <label>Permission</label>
                <br />
                <input ng-model="$ctrl.newItem.permission" value="read" type="radio"> Read
                <br />
                <input ng-model="$ctrl.newItem.permission" value="write" type="radio"> Write
            </div>  
            <div class="form-group" ng-if="$ctrl.itemType === 'Tag' || $ctrl.itemType === 'Branch'">
                <label>Point in History</label>
                <form>
                    <div class="radio radio-with-label">
                        <label for="most-recent">
                            <input id="most-recent" type="radio" name="most recent" ng-model="$ctrl.newItem.lastCommit" ng-value="true">
                            Most Recent
                        </label><br>
                        <label for="specify-point">
                            <input id="specify-point" type="radio" name="specify point" ng-model="$ctrl.newItem.lastCommit" ng-value="false">
                            Specify a timestamp
                        </label>
                        <div class="indent ve-secondary-text timestamp-format">
                            <i>(YYYY-MM-DDTHH:MM:SS)</i>
                        </div>
                    </div>
                    <div class="indent">
                        <ng-flatpickr ng-if="$ctrl.itemType === 'Tag' || $ctrl.itemType === 'Branch'" fp-opts="$ctrl.dateTimeOpts"></ng-flatpickr>
                    </div>
                </form>
            </div>
        </div>
        <div ng-show="!$ctrl.createForm && ($ctrl.itemType === 'View' || $ctrl.addType === 'pe')">
            <p>Begin by searching for the {{$ctrl.itemType | lowercase}}, then click its name or documentation to add the view.</p>
            <div class="radio" ng-show="$ctrl.itemType === 'View'">
                <label><input type="radio" ng-model="$ctrl.newViewAggr.type" value="shared">Add view and its children</label><br>
                <label><input type="radio" ng-model="$ctrl.newViewAggr.type" value="none">Add view only</label>
            </div>
            <mms-search mms-options="$ctrl.searchOptions" mms-project-id="{{$ctrl.projectId}}" mms-ref-id="{{$ctrl.refId}}" embedded="true"></mms-search>
        </div>
        
    
    </div>
    
    <div class="modal-footer" >
        <button class="btn btn-primary" ng-show="$ctrl.createForm" ng-click="$ctrl.ok()">Create
            <i ng-show="$ctrl.oking" class="fa fa-spin fa-spinner"></i>
        </button>
        <button class="btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
    </div>
</div>
`,
    bindings: {
        modalInstance: "<",
        resolve: "<"
    },
    controller: class AddItemController extends VeModalControllerImpl implements VeModalController {

        static $inject = ['$scope', '$compile', '$element', 'growl', '$timeout', 'ViewService', 'ElementService', 'ProjectService', 'SchemaService',
            'ApplicationService', 'UtilsService', 'CoreUtilsService'];

        private schema = 'cameo'

        protected resolve: AddItemResolve;

        //local
        private addItemData: AddItemData

        public searchOptions: VeSearchOptions = null;
        itemType: string
        createForm: boolean = true;
        oking: boolean = false;
        projectId: string
        refId: string
        orgId: string
        displayName: string = "";
        addType: string
        newItem: { description?: any; permission?: any; lastCommit?: any; timestamp?: any; name: any; }
        now: Date
        dateTimeOpts: Options.Options

        parentData: ElementObject

        private $componentEl: JQuery<HTMLElement>;

        constructor(private $scope: angular.IScope, private $compile: angular.ICompileService, private $element: JQuery<HTMLElement>, private growl: angular.growl.IGrowlService, private $timeout: angular.ITimeoutService,
                    private viewSvc: ViewService, private elementSvc: ElementService,
                    private projectSvc: ProjectService, private schemaSvc: SchemaService, private applicationSvc: ApplicationService,
                    private utilsSvc: UtilsService, private utils: CoreUtilsService) {
                    super();
        };

        $onInit() {
            this.addItemData = this.resolve.getAddData;
            this.parentData = (!this.addItemData.parentBranch) ? null : this.addItemData.parentBranch.data;
            this.addType = (this.addItemData.addType) ? this.addItemData.addType : "item";
            this.projectId = this.resolve.getProjectId;
            this.refId = (this.resolve.getRefId) ? this.resolve.getRefId : '';
            this.orgId = this.resolve.getOrgId;

            this.searchOptions = {
                callback: this.callback,
                itemsPerPage: 200,
                filterQueryList: [this.queryFilter],
                hideFilterOptions: true,
                closeable: false
            };

            this.itemType = this.addItemData.itemType;
            this.newItem = {name: ''};
            if (this.resolve.init && this.resolve.init instanceof Function) {
                this.resolve.init(this);
                return;
            }
            switch (this.itemType) {
                case 'Document':
                    this.displayName = "Document";
                    break;

                case 'View':
                    this.displayName = "View";
                    break;

                case 'Group':
                    this.displayName = "Group";
                    break;

                case 'Branch':
                case 'Tag':
                    this.now = new Date();
                    this.newItem.description = "";
                    this.newItem.permission = "read";
                    this.newItem.lastCommit = true;
                    this.newItem.timestamp = this.now;
                    if (this.itemType === 'Branch') {
                        this.displayName = "Branch";
                    }else {
                        this.displayName = "Tag";
                    }
                    this.dateTimeOpts = {
                        enableTime: true,
                        enableSeconds: true,
                        defaultDate: this.now,
                        dateFormat: 'Y-m-dTH:i:S',
                        time_24hr: true,
                        maxDate: new Date(),
                        onClose: (selectedDates) => {
                            this.updateTimeOpt();
                            this.newItem.timestamp = selectedDates[0];
                        },
                        inline: false
                    };
                    break;

                case "Org":
                    this.displayName = "Org";
                    break;

                default:
                    if (this.addType !== 'pe') {
                        this.growl.warning("Add " + (this.addType === 'item') ? "Item" : "PE" + " of Type " + this.itemType + " is not supported");
                    }
                    break;
            }

        }

         public callback = (data) => {
            if (this.itemType === 'View') {
                return this.addExistingView(data);
            } else if (this.addType === 'pe') {
                return this.addExistingPe(data);
            }
        }

         public addExistingView = (view) => {
            var viewId = view.id;
            if (this.resolve.getSeenViewIds[viewId]) {
                this.growl.error("Error: View " + view.name + " is already in this document.");
                return;
            }
            if (this.oking) {
                this.growl.info("Please wait...");
                return;
            }
            this.oking = true;
            this.viewSvc.addViewToParentView({
                parentViewId: this.parentData.id,
                viewId: viewId,
                projectId: this.parentData._projectId,
                refId: this.parentData._refId,
                aggr: this.addItemData.newViewAggr.type
            }).then((data) => {
                this.elementSvc.getElement({
                    elementId: viewId,
                    projectId: view._projectId,
                    refId: view._refId
                }, 2, false)
                    .then((realView) => {
                        this.modalInstance.close({$value: realView});
                    },() => {
                        this.modalInstance.close({$value: view});
                    }).finally(() => {
                    this.growl.success("View Added");
                });
            },(reason) => {
                this.growl.error("View Add Error: " + reason.message);
            }).finally(() => {
                this.oking = false;
            });
        };

         public addExistingPe = (elementOb) => {
            if (this.oking) {
                this.growl.info("Please wait...");
                return;
            }
            this.oking = true;
            var instanceVal = {
                instanceId: elementOb.id,
                type: "InstanceValue"
            };
            this.viewSvc.addElementToViewOrSection(this.addItemData.viewOrSectionOb, instanceVal, this.addItemData.addPeIndex)
                .then((data) => {
                    var elemType = this.itemType;
                    this.utils.successUpdates(elemType, this.addItemData.viewOrSectionOb.id);
                    this.modalInstance.close({$value: data});
                }, (reason) => {
                    this.growl.error(this.itemType +" Add Error: " + reason.message);
                }).finally(() => {
                this.oking = false;
            });
        };

         public updateTimeOpt = () => {
            this.newItem.lastCommit = false;
        };


        public queryFilter = (): {_appliedStereotypeIds?: string[], classifierIds?: string[]} => {
            let filters: {_appliedStereotypeIds?: string[], classifierIds?: string[]} = {};
            if (this.addType === 'item') {
                if (this.itemType === 'View') {
                    filters._appliedStereotypeIds = [
                                this.schemaSvc.get('VIEW_SID', this.schema),
                                this.schemaSvc.get('DOCUMENT_SID', this.schema),
                                ...this.schemaSvc.get('OTHER_VIEW_SID', this.schema)
                            ]
                }else {
                    return filters
                }
            } else if (this.addType === 'pe') {
                if (this.itemType === 'Table') {
                    filters.classifierIds = [this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','TableT',this.schema), this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','Table',this.schema)];
                } else if (this.itemType === 'List') {
                    filters.classifierIds  = [this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','ListT',this.schema), this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','List',this.schema)];
                } else if (this.itemType === 'Image') {
                    filters.classifierIds = [this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','ImageT',this.schema), this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','Image',this.schema)];
                } else if (this.itemType === 'Paragraph') {
                    filters.classifierIds = [this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','ParagraphT',this.schema), this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','Paragraph',this.schema)];
                } else if (this.itemType === 'Section') {
                    filters.classifierIds = [this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','SectionT',this.schema), this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','Section',this.schema)];
                } else {
                    filters.classifierIds = [this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID',this.itemType,this.schema)];
                }
            }
            return filters
        }

         public ok = (): void => {
            if (this.oking) {
                this.growl.info("Please wait...");
                return;
            }
            this.oking = true;
            let loginCb = (result?: any) => {
                if (result) {
                    this.$element.empty();
                    this.$element.append(this.$componentEl);
                    this.$compile(this.$componentEl)(this.$scope.$new());
                    this.ok();
                }else {
                    reject({code: 666, message: "User not Authenticated"})
                }
            }
            let reLogin = () => {
                let tempInstance: angular.ui.bootstrap.IModalInstanceService = {
                    closed: undefined,
                    opened: undefined,
                    rendered: undefined,
                    result: undefined,
                    close: loginCb,
                    dismiss: loginCb
                }
                this.$componentEl = this.$element.children();
                this.$element.empty();
                let modalResolve: VeModalResolve = {
                    continue: true
                }
                const $loginEl = $('<login-modal modal-instance="modalInstance" resolve="resolve"></login-modal>')
                this.$element.append($loginEl);
                this.$compile($loginEl)(Object.apply(this.$scope.$new(true),{ modalInstance: tempInstance, resolve: modalResolve}));
            }
            let resolve = (data: MmsObject): void => {
                if (this.addType === 'pe') {
                    var elemType = this.itemType;
                    this.utils.successUpdates(elemType, this.addItemData.viewOrSectionOb.id);
                } else {
                    this.growl.success(this.displayName + " is being created");
                }
                if (this.itemType === 'Tag') {
                    this.growl.info('Please wait for a completion email prior to viewing of the tag.');
                }
                this.modalInstance.close({$value: data});
            }
            let reject = (reason) => {
                if (reason.code === 401) {
                    reLogin();
                }else {
                    this.growl.error("Create " + this.displayName + " Error: " + reason.message);
                }
            }
            let last = () => {
                this.oking = false;
            };
            const ownerId = (this.parentData) ? this.parentData.id : "holding_bin_" + this.projectId
            if (this.resolve.finalize) {
                this.resolve.finalize().then(resolve,reject,last);
            }
            // Item specific promises:
            else if (this.itemType === 'Document') {
                this.viewSvc.createDocument({
                    _projectId: this.projectId,
                    _refId: this.refId,
                    id: ownerId
                }, {
                    name: this.newItem.name,
                    id: this.utilsSvc.createMmsId(),
                    isDoc: true,
                    _projectId: this.projectId,
                    _refId: this.refId,
                    type: "Class"
                }).then(resolve,reject,last);
            } else if (this.itemType === 'View') {
                this.addItemData.newViewAggr.type = "composite";
                this.viewSvc.createView(this.parentData, {
                    id: this.utilsSvc.createMmsId(),
                    name: this.newItem.name,
                    _projectId: this.projectId,
                    _refId: this.refId,
                    type: "Class"
                }).then(resolve,reject,last);
            } else if (this.itemType === 'Group') {
                this.viewSvc.createGroup(this.newItem.name,
                    {
                        _projectId: this.projectId,
                        _refId: this.refId,
                        id: ownerId
                    }, this.orgId
                ).then(resolve,reject,last);
            } else if ((this.itemType === 'Branch' || this.itemType === 'Tag') && this.newItem.name !== '') {
                    let refObj: RefObject = {
                        name: this.newItem.name,
                        type: this.itemType,
                        _projectId: this.projectId,
                        description: this.newItem.description,
                        parentRefId: this.addItemData.createParentRefId,
                        permission: this.newItem.permission,
                        id: this.applicationSvc.createUniqueId(),
                        parentCommitId: null
                    };
                    if (!this.newItem.lastCommit) {
                        // Make call to history?maxTimestamp to get closest commit id to branch off
                        let ts = this.resolve.getFilter('date')(this.newItem.timestamp, 'yyyy-MM-ddTHH:mm:ss.sssZ');
                        this.projectSvc.getRefHistory(refObj.parentRefId, this.projectId, ts)
                            .then((commits:CommitObject[]) => {
                                refObj.parentCommitId = commits[0].id;
                                this.projectSvc.createRef( refObj, this.projectId ).then(resolve,reject,last);
                            });
                    } else {
                        this.projectSvc.createRef( refObj, this.projectId ).then(resolve,reject,last);
                    }
            } else if (this.addType === 'pe') {
                this.viewSvc.createInstanceSpecification(this.addItemData.viewOrSectionOb, this.itemType, this.newItem.name, this.addItemData.addPeIndex).then(resolve,reject,last);
            }
            else {
                this.growl.error("Add Item of Type " + this.itemType + " is not supported");
                this.oking = false;
                return;
            }
        }

        public cancel() {
            this.modalInstance.dismiss();
        }


    }
}

veApp.component(AddItemModalComponent.selector, AddItemModalComponent);
