import angular from 'angular'

import { AddElementData } from '@ve-app/main/modals/add-item-modal.component'
import { AddElement } from '@ve-components/add-elements'
import { CoreUtilsService } from '@ve-core/services'
import {
    ApiService,
    ElementService,
    ProjectService,
    ViewService,
} from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import { ApplicationService, UtilsService } from '@ve-utils/services'

import { veComponents } from '@ve-components'

import { VeComponentOptions, VePromise } from '@ve-types/angular'
import { CommitObject, RefObject } from '@ve-types/mms'
import { VeModalService } from '@ve-types/view-editor'

export interface AddRefData extends AddElementData {
    parentRefId: string
    lastCommit: boolean
}

class AddRefController extends AddElement<AddRefData, RefObject> {
    static $inject = [...AddElement.$inject, '$filter']

    constructor(
        $scope: angular.IScope,
        $q: angular.IQService,
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
        utils: CoreUtilsService,
        private $filter: angular.IFilterService
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
            utils
        )
        this.displayName = this.type
        this.addType = 'item'
    }

    public config = (): void => {
        this.now = new Date()
        const newItem: RefObject = {
            id: this.apiSvc.createUniqueId(),
            _projectId: this.projectId,
            type: this.type,
            description: '',
            permission: 'read',
            timestamp: this.now,
            lastCommit: true,
        }
        this.dateTimeOpts = {
            enableTime: true,
            enableSeconds: true,
            defaultDate: this.now,
            dateFormat: 'Y-m-dTH:i:S',
            time_24hr: true,
            maxDate: new Date(),
            onClose: (selectedDates): void => {
                this.updateTimeOpt()
                newItem.timestamp = selectedDates[0]
            },
            inline: false,
        }
    }

    public create = (): VePromise<RefObject> => {
        const deferred = this.$q.defer<RefObject>()
        const refObj: RefObject = {
            name: this.newItem.name,
            type: this.type,
            _projectId: this.projectId,
            description: this.newItem.description,
            permission: this.newItem.permission,
            id: this.apiSvc.createUniqueId(),
            parentCommitId: null,
        }
        if (this.addElementData.parentRefId)
            refObj.parentRefId = this.addElementData.parentRefId
        if (!this.newItem.lastCommit) {
            // Make call to history?maxTimestamp to get closest commit id to branch off
            const ts = this.$filter('date')(
                this.newItem.timestamp as Date,
                'yyyy-MM-ddTHH:mm:ss.sssZ'
            )
            this.projectSvc
                .getRefHistory(refObj.parentRefId, this.projectId, ts)
                .then((commits: CommitObject[]) => {
                    refObj.parentCommitId = commits[0].id
                    deferred.resolve(
                        this.projectSvc.createRef(refObj, this.projectId)
                    )
                }, this.reject)
        } else {
            return this.projectSvc.createRef(refObj, this.projectId)
        }
        return deferred.promise
    }

    public resolve = (data: RefObject): void => {
        this.growl.success(this.displayName + ' is being created')
        if (this.type === 'Tag') {
            this.growl.info(
                'Please wait for a completion email prior to viewing of the tag.'
            )
        }
        this.addElementApi.resolve(data)
    }

    public updateTimeOpt = (): void => {
        this.newItem.lastCommit = false
    }
}

const AddRefComponent: VeComponentOptions = {
    selector: 'addRef',
    template: `
    <div>
    <div class="modal-header">
        <h4 class="item-type-{{$ctrl.type | lowercase}}">Create new {{$ctrl.type | lowercase}}</h4>
        <span class="ve-notify-banner" ng-if="$ctrl.type === 'Tag'">Tags are read only</span>
    </div>

    <div class="modal-body">
        <div class="modal-body comment-modal">
            <p class="modal-description" ng-show="$ctrl.type === 'Tag'">A <b>tag</b> is a read-only version of your project at a specific moment in time, typically a release or review.
    <!--            <a ui-sref="main.project.ref.document.view({documentId: '_18_0_2_8630260_1446850132083_177552_51111', viewId: 'MMS_1453977130045_239e2aee-1243-4480-a6f8-61ff7bed700f', projectId: 'PROJECT-ID_10_15_15_1_41_52_PM_5b84f7be_1506a83819c__6bce_cae_tw_jpl_nasa_gov_128_149_19_85', refId: 'master', search: undefined})">more</a></p>-->
            <p class="modal-description" ng-show="$ctrl.type === 'Branch'">A <b>branch</b> is a copy of your project for you to work on specific tasks or sandbox ideas, without interfering with other copies.
    <!--            <a ui-sref="main.project.ref.document.view({documentId: '_18_0_2_8630260_1446850132083_177552_51111', viewId: 'MMS_1453977130045_239e2aee-1243-4480-a6f8-61ff7bed700f', projectId: 'PROJECT-ID_10_15_15_1_41_52_PM_5b84f7be_1506a83819c__6bce_cae_tw_jpl_nasa_gov_128_149_19_85', refId: 'master', search: undefined})">more</a></p>-->
            <div class="comment-modal-input" ng-show="$ctrl.createForm">
                <div class="form-group">
                    <label>Name {{($ctrl.type === 'View' || $ctrl.addType === 'pe') ? '(optional):' : ':'}}</label>
                    <input class="form-control" ng-model="$ctrl.newItem.name" type="text"
                        ng-keyup="$event.keyCode == 13 ? $ctrl.ok() : null" placeholder="Type a name for your {{$ctrl.type | lowercase}} here" autofocus>
                </div>
            </div>
        </div>
        <div class="modal-body ve-new-ref" ng-show="$ctrl.createForm && ($ctrl.type === 'Tag' || $ctrl.type === 'Branch')">
            <div class="form-group">
                <label>Description</label>
                <textarea class="form-control" ng-model="$ctrl.newItem.description"></textarea>
            </div>
            <div class="form-group" ng-if="$ctrl.type === 'Branch'">
                <label>Permission</label>
                <br />
                <input ng-model="$ctrl.newItem.permission" value="read" type="radio"> Read
                <br />
                <input ng-model="$ctrl.newItem.permission" value="write" type="radio"> Write
            </div>  
            <div class="form-group" ng-if="$ctrl.type === 'Tag' || $ctrl.type === 'Branch'">
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
                        <ng-flatpickr ng-if="$ctrl.type === 'Tag' || $ctrl.type === 'Branch'" fp-opts="$ctrl.dateTimeOpts"></ng-flatpickr>
                    </div>
                </form>
            </div>
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
        addElementData: '<',
        addElementApi: '<',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsOrgId: '@',
    },
    controller: AddRefController,
}

veComponents.component(AddRefComponent.selector, AddRefComponent)
