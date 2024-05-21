import { IPane, IRegion } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin';

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

    $pane: IPane;
    resizer: Rx.Disposable;

    users: number;
    groups: number;

    static $inject = ['$element'];

    constructor(private $element: ng.IRootElementService) {}

    $onInit(): void {
        this.users = Object.keys(this.org.permission.users).length;
        this.groups = Object.keys(this.org.permission.groups).length;
        this.resizer = (this.$pane.$resized as Rx.Subject<IRegion>).subscribe(() => this.handleResize());
        this.handleResize();
    }

    $onDestroy(): void {
        this.resizer.dispose();
    }

    handleResize = (): void => {
        if (this.$pane.$region) {
            this.width = this.$pane.$region.width;
        }
    };
}

const OrgListItemComponent: VeComponentOptions = {
    bindings: {
        org: '<',
        className: '<?',
        link: '<',
        divider: '<',
    },
    selector: 'orgListItem',
    require: {
        $pane: '^ngPane',
    },
    controller: OrgListItemController,
    template: `
    <div class="stats-list-item {{$ctrl.className}}">
      <div class="list-header">
        <a ng-class="$ctrl.org.archived ? 'archived-link' : ''" ui-sref="main.admin.org.home({ orgId: $ctrl.org.id })">{{$ctrl.org.name}}</a>
      </div>
      <stat-list ng-if="$ctrl.width > 600">
        <stat stat-title="Projects"
            stat-icon="fa-solid fa-boxes-stacked"
            stat-value="$ctrl.org.projects.length">
        </stat>
        <stat stat-title="Users"
            stat-icon="fa-solid fa-users"
            stat-value="$ctrl.users"
            _key="org-{{$ctrl.org.id}}-users">
        </stat>
        <stat stat-title="Groups"
            stat-icon="fa-solid fa-users-rectangle"
            stat-value="$ctrl.groups"
            _key="org-{{$ctrl.org.id}}-groups">
        </stat>
        <stat ng-if="$ctrl.divider"
            divider="true"
            _key="org-{{$ctrl.org.id}}-divider">
        </stat>
      </stat-list>
    </div>
  `,
};

veAdmin.component(OrgListItemComponent.selector, OrgListItemComponent);
