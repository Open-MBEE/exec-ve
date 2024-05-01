import { veAdmin } from '@ve-admin';

import { StatListController } from './stat-list.component';

import { VeComponentOptions } from '@ve-types/angular';

export interface IStatBindings {
    title?: string;
    label?: boolean;
    icon?: string;
    value?: number;
    className?: string;
    divider?: boolean;
    noTooltip?: boolean;
    setChildWidth?: (title: string, width: number) => void;
    key?: string;
    _key?: string;
}

interface IStatScope extends angular.IScope, IStatBindings {}

class StatController implements angular.IComponentController, IStatBindings {
    title: string;
    _key?: string;
    label?: boolean;
    icon: string;
    value: number;
    className?: string;
    divider?: boolean;
    noTooltip?: boolean;
    setChildWidth: (title: string, width: number) => void;

    ref: JQuery<HTMLElement>;

    statList: StatListController;

    widthSet: boolean = false;

    static $inject = ['$element'];

    constructor(private $element: JQuery<HTMLElement>) {}

    $onInit(): void {
        //this.ref = this.$element.find('div');
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
        title: '<statTitle',
        label: '<?statLabel',
        icon: '<statIcon',
        value: '<statValue',
        className: '<?',
        divider: '<?',
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
        '{{$ctrl.className}}': $ctrl.className
      }" id="{{$ctrl._key || $ctrl.title}}" ng-ref="$ctrl.ref">
        <div ng-show="!$ctrl.label && !$ctrl.divider && !$ctrl.noTooltip">
          <span uib-tooltip="{{$ctrl.title}}" tooltip-placement="top"
                tooltip-append-to-body="true" tooltip-animation="false">
                <i class="fa-solid {{$ctrl.icon}}"></i>
          </span>
        </div>
        <div ng-hide="!$ctrl.label && !$ctrl.divider && !$ctrl.noTooltip">
          <i class="fa-solid {{$ctrl.icon}}"></i>
        </div>
        <p ng-if="!isNaN($ctrl.value)">{{$ctrl.value}}</p>
        <p ng-if="isNaN($ctrl.value)">?</p>
        <span ng-if="$ctrl.label">{{$ctrl.title}}</span>
        
      </div>
    `,
};

veAdmin.component(StatComponent.selector, StatComponent);
