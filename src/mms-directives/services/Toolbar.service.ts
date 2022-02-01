import * as angular from "angular";
var mmsDirectives = angular.module('mmsDirectives');

function ToolbarService() {

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

class ToolbarApi {

  public buttons

  public init

  constructor(buttons, initFn) {
    this.buttons = buttons;

    if (initFn) {
      this.init = initFn;
    }

  }

  select = (id) => {
    this.buttons.forEach((button) =>
    {
      if (button.id === id && button.active)
      {
        // button.selected = true;
        // $scope.clicked(button);
        if (!button.dynamic)
        {
          this.buttons.forEach((b) =>
          {
            b.selected = b === button;
          });

          // de-activate all dynamic this.buttons
          this.buttons.forEach((b) =>
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

  deactivate = (id) => {
    this.buttons.forEach((button) =>
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

  setPermission = (id, permission) => {
    this.buttons.forEach((button) =>
    {
      if (button.id === id) {
        button.permission = permission;
      }
    });
  };

  setSelected = (id, selected) => {
    this.buttons.forEach((button) => {
      if (button.id === id) {
        button.selected = selected;
      }
    });
  };

  setIcon = (id, icon) => {
    this.buttons.forEach((button) => {
      if (button.id === id) {
        button.icon = icon;
      }
    });
  };

  addButton = (button) => {
    button.priority = this.buttons.length;
    this.buttons.push(button);
    if (button.dynamic_buttons) {
      var firstButton = true;
      button.dynamic_buttons.forEach((buttonLoop) =>
      {
        if (firstButton)
        {
          buttonLoop.pullDown = true;
          firstButton = false;
        }
        buttonLoop.priority = this.buttons.length + 1000;
        this.buttons.push(buttonLoop);
      });
    }
  };

  toggleButtonSpinner = (id) => {
    this.buttons.forEach((button) =>
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

  setOptions = (id, options) =>
  {
    this.buttons.forEach((button) =>
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

};

mmsDirectives
  .service("ToolbarService", ToolbarService);