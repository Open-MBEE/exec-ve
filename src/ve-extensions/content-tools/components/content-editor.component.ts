import * as angular from "angular";
import _ from "lodash";

import { TransclusionService } from "../../transclusions/Transclusion.service";
import { URLService } from "src/ve-utils/services/URL.provider";
import {AuthService} from "../../../ve-utils/services/Authorization.service";
import {ElementService} from "../../../ve-utils/services/Element.service";
import {UtilsService} from "../../../ve-utils/services/Utils.service";
import { ViewService } from "src/ve-utils/services/View.service";
import { PermissionsService } from "src/ve-utils/services/Permissions.service";
import {EventService} from "../../../ve-utils/services/Event.service";
import {SpecService} from "../services/Spec.service";
import {VeComponentOptions} from "../../../ve-utils/types/view-editor";
import {ElementObject, ElementsRequest} from "../../../ve-utils/types/mms";
import {veCore} from "../../../ve-core/ve-core.module";
import {ContentToolControllerImpl} from "../content-tool.controller";
import {ContentToolController} from "../content-tool";
import {ToolbarService} from "../services/Toolbar.service";
import {EditService} from "../../../ve-utils/services/Edit.service";

/**
 * @ngdoc directive
 * @name veCore.directive:mmsSpec
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
 angular.module('app', ['veCore'])
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


class ContentEditorController extends ContentToolControllerImpl implements ContentToolController {

    static $inject = [...ContentToolControllerImpl.$inject, 'EditService'];

    constructor($scope: angular.IScope, $element: JQuery<HTMLElement>,
                growl: angular.growl.IGrowlService, transclusionSvc: TransclusionService, uRLSvc: URLService,
                authSvc: AuthService, elementSvc: ElementService, utilsSvc: UtilsService,
                viewSvc: ViewService, permissionsSvc: PermissionsService,
                eventSvc: EventService, specSvc: SpecService, toolbarSvc: ToolbarService, private editSvc: EditService) {
        super($scope,$element,growl,transclusionSvc,uRLSvc,authSvc,elementSvc,utilsSvc,viewSvc,permissionsSvc,eventSvc,specSvc,toolbarSvc)
        this.contentType = _.kebabCase(ContentEditorComponent.selector)
        this.contentTitle = "Edit Element";
        this.contentKind = 'document'
    }

    config = () => {
        if (this.editSvc.openEdits() > 0) {
            this.tbApi.setIcon('content-editor', 'fa-edit-asterisk');
            this.tbApi.setPermission('content-editor-saveall', true);
        }

        if (this.mmsElement) {
            this.element = this.mmsElement;
            this.modifier = this.getModifier(this.mmsElement._modifier);
            this.transclusionSvc.setupValCf(this);
            this.specSvc.editable = false;
            return;
        }
        this.subs.push(this.eventSvc.$on(this.contentType, () => {
            this.specSvc.setEditing(true);
            var editOb = this.specSvc.getEdits();
            if (editOb) {
                var key = editOb.id + '|' + editOb._projectId + '|' + editOb._refId;
                this.specSvc.tracker.etrackerSelected = key;
                this.editSvc.addOrUpdate(key, editOb);
                this.specSvc.cleanUpSaveAll();
            }
            this.elementSvc.isCacheOutdated(editOb)
                .then((data) => {
                    let server = (data.server) ? <Date>data.server._modified : new Date();
                    let cache = (data.cache) ? <Date>data.cache._modified : new Date()
                    if (data.status && server > cache)
                        this.growl.error('This element has been updated on the server. Please refresh the page to get the latest version.');
                });
        }));
    }

    // $onChanges(onChangesObj: angular.IOnChangesObject) {
    //     handleChange(onChangesObj, 'mmsElementId', this.changeElement);
    //     handleChange(onChangesObj, 'mmsProjectId', this.changeElement);
    //     handleChange(onChangesObj, 'mmsCommitId', this.changeElement);
    //     handleChange(onChangesObj, 'mmsRefId', this.changeElement);
    // }

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
     * @name veCore.directive:mmsSpec#changeElement
     * @methodOf veCore.directive:mmsSpec
     *
     * @description
     * change element in the spec, this would reevaluate whether it's editable
     *
     * @param {string} newVal new element id
     */
    public changeElement = (newVal, oldVal) => {
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
        var reqOb = {elementId: this.specSvc.specInfo.id, projectId: this.mmsProjectId, refId: this.mmsRefId, commitId: this.mmsCommitId, extended: extended};
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
                this.transclusionSvc.setupValCf(this);
                if (!this.mmsCommitId || this.mmsCommitId === 'latest') {
                    this.elementSvc.search(reqOb, {
                        size: 1,
                        params: {id: data.id, _projectId: data._projectId}
                    }, 2).then((searchResultOb) => {
                        if (newVal !== this.lastid) {
                            return;
                        }
                        var searchResult = searchResultOb.elements;
                        if (searchResult && searchResult.length == 1 && searchResult[0].id === data.id && searchResult[0]._relatedDocuments && searchResult[0]._relatedDocuments.length > 0) {
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
                                this.transclusionSvc.getPropertySpec(this.element)
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
                this.getQualifiedName()
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
     * @name veCore.directive:mmsSpec#save
     * @methodOf veCore.directive:mmsSpec
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
        return this.transclusionSvc.save(this.edit, this.editorApi, this, false);
    };

    public hasHtml(s) {
        return this.transclusionSvc.hasHtml(s);
    };

    public getQualifiedName() {
        let elementOb = this.element
        if (this.edit !== undefined)
            elementOb = this.edit
        const reqOb: ElementsRequest = {
            commitId: (elementOb._commitId) ? elementOb._commitId : "latest",
            projectId: elementOb._projectId,
            refId: elementOb._refId,
            elementId: elementOb.id
        }
        this.elementSvc.getElementQualifiedName(reqOb).then((result: string) => {
            this.qualifiedName = result;
        })
    }






}

let ContentEditorComponent: VeComponentOptions = {
    selector: 'contentEditor',
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
        mmsDisplayOldContent: '<?'
    },
    controller: ContentEditorController
}

veCore.component(ContentEditorComponent.selector,ContentEditorComponent);
