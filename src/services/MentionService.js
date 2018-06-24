'use strict';

angular.module('mms')
    .factory('MentionService', ['$rootScope', '$compile', 'CacheService', MentionService]);

function MentionService($rootScope, $compile, CacheService) {
    /** Used to maintain all mention in all ckeditors **/
    var mentions = {};
    var mentionId = 1;
    var mentionPlacerHolderPrefix = 'mentionPlaceHolder';

    return {
        getFastCfListing: getFastCfListing,
        createMention: createMention,
        handleInput: handleInput,
        handleMentionSelection: handleMentionSelection
    };

    function getFastCfListing(projectId, refId) {
        var cfListing = [];
        var cacheElements = CacheService.getLatestElements(projectId, refId);
        cacheElements.forEach(function(cacheElement) {
            cfListing.push({ 'id' : cacheElement.id, 'name' : cacheElement.name , 'type': ' - name' });
            cfListing.push({ 'id' : cacheElement.id, 'name' : cacheElement.name , 'type': ' - documentation' });
            if (cacheElement.type === 'Property') {
                cfListing.push({ 'id' : cacheElement.id, 'name' : cacheElement.name , 'type': ' - value' });
            }
        });
        return cfListing;
    }

    function createMention(editor, projectId, refId) {
        var mentionId = _getNewMentionId();
        var mentionPlaceHolderId = _createMentionPlaceHolder(editor, mentionId);
        var mention = _createMentionDirective(editor, mentionId, projectId, refId);
        _createNewMentionState(editor, mention, mentionPlaceHolderId, mentionId);
        _positionMentionElement(editor, mention.element, mentionPlaceHolderId);
    }

    function handleInput(event, editor) {
        var currentEditingElement = editor._.elementsPath.list[0].$;
        var currentEditingElementId = currentEditingElement.getAttribute('id');
        var mentionId = _getMentionPlaceHolderData(currentEditingElementId);
        if (mentionId) {
            var mentionState = _retrieveMentionState(editor.id, mentionId);
            var mentionScope = mentionState.mentionScope;
            mentionScope.$apply(function() {
                var text = currentEditingElement.innerText;
                text = text.substring(1); // ignore @
                mentionScope.mmsMentionValue = text;
            });
        }
    }

    function handleMentionSelection(editor, mentionId) {
        var mentionState = _retrieveMentionState(editor.id, mentionId);
        var mentionPlaceHolderId = mentionState.mentionPlaceHolderId;
        var ckeditorDocument = _getCkeditorFrame(editor).contentDocument;
        // remove the mentionPlaceHolder
        ckeditorDocument.getElementById(mentionPlaceHolderId).remove();
        // remove the mention directive
        var mentionScope = mentionState.mentionScope;
        mentionScope.$destroy();
        // remove the mention dom
        var mentionElement = mentionState.mentionElement;
        mentionElement.remove();
        // remove the mention state
        delete mentions[_getMentionStateId(editor.id, mentionId)];
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

    function _getNewMentionId() {
        return mentionId++;
    }

    function _getMentionPlaceHolderData(id) {
        if (id && id.indexOf('mentionPlacerHolderPrefix')) {
            var splits = id.split('-');
            var mentionId = splits[2];
            return mentionId;
        }
        return null;
    }
}
