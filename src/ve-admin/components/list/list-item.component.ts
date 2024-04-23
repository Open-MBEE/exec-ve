import { StateService } from '@uirouter/angularjs';

import { VeComponentOptions } from '@ve-types/angular';

class ListItemController implements angular.IComponentController {
    private className: string;
    private onClick: () => void;
    private link: string;

    appliedClasses: string;

    innerScope: angular.IScope & { $ctrl?: ListItemController; $transclude?: JQLite };

    static $inject = ['$scope', '$transclude', '$state'];

    constructor(
        private $scope: angular.IScope,
        private $transclude: angular.ITranscludeFunction,
        private $state: StateService
    ) {}

    $onInit(): void {
        this.appliedClasses = `list ${this.className ? this.className : ''}`;
        let clone = this.$transclude();
        if (this.link) {
            const link = $(`<span ui-sref="${this.link}" ng-click="$ctrl.onClick()"></span>`);
            link.append(clone);
            clone = link;
        }
        this.innerScope = this.$scope.$new();
        this.innerScope.$ctrl = this;
        this.innerScope.$transclude = clone;
    }
}

const ListItemComponent: VeComponentOptions = {
    selector: 'listItem',
    transclude: true,
    template: `
    <div class="{{$ctrl.appliedClasses}}">
    <ng-transclude></ng-transclude>
</div>
    `,
    bindings: {
        key: '<',
        className: '<',
        onClick: '&',
        link: '<',
    },
};
