import { UIRouterGlobals } from '@uirouter/angularjs'
import angular from 'angular'

import { EventService } from '@ve-utils/services'

import { veCore } from '@ve-core'

import {
    default_dynamic_buttons,
    default_toolbar_buttons,
} from '../tool-bar-button.config'

import { ToolbarApi } from './Toolbar.api'

import { VeConfig } from '@ve-types/config'

export interface IToolBarButton {
    id: string
    icon: string
    tooltip: string
    category: string
    icon_original?: string
    selected?: boolean
    active?: boolean
    permission?: boolean
    spinner?: boolean
    dynamic?: boolean
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
    category: 'global'
    icon: 'fa-gears'
    tooltip: 'Generic Button'
    icon_original?: string
    selected?: boolean
    active?: boolean
    permission?: boolean
    spinner?: boolean
    dynamic?: boolean
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
    public constants = {
        SETPERMISSION: 'tb-set-permission',
        SETICON: 'tb-set-icon',
        TOGGLEICONSPINNER: 'tb-toggle-icon-spinner',
        SELECT: 'tb-select',
    }

    private toolbars: { [key: string]: ToolbarApi } = {}
    private buttons: { [key: string]: IToolBarButton } = {}
    private dynamic_buttons: { [key: string]: IToolBarButton } = {}

    static $inject = ['EventService', 'veConfig']
    constructor(private eventSvc: EventService, private veConfig: VeConfig) {
        for (const button of default_toolbar_buttons) {
            this.buttons[button.id] = new ToolButton(button.id, button)
        }
        for (const button of default_dynamic_buttons) {
            this.dynamic_buttons[button.id] = new ToolButton(button.id, button)
        }
        if (this.veConfig.expConfig && this.veConfig.expConfig.specTools) {
            for (const tool of this.veConfig.expConfig.specTools) {
                if (tool.button) {
                    this.buttons[tool.button.id] = new ToolButton(
                        tool.button.id,
                        tool.button
                    )
                }
                if (tool.dynamic_button) {
                    for (const dynButton of tool.dynamic_button) {
                        this.dynamic_buttons[dynButton.id] = new ToolButton(
                            dynButton.id,
                            dynButton
                        )
                    }
                }
            }
        }
        for (const id of Object.keys(this.buttons)) {
            const button = this.buttons[id]
            if (button.dynamic_ids) {
                button.dynamic_buttons = []
                for (const dyn of button.dynamic_ids) {
                    button.dynamic_buttons.push(this.getDynamicButton(dyn))
                }
            }
        }
    }

    getApi(id?: string): ToolbarApi {
        if (id) {
            if (!this.toolbars.hasOwnProperty(id)) {
                return
            }
            return this.toolbars[id]
        } else {
            return Object.values(this.toolbars)[0]
        }
    }

    initApi(
        id: string,
        init: toolbarInitFn,
        ctrl: {
            $uiRouterGlobals: UIRouterGlobals
        } & angular.IComponentController
    ) {
        if (!id) {
            throw new Error('Unable to create Toolbar, missing id')
        }

        if (!ctrl.$onDestroy) {
            ctrl.$onDestroy = () => {
                this.destroyApi(id)
            }
        }
        const api = new ToolbarApi(id)
        init(api)
        this.toolbars[id] = api
        return api
    }

    public destroyApi(id: string) {
        if (this.toolbars.hasOwnProperty(id)) {
            delete this.toolbars[id]
        }
    }

    /**
     * @name veUtils/ToolbarService#this.getToolbarButton
     * Get pre-defined toolbar buttons
     *
     * @param {string} button id
     * @param generic
     * @returns {Object} Button object
     */
    public getToolbarButton = (
        button: string,
        generic?: boolean
    ): IToolBarButton => {
        if (this.buttons.hasOwnProperty(button)) {
            return this.buttons[button]
        }
        if (generic) {
            return (this.buttons[button] = new ToolButton(button))
        }
    }

    public getDynamicButton = (button: string): IToolBarButton => {
        if (this.dynamic_buttons.hasOwnProperty(button)) {
            return this.dynamic_buttons[button]
        }
    }
}

veCore.service('ToolbarService', ToolbarService)
