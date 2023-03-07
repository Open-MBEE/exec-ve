import { EventService } from '@ve-utils/core'

import { veCore } from '@ve-core'

import { ToolbarApi } from './Toolbar.api'

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular'
import { VeConfig } from '@ve-types/config'
import { VeApiObject } from '@ve-types/view-editor'

export interface IToolBarButton {
    id: string
    icon: string
    tooltip: string
    category?: string
    icon_original?: string
    selected?: boolean
    active?: boolean
    permission?: boolean
    spinner?: boolean
    dynamic?: boolean
    priority?: number
    pullDown?: boolean
    onClick?: buttonOnClickFn
    dynamic_ids?: string[]
    dynamic_buttons?: IToolBarButton[]
    disabledFor?: string[]
    enabledFor?: string[]
}

export interface buttonOnClickFn {
    (button?: IToolBarButton): void
}

export interface toolbarInitFn {
    (api: ToolbarApi): void
}

export class ToolButton implements IToolBarButton {
    id: string
    category: string = 'global'
    icon: string = 'fa-gears'
    tooltip: string = 'Generic Button'
    icon_original?: string
    selected?: boolean
    active?: boolean
    permission?: boolean
    spinner?: boolean
    dynamic?: boolean
    pullDown?: boolean
    onClick?: buttonOnClickFn
    dynamic_ids?: string[]
    dynamic_buttons?: IToolBarButton[]
    disabledFor?: string[]
    enabledFor?: string[]

    constructor(id: string, tbutton?: IToolBarButton) {
        this.id = id
        if (tbutton) {
            Object.assign(this, tbutton)
        }
    }
}

export class ToolbarService {
    private toolbars: VeApiObject<ToolbarApi> = {}
    private buttons: { [key: string]: IToolBarButton } = {}
    private dynamic_buttons: { [key: string]: IToolBarButton } = {}
    private veConfig: VeConfig

    static $inject = ['$q', 'EventService']

    constructor(private $q: VeQService, private eventSvc: EventService) {
        this.veConfig = window.__env
        if (this.veConfig.expConfig) {
            for (const ext of Object.keys(this.veConfig.expConfig)) {
                if (
                    this.veConfig.expConfig[ext] &&
                    this.veConfig.expConfig[ext].length > 0
                ) {
                    for (const tool of this.veConfig.expConfig[ext]) {
                        if (tool.toolButton) {
                            this.registerToolbarButtons(tool.toolButton)
                        }
                        if (
                            tool.toolDynamicButton &&
                            tool.toolDynamicButton.length > 0
                        ) {
                            this.registerDynamicButtons(tool.toolDynamicButton)
                        }
                    }
                }
            }
        }
    }

    public waitForApi = (id: string): VePromise<ToolbarApi, void> => {
        if (!this.toolbars.hasOwnProperty(id)) {
            this.toolbars[id] = {}
            this.toolbars[id].promise = new this.$q<ToolbarApi>(
                (resolve, reject) => {
                    this.toolbars[id].resolve = resolve
                    this.toolbars[id].reject = reject
                }
            )
        }
        return this.toolbars[id].promise
    }

    public initApi(
        id: string,
        init: toolbarInitFn,
        ctrl: angular.IComponentController,
        buttons?: IToolBarButton[],
        dynamic_buttons?: IToolBarButton[]
    ): ToolbarApi {
        if (!id) {
            throw new Error('Unable to create Toolbar, missing id')
        }

        if (!ctrl.$onDestroy) {
            ctrl.$onDestroy = (): void => {
                this.destroyApi(id)
            }
        }

        const api = new ToolbarApi(id)
        if (buttons && buttons.length > 0) {
            this.registerToolbarButtons(buttons)
        }
        if (dynamic_buttons && dynamic_buttons.length > 0) {
            this.registerDynamicButtons(dynamic_buttons)
        }
        init(api)
        if (!this.toolbars[id]) {
            this.toolbars[id] = {
                api,
            }
        } else {
            this.toolbars[id].api = api
        }
        if (!this.toolbars[id].resolve) {
            this.toolbars[id].promise = new this.$q((resolve, reject) => {
                this.toolbars[id].resolve = resolve
                this.toolbars[id].reject = reject
            })
        }
        this.toolbars[id].resolve(api)
        return api
    }

    public destroyApi = (id: string): void => {
        if (this.toolbars.hasOwnProperty(id)) {
            delete this.toolbars[id]
        }
    }

    public registerToolbarButtons = (
        buttons: IToolBarButton | IToolBarButton[]
    ): void => {
        if (!Array.isArray(buttons)) {
            buttons = [buttons]
        }
        if (buttons.length > 0) {
            for (const button of buttons) {
                if (!this.buttons[button.id]) {
                    this.buttons[button.id] = button
                }
            }
        }
    }
    public registerDynamicButtons = (
        dynamic_buttons: IToolBarButton | IToolBarButton[]
    ): void => {
        if (!Array.isArray(dynamic_buttons)) {
            dynamic_buttons = [dynamic_buttons]
        }
        if (dynamic_buttons.length > 0) {
            for (const button of dynamic_buttons) {
                if (!this.dynamic_buttons[button.id]) {
                    this.dynamic_buttons[button.id] = button
                }
            }
        }
    }

    public attachDynamicButtons

    /**
     * @name veUtils/ToolbarService#this.getToolbarButton
     * Get pre-defined toolbar button
     *
     * @param {string} buttonId id
     * @param generic
     * @returns {Object} Button object
     */
    public getToolbarButton = (buttonId: string): ToolButton => {
        if (this.buttons.hasOwnProperty(buttonId)) {
            const newButton = new ToolButton(buttonId, this.buttons[buttonId])
            if (this.buttons[buttonId].dynamic_ids) {
                newButton.dynamic_buttons = []
                for (const id of this.buttons[buttonId].dynamic_ids) {
                    newButton.dynamic_buttons.push(
                        new ToolButton(id, this.getDynamicButton(id))
                    )
                }
            }
            return newButton
        } else {
            return (this.buttons[buttonId] = new ToolButton(buttonId))
        }
    }

    public getDynamicButton = (button: string): IToolBarButton => {
        if (this.dynamic_buttons.hasOwnProperty(button)) {
            return this.dynamic_buttons[button]
        }
    }

    static error(reason?: VePromiseReason<unknown>): string {
        if (reason && reason.message) return 'Toolbar error: ' + reason.message
        else return 'Toolbar Error!'
    }
}

veCore.service('ToolbarService', ToolbarService)
