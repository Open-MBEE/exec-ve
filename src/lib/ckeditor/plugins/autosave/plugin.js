/**
 * @license Copyright (c) CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 *
 * This is a fork of CKEditor's autosave plugin.
 * The fork repository is maintained at the following url:
 * https://github.com/chhaymenghong/CKEditor-AutoSave-Plugin
 */
CKEDITOR.MmsAutosavePlugin =
(function() {
    if (!supportsLocalStorage()) {
        CKEDITOR.plugins.add("autosave", {}); //register a dummy plugin to pass CKEditor plugin initialization process
        return;
    }

    CKEDITOR.plugins.add("autosave", {
        lang: 'ca,cs,de,en,es,fr,it,ja,nl,pl,pt-br,ru,sk,sv,zh,zh-cn', // %REMOVE_LINE_CORE%
        requires: 'notification',
        version: "0.18.0",
        init: function (editor) {
            if ( !editor.config.autosave.enableAutosave ) {
                return;
            }

            // Look for autosave from config.js - this is a bit redundant but necessary
            editor.config.autosave = 'autosave' in editor.config ? editor.config.autosave : {};
            
            // Prepare temp vars for constructing local storage SaveKey name
            var _saveKeyPrefix = 'saveKeyPrefix' in editor.config.autosave ? editor.config.autosave.saveKeyPrefix : 'autosave',
                _saveKeyIgnoreProto = 'saveKeyIgnoreProtocol' in editor.config.autosave ? editor.config.autosave.saveKeyIgnoreProtocol : false,
                _saveKeyUrl = _saveKeyIgnoreProto ? window.location.href.replace(/https?:\/\//, '') : window.location.href,
                _saveKeyDelimiter = 'saveKeyDelimiter' in editor.config.autosave ? editor.config.autosave.saveKeyDelimiter : '_',
                _saveKeyAttribute = 'saveKeyAttribute' in editor.config.autosave ? editor.config.autosave.saveKeyAttribute : 'name';
            
            if ('saveKeyIgnoreParams' in editor.config.autosave) {
                $(editor.config.autosave.saveKeyIgnoreParams).each(function() { 
                    _saveKeyUrl = autosaveRemoveUrlParam(this, null, _saveKeyUrl);
                });
            }
            
            // Construct default configuration
            var defaultConfig = {
                delay: 10,
                messageType: "notification",
                saveDetectionSelectors: "a[href^='javascript:__doPostBack'][id*='Save'],a[id*='Cancel']",
                saveOnDestroy: false,
                NotOlderThen: 1440,
                SaveKey: _saveKeyPrefix + _saveKeyDelimiter + _saveKeyUrl + _saveKeyDelimiter + $(document.getElementById('#' + editor.name)).attr(_saveKeyAttribute),
                diffType: "sideBySide",
                autoLoad: false
            };

            // Extend CKEDITOR config and lang  - config also available at loadPlugin()
            var config = CKEDITOR.tools.extend(defaultConfig, editor.config.autosave || {}, true);

            if (editor.plugins.wordcount && config.messageType == "statusbar") {
                config.messageType = "notification";
            }

            CKEDITOR.document.appendStyleSheet(CKEDITOR.getUrl(CKEDITOR.plugins.getPath('autosave') + 'css/autosave.min.css'));

            editor.on('uiSpace', function(event) {
                if (event.data.space == 'bottom' && config.messageType != null && config.messageType == "statusbar") {

                    event.data.html += '<div class="autoSaveMessage" unselectable="on"><div unselectable="on" id="'
                        + autoSaveMessageId(event.editor)
                        + '"class="hidden">'
                        + event.editor.lang.autosave.autoSaveMessage
                        + '</div></div>';
                }
            }, editor, null, 100);

            editor.on('instanceReady', function(){
                if (typeof (jQuery) === 'undefined') {
                    CKEDITOR.scriptLoader.load('//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js', function() {
                        jQuery.noConflict();

                        loadPlugin(editor, config);
                    });

                } else {
                    CKEDITOR.scriptLoader.load(CKEDITOR.getUrl(CKEDITOR.plugins.getPath('autosave') + 'js/extensions.min.js'), function() {
                        loadPlugin(editor, config);
                    });
                }
            }, editor, null, 100);
        }
    });

    function loadPlugin(editorInstance, config) {

        CKEDITOR.scriptLoader.load(CKEDITOR.getUrl(CKEDITOR.plugins.getPath('autosave') + 'js/extensions.min.js'), function() {
            GenerateAutoSaveDialog(editorInstance, config, config.SaveKey);

            CheckForAutoSavedContent(editorInstance, config, config.SaveKey, config.NotOlderThen);
        });

        jQuery(config.saveDetectionSelectors).click(function() {
            RemoveStorage(config.SaveKey, editorInstance);
        });

        editorInstance.on('change', function() {
            startTimer(config, editorInstance);
        });

        editorInstance.on('destroy', function() {
            if (config.saveOnDestroy) {
                SaveData(config.SaveKey, editorInstance, config);
            }
        });
    }

    function autoSaveMessageId(editorInstance) {
        return 'cke_autoSaveMessage_' + editorInstance.name;
    }

    var startTimer = function (configAutosave, editorInstance) {
        if (editorInstance.config.autosave_timeOutId == null) {
            var delay = configAutosave.delay != null ? configAutosave.delay : 10;
            editorInstance.config.autosave_timeOutId = setTimeout(function() {
                    onTimer(configAutosave, editorInstance);
                },
                delay * 1000);
        }
    };
    function onTimer (configAutosave, editorInstance) {
        if (editorInstance.checkDirty() || editorInstance.plugins.bbcode) {
            var editor = editorInstance,
                autoSaveKey = configAutosave.SaveKey != null
                    ? configAutosave.SaveKey
                    : 'autosave_' + window.location + "_" + $(document.getElementById('#' + editor.name)).attr('name');

            SaveData(autoSaveKey, editor, configAutosave);

            clearTimeout(editorInstance.config.autosave_timeOutId);

            editorInstance.config.autosave_timeOutId = null;
        }
    }

    // localStorage detection
    function supportsLocalStorage() {
        if (typeof (Storage) === 'undefined') {
            return false;
        }

        try {
            localStorage.getItem("___test_key");
            return true;
        } catch (e) {
            return false;
        }
    }

    function GenerateAutoSaveDialog(editorInstance, config, autoSaveKey) {
        CKEDITOR.dialog.add('autosaveDialog', function() {
            return {
                title: editorInstance.lang.autosave.title,
                minHeight: 155,
                height: 300,
                width: 800,
                onShow: function() {
                    RenderDiff(this, editorInstance, autoSaveKey);
                },
                onOk: function() {
                    if (localStorage.getItem(autoSaveKey)) {
                        var jsonSavedContent = LoadData(autoSaveKey);
                        editorInstance.setData(jsonSavedContent.data);

                        RemoveStorage(autoSaveKey, editorInstance);
                    }
                },
                onCancel: function() {
                    RemoveStorage(autoSaveKey, editorInstance);
                },
                contents: [
                    {
                        label: '',
                        id: 'general',
                        elements: [
                            {
                                type: 'radio',
                                id: 'diffType',
                                label: editorInstance.lang.autosave.diffType,
                                items: [[editorInstance.lang.autosave.sideBySide, 'sideBySide'], [editorInstance.lang.autosave.inline, 'inline']],
                                'default': config.diffType,
                                onClick: function() {
                                    RenderDiff(this._.dialog, editorInstance, autoSaveKey);
                                }
                            }, {
                                type: 'html',
                                id: 'diffContent',
                                html: ''
                            }
                        ]
                    }
                ],
                buttons: [
                    {
                        id: 'ok',
                        type: 'button',
                        label: editorInstance.lang.autosave.ok,
                        'class': 'cke_dialog_ui_button_ok cke_dialog_autosave_ok',
                        onClick: function(evt) {
                            var dialog = evt.data.dialog;
                            if (dialog.fire('ok', { hide: true }).hide !== false)
                                dialog.hide();
                        }
                    },
                    {
                        id: 'cancel',
                        type: 'button',
                        label: editorInstance.lang.autosave.no,
                        'class': 'cke_dialog_ui_button_cancel',
                        onClick: function(evt) {
                            var dialog = evt.data.dialog;
                            if (dialog.fire('cancel', { hide: true }).hide !== false)
                                dialog.hide();
                        }
                    }
                ]
            };
        });
    }

    function CheckForAutoSavedContent(editorInstance, config, autoSaveKey, notOlderThen) {
        // Checks If there is data available and load it
        if (localStorage.getItem(autoSaveKey)) {
            var jsonSavedContent = LoadData(autoSaveKey);

            var autoSavedContent = jsonSavedContent.data;
            var autoSavedContentDate = jsonSavedContent.saveTime;

            var editorLoadedContent = editorInstance.getData();

            // check if the loaded editor content is the same as the autosaved content
            if (editorLoadedContent === autoSavedContent) {
                localStorage.removeItem(autoSaveKey);
                return;
            }

            // Ignore if autosaved content is older then x minutes
            if (moment(new Date()).diff(new Date(autoSavedContentDate), 'minutes') > notOlderThen) {
                RemoveStorage(autoSaveKey, editorInstance);

                return;
            }

            if (config.autoLoad) {
                if (localStorage.getItem(autoSaveKey)) {
                    editorInstance.setData(autoSavedContent);
                    RemoveStorage(autoSaveKey, editorInstance);
                }
            } else {
                var confirmMessage = editorInstance.lang.autosave.loadSavedContent.replace("{0}",
                    moment(autoSavedContentDate).locale(editorInstance.config.language)
                    .format(editorInstance.lang.autosave.dateFormat));

                _handleAutosaveConfirmationDialog(confirmMessage, editorInstance, autoSaveKey);

            }
        }
    }

    function _handleAutosaveConfirmationDialog(confirmMessage, editorInstance, autoSaveKey) {
        var autosaveModalId = 'autosaveModal';
        var autosaveMessageId = 'autosaveMessage';
        var autosaveModal = $('#' + autosaveModalId);
        if ( autosaveModal.length) {
            autosaveModal.find('#' + autosaveMessageId).html(confirmMessage);
        } else {
            var dialogDom = _createDialogDom(confirmMessage, autosaveModalId, autosaveMessageId );
            dialogDom.appendTo('body');
            autosaveModal = $('#' + autosaveModalId);
        }

        $('#autosave-confirm').unbind('click').click(function() {
            autosaveModal.css('display', 'none');
            var dialog = editorInstance.openDialog('autosaveDialog');
               var dialogDom = dialog.getElement()['$'];
               var contentDom = $(dialogDom).children(":first");
               contentDom.addClass('autosave');
        });
        $('#autosave-cancel').unbind('click').click(function() {
            RemoveStorage(autoSaveKey, editorInstance);
            autosaveModal.css('display', 'none');
        });
        autosaveModal.css('display', 'block');
    }

    function _createDialogDom(message, autosaveModalId, autosaveMessageId) {
        var dialogHtml =
           '<div id=\"'+ autosaveModalId + '\" class="modal autosave">\n' +
            '    <div class="modal-content autosave">\n' +
            '        <div class="modal-header">\n' +
            '            <h4>Recovered Version Found <a href="https://wiki.jpl.nasa.gov/display/opencae/View+Editor+User+Guide%3A+4+Autosave+to+the+browser%27s+localStorage" target="_blank"><i class="fa fa-info-circle" aria-hidden="true"></i></a></h4>\n' +
            '        </div>\n' +
            '        <div class="modal-body">\n' +
            '            <p id=\"'+ autosaveMessageId + '\"></p>\n' +
            '        </div>\n' +
            '        <div class="modal-footer">\n' +
            '                <button id="autosave-confirm" class="btn btn-primary">Review</button>\n' +
            '                <button id="autosave-cancel" class="btn btn-default">Discard</button>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '</div>';
        var dialogDom = $(dialogHtml);
        dialogDom.find('#' + autosaveMessageId).html(message);
        return dialogDom;
    }

    function LoadData(autoSaveKey) {
        var compressedJSON = LZString.decompressFromUTF16(localStorage.getItem(autoSaveKey));
        return JSON.parse(compressedJSON);
    }

    function SaveData(autoSaveKey, editorInstance, config) {

        var compressedJSON = LZString.compressToUTF16(JSON.stringify({ data: editorInstance.getData(), saveTime: new Date(), isAutosaveContent: true }));

        var quotaExceeded = _trySavingContentToLocalStorage(localStorage, moment, LZString, config.NotOlderThen, autoSaveKey, compressedJSON);
        /*
        if (quotaExceeded) {
            console.log(editorInstance.lang.autosave.localStorageFull);
            var notificationError = new CKEDITOR.plugins.notification(editorInstance, { message: editorInstance.lang.autosave.localStorageFull, type: 'warning',  duration:5000 });
            notificationError.show();
            _changeAutosavePopupStyle(editorInstance, notificationError);
        } else {
            var messageType = config.messageType != null ? config.messageType : "notification";

            if (editorInstance.plugins.wordcount && messageType == "statusbar") {
                messageType = "notification";
            }

            if (messageType == "statusbar") {
                var autoSaveMessage = document.getElementById(autoSaveMessageId(editorInstance));

                if (autoSaveMessage) {
                    autoSaveMessage.className = "show";

                    setTimeout(function () {
                        autoSaveMessage.className = "hidden";
                    }, 2000);
                }
            } else if (messageType == "notification") {
                var notification = new CKEDITOR.plugins.notification(editorInstance, { message: editorInstance.lang.autosave.autoSaveMessage, type: 'success',  duration:5000 });
                notification.show();
                _changeAutosavePopupStyle(editorInstance, notification);
            }
        }
        */
    }   

    function _changeAutosavePopupStyle(editorInstance, notification) {
        // Allow changing style for "autosave" popup
        var editorElement = $(editorInstance.container['$']);
        editorElement.css('position', 'relative');
        var autosavePopupElement = $('#' + notification.id);
        autosavePopupElement.appendTo(editorElement);
        autosavePopupElement.css({
            position: 'absolute'
        });
        autosavePopupElement.css({
            left: editorElement.outerWidth(true) - autosavePopupElement.outerWidth(true),
            top: editorElement.outerHeight(true) - autosavePopupElement.outerHeight(true)
        });
    }

    function RemoveStorage(autoSaveKey, editor) {
        if (editor.config.autosave_timeOutId) {
            clearTimeout(editor.config.autosave_timeOutId);
        }

        localStorage.removeItem(autoSaveKey);
    }

    function RenderDiff(dialog, editorInstance, autoSaveKey) {
        var jsonSavedContent = LoadData(autoSaveKey);

        var base = difflib.stringAsLines(editorInstance.getData());
        var newtxt = difflib.stringAsLines(jsonSavedContent.data);
        var sm = new difflib.SequenceMatcher(base, newtxt);
        var opcodes = sm.get_opcodes();

        dialog.getContentElement('general', 'diffContent').getElement().setHtml('<div class="diffContent">' + diffview.buildView({
            baseTextLines: base,
            newTextLines: newtxt,
            opcodes: opcodes,
            baseTextName: editorInstance.lang.autosave.loadedContent,
            newTextName: editorInstance.lang.autosave.autoSavedContent + (moment(jsonSavedContent.saveTime).locale(editorInstance.config.language).format(editorInstance.lang.autosave.dateFormat)) + '\'',
            contextSize: 3,
            viewType: dialog.getContentElement('general', 'diffType').getValue() == "inline" ? 1 : 0
        }).outerHTML + '</div>');
    }

    function isQuotaExceeded(e) {
        var quotaExceeded = false;
        if (e) {
            if (e.code) {
                switch (e.code) {
                    case 22:
                        quotaExceeded = true;
                        break;
                    case 1014:
                        // Firefox
                        if (e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                            quotaExceeded = true;
                        }
                        break;
                }
            } else if (e.number === -2147024882) {
                // Internet Explorer 8
                quotaExceeded = true;
            }
        }
        return quotaExceeded;
    }
    // Querystring mitigator - Quick and dirty paste.
    // I don't know who original author is for creds.
    // https://stackoverflow.com/a/11654436/2418655
    function autosaveRemoveUrlParam(key, value, url) {
        if (!url) url = window.location.href;
        var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi"),
            hash;

        if (re.test(url)) {
            if (typeof value !== 'undefined' && value !== null) {
                return url.replace(re, '$1' + key + "=" + value + '$2$3');
            } else {
                hash = url.split('#');
                url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
                if (typeof hash[1] !== 'undefined' && hash[1] !== null) {
                    url += '#' + hash[1];
                }
                return url;
            }
        } else {
            if (typeof value !== 'undefined' && value !== null) {
                var separator = url.indexOf('?') !== -1 ? '&' : '?';
                hash = url.split('#');
                url = hash[0] + separator + key + '=' + value;
                if (typeof hash[1] !== 'undefined' && hash[1] !== null) {
                    url += '#' + hash[1];
                }
                return url;
            } else {
                return url;
            }
        }
    }

    function _jsonParse(contentToParse) {
        try {
            var parseValue = JSON.parse(contentToParse.value);
            if (typeof parseValue === 'object' && parseValue !== null) {
                return {key: contentToParse.key, value: parseValue};
            }
        } catch(e) {}
        return {};
    }

    function _removeAllExpiredAutosave(localStorage, listOfExpiredAutosave) {
        listOfExpiredAutosave.forEach( function(expiredAutosave) {
            localStorage.removeItem(expiredAutosave.key);
        });
    }

    function _getAllExpiredAutosave(listOfAutosave, minutesTillExpired, currentDate, moment) {
        return listOfAutosave.filter(function( autosave) {
            return moment(currentDate).diff(new Date(autosave.value.saveTime), 'minutes') > minutesTillExpired;
        });
    }

    function _getAllAutosave(localStorage, LZString) {
        return Object.keys(localStorage)
            .map(function(autosaveKey) {
                return {
                    key: autosaveKey,
                    value: LZString.decompressFromUTF16(localStorage.getItem(autosaveKey))
                };
            })
            .map( _jsonParse )
            .filter( function(jsonObj) {return jsonObj.value && jsonObj.value.isAutosaveContent});
    }

    function _clearExpiredLocalStorageContents(localStorage, moment, LZString, minutesTillExpired) {
        var listOfAutosave = _getAllAutosave(localStorage, LZString);
        var listOfExpiredAutosave = _getAllExpiredAutosave(listOfAutosave, minutesTillExpired, new Date(), moment);
        _removeAllExpiredAutosave(localStorage, listOfExpiredAutosave);
    }

    function _trySavingContentToLocalStorage(localStorage, moment, LZString, minutesTillExpired, autosaveKey, compressedJSON) {
        var quotaExceeded = false;
        try {
            localStorage.setItem(autosaveKey, compressedJSON);
        } catch (e) {
            if (isQuotaExceeded(e)) {
                // need to use "customHelpers" at the front. If not, jasmine's spy wont work on this function
                // since it will be "_clearExpiredLocalStorageContents" in this local scope and not "_clearExpiredLocalStorageContents"
                // on "customHelpers" object where the spy is set
                customHelpers._clearExpiredLocalStorageContents(localStorage, moment, LZString, minutesTillExpired);
                try {
                  localStorage.setItem(autosaveKey, compressedJSON);
                } catch (e) {
                  quotaExceeded = true;
                }
            }
        }
        return quotaExceeded;
    }

    var customHelpers = {
        _jsonParse: _jsonParse,
        _removeExpiredAutosave: _removeAllExpiredAutosave,
        _getAllExpiredAutosave: _getAllExpiredAutosave,
        _getAllAutosave: _getAllAutosave,
        _clearExpiredLocalStorageContents: _clearExpiredLocalStorageContents,
        _trySavingContentToLocalStorage: _trySavingContentToLocalStorage
    };
    return customHelpers;
})();
