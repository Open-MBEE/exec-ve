import { IButtonBarButton } from '@ve-core/button-bar';

export const pane_center_buttons: IButtonBarButton[] = [
    {
        id: 'show-edits',
        icon: 'fa-regular fa-pen-to-square',
        selectable: false,
        tooltip: 'Enable Edits (alt + d)',
        toggle: {
            tooltip: 'Disable Edits (alt + d)',
        },
    },
    {
        id: 'show-elements',
        icon: 'fa-brands fa-codepen',
        selectable: false,
        tooltip: 'Show Elements (alt + e)',
        toggle: {
            tooltip: 'Hide Elements (alt + e)',
        },
    },
    {
        id: 'show-comments',
        icon: 'fa-regular fa-comment',
        selectable: false,
        tooltip: 'Show Comments (alt + c)',
        toggle: {
            tooltip: 'Hide Comments (alt + c)',
        },
    },
    {
        id: 'show-numbering',
        icon: 'fa-solid fa-list-ol',
        selectable: false,
        tooltip: 'Show Numbering',
        toggle: {
            tooltip: 'Hide Numbering',
        },
    },
    {
        id: 'refresh-numbering',
        icon: 'fa-solid fa-sort-numeric-asc',
        selectable: false,
        tooltip: 'Refresh Figure Numbering',
    },
    {
        id: 'share-url',
        icon: 'fa-solid fa-arrow-up-right-from-square',
        selectable: false,
        tooltip: 'Share Short URL',
    },
    {
        id: 'center-previous',
        icon: 'fa-solid fa-chevron-left',
        selectable: false,
        tooltip: 'Previous (alt + ,)',
    },
    {
        id: 'center-next',
        icon: 'fa-solid fa-chevron-right',
        selectable: false,
        tooltip: 'Next (alt + .)',
    },
    {
        id: 'export',
        icon: 'fa-solid fa-download',
        selectable: false,
        tooltip: 'Export',
        button_content: 'Export',
        toggle: true,
        dropdown: {
            ids: ['convert-pdf', 'word', 'tabletocsv'],
            icon: 'fa-solid fa-caret-down',
            toggle_icon: 'fa-solid fa-caret-up',
        },
    },
    {
        id: 'print',
        icon: 'fa-solid fa-print',
        selectable: false,
        tooltip: 'Print',
    },
    {
        id: 'convert-pdf',
        icon: 'fa-regular fa-file-pdf',
        selectable: false,
        tooltip: 'Export to PDF',
    },
    {
        id: 'word',
        icon: 'fa-regular fa-file-word',
        selectable: false,
        tooltip: 'Export to Word',
    },
    {
        id: 'tabletocsv',
        icon: 'fa-solid fa-table',
        selectable: false,
        tooltip: 'Table to CSV',
    },
];
