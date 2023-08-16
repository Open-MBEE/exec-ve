import angular, { IComponentController } from 'angular';
import $ from 'jquery';
import _, { DebouncedFunc } from 'lodash';

import { InsertTransclusionData } from '@ve-components/transclusions';
import { MentionService } from '@ve-core/editor';
import { EditorService } from '@ve-core/editor/services/Editor.service';
import { ImageService } from '@ve-utils/application';
import { ApiService, ElementService, URLService, ViewService } from '@ve-utils/mms-api-client';

import { veCore } from '@ve-core';

import eventDataTypes = CKEDITOR.eventDataTypes;

import { VeComponentOptions, VeNgModelController, VePromise, VeQService } from '@ve-types/angular';
import { InsertData, InsertResolveFn } from '@ve-types/components';
import { VeConfig } from '@ve-types/config';
import { ElementObject, ElementsResponse, TransclusionObject } from '@ve-types/mms';
import { VeModalService, VeModalSettings } from '@ve-types/view-editor';

/**
 * @ngdoc directive
 * @name veCore.component:veEditor
 * @element textarea
 *
 * @requires veUtils/CacheService
 * @requires veUtils/ElementService
 * @requires veUtils/UtilsService
 * @requires veUtils/ViewService
 * @requires $uibModal
 * @requires $q
 * @requires $timeout
 * @requires growl
 * @requires CKEDITOR
 * @requires _
 *
 * @restrict A
 * * Make any edit any value with a CKEditor wysiwyg editor. This
 * requires the CKEditor library. Transclusion is supported. ngModel is required.
 * Allows the setting of an Autosave key.
 * ### Example
 * <pre>
   <editor ng-model="element.documentation"></editor>
   </pre>
 */
export class EditorController implements IComponentController {
    private veConfig: VeConfig = window.__env;
    private ckEditor = window.CKEDITOR;

    private ngModelCtrl: VeNgModelController<string>;
    private ngModel: string;

    mmsElementId: string;
    mmsProjectId: string;
    mmsRefId: string;
    private editorType: string;
    private editField: 'name' | 'value' | 'documentation' = 'documentation';
    private editKey: string | string[];
    private editIndex: string = '';

    private stylesToolbar = {
        name: 'styles',
        items: ['Styles', /*'Format',*/ 'FontSize', 'TextColor', 'BGColor'],
    };
    private basicStylesToolbar = {
        name: 'basicstyles',
        //items: ['Bold', 'Italic', 'Underline', 'mmsExtraFormat'],
        items: ['Bold', 'Italic', 'Underline'],
    };
    private clipboardToolbar = { name: 'clipboard', items: ['Undo', 'Redo'] };
    private justifyToolbar = {
        name: 'paragraph',
        items: ['JustifyLeft', 'JustifyCenter', 'JustifyRight'],
    };
    private editingToolbar = { name: 'editing', items: ['Find', 'Replace'] };
    private linksToolbar = { name: 'links', items: ['Link', 'Unlink', '-'] };
    private imageToolbar = { name: 'image', items: ['Image', 'Iframe'] };
    private listToolbar = {
        name: 'list',
        items: ['NumberedList', 'BulletedList', 'Outdent', 'Indent'],
    };
    private equationToolbar = {
        name: 'equation',
        items: ['Mathjax', 'SpecialChar'],
    };
    private sourceToolbar = {
        name: 'source',
        items: ['Maximize', 'Sourcedialog'],
    };
    private combinedToolbar = {
        name: 'combined',
        items: [
            'Mmscf',
            'Mmsvlink',
            'Table',
            'Image',
            'Iframe',
            'Mathjax',
            'SpecialChar',
            'Mmscomment',
            //'mmsExtraFeature',
        ],
    };
    private tableEquationToolbar = { name: 'tableEquation', items: ['Table', 'Mathjax', 'SpecialChar', '-'] };

    private extrasToolbar = { name: 'extras', items: ['mmsExtraFeature'] };

    protected $transcludeEl: JQuery<HTMLElement>;
    public id: string;
    protected init: boolean = false;

    private instance: CKEDITOR.editor = null;
    private deb: DebouncedFunc<(e) => void>;

    private tokenStr: RegExp = new RegExp('([?&]token=[a-zA-Z0-9.]*)');

    static $inject = [
        '$compile',
        '$q',
        '$attrs',
        '$element',
        '$timeout',
        '$scope',
        '$uibModal',
        'growl',
        'ElementService',
        'ApiService',
        'ViewService',
        'URLService',
        'MentionService',
        'EditorService',
        'ImageService',
    ];

    /**
     *
     * @param {angular.ICompileService} $compile
     * @param {VeQService} $q
     * @param {VeModalService} $uibModal
     * @param {angular.IAttributes} $attrs
     * @param {JQuery<HTMLElement>} $element
     * @param {angular.ITimeoutService} $timeout
     * @param {angular.IScope} $scope
     * @param {angular.growl.IGrowlService} growl
     * @param {ElementService} elementSvc
     * @param {ApiService} apiSvc
     * @param {ViewService} viewSvc
     * @param {URLService} uRLSvc
     * @param {MentionService} mentionSvc
     * @param {EditorService} editorSvc
     * @param {ImageService} imageSvc
     */
    constructor(
        private $compile: angular.ICompileService,
        private $q: VeQService,
        private $attrs: angular.IAttributes,
        private $element: JQuery<HTMLElement>,
        private $timeout: angular.ITimeoutService,
        private $scope: angular.IScope,
        private $uibModal: VeModalService,
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private apiSvc: ApiService,
        private viewSvc: ViewService,
        private uRLSvc: URLService,
        private mentionSvc: MentionService,
        private editorSvc: EditorService,
        private imageSvc: ImageService
    ) {
        this.deb = _.debounce((e) => {
            this.update().catch(() => {
                this.growl.error('Error saving editor content');
            });
        }, 1000);
    }

    $onChanges(onChangesObj: angular.IOnChangesObject): void {
        if (onChangesObj.ngModel && !this.init) {
            this.init = true;

            this.id = this.editorSvc.createId();
            this.editKey = this.elementSvc.getEditKey({
                refId: this.mmsRefId,
                projectId: this.mmsProjectId,
                elementId: this.mmsElementId,
            });
            if (this.editKey) {
                this.editorSvc.add(
                    this.editKey,
                    `${this.editField}${this.editIndex ? this.editIndex : ''}`,
                    this.update
                );
            }
            this.startEditor();
        }
    }

    $onDestroy(): void {
        this.destroy();
    }

    public destroy(): void {
        this.instance.config.autosave = { enableAutosave: false };
        this.editorSvc.remove(this.editKey, `${this.editField}${this.editIndex ? this.editIndex : ''}`);
        if (this.ckEditor.instances[this.id]) this.ckEditor.instances[this.id].destroy(true);
    }

    public startEditor(): void {
        // Initialize ckeditor and set event handlers
        if (this.ckEditor.instances[this.id]) return;
        this.$element.empty();
        this.$transcludeEl = $(`<textarea id="${this.id}"></textarea>`);
        this.$transcludeEl.val(this.ngModel);

        this.$element.append(this.$transcludeEl);
        this.$compile(this.$transcludeEl)(this.$scope);

        this.instance = this.ckEditor.replace(this.id, {
            mmscf: { callbackModalFnc: this.transcludeCallback },
            mmscomment: { callbackModalFnc: this.commentCallback },
            mmsvlink: { callbackModalFnc: this.viewLinkCallback },
            mmsreset: { callback: this.mmsResetCallback },
            contentsCss: `${this.ckEditor.basePath}contents.css`,
            toolbar: this.getToolbar(),
        });

        // Enable Autosave plugin only when provided with unique identifier (editKey)
        if (this.editKey) {
            // Configuration for autosave plugin
            this.instance.config.autosave = {
                SaveKey: `${Array.isArray(this.editKey) ? this.editKey.join('|') : this.editKey}|${this.editField}${
                    this.editIndex ? '|' + this.editIndex : ''
                }`,
                delay: 5,
                NotOlderThen: 7200, // 5 days in minutes
                enableAutosave: true,
            };
        } else {
            this.instance.config.autosave = { enableAutosave: false };
        }

        this.instance.on('instanceReady', () => {
            this.addCkeditorHtmlFilterRule(this.instance);
            this._addContextMenuItems(this.instance);
            this.highlightActiveEditor(this.instance);
        });

        this._addInlineMention();

        this.instance.on(
            'toHtml',
            () => {
                this.addCkeditorDataFilterRules(this.instance);
            },
            null,
            null,
            9
        );

        this.instance.on('init', () => {
            this._waitForEditor(() => {
                this.ngModelCtrl.$setPristine();
            });
        });

        this.instance.on('change', (e) => this._waitForEditor(this.deb, e));
        this.instance.on('afterCommandExec', (e) => this._waitForEditor(this.deb, e));
        this.instance.on('resize', (e) => this._waitForEditor(this.deb, e));
        this.instance.on('beforeDestroy', (e) => this._waitForEditor(this.deb, e));
        this.instance.on('blur', () =>
            this._waitForEditor(() => {
                this.instance.focusManager.blur();
            })
        );
        this.instance.on(
            'key',
            (e: CKEDITOR.eventInfo<CKEDITOR.editor.events.key>) =>
                this._waitForEditor((evt) => this._keyHandler(evt), e),
            null,
            null,
            31
        ); //priority is after indent list plugin's event handler

        this.instance.on('fileUploadRequest', (e: CKEDITOR.eventInfo<CKEDITOR.editor.events.fileUploadRequest>) => {
            //this._waitForEditor((evt) => {
            const fileLoader = e.data.fileLoader;
            const formData = new FormData();
            const xhr = fileLoader.xhr;

            xhr.open(
                'POST',
                this.uRLSvc.getPutArtifactsURL({
                    projectId: this.mmsProjectId,
                    refId: this.mmsRefId,
                    elementId: '_hidden_image_' + this.apiSvc.createUniqueId(),
                }),
                true
            );
            //xhr.withCredentials = true;
            xhr.setRequestHeader('Authorization', this.uRLSvc.getAuthorizationHeaderValue());
            formData.append('file', fileLoader.file, fileLoader.fileName);
            if (fileLoader.fileName) {
                formData.append('name', fileLoader.fileName);
            }

            fileLoader.xhr.send(formData);

            // Prevented the default behavior.
            e.stop();
            //}, e)
        });
        this.instance.on('fileUploadResponse', (e: CKEDITOR.eventInfo<CKEDITOR.editor.events.fileUploadRequest>) => {
            //this._waitForEditor((evt) => {
            // Prevent the default response handler.
            e.stop();

            // Get XHR and response.
            const data = e.data;
            const xhr = data.fileLoader.xhr;
            const response: ElementsResponse<ElementObject> = JSON.parse(
                xhr.response as string
            ) as ElementsResponse<ElementObject>;

            if (
                !response.elements ||
                response.elements.length == 0 ||
                !response.elements[0]._artifacts ||
                response.elements[0]._artifacts.length == 0
            ) {
                // An error occurred during upload.
                //data.message = response[ 1 ];
                e.cancel();
            } else {
                //TODO does this need to be smarter?
                const element = response.elements[0];
                data.url = this.uRLSvc.getArtifactURL({
                    projectId: element._projectId,
                    refId: element._refId,
                    elementId: element.id,
                    artifactExtension: element._artifacts[0].extension,
                });
            }
            //}, e)
        });
    }

    public highlightActiveEditor = (instance: CKEDITOR.editor): void => {
        const activeEditorClass = 'activeditor';
        $('transclude-doc').children('div').removeClass(activeEditorClass);
        $(instance.element.$).closest('transclude-doc').children('div').addClass(activeEditorClass);

        instance.on('focus', () => {
            $('transclude-doc').children('div').removeClass(activeEditorClass);
            $(instance.element.$).closest('transclude-doc').children('div').addClass(activeEditorClass);
        });
    };
    public addCkeditorDataFilterRules = (instance: CKEDITOR.editor): void => {
        instance.dataProcessor.dataFilter.addRules({
            elements: {
                $: (element: CKEDITOR.htmlParser.element) => {
                    if (element.name === 'script') {
                        element.remove();
                        return;
                    }

                    if (element.name.startsWith('transclude-') || element.name.startsWith('present-')) {
                        element.replaceWithChildren();
                        return;
                    }

                    const attributesToDelete = Object.keys(element.attributes).filter((attrKey) => {
                        return attrKey.startsWith('ng-');
                    });
                    attributesToDelete.forEach((attrToDelete) => {
                        delete element.attributes[attrToDelete];
                    });
                },
            },
        });
        instance.dataProcessor.dataFilter.addRules({
            elements: {
                // Adds the token to img's in the editor environment to allow images to be displayed while editor
                $: (element: CKEDITOR.htmlParser.element) => {
                    element
                        .find((el: CKEDITOR.htmlParser.element) => {
                            return (
                                el.name == 'img' &&
                                el.attributes['data-cke-saved-src'] &&
                                (el.attributes['data-cke-saved-src'].indexOf(this.veConfig.apiUrl) > -1 ||
                                    el.attributes['data-cke-saved-src'].indexOf('http') < 0)
                            );
                        }, true)
                        .forEach((el: CKEDITOR.htmlParser.element) => {
                            el.attributes['src'] = this.imageSvc.fixImgUrl(el.attributes['data-cke-saved-src'], true);
                            // el.attributes['src'] = el.attributes['data-cke-saved-src'];
                        });
                },
            },
        });
    };
    public addCkeditorHtmlFilterRule = (instance: CKEDITOR.editor): void => {
        instance.dataProcessor.htmlFilter.addRules({
            elements: {
                $: (element: CKEDITOR.htmlParser.element) => {
                    if (element.name === 'script') {
                        element.remove();
                        return;
                    }

                    if (element.name.startsWith('transclude-') || element.name.startsWith('present-')) {
                        element.replaceWithChildren();
                        return;
                    }

                    const attributesToDelete = Object.keys(element.attributes).filter((attrKey) => {
                        return attrKey.startsWith('ng-');
                    });
                    attributesToDelete.forEach((attrToDelete) => {
                        delete element.attributes[attrToDelete];
                    });
                },
            },
        });
        instance.dataProcessor.htmlFilter.addRules({
            elements: {
                // Removes the token from the export src to prevent saving of token to server
                $: (element: CKEDITOR.htmlParser.element) => {
                    element
                        .find((el: CKEDITOR.htmlParser.element) => {
                            return (
                                el.name == 'img' &&
                                el.attributes['data-cke-saved-src'] &&
                                el.attributes['data-cke-saved-src'].indexOf(this.veConfig.apiUrl) > -1
                            );
                        }, true)
                        .forEach((el: CKEDITOR.htmlParser.element) => {
                            el.attributes['data-cke-saved-src'] = this.imageSvc.fixImgUrl(
                                el.attributes['data-cke-saved-src'],
                                false
                            );
                            // el.attributes['src'] = el.attributes['data-cke-saved-src'];
                        });
                },
            },
        });
    };

    public getToolbar(): Array<
        | string
        | string[]
        | {
              name: string;
              items?: string[] | undefined;
              groups?: string[] | undefined;
          }
    > {
        let thisToolbar: Array<
            | string
            | string[]
            | {
                  name: string;
                  items?: string[] | undefined;
                  groups?: string[] | undefined;
              }
        > = [
            this.stylesToolbar,
            this.basicStylesToolbar,
            this.justifyToolbar,
            this.listToolbar,
            this.linksToolbar,
            this.combinedToolbar,
            this.clipboardToolbar,
            this.editingToolbar,
            this.sourceToolbar,
        ];
        switch (this.editorType) {
            // case 'TableT':
            //     thisToolbar = [
            //         this.stylesToolbar,
            //         this.basicStylesToolbar,
            //         this.justifyToolbar,
            //         this.linksToolbar,
            //         this.tableEquationToolbar,
            //         dropdownToolbar,
            //         this.clipboardToolbar,
            //         this.editingToolbar,
            //         this.sourceToolbar,
            //     ]
            //     break
            case 'ListT':
                thisToolbar = [
                    this.stylesToolbar,
                    this.basicStylesToolbar,
                    this.justifyToolbar,
                    this.listToolbar,
                    this.linksToolbar,
                    this.equationToolbar,
                    this.extrasToolbar,
                    this.clipboardToolbar,
                    this.editingToolbar,
                    this.sourceToolbar,
                ];
                break;
            case 'Equation':
                thisToolbar = [this.justifyToolbar, this.equationToolbar, this.sourceToolbar];
                break;
            case 'Figure':
            case 'ImageT':
                thisToolbar = [this.justifyToolbar, this.imageToolbar, this.sourceToolbar];
                break;
        }
        return thisToolbar;
    }

    public transcludeCallback = (editor: CKEDITOR.editor): void => {
        const tSettings: VeModalSettings<InsertResolveFn<InsertTransclusionData>> = {
            component: 'createTransclusionModal',
            resolve: {
                getInsertData: (): InsertTransclusionData => {
                    return {
                        type: 'Transclusion',
                        viewLink: false,
                        insertType: 'transclusion',
                    };
                },
                getProjectId: () => {
                    return this.mmsProjectId;
                },
                getRefId: () => {
                    return this.mmsRefId;
                },
                getOrgId: () => {
                    return '';
                },
            },
            size: 'lg',
        };
        const tInstance = this.$uibModal.open<InsertResolveFn<InsertTransclusionData>, TransclusionObject>(tSettings);
        tInstance.result.then(
            (result) => {
                this._addWidgetTag(result.tag, editor);
            },
            () => {
                editor.focus();
            }
        );
    };

    // Controller for inserting view link
    // Defines scope variables for html template and how to handle user click
    // If user selects name or doc, link will be to first related doc
    // Also defines options for search interfaces -- see mmsSearch.js for more info

    public viewLinkCallback = (editor: CKEDITOR.editor): void => {
        const tSettings: VeModalSettings<InsertResolveFn<InsertTransclusionData>> = {
            component: 'createTransclusionModal',
            resolve: {
                getInsertData: (): InsertTransclusionData => {
                    return {
                        type: 'ViewLink',
                        viewLink: true,
                        insertType: 'transclusion',
                    };
                },
                getProjectId: () => {
                    return this.mmsProjectId;
                },
                getRefId: () => {
                    return this.mmsRefId;
                },
                getOrgId: () => {
                    return '';
                },
            },
            size: 'lg',
        };
        const tInstance = this.$uibModal.open<InsertResolveFn<InsertTransclusionData>, TransclusionObject>(tSettings);
        tInstance.result.then(
            (result) => {
                this._addWidgetTag(result.tag, editor);
            },
            () => {
                editor.focus();
            }
        );
    };

    public commentCallback = (editor: CKEDITOR.editor): void => {
        const cSettings: VeModalSettings<InsertResolveFn<InsertData>> = {
            component: 'insertElementModal',
            resolve: {
                getInsertData: (): InsertData => {
                    return {
                        type: 'Comment',
                        insertType: 'comment',
                    };
                },
                getProjectId: () => {
                    return this.mmsProjectId;
                },
                getRefId: () => {
                    return this.mmsRefId;
                },
                getOrgId: () => {
                    return '';
                },
            },
        };
        const cInstance = this.$uibModal.open<InsertResolveFn<InsertData>, ElementObject>(cSettings);

        cInstance.result.then(
            (data) => {
                const tag =
                    '<mms-cf mms-cf-type="com" mms-element-id="' + data.id + '">comment:' + data._creator + '</mms-cf>';
                this._addWidgetTag(tag, editor);
            },
            (reason) => {
                if (reason && reason.status !== 444) {
                    this.growl.warning(`Error adding Comment: ${reason.message}`);
                } else {
                    this.growl.info('Commenting Cancelled', {
                        ttl: 1000,
                    });
                }
            }
        );
    };

    public resetCrossRef = (type: CKEDITOR.dom.node<Node>[], typeString: string): void => {
        type.forEach((node, key) => {
            const value = node.$;
            const transclusionObject = angular.element(value);
            const transclusionId = transclusionObject.attr('mms-element-id');

            //TODO create Utils function to handle request objects
            const reqOb = {
                elementId: transclusionId,
                projectId: this.mmsProjectId,
                refId: this.mmsRefId,
            };
            this.elementSvc.getElement(reqOb, 2).then(
                (data) => {
                    transclusionObject.html('[cf:' + data.name + typeString);
                },
                (reason) => {
                    let error: string;
                    if (reason.status === 410) error = 'deleted';
                    if (reason.status === 404) error = 'not found';
                    transclusionObject.html('[cf:' + error + typeString);
                }
            );
        });
    };

    public mmsResetCallback = (ed: CKEDITOR.editor): void => {
        const body: CKEDITOR.dom.element = ed.document.getBody();
        this.resetCrossRef(body.find("mms-cf[mms-cf-type='name']").toArray(), '.name]');
        this.resetCrossRef(body.find("mms-cf[mms-cf-type='doc']").toArray(), '.doc]');
        this.resetCrossRef(body.find("mms-cf[mms-cf-type='val']").toArray(), '.val]');
        this.resetCrossRef(body.find('mms-view-link').toArray(), '.vlink]');
        this.update().then(
            () => {
                /**/
            },
            () => {
                this.growl.error('Error saving editor content');
            }
        );
    };

    public update = (destroy?: boolean): VePromise<boolean, string> => {
        // getData() returns CKEditor's processed/clean HTML content.
        return new this.$q((resolve, reject) => {
            if (this.instance) {
                try {
                    this.ngModelCtrl.$setViewValue(this.instance.getData());
                } catch (e) {
                    reject({
                        status: 500,
                        message: 'Error updating editor data',
                        data: this.id,
                    });
                }
            }
            if (destroy) this.destroy();
            resolve(true);
        });
    };

    private _addWidgetTag = (tag: string, editor: CKEDITOR.editor): void => {
        editor.insertHtml(tag);
        this.editorSvc.focusOnEditorAfterAddingWidgetTag(editor);
    };

    private _addInlineMention = (): void => {
        let keyupHandler: CKEDITOR.listenerRegistration;
        this.ckEditor.instances[this.id].on('contentDom', () => {
            keyupHandler = this.ckEditor.instances[this.instance.name].document.on('keyup', (e) => {
                if (this._isMentionKey((e.data as CKEDITOR.dom.node<KeyboardEvent>).$)) {
                    this.mentionSvc.createMention(this.instance, this.$scope.$new(), this.mmsProjectId, this.mmsRefId);
                } else {
                    this.mentionSvc.handleInput(
                        e as CKEDITOR.eventInfo<CKEDITOR.dom.event<KeyboardEvent>>,
                        this.$scope.$new(),
                        this.instance,
                        this.mmsProjectId,
                        this.mmsRefId
                    );
                }
            });
        });

        this.ckEditor.instances[this.id].on('contentDomUnload', () => {
            if (keyupHandler) {
                keyupHandler.removeListener();
            }
        });
    };

    private _keyHandler = (e: CKEDITOR.eventInfo<CKEDITOR.editor.events.key>): boolean => {
        if (this._isMentionKey(e.data.domEvent.$)) {
            return false; // to prevent "@" from getting written to the editor
        }

        // when tab is pressed or any of these special keys is pressed while the mention results show up, ignore default ckeditor's behaviour
        const ignoreDefaultBehaviour =
            this._isTabKey(e) || (this._isSpecialKey(e) && this.mentionSvc.hasMentionResults(this.instance));
        if (ignoreDefaultBehaviour) {
            e.cancel();
            e.stop();
        }

        if (this._isTabKey(e) && !this._isShiftKeyOn(e.data.domEvent.$)) {
            this.instance.insertHtml('&nbsp;&nbsp;&nbsp;&nbsp;');
        }

        if (!ignoreDefaultBehaviour) {
            this.deb(e);
        }
        return true;
    };

    // 13 = enter, 38 = up arrow, 40 = down arrow
    private _isSpecialKey = (event: CKEDITOR.eventInfo<CKEDITOR.editor.events.key>): boolean => {
        const key = event.data.domEvent.$.which;
        return key === 13 || key === 38 || key === 40;
    };

    private _isTabKey = (event: CKEDITOR.eventInfo<CKEDITOR.editor.events.key>): boolean => {
        return event.data.domEvent.$.which === 9;
    };

    private _isMentionKey = (keyboardEvent: KeyboardEvent): boolean => {
        return this._isShiftKeyOn(keyboardEvent) && keyboardEvent.key === '@';
    };

    private _isShiftKeyOn = (keyboardEvent: KeyboardEvent): boolean => {
        return keyboardEvent.shiftKey;
    };

    private _addContextMenuItems = (editor: CKEDITOR.editor): void => {
        this._addFormatAsCodeMenuItem(editor);
    };

    private _addFormatAsCodeMenuItem = (editor: CKEDITOR.editor): void => {
        editor.addCommand('formatAsCode', {
            exec: (editor: CKEDITOR.editor) => {
                const selected_text = editor.getSelection().getSelectedText();
                const newElement = new this.ckEditor.dom.element('code');
                newElement.addClass('inlineCode');
                newElement.setText(selected_text);
                editor.insertElement(newElement);
                return true;
            },
        });
        editor.addMenuGroup('veGroup');
        editor.addMenuItem('formatAsCode', {
            label: 'Format as inline code',
            command: 'formatAsCode',
            group: 'group',
            icon: 'codeSnippet',
        });
        editor.contextMenu.addListener((element) => {
            return { formatAsCode: this.ckEditor.TRISTATE_OFF };
        });
        editor.setKeystroke(this.ckEditor.CTRL + 75, 'formatAsCode');
    };

    private _waitForEditor<T extends CKEDITOR.eventInfo<eventDataTypes>>(fn: (e?: T) => void, evt?: T): void {
        if (this.instance.status === 'loaded') fn();
        else {
            new this.$q((resolve) => {
                this.instance.on('loaded', () => {
                    fn(evt);
                    resolve();
                });
            }).catch((reason) => {
                this.growl.error('CKEditor Error: ' + reason.message);
            });
        }
    }
}

const EditorComponent: VeComponentOptions = {
    selector: 'editor',
    template: `<div></div>`,
    require: {
        ngModelCtrl: '^ngModel',
    },
    bindings: {
        ngModel: '<',
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        editorType: '@',
        editField: '@',
        editIndex: '<',
    },
    controller: EditorController,
};

veCore.component(EditorComponent.selector, EditorComponent);
