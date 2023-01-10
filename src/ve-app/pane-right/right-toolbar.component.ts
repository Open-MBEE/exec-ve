import { UIRouterGlobals } from '@uirouter/angularjs'
import { IComponentController } from 'angular'
import Rx from 'rx-lite'

import { veComponentsEvents } from '@ve-components/events'
import { ExtensionService } from '@ve-components/services'
import { IToolBarButton, ToolbarApi, ToolbarService } from '@ve-core/toolbar'
import { PermissionsService } from '@ve-utils/mms-api-client'
import { AutosaveService, EventService } from '@ve-utils/services'

import { veApp } from '@ve-app'

import { VeComponentOptions } from '@ve-types/angular'
import { DocumentObject, RefObject } from '@ve-types/mms'

/* Classes */
const RightToolbarComponent: VeComponentOptions = {
    selector: 'rightToolbar', //toolbar-component
    template: `<tool-bar on-click="$ctrl.onClick(button)" />`,
    bindings: {
        refOb: '<',
        documentOb: '<',
    },
    controller: class ToolbarController implements IComponentController {
        static $inject = [
            '$state',
            'ExtensionService',
            'PermissionsService',
            'AutosaveService',
            'EventService',
            'ToolbarService',
        ]

        //Injected Deps
        public subs: Rx.IDisposable[]

        //Bindings
        public refOb: RefObject
        public documentOb: DocumentObject

        //Local
        public tbApi: ToolbarApi
        public buttons: IToolBarButton[]

        constructor(
            public $uiRouterGlobals: UIRouterGlobals,
            public extensionSvc: ExtensionService,
            private permissionsSvc: PermissionsService,
            private autosaveSvc: AutosaveService,
            private eventSvc: EventService,
            private toolbarSvc: ToolbarService
        ) {}

        $onInit(): void {
            this.eventSvc.$init(this)

            this.tbApi = this.toolbarSvc.initApi(
                'right-toolbar',
                this.tbInit,
                this
            )
            this.buttons = this.tbApi.buttons

            this.subs.push(
                this.eventSvc.$on<veComponentsEvents.setPermissionData>(
                    this.toolbarSvc.constants.SETPERMISSION,
                    (data) => {
                        this.tbApi.setPermission(data.id, data.value)
                    }
                )
            )

            this.subs.push(
                this.eventSvc.$on<veComponentsEvents.setIconData>(
                    this.toolbarSvc.constants.SETICON,
                    (data) => {
                        this.tbApi.setIcon(data.id, data.value)
                    }
                )
            )

            this.subs.push(
                this.eventSvc.$on<veComponentsEvents.setToggleData>(
                    this.toolbarSvc.constants.TOGGLEICONSPINNER,
                    (data) => {
                        this.tbApi.toggleButtonSpinner(data.id)
                    }
                )
            )

            this.subs.push(
                this.eventSvc.$on<veComponentsEvents.setToggleData>(
                    this.toolbarSvc.constants.SELECT,
                    (data) => {
                        this.tbApi.select(data.id)
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
                        this.refOb &&
                        this.refOb.type === 'Branch' &&
                        this.permissionsSvc.hasBranchEditPermission(this.refOb)
                }
            }
        }
    },
}
/* Controllers */

veApp.component(RightToolbarComponent.selector, RightToolbarComponent)
