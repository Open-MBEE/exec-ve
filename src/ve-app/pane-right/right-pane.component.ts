import { IPane } from '@openmbee/pane-layout'
import angular, { IComponentController } from 'angular'
import Rx from 'rx-lite'

import { veAppEvents } from '@ve-app/events'
import { SpecApi, SpecService } from '@ve-components/spec-tools'
import { ToolbarService } from '@ve-core/toolbar'
import {
    ElementService,
    PermissionsService,
    ProjectService,
} from '@ve-utils/mms-api-client'
import {
    AutosaveService,
    EventService,
    RootScopeService,
} from '@ve-utils/services'
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

const RightPaneComponent: VeComponentOptions = {
    selector: 'rightPane',
    template: `
    <div class="pane-right"></div>
    `,
    bindings: {
        params: '<',
        mmsRef: '<',
        mmsDocument: '<',
        mmsView: '<',
    },
    require: {
        $pane: '^^ngPane',
    },
    controller: class RightPaneController implements IComponentController {
        private params: ParamsObject
        private mmsRef: RefObject
        private mmsDocument: DocumentObject
        private mmsView: ViewObject

        public subs: Rx.IDisposable[]

        private specApi: SpecApi
        protected toolsCategory: string = 'global'
        private init: boolean

        private $pane: IPane
        private $toolsPane: JQuery<HTMLElement>

        static $inject = [
            '$scope',
            '$element',
            '$compile',
            '$uibModal',
            '$q',
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
            this.changeAction()

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
                        const editable =
                            this.mmsRef.type === 'Branch' &&
                            commitId === 'latest' &&
                            this.permissionsSvc.hasBranchEditPermission(
                                this.params.projectId,
                                this.params.refId
                            )
                        this.eventSvc.$broadcast(
                            this.toolbarSvc.constants.SETPERMISSION,
                            {
                                id: 'element',
                                value: editable,
                            }
                        )
                        this.specSvc.setElement()
                    }
                )
            )

            this.subs.push(
                this.eventSvc.$on(
                    'element.updated',
                    (data: {
                        element: ElementObject
                        continueEdit: boolean
                    }) => {
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
                        const elementOb = data.elementOb
                        const commitId = data.commitId ? data.commitId : null
                        this.eventSvc.$broadcast('element.selected', {
                            elementOb: elementOb,
                            commitId: commitId,
                        })
                        this.mmsView = elementOb
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
            if (this.mmsView || this.mmsDocument) {
                const data = {
                    elementOb: this.mmsView ? this.mmsView : this.mmsDocument,
                    commitId: 'latest',
                }
                this.eventSvc.$broadcast<veAppEvents.viewSelectedData>(
                    'view.selected',
                    data
                )
            }
        }

        changeAction: onChangesCallback<void> = () => {
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
            if (this.params.mmsView) {
                this.specApi.elementId = this.mmsView.id
                this.specApi.docId = this.mmsDocument.id
            } else if (this.mmsDocument) {
                this.specApi.elementId = this.mmsDocument.id
                this.specApi.docId = this.mmsDocument.id
            }

            //Independent of viewOb if there is a document we want document tools enabled
            if (this.mmsDocument) {
                this.toolsCategory = 'document'
            }

            this.$toolsPane = $(
                `<tools-pane tools-category="{{$ctrl.toolsCategory}}"></tools-pane>`
            )

            this.$element.append(this.$toolsPane)
            this.$compile(this.$toolsPane)(this.$scope)
        }
    },
}

veApp.component(RightPaneComponent.selector, RightPaneComponent)
