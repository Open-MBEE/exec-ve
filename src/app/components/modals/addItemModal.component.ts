import * as angular from 'angular';
import {ViewService} from "../../../mms/services/ViewService.service";
import {ProjectService} from "../../../mms/services/ProjectService.service";
import {ElementService} from "../../../mms/services/ElementService.service";
import {ApplicationService} from "../../../mms/services/ApplicationService.service";
import {UtilsService} from "../../../mms/services/UtilsService.service";
import {Utils} from "../../../mms-directives/services/Utils.service";
var mmsApp = angular.module('mmsApp');

let AddItemModalComponent: angular.ve.ComponentOptions = {
    selector: "addItemModal",
    template: `
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
            <a ui-sref="main.project.ref.document.view({documentId: '_18_0_2_8630260_1446850132083_177552_51111', viewId: 'MMS_1453977130045_239e2aee-1243-4480-a6f8-61ff7bed700f', projectId: 'PROJECT-ID_10_15_15_1_41_52_PM_5b84f7be_1506a83819c__6bce_cae_tw_jpl_nasa_gov_128_149_19_85', refId: 'master', search: undefined})">more</a></p>
        <p class="modal-description" ng-show="$ctrl.itemType === 'Branch'">A <b>branch</b> is a copy of your project for you to work on specific tasks or sandbox ideas, without interfering with other copies.
            <a ui-sref="main.project.ref.document.view({documentId: '_18_0_2_8630260_1446850132083_177552_51111', viewId: 'MMS_1453977130045_239e2aee-1243-4480-a6f8-61ff7bed700f', projectId: 'PROJECT-ID_10_15_15_1_41_52_PM_5b84f7be_1506a83819c__6bce_cae_tw_jpl_nasa_gov_128_149_19_85', refId: 'master', search: undefined})">more</a></p>
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
        <div class="form-group">
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
                    <ng-flatpickr fp-opts="$ctrl.dateTimeOpts"></ng-flatpickr>
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
        <mms-search mms-options="$ctrl.searchOptions" mms-project-id="{{$ctrl.projectOb.id}}" mms-ref-id="{{$ctrl.refOb.id}}"></mms-search>
    </div>
    

</div>

<div class="modal-footer">
    <button class="btn btn-primary" ng-show="$ctrl.createForm" ng-click="$ctrl.ok()">Create
        <i ng-show="$ctrl.oking" class="fa fa-spin fa-spinner"></i>
    </button>
    <button class="btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
</div>
`,
    bindings: {
        close: "<",
        dismiss: "<",
        modalInstance: "<",
        resolve: "<"
    },
    controller: class AddItemController implements angular.IComponentController {

        static $inject = ['growl', '$timeout', 'ViewService', 'ElementService', 'ProjectService', 'ApplicationService', 'UtilsService', 'Utils'];

        //bindings
        public modalInstance
                dismiss
                close
                resolve

        //local
        private addItemData
        public searchOptions
        itemType
        createForm
        oking
        projectOb
        refOb
        orgOb
        displayName
        addType
        newItem
        now
        dateTimeOpts

        constructor(private growl: angular.growl.IGrowlService, private $timeout: angular.ITimeoutService,
                    private viewSvc: ViewService, private elementSvc: ElementService,
                    private projectSvc: ProjectService, private applicationSvc: ApplicationService,
                    private utilsSvc: UtilsService, private utils: Utils) {

            this.createForm = true;
            this.oking = false;
            this.displayName = "";

            this.searchOptions = {
                callback: this.callback,
                itemsPerPage: 200,
                filterQueryList: [this.queryFilter],
                hideFilterOptions: true
            };

        };

        $onInit() {
            this.addItemData = this.resolve.getAddData();
            this.addType = (this.addItemData.addType) ? this.addItemData.addType : "item";

            if (this.addType === 'item') {
                this.projectOb = this.resolve.getProjectOb();
                this.refOb = this.resolve.getRefOb();
                this.orgOb = this.resolve.getOrgOb();
            }

            this.itemType = this.addItemData.itemType;
            this.newItem = {name: ''};

            if (this.itemType === 'Document') {
                this.displayName = "Document";
            } else if (this.itemType === 'View') {
                this.displayName = "View";
            } else if (this.itemType === 'Group') {
                this.displayName = "Group";
            } else if (this.itemType === 'Branch' || this.itemType === 'Tag') {
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
                    }
                };
            } else if (this.addType === 'pe') {

            } else {
                this.growl.error("Add " + (this.addType === 'item') ? "Item" : "PE" + " of Type " + this.itemType + " is not supported");
                return;
            }

            if (this.resolve.init) {
                this.resolve.init(this);
            }
        }

        callback(data) {
            if (this.itemType === 'View') {
                return this.addExistingView(data);
            } else if (this.addType === 'pe') {
                return this.addExistingPe(data);
            }
        }

        addExistingView(view) {
            var viewId = view.id;
            if (this.resolve.getSeenViewIds()[viewId]) {
                this.growl.error("Error: View " + view.name + " is already in this document.");
                return;
            }
            if (this.oking) {
                this.growl.info("Please wait...");
                return;
            }
            this.oking = true;
            this.viewSvc.addViewToParentView({
                parentViewId: this.addItemData.parentBranchData.id,
                viewId: viewId,
                projectId: this.addItemData.parentBranchData._projectId,
                refId: this.addItemData.parentBranchData._refId,
                aggr: this.addItemData.newViewAggr.type
            }).then((data) => {
                this.elementSvc.getElement({
                    elementId: viewId,
                    projectId: view._projectId,
                    refId: view._refId
                }, 2, false)
                    .then((realView) => {
                        this.close({$value: realView});
                    },() => {
                        this.close({$value: view});
                    }).finally(() => {
                    this.growl.success("View Added");
                });
            },(reason) => {
                this.growl.error("View Add Error: " + reason.message);
            }).finally(() => {
                this.oking = false;
            });
        };

        addExistingPe(elementOb) {
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
                    this.close({$value: data});
                }, (reason) => {
                    this.growl.error(this.itemType +" Add Error: " + reason.message);
                }).finally(() => {
                this.oking = false;
            });
        };

        updateTimeOpt() {
            this.newItem.lastCommit = false;
        };


        queryFilter() {
            if (this.addType === 'item') {
                if (this.itemType === 'View') {
                    return {
                        terms: {'_appliedStereotypeIds': [this.utilsSvc.VIEW_SID, this.utilsSvc.DOCUMENT_SID].concat(this.utilsSvc.OTHER_VIEW_SID)}
                    };
                }else {
                    return {
                        terms: 'none'
                    }
                }
            } else if (this.addType === 'pe') {
                var classIdOb = {
                    classifierIds: []
                };
                if (this.itemType === 'Table') {
                    classIdOb.classifierIds = [this.viewSvc.TYPE_TO_CLASSIFIER_ID.TableT, this.viewSvc.TYPE_TO_CLASSIFIER_ID.Table];
                } else if (this.itemType === 'List') {
                    classIdOb.classifierIds  = [this.viewSvc.TYPE_TO_CLASSIFIER_ID.ListT, this.viewSvc.TYPE_TO_CLASSIFIER_ID.List];
                } else if (this.itemType === 'Image') {
                    classIdOb.classifierIds = [this.viewSvc.TYPE_TO_CLASSIFIER_ID.ImageT, this.viewSvc.TYPE_TO_CLASSIFIER_ID.Image];
                } else if (this.itemType === 'Paragraph') {
                    classIdOb.classifierIds = [this.viewSvc.TYPE_TO_CLASSIFIER_ID.ParagraphT, this.viewSvc.TYPE_TO_CLASSIFIER_ID.Paragraph];
                } else if (this.itemType === 'Section') {
                    classIdOb.classifierIds = [this.viewSvc.TYPE_TO_CLASSIFIER_ID.SectionT, this.viewSvc.TYPE_TO_CLASSIFIER_ID.Section];
                } else {
                    classIdOb.classifierIds = [this.viewSvc.TYPE_TO_CLASSIFIER_ID[this.itemType]];
                }
                return {
                    terms: classIdOb
                }

            }
        }

        ok() {
            if (this.oking) {
                this.growl.info("Please wait...");
                return;
            }
            this.oking = true;
            let promise : Promise<any>;
            if (this.resolve.ok) {
                promise = this.resolve.ok;
            }
            // Item specific promises:
            else if (this.itemType === 'Document') {
                promise = this.viewSvc.createDocument({
                    _projectId: this.projectOb.id,
                    _refId: this.refOb.id,
                    id: this.addItemData.parentBranchData.id
                }, {
                    viewName: this.newItem.name,
                    isDoc: true
                });
            } else if (this.itemType === 'View') {
                this.addItemData.newViewAggr.type = "composite";
                promise = this.viewSvc.createView(this.addItemData.parentBranchData, {
                    viewName: this.newItem.name
                });
            } else if (this.itemType === 'Group') {
                promise = this.viewSvc.createGroup(this.newItem.name,
                    {
                        _projectId: this.projectOb.id,
                        _refId: this.refOb.id,
                        id: this.addItemData.parentBranchData.id
                    }, this.orgOb.id
                );
            } else if ((this.itemType === 'Branch' || this.itemType === 'Tag') && this.newItem.name !== '') {
                    let refObj = {
                        name: this.newItem.name,
                        type: this.itemType,
                        description: this.newItem.description,
                        parentRefId: this.addItemData.createParentRefId,
                        permission: this.newItem.permission,
                        id: this.applicationSvc.createUniqueId(),
                        parentCommitId: ''
                    };
                    if (!this.newItem.lastCommit) {
                        // Make call to history?maxTimestamp to get closest commit id to branch off
                        let ts = this.resolve.getFilter()('date')(this.newItem.timestamp, 'yyyy-MM-ddTHH:mm:ss.sssZ');
                        this.projectSvc.getRefHistory(refObj.parentRefId, this.projectOb.id, ts)
                            .then((commits) => {
                                refObj.parentCommitId = commits[0].id;
                                promise = this.projectSvc.createRef( refObj, this.projectOb.id );
                            });
                    } else {
                        promise = this.projectSvc.createRef( refObj, this.projectOb.id );
                    }
            } else if (this.addType === 'pe') {
                promise = this.viewSvc.createInstanceSpecification(this.addItemData.viewOrSectionOb, this.itemType, this.newItem.name, this.addItemData.addPeIndex);
            }
            else {
                this.growl.error("Add Item of Type " + this.itemType + " is not supported");
                this.oking = false;
                return;
            }

            promise.then((data) => {
                if (this.addType === 'pe') {
                    var elemType = this.itemType;
                    this.utils.successUpdates(elemType, this.addItemData.viewOrSectionOb.id);
                } else {
                    this.growl.success(this.displayName + " is being created");
                }
                if (this.itemType === 'Tag') {
                    this.growl.info('Please wait for a completion email prior to viewing of the tag.');
                }
                this.close({$value: data});
            }, (reason) => {
                this.growl.error("Create " + this.displayName + " Error: " + reason.message);
            }).finally(() => {
                this.oking = false;
            })
        }

        cancel() {
            this.modalInstance.dismiss();
        }
        }
}

mmsApp.component(AddItemModalComponent.selector, AddItemModalComponent);