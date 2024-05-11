import { IPane, IRegion } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin/ve-admin.module';

import { VeComponentOptions } from '@ve-types/angular';

class SidebarController implements angular.IComponentController {
    title: string;
    isExpanded = false;
    forceClosed = false;
    windowWidth = 0;

    $pane: IPane;
    resizer: Rx.Disposable;

    static $inject = ['$transclude', '$compile', '$scope', '$element'];

    constructor(
        private $transclude: angular.ITranscludeFunction,
        private $compile: angular.ICompileService,
        private $scope: angular.IScope,
        private $element: JQuery<HTMLElement>
    ) {
        //Do nothing for now
    }

    $onInit(): void {
        this.resizer = (this.$pane.$resized as Rx.Subject<IRegion>).subscribe(() => this.handleResize());
        this.handleResize();
    }

    $onDestroy(): void {
        this.resizer.dispose();
    }

    handleResize = (): void => {
        if (!this.forceClosed && this.$pane.$region) {
            if (this.windowWidth < 1200 && this.$pane.$region.width >= 1200 && !this.isExpanded) {
                this.toggle();
            }
            if (this.windowWidth >= 1200 && this.$pane.$region.width < 1200 && this.isExpanded) {
                this.toggle();
            }
        }
        if (this.$pane.$region) {
            this.windowWidth = this.$pane.$region.width;
        }
    };

    toggle = (event?: MouseEvent): void => {
        // const sidebarEl = this.$element[0].querySelector('#sidebar');
        // // if (sidebarEl) {
        // //     sidebarEl.classList.toggle('sidebar-expanded');
        // // }
        // if (event) {
        //     if (this.$pane.$region && this.$pane.$region.width >= 1200 && this.isExpanded) {
        //         this.forceClosed = true;
        //     } else {
        //         this.forceClosed = false;
        //     }
        // }
        // this.isExpanded = !this.isExpanded;
        // this.$pane.toggle(this.isExpanded);
    };

    $postLink(): void {
        const sidebarLinksEl = this.$element[0].querySelector('.sidebar-links');
        // this.$transclude((clone) => {
        //     Object.assign([], clone).forEach((child: HTMLElement) => {
        //         if (child.nodeName.toLowerCase().startsWith('sidebar-')) {
        //             sidebarLinksEl.append(child);
        //             this.$compile(child)(this.$scope.$new());
        //         }
        //     });
        // });
    }
}

const SidebarComponent: VeComponentOptions = {
    bindings: {
        title: '@',
    },
    controller: SidebarController,
    selector: 'sidebar',
    require: {
        $pane: '^ngPane',
    },
    transclude: true,
    template: `
    <div id="sidebar" class="sidebar">
    <sidebar-header title="$ctrl.title" ng-show="$ctrl.title && $ctrl.isExpanded"></sidebar-header>
    <div ng-transclude class="sidebar-links">
    </div>
</div>
    `,
};

veAdmin.component(SidebarComponent.selector, SidebarComponent);

// <div class="sidebar-collapse">
//           <sidebar-link id="Collapse"
//                         title="Collapse"
//                         icon="{{$ctrl.isExpanded ? 'fa-solid fa-angle-right' : 'fa-solid fa-angle-left' }}"
//                         tooltip="Expand Sidebar"
//                         on-click="$ctrl.toggle()"
//                         is-expanded="$ctrl.isExpanded">
//           </sidebar-link>
//           <hr />
// </div>
