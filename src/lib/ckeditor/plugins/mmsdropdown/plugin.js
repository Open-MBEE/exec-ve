CKEDITOR.plugins.add('mmsdropdown',
    {
        requires: ['richcombo'],
        init: function (editor) {
            var config = editor.config, lang = editor.lang.format;
            function createItem(options) {
                return options.isMmsCustomPlugin ? '<span> <img style="width:auto; height:auto; max-width:20px; max-height:20px;" src="' + options.imgSrc + '"> <span style="margin-left:3px">' + options.label + '</span> </span>'
                    : '<span> <span class="cke_button_icon cke_button__' + options.iconClass + '_icon"> </span> <span style="margin-left:3px">' + options.label + '</span> </span>';
            }
            editor.ui.addRichCombo('mmsExtraFeature', {
                title: "More feature",
                className: 'mmsExtraFeature',
                multiSelect: false,
                panel: {css: [CKEDITOR.skin.getPath('editor')].concat(config.contentsCss)},

                init: function () {
                    this.add('mmscf', createItem({ isMmsCustomPlugin: true, imgSrc: '/lib/ckeditor/plugins/mmscf/icons/mmscf.png', label: 'Cross Reference' }), 'Add a cross reference');
                    this.add('mmsvlink', createItem({ isMmsCustomPlugin: true, imgSrc: '/lib/ckeditor/plugins/mmsvlink/icons/mmsvlink.png', label: 'View/Section Link' }), 'Add a view/section link');
                    this.add('', '<hr>');

                    this.add('link', createItem({ isMmsCustomPlugin: false, iconClass: 'link', label: 'Link' }), 'Add a link');
                    this.add('table', createItem({ isMmsCustomPlugin: false, iconClass: 'table', label: 'Table' }), 'Add a table');
                    this.add('image', createItem({ isMmsCustomPlugin: false, iconClass: 'image', label: 'Image' }), 'Add an image');
                    this.add('iframe', createItem({ isMmsCustomPlugin: false, iconClass: 'iframe', label: 'Iframe' }), 'Add an iframe');
                    this.add('mathjax', createItem({ isMmsCustomPlugin: false, iconClass: 'mathjax', label: 'Equation' }), 'Add an equation');
                    this.add('specialchar', createItem({ isMmsCustomPlugin: false, iconClass: 'specialchar', label: 'Math' }), 'Add a symbol');
                    this.add('', '<hr>');

                    this.add('mmscomment', createItem({ isMmsCustomPlugin: true, imgSrc: '/lib/ckeditor/plugins/mmscomment/icons/mmscomment.png', label: 'Comment' }), 'Add a comment');
                    this.add('', '<hr>');

                    this.add('codeSnippet', createItem({ isMmsCustomPlugin: false, iconClass: 'codesnippet', label: 'Code Snippet' }), 'Add a code snippet');
                    this.add('blockquote', createItem({ isMmsCustomPlugin: false, iconClass: 'blockquote', label: 'Quote' }), 'Add a quote');
                    this.add('', '<hr>');

                    this.add('pagebreak', createItem({ isMmsCustomPlugin: false, iconClass: 'pagebreak', label: 'Page break for printing' }), 'Add a page break');
                    this.add('horizontalrule', createItem({ isMmsCustomPlugin: false, iconClass: 'horizontalrule', label: 'Horizontal Rule' }), 'Add a horizontal');
                    this.add('', '<hr>');

                    this.add('mmssignature', createItem({ isMmsCustomPlugin: true, imgSrc: '/lib/ckeditor/plugins/mmssignature/icons/mmssignature.png', label: 'Signature template' }), 'Add a signature template');
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
                    this.add('', '<hr>');

                    this.add('removeFormat', createItem({ isMmsCustomPlugin: false, iconClass: 'removeformat', label: 'Clear Formatting' }), 'Add an equation');
                },

                onClick: function (command) {
                    if (command !== '') {
                        editor.execCommand(command);
                    }
                }
            });
        }
    });