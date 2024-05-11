import { IPane, IRegion } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin/ve-admin.module';

import { VeComponentOptions } from '@ve-types/angular';

export class StatListController implements angular.IComponentController {
    width: number | null;
    childWidths: { [key: string]: number } = {};
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
    },
    require: {
        $pane: '^ngPane',
    },
    selector: 'statList',
    controller: StatListController,
    transclude: true,
    template: `
    <div ng-transclude class="{{$ctrl.className}}">
</div>
    `,
};

veAdmin.component(StatList.selector, StatList);
