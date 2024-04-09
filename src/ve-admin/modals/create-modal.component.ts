import * as uuidv4 from 'uuid/v4';

import validators from '../../../../build/json/validators.json';

interface IOrg {
    id: string;
    name: string;
}
interface IValues {
    org: string;
    name: string;
    id: string;
    visibility: string;
    custom: string;
}

class CreateController implements ng.IOnInit {
    orgService: any;
    projectService: any;
    orgOpt: IOrg[];
    values: IValues;
    error: string | null;
    redirect: string | null;
    title: string;
    header: string;
    idInvalid: boolean;
    customInvalid: boolean;
    validatorId: string;
    validLen: number;

    constructor(private $routeParams: any, private $location: any, private ApiClient: any) {}

    async $onInit(): Promise<void> {
        this.orgService = this.ApiClient.org;
        this.projectService = this.ApiClient.project;

        this.orgOpt = [];
        this.values = {
            org: uuidv4(),
            name: '',
            id: uuidv4(),
            visibility: 'private',
            custom: JSON.stringify({}, null, 2),
        };
        this.error = null;
        this.redirect = null;

        // Initialize validators
        if (this.$routeParams.projectid) {
            this.title = this.$routeParams.orgid ? `New Project in ${this.$routeParams.orgid}` : 'New Project';
            this.header = 'Project';
            this.validatorId = `^${validators.project.id.split(validators.ID_DELIMITER).pop()}`;
            // Calculate project ID sans delimiter
            this.validLen = validators.project.idLength - validators.org.idLength - 1;
        } else {
            this.validatorId = validators.org.id;
            this.validLen = validators.org.idLength;
            this.title = 'New Organization';
            this.header = 'Organization';
        }

        // Verify no orgs were passed in props
        if (this.$routeParams.projectid && this.$routeParams.orgs) {
            // Loop through orgs
            const orgOptions = this.$routeParams.orgs.map((org: any) => ({
                id: org.id,
                name: org.name,
            }));

            // Set the org options state
            this.orgOpt = orgOptions;
        }
    }

    handleChange(e: any): void {
        this.values[e.target.name] = e.target.value;
    }

    async onSubmit(): Promise<void> {
        // Initialize data const data = { id: this.values.id, name: this.values.name, custom: JSON.parse(this.values.custom), };

        // Initialize variables
        let post;
        let redirectUrl;

        // Verify if this is for a project
        if (this.$routeParams.projectid) {
            if (!this.$routeParams.orgid) {
                // Set org as the state prop
                post = (d: any, o: any) => this.projectService.post(this.values.org, d, o);
                redirectUrl = `/orgs/${this.values.org}/projects/${this.values.id}/branches/master/elements`;
            } else {
                // Set org as the parent prop
                post = (d: any, o: any) => this.projectService.post(this.$routeParams.orgid, d, o);
                redirectUrl = `/orgs/${this.$routeParams.orgid}/projects/${this.values.id}/branches/master/elements`;
            }
            // Set project visibility
            data.visibility = this.values.visibility;
        } else {
            post = (d: any, o: any) => this.orgService.post(d, o);
            redirectUrl = `/orgs/${this.values.id}`;
        }

        // Post the data via org or project service
        const [err, result] = await post(data, {});

        // Set error or redirect upon success
        if (err) {
            this.error = err;
        } else if (result) {
            this.redirect = redirectUrl;
        }
    }
}

export const CreateComponent: ng.IComponentOptions = {
    controller: CreateController,
    template: `
<div id="workspace">
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
};
