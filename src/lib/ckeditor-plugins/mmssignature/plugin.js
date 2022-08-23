/**
 * Plugin for inserting cross reference elements into the CKEditor editing area.
 */

// Register the plugin within the editor.
CKEDITOR.plugins.add('mmssignature', {
    requires: 'widget',
    // Register the icons.
    icons: 'mmssignature',

    init: function (editor) {

        editor.widgets.add('mmssignature', {

            button: 'Insert Signature Template',
            command: 'mmssignature',
            template: //have to make the styling in-line else it won't work
                '<div class="signature-box">' +
                '<table border="0" style="border: 0px; border-collapse: collapse; table-layout: fixed; max-width: 702px; word-wrap: break-word;">' +
                '<tbody><tr>' +
                '<td class="signature-name-styling"><div style="width: 500px" class="cell-styling">____________________________________________</div></td>' +
                '<td class="signature-space-styling"></td>' +
                '<td class="signature-date-styling"><div style="width: 200px" class="cell-styling">_______________________</div></td>' +
                '</tr>' +
                '<tr>' +
                '<td class="signature-name-styling"><div style="width: 500px" class="signature-name cell-styling">[Click to Add Name and Title]</div></td>' +
                '<td class="signature-space-styling"></td>' +
                '<td class="signature-date-styling"><div style="width: 200px" class="cell-styling">Date</div></td>' +
                '</tr></tbody>' +
                '</table>' +
                '</div>',

            allowedContent: 'div(!signature-box){*}; table[*]{*}; tbody; tr; td(!signature-name-styling); td(!signature-space-styling); td(!signature-date-styling); div{width, padding}; div(!cell-styling); div(!signature-name){*};',

            requiredContent: 'div(signature-box)',

            editables: {
                name: {
                    selector: '.signature-name',
                    allowedContent: 'br strong em'
                }
            },

            upcast: function (element) {
                return element.name == 'div' && element.hasClass('signature-box');
            }

        });
    }
});
