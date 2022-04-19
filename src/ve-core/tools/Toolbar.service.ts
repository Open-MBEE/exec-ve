import * as angular from "angular";
import {veCore} from "../ve-core.module";

/* Interfaces (Temporary) */
export interface TButton {
  id: string,
  icon: string,
  dynamic?: boolean,
  selected: boolean,
  active: boolean,
  permission: boolean,
  tooltip: string,
  spinner: boolean,
  onClick: buttonOnClickFn,
  dynamic_buttons?: TButton[]
}

export interface buttonOnClickFn {
  (button?: TButton):void
}

export class ToolbarService {
  
  public constants = {
    SETPERMISSION: 'tb-set-permission',
    SETICON: 'tb-set-icon',
    TOGGLEICONSPINNER: 'tb-toggle-icon-spinner',
    SELECT: 'tb-select'
  };

  private readonly tbApi
  
  public buttons: TButton[] = [];

  static $inject = [];
  constructor() {
    this.tbApi = new ToolbarApi(this.buttons);
  }

  getApi() {
    return this.tbApi;
  };

}

export class ToolbarApi {

  public buttons

  public init

  constructor(buttons, initFn?) {
    this.buttons = buttons;

    if (initFn) {
      this.init = initFn;
    }

  }
  
  setInit(initFn) {
    this.init = initFn;
  }

  select(id) {
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

  deactivate(id) {
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

  setPermission(id: string, permission) {
    this.buttons.forEach((button) =>
    {
      if (button.id === id) {
        button.permission = permission;
      }
    });
  };

  setSelected(id: string, selected: boolean) {
    this.buttons.forEach((button) => {
      if (button.id === id) {
        button.selected = selected;
      }
    });
  };

  setIcon(id: string, icon) {
    this.buttons.forEach((button) => {
      if (button.id === id) {
        button.icon = icon;
      }
    });
  };

  addButton(button) {
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

  toggleButtonSpinner(id) {
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

}

veCore
  .service("ToolbarService", ToolbarService);