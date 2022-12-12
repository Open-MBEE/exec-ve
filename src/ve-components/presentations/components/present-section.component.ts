import angular from 'angular'

import {
    Presentation,
    ViewHtmlService,
    PresentationService,
} from '@ve-components/presentations'
import { ComponentService } from '@ve-components/services'
import { ButtonBarService } from '@ve-core/button-bar'
import { SchemaService } from '@ve-utils/model-schema'
import { EventService, ImageService } from '@ve-utils/services'

import { veComponents } from '@ve-components'

import { PresentationComponentOptions } from '@ve-types/components'
import { ElementObject } from '@ve-types/mms'

class PresentSectionController extends Presentation {
    //Local
    section: ElementObject
    isDirectChildOfPresentationElement: boolean
    sectionInstanceVals: any[] = []

    defaultTemplate = `
    <div ng-if="section.specification">
    <div ng-show="!$ctrl.isEditing">
        <h1 class="section-title h{{$ctrl.level}}" ng-hide="$ctrl.inPreviewMode">{{$ctrl.number}} {{$ctrl.section.name}}</h1>
        <div ng-show="$ctrl.inPreviewMode"><h1 class="section-title h{{level}}">{{$ctrl.number}} {{$ctrl.edit.name}}</h1></div>
    </div>
    <div ng-class="{'panel panel-default' : $ctrl.isEditing}">
        <div ng-class="{'no-display' : ! $ctrl.isEditing}" class="panel-heading clearfix no-print">
            <h3 class="panel-title pull-left">
                <div ng-class="{prop: $ctrl.isEditing}"><input class="form-control" type="text" ng-model="$ctrl.edit.name"/></div>
            </h3>
            <div class="btn-group pull-right">
                <button-bar class="transclude-panel-toolbar" mms-bb-api="$ctrl.bbApi"></button-bar>
            </div>
        </div>
        <div ng-class="{'panel-body' : $ctrl.isEditing}">
            <add-pe-menu class="add-pe-button-container no-print" mms-view="$ctrl.view" index="-1"></add-pe-menu>
                <div ng-repeat="instanceVal in $ctrl.section.specification.operand track by instanceVal.instanceId">
                    <view-pe mms-instance-val="::$ctrl.instanceVal" mms-parent-section="::$ctrl.section"></view-pe>
                    <add-pe-menu class="add-pe-button-container no-print" mms-view="$ctrl.view" index="$index"></add-pe-menu>
                </div>
            </div>
    </div>
</div>
    `

    static $inject = Presentation.$inject
    constructor(
        $element: JQuery<HTMLElement>,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        growl: angular.growl.IGrowlService,
        schemaSvc: SchemaService,
        viewHtmlSvc: ViewHtmlService,
        presentationSvc: PresentationService,
        componentSvc: ComponentService,
        eventSvc: EventService,
        imageSvc: ImageService,
        buttonBarSvc: ButtonBarService
    ) {
        super(
            $element,
            $scope,
            $compile,
            growl,
            schemaSvc,
            viewHtmlSvc,
            presentationSvc,
            componentSvc,
            eventSvc,
            imageSvc,
            buttonBarSvc
        )
    }

    protected config = (): void => {
        this.section = this.element

        this.$element.on('click', (e) => {
            //should not do anything if section is not an instancespec
            if (this.startEdit) this.startEdit()
            if (this.view && this.mmsViewPresentationElemCtrl)
                this.mmsViewCtrl.transcludeClicked(this.section) //show instance spec if clicked
            e.stopPropagation()
        })

        if (this.section.specification && this.section.specification.operand) {
            const dups = this.presentationSvc.checkForDuplicateInstances(
                this.section.specification.operand
            )
            if (dups.length > 0) {
                this.growl.warning(
                    'There are duplicates in this section, duplicates ignored!'
                )
            }
        }

        if (this.mmsViewCtrl && this.mmsViewPresentationElemCtrl) {
            this.save = () => {
                this.componentSvc.saveAction(this, this.$element, false)
            }

            this.saveC = () => {
                this.componentSvc.saveAction(this, this.$element, true)
            }

            this.cancel = () => {
                this.componentSvc.cancelAction(
                    this,
                    this.recompile,
                    this.$element
                )
            }

            this.delete = () => {
                this.componentSvc.deleteAction(
                    this,
                    this.bbApi,
                    this.mmsViewPresentationElemCtrl.getParentSection()
                )
            }

            this.startEdit = () => {
                this.componentSvc.startEdit(
                    this,
                    this.mmsViewCtrl.isEditable(),
                    this.$element,
                    null,
                    this.section
                )
            }

            this.preview = () => {
                this.componentSvc.previewAction(
                    this,
                    this.recompile,
                    this.$element
                )
            }
        }
    }

    protected getContent = () => {
        return this.defaultTemplate
    }
}

const PresentSectionComponent: PresentationComponentOptions = {
    selector: 'presentSection',
    bindings: {
        peObject: '<',
        element: '<',
        peNumber: '<',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
    },
    template: `<div></div>`,
    controller: PresentSectionController,
    required: {
        mmsViewPresentationElemCtrl: '?^viewPe',
        mmsViewCtrl: '?^view',
    },
}

veComponents.component(
    PresentSectionComponent.selector,
    PresentSectionComponent
)
