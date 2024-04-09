import { Insertion, InsertionService } from '@ve-components/insertions';
import { EditorService } from '@ve-core/editor';
import { ApplicationService, UtilsService } from '@ve-utils/application';
import { ApiService, ElementService, OrgService, ProjectService, ViewService } from '@ve-utils/mms-api-client';
import { SchemaService } from '@ve-utils/model-schema';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular';
import { InsertData } from '@ve-types/components';
import { OrgObject, OrgsResponse } from '@ve-types/mms';
import { VeModalService } from '@ve-types/view-editor';

export interface InsertOrgData extends InsertData {
    parentRefId: string;
    lastCommit: boolean;
}

class InsertRefController extends Insertion<InsertData, OrgObject> {
    static $inject = [...Insertion.$inject, 'OrgService'];

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
        editorSvc: EditorService,
        private orgSvc: OrgService
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
    }

    public create = (): VePromise<OrgObject, OrgsResponse> => {
        const orgObj: OrgObject = {
            name: this.createItem.name,
            description: this.createItem.description,
            id: this.apiSvc.createUniqueId(),
            public: this.createItem.public,
        };
        return this.orgSvc.createOrg(orgObj);
        //}
    };

    public resolve = (data: OrgObject): void => {
        this.insertApi.resolve(data);
    };
}

const InsertRefComponent: VeComponentOptions = {
    selector: 'insertRef',
    template: `
    <div class="workspace-header">
      <h2 class="workspace-title workspace-title-padding">{{$ctrl.title}}</h2>
    </div>
    <div class="extra-padding">
      <div ng-if="$ctrl.error" class="alert alert-danger">
        {{$ctrl.error}}
      </div>
      <form>
        <!-- Verify if org provided -->
        <div ng-if="$ctrl.$routeParams.projectid && !$ctrl.$routeParams.orgid">
          <div class="form-group">
            <label for="org">Organization ID</label>
            <select
              class="form-control"
              name="org"
              id="org"
              ng-model="$ctrl.values.org"
              ng-change="$ctrl.handleChange($event)"
            >
              <option value="">Choose one...</option>
              <option
                ng-repeat="org in $ctrl.orgOpt"
                value="{{org.id}}"
                ng-bind="org.name"
              ></option>
            </select>
          </div>
        </div>
        <!-- Create an input for project id -->
        <div class="form-group">
          <label for="id">{{$ctrl.header}} ID*</label>
          <input
            class="form-control"
            type="id"
            name="id"
            id="id"
            ng-model="$ctrl.values.id"
            ng-model-options="{ getterSetter: true }"
            ng-class="{ 'is-invalid': $ctrl.idInvalid }"
            ng-change="$ctrl.handleChange($event)"
          />
          <!-- If invalid id, notify user -->
          <div
            class="invalid-feedback"
            ng-if="$ctrl.values.id.length !== 0 && ($ctrl.values.id.length > $ctrl.validLen || !RegExp($ctrl.validatorId).test($ctrl.values.id))"
          >
            Invalid: An id may only contain letters, numbers, or dashes.
          </div>
        </div>
        <!-- Create an input for project name -->
        <div class="form-group">
          <label for="name">{{$ctrl.header}} Name*</label>
          <input
            class="form-control"
            type="name"
            name="name"
            id="name"
            ng-model="$ctrl.values.name"
            ng-model-options="{ getterSetter: true }"
            ng-class="{ 'is-invalid': !$ctrl.values.name }"
            ng-change="$ctrl.handleChange($event)"
          />
          <!-- If invalid name, notify user -->
          <div class="invalid-feedback">
            Invalid: A name may only contain letters, numbers, space, or dashes.
          </div>
        </div>
        <!-- Form section for project visibility -->
        <div ng-if="$ctrl.$routeParams.projectid">
          <div class="form-group">
            <label for="visibility">Visibility</label>
            <select
              class="form-control"
              name="visibility"
              id="visibility"
              ng-model="$ctrl.values.visibility"
              ng-change="$ctrl.handleChange($event)"
            >
              <option value="internal">Internal</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
        <!-- Create an input for custom data -->
        <div class="form-group">
          <label for="custom">Custom Data</label>
          <textarea
            class="form-control"
            name="custom"
            id="custom"
            ng-model="$ctrl.values.custom"
            ng-model-options="{ getterSetter: true }"
            ng-class="{ 'is-invalid': $ctrl.customInvalid }"
            ng-change="$ctrl.handleChange($event)"
          ></textarea>
          <!-- If invalid custom data, notify user -->
          <div
            class="invalid-feedback"
            ng-if="$ctrl.customInvalid"
          >
            Invalid: Custom data must be valid JSON.
          </div>
        </div>
        <div class="required-fields">* required fields.</div>
        <!-- Button to create project -->
        <button
          type="button"
          class="btn btn-primary"
          ng-disabled="$ctrl.customInvalid || $ctrl.idInvalid || !$ctrl.values.name || !$ctrl.values.id"
          ng-click="$ctrl.onSubmit()"
        >
          Create
        </button>
        <button
          type="button"
          class="btn btn-outline-secondary"
          ng-click="$ctrl.$location.url('/')"
        >
          Cancel
        </button>
      </form>
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
