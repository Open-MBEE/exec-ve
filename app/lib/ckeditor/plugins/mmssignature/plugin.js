/**
 * Plugin for inserting cross reference elements into the CKEditor editing area.
 */

// Register the plugin within the editor.
CKEDITOR.plugins.add('mmssignature', {
	requires: 'widget',
	// Register the icons.
	icons: 'mmssignature',

	init: function(editor) {

		CKEDITOR.dialog.add('mmssignature', this.path + 'dialogs/mmssignature.js');

		editor.widgets.add('mmssignature', {

            button: 'Create Signature Template',
      		template: //have to make the styling in-line else it won't work
				'<div class="signature-box">' +
					'<table border="0" style="border: 0px; border-collapse: collapse; table-layout: fixed; max-width: 702px; word-wrap: break-word;">' +
						'<tr>' +
							'<td><div style="width: 500px">____________________________________________</div></td>' +
							'<td><div style="width: 2px"></div></td>' +
							'<td><div style="width: 200px">_______________________</div></td>' +
						'</tr>' +
						'<tr>' +
							'<td><div style="width: 500px" class="signature-name">[Click to Add Name and Title]</div></td>' +
							'<td><div style="width: 2px"></div></td>' +
							'<td><div style="width: 200px">Date</div></td>' +
						'</tr>' +
					'</table>' +
				'</div>',

            allowedContent: 'div(!signature-box); table[border]{border, border-collapse, table-layout, max-width, word-wrap}; tr; td; div{width}; div(!signature-name)',

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
