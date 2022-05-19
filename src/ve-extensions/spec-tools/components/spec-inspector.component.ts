import * as angular from "angular";
import _ from "lodash";

import {veExt, ExtUtilService} from "@ve-ext";
import {URLService} from "@ve-utils/services";
import {AuthService, ElementService, EventService, UtilsService} from "@ve-utils/services";
import {ViewService} from "@ve-utils/services";
import {PermissionsService} from "@ve-utils/services";
import {SpecService} from "../services/Spec.service";
import {VeComponentOptions} from "@ve-types/view-editor";
import {ElementObject, ElementsRequest} from "@ve-types/mms";

import {ISpecTool, SpecTool} from "../spec-tool.controller";
import {ToolbarService} from "../services/Toolbar.service";


/**
 * @ngdoc directive
 * @name veExt.directive:mmsSpec
 *
 * @requires veUtils/Utils
 * @required veUtils/URLService
 * @requires veUtils/AuthService
 * @requires veUtils/ElementService
 * @requires veUtils/ViewService
 * @requires veUtils/PermissionsService
 * @requires $compile
 * @requires $templateCache
 * @requires growl
 * @requires _
 *
 * @restrict E
 *
 * @description
 * Outputs a "spec window" of the element whose id is specified. Spec includes name,
 * documentation, and value if the element is a property. Also last modified time,
 * last user, element id. Editability is determined by a param and also element
 * editability. Documentation and string values can have html and can transclude other
 * element properties. Conflict can occur during save based on last server read time
 * and offers choice of force save, discard edit or simple merge. To control saving
 * or editing pass in an api object that will be populated with methods (see methods seciton):
 *
 * ## Example spec with full edit (given permission)
 * ### controller (js)
 *  <pre>
 angular.module('app', ['ve-core'])
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


class SpecInspectorController extends SpecTool implements ISpecTool  {

        static $inject = SpecTool.$inject;

        constructor($scope: angular.IScope, $element: JQuery<HTMLElement>,
                    growl: angular.growl.IGrowlService, extUtilSvc: ExtUtilService, uRLSvc: URLService,
                    authSvc: AuthService, elementSvc: ElementService, utilsSvc: UtilsService,
                    viewSvc: ViewService, permissionsSvc: PermissionsService,
                    eventSvc: EventService, specSvc: SpecService, toolbarSvc: ToolbarService) {
            super($scope,$element,growl,extUtilSvc,uRLSvc,authSvc,elementSvc,utilsSvc,viewSvc,permissionsSvc,eventSvc,specSvc,toolbarSvc)

            this.specType = _.kebabCase(SpecInspectorComponent.selector)
            this.specTitle = "Preview Element";
            this.specKind = "document";
        }

        protected config = () => {
            this.subs.push(this.eventSvc.$on(this.specType, () => {
                this.specSvc.setEditing(false);
                this.specSvc.cleanUpSaveAll();
            }));

        }
    }

let SpecInspectorComponent: VeComponentOptions = {
    selector: 'specInspector',
    template: `
<!-- HTML for view mode -->
<div class="reading">
    <p class="text-center" ng-show="$ctrl.gettingSpec"><i class="fa fa-3x fa-spin fa-spinner"></i></p>

    <div ng-hide="$ctrl.gettingSpec">
        <div class="text-warning" ng-if="$ctrl.mmsDisplayOldSpec">
            <b> Element not found:</b> displaying last found spec
        </div>
        <h1 class="prop element-title" ng-class="{'mms-error': $ctrl.mmsDisplayOldSpec}"><span class="{{ $ctrl.elementTypeClass }}"></span>{{$ctrl.element.name}}</h1>
        <span class="elem-updated-wrapper">Last modified {{$ctrl.element._modified | date:'M/d/yy h:mm a'}} by <b ng-if="$ctrl.modifier.email != undefined">{{ $ctrl.modifier.email }}</b><b ng-if="$ctrl.modifier.email == undefined">{{ $ctrl.modifier }}</b></span>

        <div ng-if="$ctrl.element.type === 'Property' || $ctrl.element.type === 'Port' || $ctrl.element.type === 'Slot'">
            <h2 class="prop-title spec-view-value-heading">Property Value</h2>
            <div ng-repeat="value in $ctrl.values" ng-switch on="value.type">
                <span class="prop" ng-switch-when="LiteralInteger">{{value.value}}</span>
                <span class="prop" ng-switch-when="LiteralBoolean">{{value.value}}</span>
                <span class="prop" ng-switch-when="LiteralReal">{{value.value | veRealNum}}</span>
                <span class="prop" ng-switch-when="LiteralUnlimitedNatural">{{value.value}}</span>
                <span class="prop" ng-switch-when="LiteralString" ng-bind-html="value.value"></span>
                <span class="prop" ng-switch-when="ElementValue"><mms-transclude-name mms-watch-id="true" mms-element-id="{{value.elementId}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></mms-transclude-name></span>
                <span class="prop" ng-switch-when="InstanceValue"><mms-transclude-name mms-watch-id="true" mms-element-id="{{value.instanceId}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></mms-transclude-name></span>
                <span class="prop" ng-switch-when="OpaqueExpression">{{value.body[0]}}</span>
                <span class="prop" ng-switch-default>{{value}}</span>
            </div>
            <h2 class="prop-title spec-view-value-heading">Property Type</h2>
            <span class="prop" ng-if="$ctrl.element.type === 'Property'"><mms-transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element.typeId}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}" click-handler="$ctrl.propertyTypeClicked($ctrl.element.typeId)"></mms-transclude-name></span>
            <span class="prop" ng-if="$ctrl.element.type === 'Slot'"><mms-transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element.definingFeatureId}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}" click-handler="$ctrl.propertyTypeClicked($ctrl.element.definingFeatureId)"></mms-transclude-name></span>
        </div>

        <div ng-if="$ctrl.element.type === 'Generalization' || $ctrl.element.type === 'Dependency'">
            <h2 class="prop-title">Source</h2>
            <span class="prop"><mms-transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element._sourceIds[0]}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></mms-transclude-name></span>
            <h2 class="prop-title">Target</h2>
            <span class="prop"><mms-transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element._targetIds[0]}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></mms-transclude-name></span>
        </div>

        <div ng-if="$ctrl.element.type === 'Connector'">
            <h2 class="prop-title">Path 1</h2>
            <span class="prop" ng-repeat="path in $ctrl.element._propertyPathIds[0]"><mms-transclude-name mms-watch-id="true" mms-element-id="{{path}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></mms-transclude-name></span>
            <h2 class="prop-title">Path 2</h2>
            <span class="prop" ng-repeat="path in $ctrl.element._propertyPathIds[1]"><mms-transclude-name mms-watch-id="true" mms-element-id="{{path}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></mms-transclude-name></span>
        </div>

        <div ng-if="$ctrl.element.type === 'Association'">
            <h2 class="prop-title">Role 1</h2>
            <span class="prop"><mms-transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element.memberEndIds[0]}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></mms-transclude-name></span>
            <h2 class="prop-title">Role 2</h2>
            <span class="prop"><mms-transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element.memberEndIds[1]}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></mms-transclude-name></span>
        </div>

        <div ng-if="$ctrl.element.type === 'Constraint'">
            <h2 class="prop-title">Constraint Specification</h2>
            <div ng-switch on="$ctrl.values[0].type">
                <span class="prop" ng-switch-when="LiteralInteger">{{$ctrl.values[0].value}}</span>
                <span class="prop" ng-switch-when="LiteralBoolean">{{$ctrl.values[0].value}}</span>
                <span class="prop" ng-switch-when="LiteralReal">{{$ctrl.values[0].value | veRealNum}}</span>
                <span class="prop" ng-switch-when="LiteralUnlimitedNatural">{{$ctrl.values[0].value}}</span>
                <span class="prop" ng-switch-when="LiteralString" ng-bind-html="$ctrl.values[0].value"></span>
                <span class="prop" ng-switch-when="ElementValue"><mms-transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.values[0].elementId}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></mms-transclude-name></span>
                <span class="prop" ng-switch-when="OpaqueExpression">{{$ctrl.values[0].body[0]}}</span>
                <span class="prop" ng-switch-default>{{$ctrl.values}}</span>
            </div>
        </div>

        <div ng-if="$ctrl.element.type === 'Diagram' && $ctrl.element._artifacts">
            <mms-transclude-img mms-element-id="{{$ctrl.element.id}}" mms-ref-id="{{$ctrl.element._refId}}" mms-project-id="{{$ctrl.element._projectId}}" mms-commit-id="{{$ctrl.element._commitId}}"></mms-transclude-img>
        </div>
        <div ng-if="$ctrl.element.type === 'Artifact' && $ctrl.element._artifacts">
            <mms-transclude-art mms-element-id="{{$ctrl.element.id}}" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-art-ext=""></mms-transclude-art>
        </div>
        <h2 class="prop-title spec-view-doc-heading">Documentation <a ng-click="$ctrl.showDocHTML = !$ctrl.showDocHTML"><i class="fa fa-code"></i></a></h2>
        <p ng-show="!$ctrl.showDocHTML" class="doc-text">
            <mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.element.id}}" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-commit-id="{{$ctrl.element._commitId}}" mms-watch-id="true"></mms-cf>
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
                <div ng-repeat="type in $ctrl.element._appliedStereotypeIds" class="elem-type"><mms-transclude-name mms-element-id="{{type}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}" no-click="true"></mms-transclude-name></div>
            </span>

            <div ng-if="$ctrl.element.type === 'InstanceSpecification'">
                <h2 class="prop-title">Classifiers</h2>
                <span class="prop" ng-repeat="path in element.classifierIds"><mms-transclude-name mms-watch-id="true" mms-element-id="{{path}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></mms-transclude-name></span>
            </div>

            <h2 class="prop-title">Location</h2>
            <span class="prop">{{$ctrl.qualifiedName}}</span>
            <h2 class="prop-title">ID&nbsp;
                <button ng-click="copyToClipboard($event, '#spec-element-id')" class="btn btn-sm btn-default" uib-tooltip="Copy ID">
                    <i class="fa fa-copy"></i>
                </button>
            </h2>
            <span class="prop id" title="Copy ID">
                <span id="spec-element-id" ng-click="copyToClipboard($event, '#spec-element-id')">{{$ctrl.element.id}}</span>
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
        mmsDisplayOldSpec: '<?'
    },
    controller: SpecInspectorController
}

veExt.component(SpecInspectorComponent.selector,SpecInspectorComponent);
