'use strict';

angular.module('mms')
    .factory('MentionService', ['$rootScope', '$compile', 'CacheService', MentionService]);

function MentionService($rootScope, $compile, CacheService) {
    /** Used to maintain all mention in all ckeditors **/
    var mentions = {};
    var mentionPlacerHolderPrefix = 'mentionPlaceHolder';

    return {
        getFastCfListing: getFastCfListing,
        createMention: createMention,
        handleInput: handleInput,
        handleMentionSelection: handleMentionSelection,
        removeAllMentionForEditor: removeAllMentionForEditor,
        hasMentionResults: hasMentionResults
    };

    function getFastCfListing(projectId, refId) {
        return CacheService.getLatestElements(projectId, refId).reduce(function(result, cacheElement) {
            result.push({ id : cacheElement.id, name : cacheElement.name , type: 'name', label: cacheElement.name + ' - name' });
            result.push({ id : cacheElement.id, name : cacheElement.name , type: 'doc', label: cacheElement.name + ' - documentation' });
            if (cacheElement.type === 'Property') {
                result.push({ id : cacheElement.id, name : cacheElement.name , type: 'val', label: cacheElement.name + ' - value' });
            }
            return result;
        }, []);
    }

    function createMention(editor, projectId, refId, existingMentionPlaceHolder) {
        var mentionId = existingMentionPlaceHolder ? existingMentionPlaceHolder.mentionId : _getNewMentionId();
        var mentionPlaceHolderId = existingMentionPlaceHolder ? existingMentionPlaceHolder.mentionPlaceHolderId : _createMentionPlaceHolder(editor, mentionId);
        var mention = _createMentionDirective(editor, mentionId, projectId, refId);
        _createNewMentionState(editor, mention, mentionPlaceHolderId, mentionId);
        _positionMentionElement(editor, mention.element, mentionPlaceHolderId);
    }

    function handleInput(event, editor, projectId, refId) {
        var currentEditingElement = editor._.elementsPath.list[0].$;
        var currentEditingElementId = currentEditingElement.getAttribute('id');
        var mentionId = _getMentionIdFromMentionPlaceHolder(currentEditingElementId);
        if (mentionId) {
            var mentionState = _retrieveMentionState(editor.id, mentionId);
            // logic to reactivate existing "@" when reloading ckeditor
            if (!mentionState) {
                createMention(editor, projectId, refId, { mentionId: mentionId, mentionPlaceHolderId: currentEditingElementId} );
                mentionState = _retrieveMentionState(editor.id, mentionId);
            }

            var mentionScope = mentionState.mentionScope;
            mentionScope.$apply(function() {
                var text = currentEditingElement.innerText;
                text = text.substring(1); // ignore @
                mentionScope.mmsMentionValue = text;
            });

            _handleSpecialKeys(event, mentionId, editor, projectId, refId);
        }
    }

    function handleMentionSelection(editor, mentionId) {
        _cleanup(editor, mentionId);
    }

    function removeAllMentionForEditor(editor) {
        Object.keys(mentions).filter(function(key) {
            var splits = key.split('-');
            return splits[0] === editor.id;
        }).forEach(function(key) {
            _cleanup(editor, key.split('-')[1]);
        });
    }

    function hasMentionResults(editor) {
        var currentEditingElement = editor._.elementsPath.list[0].$;
        var currentEditingElementId = currentEditingElement.getAttribute('id');
        var mentionId = _getMentionIdFromMentionPlaceHolder(currentEditingElementId);
        if (mentionId) {
            return _hasMentionResults(mentionId);
        }
        return false;
    }

    function _hasMentionResults(mentionId) {
        return $('#' + mentionId).find('ul').children().length > 0;
    }

    function _createMentionDirective(editor, mentionId, projectId, refId) {
        var newScope = Object.assign($rootScope.$new(),
            {
                mmsEditor: editor,
                mmsMentionValue: '',
                mmsMentionId: mentionId,
                mmsProjectId: projectId,
                mmsRefId: refId
            });
        var element = $compile('<span mms-mention mms-editor="mmsEditor" mms-mention-value="mmsMentionValue" mms-mention-id="mmsMentionId" mms-project-id="mmsProjectId" mms-ref-id="mmsRefId"></span>')(newScope);
        return {
            scope: newScope,
            controller: element.controller('mms-mention'),
            element: element
        };
    }

    function _getCkeditorFrame(editor) {
        return editor.container.$.getElementsByTagName('iframe')[0];
    }
    
    function _positionMentionElement(editor, mentionElement, mentionPlaceHolderId) {
        var ckeditorFrame = _getCkeditorFrame(editor);
        var box = ckeditorFrame.getBoundingClientRect();
        var mentionPlaceHolder = ckeditorFrame.contentDocument.getElementById(mentionPlaceHolderId);
        var offset = $(mentionPlaceHolder).offset();
        mentionElement.css({position: 'absolute', top: box.top + offset.top + 30, left: box.left + offset.left});
        $('body').append(mentionElement);
    }

    function _createNewMentionState(editor, mention, mentionPlaceHolderId, mentionId) {
        var key = _getMentionStateId(editor.id, mentionId);
        var value = {
            mentionScope: mention.scope,
            mentionController: mention.controller,
            mentionElement: mention.element,
            mentionId: mentionId,
            mentionPlaceHolderId: mentionPlaceHolderId
        };
        mentions[key] = value;
        return value;
    }

    function _retrieveMentionState(editorId, mentionId) {
        return mentions[_getMentionStateId(editorId, mentionId)];
    }

    function _getMentionStateId(editorId, mentionId) {
        return editorId + '-' + mentionId;
    }

    function _createMentionPlaceHolder(editor, mentionId) {
        var id = mentionPlacerHolderPrefix + '-' + editor.id + '-' + mentionId;
        var mentionPlaceHolder = '<span id="' + id + '">@</span>';
        editor.insertHtml(mentionPlaceHolder);
        return id;
    }

    // Generate unique id
    function _getNewMentionId() {
        function chr4(){
            return Math.random().toString(16).slice(-4);
        }
        return chr4() + chr4() + chr4() + chr4() + chr4() + chr4() + chr4() + chr4();
    }

    function _getMentionIdFromMentionPlaceHolder(currentEditingElementId) {
        if (currentEditingElementId && currentEditingElementId.indexOf(mentionPlacerHolderPrefix) > -1) {
            var splits = currentEditingElementId.split('-');
            var mentionId = splits[2];
            return mentionId;
        }
        return null;
    }

    function _cleanup(editor, mentionId) {
        var mentionState = _retrieveMentionState(editor.id, mentionId);
        var mentionPlaceHolderId = mentionState.mentionPlaceHolderId;
        var ckeditorDocument = _getCkeditorFrame(editor).contentDocument;
        // remove the mentionPlaceHolder
        ckeditorDocument.getElementById(mentionPlaceHolderId).remove();
        // cleanup the mention directive
        var mentionScope = mentionState.mentionScope;
        mentionScope.$destroy();
        // remove the mention dom
        var mentionElement = mentionState.mentionElement;
        mentionElement.remove();
        // remove the mention state
        delete mentions[_getMentionStateId(editor.id, mentionId)];
    }

    function _handleSpecialKeys(evt, mentionId, editor, projectId, refId) {
        switch (evt.data.$.which) {
            case 38: // up arrow
                _handleArrowKey(mentionId, false);
                break;
            case 40: // down arrow
                _handleArrowKey(mentionId, true);
                break;
            case 13: // enter
                _handleEnterKey(editor.id, mentionId, projectId, refId);
                break;
        }
    }

    function _getMentionItem(key, projectId, refId) {
        var cfListing = getFastCfListing(projectId, refId);
        return cfListing.find(function(cf) {
            return cf.label === key;
        });
    }

    function _handleEnterKey(editorId, mentionId, projectId, refId) {
        var currentMentionMatchDom = $('#' + mentionId).find('ul').children().filter(function() {
            return $(this).hasClass('active');
        });

        if (currentMentionMatchDom.length > 0) {
            var key = currentMentionMatchDom.text().trim();
            var mentionItem = _getMentionItem(key, projectId, refId);
            var mentionState = _retrieveMentionState(editorId, mentionId);
            mentionState.mentionController.autocompleteOnSelect(mentionItem);
        }
    }

    function _handleArrowKey(mentionId, isDownArrow) {
        var popUpEl = $('#' + mentionId);
        var allOptions = popUpEl.find('li');
        var len = allOptions.length;
        var activeIndex = -1;
        allOptions.each(function(index) {
            if ($(this).hasClass('active')) {
                activeIndex = index;
            }
        });
        if (activeIndex !== -1) {
            var nextIndex;
            if (isDownArrow) {
                nextIndex = (activeIndex + 1) % len;
            } else {
                if (activeIndex === 0 ) {
                    nextIndex = len - 1;
                } else {
                    nextIndex = (activeIndex - 1) % len;
                }
            }
            var target = $(allOptions[nextIndex]);
            target.addClass('active');
            $(allOptions[activeIndex]).removeClass('active');
            // scroll if necessary
            target[0].parentNode.scrollTop = target[0].offsetTop;
        }
    }
}
