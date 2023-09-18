import { Insertion, InsertionService } from '@ve-components/insertions';
import { EditorService } from '@ve-core/editor';
import { SearchFilter } from '@ve-core/search/mms-search.component';
import { ApplicationService, UtilsService } from '@ve-utils/application';
import { ApiService, ElementService, ProjectService, ViewService } from '@ve-utils/mms-api-client';
import { SchemaService } from '@ve-utils/model-schema';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular';
import { InsertData } from '@ve-types/components';
import { ViewObject } from '@ve-types/mms';
import { TreeBranch } from '@ve-types/tree';
import { VeModalService } from '@ve-types/view-editor';

export interface InsertViewData extends InsertData {
    parentBranch: TreeBranch;
    seenViewIds: { [viewId: string]: TreeBranch };
    newViewAggr?: 'composite' | 'shared';
}

class InsertViewController extends Insertion<InsertViewData> {
    private aggr: 'composite' | 'shared' = 'composite';

    static $inject = Insertion.$inject;

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
        if (this.insertData.newViewAggr) {
            this.aggr = this.insertData.newViewAggr;
        }
        if (this.insertData.parentBranch) {
            this.parentData = this.insertData.parentBranch.data;
        }
    }

    public insert = (data: ViewObject): VePromise<ViewObject> => {
        const deferred = this.$q.defer<ViewObject>();
        const view = data;
        const viewId = view.id;
        if (this.insertData.seenViewIds[viewId]) {
            this.growl.error('Error: View ' + view.name + ' is already in this document.');
            return;
        }
        if (this.oking) {
            this.growl.info('Please wait...');
            return;
        }
        this.oking = true;
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
                                deferred.resolve(realView);
                            },
                            (reason) => {
                                reason.data.elements = [view];
                                deferred.reject(reason);
                            }
                        );
                },
                (reason) => {
                    this.growl.error(`View Add Error: ${reason.message}`);
                }
            );
        return deferred.promise;
    };

    public last = (): void => {
        this.growl.success('View Added');
    };

    public queryFilter = (): SearchFilter => {
        const filters: SearchFilter = {};
        filters.appliedStereotypeIds = [
            this.schemaSvc.getSchema<string>('VIEW_SID', this.schema),
            this.schemaSvc.getSchema<string>('DOCUMENT_SID', this.schema),
            ...this.schemaSvc.getSchema<string[]>('OTHER_VIEW_SID', this.schema),
        ];
        return filters;
    };

    public create = (): VePromise<ViewObject> => {
        if (this.type === 'Document') {
            return this.viewSvc.createDocument(
                {
                    _projectId: this.projectId,
                    _refId: this.refId,
                    id: this.ownerId,
                },
                {
                    name: this.createItem.name,
                    id: this.apiSvc.createUniqueId(),
                    isDoc: true,
                    _projectId: this.projectId,
                    _refId: this.refId,
                    type: 'Class',
                }
            );
        } else if (this.type === 'View') {
            return this.viewSvc.createView(this.parentData, {
                id: this.apiSvc.createUniqueId(),
                name: this.createItem.name,
                _projectId: this.projectId,
                _refId: this.refId,
                type: 'Class',
            });
        } else if (this.type === 'Group') {
            return this.viewSvc.createGroup(this.createItem.name, {
                _projectId: this.projectId,
                _refId: this.refId,
                id: this.ownerId,
            });
        } else {
            return this.$q.reject({
                status: 666,
                message: 'Unsupported View Type',
            });
        }
    };
}

const InsertViewComponent: VeComponentOptions = {
    selector: 'insertView',
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
                    <label>Name:</label>
                    <input class="form-control" ng-model="$ctrl.createItem.name" type="text"
                        ng-keyup="$event.keyCode == 13 ? $ctrl.ok() : null" placeholder="Type a name for your {{$ctrl.type | lowercase}} here" autofocus>
                </div>
                <div class="form-group">
                    <label class="label-documentation">Documentation (optional):</label>
                    <editor ng-model="$ctrl.createItem.documentation" edit-field="documentation" mms-element-id="$ctrl.createItem.id" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}" class="textarea-transclude-modal"></editor>
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
        insertData: '<',
        insertApi: '<',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsOrgId: '@',
    },
    controller: InsertViewController,
};

veComponents.component(InsertViewComponent.selector, InsertViewComponent);
veComponents.component('addGroup', InsertViewComponent);
veComponents.component('addDocument', InsertViewComponent);
