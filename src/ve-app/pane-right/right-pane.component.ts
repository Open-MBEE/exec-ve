import { IPane } from '@openmbee/pane-layout'
import { StateService } from '@uirouter/angularjs'
import angular, { IComponentController } from 'angular'
import Rx from 'rx-lite'

import { veAppEvents } from '@ve-app/events'
import { SpecApi, SpecService } from '@ve-components/spec-tools'
import { veCoreEvents } from '@ve-core/events'
import { ToolbarService } from '@ve-core/toolbar'
import { RootScopeService } from '@ve-utils/application'
import { AutosaveService, EventService } from '@ve-utils/core'
import {
    DocumentMetadata,
    ElementService,
    PermissionsService,
    ProjectService,
} from '@ve-utils/mms-api-client'
import { onChangesCallback } from '@ve-utils/utils'

import { veApp } from '@ve-app'

import { VeComponentOptions, VeQService } from '@ve-types/angular'
import {
    DocumentObject,
    ElementObject,
    ParamsObject,
    RefObject,
    ViewObject,
} from '@ve-types/mms'
import { VeModalService } from '@ve-types/view-editor'

class RightPaneController implements IComponentController {
    //Bindings
    private mmsParams: ParamsObject
    private mmsDocument: DocumentObject
    private mmsView: ViewObject
    private mmsRef: RefObject
    private mmsDocMeta: DocumentMetadata

    //Local Values
    private params: ParamsObject

    public subs: Rx.IDisposable[]

    private specApi: SpecApi
    protected toolsCategory: string = 'global'
    private init: boolean

    private $pane: IPane
    private $tools: JQuery<HTMLElement>

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
        this.params = this.mmsParams
        this.toolbarSvc.waitForApi('right-toolbar').then(
            () => {
                this.changeAction()
            },
            () => {
                console.log('Toolbar did not initialize')
            }
        )

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
            this.eventSvc.$on(
                'element.selected',
                (data: {
                    elementOb: ElementObject
                    commitId: string
                    displayOldSpec: boolean
                }) => {
                    const elementOb = data.elementOb
                    const commitId = data.commitId ? data.commitId : null
                    const displayOldSpec = data.displayOldSpec
                        ? data.displayOldSpec
                        : null
                    this.specApi.elementId = elementOb.id
                    this.specApi.projectId = elementOb._projectId
                    this.specApi.refId = elementOb._refId
                    this.specApi.commitId = commitId
                        ? commitId
                        : elementOb._commitId
                    this.specApi.displayOldSpec = displayOldSpec

                    if (this.specSvc.setEditing) {
                        this.specSvc.setEditing(false)
                    }
                    this.projectSvc
                        .getRef(elementOb._refId, elementOb._projectId)
                        .then(
                            (ref) => {
                                const editable =
                                    ref.type === 'Branch' &&
                                    commitId === 'latest' &&
                                    this.permissionsSvc.hasBranchEditPermission(
                                        this.params.projectId,
                                        this.params.refId
                                    )
                                this.eventSvc.$broadcast<veCoreEvents.setPermissionData>(
                                    this.toolbarSvc.constants.SETPERMISSION,
                                    {
                                        tbId: 'right-toolbar',
                                        id: 'element',
                                        value: editable,
                                    }
                                )
                                this.specSvc.setElement()
                            },
                            (reason) => {
                                this.growl.error(
                                    'Unable to get ref: ' + reason.message
                                )
                            }
                        )
                }
            )
        )

        this.subs.push(
            this.eventSvc.$on(
                'element.updated',
                (data: { element: ElementObject; continueEdit: boolean }) => {
                    const elementOb = data.element
                    const continueEdit = data.continueEdit
                    if (
                        elementOb.id === this.specApi.elementId &&
                        elementOb._projectId === this.specApi.projectId &&
                        elementOb._refId === this.specApi.refId &&
                        !continueEdit
                    ) {
                        this.specSvc.setElement()
                    }
                }
            )
        )

        this.subs.push(
            this.eventSvc.$on<veAppEvents.viewSelectedData>(
                'view.selected',
                (data) => {
                    const elementOb = data.focusId ? data.focusId : data.rootOb
                    const commitId = data.commitId ? data.commitId : null
                    this.eventSvc.$broadcast('element.selected', {
                        elementOb: elementOb,
                        commitId: commitId,
                    })
                    const editable =
                        this.mmsRef.type === 'Branch' &&
                        commitId === 'latest' &&
                        this.permissionsSvc.hasBranchEditPermission(
                            this.params.projectId,
                            this.params.refId
                        )
                    //this.viewCommitId = commitId ? commitId : elementOb._commitId;
                    this.eventSvc.$broadcast(
                        this.toolbarSvc.constants.SETPERMISSION,
                        {
                            id: 'view',
                            value: editable,
                        }
                    )
                }
            )
        )
    }

    $postLink(): void {
        //If there is a view pre-selected, send the view.selected event to the spec tools system
        // if (this.params.documentId || this.params.viewId) {
        //     const data = {
        //         state: this.$uiRouterGlobals.current.name,
        //         params: this.params,
        //         documentId: this.params.documentId
        //             ? this.params.documentId
        //             : this.params.projectId + '_cover',
        //         viewId: this.params.viewId
        //             ? this.params.viewId
        //             : this.params.documentId
        //             ? this.params.documentId
        //             : null,
        //     }
        //     this.eventSvc.$broadcast<veAppEvents.viewSelectedData>(
        //         'view.selected',
        //         data
        //     )
        // }
    }

    changeAction: onChangesCallback<void> = (newVal, oldVal) => {
        if (!this.init) {
            this.init = true
        }
        this.specApi = {
            refId: this.mmsRef.id,
            refType: this.mmsRef.type,
            commitId: 'latest',
            projectId: this.params.projectId,
            elementId: '',
        }

        if (this.mmsDocument) {
            this.specApi.docId = this.mmsDocument ? this.mmsDocument.id : ''
        }
        this.specSvc.specApi = this.specApi
        this.specSvc.editable =
            this.mmsDocument &&
            this.mmsRef.type === 'Branch' &&
            this.permissionsSvc.hasBranchEditPermission(
                this.params.projectId,
                this.params.refId
            )

        //Set the viewOb if found first otherwise fallback to documentOb or nothing
        if (this.params.viewId) {
            this.specApi.elementId = this.params.viewId
            this.specApi.docId = this.params.documentId
        } else if (this.params.documentId) {
            this.specApi.elementId = this.params.documentId
            this.specApi.docId = this.params.documentId
        } else {
            this.specApi.elementId = this.params.projectId + '_cover'
        }

        //Independent of viewOb if there is a document we want document tools enabled
        if (this.$state.includes('document')) {
            this.toolsCategory = 'document'
        } else if (this.$state.includes('portal')) {
            this.toolsCategory = 'portal'
        } else {
            this.toolsCategory = 'global'
        }

        this.$tools = $(
            `<view-tools tools-category="$ctrl.toolsCategory"></view-tools>`
        )

        this.$element.append(this.$tools)
        this.$compile(this.$tools)(this.$scope)
    }
}

const RightPaneComponent: VeComponentOptions = {
    selector: 'rightPane',
    template: `
    <div class="pane-right"></div>
    `,
    bindings: {
        mmsParams: 'params',
        mmsProject: 'projectOb',
        mmsRef: 'refOb',
        mmsGroup: 'groupOb',
        mmsDocument: 'documentOb',
    },
    require: {
        $pane: '^^ngPane',
    },
    controller: RightPaneController,
}

veApp.component(RightPaneComponent.selector, RightPaneComponent)
