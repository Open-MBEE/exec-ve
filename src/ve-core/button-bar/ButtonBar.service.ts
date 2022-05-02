import * as angular from "angular";
import {IScope} from "angular";
import {veCore} from "../ve-core.module";

export interface BButton {
  id: string,
  icon?: string,
  icon_original?: string,
  tooltip_orginal?: string,
  selected: boolean,
  active: boolean,
  permission: boolean,
  tooltip: string,
  button_content?: string,
  spinner: boolean,
  toggleable: boolean,
  toggle_state?: boolean,
  toggle_icon?: string,
  toggle_tooltip?: string,
  placement?: string,
  action: buttonActionFn,
  dropdown_buttons?: BButton[]
}

export interface buttonActionFn {
  (event?: angular.IAngularEvent): void;
}

export interface buttonInitFn {
  (api: ButtonBarApi): void
}

export class ButtonBarApi {

  public buttons: BButton[]
  public id
  
  constructor(id) {
    this.id = id;
    this.buttons = [];
  }
  
  getId() {
    return this.id;
  }
  
  getButtons() {
    return this.buttons;
  }

  select(parentButton, childButton) {
    if(parentButton && childButton) {
      parentButton.dropdown_buttons.forEach((dropdownButton) => {
        dropdownButton.selected = dropdownButton.id === childButton.id;
      });
    }
  };

  setPermission(id: string, permission: boolean) {
    this.buttons.forEach((button) => {
      if (button.id === id)
        button.permission = permission;
    });
  };

  setTooltip(id, tooltip) {
    this.buttons.forEach((button) => {
      if (button.id === id)
        button.tooltip = tooltip;
    });
  };

  setIcon(id, icon) {
    this.buttons.forEach((button) => {
      if (button.id === id)
        button.icon = icon;
    });
  };

  setToggleState(id, state) {
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

  getToggleState(id): boolean  {
    var buttonTemp: BButton = {} as BButton;

    this.buttons.forEach((button: BButton) => {
      if (button.id === id) {
        buttonTemp = button;
        if (! button.toggleable) button.toggle_state = false;
        if (! button.toggle_state) button.toggle_state = false;
      }
    });

    return (buttonTemp.toggle_state) ? (buttonTemp.toggle_state) : false;
  };

  addButton(button: BButton) {
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

  toggleButtonSpinner(id) {
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

  toggleButtonState(id) {
    this.buttons.forEach((button) => {
      if (button.id === id) {
        if (button.toggleable) {
          button.toggle_state = !button.toggle_state;
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



export class ButtonBarService {

  private buttonBars = {}
          barCounter = 0

  getApi(id) {
    if (this.buttonBars.hasOwnProperty(id)) {
      return this.buttonBars[id];
    }
    return null;
  }


  initApi(id: string, init: buttonInitFn, ctrl: { bars: string[] } & angular.IComponentController) {
    if (id === '') {
      this.barCounter++
      id = this.barCounter.toString();
    }else if (this.buttonBars.hasOwnProperty(id)) {
      return this.buttonBars[id];
    }
    if (ctrl) {
      ctrl.bars = [];
    if (!ctrl.$onDestroy) {
      ctrl.$onDestroy = () => {
            this.destroy(ctrl.bars);
      };
    }
      ctrl.bars.push(id);
    }
    if (!init) {
      return new Error("Illegal Bar initialization")
    }
      let api = new ButtonBarApi(id);
      init(api);
      this.buttonBars[id] = api;
      return api;
  }

  destroy(bars: string[]) {
      if (bars && bars.length !== 0) {
        for (var i = 0; i < bars.length; i++) {
          if (this.buttonBars.hasOwnProperty(bars[i])){
            delete this.buttonBars[bars[i]];
          }
        }
      }
  };

}

ButtonBarService.$inject = [];

veCore
  .service("ButtonBarService", ButtonBarService);