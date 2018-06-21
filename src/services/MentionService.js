'use strict';

angular.module('mms')
    .factory('MentionService', ['$rootScope', '$compile', 'CacheService', MentionService]);

function MentionService($rootScope, $compile, CacheService) {
    /** Used to maintain all mention in all ckeditors **/
    var mentions = {};
    var mentionId = 1;

    return {
        getFastCfListing: getFastCfListing,
        createMention: createMention,
        handleMentionSelection: handleMentionSelection,
        handleInput: handleInput
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

    function handleMentionSelection(editor, mentionId) {
        // remove the mentionPlaceHolder
        // remove the mention state
        // remove the mention directive/dom

        // $('#' + $scope.id).remove();
        // var iframe = $($('iframe')[0]);
        // iframe.contents().find('#hong007').remove();
    }

    function handleInput(editor, mentionId, newValue) {
        var mentionState = _retrieveMentionState(editor.id, mentionId);
        var mentionScope = mentionState.scope;
        mentionScope.$apply(function() {
            mentionScope.mmsMentionValue = newValue;
        });
    }

    function _getNewMentionId() {
        return ++mentionId;
    }


    /** Create the mention directive and it state **/
    function createMention(editor) {
        var mentionId = _getNewMentionId();
        var mentionPlaceHolderId = _createMentionPlaceHolder(editor, mentionId);
        var mention = _createMentionDirective(editor, mentionId);
        _createNewMentionState(editor, mention.scope, mentionPlaceHolderId, mentionId);
        _positionMentionElement(editor, mention.element, mentionPlaceHolderId);
        _bumpMentionId();
    }

    function _createMentionDirective(editor, mentionId) {
        var newScope = Object.assign($rootScope.$new(), { mmsEditor: editor, mmsMentionValue: '', mmsMentionId: mentionId, mmsDone: function() { newScope.$destroy(); } });
        var element = $compile('<span mms-mention mms-editor="mmsEditor" mms-mention-value="mmsMentionValue" mms-mention-id="mmsMentionId" mms-done="mmsDone"></span>')(newScope);
        return {
            scope: newScope,
            element: element
        };
    }
    
    function _positionMentionElement(editor, mentionElement, mentionPlaceHolderId) {
        var ckeditorBodyDom = editor.container.$.getElementsByTagName('iframe')[0];
        var box = ckeditorBodyDom.getBoundingClientRect();
        var mentionPlaceHolder = $(ckeditorBodyDom).contents().find('#' + mentionPlaceHolderId);
        var offset = mentionPlaceHolder.offset();
        mentionElement.css({position: 'absolute', top: box.top + offset.top + 30, left: box.left + offset.left});
        $('body').append(mentionElement);
    }

    /** Add a new state to track new @ **/
    function _createNewMentionState(editor, mentionScope, mentionPlaceHolderId, mentionId) {
        var key = _getMentionStateId(editor.id, mentionId);
        var value = {
            mentionScope: mentionScope,
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
        var id = 'mentionPlaceHolder-' + editor.id + '-' + mentionId;
        var mentionPlaceHolder = '<span id="' + id + '">@</span>';
        editor.insertHtml(mentionPlaceHolder);
        return id;
    }

    function _bumpMentionId() {
        mentionId++;
    }
}
