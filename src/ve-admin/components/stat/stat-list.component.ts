import { IPane, IRegion } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin/ve-admin.module';

import { IStatBindings } from './stat.component';

import { VeComponentOptions } from '@ve-types/angular';

export class StatListController implements angular.IComponentController {
    width: number | null;
    childWidths: { [key: string]: number } = {};
    stats: IStatBindings[];
    className: string;

    $pane: IPane;
    resizer: Rx.Disposable;

    static $inject = ['$element'];

    constructor(private $element: JQuery<HTMLElement>) {}

    handleResize = (): void => {
        if (this.$pane.$region) {
            this.width = this.$pane.$region.width;
            this.$element.width(this.getTotalStatsWidth());
        }
    };

    $onInit(): void {
        this.className = this.className ? this.className : 'stats-list';
        this.resizer = (this.$pane.$resized as Rx.Subject<IRegion>).subscribe(() => this.handleResize());
        this.handleResize();
    }

    $onDestroy(): void {
        this.resizer.dispose();
    }

    setChildWidth = (title: string, width: number): void => {
        this.childWidths[`stat-${title}`] = width;
        this.handleResize();
    };

    getTotalStatsWidth = (): number => {
        let totalWidth = 0;
        Object.keys(this.childWidths).forEach((key) => {
            totalWidth += this.childWidths[key];
        });
        return totalWidth;
    };
}

const StatList: VeComponentOptions = {
    bindings: {
        className: '@',
        stats: '<',
    },
    require: {
        $pane: '^ngPane',
    },
    selector: 'statList',
    controller: StatListController,
    template: `
      <div class="{{$ctrl.className}}">
        <stat ng-repeat="stat in $ctrl.stats" 
            stat-title="stat.title" 
            stat-label="stat.label"
            stat-icon="stat.icon" 
            stat-value="stat.value" 
            class-name="stat.className" 
            divider="stat.divider"
            no-tooltip="stat.noTooltip"
            ng-if="$ctrl.width && $ctrl.getTotalStatsWidth() <= $ctrl.width">
        </stat>
      </div>
    `,
};

veAdmin.component(StatList.selector, StatList);
