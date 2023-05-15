import { IComponentController } from 'angular';

import { PresentationService } from '@ve-components/presentations/services/Presentation.service';
import { RootScopeService } from '@ve-utils/application';

import { veComponents } from '@ve-components';

import { VeComponentOptions } from '@ve-types/angular';
import { ViewObject } from '@ve-types/mms';

class AddPeMenuController implements IComponentController {
    // Bindings
    private mmsView: ViewObject;

    public addPeIndex: number;

    static $inject = ['PresentationService', 'RootScopeService'];

    constructor(private presentationSvc: PresentationService, private rootScopeSvc: RootScopeService) {}
    /**
     * @name veComponents.directive:mmsView#addEltAction
     * Add specified element at the defined 'index'
     */
    public addEltAction = (index: number, type: string): void => {
        if (!this.rootScopeSvc.veEditMode()) {
            return;
        }
        this.addPeIndex = index;
        this.presentationSvc.addPresentationElement(this, type, this.mmsView);
    };

    public setPeLineVisibility = ($event: JQuery.ClickEvent): void => {
        window.setTimeout(() => {
            const peContainer = $($event.currentTarget).closest('.add-pe-button-container');
            if (peContainer.find('.dropdown-menu').css('display') == 'none') {
                peContainer.find('hr').css('visibility', 'hidden');
            } else {
                peContainer.find('hr').css('visibility', 'visible');
            }
        });
    };
}

const InsertPeMenuComponent: VeComponentOptions = {
    selector: 'addPeMenu',
    template: `
    <div class="mms-add-pe-button" ng-mouseover="$ctrl.setPeLineVisibility($event);" ng-mouseleave="$ctrl.setPeLineVisibility($event);">
    <span class="center btn-group dropdown" uib-dropdown>
        <a type="button" class="dropdown-toggle btn btn-sm" ng-click="$event.stopPropagation(); $ctrl.setPeLineVisibility($event);" uib-dropdown-toggle aria-expanded="true" title="Add cross referenceable text, tables, images, equations, sections, and comments">
            <i class="fa-solid fa-plus"></i>
        </a>
        <ul class="dropdown-menu" uib-dropdown-menu role="add PE menu">
          <li ng-click="$ctrl.addEltAction($ctrl.index, 'Paragraph', $event)">
            <a type="button" class="add-element-button center view-add-paragraph pe-type-paragraph" title="Add text">
              <span class="icon-title">Text</span>
            </a>
          </li>
          <li ng-click="$ctrl.addEltAction($ctrl.index, 'Table', $event)">
            <a type="button" class="add-element-button center view-add-table pe-type-table" title="Add table">
              <span class="icon-title">Table</span>
            </a>
          </li>
          <li ng-click="$ctrl.addEltAction($ctrl.index, 'Image', $event)">
            <a type="button" class="add-element-button center view-add-image pe-type-image" title="Add image">
              <span class="icon-title">Image</span>
            </a>
          </li>
          <li ng-click="$ctrl.addEltAction($ctrl.index, 'Equation', $event)">
            <a type="button" class="add-element-button center view-add-equation pe-type-equation" title="Add equation">
              <span class="icon-title">Equation</span>
            </a>
          </li>
          <li ng-click="$ctrl.addEltAction($ctrl.index, 'Section', $event)">
            <a type="button" class="add-element-button center view-add-section pe-type-section" title="Add section">
              <span class="icon-title">Section</span>
            </a>
          </li>
          <li ng-click="$ctrl.addEltAction($ctrl.index, 'Comment', $event)">
            <a type="button" class="add-element-button center view-add-comment pe-type-comment" title="Add comment">
              <span class="icon-title">Comment</span>
            </a>
          </li>
        </ul>
    </span>
</div>
<hr/>    
`,
    bindings: {
        mmsView: '<',
        index: '<',
    },
    controller: AddPeMenuController,
};

veComponents.component(InsertPeMenuComponent.selector, InsertPeMenuComponent);
