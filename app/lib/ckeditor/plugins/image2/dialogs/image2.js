/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview Image plugin based on Widgets API
 */

'use strict';

CKEDITOR.dialog.add( 'image2', function( editor ) {

	// RegExp: 123, 123px, empty string ""
	var regexGetSizeOrEmpty = /(^\s*(\d+)(px)?\s*$)|^$/i,

		lockButtonId = CKEDITOR.tools.getNextId(),
		resetButtonId = CKEDITOR.tools.getNextId(),

		lang = editor.lang.image2,
		commonLang = editor.lang.common,

		lockResetStyle = 'margin-top:18px;width:40px;height:20px;',
		lockResetHtml = new CKEDITOR.template(
			'<div>' +
				'<a href="javascript:void(0)" tabindex="-1" title="' + lang.lockRatio + '" class="cke_btn_locked" id="{lockButtonId}" role="checkbox">' +
					'<span class="cke_icon"></span>' +
					'<span class="cke_label">' + lang.lockRatio + '</span>' +
				'</a>' +

				'<a href="javascript:void(0)" tabindex="-1" title="' + lang.resetSize + '" class="cke_btn_reset" id="{resetButtonId}" role="button">' +
					'<span class="cke_label">' + lang.resetSize + '</span>' +
				'</a>' +
			'</div>' ).output( {
				lockButtonId: lockButtonId,
				resetButtonId: resetButtonId
			} ),

		helpers = CKEDITOR.plugins.image2,

		// Editor instance configuration.
		config = editor.config,

		// Content restrictions defined by the widget which
		// impact on dialog structure and presence of fields.
		features = editor.widgets.registered.image.features,

		// Functions inherited from image2 plugin.
		getNatural = helpers.getNatural,

		// Global variables referring to the dialog's context.
		doc, widget, image,

		// Global variable referring to this dialog's image pre-loader.
		preLoader,

		// Global variables holding the original size of the image.
		domWidth, domHeight,

		// Global variables related to image pre-loading.
		preLoadedWidth, preLoadedHeight, srcChanged,

		// Global variables related to size locking.
		lockRatio, userDefinedLock,

		// Global variables referring to dialog fields and elements.
		lockButton, resetButton, widthField, heightField,

		natural;

	// Validates dimension. Allowed values are:
	// "123px", "123", "" (empty string)
	function validateDimension() {
		var match = this.getValue().match( regexGetSizeOrEmpty ),
			isValid = !!( match && parseInt( match[ 1 ], 10 ) !== 0 );

		if ( !isValid )
			alert( commonLang[ 'invalid' + CKEDITOR.tools.capitalize( this.id ) ] ); // jshint ignore:line

		return isValid;
	}

	// Creates a function that pre-loads images. The callback function passes
	// [image, width, height] or null if loading failed.
	//
	// @returns {Function}
	function createPreLoader() {
		var image = doc.createElement( 'img' ),
			listeners = [];

		function addListener( event, callback ) {
			listeners.push( image.once( event, function( evt ) {
				removeListeners();
				callback( evt );
			} ) );
		}

		function removeListeners() {
			var l;

			while ( ( l = listeners.pop() ) )
				l.removeListener();
		}

		// @param {String} src.
		// @param {Function} callback.
		return function( src, callback, scope ) {
			addListener( 'load', function() {
				// Don't use image.$.(width|height) since it's buggy in IE9-10 (#11159)
				var dimensions = getNatural( image );

				callback.call( scope, image, dimensions.width, dimensions.height );
			} );

			addListener( 'error', function() {
				callback( null );
			} );

			addListener( 'abort', function() {
				callback( null );
			} );

			image.$.src = src;
		};
	}



	function onChangeDimension() {
		// If ratio is un-locked, then we don't care what's next.
		if ( !lockRatio )
			return;

		var value = this.getValue();

		// No reason to auto-scale or unlock if the field is empty.
		if ( !value )
			return;

		// If the value of the field is invalid (e.g. with %), unlock ratio.
		if ( !value.match( regexGetSizeOrEmpty ) )
			toggleLockRatio( false );

		// No automatic re-scale when dimension is '0'.
		if ( value === '0' )
			return;

		var isWidth = this.id == 'width',
			// If dialog opened for the new image, domWidth and domHeight
			// will be empty. Use dimensions from pre-loader in such case instead.
			width = domWidth || preLoadedWidth,
			height = domHeight || preLoadedHeight;

		// If changing width, then auto-scale height.
		if ( isWidth )
			value = Math.round( height * ( value / width ) );

		// If changing height, then auto-scale width.
		else
			value = Math.round( width * ( value / height ) );

		// If the value is a number, apply it to the other field.
		if ( !isNaN( value ) )
			( isWidth ? heightField : widthField ).setValue( value );
	}

	// Set-up function for lock and reset buttons:
	// 	* Adds lock and reset buttons to focusables. Check if button exist first
	// 	  because it may be disabled e.g. due to ACF restrictions.
	// 	* Register mouseover and mouseout event listeners for UI manipulations.
	// 	* Register click event listeners for buttons.
	function onLoadLockReset() {
		var dialog = this.getDialog();

		function setupMouseClasses( el ) {
			el.on( 'mouseover', function() {
				this.addClass( 'cke_btn_over' );
			}, el );

			el.on( 'mouseout', function() {
				this.removeClass( 'cke_btn_over' );
			}, el );
		}

		// Create references to lock and reset buttons for this dialog instance.
		lockButton = doc.getById( lockButtonId );
		resetButton = doc.getById( resetButtonId );

		// Activate (Un)LockRatio button
		if ( lockButton ) {
			// Consider that there's an additional focusable field
			// in the dialog when the "browse" button is visible.
			dialog.addFocusable( lockButton, 4 + hasFileBrowser );

			lockButton.on( 'click', function( evt ) {
				toggleLockRatio();
				evt.data && evt.data.preventDefault();
			}, this.getDialog() );

			setupMouseClasses( lockButton );
		}

		// Activate the reset size button.
		if ( resetButton ) {
			// Consider that there's an additional focusable field
			// in the dialog when the "browse" button is visible.
			dialog.addFocusable( resetButton, 5 + hasFileBrowser );

			// Fills width and height fields with the original dimensions of the
			// image (stored in widget#data since widget#init).
			resetButton.on( 'click', function( evt ) {
				// If there's a new image loaded, reset button should revert
				// cached dimensions of pre-loaded DOM element.
				if ( srcChanged ) {
					widthField.setValue( preLoadedWidth );
					heightField.setValue( preLoadedHeight );
				}

				// If the old image remains, reset button should revert
				// dimensions as loaded when the dialog was first shown.
				else {
					widthField.setValue( domWidth );
					heightField.setValue( domHeight );
				}

				evt.data && evt.data.preventDefault();
			}, this );

			setupMouseClasses( resetButton );
		}
	}

	function toggleLockRatio( enable ) {
		// No locking if there's no radio (i.e. due to ACF).
		if ( !lockButton )
			return;

		if ( typeof enable == 'boolean' ) {
			// If user explicitly wants to decide whether
			// to lock or not, don't do anything.
			if ( userDefinedLock )
				return;

			lockRatio = enable;
		}

		// Undefined. User changed lock value.
		else {
			var width = widthField.getValue(),
				height;

			userDefinedLock = true;
			lockRatio = !lockRatio;

			// Automatically adjust height to width to match
			// the original ratio (based on dom- dimensions).
			if ( lockRatio && width ) {
				height = domHeight / domWidth * width;

				if ( !isNaN( height ) )
					heightField.setValue( Math.round( height ) );
			}
		}

		lockButton[ lockRatio ? 'removeClass' : 'addClass' ]( 'cke_btn_unlocked' );
		lockButton.setAttribute( 'aria-checked', lockRatio );

		// Ratio button hc presentation - WHITE SQUARE / BLACK SQUARE
		if ( CKEDITOR.env.hc ) {
			var icon = lockButton.getChild( 0 );
			icon.setHtml( lockRatio ? CKEDITOR.env.ie ? '\u25A0' : '\u25A3' : CKEDITOR.env.ie ? '\u25A1' : '\u25A2' );
		}
	}

	function toggleDimensions( enable ) {
		var method = enable ? 'enable' : 'disable';

		widthField[ method ]();
		heightField[ method ]();
	};

	var imgPreview = null, urlCB = null, fileCB = null, t = null, urlI = null;
	
	/* Check File Reader Support */
	function fileSupport() {
		var r = false, n = null;
		try {
			if(FileReader) {
				var n = document.createElement("input");
				if(n && "files" in n) r = true;
			}
		} catch(e) { r = false; }
		n = null;
		return r;
	}
	var fsupport = fileSupport();

	/* Load preview image and set image attr */
	// This function updates width and height fields once the
	// "src" field is altered. Along with dimensions, also the
	// dimensions lock is adjusted.
	function imagePreviewLoad(s) {
		// value will store url or base64 of image
		var value = null; 

		/* if no string passed - no preview */
		if(typeof(s) != "string" || !s) {
			imgPreview.getElement().setHtml("");
			return;
		} else 
			value = s; // set value to string

		toggleDimensions( false ); // Disable dimension options

		// Remember that src is different than default.
		if ( value !== widget.data.src ) {
			// Update dimensions of the image once it's preloaded.
			preLoader( value, function( image, width, height ) {
				// Re-enable width and height fields.
				toggleDimensions( true );

				// There was problem loading the image. Unlock ratio.
				if ( !image )
					return toggleLockRatio( false );

				// Fill width field with the width of the new image.
				widthField.setValue( editor.config.image2_prefillDimensions === false ? 0 : width );

				// Fill height field with the height of the new image.
				heightField.setValue( editor.config.image2_prefillDimensions === false ? 0 : height );

				// Cache the new width.
				preLoadedWidth = width;

				// Cache the new height.
				preLoadedHeight = height;

				// Check for new lock value if image exist.
				toggleLockRatio( helpers.checkHasNaturalRatio( image ) );

				/* Insert preview image */
				try {
					var p = imgPreview.getElement().$;
					image.setAttribute("style","max-width:400px;max-height:100px")
					if (p) p.appendChild(image.$);
				} catch (e)  {console.log("Error when adding preview to ")}
			} );

			srcChanged = true;
		}

		// Value is the same as in widget data but is was
		// modified back in time. Roll back dimensions when restoring
		// default src.
		else if ( srcChanged ) {
			// Re-enable width and height fields.
			toggleDimensions( true );

			// Restore width field with cached width.
			widthField.setValue( domWidth );

			// Restore height field with cached height.
			heightField.setValue( domHeight );

			// Src equals default one back again.
			srcChanged = false;
		}

		// Value is the same as in widget data and it hadn't
		// been modified.
		else {
			// Re-enable width and height fields.
			toggleDimensions( true );
		}

	  /* Set image src within widget data */
		widget.data.previewSrc = s;
	}

	/* Change image input values and load preview image */
	function onChangeSrc(src){
		
		/* Remove preview */
		imgPreview.getElement().setHtml("");
		
		if(src == "base64") {
			
			/* Toggle checkboxes */
			if(urlCB) urlCB.setValue(false, true);
			if(fileCB) fileCB.setValue(false, true);
			
		} else if(src == "url") {
			
			/* Toggle checkboxes */
			if(urlCB) urlCB.setValue(true, true);
			if(fileCB) fileCB.setValue(false, true);
			
			/* Load preview image */
			if(urlI) imagePreviewLoad(urlI.getValue());
			
		} else if(fsupport) {

			/* If url is defined clear textbox, file browse is enabled */
			if ( urlI.getValue() ) urlI.setValue("");
			
			/* Ensable Image File Checkbox */
			if(urlCB) urlCB.setValue(false, true);
			if(fileCB) fileCB.setValue(true, true);
			
			/* Read file and load preview */
			var fileI = t.getContentElement("info", "file");
			var n = null;
			try { n = fileI.getInputElement().$; } catch(e) { n = null; }
			if(n && "files" in n && n.files && n.files.length > 0 && n.files[0]) {
				if("type" in n.files[0] && !n.files[0].type.match("image.*")) return;
				if(!FileReader) return;
				imgPreview.getElement().setHtml("Loading...");
				var fr = new FileReader();
				fr.onload = (function(f) { return function(e) {
					imgPreview.getElement().setHtml("");
					imagePreviewLoad(e.target.result);
				}; })(n.files[0]);
				fr.onerror = function(){ imgPreview.getElement().setHtml(""); };
				fr.onabort = function(){ imgPreview.getElement().setHtml(""); };
				fr.readAsDataURL(n.files[0]);
			}
		}
	};
	

	var hasFileBrowser = !!( config.filebrowserImageBrowseUrl || config.filebrowserBrowseUrl ),
		srcBoxChildren = [
			{
				type: "hbox",
				widths: ["100px"],
				children: [
					{
						type: "checkbox",
						id: "urlcheckbox",
						style: "margin-top:5px",
						label: editor.lang.common.url+":"
					},
					{
						id: 'src',
						type: 'text',
						label: commonLang.url,
						// onKeyup: onChangeSrc,
						onChange:function(){ 
							onChangeSrc("url"); 
							// onChangeSrc(this,"url"); 
						},
						setup: function( widget ) {
							this.setValue( widget.data.src );
						},
						commit: function( widget ) {
							widget.setData( 'src', widget.data.previewSrc );
						},
						// validate: CKEDITOR.dialog.validate.notEmpty( lang.urlMissing )
					},
				]
			},
			{
				type: "hbox",
				widths: ["100px"],
				children: [
					{
						type: "checkbox",
						id: "filecheckbox",
						style: "margin-top:5px",
						label: editor.lang.common.upload+":"
					},
					{
						type: "file",
						id: "file",
						label: "",
						// onChange: onChangeSrc,
						onChange: function(widget){
							 onChangeSrc("file"); 
							//  onChangeSrc(this,"file");
						},
						commit: function( widget ) {
							widget.setData( 'file', widget.data.previewSrc );
						},
					}
				]
			}
		];

	// Render the "Browse" button on demand to avoid an "empty" (hidden child)
	// space in dialog layout that distorts the UI.
	if ( hasFileBrowser ) {
		srcBoxChildren.push( {
			type: 'button',
			id: 'browse',
			// v-align with the 'txtUrl' field.
			// TODO: We need something better than a fixed size here.
			style: 'display:inline-block;margin-top:14px;',
			align: 'center',
			label: editor.lang.common.browseServer,
			hidden: true,
			filebrowser: 'info:src'
		} );
	}

	return {
		title: lang.title,
		minWidth: 350,
		minHeight: 130,
		onLoad: function() {
			// Create a "global" reference to the document for this dialog instance.
			doc = this._.element.getDocument();

			if(fsupport) {
				urlCB  = this.getContentElement("info", "urlcheckbox");
				fileCB = this.getContentElement("info", "filecheckbox");
				urlCB.getInputElement().on("click", function(){ onChangeSrc("url"); });
				fileCB.getInputElement().on("click", function(){ onChangeSrc("file"); });
			}

			/* Get url input element */
			urlI = this.getContentElement("info", "src");

			/* Get image preview element */
			imgPreview = this.getContentElement("info", "preview");

			// Create a pre-loader used for determining dimensions of new images.
			preLoader = createPreLoader();
		},
		onShow: function() {
			/* Remove preview */
			imgPreview.getElement().setHtml("");
			t = this;

			// Create a "global" reference to edited widget.
			widget = this.widget;

			// Create a "global" reference to widget's image.
			image = widget.parts.image;

			// Reset global variables.
			srcChanged = userDefinedLock = lockRatio = false;

			// Natural dimensions of the image.
			natural = getNatural( image );

			// Get the natural width of the image.
			preLoadedWidth = domWidth = natural.width;

			// Get the natural height of the image.
			preLoadedHeight = domHeight = natural.height;
		},
		contents: [
			{
				id: 'info',
				label: lang.infoTab,
				elements: [
					{
						type: 'vbox',
						padding: 0,
						children: [
							{
								type: 'vbox',
								widths: [ '100px', '100px','100px' ],
								children: srcBoxChildren
							}
						]
					},
					{
						type: "html",
						id: "preview",
						label: "Preview",
						html: new CKEDITOR.template("<div style=\"text-align:center;\"></div>").output()
					},
					{
						id: 'alt',
						type: 'text',
						label: lang.alt,
						setup: function( widget ) {
							this.setValue( widget.data.alt );
						},
						commit: function( widget ) {
							widget.setData( 'alt', this.getValue() );
						}
					},
					{
						type: 'hbox',
						widths: [ '25%', '25%', '50%' ],
						requiredContent: features.dimension.requiredContent,
						children: [
							{
								type: 'text',
								width: '45px',
								id: 'width',
								label: commonLang.width,
								validate: validateDimension,
								onKeyUp: onChangeDimension,
								onLoad: function() {
									widthField = this;
								},
								setup: function( widget ) {
									this.setValue( widget.data.width );
								},
								commit: function( widget ) {
									widget.setData( 'width', this.getValue() );
								}
							},
							{
								type: 'text',
								id: 'height',
								width: '45px',
								label: commonLang.height,
								validate: validateDimension,
								onKeyUp: onChangeDimension,
								onLoad: function() {
									heightField = this;
								},
								setup: function( widget ) {
									this.setValue( widget.data.height );
								},
								commit: function( widget ) {
									widget.setData( 'height', this.getValue() );
								}
							},
							{
								id: 'lock',
								type: 'html',
								style: lockResetStyle,
								onLoad: onLoadLockReset,
								setup: function( widget ) {
									toggleLockRatio( widget.data.lock );
								},
								commit: function( widget ) {
									widget.setData( 'lock', lockRatio );
								},
								html: lockResetHtml
							}
						]
					},
					// Alignment not working properly TODO update with proper alignment in center pane
					// {
					// 	type: 'hbox',
					// 	id: 'alignment',
					// 	requiredContent: features.align.requiredContent,
					// 	children: [
					// 		{
					// 			id: 'align',
					// 			type: 'radio',
					// 			items: [
					// 				[ commonLang.alignNone, 'none' ],
					// 				[ commonLang.alignLeft, 'left' ],
					// 				[ commonLang.alignCenter, 'center' ],
					// 				[ commonLang.alignRight, 'right' ]
					// 			],
					// 			label: commonLang.align,
					// 			setup: function( widget ) {
					// 				this.setValue( widget.data.align );
					// 			},
					// 			commit: function( widget ) {
					// 				widget.setData( 'align', this.getValue() );
					// 			}
					// 		}
					// 	]
					// },
					{
						id: 'hasCaption',
						type: 'checkbox',
						label: lang.captioned,
						requiredContent: features.caption.requiredContent,
						setup: function( widget ) {
							this.setValue( widget.data.hasCaption );
						},
						commit: function( widget ) {
							widget.setData( 'hasCaption', this.getValue() );
						}
					}
				]
			},
			{
				id: 'Upload',
				hidden: true,
				filebrowser: 'uploadButton',
				label: lang.uploadTab,
				elements: [
					{
						type: 'file',
						id: 'upload',
						label: lang.btnUpload,
						style: 'height:40px'
					},
					{
						type: 'fileButton',
						id: 'uploadButton',
						filebrowser: 'info:src',
						label: lang.btnUpload,
						'for': [ 'Upload', 'upload' ]
					}
				]
			}
		]
	};
} );
