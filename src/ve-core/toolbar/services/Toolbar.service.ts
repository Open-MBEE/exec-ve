import { veCoreEvents } from '@ve-core/events';
import { EventService } from '@ve-utils/core';

import { veCore } from '@ve-core';

import { ToolbarApi } from './Toolbar.api';

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular';
import { VeConfig } from '@ve-types/config';
import { VeApiObject } from '@ve-types/view-editor';

export interface IToolBarButton {
    id: string;
    icon: string;
    tooltip: string;
    category?: string;
    icon_original?: string;
    selected?: boolean;
    active?: boolean;
    permission?: boolean;
    spinner?: boolean;
    dynamic?: boolean;
    priority?: number;
    pullDown?: boolean;
    onClick?: buttonOnClickFn;
    dynamic_ids?: string[];
    disabledFor?: string[];
    enabledFor?: string[];
}

export interface buttonOnClickFn {
    (button?: IToolBarButton): void;
}

export interface toolbarInitFn {
    (api: ToolbarApi): void;
}

export class ToolButton implements IToolBarButton {
    id: string;
    category: string = 'global';
    icon: string = 'fa-gears';
    tooltip: string = 'Generic Button';
    icon_original: string = 'fa-gears';
    selected: boolean = false;
    active: boolean = true;
    permission: boolean;
    spinner: boolean = false;
    dynamic: boolean = false;
    pullDown: boolean = false;
    dynamicButtons: ToolButton[] = [];
    disabledFor: string[] = [];
    enabledFor: string[] = [];
    priority: number = 0;

    constructor(id: string, tbutton?: IToolBarButton) {
        this.id = id;
        if (tbutton) {
            Object.assign(this, tbutton);
        }
    }

    onClick: buttonOnClickFn;
}

export class ToolbarService {
    private toolbars: VeApiObject<ToolbarApi> = {};
    private buttons: { [key: string]: IToolBarButton } = {};
    private dynamicButtons: { [key: string]: IToolBarButton } = {};
    private veConfig: VeConfig;

    static $inject = ['$q', 'EventService'];

    constructor(private $q: VeQService, private eventSvc: EventService) {
        this.veConfig = window.__env;
        if (this.veConfig.expConfig) {
            for (const ext of Object.keys(this.veConfig.expConfig)) {
                if (this.veConfig.expConfig[ext] && this.veConfig.expConfig[ext].length > 0) {
                    for (const tool of this.veConfig.expConfig[ext]) {
                        if (tool.toolButton) {
                            this.registerToolbarButtons(tool.toolButton);
                        }
                        if (tool.toolDynamicButton && tool.toolDynamicButton.length > 0) {
                            this.registerDynamicButtons(tool.toolDynamicButton);
                        }
                    }
                }
            }
        }
    }

    public waitForApi = (id: string): VePromise<ToolbarApi, void> => {
        if (!this.toolbars.hasOwnProperty(id)) {
            this.toolbars[id] = {};
            this.toolbars[id].promise = new this.$q<ToolbarApi, void>((resolve, reject) => {
                this.toolbars[id].resolve = resolve;
                this.toolbars[id].reject = reject;
            });
        }
        return this.toolbars[id].promise;
    };

    public initApi(
        id: string,
        init: toolbarInitFn,
        ctrl: angular.IComponentController,
        buttons?: IToolBarButton[],
        dynamicButtons?: IToolBarButton[],
        initialSelection?: string
    ): ToolbarApi {
        if (!id) {
            throw new Error('Unable to create Toolbar, missing id');
        }
        if (!this.toolbars[id]) {
            this.toolbars[id] = {};
        }
        if (!this.toolbars[id].resolve) {
            this.toolbars[id].promise = new this.$q((resolve, reject) => {
                this.toolbars[id].resolve = resolve;
                this.toolbars[id].reject = reject;
            });
        }

        // if (!ctrl.$onDestroy) {
        //     ctrl.$onDestroy = (): void => {
        //         this.destroyApi(id)
        //     }
        // }

        const api = new ToolbarApi(id);
        if (buttons && buttons.length > 0) {
            this.registerToolbarButtons(buttons);
        }
        if (dynamicButtons && dynamicButtons.length > 0) {
            this.registerDynamicButtons(dynamicButtons);
        }

        init(api);
        this.toolbars[id].api = api;

        if (api.buttons.length > 0) {
            let inspect: IToolBarButton;
            if (initialSelection) {
                inspect = this.getToolbarButton(initialSelection);
            } else {
                inspect = api.buttons[0];
            }

            //Initialize Toolbar Clicked Subject
            this.eventSvc.resolve<veCoreEvents.toolbarClicked>(id, {
                id: inspect.id,
                title: inspect.tooltip,
            });
        }

        this.toolbars[id].resolve(api);
        return api;
    }

    public destroyApi = (id: string): void => {
        if (this.toolbars.hasOwnProperty(id)) {
            delete this.toolbars[id];
        }
    };

    public registerToolbarButtons = (buttons: IToolBarButton | IToolBarButton[]): void => {
        if (!Array.isArray(buttons)) {
            buttons = [buttons];
        }
        if (buttons.length > 0) {
            for (const button of buttons) {
                if (!this.buttons[button.id]) {
                    this.buttons[button.id] = button;
                }
            }
        }
    };
    public registerDynamicButtons = (dynamicButtons: IToolBarButton | IToolBarButton[]): void => {
        if (!Array.isArray(dynamicButtons)) {
            dynamicButtons = [dynamicButtons];
        }
        if (dynamicButtons.length > 0) {
            for (const button of dynamicButtons) {
                if (!this.dynamicButtons[button.id]) {
                    this.dynamicButtons[button.id] = button;
                }
            }
        }
    };

    public attachDynamicButtons;

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
            const newButton = new ToolButton(buttonId, this.buttons[buttonId]);
            if (this.buttons[buttonId].dynamic_ids) {
                newButton.dynamicButtons = [];
                for (const id of this.buttons[buttonId].dynamic_ids) {
                    newButton.dynamicButtons.push(new ToolButton(id, this.getDynamicButton(id)));
                }
            }
            return newButton;
        } else {
            return (this.buttons[buttonId] = new ToolButton(buttonId));
        }
    };

    public getDynamicButton = (button: string): IToolBarButton => {
        if (this.dynamicButtons.hasOwnProperty(button)) {
            return this.dynamicButtons[button];
        }
    };

    static error(reason?: VePromiseReason<unknown>): string {
        if (reason && reason.message) return 'Toolbar error: ' + reason.message;
        else return 'Toolbar Error!';
    }
}

veCore.service('ToolbarService', ToolbarService);
