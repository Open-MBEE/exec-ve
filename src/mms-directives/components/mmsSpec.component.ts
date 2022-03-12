import * as angular from "angular";
import {IAttributes} from "angular";
import { Utils } from "../services/Utils.service";
import { URLService } from "src/mms/services/URLService.provider";
import {AuthService} from "../../mms/services/AuthorizationService.service";
import {ElementService} from "../../mms/services/ElementService.service";
import {UtilsService} from "../../mms/services/UtilsService.service";
import { ViewService } from "src/mms/services/ViewService.service";
import { PermissionsService } from "src/mms/services/PermissionsService.service";
import {EventService} from "../../mms/services/EventService.service";
import {handleChange} from "../../lib/changeUtils";
import {ElementObject} from "../../lib/elementOb";
import {SpecService} from "../services/Spec.service";
var mmsDirectives = angular.module('mmsDirectives');

/**
 * @ngdoc directive
 * @name mmsDirectives.directive:mmsSpec
 *
 * @requires mms.Utils
 * @required mms.URLService
 * @requires mms.AuthService
 * @requires mms.ElementService
 * @requires mms.ViewService
 * @requires mms.PermissionsService
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
    angular.module('app', ['mmsDirectives'])
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
        <mms-spec mms-eid="element_id" mms-edit-field="all" mms-spec-api="api"></mms-spec>
    </div>
    </pre>
 * ## Example for showing an element spec at a certain time
 *  <pre>
    <mms-spec mms-eid="element_id" mms-version="2014-07-01T08:57:36.915-0700"></mms-spec>
    </pre>
 * ## Example for showing a current element with nothing editable
 *  <pre>
    <mms-spec mms-eid="element_id" mms-edit-field="none"></mms-spec>
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
let MMSSpecComponent: angular.ve.ComponentOptions = {
    selector: 'mmsSpec',
    template: `
    <!-- HTML for edit mode -->
<div ng-if="!$ctrl.noEdit && $ctrl.specSvc.editing" class="editing">

    <h1 class="prop" ng-if="$ctrl.edit.name !== undefined"><input class="form-control ve-plain-input" type="text" ng-model="$ctrl.edit.name"></h1>
    <span class="elem-updated-wrapper">Last modified {{$ctrl.element._modified | date:'M/d/yy h:mm a'}} by <b ng-if="$ctrl.modifier.email != undefined">{{ $ctrl.modifier.email }}</b><b ng-if="$ctrl.modifier.email == undefined">{{ $ctrl.modifier }}</b></span>

    <div ng-if="$ctrl.edit.type === 'Property' || $ctrl.edit.type === 'Port' || $ctrl.edit.type === 'Slot'">
        <h2 class="prop-title spec-view-value-heading">Property Value</h2>
        <div ng-if="!$ctrl.isEnumeration">
            <div ng-if="$ctrl.editValues.length == 0">
                <select ng-model="addValueType" ng-options="key for (key, value) in $ctrl.addValueTypes"></select>
                <button class="btn btn-sm btn-default" ng-click="$ctrl.addValue(addValueType)">Add</button>
            </div>
            <div ng-repeat="value in $ctrl.editValues" ng-switch on="value.type" ng-form="valForm">
                <div ng-switch-when="LiteralInteger" ng-class="{'has-error': valForm.$error.pattern}">
                    <div class="form-inline">
                    <input class="form-control ve-plain-input" type="number" ng-model="value.value" ng-pattern="/^-?\\d+$/" ng-blur="$ctrl.cleanupVal(value)">&nbsp;
                    <a ng-if="!$first" ng-click="$ctrl.removeVal($index)"><i class="fa fa-close"></i></a>
                    </div>
                    <label class="control-label mms-error-icon" ng-show="valForm.$error.pattern">Not a valid integer</label>
                </div>
                <div ng-switch-when="LiteralUnlimitedNatural" ng-class="{'has-error': valForm.$error.pattern}">
                    <div class="form-inline">
                    <input class="form-control ve-plain-input" type="number" name="natVal" ng-model="value.value" ng-pattern="/^\\d+$/" ng-blur="$ctrl.cleanupVal(value)">&nbsp;
                    <a ng-if="!$first" ng-click="removeVal($index)"><i class="fa fa-close"></i></a>
                    </div>
                    <label class="control-label mms-error-icon" ng-show="valForm.$error.pattern">Not a valid natural number</label>
                </div>
                <div ng-switch-when="LiteralBoolean"><input type="checkbox" ng-model="value.value">&nbsp;{{value.value}}&nbsp;<a ng-if="!$first" ng-click="$ctrl.removeVal($index)"><i class="fa fa-close"></i></a></div>
                <div ng-switch-when="LiteralReal">
                    <div class="form-inline">
                        <input class="form-control ve-plain-input" type="number" ng-model="value.value" step="any"><a ng-if="!$first" ng-click="$ctrl.removeVal($index)">&nbsp;<i class="fa fa-close"></i></a>
                    </div>
                </div>
                <div ng-switch-when="LiteralString">
                    <textarea ng-if="$ctrl.hasHtml(value.value)" mms-ckeditor ng-model="value.value" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-element-id="{{$ctrl.element.id}}" autosave-key="{{$ctrl.element._projectId + $ctrl.element._refId + $ctrl.element.id + 'index:' + $index}}"></textarea>
                    <div ng-if="!$ctrl.hasHtml(value.value)"><textarea ng-model="value.value"></textarea><a ng-click="$ctrl.addHtml(value)"><i class="fa fa-html5"></i></a></div>
                    <a ng-if="!$first" ng-click="$ctrl.removeVal($index)"><i class="fa fa-close"></i></a>
                </div>
                <div ng-switch-when="OpaqueExpression">
                    <textarea ng-model="value.body[0]"></textarea><a ng-if="!$first" ng-click="$ctrl.removeVal($index)"><i class="fa fa-close"></i></a>
                </div>
                <div ng-switch-default>Editing not supported for now</div>
            </div>
            <div ng-if="$ctrl.editValues.length != 0 && $ctrl.isSlot">
                <button class="btn btn-sm btn-default" ng-click="$ctrl.addValue(editValues[0].type)">Add</button>
            </div>
        </div>
        <div ng-if="$ctrl.isEnumeration" ng-repeat="val in $ctrl.editValues">
            <select ng-model="val.instanceId" ng-options="el.id as el.name for el in $ctrl.options">
            </select><a ng-if="!$first" ng-click="$ctrl.removeVal($index)"><i class="fa fa-close"></i></a>
        </div>
        <div ng-if="($ctrl.isSlot || $ctrl.editValues.length == 0) && $ctrl.isEnumeration">
            <button class="btn btn-sm btn-default" ng-click="$ctrl.addEnumerationValue()">Add</button>
        </div>
    </div>

    <div ng-if="$ctrl.edit.type === 'Constraint'">
        <h2 class="prop-title spec-view-value-heading">Constraint Specification</h2>
        <div ng-switch on="$ctrl.editValues[0].type">
            <div ng-switch-when="LiteralInteger"><input class="form-control ve-plain-input" type="number" ng-model="$ctrl.editValues[0].value"></div>
            <div ng-switch-when="LiteralUnlimitedNatural"><input class="form-control ve-plain-input" type="number" ng-model="$ctrl.editValues[0].value"></div>
            <div ng-switch-when="LiteralBoolean"><input type="checkbox" ng-model="$ctrl.editValues[0].value"></div>
            <div ng-switch-when="LiteralReal"><input class="form-control ve-plain-input" type="number" ng-model="$ctrl.editValues[0].value" step="any"></div>
            <div ng-switch-when="LiteralString">
                <textarea ng-model="$ctrl.editValues[0].value"></textarea>
            </div>
            <div ng-switch-when="OpaqueExpression">
                <textarea ng-model="$ctrl.editValues[0].body[0]"></textarea>
            </div>
            <div ng-switch-default>Editing not supported for now</div>
        </div>
    </div>

    <h2 class="prop-title spec-view-doc-heading">Documentation</h2>
    <textarea ng-model="$ctrl.edit.documentation" mms-ckeditor mms-editor-api="$ctrl.editorApi" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" autosave-key="{{$ctrl.element._projectId + $ctrl.element._refId + $ctrl.element.id}}"></textarea>

    <h2 class="prop-title spec-view-type-heading">Metatypes</h2>
    <span class="elem-type-wrapper prop">
        <span class="elem-type">{{$ctrl.element.type}}</span>
        <div ng-repeat="type in $ctrl.element._appliedStereotypeIds" class="prop elem-type"><mms-transclude-name mms-element-id="{{type}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}" no-click="true"></mms-transclude-name></div>
    </span>
    <h2 class="prop-title">Location</h2>
    <span class="prop">{{$ctrl.getQualifiedName()}}</span>
    <h2 class="prop-title">ID</h2>
    <span class="prop id">{{$ctrl.element.id}}</span>
    <h2 class="prop-title">Branch/Tag</h2>
    <span class="prop">{{$ctrl.element._refId}}</span>
    <h2 class="prop-title">Project</h2>
    <span class="prop">{{$ctrl.element._projectId}}</span>
    <h2 class="prop-title">Formatted Modified Time</h2>
    <span class="prop">{{$ctrl.element._modified}}</span>
    <h2 class="prop-title">Commit</h2>
    <span class="prop">{{$ctrl.element._commitId}}</span>
</div>
<!-- HTML for view mode -->
<div ng-hide="editing" class="reading">
    <p class="text-center" ng-show="gettingSpec"><i class="fa fa-3x fa-spin fa-spinner"></i></p>

    <div ng-hide="gettingSpec">
        <div class="text-warning" ng-if="$ctrl.mmsDisplayOldContent">
            <b> Element not found:</b> displaying last found content
        </div>
        <h1 class="prop element-title" ng-class="{'mms-error': $ctrl.mmsDisplayOldContent}"><span class="{{ $ctrl.elementTypeClass }}"></span>{{$ctrl.element.name}}</h1>
        <span class="elem-updated-wrapper">Last modified {{$ctrl.element._modified | date:'M/d/yy h:mm a'}} by <b ng-if="$ctrl.modifier.email != undefined">{{ $ctrl.modifier.email }}</b><b ng-if="$ctrl.modifier.email == undefined">{{ $ctrl.modifier }}</b></span>

        <div ng-if="$ctrl.element.type === 'Property' || $ctrl.element.type === 'Port' || $ctrl.element.type === 'Slot'">
            <h2 class="prop-title spec-view-value-heading">Property Value</h2>
            <div ng-repeat="value in values" ng-switch on="value.type">
                <span class="prop" ng-switch-when="LiteralInteger">{{value.value}}</span>
                <span class="prop" ng-switch-when="LiteralBoolean">{{value.value}}</span>
                <span class="prop" ng-switch-when="LiteralReal">{{value.value | veRealNum}}</span>
                <span class="prop" ng-switch-when="LiteralUnlimitedNatural">{{value.value}}</span>
                <span class="prop" ng-switch-when="LiteralString" ng-bind-html="value.value"></span>
                <span class="prop" ng-switch-when="ElementValue"><mms-transclude-name mms-watch-id="true" mms-element-id="{{value.elementId}}" mms-project-id="{{mmsProjectId}}" mms-ref-id="{{mmsRefId}}"></mms-transclude-name></span>
                <span class="prop" ng-switch-when="InstanceValue"><mms-transclude-name mms-watch-id="true" mms-element-id="{{value.instanceId}}" mms-project-id="{{mmsProjectId}}" mms-ref-id="{{mmsRefId}}"></mms-transclude-name></span>
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
                <span class="prop" ng-switch-when="ElementValue"><mms-transclude-name mms-watch-id="true" mms-element-id="{{value.elementId}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></mms-transclude-name></span>
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
        <div ng-show="showDocHTML">{{element.documentation}}</div>

        <div ng-if="relatedDocuments.length > 0">
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
                <div ng-repeat="type in $ctrl.element._appliedStereotypeIds" class="elem-type"><mms-transclude-name mms-element-id="{{type}}" mms-project-id="{{mmsProjectId}}" mms-ref-id="{{mmsRefId}}" no-click="true"></mms-transclude-name></div>
            </span>

            <div ng-if="$ctrl.element.type === 'InstanceSpecification'">
                <h2 class="prop-title">Classifiers</h2>
                <span class="prop" ng-repeat="path in element.classifierIds"><mms-transclude-name mms-watch-id="true" mms-element-id="{{path}}" mms-project-id="{{mmsProjectId}}" mms-ref-id="{{mmsRefId}}"></mms-transclude-name></span>
            </div>

            <h2 class="prop-title">Location</h2>
            <span class="prop">{{element._qualifiedName}}</span>
            <h2 class="prop-title">ID&nbsp;
                <button ng-click="copyToClipboard($event, '#spec-element-id')" class="btn btn-sm btn-default" uib-tooltip="Copy ID">
                    <i class="fa fa-copy"></i>
                </button>
            </h2>
            <span class="prop id" title="Copy ID">
                <span id="spec-element-id" ng-click="copyToClipboard($event, '#spec-element-id')">{{element.id}}</span>
            </span>
            <h2 class="prop-title">Branch/Tag</h2>
            <span class="prop">{{element._refId}}</span>
            <h2 class="prop-title">Project</h2>
            <span class="prop">{{element._projectId}}</span>
            <h2 class="prop-title">Formatted Modified Time</h2>
            <span class="prop">{{element._modified}}</span>
            <h2 class="prop-title">Commit</h2>
            <span class="prop" title="View raw element data">
                <a target="_blank" rel="noopener noreferrer" ng-href="{{elementDataLink}}">
                    {{element._commitId}}&nbsp;<i class="fa fa-external-link" aria-hidden="true"></i>
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
        mmsDisplayOldContent: '<?'
    },
    controller: class MMSSpecController implements angular.IComponentController {
        
        private mmsElementId;
        private mmsProjectId;
        private mmsRefId;
        private mmsCommitId;
        private mmsElement;

        private noEdit;
        private mmsDisplayOldContent;

        private ran = false;
        private lastid = null; //race condition check
        private gettingSpec = false;
        private isEnumeration = false;
        private isSlot: boolean = false;
        private element: ElementObject;
        private modifier;
        private editorApi: angular.ve.IEditorApi = { save() {}};
        private relatedDocuments: null;
        private elementTypeClass: string;
        private edit: ElementObject;
        private options: any;
        private elementDataLink: string;

        static $inject = ['$scope', '$element', 'growl', 'Utils', 'URLService', 'AuthService', 'ElementService',
            'UtilsService', 'ViewService', 'PermissionsService', 'EventService', 'SpecService'];

        constructor(private $scope: angular.IScope, private $element: angular.IRootElementService,
                    private growl: angular.growl.IGrowlService, private utils: Utils, private uRLSvc: URLService,
                    private authSvc: AuthService, private elementSvc: ElementService, private utilsSvc: UtilsService,
                    private viewSvc: ViewService, private permissionsSvc: PermissionsService,
                    private eventSvc: EventService, private specSvc: SpecService) {}
                    
        $onInit() {
            if (this.mmsElement) {
                this.element = this.mmsElement;
                this.modifier = this.getModifier(this.mmsElement._modifier);
                this.utils.setupValCf(this);
                this.specSvc.editable = false;
                return;
            }
        }
        
        $onChanges(onChangesObj: angular.IOnChangesObject) {
            handleChange(onChangesObj, 'mmsElementId', this.changeElement);
            handleChange(onChangesObj, 'mmsProjectId', this.changeElement);
            handleChange(onChangesObj, 'mmsCommitId', this.changeElement);
            handleChange(onChangesObj, 'mmsRefId', this.changeElement);
        }
        
        public propertyTypeClicked(id) {
            var elementOb = {id: id, _projectId: this.mmsProjectId, _refId: this.mmsRefId};
            this.eventSvc.$broadcast('elementSelected', {elementOb: elementOb});
        };

        public getModifier(modifier) {
            this.authSvc.getUserData(modifier).then((modifierData) =>{
                return modifierData.users[0];
            }, () => {
                return modifier;
            });
        };

        
       public addHtml(value) {
            value.value = "<p>" + value.value + "</p>";
        };
        

        public getTypeClass(element: ElementObject) {
            // Get Type
            this.elementTypeClass = this.utilsSvc.getElementTypeClass(element, this.viewSvc.getElementType(element));
        };

        /**
         * @ngdoc function
         * @name mmsDirectives.directive:mmsSpec#changeElement
         * @methodOf mmsDirectives.directive:mmsSpec
         *
         * @description
         * change element in the spec, this would reevaluate whether it's editable
         *
         * @param {string} newVal new element id
         */
        public changeElement(newVal, oldVal) {
            if (!newVal || (newVal === oldVal && this.ran) || !this.mmsProjectId) {
                return;
            }
            this.relatedDocuments = null;
            this.ran = true;
            this.lastid = newVal;
            if (this.edit && this.editorApi.save) {
                this.editorApi.save();
            }
            this.isEnumeration = false;
            this.isSlot = false;
            this.gettingSpec = true;
            var extended = true;
            if (this.mmsCommitId && this.mmsCommitId !== 'latest') {
                extended = false;
            }
            var reqOb = {elementId: this.mmsElementId, projectId: this.mmsProjectId, refId: this.mmsRefId, commitId: this.mmsCommitId, extended: extended};
            this.elementSvc.getElement(reqOb, 2, false)
            .then((data) => {
                if (newVal !== this.lastid) {
                    return;
                }
                this.element = data;
                this.authSvc.getUserData(data._modifier).then((modifierData) =>{
                    this.modifier = modifierData.users[0];
                }, () => {
                    this.modifier = data._modifier;
                });
                this.utils.setupValCf(this);
                if (!this.mmsCommitId || this.mmsCommitId === 'latest') {
                    this.elementSvc.search(reqOb, {
                        size: 1,
                        sort : [{ _modified : {order : "desc"}}],
                        query: {bool: {filter: [{term: {id: data.id}}, {term: {'_projectId': data._projectId}}]}}
                    }, 2).then((searchResultOb) => {
                        if (newVal !== this.lastid) {
                            return;
                        }
                        var searchResult = searchResultOb.elements;
                        if (searchResult && searchResult.length == 1 && searchResult[0].id === data.id && searchResult[0]._relatedDocuments.length > 0) {
                            this.relatedDocuments = searchResult[0]._relatedDocuments;
                        }
                    });
                }
                if ((this.mmsCommitId !== 'latest' && this.mmsCommitId) || !this.permissionsSvc.hasProjectIdBranchIdEditPermission(this.mmsProjectId, this.mmsRefId)) {
                   this.specSvc.editable = false;
                    this.edit = null;
                    this.specSvc.setEditing(false);
                } else {
                    this.elementSvc.getElementForEdit(reqOb)
                    .then((data) => {
                        if (newVal !== this.lastid)
                            return;
                        this.edit = data;
                        this.specSvc.editable = true;
                        if (!this.specSvc.getKeepMode())
                            this.specSvc.setEditing(false);
                        this.specSvc.setKeepMode(false);
                        if (this.edit.type === 'Property' || this.edit.type === 'Port' || this.edit.type === 'Slot') {// angular.isArray(this.specSvc.edit.value)) {
                            if (this.edit.defaultValue)
                                this.specSvc.setEditValues([this.edit.defaultValue]);
                            else if (this.edit.value)
                                this.specSvc.setEditValues(this.edit.value);
                            else
                                this.specSvc.setEditValues([]);
                                this.utils.getPropertySpec(this.element)
                                .then( (value) => {
                                    this.isEnumeration = value.isEnumeration;
                                    this.isSlot = value.isSlot;
                                    this.options = value.options;
                                }, (reason) => {
                                    this.growl.error('Failed to get property spec: ' + reason.message);
                                });
                        }
                        if (this.edit.type === 'Constraint' && this.edit.specification) {
                            this.specSvc.setEditValues([this.edit.specification]);
                        }
                    });
                }
                this.getTypeClass(this.element);
                this.elementDataLink = this.uRLSvc.getRoot() + '/projects/'+this.element._projectId+'/refs/'+this.element._refId+'/elements/'+this.element.id+'?commitId='+this.element._commitId+'&token='+this.authSvc.getToken();
                this.gettingSpec = false;
            }, (reason) => {
                this.gettingSpec = false;
                //this.growl.error("Getting Element Error: " + reason.message);
            });
        };

       public copyToClipboard($event, selector) {
            this.utilsSvc.copyToClipboard(this.$element.find(selector), $event);
        };

       public cleanupVal(obj) {
            obj.value = parseInt(obj.value);
        };

        /**
         * @ngdoc function
         * @name mmsDirectives.directive:mmsSpec#save
         * @methodOf mmsDirectives.directive:mmsSpec
         *
         * @description
         * save edited element
         *
         * @return {Promise} promise would be resolved with updated element if save is successful.
         *      For unsuccessful saves, it will be rejected with an object with type and message.
         *      Type can be error or info. In case of conflict, there is an option to discard, merge,
         *      or force save. If the user decides to discord or merge, type will be info even though
         *      the original save failed. Error means an actual error occured.
         */
       public save() {
            return this.utils.save(this.edit, this.editorApi, this, false);
        };

       public hasHtml(s) {
            return this.utils.hasHtml(s);
        };

       public getQualifiedName() {
           const reqOb: ElementObject = {
               _commitId: (this.edit._commitId) ? this.edit._commitId : "latest",
               _projectId: this.edit._projectId,
               _refId: this.edit._refId,
               id: this.edit.id
           }
           return this.elementSvc.getElementQualifiedName(reqOb)
       }



        
        

    }
}

mmsDirectives.component(MMSSpecComponent.selector,MMSSpecComponent);
