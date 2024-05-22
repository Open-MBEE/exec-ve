import { IPane, IRegion } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin';

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
    archiveProj: boolean;

    $pane: IPane;
    resizer: Rx.Disposable;

    colorClass: string;

    users: number;
    groups: number;

    static $inject = ['$element'];

    constructor(private $element: ng.IRootElementService) {}

    $onInit(): void {
        this.resizer = (this.$pane.$resized as Rx.Subject<IRegion>).subscribe(() => this.handleResize());
        this.handleResize();
        this.users = Object.keys(this.project.permission.users).length;
        this.groups = Object.keys(this.project.permission.groups).length;
        this.colorClass = this.archiveProj || this.project.archived ? 'archived-link' : '';
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
        className: '@?',
        link: '@',
        divider: '<',
        archiveProj: '<',
    },
    selector: 'projectListItem',
    require: {
        $pane: '^ngPane',
    },
    controller: ProjectListItemController,
    template: `
    <div class="stats-list-item {{$ctrl.className}}" ng-ref="$ctrl.ref">
    <div class="list-header">
        <a class="{{ $ctrl.colorClass }}" ui-sref="{{ $ctrl.link }}">{{$ctrl.project.name}}</a>
    </div>
    <stat-list ng-if="$ctrl.width > 600">
        <stat stat-title="Users"
            class-name="{{ $ctrl.colorClass }}"
            stat-icon="fa-solid fa-users"
            stat-value="$ctrl.users"
            _key="org-{{$ctrl.project.id}}-users">
        </stat>
        <stat stat-title="Groups"
            stat-icon="fa-solid fa-users-rectangle"
            stat-value="$ctrl.groups"
            _key="org-{{$ctrl.project.id}}-groups">
        </stat>
        <stat ng-if="$ctrl.divider"
            divider="true" 
            _key="org-{{$ctrl.project.id}}-divider">
        </stat>
    </stat-list>
</div>
  `,
};

veAdmin.component(ProjectListItemComponent.selector, ProjectListItemComponent);
