import angular from "angular";
import $ from "jquery";
import moment from "moment";
import {ViewService} from "../../ve-utils/services/View.service";
import {UtilsService} from "../../ve-utils/services/Utils.service";
import {CacheService} from "../../ve-utils/services/Cache.service";
import {veExt} from "../../ve-extensions/ve-extensions.module";
import {ElementObject} from "../../ve-utils/types/mms";
var veUtils = angular.module('veUtils');

export interface MentionScope extends angular.IScope {
    mmsEditor?: any;
    mmsMentionValue?: string,
    mmsMentionId?: string,
    mmsProjectId?: string,
    mmsRefId?: string
}

export class MentionService {

    mentions = {};
    mentionPlacerHolderPrefix = 'mentionPlaceHolder';

    static $inject = ['$compile', '$timeout', 'CacheService', 'ViewService', 'UtilsService'];

    constructor(private $compile: angular.ICompileService, private $timeout: angular.ITimeoutService,
                private cacheSvc : CacheService, private viewSvc : ViewService, private utilsSvc : UtilsService) {}
    /** Used to maintain all mention in all ckeditors **/

    

    public getFastCfListing(projectId, refId): ElementObject[] {
        let latestElements: ElementObject[] = this.cacheSvc.getLatestElements(projectId, refId);

        latestElements.reduce((result: {id: string, name: string, type: string, iconClass: string,
            documentation?: string, editor: string, editTime: string, elementType: string, value?: string}[], cacheElement) => {
            let elementType = this.viewSvc.getElementType(cacheElement);
            let elementName = (cacheElement.name) ? cacheElement.name: cacheElement.id
            var iconClass = this.utilsSvc.getElementTypeClass(cacheElement, elementType);
            result.push({id: cacheElement.id, name: elementName, type: 'name',
                iconClass: iconClass, documentation: cacheElement.documentation || 'no text',
                editor: cacheElement._modifier, editTime: moment(cacheElement._modified).fromNow(),
                elementType: (elementType) ? elementType : cacheElement.type
            });
            if (cacheElement.documentation != undefined) {
                result.push({id: cacheElement.id, name: elementName, type: 'doc',
                    iconClass: iconClass, documentation: cacheElement.documentation || 'no text',
                    editor: cacheElement._modifier, editTime: moment(cacheElement._modified).fromNow(),
                    elementType: elementType || cacheElement.type
                });
            }

            if (cacheElement.type === 'Property' && cacheElement.defaultValue) {
                var value = String(cacheElement.defaultValue.value);
                if (!value || value === 'undefined') {
                    value = 'this field is empty';
                }
                result.push({id: cacheElement.id, name: elementName, type: 'val',
                    iconClass: iconClass, value: value,
                    editor: cacheElement._modifier, editTime: moment(cacheElement._modified).fromNow(),
                    elementType: cacheElement.type
                });
            }
            return result;
        }, []);
        return latestElements;
    }

    public createMention(editor, mentionScope: angular.IScope, projectId, refId, existingMentionPlaceHolder?) {
        var mentionId = existingMentionPlaceHolder ? existingMentionPlaceHolder.mentionId : this._getNewMentionId();
        var mentionPlaceHolderId = existingMentionPlaceHolder ? existingMentionPlaceHolder.mentionPlaceHolderId : this._createMentionPlaceHolder(editor, mentionId);
        var mention = this._createMentionDirective(editor, mentionScope, mentionId, projectId, refId);
        this._createNewMentionState(editor, mention, mentionPlaceHolderId, mentionId);
        MentionService._positionMentionElement(editor, mention, mentionPlaceHolderId);
    }

    public handleInput(event, editor, projectId, refId) {
        var currentEditingElement = editor._.elementsPath.list[0].$;
        var currentEditingElementId = currentEditingElement.getAttribute('id');
        var mentionId = this._getMentionIdFromMentionPlaceHolder(currentEditingElementId);
        if (mentionId) {
            var mentionState = this._retrieveMentionState(editor.id, mentionId);
            // logic to reactivate existing "@" when reloading ckeditor
            if (!mentionState) {
                this.createMention(editor, projectId, refId, { mentionId: mentionId, mentionPlaceHolderId: currentEditingElementId} );
                mentionState = this._retrieveMentionState(editor.id, mentionId);
            }

            var mentionScope = mentionState.mentionScope;
            mentionScope.$apply(() => {
                var text = currentEditingElement.innerText;
                text = text.substring(1); // ignore @
                mentionScope.mmsMentionValue = text;
                this._repositionDropdownIfOffScreen(editor, mentionState);
            });

            this._handleSpecialKeys(event, mentionId, editor, projectId, refId);
        }
    }

    public handleMentionSelection(editor, mentionId) {
        this._cleanup(editor, mentionId);
    }

    public removeAllMentionForEditor(editor) {
        Object.keys(this.mentions).filter((key) => {
            var splits = key.split('-');
            return splits[0] === editor.id;
        }).forEach((key) => {
            this._cleanup(editor, key.split('-')[1]);
        });
    }

    public hasMentionResults(editor) {
        var currentEditingElement = editor._.elementsPath.list[0].$;
        var currentEditingElementId = currentEditingElement.getAttribute('id');
        var mentionId = this._getMentionIdFromMentionPlaceHolder(currentEditingElementId);
        if (mentionId) {
            return MentionService._hasMentionResults(mentionId);
        }
        return false;
    }

    private static _hasMentionResults(mentionId) {
        return $('#' + mentionId).find('ul').children().length > 0;
    }

    private _createMentionDirective(editor, mentionScope: MentionScope, mentionId, projectId, refId) {
        mentionScope.mmsEditor = editor;
        mentionScope.mmsMentionValue = '';
            mentionScope.mmsMentionId = mentionId;
            mentionScope.mmsProjectId = projectId;
            mentionScope.mmsRefId = refId;
        return this.$compile('<mention mms-editor="mmsEditor" mms-mention-value="mmsMentionValue" mms-mention-id="mmsMentionId" mms-project-id="mmsProjectId" mms-ref-id="mmsRefId"></mention>')(mentionScope);
    }

    private static _getCkeditorFrame(editor) {
        return editor.container.$.getElementsByTagName('iframe')[0];
    }
    
    private static _positionMentionElement(editor, mentionElement, mentionPlaceHolderId) {
        var ckeditorFrame = MentionService._getCkeditorFrame(editor);
        var ckeditorBox = ckeditorFrame.getBoundingClientRect();
        var mentionPlaceHolder = ckeditorFrame.contentDocument.getElementById(mentionPlaceHolderId);
        var mentionPlaceHolderBox = $(mentionPlaceHolder)[0].getBoundingClientRect();
        mentionElement.css({
            position: 'absolute',
            top: ckeditorBox.top + mentionPlaceHolderBox.top + 30,
            left: ckeditorBox.left + mentionPlaceHolderBox.left
        });
        $('body').append(mentionElement);
    }

    private _createNewMentionState(editor, mention, mentionPlaceHolderId, mentionId) {
        var key = MentionService._getMentionStateId(editor.id, mentionId);
        var value = {
            mentionScope: mention.scope,
            mentionController: mention.controller,
            mentionElement: mention.element,
            mentionId: mentionId,
            mentionPlaceHolderId: mentionPlaceHolderId
        };
        this.mentions[key] = value;
        return value;
    }

    private _retrieveMentionState(editorId, mentionId) {
        return this.mentions[MentionService._getMentionStateId(editorId, mentionId)];
    }

    private static _getMentionStateId(editorId, mentionId) {
        return editorId + '-' + mentionId;
    }

    private _createMentionPlaceHolder(editor, mentionId) {
        var id = this.mentionPlacerHolderPrefix + '-' + editor.id + '-' + mentionId;
        var mentionPlaceHolder = '<span id="' + id + '">@</span>';
        editor.insertHtml(mentionPlaceHolder);
        return id;
    }

    // Generate unique id
    private _getNewMentionId() {
        function chr4(){
            return Math.random().toString(16).slice(-4);
        }
        return chr4() + chr4() + chr4() + chr4() + chr4() + chr4() + chr4() + chr4();
    }

    private _getMentionIdFromMentionPlaceHolder(currentEditingElementId) {
        if (currentEditingElementId && currentEditingElementId.indexOf(this.mentionPlacerHolderPrefix) > -1) {
            var splits = currentEditingElementId.split('-');
            var mentionId = splits[2];
            return mentionId;
        }
        return null;
    }

    private _cleanup(editor, mentionId, unwrapOnly?) {
        var mentionState = this._retrieveMentionState(editor.id, mentionId);
        var mentionPlaceHolderId = mentionState.mentionPlaceHolderId;
        var mentionPlaceHolderDom = editor.document.getById(mentionPlaceHolderId); 
        if (unwrapOnly) {
            var range = editor.createRange();
            if (range && mentionPlaceHolderDom) {
                range.moveToClosestEditablePosition(mentionPlaceHolderDom, true);
                $(mentionPlaceHolderDom.$).contents().unwrap();
                range.select();
            }
        } else {
            // remove the mentionPlaceHolder
            mentionPlaceHolderDom.remove();
        }
        // cleanup the mention directive
        var mentionScope = mentionState.mentionScope;
        mentionScope.$destroy();
        // remove the mention dom
        var mentionElement = mentionState.mentionElement;
        mentionElement.remove();
        // remove the mention state
        delete this.mentions[MentionService._getMentionStateId(editor.id, mentionId)];
    }

    private _handleSpecialKeys(evt, mentionId, editor, projectId, refId) {
        switch (evt.data.$.which) {
            case 38: // up arrow
                this._handleArrowKey(mentionId, false);
                break;
            case 40: // down arrow
                this._handleArrowKey(mentionId, true);
                break;
            case 13: // enter
                this._handleEnterKey(editor.id, mentionId, projectId, refId);
                break;
            case 27: // esc
                this._handleEscKey(editor, mentionId);
        }
    }

    private _getMentionItem(key, projectId, refId) {
        var cfListing = this.getFastCfListing(projectId, refId);
        return cfListing.find((cf) => {
            return (cf.id + cf.type) === key;
        });
    }

    private _handleEnterKey(editorId, mentionId, projectId, refId) {
        var matchDom = $('#' + mentionId + ' .active .mentionMatch');
        if (matchDom.length > 0) {
            var key = matchDom.attr('id');
            var mentionItem = this._getMentionItem(key, projectId, refId);
            var mentionState = this._retrieveMentionState(editorId, mentionId);
            mentionState.mentionController.selectMentionItem(mentionItem);
        }
    }
    
    private _handleEscKey(editor, mentionId) {
        this._cleanup(editor, mentionId, true);
    }

    private _handleArrowKey(mentionId, isDownArrow) {
        var popUpEl = $('#' + mentionId);
        var allOptions = popUpEl.find('li');
        var len = allOptions.length;
        var activeIndex = -1;
        allOptions.each((index) => {
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
            (<Element>target[0].parentNode).scrollTop = target[0].offsetTop;
        }
    }

    private _repositionDropdownIfOffScreen(editor, mentionState) {
        // wait for dropdown result to render so that we can determine whether it is on/off-screen
        this.$timeout(() => {
            var mentionElement = mentionState.mentionElement;
            var dropdownResultElement = mentionElement.find('ul.dropdown-menu');
            if (dropdownResultElement.children().length > 0 && !dropdownResultElement.isOnScreen()) {
                var ckeditorBox = MentionService._getCkeditorFrame(editor).getBoundingClientRect();
                mentionElement.css({
                    top: ckeditorBox.top,
                    left: ckeditorBox.left
                });
            }
        }, 0, false);

    }
}

veExt.service('MentionService', MentionService);
