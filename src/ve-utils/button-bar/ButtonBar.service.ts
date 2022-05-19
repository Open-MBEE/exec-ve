import * as angular from "angular";
import {veUtils} from "@ve-utils";
import {ButtonBarApi} from "@ve-utils/button-bar";
import {VeEditorApi} from "@ve-core/editor";
import {EventService} from "@ve-utils/services";

export interface IButtonBarButton {
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

  getButtonBarButton(button: string, ctrl?: VeEditorApi): IButtonBarButton {
    if (!button.startsWith('presentation-element')) {
      switch (button) {
        case 'tree-expand':
          return {
            id: button,
            icon: 'fa-caret-square-o-down',
            selected: true,
            active: true,
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
            icon: 'fa-caret-square-o-up',
            selected: true,
            active: true,
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
            icon: 'fa-filter',
            selected: true,
            active: true,
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
            icon: 'fa-plus',
            selected: true,
            active: true,
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
            icon: 'fa-trash',
            selected: true,
            active: true,
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
            icon: 'fa-plus',
            selected: true,
            active: true,
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
            icon: 'fa-folder',
            selected: true,
            active: true,
            permission: true,
            tooltip: 'Add Group',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-add-document':
          return {
            id: button,
            icon: 'fa-file',
            selected: true,
            active: true,
            permission: true,
            tooltip: 'Add Document',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }

        case 'tree-add-tag':
          return {
            id: button,
            icon: 'fa-tag',
            selected: true,
            active: true,
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
            icon: 'fa-plus',
            selected: true,
            active: true,
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
            icon: 'fa-trash',
            selected: true,
            active: true,
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
            icon: 'fa-trash',
            selected: true,
            active: true,
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
            icon: 'fa-arrows-v',
            selected: true,
            active: true,
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
            icon: 'fa-arrows-v',
            selected: true,
            active: true,
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
            icon: 'fa-file-text-o',
            selected: true,
            active: true,
            permission: true,
            tooltip: 'Full Document',
            spinner: false,
            toggleable: true,
            toggle_icon: 'fa-file-text',
            toggle_tooltip: 'View Mode',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'view-mode-dropdown':
          return {
            id: button,
            icon: 'fa-filter',
            selected: true,
            active: true,
            permission: true,
            tooltip: 'Filter by type',
            spinner: false,
            toggleable: false,
            placement: 'bottom-left',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
            dropdown_buttons: [
              this.getButtonBarButton('tree-show-pe'),
              this.getButtonBarButton('tree-show-views'),
              this.getButtonBarButton('tree-show-tables'),
              this.getButtonBarButton('tree-show-figures'),
              this.getButtonBarButton('tree-show-equations'),
            ],
          }
        case 'tree-show-views':
          return {
            id: button,
            selected: true,
            active: true,
            permission: true,
            tooltip: 'Show Only Views and Sections',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'tree-show-pe':
          return {
            id: button,
            selected: false,
            active: true,
            permission: true,
            tooltip: 'Show All',
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
            active: true,
            permission: true,
            tooltip: 'Show Only Tables',
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
            active: true,
            permission: true,
            tooltip: 'Show Only Figures',
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
            active: true,
            permission: true,
            tooltip: 'Show Only Equations',
            spinner: false,
            toggleable: false,
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }

        case 'show-edits':
          return {
            id: button,
            icon: 'fa-pencil-square-o',
            selected: true,
            active: true,
            permission: true,
            tooltip: 'Enable Edits (alt + d)',
            spinner: false,
            toggleable: true,
            toggle_icon: 'fa-pencil-square',
            toggle_tooltip: 'Disable Edits (alt + d)',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'show-elements':
          return {
            id: button,
            icon: 'fa-codepen',
            selected: true,
            active: true,
            permission: true,
            tooltip: 'Show Elements (alt + e)',
            spinner: false,
            toggleable: true,
            toggle_icon: 'fa-cube',
            toggle_tooltip: 'Hide Elements (alt + e)',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'show-comments':
          return {
            id: button,
            icon: 'fa-comment-o',
            selected: true,
            active: true,
            permission: true,
            tooltip: 'Show Comments (alt + c)',
            spinner: false,
            toggleable: true,
            toggle_icon: 'fa-comment',
            toggle_tooltip: 'Hide Comments (alt + c)',
            action: () => {
              this.eventSvc.$broadcast(button)
            },
          }
        case 'refresh-numbering':
          return {
            id: button,
            icon: 'fa-sort-numeric-asc',
            selected: true,
            active: true,
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
            icon: 'fa-share-alt',
            selected: true,
            active: true,
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
            icon: 'fa-chevron-left',
            selected: true,
            active: true,
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
            icon: 'fa-chevron-right',
            selected: true,
            active: true,
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
            icon: 'fa-download',
            selected: true,
            active: true,
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
            icon: 'fa-print',
            selected: true,
            active: true,
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
            icon: 'fa-file-pdf-o',
            selected: true,
            active: true,
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
            icon: 'fa-file-word-o',
            selected: true,
            active: true,
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
            icon: 'fa-table',
            selected: true,
            active: true,
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
            icon: 'fa-trash',
            selected: true,
            active: true,
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
            icon: 'fa-save',
            selected: true,
            active: true,
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
            icon: 'fa-send-o',
            selected: true,
            active: true,
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
            icon: 'fa-times',
            selected: true,
            active: true,
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
            icon: 'fa-file-powerpoint-o',
            selected: true,
            active: true,
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