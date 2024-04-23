class SidebarHeaderController implements ng.IComponentController {
    private isExpanded: boolean;
    private title: string;

    static $inject = [];

    constructor() {
        //Do nothing for now
    }
}

const SidebarHeader: ng.IComponentOptions = {
    bindings: {
        title: '@',
        isExpanded: '<',
    },
    controller: SidebarHeaderController,
    template: `
        <div class="nested-sidebar-header">{{$ctrl.title}}</div>
    `,
};
