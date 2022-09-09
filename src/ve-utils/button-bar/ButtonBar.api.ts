import {buttonInitFn, IButtonBarButton} from "@ve-utils/button-bar";

export class ButtonBarApi {

    public buttons: IButtonBarButton[] = []

    constructor(public id, public init: buttonInitFn) {
    }



     public getId = () => {
        return this.id;
    }

     public getButtons = () => {
        return this.buttons;
    }

     public resetButtons = () => {
        this.buttons = [];
        this.init(this);
    }

     public select = (parentButton, childButton) => {
        if(parentButton && childButton) {
            parentButton.dropdown_buttons.forEach((dropdownButton) => {
                dropdownButton.selected = dropdownButton.id === childButton.id;
            });
        }
    };

     public setPermission = (id: string, permission: boolean) => {
        this.buttons.forEach((button) => {
            if (button.id === id)
                button.permission = permission;
        });
    };

     public setTooltip = (id, tooltip) => {
        this.buttons.forEach((button) => {
            if (button.id === id)
                button.tooltip = tooltip;
        });
    };

     public setIcon = (id, icon) => {
        this.buttons.forEach((button) => {
            if (button.id === id)
                button.icon = icon;
        });
    };

     public setToggleState = (id, state) => {
        this.buttons.forEach((button) => {
            if (button.id === id) {
                if (button.toggleable) {
                    var original = button.toggle_state;
                    if ((!original && state) || (original && !state))
                        this.toggleButtonState(id);
                }
            }
        });
    };

    public getToggleState = (id): boolean =>  {
        var buttonTemp: IButtonBarButton = {} as IButtonBarButton;

        this.buttons.forEach((button: IButtonBarButton) => {
            if (button.id === id) {
                buttonTemp = button;
                if (! button.toggleable) button.toggle_state = false;
                if (! button.toggle_state) button.toggle_state = false;
            }
        });

        return (buttonTemp.toggle_state) ? (buttonTemp.toggle_state) : false;
    };

     public addButton = (button: IButtonBarButton) => {
        //TODO: Determine if count can actually be replaced by length here
        if (this.buttons.length === 0) {
            button.placement = "bottom-left";
        }
        else if (!button.placement) {
            // else {
            button.placement = "bottom";
        }

        if (button.toggleable) {
            button.toggle_state = false;
            button.tooltip_orginal = button.tooltip;
        }
        button.icon_original = button.icon;

        this.buttons.push(button);
    };

    public toggleButtonSpinner = (id) => {
        this.buttons.forEach((button) => {
            if (button.id === id) {
                if (button.spinner) {
                    button.icon = button.icon_original;
                }
                else {
                    button.icon_original = button.icon;
                    button.icon = 'fa fa-spinner fa-spin';
                }
                button.spinner = ! button.spinner;
            }
        });
    };

     public toggleButtonState = (id: string, state?: boolean) => {
        this.buttons.forEach((button) => {
            if (button.id === id) {
                if (button.toggleable) {
                    button.toggle_state = (state != null) ? state : !button.toggle_state;
                    if (button.toggle_state && button.toggle_icon && button.toggle_tooltip) {
                        button.icon = button.toggle_icon;
                        button.tooltip = button.toggle_tooltip;
                    }
                    else {
                        button.icon = button.icon_original;
                        if (button.icon_original) {
                            button.tooltip = <string>button.tooltip_orginal;
                        }

                    }
                }
            }
        });
    };
}
