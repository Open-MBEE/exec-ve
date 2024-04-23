import { IPane, IRegion } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin/ve-admin.module';

import { IStatBindings } from '../stat/stat.component';

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

    stats: IStatBindings[];

    static $inject = ['$element'];

    constructor(private $element: ng.IRootElementService) {}

    $onInit(): void {
        this.resizer = (this.$pane.$resized as Rx.Subject<IRegion>).subscribe(() => this.handleResize());
        this.handleResize();
        this.stats = [
            {
                title: 'Projects',
                icon: 'fa-solid fa-boxes-stacked',
                value: this.org.projects.length,
            },
            {
                title: 'Users',
                icon: 'fa-solid fa-users',
                value: Object.keys(this.org.permission.users).length,
            },
            {
                title: 'Groups',
                icon: 'fa-solid fa-users-rectangle',
                value: Object.keys(this.org.permission.groups).length,
            },
        ];

        if (this.divider) {
            this.stats.push({ divider: true });
        }
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
    <div class="stats-list-item {{$ctrl.className}}" ng-ref="$ctrl.ref">
      <div class="list-header">
        <a ng-class="$ctrl.org.archived ? 'archived-link' : ''" ng-href="/admin/orgs/{{$ctrl.org.id}}">{{$ctrl.org.name}}</a>
      </div>
      <stat-list ng-if="$ctrl.width > 600" stats="$ctrl.stats"></stat-list>
    </div>
  `,
};

veAdmin.component(OrgListItemComponent.selector, OrgListItemComponent);
