/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

CKEDITOR.plugins.add( 'uicolor', {
	requires: 'dialog',
	// jscs:disable maximumLineLength
	lang: 'en', // %REMOVE_LINE_CORE%
	// jscs:enable maximumLineLength
	icons: 'uicolor', // %REMOVE_LINE_CORE%
	hidpi: true, // %REMOVE_LINE_CORE%
	init: function( editor ) {
		var dialogCommandName = 'uicolor',
			dialogCommand = new CKEDITOR.dialogCommand( dialogCommandName );

		dialogCommand.editorFocus = false;

		// Add dialog.
		CKEDITOR.dialog.add( dialogCommandName, this.path + 'dialogs/' + dialogCommandName + '.js' );

		// Register command.
		editor.addCommand( dialogCommandName, dialogCommand );

		// Register button.
		editor.ui.addButton && editor.ui.addButton( 'UIColor', {
			label: editor.lang.uicolor.title,
			command: dialogCommandName,
			toolbar: 'tools,1'
		} );
	}
} );
