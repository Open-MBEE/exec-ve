import { UIRouterGlobals } from '@uirouter/angularjs'
import angular from 'angular'

import { EventService } from '@ve-utils/services'

import { veCore } from '@ve-core'

import {
    default_dynamic_buttons,
    default_toolbar_buttons,
} from '../toolbar-button.config'

import { ToolbarApi } from './Toolbar.api'

import { VePromise, VeQService } from '@ve-types/angular'
import { VeConfig } from '@ve-types/config'
import { VeApiObject } from '@ve-types/view-editor'

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
    category: 'global'
    icon: 'fa-gears'
    tooltip: 'Generic Button'
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
    public constants = {
        SETPERMISSION: 'tb-set-permission',
        SETICON: 'tb-set-icon',
        TOGGLEICONSPINNER: 'tb-toggle-icon-spinner',
        SELECT: 'tb-select',
    }

    private toolbars: VeApiObject<ToolbarApi> = {}
    private buttons: { [key: string]: IToolBarButton } = {}
    private dynamic_buttons: { [key: string]: IToolBarButton } = {}
    private veConfig: VeConfig

    static $inject = ['$q', 'EventService']

    constructor(private $q: VeQService, private eventSvc: EventService) {
        this.veConfig = window.__env
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
        ctrl: {
            $uiRouterGlobals: UIRouterGlobals
        } & angular.IComponentController
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
