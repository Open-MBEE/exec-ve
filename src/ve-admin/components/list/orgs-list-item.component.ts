import { veAdmin } from '@ve-admin/ve-admin.module';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject } from '@ve-types/mms';

interface IOrgListItemBindings {
    org: OrgObject;
    className?: string;
    link: string;
    divider: boolean;
}

class OrgListItemController implements IOrgListItemBindings {
    org: OrgObject;
    className: string;
    link: string;
    divider: boolean;
    width: number = 0;
    ref: ng.IAugmentedJQuery;

    constructor(private $element: ng.IRootElementService) {}

    handleResize = (): void => {
        this.width = this.$element[0].clientWidth;
    };

    $onInit(): void {
        window.addEventListener('resize', this.handleResize);
        this.handleResize();
    }

    $onDestroy(): void {
        window.removeEventListener('resize', this.handleResize);
    }
}

const OrgListItemComponent: VeComponentOptions = {
    bindings: {
        org: '<',
        className: '<?',
        link: '<',
        divider: '<',
    },
    selector: 'orgListItem',
    controller: OrgListItemController,
    template: `
    <div class="stats-list-item {{$ctrl.className}}" ng-ref="$ctrl.ref">
      <div class="list-header">
        <a ng-class="$ctrl.org.archived ? 'archived-link' : ''" ng-href="{{$ctrl.link}}">{{$ctrl.org.name}}</a>
      </div>
      <stats-list ng-if="$ctrl.width > 600">
        <stat title="Projects"
              icon="fas fa-boxes"
              value="{{$ctrl.org.projects.length}}"
              class-name="{{$ctrl.org.archived ? 'archived-link' : ''}}"></stat>
        <stat title="Users"
              icon="fas fa-users"
              value="{{Object.keys($ctrl.org.permissions).length}}"
              class-name="{{$ctrl.org.archived ? 'archived-link' : ''}}"></stat>
        <stat ng-if="$ctrl.divider" divider="true"></stat>
      </stats-list>
    </div>
  `,
};

veAdmin.component(OrgListItemComponent.selector, OrgListItemComponent);
