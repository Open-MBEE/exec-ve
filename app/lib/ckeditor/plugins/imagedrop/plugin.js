/**
 * imagedrop plugin for CKEDITOR
 * @author Shakeh Khudikyan
 * This plugin requires uploadwidget and fileTools to get clipboard data and 
 * create a paste event. The upload widget helps to handle content that is 
 * uploaded asynchronously inside the editor. The imagedrop plugin grabs the 
 * data sent to the clipboard and calls the onPaste function once the 'paste'
 * event is fired. It checks the clipboard data and uses the readImageAsBase64
 * function to load the image source as base64 data. The user call double click
 * image and have a dialog box to edit attributes.
 */

'use strict';

( function() {
	CKEDITOR.plugins.add( 'imagedrop', {
		requires: 'uploadwidget',

		onLoad: function() {
			CKEDITOR.addCss(
				'.cke_upload_uploading img{' +
					'opacity: 0.3' +
				'}'
			);
		},

		init: function( editor ) {
			// Do not execute this paste listener if it will not be possible to upload file.
			if ( !CKEDITOR.plugins.clipboard.isFileApiSupported ) {
				return;
			}

			var fileTools = CKEDITOR.fileTools;

			// Handle images which are available in the dataTransfer.
			fileTools.addUploadWidget( editor, 'imagedrop', {
				supportedTypes: /image\/(jpeg|png|gif|bmp)/,

				loadMethod: 'load',
				// uploadUrl: uploadUrl,

				fileToElement: function() {
					var img = new CKEDITOR.dom.element( 'img' );
					img.setAttribute( 'src', loadingImage );
					return img;
				},

				parts: {
					img: 'img'
				},

				onUploading: function( upload ) {
					// Show the image during the upload.
					this.parts.img.setAttribute( 'src', upload.data );
				},

				onUploaded: function( upload ) {
					// Set width and height to prevent blinking.
					this.replaceWith( '<img src="' + upload.url + '" ' +
						'width="' + this.parts.img.$.naturalWidth + '" ' +
						'height="' + this.parts.img.$.naturalHeight + '">' );
				}
			} );

			editor.on("paste", onPaste, null, {editor: editor});
		}
	} );


	function onPaste(event) {
        var editor = event.listenerData && event.listenerData.editor;
		var $event = event.data.dataTransfer.$;
        var clipboardData = $event.files;
        var found = false;
        var imageType = /^image/;
		var img = event.data.dataValue;

		// For performance reason do not parse data if it does not contain img tag and data attribute.
		if ( !img.match( /<img[\s\S]+data:/i ) ) {
            return;
        }

        if (!clipboardData) {
            return;
        }

        return Array.prototype.forEach.call(clipboardData, function (type, i) {
            if (found) {
                return;
            }

            if (type.type.match(imageType) || clipboardData[i].type.match(imageType)) {
                readImageAsBase64(clipboardData[i], editor);
                return found = true;
            }
        });
    }

    function readImageAsBase64(item, editor) {
        if (!item || typeof item !== 'object') {
            return;
        }

        var file = item;
        var reader = new FileReader();

        reader.onload = function (evt) {
            var element = editor.document.createElement('img', {
                attributes: {
                    src: evt.target.result
                }
            });

            // We use a timeout callback to prevent a bug where insertElement inserts at first caret
            // position
            setTimeout(function () {
                editor.insertElement(element);
            }, 10);
        };

        reader.readAsDataURL(file);
    }

	// jscs:disable maximumLineLength
	// Black rectangle which is shown before image is loaded.
	var loadingImage = 'data:image/gif;base64,R0lGODlhDgAOAIAAAAAAAP///yH5BAAAAAAALAAAAAAOAA4AAAIMhI+py+0Po5y02qsKADs=';
	// jscs:enable maximumLineLength


} )();
