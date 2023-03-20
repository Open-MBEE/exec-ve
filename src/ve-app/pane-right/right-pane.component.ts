import { IPane } from '@openmbee/pane-layout'
import { StateService } from '@uirouter/angularjs'
import angular, { IComponentController } from 'angular'
import Rx from 'rx-lite'

import { veAppEvents } from '@ve-app/events'
import { SpecApi, SpecService } from '@ve-components/spec-tools'
import { ToolbarService } from '@ve-core/toolbar'
import { RootScopeService } from '@ve-utils/application'
import { AutosaveService, EventService } from '@ve-utils/core'
import {
    ElementService,
    PermissionsService,
    ProjectService,
} from '@ve-utils/mms-api-client'

import { veApp } from '@ve-app'

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular'
import { DocumentObject, RefObject, RefsResponse } from '@ve-types/mms'
import { VeModalService } from '@ve-types/view-editor'

class RightPaneController implements IComponentController {
    //Bindings
    private mmsRef: RefObject

    // Though we don't explicitly use it right now, we do need it to trigger updates when
    // entering/exiting certain states
    private mmsDocument: DocumentObject

    //Local Values

    public subs: Rx.IDisposable[]

    private specApi: SpecApi
    protected toolsCategory: string = 'global'
    private init: boolean

    private $pane: IPane
    private $tools: JQuery<HTMLElement>

    private toolbarId: string = 'right-toolbar'

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
        'AutosaveService',
        'ToolbarService',
        'SpecService',
    ]

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
        private autosaveSvc: AutosaveService,
        private toolbarSvc: ToolbarService,
        private specSvc: SpecService
    ) {}

    $onInit(): void {
        this.eventSvc.$init(this)

        //Init Pane Toggle Controls
        this.rootScopeSvc.rightPaneClosed(this.$pane.closed)

        this.subs.push(
            this.$pane.$toggled.subscribe(() => {
                this.rootScopeSvc.rightPaneClosed(this.$pane.closed)
            })
        )

        this.subs.push(
            this.eventSvc.$on('right-pane.toggle', (paneClosed) => {
                if (paneClosed === undefined) {
                    this.$pane.toggle()
                } else if (paneClosed && !this.$pane.closed) {
                    this.$pane.toggle()
                } else if (!paneClosed && this.$pane.closed) {
                    this.$pane.toggle()
                }
                this.rootScopeSvc.rightPaneClosed(this.$pane.closed)
            })
        )

        this.subs.push(
            this.eventSvc.$on<veAppEvents.elementSelectedData>(
                'element.selected',
                (data) => {
                    this.changeAction(data)
                }
            )
        )

        this.subs.push(
            this.eventSvc.$on<veAppEvents.elementUpdatedData>(
                'element.updated',
                (data) => {
                    if (
                        data.elementId === this.specApi.elementId &&
                        data.projectId === this.specApi.projectId &&
                        data.refId === this.specApi.refId &&
                        !data.continueEdit
                    ) {
                        this.specSvc.setElement()
                    }
                }
            )
        )

        this.subs.push(
            this.eventSvc.$on<veAppEvents.elementSelectedData>(
                'view.selected',
                (data) => {
                    this.changeAction(data)
                }
            )
        )
    }

    changeAction = (data: veAppEvents.elementSelectedData): void => {
        const elementId = data.elementId
        const refId = data.refId
        const projectId = data.projectId
        const commitId = data.commitId ? data.commitId : null
        const displayOldSpec = data.displayOldSpec ? data.displayOldSpec : null
        const promise: VePromise<string, RefsResponse> = new this.$q(
            (resolve, reject) => {
                if (
                    !this.specApi ||
                    !this.specApi.refType ||
                    refId != this.specApi.refId ||
                    projectId != this.specApi.projectId
                ) {
                    this.projectSvc.getRef(refId, projectId).then((ref) => {
                        resolve(ref.type)
                    }, reject)
                } else {
                    resolve(this.specApi.refType)
                }
            }
        )

        promise.then(
            (refType) => {
                this.specApi = {
                    elementId,
                    projectId,
                    refType,
                    refId,
                    commitId,
                    displayOldSpec,
                }

                this.specSvc.specApi = this.specApi

                if (this.specSvc.setEditing) {
                    this.specSvc.setEditing(false)
                }

                this.specApi.rootId = data.rootId ? data.rootId : ''

                this.specSvc.editable =
                    data.rootId &&
                    this.mmsRef.type === 'Branch' &&
                    refType === 'Branch' &&
                    this.permissionsSvc.hasBranchEditPermission(
                        projectId,
                        refId
                    )

                //Independent of viewOb if there is a document we want document tools enabled
                if (!this.init) {
                    this.init = true
                    if (this.$state.includes('document')) {
                        this.toolsCategory = 'document'
                    } else if (this.$state.includes('**.portal.**')) {
                        this.toolsCategory = 'portal'
                    } else {
                        this.toolsCategory = 'global'
                    }

                    this.$tools = $(
                        `<view-tools tools-category="$ctrl.toolsCategory" toolbar-id="${this.toolbarId}"></view-tools>`
                    )

                    this.$element.append(this.$tools)
                    this.$compile(this.$tools)(this.$scope)
                }

                this.toolbarSvc.waitForApi(this.toolbarId).then(
                    (api) => api.setIcon('spec-editor', 'fa-edit'),
                    (reason) => this.growl.error(ToolbarService.error(reason))
                )
                this.specSvc.setElement()
            },
            (reason) => {
                this.growl.error('Unable to get ref: ' + reason.message)
            }
        )
    }
}

const RightPaneComponent: VeComponentOptions = {
    selector: 'rightPane',
    template: `
    <div class="pane-right"></div>
    `,
    require: {
        $pane: '^^ngPane',
    },
    bindings: {
        mmsRef: '<',
        mmsDocument: '<',
    },
    controller: RightPaneController,
}

veApp.component(RightPaneComponent.selector, RightPaneComponent)
