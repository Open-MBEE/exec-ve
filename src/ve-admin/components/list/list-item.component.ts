import { RawParams, StateService } from '@uirouter/angularjs';

import { veAdmin } from '@ve-admin/ve-admin.module';
import { parseStateRef } from '@ve-utils/utils';

import { VeComponentOptions } from '@ve-types/angular';

class ListItemController implements angular.IComponentController {
    private className: string;
    private onClick: () => void;
    private link: string;

    appliedClasses: string;

    static $inject = ['$scope', '$state'];

    constructor(private $scope: angular.IScope, private $state: StateService) {}

    $onInit(): void {
        this.appliedClasses = `list ${this.className ? this.className : ''}`;
    }

    handleClick = (e: JQuery.ClickEvent): void => {
        if (this.link) {
            e.stopPropagation();
            const parsedState = parseStateRef(this.link);
            void this.$state.go(parsedState.state, this.$scope.$eval(parsedState.paramExpr) as RawParams);
        } else if (this.onClick) {
            e.stopPropagation();
            this.onClick();
        }
    };
}

const ListItemComponent: VeComponentOptions = {
    selector: 'listItem',
    transclude: true,
    controller: ListItemController,
    template: `
    <div ng-transclude class="{{$ctrl.appliedClasses}}" ng-click="$ctrl.handleClick($event)"></div>
    `,
    bindings: {
        key: '@',
        className: '@',
        onClick: '&',
        link: '@',
    },
};

veAdmin.component(ListItemComponent.selector, ListItemComponent);
