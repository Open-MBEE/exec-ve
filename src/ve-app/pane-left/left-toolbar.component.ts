import { UIRouterGlobals } from '@uirouter/angularjs'
import { IComponentController } from 'angular'
import Rx from 'rx-lite'

import { ExtensionService } from '@ve-components/services'
import {
    trees_default_buttons,
    trees_dynamic_buttons,
} from '@ve-components/trees/trees-buttons.config'
import { veCoreEvents } from '@ve-core/events'
import { IToolBarButton, ToolbarApi, ToolbarService } from '@ve-core/toolbar'
import { RootScopeService } from '@ve-utils/application'
import { AutosaveService, EventService } from '@ve-utils/core'
import { PermissionsService } from '@ve-utils/mms-api-client'

import { veApp } from '@ve-app'

import { VeComponentOptions } from '@ve-types/angular'
import { RefObject } from '@ve-types/mms'

/* Classes */
const LeftToolbarComponent: VeComponentOptions = {
    selector: 'leftToolbar', //toolbar-component
    template: `<tool-bar toolbar-id="$ctrl.toolbarId" pane-toggle="$ctrl.paneToggle"/>`,
    bindings: {
        mmsRef: '<',
    },
    controller: class ToolbarController implements IComponentController {
        static $inject = [
            '$state',
            'ExtensionService',
            'PermissionsService',
            'AutosaveService',
            'EventService',
            'ToolbarService',
            'RootScopeService',
        ]

        //Injected Deps
        public subs: Rx.IDisposable[]

        //Bindings
        public mmsRef: RefObject

        //Local
        public tbApi: ToolbarApi
        public toolbarId: string

        constructor(
            public $uiRouterGlobals: UIRouterGlobals,
            public extensionSvc: ExtensionService,
            private permissionsSvc: PermissionsService,
            private autosaveSvc: AutosaveService,
            private eventSvc: EventService,
            private toolbarSvc: ToolbarService,
            private rootScopeSvc: RootScopeService
        ) {
            this.toolbarId = 'left-toolbar'
        }

        $onInit(): void {
            this.eventSvc.$init(this)

            this.tbApi = this.toolbarSvc.initApi(
                this.toolbarId,
                this.tbInit,
                this,
                trees_default_buttons,
                trees_dynamic_buttons
            )

            this.subs.push(
                this.eventSvc.$on<veCoreEvents.setPermissionData>(
                    this.toolbarSvc.constants.SETPERMISSION,
                    (data) => {
                        if (this.tbApi)
                            this.tbApi.setPermission(data.id, data.value)
                    }
                )
            )

            this.subs.push(
                this.eventSvc.$on<veCoreEvents.setIconData>(
                    this.toolbarSvc.constants.SETICON,
                    (data) => {
                        if (this.tbApi) this.tbApi.setIcon(data.id, data.value)
                    }
                )
            )

            this.subs.push(
                this.eventSvc.$on<veCoreEvents.setToggleData>(
                    this.toolbarSvc.constants.TOGGLEICONSPINNER,
                    (data) => {
                        if (this.tbApi) this.tbApi.toggleButtonSpinner(data.id)
                    }
                )
            )

            this.subs.push(
                this.eventSvc.$on<veCoreEvents.setToggleData>(
                    this.toolbarSvc.constants.SELECT,
                    (data) => {
                        if (this.tbApi) this.tbApi.select(data.id)
                    }
                )
            )
        }

        tbInit = (tbApi: ToolbarApi): void => {
            for (const tool of this.extensionSvc.getExtensions('spec')) {
                const button = this.toolbarSvc.getToolbarButton(tool)
                tbApi.addButton(button)
                if (button.enabledFor) {
                    button.active = false
                    for (const enableState of button.enabledFor) {
                        if (
                            this.$uiRouterGlobals.current.name.indexOf(
                                enableState
                            ) > -1
                        ) {
                            button.active = true
                            break
                        }
                    }
                }
                if (button.disabledFor) {
                    for (const disableState of button.disabledFor) {
                        if (
                            this.$uiRouterGlobals.current.name.indexOf(
                                disableState
                            ) > -1
                        ) {
                            button.active = false
                            break
                        }
                    }
                }
                if (!button.permission) {
                    button.permission =
                        this.mmsRef &&
                        this.mmsRef.type === 'Branch' &&
                        this.permissionsSvc.hasBranchEditPermission(
                            this.mmsRef._projectId,
                            this.mmsRef.id
                        )
                }
            }
        }

        paneToggle = (button: IToolBarButton): void => {
            let toggleDeactivateFlag = false
            if (this.rootScopeSvc.leftPaneClosed()) {
                if (button.selected || this.rootScopeSvc.leftPaneClosed()) {
                    if (button.selected && !this.rootScopeSvc.leftPaneClosed())
                        toggleDeactivateFlag = true
                    this.eventSvc.$broadcast('right-pane.toggle')
                }
            }
            if (toggleDeactivateFlag && this.tbApi) {
                this.tbApi.deactivate(button.id)
            }
        }
    },
}
/* Controllers */

veApp.component(LeftToolbarComponent.selector, LeftToolbarComponent)
