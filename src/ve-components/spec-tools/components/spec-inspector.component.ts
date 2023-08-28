import _ from 'lodash';

import { ComponentService } from '@ve-components/services';
import { SpecService, ISpecTool, SpecTool } from '@ve-components/spec-tools';
import { ToolbarService } from '@ve-core/toolbar';
import { ApplicationService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import {
    ProjectService,
    URLService,
    ViewService,
    PermissionsService,
    ElementService,
    ApiService,
} from '@ve-utils/mms-api-client';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VeQService } from '@ve-types/angular';

/**
 * @ngdoc directive
 * @name veComponents.component:mmsSpec
 *
 * @requires veComponents/ComponentService
 * @requires veUtils/URLService
 * @requires veUtils/AuthService
 * @requires veUtils/ElementService
 * @requires veUtils/ViewService
 * @requires veUtils/PermissionsService
 * @requires $compile
 * @requires $templateCache
 * @requires growl
 * @requires _
 *
 * * Outputs a "spec window" of the element whose id is specified. Spec includes name,
 * documentation, and value if the element is a property. Also last modified time,
 * last user, element id. Editability is determined by a param and also element
 * editability. Documentation and string values can have html and can transclude other
 * element properties. Conflict can occur during save based on last server read time
 * and offers choice of force save, discard edit or simple merge. To control saving
 * or editor pass in an api object that will be populated with methods (see methods seciton):
 *
 * ## Example spec with full edit (given permission)
 * ### controller (js)
 *  <pre>
 angular.module('app', ['ve-components'])
 .controller('SpecCtrl', ['$scope', function($scope) {
        $this.api = {}; //empty object to be populated by the spec api
       public edit() {
            $this.api.setEditing(true);
        };
       public save() {
            $this.api.save()
            .then((e) => {
                //success
            }, (reason) => {
                //failed
            });
        };
    }]);
 </pre>
 * ### template (html)
 *  <pre>
 <div ng-controller="SpecCtrl">
 <button ng-click="edit()">Edit</button>
 <button ng-click="save()">Save</button>
 <spec mms-eid="element_id" mms-edit-field="all" spec-api="api"></spec>
 </div>
 </pre>
 * ## Example for showing an element spec at a certain time
 *  <pre>
 <spec mms-eid="element_id" mms-version="2014-07-01T08:57:36.915-0700"></spec>
 </pre>
 * ## Example for showing a current element with nothing editable
 *  <pre>
 <spec mms-eid="element_id" mms-edit-field="none"></spec>
 </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {Object=} specSvc An empty object that'll be populated with api methods
 * @param {Object=} mmsElement An element object, if this is provided, a read only
 *      element spec for it would be shown, this will not use mms services to get the element
 */

class SpecInspectorController extends SpecTool implements ISpecTool {
    static $inject = SpecTool.$inject;

    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        uRLSvc: URLService,
        elementSvc: ElementService,
        projectSvc: ProjectService,
        applicationSvc: ApplicationService,
        apiSvc: ApiService,
        viewSvc: ViewService,
        permissionsSvc: PermissionsService,
        eventSvc: EventService,
        specSvc: SpecService,
        toolbarSvc: ToolbarService
    ) {
        super(
            $q,
            $scope,
            $element,
            growl,
            componentSvc,
            uRLSvc,
            elementSvc,
            projectSvc,
            applicationSvc,
            apiSvc,
            viewSvc,
            permissionsSvc,
            eventSvc,
            specSvc,
            toolbarSvc
        );

        this.specType = _.kebabCase(SpecInspectorComponent.selector);
        this.specTitle = 'Preview Element';
    }

    protected initCallback = (): void => {
        this.specSvc.setEditing(false);
        this.specSvc.toggleSave(this.toolbarId);
    };
}

const SpecInspectorComponent: VeComponentOptions = {
    selector: 'specInspector',
    template: `
<!-- HTML for view mode -->
<div class="reading">
    <div class="text-center" >
      <i ng-show="$ctrl.gettingSpec && $ctrl.element" class="fa fa-3x fa-spin fa-spinner"></i>
      <span class="placeholder" ng-show="!$ctrl.element"><i class="fa fa-info-circle"></i><em> No Element Selected</em></span></p>
  </div>
    
    <div ng-hide="$ctrl.gettingSpec && !$ctrl.element">
        <div class="text-warning" ng-if="$ctrl.mmsDisplayOldSpec">
            <b> Element not found:</b> displaying last found spec
        </div>
        <h1 class="prop element-title" ng-class="{'ve-error': $ctrl.mmsDisplayOldSpec}"><span class="{{ $ctrl.elementTypeClass }}"></span>{{$ctrl.element.name}}</h1>
        <span class="elem-updated-wrapper">Last modified {{$ctrl.element._modified | date:'M/d/yy h:mm a'}} by <b ng-if="$ctrl.modifier.email != undefined">{{ $ctrl.modifier.email }}</b><b ng-if="$ctrl.modifier.email == undefined">{{ $ctrl.modifier }}</b></span>

        <div ng-if="$ctrl.element.type === 'Property' || $ctrl.element.type === 'Port' || $ctrl.element.type === 'Slot' || $ctrl.element.type.includes('TaggedValue')">
            <h2 class="prop-title spec-view-value-heading">Property Value</h2>
            <transclude-val mms-element-id="{{$ctrl.element.id}}" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-commit-id="{{$ctrl.element._commitId}}" non-editable="true"></transclude-val>
            
            <h2 class="prop-title spec-view-value-heading">Property Type</h2>
            <span class="prop" ng-if="$ctrl.element.type === 'Property'"><transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element.typeId}}" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" click-handler="$ctrl.propertyTypeClicked($ctrl.element.typeId)"></transclude-name></span>
            <span class="prop" ng-if="$ctrl.element.type === 'Slot'"><transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element.definingFeatureId}}" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" click-handler="$ctrl.propertyTypeClicked($ctrl.element.definingFeatureId)"></transclude-name></span>
            <span class="prop" ng-if="$ctrl.element.type.includes('TaggedValue')"><transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element.tagDefinitionId}}" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" click-handler="$ctrl.propertyTypeClicked($ctrl.element.tagDefinitionId)"></transclude-name></span>
        </div>

        <div ng-if="$ctrl.element.type === 'Generalization' || $ctrl.element.type === 'Dependency'">
            <h2 class="prop-title">Source</h2>
            <span class="prop"><transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element._sourceIds[0]}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></transclude-name></span>
            <h2 class="prop-title">Target</h2>
            <span class="prop"><transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element._targetIds[0]}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></transclude-name></span>
        </div>

        <div ng-if="$ctrl.element.type === 'Connector'">
            <h2 class="prop-title">Path 1</h2>
            <span class="prop" ng-repeat="path in $ctrl.element._propertyPathIds[0]"><transclude-name mms-watch-id="true" mms-element-id="{{path}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></transclude-name></span>
            <h2 class="prop-title">Path 2</h2>
            <span class="prop" ng-repeat="path in $ctrl.element._propertyPathIds[1]"><transclude-name mms-watch-id="true" mms-element-id="{{path}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></transclude-name></span>
        </div>

        <div ng-if="$ctrl.element.type === 'Association'">
            <h2 class="prop-title">Role 1</h2>
            <span class="prop"><transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element.memberEndIds[0]}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></transclude-name></span>
            <h2 class="prop-title">Role 2</h2>
            <span class="prop"><transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element.memberEndIds[1]}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></transclude-name></span>
        </div>

        <div ng-if="$ctrl.element.type === 'Constraint'">
            <h2 class="prop-title">Constraint Specification</h2>
            <transclude-val mms-element-id="{{$ctrl.element.id}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}" mms-commit-id="{{$ctrl.mmsCommitId}}" non-editable="true" first="true"></transclude-val>
        </div>

        <div ng-if="$ctrl.element.type === 'Diagram' && $ctrl.element._artifacts">
            <transclude-img mms-element-id="{{$ctrl.element.id}}" mms-ref-id="{{$ctrl.element._refId}}" mms-project-id="{{$ctrl.element._projectId}}" mms-commit-id="{{$ctrl.element._commitId}}"></transclude-img>
        </div>
        <div ng-if="$ctrl.element.type === 'Artifact' && $ctrl.element._artifacts">
            <transclude-art mms-element-id="{{$ctrl.element.id}}" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-art-ext=""></transclude-art>
        </div>
        <h2 class="prop-title spec-view-doc-heading">Documentation <a ng-click="$ctrl.showDocHTML = !$ctrl.showDocHTML"><i class="fa fa-code"></i></a></h2>
        <p ng-show="!$ctrl.showDocHTML" class="doc-text">
            <transclude-doc mms-element-id="{{$ctrl.element.id}}" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-commit-id="{{$ctrl.element._commitId}}"></transclude-doc>
        </p>
        <div ng-show="$ctrl.showDocHTML">{{$ctrl.element.documentation}}</div>

        <div ng-if="$ctrl.relatedDocuments.length > 0">
            <h2 class="prop-title">Used by Documents/Views</h2>
            <span class="elem-related-docs-wrapper prop">
                <div ng-repeat="relatedDocument in $ctrl.relatedDocuments">
                    <span ng-repeat="relatedView in relatedDocument._parentViews">
                        <mms-view-link suppress-numbering="true" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-doc-id="{{$ctrl.relatedDocument.id}}" mms-element-id="{{$ctrl.relatedDocument.id}}" link-target="_blank" rel="noopener"></mms-view-link>
                        > <mms-view-link suppress-numbering="true" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-doc-id="{{$ctrl.relatedDocument.id}}" mms-element-id="{{$ctrl.relatedView.id}}" link-target="_blank" rel="noopener"></mms-view-link><br/>
                    </span>
                </div>
            </span>
        </div>

        <!-- <a ng-click="toggleAdvancedProperties = !toggleAdvancedProperties" class="visibility-toggle" ng-class="{active: toggleAdvancedProperties}" ng-init="toggleAdvancedProperties=false">Advanced</a>
        <div ng-show="toggleAdvancedProperties"> -->
            <h2 class="prop-title">Metatypes</h2>
            <span class="elem-type-wrapper prop">
                <span class="elem-type">{{$ctrl.element.type}}</span>
                <div ng-repeat="type in $ctrl.element.appliedStereotypeIds" class="elem-type">
                    <transclude-name mms-element-id="{{type}}" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" no-click="true"></transclude-name>
                </div>
            </span>

            <div ng-if="$ctrl.element.type === 'InstanceSpecification'">
                <h2 class="prop-title">Classifiers</h2>
                <span class="prop" ng-repeat="path in element.classifierIds"><transclude-name mms-watch-id="true" mms-element-id="{{path}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></transclude-name></span>
            </div>

            <h2 class="prop-title">Location</h2>
            <span class="prop">{{$ctrl.specApi.qualifiedName}}</span>
            <h2 class="prop-title">ID&nbsp;
                <button id="spec-element-id-copy" ng-click="$ctrl.copyToClipboard($event, '#spec-element-id')" class="btn btn-sm btn-default" uib-tooltip="Copy ID">
                    <i class="fa fa-copy"></i>
                </button>
            </h2>
            <span class="prop id" title="Copy ID">
                <span id="spec-element-id" ng-click="$ctrl.copyToClipboard($event, '#spec-element-id')">{{$ctrl.element.id}}</span>
            </span>
            <h2 class="prop-title">Branch/Tag</h2>
            <span class="prop">{{$ctrl.element._refId}}</span>
            <h2 class="prop-title">Project</h2>
            <span class="prop">{{$ctrl.element._projectId}}</span>
            <h2 class="prop-title">Formatted Modified Time</h2>
            <span class="prop">{{$ctrl.element._modified}}</span>
            <h2 class="prop-title">Commit</h2>
            <span class="prop" title="View raw element data">
                <a target="_blank" rel="noopener noreferrer" ng-href="{{$ctrl.elementDataLink}}">
                    {{$ctrl.element._commitId}}&nbsp;<i class="fa fa-external-link" aria-hidden="true"></i>
                </a>
            </span>
        <!-- </div> -->
    </div>
</div>
    `,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsElement: '<?',
        noEdit: '@',
        mmsDisplayOldSpec: '<?',
    },
    controller: SpecInspectorController,
};

veComponents.component(SpecInspectorComponent.selector, SpecInspectorComponent);
