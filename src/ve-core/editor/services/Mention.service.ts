import $ from 'jquery';
import moment from 'moment';

import { MMSMentionController } from '@ve-core/editor/components/mention.component';
import { UtilsService } from '@ve-utils/application';
import { CacheService } from '@ve-utils/core';
import { ApiService, ViewService } from '@ve-utils/mms-api-client';

import { veCore } from '@ve-core';

import { ElementObject } from '@ve-types/mms';

export interface MentionScope extends angular.IScope {
    mmsEditor?: CKEDITOR.editor;
    mmsMentionValue?: string;
    mmsMentionId?: string;
    mmsProjectId?: string;
    mmsRefId?: string;
}

export interface MentionState {
    mentionScope: MentionScope;
    mentionController: MMSMentionController;
    mentionElement: JQLite;
    mentionId: string;
    mentionPlaceHolderId: string;
}

export class MentionService {
    mentions: { [id: string]: MentionState } = {};
    mentionPlacerHolderPrefix = 'mentionPlaceHolder';

    static $inject = ['$compile', '$timeout', 'growl', 'CacheService', 'ViewService', 'UtilsService', 'ApiService'];

    constructor(
        private $compile: angular.ICompileService,
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService,
        private cacheSvc: CacheService,
        private viewSvc: ViewService,
        private utilsSvc: UtilsService,
        private apiSvc: ApiService
    ) {}
    /** Used to maintain all mention in all ckeditors **/

    public getFastCfListing(projectId: string, refId: string): ElementObject[] {
        const latestElements: ElementObject[] = this.cacheSvc.getLatestElements<ElementObject>(projectId, refId);

        latestElements.reduce(
            (
                result: {
                    id: string;
                    name: string;
                    type: string;
                    iconClass: string;
                    documentation?: string;
                    editor: string;
                    editTime: string;
                    elementType: string;
                    value?: string;
                }[],
                cacheElement
            ) => {
                const elementType = this.viewSvc.getElementType(cacheElement);
                const elementName = cacheElement.name ? cacheElement.name : cacheElement.id;
                const iconClass = this.utilsSvc.getElementTypeClass(cacheElement, elementType);
                result.push({
                    id: cacheElement.id,
                    name: elementName,
                    type: 'name',
                    iconClass: iconClass,
                    documentation: cacheElement.documentation || 'no text',
                    editor: cacheElement._modifier,
                    editTime: moment(cacheElement._modified).fromNow(),
                    elementType: elementType ? elementType : cacheElement.type,
                });
                if (cacheElement.documentation != undefined) {
                    result.push({
                        id: cacheElement.id,
                        name: elementName,
                        type: 'doc',
                        iconClass: iconClass,
                        documentation: cacheElement.documentation || 'no text',
                        editor: cacheElement._modifier,
                        editTime: moment(cacheElement._modified).fromNow(),
                        elementType: elementType || cacheElement.type,
                    });
                }

                if (cacheElement.type === 'Property' && cacheElement.defaultValue) {
                    let value = String(cacheElement.defaultValue.value);
                    if (!value || value === 'undefined') {
                        value = 'this field is empty';
                    }
                    result.push({
                        id: cacheElement.id,
                        name: elementName,
                        type: 'val',
                        iconClass: iconClass,
                        value: value,
                        editor: cacheElement._modifier,
                        editTime: moment(cacheElement._modified).fromNow(),
                        elementType: cacheElement.type,
                    });
                }
                return result;
            },
            []
        );
        return latestElements;
    }

    public createMention(
        editor: CKEDITOR.editor,
        mentionScope: MentionScope,
        projectId: string,
        refId: string,
        existingMentionPlaceHolder?: {
            mentionId: string;
            mentionPlaceHolderId: string;
        }
    ): void {
        const mentionId = existingMentionPlaceHolder ? existingMentionPlaceHolder.mentionId : this.apiSvc.createUUID();
        const mentionPlaceHolderId = existingMentionPlaceHolder
            ? existingMentionPlaceHolder.mentionPlaceHolderId
            : this._createMentionPlaceHolder(editor, mentionId);
        const mention = this._createMentionDirective(editor, mentionScope, mentionId, projectId, refId);
        this._createNewMentionState(editor, mention, mentionPlaceHolderId, mentionId);
        MentionService._positionMentionElement(editor, mention, mentionPlaceHolderId);
    }

    public handleInput(
        event: CKEDITOR.eventInfo<CKEDITOR.dom.event<KeyboardEvent>>,
        newScope: MentionScope,
        editor: CKEDITOR.editor,
        projectId: string,
        refId: string
    ): void {
        if (editor._ && editor._.elementsPath) {
            const elementsPath = editor._.elementsPath;
            const currentEditingElement = elementsPath.list[0].$;
            const currentEditingElementId = currentEditingElement.getAttribute('id');
            const mentionId = this._getMentionIdFromMentionPlaceHolder(currentEditingElementId);
            if (mentionId) {
                let mentionState = this._retrieveMentionState(editor.id, mentionId);
                // logic to reactivate existing "@" when reloading ckeditor
                if (!mentionState) {
                    this.createMention(editor, newScope, projectId, refId, {
                        mentionId: mentionId,
                        mentionPlaceHolderId: currentEditingElementId,
                    });
                    mentionState = this._retrieveMentionState(editor.id, mentionId);
                }

                const mentionScope = mentionState.mentionScope;
                mentionScope.$apply(() => {
                    let text = currentEditingElement.innerText;
                    text = text.substring(1); // ignore @
                    mentionScope.mmsMentionValue = text;
                    this._repositionDropdownIfOffScreen(editor, mentionState);
                });

                this._handleSpecialKeys(event, mentionId, editor, projectId, refId);
            }
        }
    }

    public handleMentionSelection(editor: CKEDITOR.editor, mentionId: string): void {
        this._cleanup(editor, mentionId);
    }

    public removeAllMentionForEditor(editor: CKEDITOR.editor): void {
        Object.keys(this.mentions)
            .filter((key) => {
                const splits = key.split('-');
                return splits[0] === editor.id;
            })
            .forEach((key) => {
                this._cleanup(editor, key.split('-')[1]);
            });
    }

    public hasMentionResults(editor: CKEDITOR.editor): boolean {
        const currentEditingElement = editor._.elementsPath.list[0].$;
        const currentEditingElementId = currentEditingElement.getAttribute('id');
        const mentionId = this._getMentionIdFromMentionPlaceHolder(currentEditingElementId);
        if (mentionId) {
            return MentionService._hasMentionResults(mentionId);
        }
        return false;
    }

    private static _hasMentionResults(mentionId: string): boolean {
        return (
            $('#' + mentionId)
                .find('ul')
                .children().length > 0
        );
    }

    private _createMentionDirective(
        editor: CKEDITOR.editor,
        mentionScope: MentionScope,
        mentionId: string,
        projectId: string,
        refId: string
    ): JQLite {
        mentionScope.mmsEditor = editor;
        mentionScope.mmsMentionValue = '';
        mentionScope.mmsMentionId = mentionId;
        mentionScope.mmsProjectId = projectId;
        mentionScope.mmsRefId = refId;
        return this.$compile(
            '<mention mms-editor="mmsEditor" mms-mention-value="mmsMentionValue" mms-mention-id="mmsMentionId" mms-project-id="mmsProjectId" mms-ref-id="mmsRefId"></mention>'
        )(mentionScope);
    }

    private static _getCkeditorFrame(editor: CKEDITOR.editor): HTMLIFrameElement {
        return editor.container.$.getElementsByTagName('iframe')[0];
    }

    private static _positionMentionElement(
        editor: CKEDITOR.editor,
        mentionElement: JQLite,
        mentionPlaceHolderId: string
    ): void {
        const ckeditorFrame = MentionService._getCkeditorFrame(editor);
        const ckeditorBox = ckeditorFrame.getBoundingClientRect();
        const mentionPlaceHolder = ckeditorFrame.contentDocument.getElementById(mentionPlaceHolderId);
        const mentionPlaceHolderBox = $(mentionPlaceHolder)[0].getBoundingClientRect();
        mentionElement.css({
            position: 'absolute',
            top: ckeditorBox.top + mentionPlaceHolderBox.top + 30,
            left: ckeditorBox.left + mentionPlaceHolderBox.left,
        });
        $('body').append(mentionElement);
    }

    private _createNewMentionState(
        editor: CKEDITOR.editor,
        mention: JQLite,
        mentionPlaceHolderId: string,
        mentionId: string
    ): MentionState {
        const key = MentionService._getMentionStateId(editor.id, mentionId);
        const value: MentionState = {
            mentionScope: mention.scope<MentionScope>(),
            mentionController: mention.controller() as MMSMentionController,
            mentionElement: mention,
            mentionId: mentionId,
            mentionPlaceHolderId: mentionPlaceHolderId,
        };
        this.mentions[key] = value;
        return value;
    }

    private _retrieveMentionState = (editorId: string, mentionId: string): MentionState => {
        return this.mentions[MentionService._getMentionStateId(editorId, mentionId)];
    };

    private static _getMentionStateId(editorId: string, mentionId: string): string {
        return editorId + '-' + mentionId;
    }

    private _createMentionPlaceHolder(editor: CKEDITOR.editor, mentionId: string): string {
        const id = this.mentionPlacerHolderPrefix + '-' + editor.id + '-' + mentionId;
        const mentionPlaceHolder = '<span id="' + id + '">@</span>';
        editor.insertHtml(mentionPlaceHolder);
        return id;
    }

    private _getMentionIdFromMentionPlaceHolder = (currentEditingElementId: string): string => {
        if (currentEditingElementId && currentEditingElementId.indexOf(this.mentionPlacerHolderPrefix) > -1) {
            const splits = currentEditingElementId.split('-');
            return splits[2];
        }
        return null;
    };

    private _cleanup(editor: CKEDITOR.editor, mentionId: string, unwrapOnly?): void {
        const mentionState = this._retrieveMentionState(editor.id, mentionId);
        const mentionPlaceHolderId = mentionState.mentionPlaceHolderId;
        const mentionPlaceHolderDom = editor.document.getById(mentionPlaceHolderId);
        if (unwrapOnly) {
            const range = editor.createRange();
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
        const mentionScope = mentionState.mentionScope;
        mentionScope.$destroy();
        // remove the mention dom
        const mentionElement = mentionState.mentionElement;
        mentionElement.remove();
        // remove the mention state
        delete this.mentions[MentionService._getMentionStateId(editor.id, mentionId)];
    }

    private _handleSpecialKeys(
        evt: CKEDITOR.eventInfo<CKEDITOR.dom.event<KeyboardEvent>>,
        mentionId: string,
        editor: CKEDITOR.editor,
        projectId: string,
        refId: string
    ): void {
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

    private _getMentionItem = (key: string, projectId: string, refId: string): ElementObject => {
        const cfListing = this.getFastCfListing(projectId, refId);
        return cfListing.find((cf) => {
            return cf.id + cf.type === key;
        });
    };

    private _handleEnterKey = (editorId: string, mentionId: string, projectId: string, refId: string): void => {
        const matchDom = $('#' + mentionId + ' .active .mentionMatch');
        if (matchDom.length > 0) {
            const key = matchDom.attr('id');
            const mentionItem = this._getMentionItem(key, projectId, refId);
            const mentionState = this._retrieveMentionState(editorId, mentionId);
            mentionState.mentionController.selectMentionItem(mentionItem);
        }
    };

    private _handleEscKey(editor: CKEDITOR.editor, mentionId: string): void {
        this._cleanup(editor, mentionId, true);
    }

    private _handleArrowKey = (mentionId: string, isDownArrow: boolean): void => {
        const popUpEl = $('#' + mentionId);
        const allOptions = popUpEl.find('li');
        const len = allOptions.length;
        let activeIndex = -1;
        allOptions.each((index) => {
            if ($(this).hasClass('active')) {
                activeIndex = index;
            }
        });
        if (activeIndex !== -1) {
            let nextIndex: number;
            if (isDownArrow) {
                nextIndex = (activeIndex + 1) % len;
            } else {
                if (activeIndex === 0) {
                    nextIndex = len - 1;
                } else {
                    nextIndex = (activeIndex - 1) % len;
                }
            }
            const target = $(allOptions[nextIndex]);
            target.addClass('active');
            $(allOptions[activeIndex]).removeClass('active');
            // scroll if necessary
            (<Element>target[0].parentNode).scrollTop = target[0].offsetTop;
        }
    };

    private _repositionDropdownIfOffScreen(editor: CKEDITOR.editor, mentionState: MentionState): void {
        // wait for dropdown result to render so that we can determine whether it is on/off-screen
        this.$timeout(
            () => {
                const mentionElement = mentionState.mentionElement;
                const dropdownResultElement = mentionElement.find('ul.dropdown-menu');
                if (dropdownResultElement.children().length > 0 && !dropdownResultElement.isOnScreen()) {
                    const ckeditorBox = MentionService._getCkeditorFrame(editor).getBoundingClientRect();
                    mentionElement.css({
                        top: ckeditorBox.top,
                        left: ckeditorBox.left,
                    });
                }
            },
            0,
            false
        ).then(
            () => {
                /*Do Nothing*/
            },
            () => {
                /*Do Nothing*/
            }
        );
    }
}

veCore.service('MentionService', MentionService);
