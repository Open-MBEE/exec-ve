import _ from 'lodash'

import { Insertion, InsertionService } from '@ve-components/insertions'
import { ApplicationService, UtilsService } from '@ve-utils/application'
import { ApiService, ElementService, ProjectService, ViewService } from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import { Class } from '@ve-utils/utils'

import { veComponents } from '@ve-components'

import { VeComponentOptions, VePromise, VePromiseReason, VeQService } from '@ve-types/angular'
import { InsertData } from '@ve-types/components'
import { ElementCreationRequest, ElementObject, MmsObject } from '@ve-types/mms'
import { VeModalService } from '@ve-types/view-editor'

class InsertElementController extends Insertion<InsertData> {
    //Bindings
    protected parentAction: string

    //Locals
    protected createType: number = 1
    protected description: string
    protected searchExisting: boolean = true

    static $inject = Insertion.$inject

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
        utils: InsertionService
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

    public $onInit(): void {
        super.$onInit()
        this.description = 'Search for an existing element before you ' + this.parentAction

        this.searchOptions.getProperties = true
        this.searchOptions.emptyDocTxt = 'This field is empty, but you can still click here to view-cf a placeholder.'
    }

    public create = (): VePromise<ElementObject> => {
        if (!this.newItem.name) {
            this.growl.error('Error: A name for your new element is required.')
            return this.$q.reject({ status: 422 })
        }
        const createObj: ElementObject = {
            id: this.apiSvc.createUniqueId(),
            _projectId: this.mmsProjectId,
            _refId: this.mmsRefId,
            ownerId: 'holding_bin_' + this.mmsProjectId,
            name: this.newItem.name,
            documentation: this.newItem.documentation,
            type: 'Class',
            _appliedStereotypeIds: [],
        }
        const toCreate: ElementObject = new Class(createObj)
        const reqOb: ElementCreationRequest<ElementObject> = {
            elements: [toCreate],
            elementId: toCreate.id,
            projectId: this.mmsProjectId,
            refId: this.mmsRefId,
        }

        if (!this.insertData.noPublish) {
            return this.elementSvc.createElement(reqOb)
        } else {
            return this.$q.resolve(createObj)
        }
    }

    public fail = <V extends VePromiseReason<MmsObject>>(reason: V): void => {
        if (reason.status === 401) {
            this.reLogin()
        } else if (reason.status === 422) {
            this.continue = true
        } else {
            this.growl.error(`Create ${_.upperCase(this.insertData.type)} Error: ${reason.message}`)
        }
    }
}

// Component for inserting cross reference
// Defines scope variables for html template and how to handle user click
// Also defines options for search interfaces -- see mmsSearch.js for more info
const InsertComponent: VeComponentOptions = {
    selector: 'insertGeneric',
    template: `
<div class="modal-body">
    <div class="ve-light-tabs modal-top-tabs" ng-show="!$ctrl.viewLink">
        <ul class="nav nav-tabs">
            <li class="uib-tab nav-item tab-item" ng-class="{'active': !$ctrl.searchExisting}">
                <a class="nav-link" ng-click="$ctrl.searchExisting = false"><i class="fa fa-plus"></i>Create New</a>
            </li>
            <li class="uib-tab nav-item tab-item" ng-class="{'active': $ctrl.searchExisting}">
                <a class="nav-link" ng-click="$ctrl.searchExisting = true"><i class="fa fa-search"></i>Search for existing</a>
            </li>
        </ul>
    </div>

    <!-- Search for existing panel -->
    <div ng-show="$ctrl.searchExisting">
        <div class="transclude-modal-instructions">
            {{$ctrl.description}}
        </div>

        <mms-search mms-options="$ctrl.searchOptions" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></mms-search>
    </div>

    <!-- Create New Panel -->
    <div ng-show="!$ctrl.searchExisting">
        <form>
            <div class="form-group">
                <label>Name </label><span class="star-mandatory">*</span>
                <input class="form-control" type="text" ng-model="$ctrl.newItem.name" placeholder="Name your new element" autofocus/>
            </div>
            <div class="form-group">
                <label class="label-documentation">Documentation</label>
                <editor ng-model="$ctrl.newItem.documentation" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}" class="textarea-transclude-modal"></editor>
            </div>
            <div class="form-group" ng-show="$ctrl.createType === 2">
                <label>Value</label>
            </div>
            <div class="form-group" ng-show="$ctrl.createType === 3">
                <label>Source</label>
                <label>Target</label>
            </div>
            
            <label><input type="radio" ng-model="$ctrl.createType" ng-value="1" checked>&nbsp;Class</label><br></label>
            <label><input type="radio" ng-model="$ctrl.createType" ng-value="2">&nbsp;Property</label><br>
            <label><input type="radio" ng-model="$ctrl.createType" ng-value="3">&nbsp;Relationship</label><br>
        </form>

        <p class="help-block pull-left"><i>Fields marked with <span class="star-mandatory">*</span> are required</i></p>
    </div>
</div>
<div class="modal-footer">
    <button class="btn btn-primary" ng-show="!$ctrl.searchExisting" type="button" ng-click="$ctrl.create()">Create or Select<i ng-show="$ctrl.oking" class="fa fa-spin fa-spinner"></i></button>
    <button class="btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
</div>
`,
    bindings: {
        insertData: '<',
        insertApi: '<',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsOrgId: '@',
    },
    controller: InsertElementController,
}

veComponents.component(InsertComponent.selector, InsertComponent)
