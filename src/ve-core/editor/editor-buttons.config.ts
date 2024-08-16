import { IButtonBarButton } from '@ve-core/button-bar';

export const editor_buttons: IButtonBarButton[] = [
    {
        buttonId: 'editor-delete',
        icon: 'fa-solid fa-trash',
        selectable: false,
        tooltip: 'Remove',
        api: 'delete',
    },
    {
        buttonId: 'editor-save',
        icon: 'fa-solid fa-save',
        selectable: false,
        tooltip: 'Save',
        api: 'save',
    },
    {
        buttonId: 'editor-save-continue',
        icon: 'fa-regular fa-paper-plane',
        selectable: false,
        tooltip: 'Save and Continue',
        api: 'saveC',
    },
    {
        buttonId: 'editor-cancel',
        icon: 'fa-solid fa-times',
        selectable: false,
        tooltip: 'Cancel',
        api: 'cancel',
    },
    {
        buttonId: 'editor-reset',
        icon: 'fa-solid fa-rotate-left',
        selectable: false,
        tooltip: 'Reset Editor and Continue',
        api: 'reset',
    },
    {
        buttonId: 'editor-preview',
        icon: 'fa-solid fa-magnifying-glass',
        selectable: false,
        tooltip: 'Preview Changes',
        api: 'preview',
    },
];
