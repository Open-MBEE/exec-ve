/**
 * Plugin for inserting view link elements into the CKEditor editing area.
 */

// Register the plugin within the editor.
CKEDITOR.plugins.add('mmsvlink', {
    requires: 'widget',
    // Register the icons.
    icons: 'mmsvlink',

    init: (editor) => {
        // Register mmsvlink widget to opens view link search window
        // and insert mmsvlink tag as widget.
        editor.widgets.add('mmsvlink', {
            button: 'Insert Cross Reference as link',
            allowedContent: 'mms-view-link[*];view-link[*]',
            inline: true,
            insert: () => {
                var defaultConfig = {
                    callbackModalFnc: () => {
                        console.log('There is no callback function defined')
                    },
                }
                var config = CKEDITOR.tools.extend(
                    defaultConfig,
                    editor.config.mmsvlink || {},
                    true
                )
                var tag = config.callbackModalFnc(editor, false)
            },
            // Check the elements that need to be converted to widgets.
            upcast: (element) => {
                // Return "true" (that element needs to converted to a mmsvlink widget)
                // for all <view-link> elements.
                return element.name === 'view-link' || element.name === 'mms-view-link'
            },
        })
    },
})
