import * as angular from "angular";
import {veExt} from "@ve-ext"
import {EventService} from "@ve-utils/services";
import {ToolbarApi} from "./Toolbar.api";
import {UIRouterGlobals} from "@uirouter/angularjs";
import {ExtensionService} from "@ve-ext";
import {VeConfig} from "@ve-types/config";
import {default_dynamic_buttons, default_toolbar_buttons} from "../spec-tool-button.config";

export interface ISpecToolButton {
  id: string,
  icon: string,
  tooltip: string,
  category: string,
  icon_original?: string,
  selected?: boolean
  active?: boolean
  permission?: boolean
  spinner?: boolean
  dynamic?: boolean,
  onClick?: buttonOnClickFn,
  dynamic_ids?: string[],
  dynamic_buttons?: ISpecToolButton[],
  disabledFor?: string[]
  enabledFor?: string[]
}

export interface buttonOnClickFn {
  (button?: ISpecToolButton):void
}

export interface toolbarInitFn {
  (api: ToolbarApi, ctrl: { $uiRouterGlobals: UIRouterGlobals, extensionSvc: ExtensionService } & angular.IComponentController): void
}

export class ToolButton implements ISpecToolButton {
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
  dynamic_buttons?: ISpecToolButton[];
  disabledFor?: string[]
  enabledFor?: string[]

  constructor(id: string, tbutton?: ISpecToolButton) {
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


  private toolbars: {[key: string]: ToolbarApi} = {}
  private buttons: { [key: string]: ISpecToolButton } = {}
  private dynamic_buttons: { [key: string]: ISpecToolButton } = {}
  private buttonCount: number;

  static $inject = ['EventService', 'veConfig']
  constructor(private eventSvc: EventService, private veConfig: VeConfig) {
    for (let button of default_toolbar_buttons) {
      this.buttons[button.id] = new ToolButton(button.id, button);
    }
    for (let button of default_dynamic_buttons) {
      this.dynamic_buttons[button.id] = new ToolButton(button.id, button);
    }
     if (this.veConfig.extConfig && this.veConfig.extConfig.spec) {
      for (let spec of this.veConfig.extConfig.spec) {
        if (spec.button) {
          this.buttons[spec.button.id] = new ToolButton(spec.button.id, spec.button)
          }
      if (spec.dynamic_button) {
        for (let dynButton of spec.dynamic_button) {
          this.dynamic_buttons[dynButton.id] = new ToolButton(dynButton.id, dynButton)
        }
      }
    }
      }
    for (let id of Object.keys(this.buttons)) {
      let button = this.buttons[id];
      if (button.dynamic_ids) {
        button.dynamic_buttons = [];
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

  initApi(id: string, init: toolbarInitFn, ctrl: { $uiRouterGlobals: UIRouterGlobals, extensionSvc: ExtensionService } & angular.IComponentController) {
    if (!id) {
      throw new Error("Unable to create Toolbar, missing id")
    }

    if (!ctrl.$onDestroy) {
      ctrl.$onDestroy = () => {
        this.destroyApi(id);
      };
    }
    let api = new ToolbarApi(id, ctrl.$uiRouterGlobals.current);
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
  public getToolbarButton = (button: string, generic?: boolean): ISpecToolButton => {
    if (this.buttons.hasOwnProperty(button)) {
      return this.buttons[button];
    }
    if (generic) {
      return this.buttons[button] = new ToolButton(button);
    }
  }

  public getDynamicButton = (button: string): ISpecToolButton => {
    if (this.dynamic_buttons.hasOwnProperty(button)) {
      return this.dynamic_buttons[button];
    }
  }

}

veExt
  .service("ToolbarService", ToolbarService);