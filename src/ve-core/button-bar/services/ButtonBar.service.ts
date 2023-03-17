import { BarButton, ButtonBarApi, IButtonBarButton } from '@ve-core/button-bar'
import { EventService } from '@ve-utils/core'

import { veUtils } from '@ve-utils'

import { VePromise, VeQService } from '@ve-types/angular'
import { VeConfig } from '@ve-types/config'
import { EditingToolbar } from '@ve-types/core/editor'
import { VeApiObject } from '@ve-types/view-editor'

const default_buttons: IButtonBarButton[] = [
    {
        id: 'button-bar-menu',
        icon: 'fa-solid fa-bars',
        selectable: false,
        tooltip: 'menu',
        placement: 'bottom-left',
        dropdown: {
            icon: 'fa-solid fa-caret-down',
            toggle_icon: 'fa-solid fa-caret-up',
            ids: [],
        },
    },
]

export interface buttonInitFn {
    (api: ButtonBarApi): void
}

export class ButtonBarService {
    static $inject = ['$q', 'EventService']

    private barCounter: { [id: string]: number } = {}
    private buttons: { [key: string]: IButtonBarButton } = {}
    private buttonBars: VeApiObject<ButtonBarApi> = {}
    private veConfig: VeConfig

    constructor(private $q: VeQService, private eventSvc: EventService) {
        for (const button of default_buttons) {
            this.buttons[button.id] = button
        }
        this.veConfig = window.__env
        if (this.veConfig.expConfig) {
            for (const ext of Object.keys(this.veConfig.expConfig)) {
                if (
                    this.veConfig.expConfig[ext] &&
                    this.veConfig.expConfig[ext].length > 0
                ) {
                    for (const tool of this.veConfig.expConfig[ext]) {
                        if (tool.barButtons) {
                            this.registerButtons(tool.barButtons)
                        }
                    }
                }
            }
        }
    }

    public waitForApi = (id: string): VePromise<ButtonBarApi, void> => {
        if (!this.buttonBars.hasOwnProperty(id)) {
            this.buttonBars[id] = {}
            this.buttonBars[id].promise = new this.$q<ButtonBarApi>(
                (resolve, reject) => {
                    this.buttonBars[id].resolve = resolve
                    this.buttonBars[id].reject = reject
                }
            )
        }
        return this.buttonBars[id].promise
    }

    public generateBarId = (root?: string): string => {
        if (!root) {
            root = 'button_bar'
        }
        if (!this.buttonBars[root]) return root
        else if (!this.barCounter[root]) this.barCounter[root] = 0
        else this.barCounter[root]++
        return `${root}_${this.barCounter[root]}`
    }

    public initApi(
        id: string,
        init: buttonInitFn,
        ctrl: { bars: string[] } & angular.IComponentController,
        buttons?: IButtonBarButton[]
    ): ButtonBarApi {
        if (ctrl) {
            ctrl.bars = []
            if (!ctrl.$onDestroy) {
                ctrl.$onDestroy = (): void => {
                    this.destroyAll(ctrl.bars)
                }
            }
            ctrl.bars.push(id)
        }
        if (!init) {
            return null
        }
        const api = new ButtonBarApi(id)

        if (buttons && buttons.length > 0) {
            this.registerButtons(buttons)
        }

        init(api)
        if (!this.buttonBars[id]) {
            this.buttonBars[id] = {
                api,
            }
        } else {
            this.buttonBars[id].api = api
        }
        if (!this.buttonBars[id].resolve) {
            this.buttonBars[id].promise = new this.$q((resolve, reject) => {
                this.buttonBars[id].resolve = resolve
                this.buttonBars[id].reject = reject
            })
        }
        this.buttonBars[id].resolve(api)
        return api
    }

    destroy(id: string): void {
        if (this.buttonBars.hasOwnProperty(id)) {
            delete this.buttonBars[id]
        }
    }

    destroyAll(ids: string[]): void {
        ids.forEach((bbId) => {
            this.destroy(bbId)
        })
    }

    getButtonBarButton = (
        buttonId: string,
        ctrl?: EditingToolbar
    ): BarButton => {
        if (this.buttons.hasOwnProperty(buttonId)) {
            const newButton = new BarButton(buttonId, this.buttons[buttonId])
            if (this.buttons[buttonId].dropdown) {
                newButton.dropdown_buttons = []
                for (const id of this.buttons[buttonId].dropdown.ids) {
                    newButton.dropdown_buttons.push(
                        this.getButtonBarButton(id, ctrl)
                    )
                }
            }
            if (
                this.buttons[buttonId].api &&
                ctrl &&
                ctrl[this.buttons[buttonId].api]
            ) {
                newButton.setAction((event): void => {
                    if (event) event.stopPropagation()
                    ;(ctrl[this.buttons[buttonId].api] as () => void)()
                })
            }
            return newButton
        } else {
            return new BarButton(buttonId)
        }
    }

    public registerButtons = (
        buttons: IButtonBarButton | IButtonBarButton[]
    ): void => {
        if (!Array.isArray(buttons)) {
            buttons = [buttons]
        }
        if (buttons.length > 0) {
            for (const button of buttons) {
                if (!this.buttons[button.id]) {
                    this.buttons[button.id] = button
                }
            }
        }
    }
}

veUtils.service('ButtonBarService', ButtonBarService)

// Need to replace with TB like logic and set action if available like this
// (e): void => {
//     e.stopPropagation()
//     ctrl.delete()
// },
// if (!button.startsWith('presentation-element')) {
//         case 'show-edits':
//             return {
//                 id: button,
//                 icon: 'fa-regular fa-pen-to-square',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Enable Edits (alt + d)',
//                 spinner: false,
//                 toggleable: true,
//                 toggle_tooltip: 'Disable Edits (alt + d)',
//                 action: (): void => {
//                     this.eventSvc.$broadcast(button)
//                 },
//             }
//         case 'show-elements':
//             return {
//                 id: button,
//                 icon: 'fa-brands fa-codepen',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Show Elements (alt + e)',
//                 spinner: false,
//                 toggleable: true,
//                 toggle_tooltip: 'Hide Elements (alt + e)',
//                 action: (): void => {
//                     this.eventSvc.$broadcast(button)
//                 },
//             }
//         case 'show-comments':
//             return {
//                 id: button,
//                 icon: 'fa-regular fa-comment',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Show Comments (alt + c)',
//                 spinner: false,
//                 toggleable: true,
//                 toggle_tooltip: 'Hide Comments (alt + c)',
//                 action: (): void => {
//                     this.eventSvc.$broadcast(button)
//                 },
//             }
//         case 'show-numbering':
//             return {
//                 id: button,
//                 icon: 'fa-solid fa-list-ol',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Hide Numbering',
//                 spinner: false,
//                 toggleable: true,
//                 toggle_stack: true,
//                 toggle_tooltip: 'Show Numbering',
//                 action: (): void => {
//                     this.eventSvc.$broadcast(button)
//                 },
//             }
//         case 'refresh-numbering':
//             return {
//                 id: button,
//                 icon: 'fa-solid fa-sort-numeric-asc',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Refresh Figure Numbering',
//                 spinner: false,
//                 toggleable: false,
//                 action: (): void => {
//                     this.eventSvc.$broadcast(button)
//                 },
//             }
//         case 'share-url':
//             return {
//                 id: button,
//                 icon: 'fa-solid fa-arrow-up-right-from-square',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Share Short URL',
//                 spinner: false,
//                 toggleable: false,
//                 action: (e: JQuery.ClickEvent): void => {
//                     this.eventSvc.$broadcast(button, e)
//                 },
//             }
//         case 'center-previous':
//             return {
//                 id: button,
//                 icon: 'fa-solid fa-chevron-left',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Previous (alt + ,)',
//                 spinner: false,
//                 toggleable: false,
//                 action: (): void => {
//                     this.eventSvc.$broadcast(button)
//                 },
//             }
//         case 'center-next':
//             return {
//                 id: button,
//                 icon: 'fa-solid fa-chevron-right',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Next (alt + .)',
//                 spinner: false,
//                 toggleable: false,
//                 action: (): void => {
//                     this.eventSvc.$broadcast(button)
//                 },
//             }
//         case 'export':
//             return {
//                 id: button,
//                 icon: 'fa-solid fa-download',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Export',
//                 button_content: 'Export',
//                 spinner: false,
//                 toggleable: true,
//                 action: (): void => {
//                     this.eventSvc.$broadcast(button)
//                 },
//                 dropdown_buttons: [
//                     this.getButtonBarButton('word'),
//                     this.getButtonBarButton('tabletocsv'),
//                 ],
//                 dropdown_toggleable: true,
//                 dropdown_icon: 'fa-solid fa-caret-down',
//                 dropdown_toggle_icon: 'fa-solid fa-caret-up',
//             }
//         case 'print':
//             return {
//                 id: button,
//                 icon: 'fa-solid fa-print',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Print',
//                 spinner: false,
//                 toggleable: false,
//                 action: (): void => {
//                     this.eventSvc.$broadcast(button)
//                 },
//             }
//         case 'convert-pdf':
//             return {
//                 id: button,
//                 icon: 'fa-regular fa-file-pdf',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Export to PDF',
//                 spinner: false,
//                 toggleable: false,
//                 action: (): void => {
//                     this.eventSvc.$broadcast(button)
//                 },
//             }
//         case 'word':
//             return {
//                 id: button,
//                 icon: 'fa-regular fa-file-word',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Export to Word',
//                 spinner: false,
//                 toggleable: false,
//                 action: (): void => {
//                     this.eventSvc.$broadcast(button)
//                 },
//             }
//         case 'tabletocsv':
//             return {
//                 id: button,
//                 icon: 'fa-solid fa-table',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Table to CSV',
//                 spinner: false,
//                 toggleable: false,
//                 action: (): void => {
//                     this.eventSvc.$broadcast(button)
//                 },
//             }
//     }
// }
// if (typeof ctrl !== 'undefined') {
//     switch (button) {
//         case 'presentation-element-delete':
//             return {
//                 id: button,
//                 icon: 'fa-solid fa-trash',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Remove',
//                 spinner: false,
//                 toggleable: false,
//                 api: 'delete'
//             }
//         case 'presentation-element-save':
//             return {
//                 id: button,
//                 icon: 'fa-solid fa-save',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Save',
//                 spinner: false,
//                 toggleable: false,
//                 action: (e): void => {
//                     e.stopPropagation()
//                     ctrl.save()
//                 },
//             }
//         case 'presentation-element-saveC':
//             return {
//                 id: button,
//                 icon: 'fa-regular fa-paper-plane',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Save and Continue',
//                 spinner: false,
//                 toggleable: false,
//                 action: (e): void => {
//                     e.stopPropagation()
//                     ctrl.saveC()
//                 },
//             }
//         case 'presentation-element-cancel':
//             return {
//                 id: button,
//                 icon: 'fa-solid fa-times',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Cancel',
//                 spinner: false,
//                 toggleable: false,
//                 action: (e): void => {
//                     e.stopPropagation()
//                     ctrl.cancel()
//                 },
//             }
//         case 'presentation-element-preview':
//             return {
//                 id: button,
//                 icon: 'fa-regular fa-file-powerpoint',
//                 selectable: false,
//                 permission: true,
//                 tooltip: 'Preview Changes',
//                 spinner: false,
//                 toggleable: false,
//                 action: (e): void => {
//                     e.stopPropagation()
//                     ctrl.preview()
//                 },
//             }
//     }
// }
