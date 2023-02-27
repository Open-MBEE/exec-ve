import angular from 'angular'

import { TransclusionService } from '@ve-components/transclusions'
import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller'

import { veComponents } from '@ve-components'

import { VePromiseReason } from '@ve-types/angular'
import { InsertApi, InsertData, InsertResolve } from '@ve-types/components'
import {
    ElementObject,
    ElementsResponse,
    TransclusionObject,
} from '@ve-types/mms'
import { VeModalComponent, VeModalController } from '@ve-types/view-editor'

export interface InsertTransclusionData extends InsertData {
    viewLink: boolean
}

class InsertTransclusionModalController
    extends VeModalControllerImpl<
        TransclusionObject,
        InsertResolve<InsertTransclusionData>
    >
    implements VeModalController
{
    protected linkTemplate: string = `
    <div class="transclude-modal-instructions">
    {{$ctrl.description}}
</div>
<div class="form-group" ng-show="$ctrl.viewLink"><br>
    <label>Link Text:</label>
    <div class="radio radio-with-label">
        <label><input type="radio" ng-model="$ctrl.linkType" ng-value="1">&nbsp;Auto-Numbering
            <a uib-tooltip="For links within current document, otherwise defaults to name" tooltip-trigger="mouseenter" tooltip-popup-delay="100"><i class="fa fa-info-circle"></i></a></label><br>
        <label><input type="radio" ng-model="$ctrl.linkType" ng-value="4">&nbsp;Auto-Numbering w/ Name</label><br>
            <a uib-tooltip="For links within current document, otherwise defaults to name" tooltip-trigger="mouseenter" tooltip-popup-delay="100"><i class="fa fa-info-circle"></i></a></label><br>
        <label><input type="radio" ng-model="$ctrl.linkType" ng-value="2">&nbsp;Name</label><br>
        <label><input type="radio" ng-model="$ctrl.linkType" ng-value="3">&nbsp;Custom&nbsp;
            <input type="text" ng-model="$ctrl.linkText" placeholder="custom title"/></label>
    </div>
</div>
`
    protected transclusionTemplate: string = `
    <div>
    <label>Property to view-cf</label><span class="star-mandatory">*</span>
    <div class="radio radio-with-label">
        <label><input type="radio" name="optradio" value="true" ng-click="$ctrl.toggleRadio('name')">Name</label><br>
        <label><input type="radio" name="optradio" value="true" ng-click="$ctrl.toggleRadio('doc')">Documentation</label>
        <label><input type="radio" name="optradio" value="true" ng-click="$ctrl.toggleRadio('val')">Value</label>
        
    </div>
    <label ng-show="$ctrl.showEditableOp" for="$ctrl.nonEditableCheckbox">
        <input id="$ctrl.nonEditableCheckbox" type="checkbox" ng-model="$ctrl.nonEditableCheckbox">&nbsp;Restrict editing
    </label>   
</div> 
`
    protected targetTemplate: string = `
    <div>
    <label>Target Element</label><span class="star-mandatory">*</span>
    <div>{{$ctrl.element.name}}</div><button class="btn btn-block btn-primary" ng-click="$ctrl.makeNewOrChoose()">Select or Create</button>
</div>    
`

    protected title: string = 'Insert cross reference'
    protected description: string =
        'Begin by searching for or creating an element, then click a field to view-cf.'
    protected searchExisting: boolean = true
    protected cf: TransclusionObject
    protected element: ElementObject
    protected requestName: boolean = false
    protected requestDocumentation: boolean = false
    protected viewLink: boolean
    protected nonEditableCheckbox: boolean = false
    protected showEditableOp: boolean = true
    protected oking: boolean
    protected cfType: string
    protected linkType: number
    protected linkText: string
    protected modalBody: JQuery<HTMLElement>
    protected previewEl: JQuery<HTMLElement> = $('<div></div>')
    protected insertApi: InsertApi<
        ElementObject,
        VePromiseReason<ElementsResponse<ElementObject>>
    >
    protected insertData: InsertData
    protected projectId: string
    protected refId: string
    protected orgId: string

    static $inject = [
        '$scope',
        '$compile',
        '$element',
        'growl',
        'TransclusionService',
    ]

    constructor(
        private $scope: angular.IScope,
        private $compile: angular.ICompileService,
        private $element: JQuery<HTMLElement>,
        private growl: angular.growl.IGrowlService,
        private transclusionSvc: TransclusionService
    ) {
        super()
    }

    $onInit(): void {
        this.projectId = this.resolve.getProjectId
        this.refId = this.resolve.getRefId ? this.resolve.getRefId : 'master'
        this.orgId = this.resolve.getOrgId ? this.resolve.getOrgId : null

        this.modalBody = this.$element.find('modal-body')
        this.viewLink = this.resolve.getInsertData.viewLink
        this.insertApi = {
            resolve: (result): void => {
                this.element = result
                this.selectOptions()
            },
            reject: (reason): void => {
                this.growl.error(reason.message)
                this.element = null
            },
        }
        this.insertData = this.resolve.getInsertData
        this.cf = {
            tag: '',
        }
    }

    $postLink(): void {
        this.modalBody.append($(this.targetTemplate))
    }

    public choose = (): void => {
        this.oking = true
        this.cf.element = this.element
        if (!this.viewLink) {
            this.cf.tag = this.transclusionSvc.createTransclusion(
                this.element,
                this.cfType,
                this.nonEditableCheckbox
            )
        } else {
            this.cf.tag = this.transclusionSvc.createViewLink(
                this.element,
                this.linkType,
                this.linkText
            )
        }
        this.oking = false
        this.modalInstance.close(this.cf)
    }

    public cancel = (): void => {
        this.modalInstance.dismiss()
    }

    public makeNewOrChoose = (): void => {
        this.modalBody.empty()
        this.modalBody.append(
            '<insert-element insert-data="::$ctrl.InsertData" insert-api="$ctrl.InsertApi" mms-project-id="{{$ctrl.projectId}}" ' +
                this.refId
                ? 'mms-ref-id="{{$ctrl.refId}}" '
                : '' + this.orgId
                ? 'mms-org-id="{{$ctrl.orgId}}" '
                : '' + '</insert-element>'
        )
        this.$compile(this.modalBody)(this.$scope.$new())
    }

    public selectOptions = (): void => {
        this.modalBody.empty()
        this.modalBody.append(this.targetTemplate)
        if (this.viewLink) {
            this.modalBody.append(this.linkTemplate)
        } else {
            this.modalBody.append(this.transclusionTemplate)
        }
    }

    public toggleRadio = (field: string): void => {
        this.cfType = field
        this.previewEl.empty()
        this.previewEl.append(
            $(
                this.transclusionSvc.createTransclusion(
                    this.element,
                    this.cfType,
                    true
                )
            )
        )
        this.$compile(this.previewEl)(this.$scope.$new())
        this.modalBody.append(this.previewEl)
    }
}

// Component for inserting cross reference
// Defines scope variables for html template and how to handle user click
// Also defines options for search interfaces -- see mmsSearch.js for more info
const InsertTransclusionModal: VeModalComponent = {
    selector: 'insertTransclusionModal',
    template: `
    <div>
    <div class="modal-header">
        <h4>Insert {{$ctrl.viewLink ? 'Link': 'view-cf'}}</h4>
    </div>
    <div class="modal-body"></div>
    <div class="modal-footer">
        <button class="btn btn-primary" ng-show="$ctrl.element" type="button" ng-click="choose()">Create {{$ctrl.viewLink ? 'Link': 'view-cf'}}<i ng-show="$ctrl.oking" class="fa fa-spin fa-spinner"></i></button>
        <button class="btn btn-default" ng-click="cancel()">Cancel</button>
    </div>
</div>
`,
    bindings: {
        modalInstance: '<',
        resolve: '<',
    },
    controller: InsertTransclusionModalController,
}

veComponents.component(
    InsertTransclusionModal.selector,
    InsertTransclusionModal
)
