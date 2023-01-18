import angular from 'angular'
import $ from 'jquery'

import { ExtensionService, ComponentService } from '@ve-components/services'
import { SpecService, SpecTool } from '@ve-components/spec-tools'
import { ITransclusion, Transclusion } from '@ve-components/transclusions'
import {
    ButtonBarApi,
    ButtonBarService,
    IButtonBarButton,
} from '@ve-core/button-bar'
import { AuthService, ElementService } from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import {
    MathJaxService,
    UtilsService,
    EventService,
    ImageService,
} from '@ve-utils/services'

import { PropertySpec, veComponents } from '@ve-components'

import { VeComponentOptions, VeQService } from '@ve-types/angular'
import { SlotObject, ValueObject } from '@ve-types/mms'

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
 * @requires {MathJaxService} mathJaxSvc
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
export class TranscludeValController
    extends Transclusion
    implements ITransclusion
{
    //Custom Bindings
    first: boolean

    //Custom Require
    mmsSpecEditorCtrl: SpecTool

    //Locals
    values: ValueObject[] = []
    editValues: ValueObject[] = []
    propertySpec: PropertySpec
    public bbApi: ButtonBarApi
    public bars: string[]
    protected buttons: IButtonBarButton[] = []

    //Templates
    valTemplate = `
    <span ng-repeat="value in $ctrl.values | limitTo: ($ctrl.first ? 1 : $ctrl.values.length)" ng-switch on="value.type">
    <span ng-switch-when="LiteralInteger">{{::value.value}}</span>
    <span ng-switch-when="LiteralBoolean">{{::value.value}}</span>
    <span ng-switch-when="LiteralReal">{{::value.value | veRealNum}}</span>
    <span ng-switch-when="LiteralUnlimitedNatural">{{::value.value}}</span>
    <span ng-switch-when="ElementValue"><transclude-name no-click="true" mms-element-id="{{::value.elementId}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}" mms-commit-id="{{$ctrl.mmsCommitId}}"></transclude-name></span>
    <span ng-switch-when="InstanceValue"><transclude-name no-click="true" mms-element-id="{{::value.instanceId}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}" mms-commit-id="{{$ctrl.mmsCommitId}}"></transclude-name></span>
    <span ng-switch-when="OpaqueExpression">{{::value.body[0]}}</span>
    <span ng-switch-default>{{$ctrl.first ? $ctrl.values : value}}</span>
</span>
`
    previewTemplate = `
    <div class="panel panel-info">
    <span ng-repeat="value in $ctrl.editValues" ng-switch on="value.type">
        <span ng-switch-when="LiteralInteger">{{value.value}}</span>
        <span ng-switch-when="LiteralBoolean">{{value.value}}</span>
        <span ng-switch-when="LiteralReal">{{value.value | veRealNum}}</span>
        <span ng-switch-when="LiteralUnlimitedNatural">{{value.value}}</span>
        <span ng-switch-when="ElementValue"><transclude-name no-click="true" mms-element-id="{{::value.elementId}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}" mms-commit-id="{{$ctrl.mmsCommitId}}"></transclude-name></span>
        <span ng-switch-when="InstanceValue"><transclude-name no-click="true" mms-element-id="{{::value.instanceId}}" mms-element-id="{{::value.elementId}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}" mms-commit-id="{{$ctrl.mmsCommitId}}"></transclude-name></span>
        <span ng-switch-when="OpaqueExpression">{{value.body[0]}}</span>
        <span ng-switch-default>{{value}}</span>
    </span>
</div>
`
    editTemplate = `
    <div class="panel panel-default no-print">
    <div ng-if="!$ctrl.mmsSpecEditorCtrl" class="panel-heading clearfix">
        <h3 class="panel-title pull-left">Value : {{element.name}}</h3>
        <div class="btn-group pull-right">
            <button-bar class="transclude-panel-toolbar" buttons="buttons" mms-bb-api="bbApi"></button-bar>
        </div>
    </div>
    <div ng-if="$ctrl.element.type === 'Property' || $ctrl.element.type === 'Port' || $ctrl.element.type === 'Slot'">
        <h2 class="prop-title spec-view-value-heading">Property Value</h2>
        <div ng-if="!$ctrl.propertySpec.isEnumeration">
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
                    <label class="control-label ve-error-icon" ng-show="valForm.$error.pattern">Not a valid integer</label>
                </div>
                <div ng-switch-when="LiteralUnlimitedNatural" ng-class="{'has-error': valForm.$error.pattern}">
                    <div class="form-inline">
                    <input class="form-control ve-plain-input" type="number" name="natVal" ng-model="value.value" ng-pattern="/^\\d+$/" ng-blur="$ctrl.cleanupVal(value)">&nbsp;
                    <a ng-if="!$first" ng-click="$ctrl.removeVal($index)"><i class="fa fa-close"></i></a>
                    </div>
                    <label class="control-label ve-error-icon" ng-show="valForm.$error.pattern">Not a valid natural number</label>
                </div>
                <div ng-switch-when="LiteralBoolean"><input type="checkbox" ng-model="value.value">&nbsp;{{value.value}}&nbsp;<a ng-if="!$first" ng-click="$ctrl.removeVal($index)"><i class="fa fa-close"></i></a></div>
                <div ng-switch-when="LiteralReal">
                    <div class="form-inline">
                        <input class="form-control ve-plain-input" type="number" ng-model="value.value" step="any"><a ng-if="!$first" ng-click="$ctrl.removeVal($index)">&nbsp;<i class="fa fa-close"></i></a>
                    </div>
                </div>
                <div ng-switch-when="LiteralString">
                    <div ng-if="$ctrl.hasHtml(value.value)">
                        <editor ng-model="value.value" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" mms-element-id="{{$ctrl.element.id}}" autosave-key="{{$ctrl.element._projectId + $ctrl.element._refId + $ctrl.element.id + 'index:' + $index}}"></editor>
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
            <div ng-if="$ctrl.propertySpec.editValues.length != 0 && $ctrl.propertySpec.isSlot">
                <button class="btn btn-sm btn-default" ng-click="$ctrl.addValue(editValues[0].type)">Add</button>
            </div>
        </div>
        <div ng-if="$ctrl.propertySpec.isEnumeration" ng-repeat="val in $ctrl.editValues">
            <select ng-model="val.instanceId" ng-options="el.id as el.name for el in $ctrl.propertySpec.options">
            </select><a ng-if="!$first" ng-click="$ctrl.removeVal($index)"><i class="fa fa-close"></i></a>
        </div>
        <div ng-if="($ctrl.propertySpec.isSlot || $ctrl.editValues.length == 0) && $ctrl.propertySpec.isEnumeration">
            <button class="btn btn-sm btn-default" ng-click="$ctrl.addEnumerationValue()">Add</button>
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
`

    static $inject = [...Transclusion.$inject, 'SpecService']

    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        elementSvc: ElementService,
        utilsSvc: UtilsService,
        schemaSvc: SchemaService,
        authSvc: AuthService,
        eventSvc: EventService,
        mathJaxSvc: MathJaxService,
        extensionSvc: ExtensionService,
        buttonBarSvc: ButtonBarService,
        imageSvc: ImageService,
        private specSvc: SpecService
    ) {
        super(
            $q,
            $scope,
            $compile,
            $element,
            growl,
            componentSvc,
            elementSvc,
            utilsSvc,
            schemaSvc,
            authSvc,
            eventSvc,
            mathJaxSvc,
            extensionSvc,
            buttonBarSvc,
            imageSvc
        )
        this.cfType = 'val'
        this.cfTitle = 'values'
        this.cfKind = 'Value'
        this.checkCircular = false
    }

    $onInit(): void {
        super.$onInit()
        this.$element.on('click', (e) => {
            if (this.startEdit && !this.nonEditable) {
                this.startEdit()
            }
            if (this.mmsViewCtrl) {
                this.mmsViewCtrl.transcludeClicked(this.element)
            }
            if (
                this.nonEditable &&
                this.mmsViewCtrl &&
                this.mmsViewCtrl.isEditable()
            ) {
                this.growl.warning('Cross Reference is not editable.')
            }
            e.stopPropagation()
        })

        if (this.mmsViewCtrl) {
            this.isDirectChildOfPresentationElement =
                this.componentSvc.isDirectChildOfPresentationElementFunc(
                    this.$element,
                    this.mmsViewCtrl
                )
            this.view = this.mmsViewCtrl.getView()

            this.startEdit = (): void => {
                this._startEdit(this.mmsViewCtrl.isEditable())
            }
        }
        if (this.mmsSpecEditorCtrl) {
            this.startEdit = (): void => {
                this._startEdit(this.specSvc.editable)
            }
        }
    }

    public getContent = (
        preview?
    ): angular.IPromise<string | HTMLElement[]> => {
        const deferred = this.$q.defer<string | HTMLElement[]>()

        this.isEditing = false
        this.elementSaving = false
        const toCompileList: any[] = []
        let areStrings = false
        this.values = this.componentSvc.setupValCf(this.element)
        let values = this.values
        let result = ''
        if (preview) {
            values = this.editValues
        } else {
            this.isEditing = false
        }
        for (let i = 0; i < values.length; i++) {
            if (values[i].type === 'LiteralString') {
                areStrings = true
                let s = values[i].value as string
                if (s.indexOf('<p>') === -1) {
                    s = s.replace('<', '&lt;')
                }
                toCompileList.push(s)
            } else {
                break
            }
        }

        if (values.length === 0 || Object.keys(values[0]).length < 2) {
            result = '<span class="no-print placeholder">(no value)</span>'
            deferred.resolve(result)
        } else if (areStrings) {
            let toCompile = toCompileList.join(' ')
            if (toCompile === '' || this.emptyRegex.test(toCompile)) {
                result = '<span class="no-print placeholder">(no value)</span>'
                deferred.resolve(result)
            }
            toCompile = toCompile.replace(this.spacePeriod, '>.')
            toCompile = toCompile.replace(this.spaceSpace, '> ')
            toCompile = toCompile.replace(this.spaceComma, '>,')
            if (preview) {
                result = '<div class="panel panel-info">' + toCompile + '</div>'
            } else {
                result = toCompile
            }

            if (!this.mmsGenerateForDiff) {
                const resultHtml = $('<p></p>').html(result).toArray()
                this.mathJaxSvc.typeset(resultHtml).then(
                    () => deferred.resolve(resultHtml),
                    (reason) => {
                        deferred.reject(reason)
                    }
                )
            } else {
                deferred.resolve(result)
            }
        } else {
            if (preview) {
                deferred.resolve(this.previewTemplate)
            } else {
                if (this.first) {
                    this.values = [this.values[0]]
                }
                deferred.resolve(this.valTemplate)
            }
        }
        return deferred.promise
    }

    protected recompile = (preview?: boolean): void => {
        if (!this.nonEditable && this.mmsSpecEditorCtrl && !this.edit) {
            this._startEdit(this.specSvc.editable)
        } else {
            super.recompile(preview)
        }
    }

    private _startEdit = (isEditable: boolean): void => {
        let id = this.element.typeId
        if (this.element.type === 'Slot') {
            id = (this.element as SlotObject).definingFeatureId
        }
        if (
            !id ||
            (this.propertySpec.isEnumeration && this.propertySpec.options)
        ) {
            this.componentSvc.startEdit(
                this,
                isEditable,
                this.$element,
                this.editTemplate,
                false
            )
            return
        }
        this.componentSvc.getPropertySpec(this.element).then(
            (value) => {
                this.propertySpec = value
                this.componentSvc.setupValEditFunctions(this)
                this.componentSvc.startEdit(
                    this,
                    isEditable,
                    this.$element,
                    this.editTemplate,
                    false
                )
            },
            (reason) => {
                this.componentSvc.startEdit(
                    this,
                    isEditable,
                    this.$element,
                    this.editTemplate,
                    false
                )
                this.growl.error(
                    'Failed to get property spec: ' + reason.message
                )
            }
        )
    }

    public save = (e: JQuery.ClickEvent): void => {
        e.stopPropagation()
        this.componentSvc.saveAction(this, this.$element, false)
    }

    public saveC = (): void => {
        this.componentSvc.saveAction(this, this.$element, true)
    }

    public cancel = (e: JQuery.ClickEvent): void => {
        e.stopPropagation()
        this.componentSvc.cancelAction(this, this.recompile, this.$element)
    }
}

export const TranscludeValComponent: VeComponentOptions = {
    selector: 'transcludeVal',
    template: `<div></div>`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        nonEditable: '<',
        mmsCfLabel: '@',
        mmsGenerateForDiff: '<',
        mmsCallback: '&',
        first: '<',
    },
    transclude: true,
    require: {
        mmsViewCtrl: '?^view',
        mmsViewPresentationElemCtrl: '?^viewPe',
        mmsSpecEditorCtrl: '?^specEditor',
    },
    controller: TranscludeValController,
}

veComponents.component(TranscludeValComponent.selector, TranscludeValComponent)
