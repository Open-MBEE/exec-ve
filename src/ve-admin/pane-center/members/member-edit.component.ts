import { IOnChangesObject } from 'angular';

import { veAdmin } from '@ve-admin/ve-admin.module';
import { PermissionService, UserService } from '@ve-utils/mms-api-client';

import { VeComponentOptions, VePromise } from '@ve-types/angular';
import { OrgObject, PermissionUpdateRequest, PermissionUpdateResponse, ProjectObject, UserObject } from '@ve-types/mms';
import Role, { VeRole } from '@ve-types/mms/permissions';

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
    selectedUser: string;
    admin: boolean;

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

    static $inject = ['growl', 'UserService', 'PermissionService'];

    constructor(
        private growl: angular.growl.IGrowlService,
        private userSvc: UserService,
        private permissionSvc: PermissionService
    ) {}

    $onInit(): void {
        this.title = this.org ? this.org.name : this.project.name;

        // Check if user is a member of the Org or Project
        this.selectUser(this.selectedUser);
    }

    $onChanges(onChangesObj: IOnChangesObject): void {
        if (
            onChangesObj.selectedUser &&
            onChangesObj.selectedUser.currentValue != onChangesObj.selectedUser.previousValue
        ) {
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
            this.inherited = this.org.permission.users[name].inherited;
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
        this.results = null;
    };

    userChange = (): void => {
        this.doSearch();
        if (this.username.length === 0) this.resetForm();
    };
}

const MemberEditComponent: VeComponentOptions = {
    selector: 'memberEdit',
    bindings: {
        project: '<?',
        org: '<?',
        selectedUser: '=',
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
                     data-ng-value="$ctrl.permissions"
                     data-ng-model="$ctrl.permissions">
                <option>Choose one...</option>
                <option>{{ $ctrl.roles.READ }}</option>
                <option>{{ $ctrl.roles.WRITE }}</option>
                <option ng-if="$ctrl.admin">{{ $ctrl.roles.ADMIN }}</option>
                <option>{{ $ctrl.roles.NONE }}</option>
              </select>
              <label for="inherited">Inherited</label>
              <input type="checkbox" 
                name="inherited"
                id="inherited"

              />
            </div>
          </form>
          <button class="btn btn-primary" ng-click="$ctrl.onSubmit" ng-disabled="$ctrl.notFound.length > 0" >{{ $ctrl.btnTitle }}</button>
      </div>`,
};

// Export component
veAdmin.component(MemberEditComponent.selector, MemberEditComponent);
