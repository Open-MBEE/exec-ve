import * as angular from "angular";
import _ from "lodash";

import {URLService} from "@ve-utils/services";
import {AuthService, EditService, ElementService, EventService, UtilsService} from "@ve-utils/services";
import {ViewService} from "@ve-utils/services";
import {PermissionsService} from "@ve-utils/services";
import {SpecService} from "@ve-ext/spec-tools";
import {VeComponentOptions} from "@ve-types/view-editor";
import {ElementObject, ElementsRequest} from "@ve-types/mms";
import {veExt, ExtUtilService} from "@ve-ext";
import {SpecTool, ISpecTool, ToolbarService} from "@ve-ext/spec-tools";

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


class SpecEditorController extends SpecTool implements ISpecTool {

    static $inject = [...SpecTool.$inject, 'EditService'];

    constructor($scope: angular.IScope, $element: JQuery<HTMLElement>,
                growl: angular.growl.IGrowlService, extUtilSvc: ExtUtilService, uRLSvc: URLService,
                authSvc: AuthService, elementSvc: ElementService, utilsSvc: UtilsService,
                viewSvc: ViewService, permissionsSvc: PermissionsService,
                eventSvc: EventService, specSvc: SpecService, toolbarSvc: ToolbarService, private editSvc: EditService) {
        super($scope,$element,growl,extUtilSvc,uRLSvc,authSvc,elementSvc,utilsSvc,viewSvc,permissionsSvc,eventSvc,specSvc,toolbarSvc)
        this.specType = _.kebabCase(SpecEditorComponent.selector)
        this.specTitle = "Edit Element";
        this.specKind = 'document'
    }

    config = () => {
        if (this.editSvc.openEdits() > 0) {
            this.tbApi.setIcon('spec-editor', 'fa-edit-asterisk');
            this.tbApi.setPermission('spec-editor-saveall', true);
        }


        this.subs.push(this.eventSvc.$on(this.specType, () => {
            this.specSvc.setEditing(true);
            var editOb = this.specSvc.getEdits();
            if (editOb) {
                var key = editOb.id + '|' + editOb._projectId + '|' + editOb._refId;
                this.specSvc.tracker.etrackerSelected = key;
                this.editSvc.addOrUpdate(key, editOb);
                this.specSvc.cleanUpSaveAll();
                this.elementSvc.isCacheOutdated(editOb)
                    .then((data) => {
                        let server = (data.server) ? <Date>data.server._modified : new Date();
                        let cache = (data.cache) ? <Date>data.cache._modified : new Date()
                        if (data.status && server > cache)
                            this.growl.error('This element has been updated on the server. Please refresh the page to get the latest version.');
                    });
            }
        }));
    }
}

let SpecEditorComponent: VeComponentOptions = {
    selector: 'specEditor',
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
                    <div ng-if="$ctrl.hasHtml(value.value)">
                        <ve-editor  edit-value="value.value" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-element-id="{{$ctrl.element.id}}" autosave-key="{{$ctrl.element._projectId + $ctrl.element._refId + $ctrl.element.id + 'index:' + $index}}"></ve-editor>
                    </div>
                    <div ng-if="!$ctrl.hasHtml(value.value)">
                        <textarea ng-model="value.value"></textarea>
                        <a ng-click="$ctrl.addHtml(value)"><i class="fa fa-html5"></i></a>
                    </div>
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
    <ve-editor edit-value="$ctrl.edit.documentation" mms-editor-api="$ctrl.editorApi" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" autosave-key="{{$ctrl.element._projectId + $ctrl.element._refId + $ctrl.element.id}}"></ve-editor>

    <h2 class="prop-title spec-view-type-heading">Metatypes</h2>
    <span class="elem-type-wrapper prop">
        <span class="elem-type">{{$ctrl.element.type}}</span>
        <div ng-repeat="type in $ctrl.element._appliedStereotypeIds" class="prop elem-type"><mms-transclude-name mms-element-id="{{type}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}" no-click="true"></mms-transclude-name></div>
    </span>
    <h2 class="prop-title">Location</h2>
    <span class="prop">{{$ctrl.qualifiedName}}</span>
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
    controller: SpecEditorController
}

veExt.component(SpecEditorComponent.selector,SpecEditorComponent);
