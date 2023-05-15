import $ from 'jquery';

import { ExtensionService, ComponentService } from '@ve-components/services';
import { SpecTool } from '@ve-components/spec-tools';
import { ITransclusion, ITransclusionComponentOptions, Transclusion } from '@ve-components/transclusions';
import { ButtonBarApi, ButtonBarService } from '@ve-core/button-bar';
import { EditorService, editor_buttons } from '@ve-core/editor';
import { MathService, UtilsService, ImageService } from '@ve-utils/application';
import { EditService, EventService } from '@ve-utils/core';
import { ElementService, ValueService } from '@ve-utils/mms-api-client';
import { SchemaService } from '@ve-utils/model-schema';

import { PropertySpec, veComponents } from '@ve-components';

import { VeQService } from '@ve-types/angular';
import { ValueObject } from '@ve-types/mms';

/**
 * @ngdoc component
 * @name veComponents/TranscludeValController
 *
 * @requires {VeQService} $q
 * @requires {angular.IScope} $scope
 * @requires {angular.ICompileService} $compile
 * @requires {JQuery<HTMLElement>} $element
 * @requires {angular.growl.IGrowlService} growl
 * @requires {ComponentService} componentSvc
 * @requires {ElementService} elementSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc

 * @requires {AuthService} authSvc
 * @requires {EventService} eventSvc
 * @requires {MathService} mathSvc
 *
 * * Given an element id, puts in the element's name binding, if there's a parent
 * mmsView directive, will notify parent view of transclusion on init and name change,
 * and on click
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {bool} mmsWatchId set to true to not destroy element ID watcher
 * @param {boolean=false} nonEditable can edit inline or not
 */
export class TranscludeValController extends Transclusion implements ITransclusion {
    //Custom Bindings
    first: boolean;

    //Custom Require
    mmsSpecEditorCtrl: SpecTool;

    //Locals
    addValueType: string = 'LiteralString';
    values: ValueObject[] = [];
    editValues: ValueObject[] = [];
    propertySpec: PropertySpec;
    public bbApi: ButtonBarApi;
    public bars: string[];

    //Templates
    template = `
    <span ng-repeat="value in $ctrl.values | limitTo: ($ctrl.first ? 1 : $ctrl.values.length)" ng-switch on="value.type">
    <span ng-switch-when="LiteralInteger">{{::value.value}}</span>
    <span ng-switch-when="LiteralBoolean">{{::value.value}}</span>
    <span ng-switch-when="LiteralReal">{{::value.value | veRealNum}}</span>
    <span ng-switch-when="LiteralUnlimitedNatural">{{::value.value}}</span>
    <span ng-switch-when="ElementValue"><transclude-name no-click="true" mms-element-id="{{::value.elementId}}" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-commit-id="{{$ctrl.element._commitId}}"></transclude-name></span>
    <span ng-switch-when="InstanceValue"><transclude-name no-click="true" mms-element-id="{{::value.instanceId}}" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-commit-id="{{$ctrl.element._commitId}}"></transclude-name></span>
    <span ng-switch-when="OpaqueExpression">{{::value.body[0]}}</span>
    <span ng-switch-default>{{$ctrl.first ? $ctrl.values : value}}</span>
</span>
`;
    previewTemplate = `
    <div class="panel panel-info">
    <span ng-repeat="value in $ctrl.editValues" ng-switch on="value.type">
        <span ng-switch-when="LiteralInteger">{{value.value}}</span>
        <span ng-switch-when="LiteralBoolean">{{value.value}}</span>
        <span ng-switch-when="LiteralReal">{{value.value | veRealNum}}</span>
        <span ng-switch-when="LiteralUnlimitedNatural">{{value.value}}</span>
        <span ng-switch-when="ElementValue"><transclude-name no-click="true" mms-element-id="{{::value.elementId}}" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-commit-id="{{$ctrl.element._commitId}}"></transclude-name></span>
        <span ng-switch-when="InstanceValue"><transclude-name no-click="true" mms-element-id="{{::value.instanceId}}" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-commit-id="{{$ctrl.element._commitId}}"></transclude-name></span>
        <span ng-switch-when="OpaqueExpression">{{value.body[0]}}</span>
        <span ng-switch-default>{{value}}</span>
    </span>
</div>
`;
    editTemplate = `
    <div class="panel panel-default no-print">
    <div ng-if="!$ctrl.mmsSpecEditorCtrl" class="panel-heading clearfix">
        <h3 class="panel-title pull-left">Value : {{$ctrl.element.name}}</h3>
        <div class="btn-group pull-right">
            <button-bar class="transclude-panel-toolbar" button-id="$ctrl.bbId"></button-bar>
        </div>
    </div>
    <div ng-if="$ctrl.element.type === 'Property' || $ctrl.element.type === 'Port' || $ctrl.element.type === 'Slot' || $ctrl.element.type.includes('TaggedValue')">
        <div ng-if="!$ctrl.propertySpec.isEnumeration">
            <div ng-if="$ctrl.editValues.length == 0">
                <select ng-model="$ctrl.addValueType" ng-options="key for (key, value) in $ctrl.valueSvc.addValueTypes"></select>
                <button class="btn btn-sm btn-default" ng-click="$ctrl.addValue($event, addValueType)">Add</button>
            </div>
            <div ng-repeat="value in $ctrl.editValues" ng-switch on="value.type" ng-form="valForm">
                <div ng-switch-when="LiteralInteger" ng-class="{'has-error': valForm.$error.pattern}">
                    <div class="form-inline">
                    <input class="form-control ve-plain-input" type="number" ng-model="value.value" ng-pattern="/^-?\\d+$/" ng-blur="$ctrl.cleanupVal(value)">&nbsp;
                    <a ng-if="!$first" ng-click="$ctrl.removeVal($event, $index)"><i class="fa fa-close"></i></a>
                    </div>
                    <label class="control-label ve-error-icon" ng-show="valForm.$error.pattern">Not a valid integer</label>
                </div>
                <div ng-switch-when="LiteralUnlimitedNatural" ng-class="{'has-error': valForm.$error.pattern}">
                    <div class="form-inline">
                    <input class="form-control ve-plain-input" type="number" name="natVal" ng-model="value.value" ng-pattern="/^\\d+$/" ng-blur="$ctrl.cleanupVal(value)">&nbsp;
                    <a ng-if="!$first" ng-click="$ctrl.removeVal($event, $index)"><i class="fa fa-close"></i></a>
                    </div>
                    <label class="control-label ve-error-icon" ng-show="valForm.$error.pattern">Not a valid natural number</label>
                </div>
                <div ng-switch-when="LiteralBoolean"><input type="checkbox" ng-model="value.value">&nbsp;{{value.value}}&nbsp;<a ng-if="!$first" ng-click="$ctrl.removeVal($event, $index)"><i class="fa fa-close"></i></a></div>
                <div ng-switch-when="LiteralReal">
                    <div class="form-inline">
                        <input class="form-control ve-plain-input" type="number" ng-model="value.value" step="any"><a ng-if="!$first" ng-click="$ctrl.removeVal($event, $index)">&nbsp;<i class="fa fa-close"></i></a>
                    </div>
                </div>
                <div ng-switch-when="LiteralString">
                    <div ng-if="$ctrl.hasHtml(value.value)">
                        <editor ng-model="value.value" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-element-id="{{$ctrl.element.id}}" edit-field="value" edit-index="{{ $index }}"></editor>
                    </div>
                    <div ng-if="!$ctrl.hasHtml(value.value)">
                        <textarea ng-model="value.value"></textarea>
                        <a ng-click="$ctrl.addHtml($event, value)"><i class="fa fa-html5"></i></a>
                    </div>
                    <a ng-if="!$first" ng-click="$ctrl.removeVal($event, $index)"><i class="fa fa-close"></i></a>
                </div>
                <div ng-switch-when="OpaqueExpression">
                    <textarea ng-model="value.body[0]"></textarea><a ng-if="!$first" ng-click="$ctrl.removeVal($event, $index)"><i class="fa fa-close"></i></a>
                </div>
                <div ng-switch-default>Editing not supported for now</div>
            </div>
            <div ng-if="$ctrl.editValues.length != 0 && ($ctrl.propertySpec.isSlot || $ctrl.propertySpec.isTaggedValue)">
                <button class="btn btn-sm btn-default" ng-click="$ctrl.addValue($event, editValues[0].type)">Add</button>
            </div>
        </div>
        <div ng-if="$ctrl.propertySpec.isEnumeration && $ctrl.propertySpec.isSlot" ng-repeat="val in $ctrl.editValues">
            <select ng-model="val.instanceId" ng-options="el.id as el.name for el in $ctrl.propertySpec.options">
            </select><a ng-if="!$first" ng-click="$ctrl.removeVal($event, $index)"><i class="fa fa-close"></i></a>
        </div>
        <div ng-if="$ctrl.propertySpec.isEnumeration && $ctrl.propertySpec.isTaggedValue" ng-repeat="val in $ctrl.editValues">
            <select ng-model="val.elementId" ng-options="el.id as el.name for el in $ctrl.propertySpec.options">
            </select><a ng-if="!$first" ng-click="$ctrl.removeVal($event, $index)"><i class="fa fa-close"></i></a>
        </div>
        <div ng-if="($ctrl.propertySpec.isSlot || $ctrl.propertySpec.isTaggedValue || $ctrl.editValues.length == 0) && $ctrl.propertySpec.isEnumeration">
            <button class="btn btn-sm btn-default" ng-click="$ctrl.addEnumerationValue($event)">Add</button>
        </div>
    </div>

    <div ng-if="$ctrl.element.type === 'Constraint'">
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
</div>
`;

    static $inject = [...Transclusion.$inject, 'ValueService'];

    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        editorSvc: EditorService,
        editSvc: EditService,
        elementSvc: ElementService,
        utilsSvc: UtilsService,
        schemaSvc: SchemaService,
        eventSvc: EventService,
        mathSvc: MathService,
        extensionSvc: ExtensionService,
        buttonBarSvc: ButtonBarService,
        imageSvc: ImageService,
        private valueSvc: ValueService
    ) {
        super(
            $q,
            $scope,
            $compile,
            $element,
            growl,
            componentSvc,
            editorSvc,
            editSvc,
            elementSvc,
            utilsSvc,
            schemaSvc,
            eventSvc,
            mathSvc,
            extensionSvc,
            buttonBarSvc,
            imageSvc
        );
        this.cfType = 'val';
        this.cfTitle = 'Value';
        this.cfKind = 'Value';
        this.cfField = 'value';
        this.checkCircular = false;
    }

    $onInit(): void {
        super.$onInit();
        this.bbId = this.buttonBarSvc.generateBarId(`${this.mmsElementId}_${this.cfType}`);
        this.bbApi = this.buttonBarSvc.initApi(this.bbId, this.bbInit, editor_buttons);

        this.$element.on('click', (e) => {
            e.stopPropagation();
            if (this.noClick) return;

            if (!this.nonEditable && !this.isEditing) {
                this.startEdit();
            }
            if (this.mmsViewCtrl) {
                this.mmsViewCtrl.transcludeClicked(this.element);
            }
            if (this.nonEditable && this.mmsViewCtrl && this.mmsViewCtrl.isEditable()) {
                this.growl.warning('Cross Reference is not editable.');
            }
        });
    }

    public getContent = (preview?): angular.IPromise<string | HTMLElement[]> => {
        const deferred = this.$q.defer<string | HTMLElement[]>();
        const toCompileList: any[] = [];
        let areStrings = false;
        this.values = this.valueSvc.getValues(this.element);
        let values = this.values;
        let result = '';
        if (preview) {
            values = this.editValues;
        }
        for (let i = 0; i < values.length; i++) {
            if (values[i].type === 'LiteralString') {
                areStrings = true;
                let s = values[i].value as string;
                if (s.indexOf('<p>') === -1) {
                    s = s.replace('<', '&lt;');
                }
                toCompileList.push(s);
            } else {
                break;
            }
        }

        if (values.length === 0 || Object.keys(values[0]).length < 2) {
            result = '<span class="no-print placeholder">(no value)</span>';
            deferred.resolve(result);
        } else if (areStrings) {
            let toCompile = toCompileList.join(' ');
            if (toCompile === '' || this.emptyRegex.test(toCompile)) {
                result = '<span class="no-print placeholder">(no value)</span>';
                deferred.resolve(result);
            }
            toCompile = toCompile.replace(this.spacePeriod, '>.');
            toCompile = toCompile.replace(this.spaceSpace, '> ');
            toCompile = toCompile.replace(this.spaceComma, '>,');
            if (preview) {
                result = '<div class="panel panel-info">' + toCompile + '</div>';
            } else {
                result = toCompile;
            }

            if (!this.mmsGenerateForDiff) {
                const resultHtml = $('<p></p>').html(result).toArray();
                this.mathSvc.typeset(resultHtml).then(
                    () => deferred.resolve(resultHtml),
                    (reason) => {
                        deferred.reject(reason);
                    }
                );
            } else {
                deferred.resolve(result);
            }
        } else {
            if (preview) {
                deferred.resolve(this.previewTemplate);
            } else {
                if (this.first) {
                    this.values = [this.values[0]];
                }
                deferred.resolve(this.template);
            }
        }
        return deferred.promise;
    };

    protected recompile = (preview?: boolean): void => {
        if (!this.valueSvc.isValue(this.element)) {
            this.$element.empty();
            //TODO: Add reason/errorMessage handling here.
            this.$transcludeEl = $(
                '<annotation mms-element-id="::elementId" mms-recent-element="::recentElement" mms-type="::type" mms-field="::field"></annotation>'
            );
            this.$element.append(this.$transcludeEl);
            this.$compile(this.$transcludeEl)(
                Object.assign(this.$scope.$new(), {
                    elementId: this.element.id,
                    recentElement: this.element,
                    type: 'transclusion',
                    field: this.cfField,
                })
            );
            return;
        }
        if (!this.nonEditable && this.mmsSpecEditorCtrl && !this.edit) {
            this.startEdit();
        } else {
            this.defaultRecompile(preview);
        }
    };

    protected startEdit(): void {
        if (this.propertySpec) {
            super.startEdit(() => {
                this.editValues = this.valueSvc.getValues(this.edit.element);
            });
            return;
        }
        this.valueSvc.getPropertySpec(this.element).then(
            (value) => {
                this.propertySpec = value;
                super.startEdit(() => {
                    this.editValues = this.valueSvc.getValues(this.edit.element);
                });
            },
            (reason) => {
                this.growl.error('Failed to get property spec: ' + reason.message);
            }
        );
    }

    public save = (e: JQuery.ClickEvent): void => {
        e.stopPropagation();
        this.saveAction(false);
    };

    public saveC = (e: JQuery.ClickEvent): void => {
        e.stopPropagation();
        this.saveAction(true);
    };

    public cancel = (e: JQuery.ClickEvent): void => {
        e.stopPropagation();
        this.cancelAction();
    };

    public addValue(e: JQueryEventObject): void {
        e.stopPropagation();
        const newVal = this.valueSvc.addValue(this.edit, this.addValueType);
        if (this.editValues.length == 0) {
            this.editValues.push(newVal);
        }
    }

    public addEnumerationValue(e: JQueryEventObject): void {
        e.stopPropagation();
        const enumValue = this.valueSvc.addEnumerationValue(this.propertySpec, this.edit);
        this.editValues.push(enumValue);
        if (this.element.type == 'Property' || this.element.type == 'Port') {
            this.edit.element.defaultValue = enumValue;
        }
    }

    public removeVal = (e: JQueryEventObject, i: number): void => {
        e.stopPropagation();
        this.editValues.splice(i, 1);
    };
}

export const TranscludeValComponent: ITransclusionComponentOptions = {
    selector: 'transcludeVal',
    template: `<div></div>`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        nonEditable: '<',
        noClick: '<',
        mmsCfLabel: '@',
        mmsGenerateForDiff: '<',
        mmsCallback: '&',
        mmsWatchId: '<',
        first: '<',
    },
    transclude: true,
    require: {
        mmsViewCtrl: '?^view',
        mmsViewPresentationElemCtrl: '?^viewPe',
        mmsSpecEditorCtrl: '?^specEditor',
    },
    controller: TranscludeValController,
};

veComponents.component(TranscludeValComponent.selector, TranscludeValComponent);
