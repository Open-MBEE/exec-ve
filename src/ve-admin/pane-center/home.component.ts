import { IOnChangesObject } from 'angular';

import { veAdmin } from '@ve-admin/ve-admin.module';
import { handleChange } from '@ve-utils/utils';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject, UserObject } from '@ve-types/mms';

class HomeController {
    width: number | null = null;
    modalCreate: boolean = false;
    modalDelete: boolean = false;
    user: UserObject = null;
    orgs: OrgObject[] = [];
    admin: boolean = false;
    write: boolean = false;
    displayOrgs: { [key: string]: boolean } = {};
    error: any = null;

    static $inject = ['$scope', '$window', '$element'];

    constructor(private $scope: ng.IScope, private $window: ng.IWindowService, private $element: JQuery<HTMLElement>) {}

    $onInit(): void {
        this.$window.addEventListener('resize', this.handleResize);
        this.handleResize();
        //this.setMountedComponentStates();
    }

    $onChanges(onChangesObj: IOnChangesObject): void {
        handleChange(onChangesObj, 'orgs', this.setMountedComponentStates);
    }

    setMountedComponentStates = (): void => {
        let writePermOrgs: OrgObject[] = [];
        if (!this.user.admin) {
            this.orgs.forEach((org) => {
                const users = org.permissions && org.permissions.users ? org.permissions.users : {};
                const perm = users[this.user.username] ? users[this.user.username] : '';
                if (perm === 'write' || perm === 'admin') {
                    writePermOrgs.push(org);
                }
            });
        } else if (this.user.admin) {
            writePermOrgs = this.orgs;
        }
        if (writePermOrgs.length > 0) {
            this.write = true;
        }
        if (this.user.admin) {
            this.admin = this.user.admin;
        }
        const display: { [key: string]: boolean } = {};
        this.orgs.forEach((org) => {
            display[org.id] = true;
        });
        this.displayOrgs = display;
        //this.$scope.$apply();
    };

    handleResize = (): void => {
        this.width = this.$element[0].clientWidth;
        //this.$scope.$apply();
    };

    handleDeleteToggle = (): void => {
        this.modalDelete = !this.modalDelete;
    };

    handleCreateToggle = (): void => {
        this.modalCreate = !this.modalCreate;
    };

    onExpandChange = (orgID: string, value: boolean): void => {
        this.displayOrgs[orgID] = value;
    };

    handleExpandCollapse = (e: JQuery.TriggeredEvent): void => {
        const { name } = e.target as HTMLButtonElement;
        const expanded = name === 'expand';
        Object.keys(this.displayOrgs).forEach((org) => {
            this.displayOrgs[org] = expanded;
        });
    };

    $onDestroy(): void {
        this.$window.removeEventListener('resize', this.handleResize);
    }
}

const HomeComponent: VeComponentOptions = {
    controller: HomeController,
    selector: 'adminHome',
    bindings: {
        orgs: '<',
        user: '<',
    },
    template: `
    <div class="home-space" ng-ref="$ctrl.homeRef">
  <div class="workspace-header home-header">
    <h2 ng-class="{
      'workspace-title workspace-title-padding': !$ctrl.admin,
      'workspace-title': $ctrl.admin
    }">Organizations</h2>
    <div ng-if="$ctrl.admin" class="workspace-header-button">
      <button class="btn" ng-click="$ctrl.handleCreateToggle()">
        <span ng-if="$ctrl.width > 600">Create</span>
        <i ng-if="$ctrl.width <= 600" class="fas fa-plus add-btn"></i>
      </button>
      <button class="btn" ng-click="$ctrl.handleDeleteToggle()">
        <span ng-if="$ctrl.width > 600">Delete</span>
        <i ng-if="$ctrl.width <= 600" class="fas fa-trash-alt delete-btn"></i>
      </button>
    </div>
  </div>
  <div id="grp-expand-collapse">
    <button id="btn-expand" type="button" name="expand" ng-click="$ctrl.handleExpandCollapse($event)">
      [ Expand ]
    </button>
    <button id="btn-collapse" type="button" name="collapse" ng-click="$ctrl.handleExpandCollapse($event)">
      [ Collapse ]
    </button>
  </div>
  <div class="extra-padding">
    <div ng-if="$ctrl.orgs.length === 0" class="list-item"><h3>No organizations.</h3></div>
    <div ng-repeat="org in $ctrl.orgs">
      <org-list org="org"
                key="{{'org-key-' + org.id}}"
                user="$ctrl.user"
                write="$ctrl.write"
                admin="$ctrl.admin"
                show-projs="$ctrl.displayOrgs[org.id]"
                on-expand-change="$ctrl.onExpandChange(org.id, value)"
                refresh="$ctrl.refresh()">
      </org-list>
    </div>
  </div>
  <!-- <modal is-open="$ctrl.modalCreate" toggle="$ctrl.handleCreateToggle()">
    <modal-body>
      <create toggle="$ctrl.handleCreateToggle()"></create>
    </modal-body>
  </modal>
  <modal is-open="$ctrl.modalDelete" toggle="$ctrl.handleDeleteToggle()">
    <modal-body>
      <delete orgs="$ctrl.orgs" toggle="$ctrl.handleDeleteToggle()" refresh="$ctrl.refresh()"></delete>
    </modal-body>
  </modal> -->
</div>
  `,
};

veAdmin.component(HomeComponent.selector, HomeComponent);
