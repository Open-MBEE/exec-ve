/**
 * Plugin for inserting cross reference elements into the CKEditor editing area.
 */

// Register the plugin within the editor.
CKEDITOR.plugins.add( 'mmssignature', {
	requires: 'widget',
	// Register the icons.
	icons: 'mmssignature',

	init: function( editor ) {
		// TO DO: Explanation
		editor.widgets.add( 'mmssignature', {
			button: 'Insert Signature Template',
      		// label: 'Insert Signature Template',

   //    		template: 
			// 	'<div class="signature-box">' +
			// 		'<div class="signature-line"></div>' +
			// 		'<div class="signature-info">' +
			// 			'<span>' +
			// 				'<p class="signature-name">{{ Name || signature.name }}</p>,' +
			// 				'<p class="signature-title">{{ Title || signature.title }}</p>' +
			// 			'</span>' +
			// 			'<p class="signature-date">{{ Date || signature.date }}</p>' +
			// 		'</div>' +
			// 	'</div>',

			// editables: {
			// 	name: {
			// 		selector: '.signature-name'
			// 	},
			// 	title: {
			// 		selector: '.signature-title'
			// 	},
			// 	date: {
			// 		selector: '.signature-date'
			// 	}
			// },

      		allowedContent: 'mms-signature[*];',
      		inline: true,
			insert: function() {
        		var defaultConfig = { 
          			callbackFnc : function () {
            			
          			} 
        		};
        		var config = CKEDITOR.tools.extend(defaultConfig, editor.config.mmssignature || {}, true);
        		var tag = config.callbackFnc(editor);
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
