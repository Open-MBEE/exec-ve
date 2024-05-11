import { veAdmin } from '@ve-admin/ve-admin.module';

import { VeComponentOptions } from '@ve-types/angular';

class SidebarHeaderController implements ng.IComponentController {
    private isExpanded: boolean;
    private title: string;

    static $inject = [];

    constructor() {
        //Do nothing for now
    }
}

const SidebarHeader: VeComponentOptions = {
    bindings: {
        title: '@',
        isExpanded: '<',
    },
    selector: 'sidebarHeader',
    controller: SidebarHeaderController,
    template: `
        <div class="nested-sidebar-header">{{$ctrl.title}}</div>
    `,
};

veAdmin.component(SidebarHeader.selector, SidebarHeader);
