import { IPane, IRegion } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin/ve-admin.module';
import { RootScopeService } from '@ve-utils/application';
import { UserService } from '@ve-utils/mms-api-client';

import { VeComponentOptions } from '@ve-types/angular';
import { UserObject } from '@ve-types/mms';

class UserProfileController implements angular.IComponentController {
    currentUser: UserObject;
    mmsUser: UserObject;

    name: string;
    user: UserObject;
    width: number;
    spin: boolean;

    //Ng-Pane
    $pane: IPane;
    $resized: Rx.Disposable;

    static $inject = ['UserService'];

    constructor(
        private growl: angular.growl.IGrowlService,
        private userSvc: UserService,
        private rootScopeSvc: RootScopeService
    ) {}

    $onInit(): void {
        this.user = this.mmsUser;
        if (!this.user) {
            this.handleRefresh();
        } else {
            if (this.user.fullName != 'null null') {
                this.name = this.user.fullName ? this.user.fullName : `${this.user.firstName} ${this.user.lastName}`;
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

    handleRefresh(): void {
        this.spin = true;
        this.userSvc
            .getUserData(this.user.username, true)
            .then(
                (user) => {
                    this.user = user;
                    if (this.user.fullName != 'null null') {
                        this.name = this.user.fullName
                            ? this.user.fullName
                            : `${this.user.firstName} ${this.user.lastName}`;
                    }
                    this.growl.success('User Updated!');
                },
                (reason) => {
                    this.growl.error('Error retrieving user: ' + reason.message);
                }
            )
            .finally(() => {
                this.spin = false;
            });
    }
}

const UserProfileComponent: VeComponentOptions = {
    selector: 'userProfile',
    controller: UserProfileController,
    bindings: {
        currentUser: '<',
        mmsUser: '<',
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
                <tbody>
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
                    <!--<tr>
                        <th>Groups:</th>
                        <td ng-repeat="group in $ctrl.groups">
                            {{group.name}}
                        </td>
                    </tr>-->
                </tbody>
            </table>
        </div>
    </div>
</div>
`,
};

veAdmin.component(UserProfileComponent.selector, UserProfileComponent);
