
import * as angular from 'angular';

export class MMSToolbarApi {

  mmsTbApi
  buttons = [];

  constructor(buttons, mmsTbApi?) {
    this.buttons = buttons;

    if (mmsTbApi) {
      this.mmsTbApi = mmsTbApi;
    }
  }


			//if ($scope.mmsTbApi)
			//{
				//var api = $scope.mmsTbApi;

  select(id) {
    this.buttons.forEach(function(button)
    {
      if (button.id === id && button.active)
      {
        // button.selected = true;
        // $scope.clicked(button);
        if (!button.dynamic)
        {
          this.buttons.forEach(function(b)
          {
            if (b === button)
            {
              b.selected = true;
            }
            else b.selected = false;
          });

          // de-activate all dynamic buttons
          this.buttons.forEach(function(b)
          {
            if (b.dynamic)
            {
              b.active = false;
            }
          });

          if (button.dynamic_buttons)
          {
            button.dynamic_buttons.forEach(function(b)
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
    this.buttons.forEach(function(button)
    {
      if (button.id === id)
      {
        if (button.dynamic_buttons)
        {
          // de-activate all dynamic buttons
          button.dynamic_buttons.forEach(function(b)
          {
            b.active = false;
          });
        }
      }
    });
  };

  setPermission(id, permission) {
    this.buttons.forEach(function(button)
    {
      if (button.id === id) {
        button.permission = permission;
      }
    });
  };

  setSelected = function(id, selected) {
    this.buttons.forEach(function(button) {
      if (button.id === id) {
        button.selected = selected;
      }
    });
  };

  setIcon(id, icon) {
    this.buttons.forEach(function(button) {
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
      button.dynamic_buttons.forEach(function(button)
      {
        if (firstButton)
        {
          button.pullDown = true;
          firstButton = false;
        }
        button.priority = this.buttons.length + 1000;
        this.buttons.push(button);
      });
    }
  };

  toggleButtonSpinner(id) {
      this.buttons.forEach(function(button)
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

    setOptions(id, options)
    {
      this.buttons.forEach(function(button)
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

    //if (api.init)
    //{
    //init() {};
};