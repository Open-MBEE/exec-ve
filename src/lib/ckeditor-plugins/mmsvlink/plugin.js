/**
 * Plugin for inserting view link elements into the CKEditor editing area.
 */

// Register the plugin within the editor.
CKEDITOR.plugins.add('mmsvlink', {
  requires: 'widget',
  // Register the icons.
  icons: 'mmsvlink',

  init: function (editor) {
    // Register mmsvlink widget to opens view link search window 
    // and insert mmsvlink tag as widget.
    editor.widgets.add('mmsvlink', {
      button: 'Insert Cross Reference as link',
      allowedContent: 'mms-view-link[*];',
      inline: true,
      insert: function () {
        var defaultConfig = {
          callbackModalFnc: function () {
            console.log("There is no callback function defined");
          }
        };
        var config = CKEDITOR.tools.extend(defaultConfig, editor.config.mmsvlink || {}, true);
        var tag = config.callbackModalFnc(editor, false);
      },
      // Check the elements that need to be converted to widgets.
      upcast: function (element) {
        // Return "true" (that element needs to converted to a mmsvlink widget)
        // for all <mms-view-link> elements.
        return element.name == 'mms-view-link';
      },
    });

  }
});
