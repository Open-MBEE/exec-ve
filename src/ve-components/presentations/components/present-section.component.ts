import { Presentation, ViewHtmlService, PresentationService } from '@ve-components/presentations'
import { ComponentService, ExtensionService } from '@ve-components/services'
import {ButtonBarApi, ButtonBarService} from '@ve-core/button-bar'
import { ImageService } from '@ve-utils/application'
import { EventService } from '@ve-utils/core'
import { SchemaService } from '@ve-utils/model-schema'

import { veComponents } from '@ve-components'

import { VePromise, VeQService } from '@ve-types/angular'
import { IPresentationComponentOptions } from '@ve-types/components/presentation'
import { InstanceValueObject, ViewInstanceSpec } from '@ve-types/mms'
import {presentations_buttons} from "@ve-components/presentations/presentations-buttons.config";

class PresentSectionController extends Presentation implements angular.IComponentController {
    //Local
    section: ViewInstanceSpec
    public bbApi: ButtonBarApi
    public bbId: string

    defaultTemplate = `
 <div ng-if="$ctrl.section.specification">
    <div ng-show="!$ctrl.isEditing">
        <h1 class="section-title h{{$ctrl.level}}">
            <span class="ve-view-number" ng-show="$ctrl.showNumbering">{{$ctrl.section._veNumber}}</span> {{$ctrl.section.name}}
        </h1>
    </div>
    <div ng-class="{'panel panel-default' : $ctrl.isEditing}">
        <div ng-show="$ctrl.isEditing" class="panel-heading clearfix no-print">
            <h3 class="panel-title pull-left">
                <div ng-class="{prop: $ctrl.isEditing}"><input class="form-control" type="text" ng-model="$ctrl.edit.name"/></div>
            </h3>
            <div class="btn-group pull-right">
                <button-bar class="transclude-panel-toolbar" button-id="$ctrl.bbId"></button-bar>
            </div>
        </div>
        <div ng-class="{'panel-body' : $ctrl.isEditing}">
            <add-pe-menu mms-view="$ctrl.section" index="-1" class="add-pe-button-container no-print"></add-pe-menu>
            <div ng-repeat="instanceVal in $ctrl.section.specification.operand track by instanceVal.instanceId">
                <view-pe mms-instance-val="instanceVal" mms-parent-section="$ctrl.section"></view-pe>
                <add-pe-menu mms-view="$ctrl.section" index="$index" class="add-pe-button-container no-print"></add-pe-menu>
            </div>
        </div>
    </div>
</div>
`

    static $inject = Presentation.$inject
    constructor(
        $q: VeQService,
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
        buttonBarSvc: ButtonBarService,
        extensionSvc: ExtensionService
    ) {
        super(
            $q,
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
            buttonBarSvc,
            extensionSvc
        )
    }
    save = (e: JQuery.ClickEvent): void => {
        if (e) e.stopPropagation()
        this.componentSvc.saveAction(this, this.$element, false)
    }

    startEdit = (): void => {
        this.componentSvc.startEdit(this, true, this.$element, null, true)
    }
    cancel = (e?: JQuery.ClickEvent): void => {
        if (e) e.stopPropagation()
        this.componentSvc.cancelAction(this, () => {}, this.$element)
    }
    delete = (): void => {
        this.componentSvc.deleteAction(this, this.bbApi, this.mmsViewPresentationElemCtrl.getParentSection())
    }
    protected bbInit = (api: ButtonBarApi): void => {
        api.addButton(this.buttonBarSvc.getButtonBarButton('presentation-element-save', this))
        api.addButton(this.buttonBarSvc.getButtonBarButton('presentation-element-cancel', this))
        api.addButton(this.buttonBarSvc.getButtonBarButton('presentation-element-delete', this))
        api.setPermission('presentation-element-delete', this.isDirectChildOfPresentationElement)
    }
    $onInit(): void {
        super.$onInit()
        this.section = this.element

        this.bbId = this.buttonBarSvc.generateBarId(`${this.section.id}_section`)
        this.bbApi = this.buttonBarSvc.initApi(this.bbId, this.bbInit, presentations_buttons)

        this.$element.on('click', (e) => {
            //should not do anything if section is not an instancespec
            if (this.startEdit) this.startEdit()
            if (this.view && this.mmsViewPresentationElemCtrl) this.mmsViewCtrl.transcludeClicked(this.section) //show instance spec if clicked
            e.stopPropagation()
        })

        if (this.section.specification && this.section.specification.operand) {
            const dups = this.presentationSvc.checkForDuplicateInstances(
                this.section.specification.operand as InstanceValueObject[]
            )
            if (dups.length > 0) {
                this.growl.warning('There are duplicates in this section, duplicates ignored!')
            }
        }
    }

    protected getContent = (): VePromise<string, string> => {
        return this.$q.resolve(this.defaultTemplate)
    }
}

const PresentSectionComponent: IPresentationComponentOptions = {
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
    require: {
        mmsViewCtrl: '?^^view',
        mmsViewPresentationElemCtrl: '?^^viewPe'
    }
}

veComponents.component(PresentSectionComponent.selector, PresentSectionComponent)
