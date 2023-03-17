import { IButtonBarButton } from '@ve-core/button-bar'

export const presentations_buttons: IButtonBarButton[] = [
    {
        id: 'presentation-element-delete',
        icon: 'fa-solid fa-trash',
        selectable: false,
        tooltip: 'Remove',
        api: 'delete',
    },
    {
        id: 'presentation-element-save',
        icon: 'fa-solid fa-save',
        selectable: false,
        tooltip: 'Save',
        api: 'save',
    },
    {
        id: 'presentation-element-saveC',
        icon: 'fa-regular fa-paper-plane',
        selectable: false,
        tooltip: 'Save and Continue',
        api: 'saveC',
    },
    {
        id: 'presentation-element-cancel',
        icon: 'fa-solid fa-times',
        selectable: false,
        tooltip: 'Cancel',
        api: 'cancel',
    },
    {
        id: 'presentation-element-preview',
        icon: 'fa-regular fa-file-powerpoint',
        selectable: false,
        tooltip: 'Preview Changes',
        api: 'preview',
    },
]
