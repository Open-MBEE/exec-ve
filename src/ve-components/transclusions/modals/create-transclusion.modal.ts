import angular from 'angular';

import { InsertionService } from '@ve-components/insertions';
import { TransclusionService } from '@ve-components/transclusions';
import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller';

import { veComponents } from '@ve-components';

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular';
import { InsertApi, InsertData, InsertResolve } from '@ve-types/components';
import { ElementObject, ElementsResponse, TransclusionObject } from '@ve-types/mms';
import { VeModalComponent, VeModalController } from '@ve-types/view-editor';

export interface InsertTransclusionData extends InsertData {
    viewLink: boolean;
}

class CreateTransclusionModalController
    extends VeModalControllerImpl<TransclusionObject, InsertResolve<InsertTransclusionData>>
    implements VeModalController
{
    protected linkTemplate: string = `

<div class="form-group" ng-show="$ctrl.viewLink"><br>
    <label>Link Text:</label>
    <div class="radio radio-with-label">
        <label><input type="radio" ng-model="$ctrl.linkType" ng-value="1">&nbsp;Auto-Numbering
            <a uib-tooltip="For links within current document, otherwise defaults to name" tooltip-trigger="mouseenter" tooltip-popup-delay="100"><i class="fa fa-info-circle"></i></a></label><br>
        <label><input type="radio" ng-model="$ctrl.linkType" ng-value="4">&nbsp;Auto-Numbering w/ Name
            <a uib-tooltip="For links within current document, otherwise defaults to name" tooltip-trigger="mouseenter" tooltip-popup-delay="100"><i class="fa fa-info-circle"></i></a></label><br>
        <label><input type="radio" ng-model="$ctrl.linkType" ng-value="2">&nbsp;Name</label><br>
        <label><input type="radio" ng-model="$ctrl.linkType" ng-value="3">&nbsp;Custom&nbsp;
            <input type="text" ng-model="$ctrl.linkText" placeholder="custom title"/></label>
    </div>
</div>
`;
    protected transclusionTemplate: string = `
    <div>
    <hr/>
    <label>Property to Transclude</label><span class="star-mandatory">*</span>
    <div class="radio radio-with-label">
        <label><input type="radio" name="optradio" value="true" ng-click="$ctrl.toggleRadio('name')">Name</label><br>
        <label><input type="radio" name="optradio" value="true" ng-click="$ctrl.toggleRadio('doc')">Documentation</label><br>
        <label><input type="radio" name="optradio" value="true" ng-click="$ctrl.toggleRadio('val')">Value</label>
        
    </div>
    <label ng-show="$ctrl.showEditableOp" for="$ctrl.nonEditableCheckbox">
        <input id="$ctrl.nonEditableCheckbox" type="checkbox" ng-model="$ctrl.nonEditableCheckbox">&nbsp;Restrict editing
    </label>   
</div> 
`;

    protected targetTemplate: string = `
    <div>
    <label>Target Element</label><span class="star-mandatory">*</span><i class="fa fa-question-circle" uib-tooltip="{{$ctrl.description}}" tooltip-placement="bottom"></i>
    <div class="transclude-target block">
        <span ng-show="$ctrl.element" class="outline">
            {{$ctrl.element.name}}: <span class="placeholder">({{$ctrl.element.id}})</span>
            <span><button class="btn btn-xs btn-primary" ng-click="$ctrl.insert()">{{'Modify'}} Target</button></span>
        </span>
        <span ng-hide="$ctrl.element" class="outline placeholder">
            (No Target)
        </span>
    </div>
</div>
`;
    protected previewTemplate: string = `
    <hr/>
    <label>Preview</label>    
`;

    protected title: string = 'Insert Cross Reference';
    protected description: string;
    protected searchExisting: boolean = true;
    protected cf: TransclusionObject;
    protected element: ElementObject;
    protected requestName: boolean = false;
    protected requestDocumentation: boolean = false;
    protected viewLink: boolean;
    protected nonEditableCheckbox: boolean = false;
    protected showEditableOp: boolean = true;
    protected oking: boolean;
    protected cfType: string;
    protected linkType: number;
    protected linkText: string;

    protected insertApi: InsertApi<ElementObject, VePromiseReason<ElementsResponse<ElementObject>>>;
    protected insertData: InsertTransclusionData;
    protected inserting: boolean = false;
    protected insertNew: boolean;

    protected projectId: string;
    protected refId: string;
    protected orgId: string;

    protected $modalBody: JQuery<HTMLElement>;
    protected $previewEl: JQuery<HTMLElement> = $('<div></div>');
    private $insert: JQuery<HTMLElement>;
    private $target: JQuery<HTMLElement>;
    private $transclusion: JQuery<HTMLElement>;
    private $link: JQuery<HTMLElement>;

    static $inject = ['$q', '$scope', '$compile', '$element', 'growl', 'TransclusionService', 'InsertionService'];

    constructor(
        private $q: VeQService,
        private $scope: angular.IScope,
        private $compile: angular.ICompileService,
        private $element: JQuery<HTMLElement>,
        private growl: angular.growl.IGrowlService,
        private transclusionSvc: TransclusionService,
        private insertionSvc: InsertionService
    ) {
        super();
    }

    $onInit(): void {
        this.projectId = this.resolve.getProjectId;
        this.refId = this.resolve.getRefId ? this.resolve.getRefId : 'master';
        this.orgId = this.resolve.getOrgId ? this.resolve.getOrgId : null;

        this.$modalBody = this.$element.find('.modal-body');
        this.$target = $(this.targetTemplate);
        this.viewLink = this.resolve.getInsertData.viewLink;

        this.insertApi = {
            resolve: (result): void => {
                this.element = result;
                this.insertData.selected = result;
                this.selectOptions();
            },
            reject: (reason): void => {
                if (reason.status !== 444) {
                    this.growl.error(reason.message);
                }
                this.element = null;
                this.cancel();
            },
        };
        this.insertData = this.resolve.getInsertData;
        this.description = 'Begin by searching for or creating an element, then click on a result.';
        if (this.insertData.viewLink) {
            this.description = 'Begin by searching for a view or presentation, then click on a result.';
        }
        //Unless Explicitly overridden, don't save a new element until transclusion is created
        if (typeof this.insertData.noPublish === 'undefined') this.insertData.noPublish = true;
        this.cf = {
            tag: '',
        };
    }

    $postLink(): void {
        this.insert();
    }

    public choose = (): void => {
        this.oking = true;

        let promise: VePromise<ElementObject>;
        if (this.insertData.isNew) promise = this.insertionSvc.createAction(this.element, false);
        else promise = this.$q.resolve(this.element);
        promise
            .then(
                (result) => {
                    this.cf.element = result;
                    if (!this.viewLink) {
                        this.cf.tag = this.transclusionSvc.createTransclusion(
                            result,
                            this.cfType,
                            this.nonEditableCheckbox
                        );
                    } else {
                        this.cf.tag = this.transclusionSvc.createViewLink(result, this.linkType, this.linkText);
                    }

                    this.modalInstance.close(this.cf);
                },
                (reason) => {
                    this.growl.error('Error: ' + reason.message);
                }
            )
            .finally(() => {
                this.oking = false;
            });
    };

    public cancel = (): void => {
        this.modalInstance.dismiss();
    };

    public insert = (): void => {
        this.inserting = true;
        this.$modalBody.empty();
        this.$modalBody.append(this.$target);
        this.$insert = $(`<insert-element 
                        insert-data="$ctrl.insertData" 
                        insert-api="$ctrl.insertApi" 
                        mms-project-id="{{$ctrl.projectId}}" 
                        ${this.refId ? 'mms-ref-id="{{$ctrl.refId}}" ' : ''}
                        ${this.orgId ? 'mms-org-id="{{$ctrl.orgId}}" ' : ''} 
                    </insert-element>`);
        this.$modalBody.append(this.$insert);
        this.$compile(this.$modalBody)(this.$scope.$new());
    };

    public selectOptions = (): void => {
        this.inserting = false;
        this.$modalBody.empty();
        this.$modalBody.append(this.$target);
        if (this.viewLink) {
            this.$link = $(this.linkTemplate);
            this.$modalBody.append(this.$link);
        } else {
            this.$transclusion = $(this.transclusionTemplate);
            this.$modalBody.append(this.transclusionTemplate);
        }
        this.$compile(this.$modalBody)(this.$scope.$new());
    };

    public toggleRadio = (field: string): void => {
        this.cfType = field;
        this.$previewEl.empty();
        this.$previewEl.append($(this.previewTemplate));
        this.$previewEl.append(
            $(
                `<div class="transclude-target">${this.transclusionSvc.createTransclusion(
                    this.element,
                    this.cfType,
                    true,
                    true
                )}</div>`
            )
        );
        this.$compile(this.$previewEl)(this.$scope.$new());
        this.$modalBody.append(this.$previewEl);
    };
}

// Component for inserting cross-reference
// Defines scope variables for html template and how to handle user click
// Also defines options for search interfaces -- see mmsSearch.js for more info
const CreateTransclusionModal: VeModalComponent = {
    selector: 'createTransclusionModal',
    template: `
    <div>
    <div class="modal-header">
        <h4>Insert {{$ctrl.viewLink ? 'View Link': 'Cross Reference'}}</h4>
        
    </div>
    <div class="modal-body">
        
    </div>
    <div class="modal-footer" ng-if="!$ctrl.inserting">
        <div>
            <p class="help-block pull-left"><i>Fields marked with <span class="star-mandatory">*</span> are required</i> </p>
        </div>
        <div >
          <button class="btn btn-primary" ng-disabled="!$ctrl.element" type="button" ng-click="$ctrl.choose()">Create {{$ctrl.viewLink ? 'Link': 'Transclusion'}}<i ng-show="$ctrl.oking" class="fa fa-spin fa-spinner"></i></button>
        </div>
        <button class="btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
    </div>
</div>
`,
    bindings: {
        modalInstance: '<',
        resolve: '<',
    },
    controller: CreateTransclusionModalController,
};

veComponents.component(CreateTransclusionModal.selector, CreateTransclusionModal);
