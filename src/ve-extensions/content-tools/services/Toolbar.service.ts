import * as angular from "angular";
import {veCore} from "../../../ve-core/ve-core.module";
import {buttonOnClickFn, TButton, toolbarInitFn} from "../content-tool";
import {EventService} from "../../../ve-utils/services/Event.service";
import {ToolbarApi} from "./Toolbar.api";
import {StateService} from "@uirouter/angularjs";
import {ExtensionService} from "../../utilities/Extension.service";
import {VeConfig} from "../../../ve-utils/types/view-editor";
import {default_dynamic_buttons, default_toolbar_buttons} from "../button.config";

export class TButtonImpl implements TButton {
  id: string;
  category: 'global';
  icon: 'fa-gears';
  tooltip: 'Generic Button';
  icon_original?: string;
  selected?: boolean
  active?: boolean
  permission?: boolean
  spinner?: boolean
  dynamic?: boolean;
  onClick?: buttonOnClickFn;
  dynamic_ids?: string[];
  dynamic_buttons?: TButton[];
  disabledFor?: string[]
  enabledFor?: string[]

  constructor(id: string, tbutton?: TButton) {
    this.id = id
    if (tbutton) {
      Object.assign(this, tbutton)
    }
  }

}

export class ToolbarService {
  
  public constants = {
    SETPERMISSION: 'tb-set-permission',
    SETICON: 'tb-set-icon',
    TOGGLEICONSPINNER: 'tb-toggle-icon-spinner',
    SELECT: 'tb-select'
  };


  private toolbars: {[key: string]: ToolbarApi}
  
  private buttons: { [key: string]: TButton } = {}
  private dynamic_buttons: { [key: string]: TButton } = {}
  private buttonCount: number;

  static $inject = ['EventService', 'veConfig']
  constructor(private eventSvc: EventService, private veConfig: VeConfig) {
    for (let button of default_toolbar_buttons) {
      this.buttons[button.id] = new TButtonImpl(button.id, button);
    }
    for (let button of default_dynamic_buttons) {
      this.dynamic_buttons[button.id] = new TButtonImpl(button.id, button);
    }
     if (this.veConfig.extensions && this.veConfig.extensions.content) {
      for (let content of this.veConfig.extensions.content) {
        if (content.button) {
          this.buttons[content.button.id] = new TButtonImpl(content.button.id, content.button)
          }
      if (content.dynamic_button) {
        for (let dynButton of content.dynamic_button)
        this.dynamic_buttons[dynButton.id] = new TButtonImpl(dynButton.id, dynButton)
      }
    }
      }
    for (let id of Object.keys(this.buttons)) {
      let button = this.buttons[id];
      if (button.dynamic_ids) {
        for (let dyn of button.dynamic_ids) {
          button.dynamic_buttons.push(this.getDynamicButton(dyn));
        }
      }
    }
  }

  getApi(id?: string): ToolbarApi {
    if (id) {
      if (!this.toolbars.hasOwnProperty(id)) {
        return
      }
      return this.toolbars[id]
    }else{
      return Object.values(this.toolbars)[0]
    }

  };

  initApi(id: string, init: toolbarInitFn, ctrl: { $state: StateService, extensionSvc: ExtensionService } & angular.IComponentController) {
    if (!id) {
      throw new Error("Unable to create Toolbar, missing id")
    }

    if (!ctrl.$onDestroy) {
      ctrl.$onDestroy = () => {
        this.destroyApi(id);
      };
    }
    let api = new ToolbarApi(id, ctrl.$globalState.current);
    init(api, ctrl);
    this.toolbars[id] = api;
    return api;
  }

  public destroyApi(id: string) {
    if (this.toolbars.hasOwnProperty(id)) {
      delete this.toolbars[id];
    }
  }


  /**
   * @ngdoc method
   * @name veUtils/ToolbarService#this.getToolbarButton
   * @methodOf veUtils/ToolbarService
   *
   * @description
   * Get pre-defined toolbar buttons
   *
   * @param {string} button id
   * @param generic
   * @returns {Object} Button object
   */
  public getToolbarButton = (button: string, generic?: boolean): TButton => {
    if (this.buttons.hasOwnProperty(button)) {
      return this.buttons[button];
    }
    if (generic) {
      return this.buttons[button] = new TButtonImpl(button);
    }
  }

  public getDynamicButton = (button: string): TButton => {
    if (this.dynamic_buttons.hasOwnProperty(button)) {
      return this.dynamic_buttons[button];
    }
  }

}

veCore
  .service("ToolbarService", ToolbarService);