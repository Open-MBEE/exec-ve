import angular from 'angular'

import { ExtensionService } from '@ve-components/services'
import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller'

import { veComponents } from '@ve-components'

import {
    AddElementApi,
    AddElementData,
    AddElementResolve,
} from '@ve-types/components'
import { ElementObject, MmsObject } from '@ve-types/mms'
import {
    VeModalComponent,
    VeModalController,
    VeModalService,
} from '@ve-types/view-editor'

class AddElementController
    extends VeModalControllerImpl<MmsObject>
    implements VeModalController
{
    static $inject = [
        '$scope',
        '$compile',
        '$element',
        'growl',
        '$timeout',
        '$uibModal',
        'ExtensionService',
    ]

    private schema = 'cameo'

    protected resolve: AddElementResolve<AddElementData>

    //local
    private addElementData: AddElementData
    private addElementApi: AddElementApi<MmsObject, MmsObject>
    private projectId: string
    private refId: string
    private orgId: string
    private addType: string
    private type: string

    private $componentEl: JQuery<HTMLElement>

    constructor(
        private $scope: angular.IScope,
        private $compile: angular.ICompileService,
        private $element: JQuery<HTMLElement>,
        private growl: angular.growl.IGrowlService,
        private $timeout: angular.ITimeoutService,
        private $uibModal: VeModalService,
        private extensionSvc: ExtensionService
    ) {
        super()
    }

    public parentData: ElementObject = {} as ElementObject

    $onInit(): void {
        this.addElementData = this.resolve.getAddData

        this.addType = this.addElementData.addType
        this.projectId = this.resolve.getProjectId
        this.refId = this.resolve.getRefId ? this.resolve.getRefId : 'master'
        this.orgId = this.resolve.getOrgId ? this.resolve.getOrgId : null

        this.type = this.addElementData.type
        this.addElementApi = {
            resolve: (data): void => {
                this.modalInstance.close(data)
            },
            reject: (reason): void => {
                this.modalInstance.dismiss(reason)
            },
        }
    }

    $postLink(): void {
        this.recompile()
    }

    public recompile = (): void => {
        let tag = this.extensionSvc.getTagByType('add', this.type)
        if (tag === 'extension-error') {
            tag = 'add-generic'
        }
        const newPe = $('<div></div>')
        $(newPe).append(
            `<${tag} add-element-data="$ctrl.addElementData" add-element-api="$ctrl.addElementApi" 
                mms-project-id="{{$ctrl.projectId}}" ${
                    this.refId ? `mms-ref-id="{{$ctrl.refId}}" ` : ''
                }${this.orgId ? 'mms-org-id="{{$ctrl.orgId}}" ' : ''}></${tag}>`
        )
        $(this.$element).append(newPe)
        this.$compile(newPe)(this.$scope)
    }

    public cancel = (): void => {
        this.modalInstance.dismiss()
    }
}

const AddElementModalComponent: VeModalComponent = {
    selector: 'addElementModal',
    template: `
    <div>
    <div class="modal-header">
        <h4 class="{{ $ctrl.addType | lowercase }}-type-icon">Create New or Add a {{$ctrl.type}}</h4>
        <h4 ng-show="$ctrl.addElementData.parentTitle">From {{ $ctrl.addElementData.parentTitle }}</h4>
    </div>
</div>
`,
    bindings: {
        modalInstance: '<',
        resolve: '<',
    },
    controller: AddElementController,
}

veComponents.component(
    AddElementModalComponent.selector,
    AddElementModalComponent
)
