import { veAdmin } from '@ve-admin/ve-admin.module';

import { VeComponentOptions } from '@ve-types/angular';

interface IStatsListBindings {
    className?: string;
}

class StatsListController implements IStatsListBindings {
    className: string;
    width: number = null;
    ref: ng.IAugmentedJQuery;
    childWidths: { [key: string]: number } = {};

    constructor(private $element: JQuery<HTMLElement>) {}

    handleResize = (): void => {
        this.width = this.$element[0].clientWidth;
    };

    setChildWidth = (title: string, width: number): void => {
        this.childWidths[`stat-${title}`] = width;
    };

    $onInit(): void {
        this.ref = this.$element.find('div');
        window.addEventListener('resize', this.handleResize);
        this.handleResize();
    }

    $onDestroy(): void {
        window.removeEventListener('resize', this.handleResize);
    }
}

const StatsListComponent: VeComponentOptions = {
    bindings: {
        className: '<?',
    },
    controller: StatsListController,
    selector: 'statsList',
    template: `
    <div ng-class="$ctrl.className">
      <div ng-repeat="child in $ctrl.children"
           ng-if="$ctrl.width === null || $ctrl.childWidths['stat-' + child.title] + $ctrl.totalStatsWidth <= $ctrl.width"
           ng-init="child.setChildWidth(child.title, child.ref[0].clientWidth)"
           ng-init="$ctrl.totalStatsWidth = $ctrl.totalStatsWidth + $ctrl.childWidths['stat-' + child.title]">
        <ng-transclude></ng-transclude>
      </div>
    </div>
  `,
    transclude: true,
};

veAdmin.component('statsList', StatsListComponent);
