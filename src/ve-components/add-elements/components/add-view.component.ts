import angular from 'angular'

import { AddElementData } from '@ve-app/main/modals/add-item-modal.component'
import { AddElement } from '@ve-components/add-elements'
import { SearchFilter } from '@ve-core/search/mms-search.component'
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
import { ViewObject } from '@ve-types/mms'
import { TreeBranch } from '@ve-types/tree'
import { VeModalService } from '@ve-types/view-editor'

export interface AddViewData extends AddElementData {
    parentBranch: TreeBranch
    seenViewIds: { [viewId: string]: TreeBranch }
}

class AddViewController extends AddElement<AddViewData> {
    private aggr: 'composite' | 'shared' = 'composite'

    static $inject = AddElement.$inject

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
        utils: CoreUtilsService
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

    protected config = (): void => {
        if (this.addElementData.parentBranch) {
            this.parentData = this.addElementData.parentBranch.data
        }
    }

    public callback = (data: ViewObject): void => {
        const view = data
        const viewId = view.id
        if (this.addElementData.seenViewIds[viewId]) {
            this.growl.error(
                'Error: View ' + view.name + ' is already in this document.'
            )
            return
        }
        if (this.oking) {
            this.growl.info('Please wait...')
            return
        }
        this.oking = true
        this.viewSvc
            .addViewToParentView({
                parentViewId: this.parentData.id,
                viewId: viewId,
                projectId: this.parentData._projectId,
                refId: this.parentData._refId,
                aggr: this.aggr,
                returnChildViews: true,
            })
            .then(
                () => {
                    this.elementSvc
                        .getElement<ViewObject>(
                            {
                                elementId: viewId,
                                projectId: view._projectId,
                                refId: view._refId,
                            },
                            2,
                            false
                        )
                        .then(
                            (realView) => {
                                this.addElementApi.resolve(realView)
                            },
                            () => {
                                this.addElementApi.reject(view)
                            }
                        )
                        .finally(() => {
                            this.growl.success('View Added')
                        })
                },
                (reason) => {
                    this.growl.error(`View Add Error: ${reason.message}`)
                }
            )
            .finally(() => {
                this.oking = false
            })
    }

    public queryFilter = (): SearchFilter => {
        const filters: SearchFilter = {}
        filters._appliedStereotypeIds = [
            this.schemaSvc.getSchema<string>('VIEW_SID', this.schema),
            this.schemaSvc.getSchema<string>('DOCUMENT_SID', this.schema),
            ...this.schemaSvc.getSchema<string[]>(
                'OTHER_VIEW_SID',
                this.schema
            ),
        ]
        return filters
    }

    public create = (): VePromise<ViewObject> => {
        if (this.type === 'Document') {
            return this.viewSvc.createDocument(
                {
                    _projectId: this.projectId,
                    _refId: this.refId,
                    id: this.ownerId,
                },
                {
                    name: this.name,
                    id: this.apiSvc.createUniqueId(),
                    isDoc: true,
                    _projectId: this.projectId,
                    _refId: this.refId,
                    type: 'Class',
                }
            )
        } else if (this.type === 'View') {
            return this.viewSvc.createView(this.parentData, {
                id: this.apiSvc.createUniqueId(),
                name: this.name,
                _projectId: this.projectId,
                _refId: this.refId,
                type: 'Class',
            })
        } else if (this.type === 'Group') {
            return this.viewSvc.createGroup(
                this.name,
                {
                    _projectId: this.projectId,
                    _refId: this.refId,
                    id: this.ownerId,
                },
                this.orgId
            )
        } else {
            return this.$q.reject({
                status: 666,
                message: 'Unsupported View Type',
            })
        }
    }
}

const AddViewComponent: VeComponentOptions = {
    selector: 'addView',
    template: `
    <div>
    <div class="modal-header">
        <h4 class="item-type-{{$ctrl.type | lowercase}}">Create new {{$ctrl.type | lowercase}}</h4>
    </div>

    <div class="modal-body">
        <div class="ve-light-tabs modal-top-tabs">
            <ul class="nav nav-tabs">
                <li class="uib-tab nav-item tab-item" ng-class="{'active': $ctrl.createForm}">
                    <a class="nav-link" ng-click="$ctrl.createForm = true"><i class="fa fa-plus"></i>Create New</a>
                </li>
                <li class="uib-tab nav-item tab-item" ng-class="{'active': !$ctrl.createForm}">
                    <a class="nav-link" ng-click="$ctrl.createForm = false"><i class="fa fa-search"></i>Search for existing</a>
                </li>
            </ul>
        </div>
        <div class="modal-body comment-modal">
            <div class="comment-modal-input" ng-show="$ctrl.createForm">
                <div class="form-group">
                    <label>Name (optional):</label>
                    <input class="form-control" ng-model="$ctrl.newItem.name" type="text"
                        ng-keyup="$event.keyCode == 13 ? $ctrl.ok() : null" placeholder="Type a name for your {{$ctrl.type | lowercase}} here" autofocus>
                </div>
            </div>
        </div>
        <div ng-show="!$ctrl.createForm">
            <p>Begin by searching for the {{$ctrl.type | lowercase}}, then click its name or documentation to add the view.</p>
            <div class="radio" ng-show="$ctrl.type === 'View'">
                <label><input type="radio" ng-model="$ctrl.aggr" value="shared">Add view and its children</label><br>
                <label><input type="radio" ng-model="$ctrl.aggr" value="none">Add view only</label>
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
        addElementData: '<',
        addElementApi: '<',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsOrgId: '@',
    },
    controller: AddViewController,
}

veComponents.component(AddViewComponent.selector, AddViewComponent)
