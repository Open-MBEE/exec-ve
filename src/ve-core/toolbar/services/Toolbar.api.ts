import { IToolBarButton } from '@ve-core/toolbar'

export class ToolbarApi {
    public buttons: IToolBarButton[] = []

    constructor(public id: string) {}

    public select = (id: string): void => {
        this.buttons.forEach((button) => {
            if (button.id === id && button.active) {
                // button.selected = true;
                // $scope.clicked(button);
                if (!button.dynamic) {
                    this.buttons.forEach((b) => {
                        b.selected = b.id === button.id
                    })

                    // de-activate all dynamic this.buttons
                    this.buttons.forEach((b) => {
                        if (b.dynamic) {
                            b.active = false
                        }
                    })

                    if (button.dynamic_buttons) {
                        button.dynamic_buttons.forEach((b) => {
                            b.active = true
                        })
                    }
                }
            }
            //else
            // button.selected = false;
        })
    }

    public deactivate = (id: string): void => {
        this.buttons.forEach((button) => {
            if (button.id === id) {
                if (button.dynamic_buttons) {
                    // de-activate all dynamic buttons
                    button.dynamic_buttons.forEach((b) => {
                        b.active = false
                    })
                }
            }
        })
    }

    public setPermission = (id: string, permission: boolean): void => {
        this.buttons.forEach((button) => {
            if (button.id === id) {
                button.permission = permission
            }
        })
    }

    public setSelected = (id: string, selected: boolean): void => {
        this.buttons.forEach((button) => {
            if (button.id === id) {
                button.selected = selected
            }
        })
    }

    public setIcon = (id: string, icon: string): void => {
        this.buttons.forEach((button) => {
            if (button.id === id) {
                button.icon = icon
            }
        })
    }

    public addButton = (button: IToolBarButton): void => {
        button.priority = this.buttons.length
        this.buttons.push(button)
        if (button.dynamic_buttons) {
            let firstButton = true
            button.dynamic_buttons.forEach((buttonLoop) => {
                if (
                    !this.buttons
                        .map((button) => button.id)
                        .includes(buttonLoop.id)
                ) {
                    if (firstButton) {
                        buttonLoop.pullDown = true
                        firstButton = false
                    }
                    buttonLoop.priority = this.buttons.length + 1000
                    this.buttons.push(buttonLoop)
                }
            })
        }
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
}
