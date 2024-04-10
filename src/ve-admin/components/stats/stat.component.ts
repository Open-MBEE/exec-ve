import { veAdmin } from '@ve-admin/ve-admin.module';

import { VeComponentOptions } from '@ve-types/angular';

interface IStatBindings {
    title: string;
    label?: boolean;
    icon: string;
    value: number;
    className?: string;
    divider?: boolean;
    noToolTip?: boolean;
    setChildWidth: (title: string, width: number) => void;
}

class StatController implements IStatBindings {
    title: string;
    label?: boolean;
    icon: string;
    value: number;
    className?: string;
    divider?: boolean;
    noToolTip?: boolean;
    setChildWidth: (title: string, width: number) => void;
    ref: ng.IAugmentedJQuery;

    constructor(private $element: ng.IRootElementService) {}

    $onInit(): void {
        this.ref = this.$element.find('div');
        this.setChildWidth(this.title, this.ref[0].clientWidth);
    }
}

const StatComponent: VeComponentOptions = {
    bindings: {
        title: '<',
        label: '<?',
        icon: '<',
        value: '<',
        className: '<?',
        divider: '<?',
        noToolTip: '<?',
    },
    selector: 'stat',
    require: {
        parent: '^statsList',
    },
    transclude: true,
    template: `
      <div ng-class="{
        'stats-item': !$ctrl.label && !$ctrl.divider && !$ctrl.className,
        'stats-divider': $ctrl.divider,
        'bold-name': $ctrl.label,
        $ctrl.className: $ctrl.className
      }" ng-ref="$ctrl.ref" id="{{$ctrl._key || $ctrl.title}}">
        <i class="{{$ctrl.icon}}"></i>
        <p ng-if="!isNaN($ctrl.value)">{{$ctrl.value}}</p>
        <p ng-if="isNaN($ctrl.value)">?</p>
        <span ng-if="$ctrl.label">{{$ctrl.title}}</span>
        <div ng-if="!$ctrl.label && !$ctrl.divider && !$ctrl.noToolTip">
          <span uib-tooltip="{{$ctrl.title}}" tooltip-placement="top"
                tooltip-append-to-body="true" tooltip-animation="false">{{$ctrl.icon}}</span>
        </div>
        <ng-transclude></ng-transclude>
      </div>
    `,
};

veAdmin.component(StatComponent.selector, StatComponent);
