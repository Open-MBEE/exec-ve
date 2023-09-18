import { Insertion, InsertionService } from '@ve-components/insertions';
import { EditorService } from '@ve-core/editor';
import { ApplicationService, UtilsService } from '@ve-utils/application';
import { ApiService, ElementService, ProjectService, ViewService } from '@ve-utils/mms-api-client';
import { SchemaService } from '@ve-utils/model-schema';
import { Class } from '@ve-utils/utils';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular';
import { InsertData } from '@ve-types/components';
import { ElementCreationRequest, ElementObject } from '@ve-types/mms';
import { VeModalService } from '@ve-types/view-editor';

class InsertCommentController extends Insertion<InsertData> {
    protected comment: ElementObject;
    static $inject = Insertion.$inject;

    constructor(
        $scope: angular.IScope,
        $q: VeQService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        $timeout: angular.ITimeoutService,
        $uibModal: VeModalService,
        viewSvc: ViewService,
        elementSvc: ElementService,
        projectSvc: ProjectService,
        schemaSvc: SchemaService,
        applicationSvc: ApplicationService,
        utilsSvc: UtilsService,
        apiSvc: ApiService,
        utils: InsertionService,
        editorSvc: EditorService
    ) {
        super(
            $scope,
            $q,
            $element,
            growl,
            $timeout,
            $uibModal,
            viewSvc,
            elementSvc,
            projectSvc,
            schemaSvc,
            applicationSvc,
            utilsSvc,
            apiSvc,
            utils,
            editorSvc
        );
    }

    public $onInit(): void {
        super.$onInit();
        const id = this.apiSvc.createUniqueId();
        this.comment = new Class({
            id: id,
            _projectId: this.mmsProjectId,
            _refId: this.mmsRefId,
            name: 'Comment ' + new Date().toISOString(),
            documentation: '',
            type: 'Class',
            ownerId: 'holding_bin_' + this.mmsProjectId,
            appliedStereotypeIds: [],
        });
        this.oking = false;
    }

    public create = (): VePromise<ElementObject> => {
        if (this.oking) {
            this.growl.info('Please wait...');
            return;
        }
        this.oking = true;
        const reqOb: ElementCreationRequest<ElementObject> = {
            elements: [this.comment],
            elementId: this.comment.id,
            projectId: this.mmsProjectId,
            refId: this.mmsRefId,
        };
        return this.elementSvc.createElement(reqOb);
    };
}

const InsertCommentComponent: VeComponentOptions = {
    selector: 'insertComment',
    template: `
    <div class="modal-header">
    <h4>Insert a comment</h4>
</div>

<div class="modal-body comment-modal">
    <div class="comment-modal-input">
        <div class="form-group">
            <label>Comment</label>
            <textarea class="form-control" rows="3" ng-model="$ctrl.comment.documentation" 
                placeholder="Type your comment here"></textarea>
        </div>
    </div>
</div>

<div class="modal-footer">
    <button class="btn btn-primary" ng-click="$ctrl.ok()">Create <i ng-show="$ctrl.oking" class="fa fa-spin fa-spinner"></i>
    </button>
    <button class="btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
</div> 
`,
    bindings: {
        insertData: '<',
        insertApi: '<',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsOrgId: '@',
    },
    controller: InsertCommentController,
};

veComponents.component(InsertCommentComponent.selector, InsertCommentComponent);
