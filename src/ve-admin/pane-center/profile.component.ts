import { IPane, IRegion } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin';
import { RootScopeService } from '@ve-utils/application';
import { GroupService, UserService } from '@ve-utils/mms-api-client';

import { VeComponentOptions, VeQService } from '@ve-types/angular';
import { GroupObject, UserObject } from '@ve-types/mms';

class ProfileController implements angular.IComponentController {
    currentUser: UserObject;
    mmsUser: UserObject;
    mmsGroup: GroupObject;
    mmsGroups: GroupObject[];
    mmsUsers: UserObject[];

    name: string;
    user: UserObject;
    group: GroupObject;
    width: number;
    spin: boolean;
    groups: GroupObject[] = [];
    users: UserObject[] = [];

    //Ng-Pane
    $pane: IPane;
    $resized: Rx.Disposable;

    static $inject = ['$q', 'growl', 'UserService', 'RootScopeService'];

    constructor(
        private $q: VeQService,
        private growl: angular.growl.IGrowlService,
        private userSvc: UserService,
        private groupSvc: GroupService,
        private rootScopeSvc: RootScopeService
    ) {}

    $onInit(): void {
        if (this.mmsUser) {
            this.user = this.mmsUser;
            if (this.mmsGroups) {
                this.groups = this.mmsGroups;
            }
            if (!this.user) {
                this.handleUserRefresh();
            } else {
                if (this.user.fullName != 'null null') {
                    this.name = this.user.fullName
                        ? this.user.fullName
                        : `${this.user.firstName} ${this.user.lastName}`;
                }
            }
        } else if (this.mmsGroup) {
            this.group = this.mmsGroup;
            if (this.mmsUsers) {
                this.users = this.mmsUsers;
            }
            if (!this.group) {
                this.handleGroupRefresh();
            } else {
                this.name = this.group.name;
            }
        }

        this.rootScopeSvc.rightPaneClosed(true);
        this.rootScopeSvc.leftPaneClosed(true);
        this.$resized = (this.$pane.$resized as Rx.Subject<IRegion>).subscribe(() => this.handleResize());

        this.handleResize();
    }

    handleResize = (): void => {
        if (this.$pane.$region) {
            this.width = this.$pane.$region.width;
        }
        //this.$scope.$apply();
    };

    handleUserRefresh(): void {
        this.spin = true;
        new this.$q((resolve, reject) => {
            this.userSvc.getUser(this.user.username, true).then(
                (user) => {
                    this.user = user;
                    if (this.user.fullName != 'null null') {
                        this.name = this.user.fullName
                            ? this.user.fullName
                            : `${this.user.firstName} ${this.user.lastName}`;
                    }

                    this.userSvc.getUserGroups(this.user.username).then(
                        (response) => {
                            this.groupSvc.getGroups(response).then(
                                (groups) => {
                                    this.groups = groups;
                                },
                                (reason) => {
                                    this.growl.error('Error retrieving groups: ' + reason.message);
                                    reject();
                                }
                            );
                            this.growl.success('User Updated!');
                            resolve();
                        },
                        (reason) => {
                            this.growl.error('Error retrieving user groups: ' + reason.message);
                            reject();
                        }
                    );
                },
                (reason) => {
                    this.growl.error('Error retrieving user: ' + reason.message);
                    reject();
                }
            );
        }).finally(() => {
            this.spin = false;
        });
    }

    handleGroupRefresh(): void {}
}

const ProfileComponent: VeComponentOptions = {
    selector: 'profile',
    controller: ProfileController,
    bindings: {
        currentUser: '<',
        mmsUser: '<?',
        mmsGroup: '<?',
        mmsGroups: '<?',
        mmsUsers: '<?',
    },
    require: {
        $pane: '^ngPane',
    },
    template: `
    <div id='workspace'>
    <div class='workspace-header header-box-depth'>
        <h2 class='workspace-title{{ $ctrl.name ? '' : 'grayed-out'}}'>
            {{ $ctrl.name ? $ctrl.name : '(none)' }}
        </h2>
        <div class='workspace-header-button'>
            <button class='btn btn-outline-secondary'
                        ng-click="$ctrl.handleToggle"
                        ng-if="$ctrl.currentUser.admin">
                <i class="fa-solid fa-user-edit"></i>
                <span ng-if="$ctrl.width > 600"> Edit</span>
            </button>
            <button class='btn btn-outline-secondary'
                        ng-click="$ctrl.handleRefresh()">
                    <i ng-if="$ctrl.spin" class="fa fa-spin fa-refresh"></i>
                    <i ng-if="!$ctrl.spin" class="fa fa-refresh"></i>
                    <span ng-if="$ctrl.width > 600"> Refresh</span>
            </button>
        </div>
    </div>
    <div id='workspace-body'>
        <div class='main-workspace extra-padding'>
            <table class='table-width'>
                <tbody ng-if="$ctrl.user">
                    <tr>
                        <th>Username:</th>
                        <td>{{$ctrl.user.username}}</td>
                    </tr>
                    <tr>
                        <th>Email:</th>
                        <td>{{$ctrl.user.email}}</td>
                    </tr>
                    <tr>
                        <th>Source:</th>
                        <td>{{$ctrl.user.type}}</td>
                    </tr>
                    <tr>
                        <th>Groups:</th>
                        <td>
                            <ul>
                                <li ng-repeat="group in $ctrl.groups"><a ui-sref="main.admin.group({ groupname: group.name })">{{ group.name }}</a></li>
                            </ul>
                        </td>
                    </tr>
                </tbody>
                <tbody ng-if="$ctrl.group">
                    <tr>
                        <th>Group Name:</th>
                        <td>{{$ctrl.group.name}}</td>
                    </tr>
                    <tr>
                        <th>Source:</th>
                        <td>{{$ctrl.group.type}}</td>
                    </tr>
                    <tr>
                        <th>Users:</th>
                        <td>
                            <ul>
                                <li ng-repeat="user in $ctrl.users"><a ui-sref="main.admin.user.profile({ username: user.username })">{{ user.fullName != '(none)' ? user.fullName : user.username }}</a></li>
                            </ul>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
`,
};

veAdmin.component(ProfileComponent.selector, ProfileComponent);
