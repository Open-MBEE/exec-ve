import angular from 'angular'
import Rx from 'rx-lite'

import { SpecApi, SpecService } from '@ve-components/spec-tools'
import { CoreUtilsService } from '@ve-core/services'
import { ToolbarService } from '@ve-core/tool-bar'
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

import { veApp } from '@ve-app'

import { VeComponentOptions } from '@ve-types/angular'
import { ElementObject } from '@ve-types/mms'
import { VeModalService } from '@ve-types/view-editor'

const RightPaneComponent: VeComponentOptions = {
    selector: 'rightPane',
    template: `
    <div class="pane-right">
    <tools-pane tools-category="{{$ctrl.toolsCategory}}" mms-branches="$ctrl.branchObs" mms-tags="$ctrl.tagObs"></tools-pane>
</div>
    `,
    bindings: {
        projectOb: '<',
        refOb: '<',
        tagObs: '<',
        branchObs: '<',
        documentOb: '<',
        viewOb: '<',
    },
    require: {
        $pane: '^^ngPane',
    },
    controller: class RightPaneController
        implements angular.IComponentController
    {
        private projectOb
        refOb
        tagObs
        branchObs
        documentOb
        viewOb

        public subs: Rx.IDisposable[]

        private specApi: SpecApi
        protected toolsCategory: string = 'global'
        // viewContentsOrderApi: ContentReorderApi;
        // editable: any;
        // viewId: any;
        // elementSaving: boolean;
        // openEdits: number;
        // edits: {};
        // viewCommitId: any;
        private $pane

        static $inject = [
            '$scope',
            '$uibModal',
            '$q',
            '$timeout',
            'hotkeys',
            'growl',
            'ElementService',
            'ProjectService',
            'CoreUtilsService',
            'PermissionsService',
            'RootScopeService',
            'EventService',
            'AutosaveService',
            'ToolbarService',
            'SpecService',
        ]

        constructor(
            private $scope,
            private $uibModal: VeModalService,
            private $q: angular.IQService,
            private $timeout: angular.ITimeoutService,
            private hotkeys: angular.hotkeys.HotkeysProvider,
            private growl: angular.growl.IGrowlService,
            private elementSvc: ElementService,
            private projectSvc: ProjectService,
            private utils: CoreUtilsService,
            private permissionsSvc: PermissionsService,
            private rootScopeSvc: RootScopeService,
            private eventSvc: EventService,
            private autosaveSvc: AutosaveService,
            private toolbarSvc: ToolbarService,
            private specSvc: SpecService
        ) {}

        $onInit(): void {
            this.eventSvc.$init(this)
            this.specApi = {
                refId: this.refOb.id,
                refType: this.refOb.type,
                commitId: 'latest',
                projectId: this.projectOb.id,
                elementId: '',
            }
            if (this.documentOb) {
                this.specApi.docId = this.documentOb ? this.documentOb.id : ''
            }
            this.specSvc.specApi = this.specApi
            this.specSvc.editable =
                this.documentOb &&
                this.refOb.type === 'Branch' &&
                this.permissionsSvc.hasBranchEditPermission(this.refOb)

            //Set the viewOb if found first otherwise fallback to documentOb or nothing
            if (this.viewOb) {
                this.specApi.elementId = this.viewOb.id
                this.specApi.docId = this.documentOb.id
            } else if (this.documentOb) {
                this.specApi.elementId = this.documentOb.id
                this.specApi.docId = this.documentOb.id
            }

            //Independent of viewOb if there is a document we want document tools enabled
            if (this.documentOb) {
                this.toolsCategory = 'document'
            }

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
                            this.refOb.type === 'Branch' &&
                            commitId === 'latest' &&
                            this.permissionsSvc.hasBranchEditPermission(
                                this.refOb
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
                this.eventSvc.$on('view.selected', (data) => {
                    const elementOb = data.elementOb
                    const commitId = data.commitId ? data.commitId : null
                    this.eventSvc.$broadcast('element.selected', {
                        elementOb: elementOb,
                        commitId: commitId,
                    })
                    this.viewOb = elementOb
                    const editable =
                        this.refOb.type === 'Branch' &&
                        commitId === 'latest' &&
                        this.permissionsSvc.hasBranchEditPermission(this.refOb)
                    //this.viewCommitId = commitId ? commitId : elementOb._commitId;
                    this.eventSvc.$broadcast(
                        this.toolbarSvc.constants.SETPERMISSION,
                        {
                            id: 'view',
                            value: editable,
                        }
                    )
                })
            )
        }

        $postLink(): void {
            //If there is a view pre-selected, send the view.selected event to the spec tools system
            if (this.viewOb || this.documentOb) {
                const data = {
                    elementOb: this.viewOb ? this.viewOb : this.documentOb,
                    commitId: 'latest',
                }
                this.eventSvc.$broadcast('view.selected', data)
            }
        }
    },
}

veApp.component(RightPaneComponent.selector, RightPaneComponent)
