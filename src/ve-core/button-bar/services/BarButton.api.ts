export interface IButtonBarButton {
    id: string;
    icon: string;
    tooltip: string;
    placement?: string;
    button_content?: string;
    selectable: boolean;
    //Toggle Config
    toggle?:
        | {
              icon?: string;
              tooltip?: string;
          }
        | boolean;
    //Dropdown Config
    dropdown?: {
        icon: string;
        toggle_icon: string;
        ids: string[];
    };
    api?: string;
    enabledFor?: string[];
    disabledFor?: string[];
    type?: string;
}
export interface buttonActionFn {
    (event?: JQuery.ClickEvent): void;
}
export class BarButton {
    //configs
    id: string;
    icon: string = 'fa-gears';
    tooltip: string = 'Generic Button';
    dropdown_icon: string = '';
    button_content: string = '';
    placement?: string;

    //State
    active: boolean = true;
    selected: boolean = false;
    permission: boolean = true;
    toggled: boolean = false;
    dropdown_toggled: boolean = false;
    spinner: boolean = false;
    locked: boolean = false;

    //Toggle Configuration

    //Set Custom Click actions
    action?: buttonActionFn;

    dropdown_buttons: BarButton[] = [];

    //Internal
    readonly dropdown_icon_original: string;
    readonly tooltip_original: string;
    readonly icon_original: string;

    constructor(id: string, readonly config?: IButtonBarButton) {
        this.id = id;
        if (this.config) {
            if (this.config.icon) this.icon = this.icon_original = this.config.icon;

            if (this.config.tooltip) {
                this.tooltip = this.tooltip_original = this.config.tooltip;
            }
            if (this.config.button_content) {
                this.button_content = this.config.button_content;
            }
            if (this.config.dropdown && this.config.dropdown.icon && this.config.dropdown.icon !== '') {
                this.dropdown_icon = this.dropdown_icon_original = this.config.dropdown.icon;
            }
        }
    }

    public setAction = (action: buttonActionFn): void => {
        this.action = action;
    };

    public toggle = (state?: boolean): void => {
        if (this.config.toggle) {
            this.toggled = state != null ? state : !this.toggled;
            if (this.toggled) {
                if ((this.config.toggle as { tooltip: string; icon: string }).tooltip) {
                    this.tooltip = (this.config.toggle as { tooltip: string; icon: string }).tooltip;
                }
                if ((this.config.toggle as { tooltip: string; icon: string }).icon) {
                    this.icon = (this.config.toggle as { tooltip: string; icon: string }).icon;
                }
            } else {
                this.icon = this.icon_original;
                if (this.tooltip_original) {
                    this.tooltip = this.tooltip_original;
                }
            }
        }
        if (this.config.dropdown && this.config.dropdown.icon) {
            this.dropdown_toggled = state != null ? state : !this.dropdown_toggled;
            if (this.dropdown_toggled && this.config.dropdown.toggle_icon) {
                this.dropdown_icon = this.config.dropdown.toggle_icon;
            } else {
                this.dropdown_icon = this.dropdown_icon_original;
            }
        }
    };

    public toggleSpin = (): void => {
        if (this.spinner) {
            if (this.toggled && this.config.toggle) {
                this.icon = (this.config.toggle as { tooltip: string; icon: string }).icon;
            } else {
                this.icon = this.icon_original;
            }
        } else {
            this.icon = 'fa fa-spinner fa-spin';
        }
        this.spinner = !this.spinner;
    };

    public toggleLock = (): void => {
        this.locked = !this.locked;
    };
}
