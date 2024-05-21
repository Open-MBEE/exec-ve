import { veApp } from '@ve-app/ve-app.module';

import { VeComponentOptions } from '@ve-types/angular';

class OrgTreeController implements angular.IComponentController {
    constructor() {
        //Test
    }

    $onInit(): void {}
}

const OrgTreeComponent: VeComponentOptions = {
    selector: 'orgTree',
    transclude: true,
    controller: OrgTreeController,
    template: `
    <div class="pane-left">
    <div class="list-header">
        <h4 class="tree-view-title"><i class="fa-regular fa-clock"></i> Recents</h4>
    </div>
    <h4 class="hover-darken tree-view-title"><i class="fa-regular fa-star"></i> Favorites</h4>
    <h4 class="hover-darken tree-view-title"><i class="fa-regular fa-user"></i> My Documents</h4>

    <div>

    </div>
</div>`,
};

veApp.component(OrgTreeComponent.selector, OrgTreeComponent);
