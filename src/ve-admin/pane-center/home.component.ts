import { IPane, IRegion } from '@openmbee/pane-layout';

import { ListApi } from '@ve-admin/components/list/list.component';
import { veAdmin } from '@ve-admin/ve-admin.module';
import { RootScopeService } from '@ve-utils/application';
import { OrgService, UserService } from '@ve-utils/mms-api-client';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject, UserObject } from '@ve-types/mms';
import Role from '@ve-types/mms/permissions';

class HomeController {
    mmsOrgs: OrgObject[];
    mmsUser: UserObject;

    $pane: IPane;
    $resized: Rx.Disposable;

    listApi: ListApi;

    width: number | null = null;
    modalCreate: boolean = false;
    modalDelete: boolean = false;
    user: UserObject = null;
    orgs: OrgObject[] = [];
    admin: boolean = false;
    write: boolean = false;
    displayOrgs: { [key: string]: boolean } = {};
    error: any = null;

    orgPerms: { [orgId: string]: { admin: boolean; write: boolean } } = {};

    static $inject = ['growl', 'RootScopeService', 'OrgService', 'UserService'];

    constructor(
        private growl: angular.growl.IGrowlService,
        private rootScopeSvc: RootScopeService,
        private orgSvc: OrgService,
        private userSvc: UserService
    ) {}

    $onInit(): void {
        this.rootScopeSvc.veHideLeft(true);
        this.rootScopeSvc.veHideRight(true);
        this.$resized = (this.$pane.$resized as Rx.Subject<IRegion>).subscribe(() => this.handleResize());
        this.listApi = {
            onExpandChange: this.onExpandChange,
            onRefresh: this.refresh,
        };
        this.handleResize();
        this.init(this.mmsOrgs, this.mmsUser);
    }

    // $onChanges(onChangesObj: IOnChangesObject): void {
    //     if (
    //         (onChangesObj['mmsOrgs'] && !onChangesObj['mmsOrgs'].isFirstChange() && this.mmsUser) ||
    //         (onChangesObj['mmsUser'] && !onChangesObj['mmsUser'].isFirstChange() && this.mmsOrgs)
    //     ) {
    //         this.init(
    //             onChangesObj['mmsOrgs'].currentValue as OrgObject[],
    //             onChangesObj['mmsUser'].currentValue as UserObject
    //         );
    //     }
    // }

    $onDestroy(): void {
        this.$resized.dispose();
    }

    refresh = (): void => {
        this.orgSvc.getOrgs(true).then(
            (orgs) => {
                this.userSvc.getCurrentUser(true).then(
                    (user) => {
                        this.init(orgs, user);
                    },
                    () => {
                        this.growl.error('Unable to retrieve user detaisl');
                    }
                );
            },
            () => {
                this.growl.error('Unable to refresh Orgs');
            }
        );
    };

    init = (orgData?: OrgObject[], user?: UserObject): void => {
        let writePermOrgs: OrgObject[] = [];
        if (!user.admin) {
            orgData.forEach((org) => {
                this.orgPerms[org.id] = { admin: false, write: false };
                const perm = org.permission.users[user.username].role;
                if (perm === Role.WRITE || perm === Role.ADMIN) {
                    writePermOrgs.push(org);
                    this.orgPerms[org.id].write = true;
                    if (perm === Role.ADMIN) {
                        this.orgPerms[org.id].admin = true;
                    }
                }
            });
        } else if (user.admin) {
            writePermOrgs = orgData;
            this.admin = user.admin;
        }
        const display: { [key: string]: boolean } = {};
        orgData.forEach((org) => {
            display[org.id] = false;
        });
        this.displayOrgs = display;
        this.orgs = orgData;
        this.user = user;
        //this.$scope.$apply();
    };

    handleResize = (): void => {
        if (this.$pane.$region) {
            this.width = this.$pane.$region.width;
        }
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
}

const HomeComponent: VeComponentOptions = {
    controller: HomeController,
    selector: 'adminHome',
    require: {
        $pane: '^ngPane',
    },
    bindings: {
        mmsOrgs: '<',
        mmsUser: '<',
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
    <org-list ng-repeat="org in $ctrl.orgs" org="org"
              key="{{'org-key-' + org.id}}"
              user="$ctrl.user"
              write="$ctrl.admin || $ctrl.orgPerms[org.id].admin || $ctrl.orgPerms[org.id].write"
              admin="$ctrl.admin || $ctrl.orgPerms[org.id].admin"
              show-projs="$ctrl.displayOrgs[org.id]"
              list-api="$ctrl.listApi">
    </org-list>
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
