import angular from 'angular'

import { AddElement, AddElementsService } from '@ve-components/add-elements'
import { SearchFilter } from '@ve-core/search/mms-search.component'
import {
    ApiService,
    ElementService,
    ProjectService,
    ViewService,
} from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import { ApplicationService, UtilsService } from '@ve-utils/services'

import { veComponents } from '@ve-components'

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular'
import { AddElementData } from '@ve-types/components'
import {
    InstanceValueObject,
    ViewCreationRequest,
    ViewInstanceSpec,
} from '@ve-types/mms'
import { TreeBranch } from '@ve-types/tree'
import { VeModalService } from '@ve-types/view-editor'

export interface AddPresentationData extends AddElementData {
    parentBranch: TreeBranch
    viewOrSectionOb?: ViewInstanceSpec
    addPeIndex: number
}

class AddPeController extends AddElement<AddPresentationData> {
    protected aggr: 'composite' | 'shared'

    static $inject = AddElement.$inject

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
        utils: AddElementsService
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
    }

    $onInit(): void {
        super.$onInit()
    }

    public queryFilter = (): SearchFilter => {
        const filters: {
            _appliedStereotypeIds?: string[]
            classifierIds?: string[]
        } = {}
        if (this.type === 'Table') {
            filters.classifierIds = [
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    'TableT',
                    this.schema
                ),
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    'Table',
                    this.schema
                ),
            ]
        } else if (this.type === 'List') {
            filters.classifierIds = [
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    'ListT',
                    this.schema
                ),
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    'List',
                    this.schema
                ),
            ]
        } else if (this.type === 'Image') {
            filters.classifierIds = [
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    'ImageT',
                    this.schema
                ),
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    'Image',
                    this.schema
                ),
            ]
        } else if (this.type === 'Paragraph') {
            filters.classifierIds = [
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    'ParagraphT',
                    this.schema
                ),
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    'Paragraph',
                    this.schema
                ),
            ]
        } else if (this.type === 'Section') {
            filters.classifierIds = [
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    'SectionT',
                    this.schema
                ),
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    'Section',
                    this.schema
                ),
            ]
        } else {
            filters.classifierIds = [
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    this.type,
                    this.schema
                ),
            ]
        }
        return filters
    }

    public success = (): void => {
        const elemType = this.type
        this.utils.successUpdates(
            elemType,
            this.addElementData.viewOrSectionOb.id
        )
        this.growl.success(this.type + ' is being created')
    }

    public addExisting = (
        elementOb: ViewInstanceSpec
    ): VePromise<ViewInstanceSpec> => {
        const instanceVal: InstanceValueObject = {
            id: this.apiSvc.createUniqueId(),
            instanceId: elementOb.id,
            type: 'InstanceValue',
            _projectId: this.projectId,
            _refId: this.refId,
        }
        const viewReqOb: ViewCreationRequest = {
            viewId: this.addElementData.viewOrSectionOb.id,
            projectId: this.projectId,
            refId: this.refId,
        }
        return this.viewSvc.addElementToViewOrSection(
            viewReqOb,
            instanceVal,
            this.addElementData.addPeIndex
        )
    }

    public create = (): VePromise<ViewInstanceSpec> => {
        return this.viewSvc.createInstanceSpecification(
            this.addElementData.viewOrSectionOb,
            this.type,
            this.newItem.name,
            this.addElementData.addPeIndex
        )
    }
}

const AddPeComponent: VeComponentOptions = {
    selector: 'addPe',
    template: `
    <div>
    <div class="modal-header">
        <h4 class="pe-type-{{$ctrl.type}}" ng-if="$ctrl.addType == 'pe'">Add {{$ctrl.type | lowercase}}</h4>
    </div>

    <div class="modal-body">
        <ul class="nav nav-tabs" ng-show="$ctrl.type != 'Comment'">
            <li class="uib-tab nav-item tab-item" ng-class="{'active': $ctrl.createForm}">
                <a class="nav-link" ng-click="$ctrl.createForm = true"><i class="fa fa-plus"></i>Create New</a>
            </li>
            <li class="uib-tab nav-item tab-item" ng-class="{'active': !$ctrl.createForm}">
                <a class="nav-link" ng-click="$ctrl.createForm = false"><i class="fa fa-search"></i>Search for existing</a>
            </li>
        </ul>
        <div class="modal-body comment-modal">
            <div class="comment-modal-input" ng-show="$ctrl.createForm">
                <div class="form-group">
                    <label>Name (optional):</label>
                    <input class="form-control" ng-model="$ctrl.name" type="text"
                        ng-keyup="$event.keyCode == 13 ? $ctrl.ok() : null" placeholder="Type a name for your {{$ctrl.type | lowercase}} here" autofocus>
                </div>
            </div>
        </div>
        <div ng-show="!$ctrl.createForm">
            <p>Begin by searching for the {{$ctrl.type | lowercase}}, then click its name or documentation to add the view.</p>
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
        addElementData: '<',
        addElementApi: '<',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsOrgId: '@',
    },
    controller: AddPeController,
}

veComponents.component(AddPeComponent.selector, AddPeComponent)
