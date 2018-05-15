/**
 * Plugin for resetting cross reference elements into the CKEditor editing area.
 */

// Register the plugin within the editor.
CKEDITOR.plugins.add('mmsreset', {
  // Register the icons.
  icons: 'mmsreset',
  init: function (editor) {
    editor.addCommand('mmsreset', {
      exec: function (editor) {
        var defaultConfig = {
          callbackModalFnc: function () {
            console.log("There is no callback function defined");
          }
        }
        var config = CKEDITOR.tools.extend(defaultConfig, editor.config.mmsreset || {}, true);
        config.callback(editor);
      }
    });

    editor.ui.addButton('mmsreset', {
      label: 'Update Cross Ref',
      command: 'mmsreset',
    });
  }
});
