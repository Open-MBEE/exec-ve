// import { IOrganization, IUser } from '../models';
// import { AuthService } from '../services/auth.service';
// import { OrgService } from '../services/org.service';

import { veAdmin } from "@ve-admin/ve-admin.module";
import { VeComponentOptions, VePromise, VeQService } from "@ve-types/angular";
import { OrgObject, UserObject } from "@ve-types/mms";
import { VeModalService } from "@ve-types/view-editor";
import { AuthService, OrgService, PermissionsService, UserService } from "@ve-utils/mms-api-client";
import { handleChange } from "@ve-utils/utils";

class HomeComponentController implements angular.IComponentController {
  //Bindings
  private mmsUser: UserObject
  private mmsOrgs: OrgObject[]

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

  static $inject = ['$element', '$window', '$uibModal', 'OrgService', 'UserService', 'PermissionsService'];

  constructor(private $q: VeQService,
              private $element: JQuery<HTMLElement>,
              private $window: angular.IWindowService,
              private $uibModal: VeModalService,
              private orgSvc: OrgService,
              private userSvc: UserService,
              private permissionsSvc: PermissionsService) {}

  $onInit(): void {
    this.homeRef = this.$element[0].querySelector('#home-space') as HTMLElement;
    this.$window.addEventListener('resize', this.handleResize);
    this.handleResize();
    
    this.refresh(this.mmsOrgs);
  }

  $onDestroy(): void {
    this.$window.removeEventListener('resize', this.handleResize);
  }

  $onChanges(onChangesObj: angular.IOnChangesObject): void {
    handleChange(onChangesObj, 'mmsUser', this.refresh);
    handleChange(onChangesObj, 'mmsOrgs', this.refresh);
}

  refreshUser(user: UserObject): void {
    this.user = user
    this.orgs = []
    this.refresh(this.mmsOrgs)
  }

  refresh(orgs: OrgObject[]): void {
    this.user = this.mmsUser
    let writePermOrgs: OrgObject[] = [];

    if (!this.user.admin) {
      orgs.forEach((org) => {
        this.permissionsSvc.getOrgPermission(org.id).then((perm) => {
          if ((perm.permission === 'write') || (perm.permission === 'admin')) {
            writePermOrgs.push(org);
          }
        })
      });
    } else if (this.user.admin) {
      writePermOrgs = this.orgs;
      this.admin = this.user.admin;
    }

    if (writePermOrgs.length > 0) {
      this.write = true;
    }

    const display = {};
    orgs.forEach((org) => {
      display[org.id] = true;
    });

    this.orgs = orgs;
    this.displayOrgs = display;
  }

  handleResize = (): void => {
    if (this.homeRef) {
      this.width = this.homeRef.clientWidth;
    }
  };

  handleCreate = (): void => {
        const insertData: InsertRefData = {
            type: itemType,
            parentRefId: '',
            parentTitle: '',
            insertType: 'ref',
            lastCommit: true,
        };
        const branch = this.refSelected;
        // Item specific setup:
        if (itemType === 'Branch') {
            if (!branch) {
                this.growl.warning('Add Branch Error: Select a branch or tag first');
                return;
            }
            if (branch.type === 'Tag') {
                insertData.parentTitle = 'Tag ' + branch.name;
            } else {
                insertData.parentTitle = 'Branch ' + branch.name;
            }
            insertData.parentRefId = branch.id;
        } else if (itemType === 'Tag') {
            if (!branch) {
                this.growl.warning('Add Tag Error: Select a branch or tag first');
                return;
            }
            insertData.parentRefId = branch.id;
        } else {
            this.growl.error('Add Item of Type ' + itemType + ' is not supported');
            return;
        }
        const instance = this.$uibModal.open<InsertResolveFn<InsertRefData>, RefObject>({
            component: 'insertElementModal',
            resolve: {
                getInsertData: () => {
                    return insertData;
                },
                getFilter: () => {
                    return this.$filter;
                },
                getProjectId: () => {
                    return this.project.id;
                },
                getRefId: () => {
                    return null;
                },
                getOrgId: () => {
                    return this.project.orgId;
                },
                getSeenViewIds: () => {
                    return null;
                },
            },
        });
        instance.result.then(
            (data) => {
                if (data.type === 'Branch') {
                    this.branches.push(data);
                    this.refSelected = data;
                } else {
                    this.tags.push(data);
                    this.refSelected = data;
                }
            },
            (reason?) => {
                if (reason && reason.status !== 444) {
                    this.growl.error('Ref Creation Error:' + reason.message);
                } else {
                    this.growl.info('Ref Creation Cancelled', {
                        ttl: 1000,
                    });
                }
            }
        );
    };
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
        <div ng-show="$ctrl.orgs.length == 0">
          <div class="list-item">
            <h3>No organizations.</h3>
          </div>
        </div>
        <div ng-hide="$ctrl.orgs.length == 0" class="list">
        
        </div>

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