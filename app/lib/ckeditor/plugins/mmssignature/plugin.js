/**
 * Plugin for inserting cross reference elements into the CKEditor editing area.
 */

// Register the plugin within the editor.
CKEDITOR.plugins.add( 'mmssignature', {
	requires: 'widget',
	// Register the icons.
	icons: 'mmssignature',
	editables: {
		name: {
			selector: '.signature-name'
		},
		title: {
			selector: '.signature-title'
		},
		date: {
			selector: '.signature-date'
		}
	},

	init: function( editor ) {
		// TO DO: Explanation
		editor.widgets.add( 'mmssignature', {
      		button: 'Insert Signature Template',
      		allowedContent: 'mms-signature[*]',
			insert: function() {
        		var defaultConfig = { 
          			callbackModalFnc : function () {
            			console.log("There is no callback function defined");
          			} 
        		};
        		var config = CKEDITOR.tools.extend(defaultConfig, editor.config.mmssignature || {}, true);
        		var tag = config.callbackModalFnc(editor,false);
      		},
      // Check the elements that need to be converted to widgets.
			upcast: function( element ) {
				// Return "true" (that element needs to converted to a mmssignature widget)
				// for all <mms-signature> elements.
				return (element.name == 'mms-signature');
			},
    });
    
	}
});
