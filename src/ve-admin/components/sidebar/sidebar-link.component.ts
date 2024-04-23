import { RawParams, StateService } from '@uirouter/angularjs';

import { veAdmin } from '@ve-admin/ve-admin.module';
import { parseStateRef } from '@ve-utils/utils';

import { VeComponentOptions } from '@ve-types/angular';
import { ParamsObject } from '@ve-types/mms';

class SidebarLinkController implements angular.IComponentController {
    private state: string;
    private params: ParamsObject;
    private onClick: () => void;
    private routerLink: string;

    static $inject = ['$scope', '$state'];

    constructor(private $scope: angular.IScope, private $state: StateService) {}

    handleClick = (e: JQuery.ClickEvent): void => {
        if (this.routerLink) {
            const parsedState = parseStateRef(this.routerLink);
            void this.$state.go(parsedState.state, this.$scope.$eval(parsedState.paramExpr) as RawParams);
        } else if (this.onClick) {
            this.onClick();
            e.stopPropagation();
        } else {
            //Do Nothing
        }
    };
}

const SidebarLinkComponent: VeComponentOptions = {
    bindings: {
        id: '@',
        title: '@',
        icon: '@',
        tooltip: '@',
        routerLink: '@',
        href: '@',
        openNewTab: '@',
        onClick: '&',
        isExpanded: '<',
    },
    selector: 'sidebarLink',
    controller: SidebarLinkController,
    template: `
      <div class="sidebar-item" id="{{$ctrl.id}}" ng-click="$ctrl.handleClick($event)">
        <span uib-tooltip="{{$ctrl.title || $ctrl.tooltip}}" tooltip-placement="left"
            tooltip-append-to-body="true" tooltip-animation="false" boundaries-element="viewport">
            <i class="{{$ctrl.icon}}"></i>
        </span>
        <p ng-show="$ctrl.isExpanded">{{$ctrl.title}}</p>
      </div>
    `,
};

veAdmin.component(SidebarLinkComponent.selector, SidebarLinkComponent);
