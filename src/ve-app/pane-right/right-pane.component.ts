import { IPane } from '@openmbee/pane-layout';
import { StateService } from '@uirouter/angularjs';
import angular, { IComponentController } from 'angular';
import _ from 'lodash';
import Rx from 'rx-lite';

import { SpecService } from '@ve-components/spec-tools';
import { veCoreEvents } from '@ve-core/events';
import { ToolbarService } from '@ve-core/toolbar';
import { RootScopeService } from '@ve-utils/application';
import { EditObject, EditService, EventService } from '@ve-utils/core';
import { ElementService, PermissionsService, ProjectService } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular';
import { ElementObject, RefObject, RefsResponse } from '@ve-types/mms';
import { VeModalService } from '@ve-types/view-editor';

import elementSelectedData = veCoreEvents.elementSelectedData;

class RightPaneController implements IComponentController {
    //Bindings
    private mmsRef: RefObject;

    // Though we don't explicitly use it right now, we do need it to trigger updates when
    // entering/exiting certain states
    private mmsRoot: ElementObject;

    //Local Values

    public subs: Rx.IDisposable[];

    private openEdits: number;
    private edits: { [id: string]: EditObject };

    private $pane: IPane;
    private $tools: JQuery<HTMLElement>;

    private toolbarId: string = 'right-toolbar';

    static $inject = [
        '$scope',
        '$element',
        '$compile',
        '$uibModal',
        '$q',
        '$state',
        '$timeout',
        'hotkeys',
        'growl',
        'ElementService',
        'ProjectService',
        'PermissionsService',
        'RootScopeService',
        'EventService',
        'EditService',
        'ToolbarService',
        'SpecService',
    ];

    constructor(
        private $scope: angular.IScope,
        private $element: JQuery<HTMLElement>,
        private $compile: angular.ICompileService,
        private $uibModal: VeModalService,
        private $q: VeQService,
        private $state: StateService,
        private $timeout: angular.ITimeoutService,
        private hotkeys: angular.hotkeys.HotkeysProvider,
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private projectSvc: ProjectService,
        private permissionsSvc: PermissionsService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService,
        private autosaveSvc: EditService,
        private toolbarSvc: ToolbarService,
        private specSvc: SpecService
    ) {}

    $onInit(): void {
        this.eventSvc.$init(this);

        //Init Pane Toggle Controls
        this.rootScopeSvc.rightPaneClosed(this.$pane.closed);

        //Init spec ready binding
        this.eventSvc.resolve<boolean>('spec.ready', true);

        this.subs.push(
            this.$pane.$toggled.subscribe(() => {
                this.rootScopeSvc.rightPaneClosed(this.$pane.closed);
            })
        );

        this.subs.push(
            this.eventSvc.$on('right-pane.toggle', (paneClosed) => {
                if (paneClosed === undefined) {
                    this.$pane.toggle();
                } else if (paneClosed && !this.$pane.closed) {
                    this.$pane.toggle();
                } else if (!paneClosed && this.$pane.closed) {
                    this.$pane.toggle();
                }
                this.rootScopeSvc.rightPaneClosed(this.$pane.closed);
            })
        );

        this.subs.push(
            this.eventSvc.$on<veCoreEvents.elementSelectedData>('element.selected', (data) => {
                this.changeAction(data);
            })
        );

        this.subs.push(
            this.eventSvc.$on<veCoreEvents.elementUpdatedData>('element.updated', (data) => {
                if (
                    data.element.id === this.specSvc.specApi.elementId &&
                    data.element._projectId === this.specSvc.specApi.projectId &&
                    data.element._refId === this.specSvc.specApi.refId &&
                    !data.continueEdit
                ) {
                    this.eventSvc.resolve<boolean>('spec.ready', false);
                    this.specSvc.setElement();
                }
            })
        );

        this.subs.push(
            this.eventSvc.$on<veCoreEvents.elementSelectedData>('view.selected', (data) => {
                this.changeAction(data);
            })
        );

        this.subs.push(
            this.eventSvc.$on(this.autosaveSvc.EVENT, () => {
                this.openEdits = this.autosaveSvc.openEdits();
            })
        );

        this.edits = this.autosaveSvc.getAll();
    }

    $onDestroy(): void {
        this.eventSvc.$destroy(this.subs);
    }

    changeAction = (data: veCoreEvents.elementSelectedData): void => {
        const elementId = data.elementId;
        const refId = data.refId;
        const projectId = data.projectId;
        const commitId = data.commitId ? data.commitId : null;
        const displayOldSpec = data.displayOldSpec ? data.displayOldSpec : null;
        const promise: VePromise<string, RefsResponse> = new this.$q((resolve, reject) => {
            if (
                !this.specSvc.specApi.refType ||
                refId != this.specSvc.specApi.refId ||
                projectId != this.specSvc.specApi.projectId
            ) {
                this.projectSvc.getRef(refId, projectId).then((ref) => {
                    resolve(ref.type);
                }, reject);
            } else {
                resolve(this.specSvc.specApi.refType);
            }
        });

        promise.then(
            (refType) => {
                const specApi = {
                    elementId,
                    projectId,
                    refType,
                    refId,
                    commitId,
                    displayOldSpec,
                };
                if (this.specSvc.specApi) {
                    const current = {
                        elementId: this.specSvc.specApi.elementId,
                        projectId: this.specSvc.specApi.projectId,
                        refId: this.specSvc.specApi.refId,
                        refType: this.specSvc.specApi.refType,
                        commitId: this.specSvc.specApi.commitId,
                        displayOldSpec: this.specSvc.specApi.displayOldSpec,
                    };
                    if (_.isEqual(specApi, current)) {
                        return; //don't do unnecessary updates
                    }
                }
                this.eventSvc.resolve<boolean>('spec.ready', false);
                Object.assign(this.specSvc.specApi, specApi);

                // if (this.specSvc.setEditing) {
                //     this.specSvc.setEditing(false)
                // }

                this.specSvc.specApi.rootId = data.rootId ? data.rootId : '';

                this.specSvc.editable =
                    data.rootId &&
                    this.mmsRef.type === 'Branch' &&
                    refType === 'Branch' &&
                    this.permissionsSvc.hasBranchEditPermission(projectId, refId);

                this.toolbarSvc.waitForApi(this.toolbarId).then(
                    (api) => api.setIcon('spec-editor', 'fa-edit'),
                    (reason) => this.growl.error(ToolbarService.error(reason))
                );
                this.specSvc.setElement();
            },
            (reason) => {
                this.growl.error('Unable to get ref: ' + reason.message);
            }
        );
    };

    public etrackerChange = (): void => {
        this.specSvc.keepMode();
        const id = this.specSvc.tracker.etrackerSelected;
        if (!id) return;
        const info = id.split('|');
        const data: veCoreEvents.elementSelectedData = {
            elementId: info[2],
            projectId: info[0],
            refId: info[1],
            commitId: 'latest',
        };

        this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('element.selected', data);
    };
}

const RightPaneComponent: VeComponentOptions = {
    selector: 'rightPane',
    template: `
    <div class="pane-right">
    <div ng-if="$ctrl.specSvc.getEditing()" style="padding-top: 10px" >        
        <form class="form-horizontal">
            <div class="form-group">
                <label class="col-sm-3 control-label">Edits ({{$ctrl.openEdits}}):</label>
                <div class="col-sm-9">
                    <select class="form-control"
                        ng-options="eid as edit.element.type + ': ' + edit.element.name for (eid, edit) in $ctrl.edits"
                        ng-model="$ctrl.specSvc.tracker.etrackerSelected" ng-change="$ctrl.etrackerChange()">
                    </select>
                </div>
            </div>
        </form>
        <hr class="right-title-divider">
    </div>
    <mms-tools toolbar-id="{{$ctrl.toolbarId}}"></mms-tools>
</div>
    `,
    require: {
        $pane: '^^ngPane',
    },
    bindings: {
        mmsRef: '<',
        mmsRoot: '<',
    },
    controller: RightPaneController,
};

veApp.component(RightPaneComponent.selector, RightPaneComponent);
