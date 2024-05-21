import { veApp } from '@ve-app/ve-app.module';
import { RootScopeService } from '@ve-utils/application';

import { VeComponentOptions } from '@ve-types/angular';

class OrgHomeController implements angular.IComponentController {
    viewContentLoading: boolean;

    static $inject = ['RootScopeService'];

    constructor(private rootScopeSvc: RootScopeService) {
        //This
    }

    $onInit(): void {
        this.rootScopeSvc.rightPaneClosed(true);
        this.viewContentLoading = this.rootScopeSvc.veViewContentLoading(false);
    }
}

const OrgHomeComponent: VeComponentOptions = {
    selector: 'orgHome',
    transclude: true,
    controller: OrgHomeController,
    template: `
    <i class="pane-center-spinner fa fa-5x fa-spinner fa-spin" ng-show="$ctrl.viewContentLoading"></i>
    <div ng-hide="$ctrl.viewContentLoading" class="container-fluid">
        <div class="pane-center-inner">
        </div>
    </div>
    `,
};

veApp.component(OrgHomeComponent.selector, OrgHomeComponent);
