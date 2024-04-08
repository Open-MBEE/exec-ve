// import { IOrganization, IUser } from '../models';
// import { AuthService } from '../services/auth.service';
// import { OrgService } from '../services/org.service';

import { veAdmin } from "@ve-admin/ve-admin.module";
import { VeComponentOptions } from "@ve-types/angular";
import { OrgObject, UserObject } from "@ve-types/mms";
import { OrgService, UserService } from "@ve-utils/mms-api-client";

class HomeComponentController implements angular.IComponentController {

  width: number | null = null;
  modalCreate = false;
  modalDelete = false;
  user: UserObject | null = null;
  orgs: OrgObject[] = [];
  admin = false;
  write = false;
  displayOrgs: { [id: string]: boolean } = {};
  error: any = null;
  homeRef: HTMLElement | null = null;

  static $inject = ['$element', '$window', '$uibModal', 'OrgService', 'UserService'];

  constructor(private $element: ng.IRootElementService,
              private $window: ng.IWindowService,
              private $uibModal: ng.ui.bootstrap.IModalService,
              private orgSvc: OrgService,
              private userSvc: UserService) {}

  $onInit(): void {
    this.homeRef = this.$element[0].querySelector('#home-space') as HTMLElement;
    this.$window.addEventListener('resize', this.handleResize);
    this.handleResize();
    this.refresh();
  }

  $onDestroy(): void {
    this.$window.removeEventListener('resize', this.handleResize);
  }

  async setMountedComponentStates(userData: UserObject, orgData: OrgObject[]): Promise<void> {
    let writePermOrgs: OrgObject[] = [];

    if (!userData.admin) {
      orgData.forEach((org) => {
        const perm = org.permissions[userData.username];

        if ((perm === 'write') || (perm === 'admin')) {
          writePermOrgs.push(org);
        }
      });
    } else if (userData.admin) {
      writePermOrgs = this.orgs;
    }

    if (writePermOrgs.length > 0) {
      this.write = true;
    }

    if (userData.admin) {
      this.admin = userData.admin;
    }

    const display = {};
    orgData.forEach((org) => {
      display[org.id] = true;
    });

    this.orgs = orgData;
    this.displayOrgs = display;
  }

  handleResize = (): void => {
    if (this.homeRef) {
      this.width = this.homeRef.clientWidth;
    }
  };

  handleCreateToggle = (): void => {
    this.modalCreate = !this.modalCreate;
  };

  handleDeleteToggle = (): void => {
    this.modalDelete = !this.modalDelete;
  };

  onExpandChange = (orgID: string, value: boolean): void => {
    this.displayOrgs[orgID] = value;
  };

  handleExpandCollapse = (e: any): void => {
    const name = e.target.name;
    const expanded = (name === 'expand');

    this.displayOrgs = Object.keys(this.displayOrgs).reduce((acc, org) => {
      acc[org] = expanded;
      return acc;
    }, {});
  };

  async refresh(): Promise<void> {
    try {
      const data: UserObject = await this.permissionS.getUserData().toPromise();
      this.user = data;

      const options = {
        params: {
          populate: 'projects',
          includeArchived: true,
        },
      };

      const orgData: IOrganization[] = await this.orgSvc.getOrgs(options);

      await this.setMountedComponentStates(data, orgData);
    } catch (error) {
      this.error = error;
    }
  }

}

const HomeComponent: VeComponentOptions = {
    selector: 'adminHome',
    bindings: {
        mmsParams: '<',
        mmsOrg: '<',
        mmsProject: '<',
        mmsRef: '<',
        mmsGroup: '<',
    },
  controller: HomeComponentController,
  template: `
    <div id="home-space" class="home-space">
      <div class="workspace-header home-header">
        <h2 ng-class="{'workspace-title-padding': !$ctrl.admin}" ng-class="{'workspace-title': $ctrl.admin}">
          Organizations
        </h2>

        <div class="workspace-header-button" ng-if="$ctrl.admin">
          <button class="btn" type="button" ng-disabled="!$ctrl.write" ng-click="$ctrl.handleCreateToggle()">
            <ng-container ng-if="$ctrl.width > 600; else addBtn">
              Create
            </ng-container>
            <ng-template #addBtn>
              <i class="fas fa-plus add-btn"></i>
            </ng-template>
          </button>

          <button class="btn" type="button" ng-disabled="!$ctrl.write" ng-click="$ctrl.handleDeleteToggle()">
            <ng-container ng-if="$ctrl.width > 600; else deleteBtn">
              Delete
            </ng-container>
            <ng-template #deleteBtn>
              <i class="fas fa-trash-alt delete-btn"></i>
            </ng-template>
          </button>
        </div>
      </div>

      <div id="grp-expand-collapse" class="input-group">
        <button id="btn-expand" type="button" name="expand" class="btn" ng-click="$ctrl.handleExpandCollapse($event)">
          [ Expand ]
        </button>

        <button id="btn-collapse" type="button" name="collapse" class="btn" ng-click="$ctrl.handleExpandCollapse($event)">
          [ Collapse ]
        </button>
      </div>

      <div class="extra-padding">
        <ng-container ng-if="$ctrl.orgs.length === 0; else orgList">
          <div class="list-item">
            <h3>No organizations.</h3>
          </div>
        </ng-container>

        <ng-template #orgList>
          <app-list>
            <app-org-list ng-repeat="org in $ctrl.orgs"
                          org="org"
                          user="$ctrl.user"
                          admin="$ctrl.admin"
                          write="$ctrl.write"
                          show-projs="$ctrl.displayOrgs[org.id]"
                          on-expand-change="$ctrl.onExpandChange(org.id, $event)"
                          refresh="$ctrl.refresh()">
            </app-org-list>
          </app-list>
        </ng-template>
      </div>

      <div ng-if="$ctrl.modalCreate">
        <app-create toggle="$ctrl.handleCreateToggle()"></app-create>
      </div>

      <div ng-if="$ctrl.modalDelete">
        <app-delete orgs="$ctrl.orgs" toggle="$ctrl.handleDeleteToggle()" refresh="$ctrl.refresh()"></app-delete>
      </div>
    </div>
  `

}

veAdmin.component(HomeComponent.selector, HomeComponent);