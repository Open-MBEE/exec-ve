import { IComponentController } from 'angular';

import { SearchController } from '@ve-core/search';

import { veCore } from '@ve-core';

import { VeComponentOptions } from '@ve-types/angular';
import { ElementObject } from '@ve-types/mms';

export class MmsSearchResultsController implements IComponentController {
    //Parent Controllers
    private $search: SearchController;

    //Bindings
    private elem: ElementObject;

    $onChanges;
}
const MmsSearchResultsComponent: VeComponentOptions = {
    selector: 'mmsSearchResults',
    require: {
        $search: '^^mmsSearch',
    },
    bindings: {
        elem: '<mmsElement',
    },
    template: `
    <div class="elem-name-wrapper">
    <span class="{{ $ctrl.$search.getTypeClass($ctrl.elem) }}"></span>
    <a class="elem-name" ng-click="$ctrl.$search.userResultClick($ctrl.elem, 'name')">{{$ctrl.elem.name}}</a>
    <a class="elem-name" ng-show="$ctrl.elem.type == 'Slot'" ng-click="$ctrl.$search.userResultClick($ctrl.elem, 'name')">
        <transclude-name mms-element-id="{{$ctrl.elem.definingFeatureId}}" mms-project-id="{{$ctrl.elem._projectId}}" mms-ref-id="{{$ctrl.elem._refId}}" no-click="true"></transclude-name>
    </a>
</div>
<div class="elem-qualified-name-wrapper">
    <div ng-click="$ctrl.$search.expandQualifiedName($event, $ctrl.elem._qualifiedName);" class="elem-qualified-name">
        {{qualifiedNameFormatter($ctrl.elem._qualifiedName)}}
    </div>
</div>
<div ng-if="$ctrl.elem.type === 'Diagram' && $ctrl.elem._artifacts">
    <transclude-img ng-click="$ctrl.$search.userResultClick($ctrl.elem, 'img')" mms-element-id="{{$ctrl.elem.id}}" mms-project-id="{{$ctrl.elem._projectId}}" mms-ref-id="{{$ctrl.elem._refId}}"></transclude-img>
</div>
<div ng-if="$ctrl.elem.type !== 'Diagram' && $ctrl.elem._artifacts">
    <transclude-art mms-element-id="{{$ctrl.elem.id}}" mms-project-id="{{$ctrl.elem._projectId}}" mms-ref-id="{{$ctrl.elem._refId}}"></transclude-art>
</div>
<div class="elem-documentation-wrapper">
    <label>Documentation</label>
    <div class="elem-documentation">
        <a ng-show="$ctrl.elem.documentation" ng-bind-html="$ctrl.elem.documentation | limitTo:270" ng-click="$ctrl.$search.userResultClick($ctrl.elem, 'doc')"></a><span class="ellipses">{{$ctrl.elem.documentation.length > 270 ? ' ...' : ''}}</span>
        <span><a ng-show="!$ctrl.elem.documentation" ng-click="$ctrl.$search.userResultClick($ctrl.elem, 'doc')">
          {{$ctrl.$search.emptyDocTxt}}
          </a></span>
    </div>
</div>
<div ng-if="($ctrl.elem.type === 'Property' || $ctrl.elem.type === 'Port') && $ctrl.elem.defaultValue">
    <label>Value</label>
    <div class="elem-properties">
        <a ng-click="$ctrl.$search.userResultClick($ctrl.elem, 'val')">
            {{$ctrl.elem.defaultValue.value + '' | limitTo:250 || $ctrl.elem.defaultValue.body[0] | limitTo:250 || 'Default Value'}}<span class="ellipses">{{($ctrl.elem.defaultValue.body[0] && $ctrl.elem.defaultValue.body.length > 1 || val.value.length > 250) ? ' ...' : '' }}</span>
        </a>
    </div>
</div>
<div ng-if="$ctrl.elem.type === 'Slot' && $ctrl.elem.value">
    <label>Value</label>
    <div class="elem-properties">
        <a ng-click="$ctrl.$search.userResultClick($ctrl.elem, 'val')">
            <span ng-repeat="val in $ctrl.elem.value">
                {{val.value + '' | limitTo:250 || val.body[0] | limitTo:250 || 'Default Value'}}<span class="ellipses">{{(val.body[0] && val.body.length > 1 || val.value.length > 250) ? ' ...' : '' }}</span>{{$last ? '' : ', '}}
            </span>
        </a>
    </div>
</div>
<div ng-if="$ctrl.elem.type === 'Constraint'">
    <label>Specification</label>
    <div class="elem-specification">
        <a ng-click="$ctrl.$search.userResultClick($ctrl.elem, 'val')">
            {{$ctrl.elem.specification.value + '' || 'Constraint Specification'}}
        </a>
    </div>
    <a ng-click="$ctrl.$search.userResultClick($ctrl.elem, 'val')">
        <div ng-repeat="str in $ctrl.elem.specification.body">
            <div class="elem-specification">{{str}}</div>
        </div>
    </a>
</div>
<div ng-if="$ctrl.elem._properties[0]" class="elem-properties-wrapper ve-search">
    <label>Properties</label>
    <table>
        <tr ng-repeat="property in $ctrl.elem._properties | limitTo : limitForProps">
            <td>
                {{property.name}}<span ng-if="property.type === 'Slot'"><transclude-name mms-element-id="{{property.definingFeatureId}}" mms-project-id="{{$ctrl.elem._projectId}}" mms-ref-id="{{$ctrl.elem._refId}}" no-click="true"></transclude-name></span>
                                 <span ng-if="property.type.includes('TaggedValue')"><transclude-name mms-element-id="{{property.tagDefinitionId}}" mms-project-id="{{$ctrl.elem._projectId}}" mms-ref-id="{{$ctrl.elem._refId}}" no-click="true"></transclude-name></span>: 
            </td>
            <td>
                <a ng-click="$ctrl.$search.userResultClick(property, 'val')">{{property.defaultValue.value | limitTo:300}}
                    <span ng-if="property.type.includes('TaggedValue')" ng-repeat="val in property.value | limitTo:4">
                        <span ng-bind-html="val.value | limitTo:300"></span>
                        <span ng-bind-html="val.body[0] | limitTo:300"></span>
                        <span ng-if="!val.value && !val.body[0]">Default Value</span>
                    </span>
                    <!-- set variable for limit -->
                    <span ng-if="property.value.length > 4 || property.defaultValue.value.length > 300">...</span>
                </a>
            </td>
        </tr>
        <tr class="visibility-toggle" ng-show="$ctrl.elem._properties.length > 6">
            <td></td>
            <td>
                <a ng-click="$ctrl.$search.showSearchResultProps = !$ctrl.$search.showSearchResultProps; $ctrl.$search.showSearchResultProps ? switchText='Less' : switchText='More'; $ctrl.$search.showSearchResultProps ? limitForProps=50 : limitForProps=6" ng-class="{active: $ctrl.$search.showSearchResultProps}">{{switchText}}</a>
            </td>
        </tr>
    </table>
</div>
<div ng-if="$ctrl.elem.allRelatedDocuments.length > 0" class="elem-related-docs-wrapper">
    <label>Related Documents</label>
    <!-- show no more than three related views here-->
    <div ng-repeat="doc in $ctrl.elem.someRelatedDocuments" class="elem-documentation">
        <mms-view-link suppress-numbering="true" mms-project-id="{{$ctrl.elem._projectId}}" mms-ref-id="{{$ctrl.elem._refId}}" mms-doc-id="{{doc.relatedDocument.id}}" mms-element-id="{{doc.relatedDocument.id}}" ng-click="userRelatedClick($event, doc.relatedDocument, doc.relatedDocument, elem)"></mms-view-link>
        > <mms-view-link suppress-numbering="true" mms-project-id="{{$ctrl.elem._projectId}}" mms-ref-id="{{$ctrl.elem._refId}}" mms-doc-id="{{doc.relatedDocument.id}}" mms-element-id="{{doc.relatedView.id}}" ng-click="userRelatedClick($event, doc.relatedDocument, doc.relatedView, elem)"></mms-view-link><br/>
    </div>

    <!-- show the remaining related views when users click on "More" -->
    <div ng-if="$ctrl.elem.remainingRelatedDocuments">
        <div ng-repeat="doc in $ctrl.elem.remainingRelatedDocuments" class="elem-documentation">
            <mms-view-link suppress-numbering="true" mms-project-id="{{$ctrl.elem._projectId}}" mms-ref-id="{{$ctrl.elem._refId}}" mms-doc-id="{{doc.relatedDocument.id}}" mms-element-id="{{doc.relatedDocument.id}}" ng-click="userRelatedClick($event, doc.relatedDocument, doc.relatedDocument, elem)"></mms-view-link>
            > <mms-view-link suppress-numbering="true" mms-project-id="{{$ctrl.elem._projectId}}" mms-ref-id="{{$ctrl.elem._refId}}" mms-doc-id="{{doc.relatedDocument.id}}" mms-element-id="{{doc.relatedView.id}}" ng-click="userRelatedClick($event, doc.relatedDocument, doc.relatedView, elem)"></mms-view-link><br/>
        </div>
    </div>

    <div class="show-more-container" ng-if="!$ctrl.elem.remainingRelatedDocuments && $ctrl.elem.allRelatedDocuments.length > $ctrl.elem.someRelatedDocuments.length">
        <a class="show-more-btn" ng-click="$ctrl.$search.showMoreRelatedViews($ctrl.elem);"> {{($ctrl.elem.allRelatedDocuments.length - $ctrl.elem.someRelatedDocuments.length) + ' More'}}
        </a>
    </div>

</div>
<div ng-if="$ctrl.elem.type != 'InstanceSpecification'">
    <label>Metatypes</label>
    <div class="elem-type-wrapper">
        <span class="elem-type">{{$ctrl.elem.type}}</span>
        <span ng-if="$ctrl.elem.appliedStereotypeIds.length">
            <span ng-repeat="type in $ctrl.elem.appliedStereotypeIds">
                <transclude-name class="elem-type" mms-element-id="{{type}}" mms-project-id="{{$ctrl.elem._projectId}}" mms-ref-id="{{$ctrl.elem._refId}}" no-click="true"></transclude-name>
            </span>
        </span>
    </div>
</div>
<div class="elem-updated-wrapper">
    <div>Last modified {{$ctrl.elem._modified | date:'M/d/yy h:mm a'}} by <b>{{$ctrl.elem._modifier}}</b></div>
</div>
    `,
    controller: MmsSearchResultsController,
};

veCore.component(MmsSearchResultsComponent.selector, MmsSearchResultsComponent);
