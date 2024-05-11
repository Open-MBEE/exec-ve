import { veAdmin } from '@ve-admin/ve-admin.module';

import { VeComponentOptions } from '@ve-types/angular';

export interface ListApi {
    onExpandChange: (id: string, value: boolean) => void;
    onRefresh: () => void;
}

export class ListComponentController implements angular.IComponentController {
    private className: string;

    appliedClasses: string;

    $onInit(): void {
        this.appliedClasses = `list ${this.className ? this.className : ''}`;
    }
}

const ListComponent: VeComponentOptions = {
    selector: 'list',
    bindings: {
        className: '<',
    },
    transclude: true,
    template: `
    <div ng-transclude class="{{$ctrl.appliedClasses}}">
</div>
    `,
    controller: ListComponentController,
};

veAdmin.component(ListComponent.selector, ListComponent);
