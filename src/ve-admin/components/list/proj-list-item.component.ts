import { IPane, IRegion } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin/ve-admin.module';

import { IStatBindings } from '../stat/stat.component';

import { VeComponentOptions } from '@ve-types/angular';
import { ProjectObject } from '@ve-types/mms';

interface IProjectListItemBindings {
    project: ProjectObject;
    className?: string;
    link: string;
    divider: boolean;
}

class ProjectListItemController implements IProjectListItemBindings {
    project: ProjectObject;
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
                title: 'Users',
                icon: 'fa-solid fa-users',
                value: Object.keys(this.project.permission.users).length,
            },
            {
                title: 'Groups',
                icon: 'fa-solid fa-users-rectangle',
                value: Object.keys(this.project.permission.groups).length,
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

const ProjectListItemComponent: VeComponentOptions = {
    bindings: {
        project: '<',
        className: '<?',
        link: '<',
        divider: '<',
    },
    selector: 'projListItem',
    require: {
        $pane: '^ngPane',
    },
    controller: ProjectListItemController,
    template: `
    <div class="stats-list-item {{$ctrl.className}}" ng-ref="$ctrl.ref">
      <div class="list-header">
        <a ng-class="$ctrl.project.archived ? 'archived-link' : ''" ui-sref="main.admin.project({ projectId: $ctrl.project.id })">{{$ctrl.project.name}}</a>
      </div>
      <stat-list ng-if="$ctrl.width > 600">
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
      </stat-list>
    </div>
  `,
};

veAdmin.component(ProjectListItemComponent.selector, ProjectListItemComponent);
