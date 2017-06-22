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

      		template: 
				'<div class="signature-box">' +
					'<table>' +
						'<tr>' +
							'<td><div class="cell-left-fixed">____________________________________________</div></td>' +
							'<td><div class="cell-mid-fixed"></div></td>' +
							'<td><div class="cell-right-fixed signature-line-two">_______________________</div></td>' +
						'</tr>' +
						'<tr>' +
							'<td><div class="cell-left-fixed signature-name">[Click to Add Name and Title]</div></td>' +
							'<td><div class="cell-mid-fixed"></div></td>' +
							'<td><div class="cell-right-fixed signature-date">Date</div></td>' +
						'</tr>' +
					'</table>' +
				'</div>',

            allowedContent: 'div(!signature-box)',

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
