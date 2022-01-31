'use strict';

angular.module('mms')
    .factory('ToolbarService', [ToolbarService]);

function ToolbarService() {
    // this.buttons = [];
    // this.initFn = null;

    const getApi = (buttons, initFn) => {
        if (!buttons) {
            buttons = [];
        }
        if (!initFn) {
            initFn = () => {};
        }
        this.tbApi = new ToolbarApi(buttons,initFn);
        return this.tbApi;
    };

    const isApi = (tbApi) => {
        return tbApi instanceof ToolbarApi;
    };

    const constants = {
        SETPERMISSION: 'tb-set-permission',
        SETICON: 'tb-set-icon',
        TOGGLEICONSPINNER: 'tb-toggle-icon-spinner',
        SELECT: 'tb-select'
    };

    return {
        getApi: getApi,
        isApi: isApi,
        constants: constants,

    };
}

function ToolbarApi(buttons, initFn) {

    this.buttons = buttons;

    this.select = (id) => {
        buttons.forEach((button) =>
        {
            if (button.id === id && button.active)
            {
                // button.selected = true;
                // $scope.clicked(button);
                if (!button.dynamic)
                {
                    buttons.forEach((b) =>
                    {
                        b.selected = b === button;
                    });

                    // de-activate all dynamic buttons
                    buttons.forEach((b) =>
                    {
                        if (b.dynamic)
                        {
                            b.active = false;
                        }
                    });

                    if (button.dynamic_buttons)
                    {
                        button.dynamic_buttons.forEach((b) =>
                        {
                            b.active = true;
                        });
                    }
                }

            }
            //else
            // button.selected = false;
        });
    };

    this.deactivate = (id) => {
        buttons.forEach((button) =>
        {
            if (button.id === id)
            {
                if (button.dynamic_buttons)
                {
                    // de-activate all dynamic buttons
                    button.dynamic_buttons.forEach((b) =>
                    {
                        b.active = false;
                    });
                }
            }
        });
    };

    this.setPermission = (id, permission) => {
        buttons.forEach((button) =>
        {
            if (button.id === id) {
                button.permission = permission;
            }
        });
    };

    this.setSelected = (id, selected) => {
        buttons.forEach((button) => {
            if (button.id === id) {
                button.selected = selected;
            }
        });
    };

    this.setIcon = (id, icon) => {
        buttons.forEach((button) => {
            if (button.id === id) {
                button.icon = icon;
            }
        });
    };

    this.addButton = (button) => {
        button.priority = buttons.length;
        buttons.push(button);
        if (button.dynamic_buttons) {
            var firstButton = true;
            button.dynamic_buttons.forEach((buttonLoop) =>
            {
                if (firstButton)
                {
                    buttonLoop.pullDown = true;
                    firstButton = false;
                }
                buttonLoop.priority = buttons.length + 1000;
                buttons.push(buttonLoop);
            });
        }
    };

    this.toggleButtonSpinner = (id) => {
        buttons.forEach((button) =>
        {
            if (button.id === id)
            {
                if (button.spinner)
                {
                    button.icon = button.icon_original;
                }
                else
                {
                    button.icon_original = button.icon;
                    button.icon = 'fa fa-spinner fa-spin';
                }
                button.spinner = !button.spinner;
            }
        });
    };

    this.setOptions = (id, options) =>
    {
        buttons.forEach((button) =>
        {
            if (button.id === id)
            {
                if (options.active !== null) button.active = options.active;
                if (options.icon !== null) button.icon = options.icon;
                if (options.id !== null) button.id = options.id;
                if (options.permission !== null) button.permission = options.permission;
                if (options.priority !== null) button.priority = options.priority;
                if (options.selected !== null) button.selected = options.selected;
                if (options.spinner !== null) button.spinner = options.spinner;
                if (options.tooltip !== null) button.tooltip = options.tooltip;
            }
        });
    };

    if (initFn) {
        this.init = initFn;
    }

    return this;

}