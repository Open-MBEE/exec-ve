import angular from "angular";
import {RootScopeService} from "@ve-utils/services";
import {CoreUtilsService} from "../utilities/CoreUtils.service";
import {VeComponentOptions} from "@ve-types/view-editor";
import {ElementObject} from "@ve-types/mms";

import {veCore} from "../ve-core.module";

let AddPeMenuComponent: VeComponentOptions = {
    selector: 'addPeMenu',
    template: `
    <div class="mms-add-pe-button" ng-mouseover="setPeLineVisibility($event);" ng-mouseleave="setPeLineVisibility($event);">
    <span class="center btn-group dropdown" uib-dropdown>
        <a type="button" class="dropdown-toggle btn btn-sm" ng-click="$event.stopPropagation(); setPeLineVisibility($event);" uib-dropdown-toggle aria-expanded="true" title="Add cross referenceable text, tables, images, equations, sections, and comments">
            <i class="fa fa-plus"></i>
        </a>
        <ul class="dropdown-menu" uib-dropdown-menu role="add PE menu">
          <li ng-click="$ctrl.addEltAction($ctrl.index, 'Paragraph', $event)">
            <a type="button" class="add-element-button center view-add-paragraph pe-type-Paragraph" title="Add text">
              <span class="icon-title">Text</span>
            </a>
          </li>
          <li ng-click="$ctrl.addEltAction($ctrl.index, 'Table', $event)">
            <a type="button" class="add-element-button center view-add-table pe-type-Table" title="Add table">
              <span class="icon-title">Table</span>
            </a>
          </li>
          <li ng-click="$ctrl.addEltAction($ctrl.index, 'Image', $event)">
            <a type="button" class="add-element-button center view-add-image pe-type-Image" title="Add image">
              <span class="icon-title">Image</span>
            </a>
          </li>
          <li ng-click="$ctrl.addEltAction($ctrl.index, 'Equation', $event)">
            <a type="button" class="add-element-button center view-add-equation pe-type-Equation" title="Add equation">
              <span class="icon-title">Equation</span>
            </a>
          </li>
          <li ng-click="$ctrl.addEltAction($ctrl.index, 'Section', $event)">
            <a type="button" class="add-element-button center view-add-section pe-type-Section" title="Add section">
              <span class="icon-title">Section</span>
            </a>
          </li>
          <li ng-click="$ctrl.addEltAction($ctrl.index, 'Comment', $event)">
            <a type="button" class="add-element-button center view-add-comment pe-type-Comment" title="Add comment">
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
        index: '<'
    },
    controller: class AddPeMenuController implements angular.IComponentController {

        private view: ElementObject

        private addPeIndex: number;

        static $inject = ['RootScopeService', 'CoreUtilsService'];

        constructor(private rootScopeSvc: RootScopeService, private utils: CoreUtilsService) {
        }
        /**
         * @ngdoc function
         * @name veCore.directive:mmsView#addEltAction
         * @methodOf veCore.directive:mmsView
         *
         * @description
         * Add specified element at the defined 'index'
         */
        public addEltAction(index: number, type: string) {
            if (!this.rootScopeSvc.veEditMode()) {
                return;
            }
            this.addPeIndex = index;
            this.utils.addPresentationElement(this, type, this.view);
        };

    }
}

veCore.component(AddPeMenuComponent.selector,AddPeMenuComponent)
