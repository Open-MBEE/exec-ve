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
import {handleChange} from "../../../ve-utils/utils/change.util";
import {SpecService} from "../services/Spec.service";
import {VeComponentOptions} from "../../../ve-utils/types/view-editor";
import {ElementObject, ElementsRequest} from "../../../ve-utils/types/mms";

import {ContentToolController} from "../content-tool";
import {ContentToolControllerImpl} from "../content-tool.controller";
import {ToolbarService} from "../services/Toolbar.service";

import {veCore} from "../../../ve-core/ve-core.module";


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


class ContentInspectorController extends ContentToolControllerImpl implements ContentToolController  {

        static $inject = ContentToolControllerImpl.$inject;

        constructor($scope: angular.IScope, $element: JQuery<HTMLElement>,
                    growl: angular.growl.IGrowlService, transclusionSvc: TransclusionService, uRLSvc: URLService,
                    authSvc: AuthService, elementSvc: ElementService, utilsSvc: UtilsService,
                    viewSvc: ViewService, permissionsSvc: PermissionsService,
                    eventSvc: EventService, specSvc: SpecService, toolbarSvc: ToolbarService) {
            super($scope,$element,growl,transclusionSvc,uRLSvc,authSvc,elementSvc,utilsSvc,viewSvc,permissionsSvc,eventSvc,specSvc,toolbarSvc)

            this.contentType = _.kebabCase(ContentInspectorComponent.selector)
            this.contentTitle = "Preview Element";
            this.contentKind = "document";
        }

        protected config = () => {
            if (this.mmsElement) {
                this.element = this.mmsElement;
                this.modifier = this.getModifier(this.mmsElement._modifier);
                this.transclusionSvc.setupValCf(this);
                this.specSvc.editable = false;
                return;
            }
            this.subs.push(this.eventSvc.$on(this.contentType, () => {
                this.specSvc.setEditing(false);
                this.specSvc.cleanUpSaveAll();
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

let ContentInspectorComponent: VeComponentOptions = {
    selector: 'contentInspector',
    template: `
<!-- HTML for view mode -->
<h4 class="right-pane-title">{{$ctrl.spTitle}}</h4>
<form class="form-horizontal">
    <div class="form-group">
        <label class="col-sm-3 control-label">Edits ({{$ctrl.openEdits}}):</label>
        <div class="col-sm-9">
            <select class="form-control"
                ng-options="eid as edit.type + ': ' + edit.name for (eid, edit) in $ctrl.edits"
                ng-model="$ctrl.specSvc.tracker.etrackerSelected" ng-change="$ctrl.etrackerChange()">
            </select>
        </div>
    </div>
</form>
<hr class="spec-title-divider">
<div class="reading">
    <p class="text-center" ng-show="gettingSpec"><i class="fa fa-3x fa-spin fa-spinner"></i></p>

    <div ng-hide="gettingSpec">
        <div class="text-warning" ng-if="$ctrl.mmsDisplayOldContent">
            <b> Element not found:</b> displaying last found content
        </div>
        <h1 class="prop element-title" ng-class="{'mms-error': $ctrl.mmsDisplayOldContent}"><span class="{{ $ctrl.elementTypeClass }}"></span>{{$ctrl.element.name}}</h1>
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
        mmsDisplayOldContent: '<?'
    },
    controller: ContentInspectorController
}

veCore.component(ContentInspectorComponent.selector,ContentInspectorComponent);
