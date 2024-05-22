import { IPane, IRegion } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin/ve-admin.module';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject } from '@ve-types/mms';

class OrganizationListController implements angular.IComponentController {
    //Bindings
    orgs: OrgObject[];

    //Pane
    $pane: IPane;
    resizer: Rx.Disposable;

    width: number;

    $onInit(): void {
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

    handleDeleteToggle(): void {
        //TBD
    }

    handleCreateToggle(): void {
        //TBD
    }
}

const OrganizationListComponent: VeComponentOptions = {
    selector: 'organizationList',
    bindings: {
        orgs: '<mmsOrgs',
    },
    require: {
        $pane: '^ngPane',
    },
    template: `
    <div id='workspace' ref={ref}>
    <div className='workspace-header header-box-depth'>
        <h2 className='workspace-title workspace-title-padding'>
            Organizations
        </h2>
        <div className='workspace-header-button'>
            <button class="btn-outline-primary"
                    ng-click="$ctrl.handleCreateToggle()">
                <i class="fas fa-plus add-btn"></i>
                <span ng-if="$ctrl.width > 600">Create</span>
            </button>
            <button class="btn-outline-danger"
                      ng-click="$ctrl.handleDeleteToggle()">
                <i class="fas fa-trash-alt delete-btn"></i>
                <span ng-if="$ctrl.width > 600">Delete</span>
            </button>
        </div>
    </div>
    <div id='workspace-body' class='extra-padding'>
        <div ng-if="$ctrl.orgs.length === 0" class='main-workspace list-item'>
            <h3> No organizations. </h3>
        </div>
        <list class-name='main-workspace' ng-if="$ctrl.orgs.length > 0">
            <org-list-item ng-repeat="org in $ctrl.orgs" class-name='hover-darken' key="org-key-{{org.id}}" org="org" link="main.admin.org({ orgId: '{{ org.id }}' })"/>
        </list>
    </div>
</div>
`,
};

veAdmin.component(OrganizationListComponent.selector, OrganizationListComponent);
