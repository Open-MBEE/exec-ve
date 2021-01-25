import * as angular from "angular";
var mmsDirectives = angular.module('mmsDirectives');

export class ButtonBarApi {
  buttons = [];

  select = (parentButton, childButton) => {
    if(parentButton && childButton) {
      parentButton.dropdown_buttons.forEach((dropdownButton) => {
        dropdownButton.selected = dropdownButton.id === childButton.id;
      });
    }
  };

  setPermission = (id, permission) => {
    this.buttons.forEach((button) => {
      if (button.id === id)
        button.permission = permission;
    });
  };

  setTooltip = (id, tooltip) => {
    this.buttons.forEach((button) => {
      if (button.id === id)
        button.tooltip = tooltip;
    });
  };

  setIcon = (id, icon) => {
    this.buttons.forEach((button) => {
      if (button.id === id)
        button.icon = icon;
    });
  };

  setToggleState = (id, state) => {
    this.buttons.forEach((button) => {
      if (button.id === id) {
        if (button.togglable) {
          var original = button.toggle_state;
          if ((!original && state) || (original && !state))
            this.toggleButtonState(id);
        }
      }
    });
  };

  getToggleState = (id) => {
    var buttonTemp = {
      toggle_state: false
    };
    //buttonTemp.toggle_state = false;

    this.buttons.forEach((button) => {
      if (button.id === id) {
        buttonTemp = button;
        if (! button.togglable) button.toggle_state = false;
        if (! button.toggle_state) button.toggle_state = false;
      }
    });

    return buttonTemp.toggle_state;
  };

  addButton = (button) => {
    //TODO: Determine if count can actually be replaced by length here
    if (this.buttons.length === 0) {
      button.placement = "bottom-left";
    }
    else if (!button.placement) {
      // else {
      button.placement = "bottom";
    }

    if (button.togglable) {
      button.toggle_state = false;
      button.tooltip_orginal = button.tooltip;
    }
    button.icon_original = button.icon;

    this.buttons.push(button);
  };

  toggleButtonSpinner = (id) => {
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

  toggleButtonState = (id) => {
    this.buttons.forEach((button) => {
      if (button.id === id) {
        if (button.togglable) {
          button.toggle_state = !button.toggle_state;
          if (button.toggle_state && button.toggle_icon && button.toggle_tooltip) {
            button.icon = button.toggle_icon;
            button.tooltip = button.toggle_tooltip;
          }
          else {
            button.icon = button.icon_original;
            button.tooltip = button.tooltip_orginal;
          }
        }
      }
    });
  };
}

const buttonBarService = () => {
  return new ButtonBarApi();
}

mmsDirectives
  .service("ButtonBarService", buttonBarService);