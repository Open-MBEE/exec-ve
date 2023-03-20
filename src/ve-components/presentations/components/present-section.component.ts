import {
    Presentation,
    ViewHtmlService,
    PresentationService,
} from '@ve-components/presentations'
import { ComponentService, ExtensionService } from '@ve-components/services'
import { ButtonBarService } from '@ve-core/button-bar'
import { ImageService } from '@ve-utils/application'
import { EventService } from '@ve-utils/core'
import { SchemaService } from '@ve-utils/model-schema'

import { veComponents } from '@ve-components'

import { VePromise, VeQService } from '@ve-types/angular'
import { IPresentationComponentOptions } from '@ve-types/components/presentation'
import { InstanceValueObject, ViewInstanceSpec } from '@ve-types/mms'

class PresentSectionController extends Presentation {
    //Local
    section: ViewInstanceSpec
    isDirectChildOfPresentationElement: boolean

    defaultTemplate = `
    <div>
    <div ng-if="!$ctrl.noTitle">
        <h1 class="section-title h{{$ctrl.level}}">
            <span class="ve-view-number" ng-show="$ctrl.showNumbering">{{$ctrl.number}}</span> 
            <transclude-name mms-element-id="{{$ctrl.section.id}}" mms-project-id="{{$ctrl.section._projectId}}" mms-ref-id="{{$ctrl.section._refId}}" mms-watch-id="true"></transclude-name>
        </h1>
        <div class="ve-secondary-text last-modified no-print">
          Last Modified: {{$ctrl.modified | date:'M/d/yy h:mm a'}} by <b ng-if="$ctrl.modifier.email">{{ $ctrl.modifier.email }}</b><b ng-if="!$ctrl.modifier.email">{{ $ctrl.modifier }}</b>
        </div>
    </div>
    <i ng-hide="$ctrl.section" class="fa fa-2x fa-spinner fa-spin"></i>

    <add-pe-menu mms-view="$ctrl.section" index="-1" class="add-pe-button-container no-print"></add-pe-menu>

    <div ng-if="$ctrl.section.specification">
        <!-- Cant use track by instanceVal.instance b/c of possible duplicate entries -->
        <div ng-repeat="instanceVal in $ctrl.section.specification.operand track by instanceVal.instanceId"> 
            <view-pe mms-instance-val="instanceVal"></view-pe>
            <add-pe-menu mms-view="$ctrl.section" index="$index" class="add-pe-button-container no-print"></add-pe-menu>
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

    $onInit(): void {
        super.$onInit()
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
                this.section.specification.operand as InstanceValueObject[]
            )
            if (dups.length > 0) {
                this.growl.warning(
                    'There are duplicates in this section, duplicates ignored!'
                )
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
    required: {
        mmsViewPresentationElemCtrl: '?^viewPe',
        mmsViewCtrl: '?^view',
    },
}

veComponents.component(
    PresentSectionComponent.selector,
    PresentSectionComponent
)
