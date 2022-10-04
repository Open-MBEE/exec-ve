import * as angular from "angular";
import {veUtils} from "@ve-utils";
import {ButtonBarApi} from "@ve-utils/button-bar";
import {VeEditorApi} from "@ve-core/editor";
import {EventService} from "@ve-utils/core-services";

export interface IButtonBarButton {
  id: string,
  icon?: string,
  icon_original?: string,
  tooltip_orginal?: string,
  active?: boolean,
  selected?: boolean,
  selectable?: boolean,
  permission: boolean,
  tooltip: string,
  button_content?: string,
  spinner: boolean,
  toggleable: boolean,
  toggle_stack?: boolean,
  toggle_state?: boolean,
  toggle_icon?: string,
  toggle_tooltip?: string,
  placement?: string,
  action: buttonActionFn,
  dropdown_toggleable?: boolean,
  dropdown_toggle_state?: boolean,
  dropdown_icon?: string,
  dropdown_icon_original?: string,
  dropdown_toggle_icon?: string,
  dropdown_buttons?: IButtonBarButton[]
}

export interface buttonActionFn {
  (event?: angular.IAngularEvent): void;
}

export interface buttonInitFn {
  (api: ButtonBarApi): void
}



export class ButtonBarService {
  static $inject = ['EventService'];
  private buttonBars = {}
          barCounter = 0

  constructor(private eventSvc: EventService) {
  }

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
      let api = new ButtonBarApi(id, init);
      init(api);
      this.buttonBars[id] = api;
      return api;
  }

  destroy(bars: string[]) {
      if (bars && bars.length !== 0) {
        for (let i = 0; i < bars.length; i++) {
          if (this.buttonBars.hasOwnProperty(bars[i])){
            delete this.buttonBars[bars[i]];
          }
        }
      }
  };

  getButtonBarButton(button: string, ctrl?: VeEditorApi): IButtonBarButton {
    if (!button.startsWith('presentation-element')) {
      switch (button) {
        case 'button-bar-menu':
          return {
            id: button,
            icon: 'fa-solid fa-bars',
            selectable: false,
            permission: true,
            tooltip: 'Menu',
            spinner: false,
            toggleable: false,
            placement: 'bottom-left',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
            dropdown_toggleable: true,
            dropdown_icon: 'fa-solid fa-caret-down',
            dropdown_toggle_icon: 'fa-solid fa-caret-up',
            dropdown_buttons: [],
          }
        case 'tree-expand':
          return {
            id: button,
            icon: 'fa-regular fa-caret-square-down',
            selectable: true,
            permission: true,
            tooltip: 'Expand All',
            spinner: false,
            toggleable: false,
            placement: 'bottom-left',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-collapse':
          return {
            id: button,
            icon: 'fa-regular fa-caret-square-up',
            selectable: true,
            permission: true,
            tooltip: 'Collapse All',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-filter':
          return {
            id: button,
            icon: 'fa-solid fa-filter',
            selectable: true,
            permission: true,
            tooltip: 'Filter',
            spinner: false,
            toggleable: true,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-add-document-or-group':
          return {
            id: button,
            icon: 'fa-solid fa-plus',
            selectable: true,
            permission: false,
            tooltip: 'Add Group or Document',
            spinner: false,
            toggleable: false,
            placement: 'bottom-right',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
            dropdown_buttons: [
              this.getButtonBarButton('tree-add-group'),
              this.getButtonBarButton('tree-add-document'),
            ],
          }
        case 'tree-delete-document':
          return {
            id: button,
            icon: 'fa-solid fa-trash',
            selectable: true,
            permission: false,
            tooltip: 'Remove',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-add-view':
          return {
            id: button,
            icon: 'fa-solid fa-plus',
            selectable: true,
            permission: false,
            tooltip: 'Add View',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-add-group':
          return {
            id: button,
            icon: 'fa-solid fa-folder',
            selectable: true,
            permission: true,
            tooltip: 'Add Group',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-clear-select':
          return {
            id: button,
            icon: 'fa-regular fa-folder',
            selectable: true,
            permission: true,
            tooltip: 'Clear Selection',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            }
          }
        case 'tree-add-document':
          return {
            id: button,
            icon: 'fa-solid fa-file',
            selectable: true,
            permission: true,
            tooltip: 'Add Document',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-refresh':
          return {
            id: button,
            icon: 'fa-solid fa-refresh',
            selectable: true,
            permission: true,
            tooltip: 'Refresh Tree Data',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-add-tag':
          return {
            id: button,
            icon: 'fa-solid fa-tag',
            selectable: true,
            permission: true,
            tooltip: 'Add Tag',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-add-branch':
          return {
            id: button,
            icon: 'fa-solid fa-plus',
            selectable: true,
            permission: true,
            tooltip: 'Add Branch',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-delete':
          return {
            id: button,
            icon: 'fa-solid fa-trash',
            selectable: true,
            permission: true,
            tooltip: 'Remove',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-delete-view':
          return {
            id: button,
            icon: 'fa-solid fa-trash',
            selectable: true,
            permission: false,
            tooltip: 'Remove View',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-reorder-view':
          return {
            id: button,
            icon: 'fa-solid fa-arrows-v',
            selectable: true,
            permission: false,
            tooltip: 'Reorder Views',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-reorder-group':
          return {
            id: button,
            icon: 'fa-solid fa-arrows-v',
            selectable: true,
            permission: false,
            tooltip: 'Organize Groups/Docs',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-full-document':
          return {
            id: button,
            icon: 'fa-regular fa-file-text',
            selectable: true,
            permission: true,
            tooltip: 'Full Document',
            spinner: false,
            toggleable: true,
            toggle_tooltip: 'View Mode',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-show-pe':
          return {
            id: button,
            icon: 'fa-regular fa-image',
            selected: false,
            selectable: true,
            permission: true,
            tooltip: 'Show PE',
            spinner: false,
            toggleable: true,
            toggle_tooltip: 'Hide PE',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-mode-dropdown':
          return {
            id: button,
            icon: 'fa-solid fa-ellipsis-vertical',
            selected: false,
            selectable: true,
            permission: true,
            tooltip: 'Show Content Tables',
            spinner: false,
            toggleable: false,
            placement: 'bottom-left',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
            dropdown_toggleable: true,
            dropdown_icon: 'fa-solid fa-caret-down',
            dropdown_toggle_icon: 'fa-solid fa-caret-up',
            dropdown_buttons: [
              this.getButtonBarButton('tree-show-tables'),
              this.getButtonBarButton('tree-show-figures'),
              this.getButtonBarButton('tree-show-equations'),
              this.getButtonBarButton('tree-close-all'),
            ],
          }
        case 'tree-close-all':
          return {
            id: button,
            icon: 'fa-solid fa-xmark',
            selected: false,
            selectable: false,
            active: false,
            permission: true,
            tooltip: 'Close All',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-show-tables':
          return {
            id: button,
            selected: false,
            selectable: true,
            permission: true,
            tooltip: 'Show List of Tables',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-show-figures':
          return {
            id: button,
            selected: false,
            selectable: true,
            permission: true,
            tooltip: 'Show List of Figures',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-show-equations':
          return {
            id: button,
            selected: false,
            selectable: true,
            permission: true,
            tooltip: 'Show List of Equations',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }

        case 'show-edits':
          return {
            id: button,
            icon: 'fa-regular fa-pen-to-square',
            selectable: true,
            permission: true,
            tooltip: 'Enable Edits (alt + d)',
            spinner: false,
            toggleable: true,
            toggle_tooltip: 'Disable Edits (alt + d)',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'show-elements':
          return {
            id: button,
            icon: 'fa-brands fa-codepen',
            selectable: true,
            permission: true,
            tooltip: 'Show Elements (alt + e)',
            spinner: false,
            toggleable: true,
            toggle_tooltip: 'Hide Elements (alt + e)',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'show-comments':
          return {
            id: button,
            icon: 'fa-regular fa-comment',
            selectable: true,
            permission: true,
            tooltip: 'Show Comments (alt + c)',
            spinner: false,
            toggleable: true,
            toggle_tooltip: 'Hide Comments (alt + c)',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'show-numbering':
          return {
            id: button,
            icon: 'fa-solid fa-list-ol fa-stack-1x',
            selectable: true,
            permission: true,
            tooltip: 'Hide Numbering',
            spinner: false,
            toggleable: true,
            toggle_stack: true,
            toggle_tooltip: 'Show Numbering',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'refresh-numbering':
          return {
            id: button,
            icon: 'fa-solid fa-sort-numeric-asc',
            selectable: true,
            permission: true,
            tooltip: 'Refresh Figure Numbering',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'share-url':
          return {
            id: button,
            icon: 'fa-solid fa-share-alt',
            selectable: true,
            permission: true,
            tooltip: 'Share Short URL',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'center-previous':
          return {
            id: button,
            icon: 'fa-solid fa-chevron-left',
            selectable: true,
            permission: true,
            tooltip: 'Previous (alt + ,)',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'center-next':
          return {
            id: button,
            icon: 'fa-solid fa-chevron-right',
            selectable: true,
            permission: true,
            tooltip: 'Next (alt + .)',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'export':
          return {
            id: button,
            icon: 'fa-solid fa-download',
            selectable: true,
            permission: true,
            tooltip: 'Export',
            button_content: 'Export',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
            dropdown_buttons: [
              this.getButtonBarButton('word'),
              this.getButtonBarButton('tabletocsv'),
            ],
          }
        case 'print':
          return {
            id: button,
            icon: 'fa-solid fa-print',
            selectable: true,
            permission: true,
            tooltip: 'Print',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'convert-pdf':
          return {
            id: button,
            icon: 'fa-regular fa-file-pdf',
            selectable: true,
            permission: true,
            tooltip: 'Export to PDF',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'word':
          return {
            id: button,
            icon: 'fa-regular fa-file-word',
            selectable: true,
            permission: true,
            tooltip: 'Export to Word',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tabletocsv':
          return {
            id: button,
            icon: 'fa-solid fa-table',
            selectable: true,
            permission: true,
            tooltip: 'Table to CSV',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
      }}
    if (ctrl !== 'undefined') {
      switch (button) {
        case 'presentation-element-delete':
          return {
            id: button,
            icon: 'fa-solid fa-trash',
            selectable: true,
            permission: true,
            tooltip: 'Remove',
            spinner: false,
            toggleable: false,
            action: function (e) {
              e.stopPropagation()
              ctrl.delete()
            },
          }
        case 'presentation-element-save':
          return {
            id: button,
            icon: 'fa-solid fa-save',
            selectable: true,
            permission: true,
            tooltip: 'Save',
            spinner: false,
            toggleable: false,
            action: function (e) {
              e.stopPropagation()
              ctrl.save()
            },
          }
        case 'presentation-element-saveC':
          return {
            id: button,
            icon: 'fa-regular fa-paper-plane',
            selectable: true,
            permission: true,
            tooltip: 'Save and Continue',
            spinner: false,
            toggleable: false,
            action: function (e) {
              e.stopPropagation()
              ctrl.saveC()
            },
          }
        case 'presentation-element-cancel':
          return {
            id: button,
            icon: 'fa-solid fa-times',
            selectable: true,
            permission: true,
            tooltip: 'Cancel',
            spinner: false,
            toggleable: false,
            action: function (e) {
              e.stopPropagation()
              ctrl.cancel()
            },
          }
        case 'presentation-element-preview':
          return {
            id: button,
            icon: 'fa-regular fa-file-powerpoint',
            selectable: true,
            permission: true,
            tooltip: 'Preview Changes',
            spinner: false,
            toggleable: false,
            action: function (e) {
              e.stopPropagation()
              ctrl.preview()
            },
          }
      }
    }
    throw new Error('Button not defined');
  }

}

veUtils.service("ButtonBarService", ButtonBarService);
