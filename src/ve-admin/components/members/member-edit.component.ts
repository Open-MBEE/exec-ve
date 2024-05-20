import { StateService } from '@uirouter/angularjs';
import { IOnChangesObject } from 'angular';

import { veAdmin } from '@ve-admin';
import { PermissionService, UserService } from '@ve-utils/mms-api-client';

import { WarningModalResolveFn } from '../../modals/warning.modal.component';
import { MembersPageController } from '../../pane-center/members-page.component';

import { VeComponentOptions, VePromise } from '@ve-types/angular';
import {
    OrgObject,
    PermissionUpdateRequest,
    PermissionUpdateResponse,
    ProjectObject,
    GroupObject,
    UserObject,
} from '@ve-types/mms';
import Role, { VeRole } from '@ve-types/mms/permissions';
import { VeModalService } from '@ve-types/view-editor';

// Define component
export class MemberEditController implements angular.IComponentController {
    // const { orgService, projectService, userService } = useApiClient();
    // const [username, selectUsername] = useState(props.selectedUser ? props.selectedUser.username : '');
    // const [permissions, setPermissions] = useState(props.selectedUser ? props.selectedUser.perm : '');
    // const [results, setResults] = useState(null);
    // const [error, setError] = useState(null);

    // const prevSelectedUser = usePrevious(props.selectedUser);
    // const prevResults = usePrevious(props.results);
    org: OrgObject;
    project: ProjectObject;
    group: GroupObject;
    selectedUser: string;
    authority: VeRole['ANY'];
    currentUser: string;

    results: UserObject[];
    username: string;
    user: UserObject;
    permissions: VeRole['ANY'];
    inherited: boolean;
    btnTitle: string;
    header: string;
    title: string;
    notFound: string;
    roles = Role;

    //Parent Controllers
    membersPage: MembersPageController;

    static $inject = ['growl', '$state', '$uibModal', 'UserService', 'PermissionService'];

    constructor(
        private growl: angular.growl.IGrowlService,
        private $state: StateService,
        private $uibModal: VeModalService,
        private userSvc: UserService,
        private permissionSvc: PermissionService
    ) {}

    $onInit(): void {
        this.title = this.org ? this.org.name : this.project.name;

        // Check if user is a member of the Org or Project
        if (this.selectedUser) {
            this.selectUser(this.selectedUser);
        }
    }

    $onChanges(onChangesObj: IOnChangesObject): void {
        if (onChangesObj.selectedUser) {
            this.selectUser(onChangesObj.selectedUser.currentValue as string);
        }
    }

    selectUser = (name: string): void => {
        this.username = name;
        this.results = null;
        const orgMember: boolean =
            this.org && (Object.prototype.hasOwnProperty.call(this.org.permission.users, this.username) as boolean);
        const projMember =
            this.project &&
            (Object.prototype.hasOwnProperty.call(this.project.permission.users, this.username) as boolean);
        if (orgMember) {
            this.permissions = this.org.permission.users[name].role;
        } else if (projMember) {
            this.permissions = this.project.permission.users[name].role;
            this.inherited = this.project.permission.users[name].inherited;
        } else {
            this.permissions = Role.NONE;
            this.inherited = false;
        }

        // Check if user is a member of the Org or Project

        this.btnTitle = orgMember || projMember ? 'Save' : 'Add';
        this.header = orgMember || projMember ? 'Modify User' : 'Add user';
    };

    onSubmit = (): void => {
        if ((this.username = this.currentUser)) {
            this.$uibModal
                .open<WarningModalResolveFn, void>({
                    component: 'warningModal',
                    backdrop: 'static',
                    keyboard: false,
                    windowTopClass: 'modal-center-override',
                    resolve: {
                        message: () => {
                            return `This action will modify **YOUR** permissions to this ${
                                this.org ? 'Organization' : 'Project'
                            }, loss of access to data may occur.`;
                        },
                    },
                })
                .result.then(
                    () => {
                        this.updatePermissions();
                    },
                    () => {
                        this.resetForm();
                    }
                );
        }
    };

    updatePermissions = (): void => {
        const data: PermissionUpdateRequest = {
            users: {
                permissions: [],
                action: 'MODIFY',
            },
        };
        // Set data to submit
        if (this.permissions === Role.NONE) {
            data.users.action = 'REMOVE';
            data.users.permissions.push({
                name: this.username,
            });
        } else {
            data.users.permissions.push({
                name: this.username,
                role: this.permissions,
            });
        }
        let patch: VePromise<PermissionUpdateResponse>;
        if (this.org) {
            patch = this.permissionSvc.updateOrgPermissions(this.org.id, data);
        } else {
            patch = this.permissionSvc.updateProjectPermissions(this.project.id, data);
        }
        patch.then(
            () => {
                this.growl.success('User Permissions Successfully Updated!');
                void this.$state.go('.', null, { reload: true });
            },
            (reason) => {
                this.growl.error('Permissons not updated: ' + reason.message);
            }
        );
    };

    doSearch = (): void => {
        this.results = [];

        // Disable form submit
        if (typeof this.username !== 'string') {
            return;
        } else if (this.username.length < 2) {
            this.notFound = 'Username Search must have more than 2 characters';
            return;
        }

        this.userSvc.getUsers().then(
            (users) => {
                const searchData = users.filter((user) => {
                    return user.username.includes(this.username);
                });
                this.results = searchData;
                this.notFound =
                    this.results && this.results.length === 0 && this.username !== '' ? 'User not found.' : '';
            },
            (reason) => {
                this.growl.error('Problem with Users Search: ' + reason.message);
                this.notFound = 'Search Error';
            }
        );
    };

    resetForm = (): void => {
        this.username = '';
        this.permissions = Role.NONE;
        this.inherited = false;
        this.results = null;
    };

    userChange = (): void => {
        this.doSearch();
        if (this.username.length === 0) this.resetForm();
    };

    cancel = (): void => {
        this.resetForm();
        this.membersPage.selectedUser = null;
    };
}

const MemberEditComponent: VeComponentOptions = {
    selector: 'memberEdit',
    bindings: {
        project: '<?',
        org: '<?',
        group: '<?',
        selectedUser: '<',
        currentUser: '<',
        authority: '<',
    },
    require: {
        membersPage: '^',
    },
    controller: MemberEditController,
    template: `
      <div class="extra-padding">
        <h2>{{ $ctrl.header }}</h2>
        <hr/>
        <h3>{{ $ctrl.title }}</h3>
          <div class="form-group" style="margin: 0">
            <input type="search"
                   name="username"
                   id="username"
                   autoComplete="off"
                   placeholder='Search User...'
                   ng-model="$ctrl.username"
                   ng-class="{ 'is-invalid': $ctrl.notFound.length > 0 }"
                   ng-change="$ctrl.userChange()"/>
            <div class="members-dropdown" ng-show="$ctrl.results.length > 0">
                <div class="members-dropdown-item" key="user-{{ user.username }}"
                     ng-repeat="user in $ctrl.results track by user.username"
                     ng-click="$ctrl.selectUser(user.username)">
                  <span>{{user.firstName}} {{user.lastName}}</span>
                  <span class="member-username">@{{ user.username }}</span>
                </div>
            </div>
            <div ng-show="$ctrl.notFound.length > 0" class="invalid-feedback">
              {{ $ctrl.notFound }}
            </div>
          </div>
          <form style="padding-top: 10px">
            <div class="form-group">
              <label for="permissions">Permissions</label>
              <select
                     name="permissions"
                     id="permissions"
                     ng-value="$ctrl.permissions"
                     ng-model="$ctrl.permissions">
                <option ng-if="!$ctrl.inherited || $ctrl.inherited && $ctrl.roles.lt($ctrl.permissions,$ctrl.roles.READ)" value="{{ $ctrl.roles.READ }}">{{ $ctrl.roles.READ }}</option>
                <option ng-if="!$ctrl.inherited || $ctrl.inherited && $ctrl.roles.lt($ctrl.permissions,$ctrl.roles.WRITE)" value="{{ $ctrl.roles.WRITE }}">{{ $ctrl.roles.WRITE }}</option>
                <option ng-if="$ctrl.authority == $ctrl.roles.ADMIN" value="{{ $ctrl.roles.ADMIN }}">{{ $ctrl.roles.ADMIN }}</option>
                <option ng-if="!$ctrl.inherited" value="{{ $ctrl.roles.NONE }}">{{ $ctrl.roles.NONE }}</option>
              </select>
              <label ng-if="$ctrl.org" for="inherited">Inherited</label>
              <input ng-if="$ctrl.org" type="checkbox" 
                name="inherited"
                id="inherited"

              />
            </div>
          </form>
          <button class="btn btn-primary" ng-click="$ctrl.onSubmit()" ng-disabled="$ctrl.notFound.length > 0" >{{ $ctrl.btnTitle }}</button>
          <button class="btn btn-secondary" ng-click="$ctrl.cancel()" ng-disabled="!$ctrl.username" >Cancel</button>
      </div>`,
};

// Export component
veAdmin.component(MemberEditComponent.selector, MemberEditComponent);
