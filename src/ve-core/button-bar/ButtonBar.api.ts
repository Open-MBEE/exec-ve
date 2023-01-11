import { buttonInitFn, IButtonBarButton } from '@ve-core/button-bar'

export interface ButtonWrapEvent {
    oldSize: number
    newSize: number
}

export class ButtonBarApi {
    public buttons: IButtonBarButton[] = []
    public WRAP_EVENT: string

    constructor(public id: string, public init: buttonInitFn) {
        if (this.id === '') {
            this.id = 'unknown'
        }
        this.WRAP_EVENT = `${id}-wrap`
    }

    public getId = (): string => {
        return this.id
    }

    public getButtons = (): IButtonBarButton[] => {
        return this.buttons
    }

    public resetButtons = (): void => {
        this.buttons = []
        this.init(this)
    }

    public select = (
        parentButton: IButtonBarButton,
        childButton: IButtonBarButton
    ): void => {
        if (parentButton && childButton && childButton.selectable) {
            parentButton.dropdown_buttons.forEach((dropdownButton) => {
                if (parentButton.dropdown_toggleable) {
                    if (dropdownButton.id === childButton.id) {
                        dropdownButton.selected = dropdownButton.selected
                            ? !dropdownButton.selected
                            : true
                    }
                } else {
                    dropdownButton.selected =
                        dropdownButton.id === childButton.id
                }
            })
        }
    }

    public deselect = (
        parentButton: IButtonBarButton,
        childButton: IButtonBarButton
    ): void => {
        if (parentButton && childButton) {
            parentButton.dropdown_buttons.forEach((dropdownButton) => {
                if (parentButton.dropdown_toggleable) {
                    if (dropdownButton.id === childButton.id) {
                        dropdownButton.selected = false
                    }
                }
            })
        }
    }

    public deselectAll = (id: string): void => {
        this.buttons.forEach((button) => {
            if (button.id === id && button.dropdown_buttons) {
                button.dropdown_buttons.forEach((dropdownButton) => {
                    if (button.dropdown_toggleable) {
                        dropdownButton.selected = false
                    }
                })
            }
        })
    }

    public setPermission = (id: string, permission: boolean): void => {
        this.buttons.forEach((button) => {
            if (button.id === id) button.permission = permission
        })
    }

    public setActive = (id: string, state: boolean, parent?: string): void => {
        this.buttons.forEach((button) => {
            if (parent && button.id === parent && button.dropdown_buttons) {
                button.dropdown_buttons.forEach((child) => {
                    if (child.id === id) child.active = state
                })
            }
            if (button.id === id) button.active = state
        })
    }

    public setTooltip = (id: string, tooltip: string): void => {
        this.buttons.forEach((button) => {
            if (button.id === id) button.tooltip = tooltip
        })
    }

    public setIcon = (id: string, icon: string): void => {
        this.buttons.forEach((button) => {
            if (button.id === id) button.icon = icon
        })
    }

    public setToggleState = (id: string, state: boolean): void => {
        this.buttons.forEach((button) => {
            if (button.id === id) {
                if (button.toggleable) {
                    const original = button.toggle_state
                    if (original != state) this.toggleButtonState(id, state)
                }
            }
        })
    }

    public getToggleState = (id: string): boolean => {
        let buttonTemp: IButtonBarButton = {} as IButtonBarButton

        this.buttons.forEach((button: IButtonBarButton) => {
            if (button.id === id) {
                buttonTemp = button
                if (!button.toggleable) button.toggle_state = false
                if (!button.toggle_state) button.toggle_state = false
            }
        })

        return buttonTemp.toggle_state ? buttonTemp.toggle_state : false
    }

    public addButton = (button: IButtonBarButton): void => {
        this._initButton(button)
        this.buttons.push(button)
    }

    private _initButton = (button: IButtonBarButton): void => {
        if (this.buttons.length === 0) {
            button.placement = 'bottom-left'
        } else if (!button.placement) {
            // else {
            button.placement = 'bottom'
        }

        if (button.toggleable) {
            button.toggle_state = false
            button.tooltip_orginal = button.tooltip
        }
        button.icon_original = button.icon
        if (button.dropdown_toggleable) {
            button.dropdown_toggle_state = false
        }
        if (button.dropdown_icon) {
            button.dropdown_icon_original = button.dropdown_icon
        }
        if (typeof button.active === 'undefined') {
            button.active = true
        }
        if (button.dropdown_buttons && button.dropdown_buttons.length > 0)
            button.dropdown_buttons.forEach((b) => this._initButton(b))
    }

    public toggleButtonSpinner = (id: string): void => {
        this.buttons.forEach((button) => {
            if (button.id === id) {
                if (button.spinner) {
                    button.icon = button.icon_original
                } else {
                    button.icon_original = button.icon
                    button.icon = 'fa fa-spinner fa-spin'
                }
                button.spinner = !button.spinner
            }
        })
    }

    public toggleButtonState = (id: string, state?: boolean): void => {
        this.buttons.forEach((button) => {
            if (button.id === id) {
                if (button.toggleable) {
                    button.toggle_state =
                        state != null ? state : !button.toggle_state
                    if (button.toggle_state) {
                        if (button.toggle_tooltip) {
                            button.tooltip = button.toggle_tooltip
                        }
                        if (button.toggle_icon) {
                            button.icon = button.toggle_icon
                        }
                    } else {
                        button.icon = button.icon_original
                        if (button.tooltip_orginal) {
                            button.tooltip = button.tooltip_orginal
                        }
                    }
                }
                if (button.dropdown_toggleable && button.dropdown_icon) {
                    button.dropdown_toggle_state =
                        state != null ? state : !button.dropdown_toggle_state
                    if (
                        button.dropdown_toggle_state &&
                        button.dropdown_toggle_icon
                    ) {
                        button.dropdown_icon = button.dropdown_toggle_icon
                        button.tooltip = button.toggle_tooltip
                    } else {
                        button.dropdown_icon = button.dropdown_icon_original
                    }
                }
            }
        })
    }
}
