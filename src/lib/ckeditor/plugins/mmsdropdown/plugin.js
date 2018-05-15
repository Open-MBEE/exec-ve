CKEDITOR.plugins.add('mmsdropdown',
    {
        requires: ['richcombo'],
        init: function (editor) {
            var config = editor.config, lang = editor.lang.format;
            function createItem(options) {
                return options.isMmsCustomPlugin ? '<span> <img style="vertical-align:middle; width:auto; height:auto; max-width:17px; max-height:17px;" src="' + options.imgSrc + '"> <span style="margin-left:3px">' + options.label + '</span> </span>'
                    : '<span> <span class="cke_button_icon cke_button__' + options.iconClass + '_icon"> </span> <span style="margin-left:3px">' + options.label + '</span> </span>';
            }
            editor.ui.addRichCombo('mmsExtraFeature', {
                title: "Insert more content",
                className: 'mmsExtraFeature',
                multiSelect: false,
                panel: {css: [CKEDITOR.skin.getPath('editor')].concat(config.contentsCss)},

                init: function () {
                    this.add('mmscf', createItem({ isMmsCustomPlugin: true, imgSrc: 'lib/ckeditor/plugins/mmscf/icons/mmscf.png', label: 'Cross Reference' }), 'Insert Cross Reference');
                    this.add('mmsvlink', createItem({ isMmsCustomPlugin: true, imgSrc: 'lib/ckeditor/plugins/mmsvlink/icons/mmsvlink.png', label: 'Cross Reference as link' }), 'Insert Cross Reference as link (View Link)');
                    this.add('', '<hr>', 'mms-br');

                    this.add('link', createItem({ isMmsCustomPlugin: false, iconClass: 'link', label: 'Link' }), 'Insert link');
                    this.add('table', createItem({ isMmsCustomPlugin: false, iconClass: 'table', label: 'Table' }), 'Insert table');
                    this.add('image', createItem({ isMmsCustomPlugin: false, iconClass: 'image', label: 'Image' }), 'Insert image');
                    this.add('iframe', createItem({ isMmsCustomPlugin: false, iconClass: 'iframe', label: 'Iframe' }), 'Insert iframe');
                    this.add('mathjax', createItem({ isMmsCustomPlugin: false, iconClass: 'mathjax', label: 'Math' }), 'Insert math');
                    this.add('specialchar', createItem({ isMmsCustomPlugin: false, iconClass: 'specialchar', label: 'Special Character' }), 'Insert symbol');
                    this.add('', '<hr>', 'mms-br');

                    this.add('mmscomment', createItem({ isMmsCustomPlugin: true, imgSrc: 'lib/ckeditor/plugins/mmscomment/icons/mmscomment.png', label: 'Comment' }), 'Insert comment');
                    this.add('', '<hr>', 'mms-br');

                    this.add('codeSnippet', createItem({ isMmsCustomPlugin: false, iconClass: 'codesnippet', label: 'Code Snippet' }), 'Insert code snippet');
                    this.add('blockquote', createItem({ isMmsCustomPlugin: false, iconClass: 'blockquote', label: 'Quote' }), 'Insert quote');
                    this.add('', '<hr>', 'mms-br');

                    this.add('pagebreak', createItem({ isMmsCustomPlugin: false, iconClass: 'pagebreak', label: 'Page break for printing' }), 'Insert page break');
                    this.add('horizontalrule', createItem({ isMmsCustomPlugin: false, iconClass: 'horizontalrule', label: 'Horizontal Rule' }), 'Insert horizontal rule');
                    this.add('', '<hr>', 'mms-br');

                    this.add('mmssignature', createItem({ isMmsCustomPlugin: true, imgSrc: 'lib/ckeditor/plugins/mmssignature/icons/mmssignature.png', label: 'Signature template' }), 'Insert signature template');
                },

                onClick: function (command) {
                    if (command !== '') {
                        editor.execCommand(command);
                    }
                }
            });
            editor.ui.addRichCombo('mmsExtraFormat', {
                title: "Extra formatting",
                className: 'mmsExtraFormat',
                multiSelect: false,
                panel: { css: [CKEDITOR.skin.getPath('editor')].concat(config.contentsCss) },
                init: function () {
                    this.add('strike', createItem({ isMmsCustomPlugin: false, iconClass: 'strike', label: 'Strikethrough' }), 'Strikethrough');
                    this.add('superscript', createItem({ isMmsCustomPlugin: false, iconClass: 'superscript', label: 'Superscript' }), 'Superscript');
                    this.add('subscript', createItem({ isMmsCustomPlugin: false, iconClass: 'subscript', label: 'Subscript' }), 'Subscript');
                    this.add('', '<hr>', 'mms-br');

                    this.add('removeFormat', createItem({ isMmsCustomPlugin: false, iconClass: 'removeformat', label: 'Clear Formatting' }), 'Clear Formatting');
                },

                onClick: function (command) {
                    if (command !== '') {
                        editor.execCommand(command);
                    }
                }
            });
        }
    });
