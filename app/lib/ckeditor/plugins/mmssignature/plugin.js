/**
 * Plugin for inserting cross reference elements into the CKEditor editing area.
 */

// Register the plugin within the editor.
CKEDITOR.plugins.add( 'mmssignature', {
	requires: 'widget',
	// Register the icons.
	icons: 'mmssignature',

	init: function( editor ) {
		editor.widgets.add( 'mmssignature', {

            button: 'Create Signature Template',

      		template: 
				'<div class="signature-box">' +
					'<table>' +
						'<tr>' +
							'<td><span class="signature-line-one">______________________________________</span></td>' +
							'<td><span></span></td>' +
							'<td><span class="signature-line-two">________________</span></td>' +
						'</tr>' +
						'<tr>' +
							'<td><span class="signature-name">Name</span>,' +
							'<span class="signature-title">Title</span></td>' +
							'<td></td>' +
							'<td><span class="signature-date">Date</span></td>' +
						'</tr>' +
					'</table>' +
				'</div>',

            editables: {
                name: {
                    selector: '.signature-name',
                    allowedContent: 'br strong em'
                },
                title: {
                    selector: '.signature-title',
                    allowedContent: 'strong em'
                },
                date: {
                	selector: '.signature-date',
                	allowedContent: 'br strong em'
                }
            },

            allowedContent:
                'div(!signature-box)',

            requiredContent: 'div(signature-box)',

            upcast: function( element ) {
                return element.name == 'div' && element.hasClass( 'signature-box' );
            }
        } );
    }
    
});
