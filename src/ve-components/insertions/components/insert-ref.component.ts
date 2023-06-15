import flatpickr from 'flatpickr';

import { Insertion, InsertionService } from '@ve-components/insertions';
import { EditorService } from '@ve-core/editor';
import { ApplicationService, UtilsService } from '@ve-utils/application';
import { ApiService, ElementService, ProjectService, ViewService } from '@ve-utils/mms-api-client';
import { SchemaService } from '@ve-utils/model-schema';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular';
import { InsertData } from '@ve-types/components';
import { CommitObject, RefObject, RefsResponse } from '@ve-types/mms';
import { VeModalService } from '@ve-types/view-editor';

export interface InsertRefData extends InsertData {
    parentRefId: string;
    lastCommit: boolean;
}

class InsertRefController extends Insertion<InsertRefData, RefObject> {
    static $inject = [...Insertion.$inject, '$filter'];

    protected parentCommit: CommitObject;
    protected lastCommit: boolean;
    protected now: Date;
    protected dateTimeOpts: flatpickr.Options.Options;
    protected timestamp: Date;

    constructor(
        $scope: angular.IScope,
        $q: VeQService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        $timeout: angular.ITimeoutService,
        $uibModal: VeModalService,
        viewSvc: ViewService,
        elementSvc: ElementService,
        projectSvc: ProjectService,
        schemaSvc: SchemaService,
        applicationSvc: ApplicationService,
        utilsSvc: UtilsService,
        apiSvc: ApiService,
        utils: InsertionService,
        editorSvc: EditorService
    ) {
        super(
            $scope,
            $q,
            $element,
            growl,
            $timeout,
            $uibModal,
            viewSvc,
            elementSvc,
            projectSvc,
            schemaSvc,
            applicationSvc,
            utilsSvc,
            apiSvc,
            utils,
            editorSvc
        );
    }

    public $onInit(): void {
        super.$onInit();

        this.lastCommit = this.insertData.lastCommit;
        this.now = new Date();
        this.timestamp = this.now;
        this.createItem = {
            id: this.apiSvc.createUniqueId(),
            _projectId: this.projectId,
            type: this.type,
            description: '',
            permission: 'read',
        };
        this.dateTimeOpts = {
            enableTime: true,
            enableSeconds: true,
            defaultDate: this.now,
            dateFormat: 'Y-m-dTH:i:S',
            time_24hr: true,
            maxDate: new Date(),
            onClose: (selectedDates): void => {
                this.lastCommit = false;
                this.timestamp = selectedDates[0];
            },
            inline: false,
        };
    }

    public create = (): VePromise<RefObject, RefsResponse> => {
        const refObj: RefObject = {
            name: this.createItem.name,
            type: this.type,
            _projectId: this.projectId,
            description: this.createItem.description,
            id: this.apiSvc.createUniqueId(),
            //parentCommitId: null
        };
        if (this.insertData.parentRefId) refObj.parentRefId = this.insertData.parentRefId;
        /*
        if (!this.lastCommit || this.type === 'Tag') {
            // Make call to history?maxTimestamp to get closest commit id to branch off

            const ts = this.$filter('date')(this.timestamp, 'yyyy-MM-ddTHH:mm:ss.sssZ')
            this.projectSvc.getCommits(refObj.parentRefId, this.projectId, ts).then((commits: CommitObject[]) => {
                refObj.parentCommitId = commits[0].id
                deferred.resolve(this.projectSvc.createRef(refObj, this.projectId))
            }, this.insertReject)
        } else {
        */
        return this.projectSvc.createRef(refObj, this.projectId);
        //}
    };

    public resolve = (data: RefObject): void => {
        this.insertApi.resolve(data);
    };
}

const InsertRefComponent: VeComponentOptions = {
    selector: 'insertRef',
    template: `
    <div>
    <div class="modal-header">
        <h4 class="item-type-{{$ctrl.type | lowercase}}">Create new {{$ctrl.type | lowercase}}</h4>
        <span class="ve-notify-banner" ng-if="$ctrl.type === 'Tag'">Tags are read only</span>
    </div>

    <div class="modal-body">
        <div class="modal-body comment-modal">
            <p class="modal-description" ng-show="$ctrl.type === 'Tag'">A <b>tag</b> is a read-only version of your project at a specific moment in time, typically a release or review.
    <!--            <a ui-sref="main.project.ref.view.present({documentId: '_18_0_2_8630260_1446850132083_177552_51111', viewId: 'MMS_1453977130045_239e2aee-1243-4480-a6f8-61ff7bed700f', projectId: 'PROJECT-ID_10_15_15_1_41_52_PM_5b84f7be_1506a83819c__6bce_cae_tw_jpl_nasa_gov_128_149_19_85', refId: 'master', search: undefined})">more</a></p>-->
            <p class="modal-description" ng-show="$ctrl.type === 'Branch'">A <b>branch</b> is a copy of your project for you to work on specific tasks or sandbox ideas, without interfering with other copies.
    <!--            <a ui-sref="main.project.ref.view.present({documentId: '_18_0_2_8630260_1446850132083_177552_51111', viewId: 'MMS_1453977130045_239e2aee-1243-4480-a6f8-61ff7bed700f', projectId: 'PROJECT-ID_10_15_15_1_41_52_PM_5b84f7be_1506a83819c__6bce_cae_tw_jpl_nasa_gov_128_149_19_85', refId: 'master', search: undefined})">more</a></p>-->
            <div class="comment-modal-input" ng-show="$ctrl.createForm">
                <div class="form-group">
                    <label>Name:</label>
                    <input class="form-control" ng-model="$ctrl.createItem.name" type="text"
                        ng-keyup="$event.keyCode == 13 ? $ctrl.ok() : null" placeholder="Type a name for your {{$ctrl.type | lowercase}} here" autofocus>
                </div>
            </div>
        </div>
        <div class="modal-body ve-new-ref" ng-show="$ctrl.createForm && ($ctrl.type === 'Tag' || $ctrl.type === 'Branch')">
            <div class="form-group">
                <label>Description</label>
                <textarea class="form-control" ng-model="$ctrl.createItem.description"></textarea>
            </div>
            <!--
            <div class="form-group" ng-if="$ctrl.type === 'Branch'">
                <label>Permission</label>
                <br />
                <input ng-model="$ctrl.createItem.permission" value="read" type="radio"> Read
                <br />
                <input ng-model="$ctrl.createItem.permission" value="write" type="radio"> Write
            </div>  
            
            <div class="form-group" ng-if="$ctrl.type === 'Tag' || $ctrl.type === 'Branch'">
                <label>Point in History</label>
                <form>
                    <div class="radio radio-with-label">
                        <label for="most-recent">
                            <input id="most-recent" type="radio" name="most recent" ng-model="$ctrl.lastCommit" ng-value="true">
                            Most Recent
                        </label><br>
                        <label for="specify-point">
                            <input id="specify-point" type="radio" name="specify point" ng-model="$ctrl.lastCommit" ng-value="false">
                            Specify a timestamp
                        </label>
                        <div class="indent ve-secondary-text timestamp-format">
                            <i>(YYYY-MM-DDTHH:MM:SS)</i>
                        </div>
                    </div>
                    <div class="indent">
                        <ng-flatpickr ng-if="$ctrl.type === 'Tag' || $ctrl.type === 'Branch'" fp-opts="$ctrl.dateTimeOpts"></ng-flatpickr>
                    </div>
                </form>
            </div>
            -->
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
        insertData: '<',
        insertApi: '<',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsOrgId: '@',
    },
    controller: InsertRefController,
};

veComponents.component(InsertRefComponent.selector, InsertRefComponent);
