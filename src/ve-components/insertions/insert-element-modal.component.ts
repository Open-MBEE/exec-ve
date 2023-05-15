import { ExtensionService } from '@ve-components/services';
import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller';

import { veComponents } from '@ve-components';

import { InsertApi, InsertData, InsertResolve } from '@ve-types/components';
import { ElementObject, MmsObject } from '@ve-types/mms';
import { VeModalComponent, VeModalController, VeModalService } from '@ve-types/view-editor';

class InsertController extends VeModalControllerImpl<MmsObject> implements VeModalController {
    static $inject = ['$scope', '$compile', '$element', '$timeout', '$uibModal', 'growl', 'ExtensionService'];

    private schema = 'cameo';

    protected resolve: InsertResolve<InsertData>;

    //local
    private insertData: InsertData;
    private insertApi: InsertApi<MmsObject, MmsObject>;
    private projectId: string;
    private refId: string;
    private orgId: string;
    private insertType: string;
    private type: string;

    private $componentEl: JQuery<HTMLElement>;

    constructor(
        private $scope: angular.IScope,
        private $compile: angular.ICompileService,
        private $element: JQuery<HTMLElement>,
        private $timeout: angular.ITimeoutService,
        private $uibModal: VeModalService,
        private growl: angular.growl.IGrowlService,
        private extensionSvc: ExtensionService
    ) {
        super();
    }

    public parentData: ElementObject = {} as ElementObject;

    $onInit(): void {
        this.insertData = this.resolve.getInsertData;

        this.insertType = this.insertData.insertType;
        this.projectId = this.resolve.getProjectId;
        this.refId = this.resolve.getRefId ? this.resolve.getRefId : 'master';
        this.orgId = this.resolve.getOrgId ? this.resolve.getOrgId : null;

        this.type = this.insertData.type;
        this.insertApi = {
            resolve: (data): void => {
                this.modalInstance.close(data);
            },
            reject: (reason): void => {
                this.modalInstance.dismiss(reason);
            },
        };
    }

    $postLink(): void {
        this.recompile();
    }

    public recompile = (): void => {
        let tag = this.extensionSvc.getTagByType('insert', this.insertType);
        if (tag === 'extension-error') {
            tag = 'insert-element';
        }
        const newPe = $('<div></div>');
        $(newPe).append(
            `<${tag} insert-data="$ctrl.insertData" insert-api="$ctrl.insertApi" 
                mms-project-id="{{$ctrl.projectId}}" ${this.refId ? `mms-ref-id="{{$ctrl.refId}}" ` : ''}${
                this.orgId ? 'mms-org-id="{{$ctrl.orgId}}" ' : ''
            }></${tag}>`
        );
        $(this.$element).append(newPe);
        this.$compile(newPe)(this.$scope);
    };

    public cancel = (): void => {
        this.modalInstance.dismiss();
    };
}

const InsertElementModalComponent: VeModalComponent = {
    selector: 'insertElementModal',
    template: `
    <div>
    <div class="modal-header">
        <h4 class="{{ $ctrl.insertType | lowercase }}-type-icon">Create New or Add a {{$ctrl.type}}</h4>
        <h4 ng-show="$ctrl.insertData.parentTitle">From {{ $ctrl.insertData.parentTitle }}</h4>
    </div>
</div>
`,
    bindings: {
        modalInstance: '<',
        resolve: '<',
    },
    controller: InsertController,
};

veComponents.component(InsertElementModalComponent.selector, InsertElementModalComponent);
