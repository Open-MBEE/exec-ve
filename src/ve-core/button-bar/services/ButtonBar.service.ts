import { BarButton, ButtonBarApi, IButtonBarButton } from '@ve-core/button-bar';
import { EventService } from '@ve-utils/core';

import { veUtils } from '@ve-utils';

import { VePromise, VeQService } from '@ve-types/angular';
import { VeConfig } from '@ve-types/config';
import { EditorActions } from '@ve-types/core/editor';
import { VeApiObject } from '@ve-types/view-editor';

const default_buttons: IButtonBarButton[] = [
    {
        id: 'button-bar-menu',
        icon: 'fa-solid fa-bars',
        selectable: false,
        tooltip: 'menu',
        placement: 'bottom-left',
        dropdown: {
            icon: 'fa-solid fa-caret-down',
            toggle_icon: 'fa-solid fa-caret-up',
            ids: [],
        },
    },
];

export interface buttonInitFn {
    (api: ButtonBarApi): void;
}

export class ButtonBarService {
    static $inject = ['$q', 'EventService'];

    private barCounter: { [id: string]: number } = {};
    private buttons: { [key: string]: IButtonBarButton } = {};
    private buttonBars: VeApiObject<ButtonBarApi> = {};
    private veConfig: VeConfig;

    constructor(private $q: VeQService, private eventSvc: EventService) {
        for (const button of default_buttons) {
            this.buttons[button.id] = button;
        }
        this.veConfig = window.__env;
        if (this.veConfig.expConfig) {
            for (const ext of Object.keys(this.veConfig.expConfig)) {
                if (this.veConfig.expConfig[ext] && this.veConfig.expConfig[ext].length > 0) {
                    for (const tool of this.veConfig.expConfig[ext]) {
                        if (tool.barButtons) {
                            this.registerButtons(tool.barButtons);
                        }
                    }
                }
            }
        }
    }

    public waitForApi = (id: string): VePromise<ButtonBarApi, void> => {
        if (!this.buttonBars.hasOwnProperty(id)) {
            this.buttonBars[id] = {};
            this.buttonBars[id].promise = new this.$q<ButtonBarApi, void>((resolve, reject) => {
                this.buttonBars[id].resolve = resolve;
                this.buttonBars[id].reject = reject;
            });
        }
        return this.buttonBars[id].promise;
    };

    public generateBarId = (root?: string): string => {
        if (!root) {
            root = 'button_bar';
        }
        if (!this.barCounter[root]) this.barCounter[root] = 1;
        else this.barCounter[root]++;
        return `${root}_${this.barCounter[root]}`;
    };

    public initApi(id: string, init: buttonInitFn, buttons?: IButtonBarButton[]): ButtonBarApi {
        if (!init) {
            return null;
        }
        const api = new ButtonBarApi(id);

        if (buttons && buttons.length > 0) {
            this.registerButtons(buttons);
        }

        init(api);
        if (!this.buttonBars[id]) {
            this.buttonBars[id] = {
                api,
            };
        } else {
            this.buttonBars[id].api = api;
        }
        if (!this.buttonBars[id].resolve) {
            this.buttonBars[id].promise = new this.$q((resolve, reject) => {
                this.buttonBars[id].resolve = resolve;
                this.buttonBars[id].reject = reject;
            });
        }
        this.buttonBars[id].resolve(api);
        return api;
    }

    destroy(id: string): void {
        if (this.buttonBars.hasOwnProperty(id)) {
            delete this.buttonBars[id];
        }
    }

    destroyAll(ids: string[]): void {
        ids.forEach((bbId) => {
            this.destroy(bbId);
        });
    }

    getButtonBarButton = (buttonId: string, ctrl?: EditorActions): BarButton => {
        if (this.buttons.hasOwnProperty(buttonId)) {
            const newButton = new BarButton(buttonId, this.buttons[buttonId]);
            if (this.buttons[buttonId].dropdown) {
                newButton.dropdown_buttons = [];
                for (const id of this.buttons[buttonId].dropdown.ids) {
                    newButton.dropdown_buttons.push(this.getButtonBarButton(id, ctrl));
                }
            }
            if (this.buttons[buttonId].api && ctrl && ctrl[this.buttons[buttonId].api]) {
                newButton.setAction((event): void => {
                    if (event) event.stopPropagation();
                    (ctrl[this.buttons[buttonId].api] as () => void)();
                });
            }
            return newButton;
        } else {
            return new BarButton(buttonId);
        }
    };

    getButtonDefinition = (buttonId: string): IButtonBarButton => {
        if (this.buttons.hasOwnProperty(buttonId)) {
            return this.buttons[buttonId];
        }
        return null;
    };

    public registerButtons = (buttons: IButtonBarButton | IButtonBarButton[]): void => {
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
}

veUtils.service('ButtonBarService', ButtonBarService);
