import { veAdmin } from '@ve-admin';

import { StatListController } from './stat-list.component';

import { VeComponentOptions } from '@ve-types/angular';

// export interface IStatBindings {
//     title?: string;
//     label?: boolean;
//     icon?: string;
//     value?: number;
//     className?: string;
//     divider?: boolean;
//     noTooltip?: boolean;
//     setChildWidth?: (title: string, width: number) => void;
//     key?: string;
//     _key?: string;
// }

// interface IStatScope extends angular.IScope, IStatBindings {}

class StatController implements angular.IComponentController {
    title: string;
    _key?: string;
    label?: boolean = false;
    icon: string;
    value: number;
    className?: string;
    divider?: boolean = false;
    noTooltip?: boolean = false;
    tooltip: string;

    ref: JQuery<HTMLElement>;

    statList: StatListController;
    observer: MutationObserver;

    widthSet: boolean = false;

    static $inject = ['$element'];

    constructor(private $element: JQuery<HTMLElement>) {}

    $onInit(): void {
        this.ref = this.$element.find('div');
        if (!this.noTooltip && !this.tooltip) {
            this.tooltip = this.title;
        }
        this.observer = new MutationObserver(() => {
            this.handleResize();
        });
        this.observer.observe(this.ref[0], { attributes: true });
    }

    handleResize(): void {
        this.statList.setChildWidth(this.title, this.ref[0].clientWidth);
    }

    // $doCheck(): void {
    //     if (!this.widthSet && this.ref && this.ref[0].clientWidth != 0 && this.statList) {
    //         this.statList.setChildWidth(this.title, this.ref[0].clientWidth);
    //         this.widthSet = true;
    //     }
    // }
}

const StatComponent: VeComponentOptions = {
    bindings: {
        title: '@statTitle',
        label: '<?statLabel',
        icon: '@statIcon',
        value: '<statValue',
        className: '<?',
        divider: '<?',
        tooltip: '@?',
        noTooltip: '<?',
    },
    controller: StatController,
    require: {
        statList: '^',
    },
    selector: 'stat',
    template: `
      <div ng-class="{
        'stats-item': true,
        'stats-divider': $ctrl.divider,
        'bold-name': $ctrl.label,
      }" id="{{$ctrl._key || $ctrl.title}}" class="{{$ctrl.className}}">
        <div ng-show="!$ctrl.label && !$ctrl.divider && !$ctrl.noTooltip">
          <span uib-tooltip="{{$ctrl.tooltip}}" tooltip-placement="top"
                tooltip-append-to-body="true" tooltip-animation="false">
                <i class="{{$ctrl.icon}}"></i>
          </span>
        </div>
        <div ng-show="!$ctrl.label && !$ctrl.divider && $ctrl.noTooltip">
            <i class="{{$ctrl.icon}}"></i>
        </div>
        <p ng-if="!isNaN($ctrl.value)">{{$ctrl.value}}</p>
        <p ng-if="isNaN($ctrl.value)">?</p>
        <span ng-if="$ctrl.label">{{$ctrl.title}}</span>
        
      </div>
    `,
};

veAdmin.component(StatComponent.selector, StatComponent);
