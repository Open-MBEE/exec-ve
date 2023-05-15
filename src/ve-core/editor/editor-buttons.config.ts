import { IButtonBarButton } from '@ve-core/button-bar';

export const editor_buttons: IButtonBarButton[] = [
    {
        id: 'editor-delete',
        icon: 'fa-solid fa-trash',
        selectable: false,
        tooltip: 'Remove',
        api: 'delete',
    },
    {
        id: 'editor-save',
        icon: 'fa-solid fa-save',
        selectable: false,
        tooltip: 'Save',
        api: 'save',
    },
    {
        id: 'editor-save-continue',
        icon: 'fa-regular fa-paper-plane',
        selectable: false,
        tooltip: 'Save and Continue',
        api: 'saveC',
    },
    {
        id: 'editor-cancel',
        icon: 'fa-solid fa-times',
        selectable: false,
        tooltip: 'Cancel',
        api: 'cancel',
    },
    {
        id: 'editor-reset',
        icon: 'fa-solid fa-rotate-left',
        selectable: false,
        tooltip: 'Reset Editor and Continue',
        api: 'reset',
    },
    {
        id: 'editor-preview',
        icon: 'fa-solid fa-magnifying-glass',
        selectable: false,
        tooltip: 'Preview Changes',
        api: 'preview',
    },
];
