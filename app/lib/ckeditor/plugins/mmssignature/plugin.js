/**
 * Plugin for inserting cross reference elements into the CKEditor editing area.
 */

// Register the plugin within the editor.
CKEDITOR.plugins.add('mmssignature', {
    requires: 'widget',
    // Register the icons.
    icons: 'mmssignature',

    init: function(editor) {

        editor.widgets.add('mmssignature', {

            button: 'Insert Signature Template',

            template: //have to make the styling in-line else it won't work
                '<div class="signature-box">' +
                    '<table border="0" style="border: 0px; border-collapse: collapse; table-layout: fixed; max-width: 702px; word-wrap: break-word;">' +
                        '<tbody><tr>' +
                            '<td><div style="width: 500px" class="signature-name-styling cell-styling">____________________________________________</div></td>' +
                            '<td><div style="width: 200px" class="signature-date-styling cell-styling">_______________________</div></td>' +
                        '</tr>' +
                        '<tr>' +
                            '<td><div style="width: 500px" class="signature-name signature-name-styling cell-styling">[Click to Add Name and Title]</div></td>' +
                            '<td><div style="width: 200px" class="signature-date-styling cell-styling">Date</div></td>' +
                        '</tr></tbody>' +
                    '</table>' +
                '</div>',

            allowedContent: 'div(!signature-box){*}; table[*]{*}; tbody; tr; td; div{width, padding}; div(!signature-name){*}; div(!signature-name-styling); div(!signature-date-styling);',

            requiredContent: 'div(signature-box)',

            editables: {
                name: {
                    selector: '.signature-name',
                    allowedContent: 'br strong em'
                }
            },

            upcast: function(element) {
                return element.name == 'div' && element.hasClass('signature-box');
            }

        } );
    }
});
