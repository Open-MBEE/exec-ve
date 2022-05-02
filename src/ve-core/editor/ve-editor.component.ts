import * as angular from "angular";
import * as _ from "lodash";
import CKEDITOR from "../../lib/types/ckeditor"

import {VeComponentOptions} from "../../ve-utils/types/view-editor";
import {ElementService} from "../../ve-utils/services/Element.service";
import {CacheService} from "../../ve-utils/services/Cache.service";
import {UtilsService} from "../../ve-utils/services/Utils.service";
import {ViewService} from "../../ve-utils/services/View.service";
import {URLService} from "../../ve-utils/services/URL.provider";
import {MentionService} from "./Mention.service";
import {Utils} from "../utilities/CoreUtils.service";



import {veCore} from "../ve-core.module";
import {VeEditorApi} from "./CKEditor.service";
import {ElementObject} from "../../ve-utils/types/mms";

//veCore.directive('mmsCkeditor', ['$window', '$uibModal', '$templateCache', '$timeout', 'growl', 'CKEDITOR', 'CacheService', 'ElementService', 'UtilsService', 'ViewService', 'URLService', 'MentionService', 'Utils', mmsCkeditor]);
/**
 * @ngdoc directive
 * @name veCore.directive:mmsCkeditor
 * @element textarea
 *
 * @requires veUtils/CacheService
 * @requires veUtils/ElementService
 * @requires veUtils/UtilsService
 * @requires veUtils/ViewService
 * @requires $uibModal
 * @requires $window
 * @requires $timeout
 * @requires growl
 * @requires CKEDITOR
 * @requires _
 *
 * @restrict A
 *
 * @description
 * Make any textarea with an ngModel attached to be a CKEditor wysiwyg editor. This
 * requires the CKEditor library. Transclusion is supported. ngModel is required.
 * ### Example
 * <pre>
   <ve-editor edit-value="element.documentation"></ve-editor>
   </pre>
 */
export class VeEditorController implements angular.IComponentController {

        private cKEditor = window.CKEDITOR;

        private editValue: any;
        mmsProjectId: string;
        mmsRefId: string;
        private mmsElementId: string;
        private mmsEditorType: any;
        private autosaveKey: any;
        private mmsEditorApi: VeEditorApi;

        private toolbar: Array<string | string[] | { name: string, items?: string[] | undefined, groups?: string[] | undefined }>;
        protected $transcludeEl: JQuery<HTMLElement>
        protected id: string;
        private generatedIds: number = 0;
        private instance: CKEDITOR.editor = null;
        private deb: _.DebouncedFunc<(e) => void> = _.debounce((e) => {
            this.update();
        }, 1000);

        static $inject = ['$window', '$uibModal', '$attrs', '$element', '$timeout', '$scope', 'growl', 'CacheService',
            'ElementService', 'UtilsService', 'ViewService', 'URLService', 'MentionService', 'Utils'];
        constructor(private $window: angular.IWindowService, private $uibModal: angular.ui.bootstrap.IModalService,
                    private $attrs: angular.IAttributes, private $element: JQuery<HTMLElement>,
                    private $timeout: angular.ITimeoutService, private $scope: angular.IScope, private growl: angular.growl.IGrowlService,
                    private cacheSvc: CacheService, private elementSvc: ElementService, private utilsSvc: UtilsService,
                    private viewSvc: ViewService, private uRLSvc: URLService, private mentionSvc: MentionService,
                    private utils: Utils) {}
        //depends on angular bootstrap


        $onInit() {
            this.$transcludeEl = $(this.$element.children()[0]);
            this.id = 'mmsCkEditor' + this.generatedIds++;

            // Formatting editor toolbar
            var stylesToolbar = { name: 'styles', items : ['Styles',/*'Format',*/'FontSize','TextColor','BGColor'] };
            var basicStylesToolbar = { name: 'basicstyles', items : [ 'Bold','Italic','Underline', 'mmsExtraFormat'] };
            var clipboardToolbar = { name: 'clipboard', items : [ 'Undo','Redo' ] };
            var justifyToolbar = { name: 'paragraph', items : [ 'JustifyLeft','JustifyCenter','JustifyRight' ] };
            var editingToolbar = { name: 'editing', items : [ 'Find','Replace' ] };
            var linksToolbar = { name: 'links', items : [ 'Link','Unlink','-' ] };
            var imageToolbar = { name: 'image', items: [ 'Image','Iframe' ] };
            var listToolbar =  { name: 'list', items: [ 'NumberedList','BulletedList','Outdent','Indent' ] };
            var equationToolbar = { name: 'equation', items: [ 'Mathjax','SpecialChar' ]};
            var sourceToolbar = { name: 'source', items: [ 'Maximize','Sourcedialog' ] };
            var combinedToolbar = { name: 'combined', items: ['Mmscf', 'Mmsvlink', 'Table', 'Image', 'Iframe', 'Mathjax', 'SpecialChar', 'Mmscomment', 'mmsExtraFeature' ]};
            var extrasToolbar = { name: 'extras', items: ['mmsExtraFeature']}
            // var tableEquationToolbar = { name: 'tableEquation', items: ['Table', 'Mathjax', 'SpecialChar', '-']};

            var thisToolbar: Array<string | string[] | { name: string, items?: string[] | undefined, groups?: string[] | undefined }> = [stylesToolbar, basicStylesToolbar, justifyToolbar, listToolbar, linksToolbar, combinedToolbar, clipboardToolbar, editingToolbar, sourceToolbar];
            switch(this.mmsEditorType) {
                case 'TableT':
                    //thisToolbar = [stylesToolbar, basicStylesToolbar, justifyToolbar, linksToolbar, tableEquationToolbar, dropdownToolbar, clipboardToolbar, editingToolbar, sourceToolbar];
                    break;
                case 'ListT':
                    // TODO: Figure out why this doesnt work in typescript or how to make it work
                    thisToolbar = [stylesToolbar, basicStylesToolbar, justifyToolbar, listToolbar, linksToolbar, equationToolbar, extrasToolbar, clipboardToolbar, editingToolbar, sourceToolbar];
                    break;
                case 'Equation':
                    thisToolbar = [justifyToolbar, equationToolbar, sourceToolbar];
                    break;
                case 'Figure':
                case 'ImageT':
                    thisToolbar = [justifyToolbar, imageToolbar, sourceToolbar];
                    break;
            }
            this.toolbar = thisToolbar;
        }
        $postLink() {
            this.$timeout(() => {
                // Initialize ckeditor and set event handlers
                $(this.$element).val(this.editing());
                this.instance = this.cKEditor.replace(this.id, {
                    //customConfig: '/lib/ckeditor-dev/config.js', not needed, this is default and prevents absolute path
                    mathJaxLib: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
                    extraPlugins: 'liststyle,colordialog,autosave,autogrow,stylescombo,mmscf,mmscomment,mmsvlink,mmsreset,mmssignature,mmsdropdown,sourcedialog',
                    mmscf: {callbackModalFnc: this.transcludeCallback},
                    mmscomment: {callbackModalFnc: this.commentCallback},
                    mmsvlink: {callbackModalFnc: this.viewLinkCallback},
                    mmsreset: {callback: this.mmsResetCallback},
                    contentsCss: this.cKEditor.basePath+'contents.css',
                    toolbar: this.toolbar
                });

                // Enable Autosave plugin only when provided with unique identifier (autosaveKey)
                if ( this.$attrs.autosaveKey ) {
                    // Configuration for autosave plugin
                    this.instance.config.autosave = {
                        SaveKey: this.$attrs.autosaveKey,
                        delay: 5,
                        NotOlderThen: 7200, // 5 days in minutes
                        enableAutosave: true
                    };
                } else {
                    this.instance.config.autosave = {enableAutosave: false};
                }

                this.instance.on( 'instanceReady', () => {
                    addCkeditorHtmlFilterRule(this.instance);
                    this._addContextMenuItems(this.instance);
                    highlightActiveEditor(this.instance);
                } );

                const highlightActiveEditor = (instance) => {
                    var activeEditorClass = 'active-editor';
                    $('mms-transclude-doc').children('div').removeClass(activeEditorClass);
                    $(instance.element.$).closest('mms-transclude-doc').children('div').addClass(activeEditorClass);

                    instance.on('focus', () => {
                        $('mms-transclude-doc').children('div').removeClass(activeEditorClass);
                        $(instance.element.$).closest('mms-transclude-doc').children('div').addClass(activeEditorClass);
                    });
                }

                const addCkeditorHtmlFilterRule = (instance) => {
                    instance.dataProcessor.htmlFilter.addRules({
                        elements: {
                            $: (element) => {
                                if (element.name === 'script') {
                                    element.remove();
                                    return;
                                }

                                if (element.name.startsWith('mms-')) {
                                    if (element.name !== 'mms-view-link' && element.name !== 'mms-cf' && element.name !== 'mms-group-docs' && element.name !== 'mms-diff-attr' && element.name !== 'mms-value-link') {
                                        element.replaceWithChildren();
                                        return;
                                    }
                                }

                                var attributesToDelete = Object.keys(element.attributes).filter((attrKey) => {
                                    return attrKey.startsWith('ng-');
                                });
                                attributesToDelete.forEach((attrToDelete) => {
                                    delete element.attributes[attrToDelete];
                                });
                            }
                        }
                    });
                    instance.dataProcessor.dataFilter.addRules({
                        elements: {
                            $: (element) => {
                                if (element.name === 'script') {
                                    element.remove();
                                    return;
                                }

                                if (element.name.startsWith('mms-')) {
                                    if (element.name !== 'mms-view-link' && element.name !== 'mms-cf' && element.name !== 'mms-group-docs' && element.name !== 'mms-diff-attr' && element.name !== 'mms-value-link') {
                                        element.replaceWithChildren();
                                        return;
                                    }
                                }

                                var attributesToDelete = Object.keys(element.attributes).filter((attrKey) => {
                                    return attrKey.startsWith('ng-');
                                });
                                attributesToDelete.forEach((attrToDelete) => {
                                    delete element.attributes[attrToDelete];
                                });
                            }
                        }
                    });
                }

                // this.instance.on( 'init', (args) => {
                //     ngModelCtrl.$setPristine();
                // });

                this.instance.on( 'change', this.deb);
                this.instance.on( 'afterCommandExec', this.deb);
                this.instance.on( 'resize', this.deb);
                this.instance.on( 'destroy', this.deb);
                this.instance.on( 'blur', (e) => {
                    this.instance.focusManager.blur();
                });
                this.instance.on( 'key', this._keyHandler , null, null, 31); //priority is after indent list plugin's event handler

                this._addInlineMention();

                if (this.mmsEditorApi) {
                    this.mmsEditorApi.save = () => {
                        this.update();
                    };
                }
                this.instance.on('fileUploadRequest', (evt) => {
                    var fileLoader = evt.data.fileLoader;
                    var formData = new FormData();
                    var xhr = fileLoader.xhr;

                    xhr.open( 'POST', this.uRLSvc.getPutArtifactsURL({projectId: this.mmsProjectId, refId: this.mmsRefId, elementId: this.utilsSvc.createMmsId().replace('MMS', 'VE')}), true );
                    //xhr.withCredentials = true;
                    xhr.setRequestHeader('Authorization', this.uRLSvc.getAuthorizationHeaderValue());
                    formData.append('file', fileLoader.file, fileLoader.fileName );
                    if (fileLoader.fileName) {
                        formData.append('name', fileLoader.fileName);
                    }

                    fileLoader.xhr.send( formData );

                    // Prevented the default behavior.
                    evt.stop();
                });
                this.instance.on( 'fileUploadResponse', ( evt ) => {
                    // Prevent the default response handler.
                    evt.stop();

                    // Get XHR and response.
                    var data = evt.data;
                    var xhr = data.fileLoader.xhr;
                    var response = JSON.parse(xhr.response);

                    if ( !response.elements || response.elements.length == 0 || !response.elements[0]._artifacts || response.elements[0]._artifacts.length == 0) {
                        // An error occurred during upload.
                        //data.message = response[ 1 ];
                        evt.cancel();
                    } else {
                        //TODO does this need to be smarter?
                        var element = response.elements[0];
                        data.url = this.uRLSvc.getArtifactEmbedURL({projectId: element._projectId, refId: element._refId, elementId: element.id}, element._artifacts[0].extension);
                    }
                } );
            }, 0, false);
        }

        $onDestroy() {
            if (!this.instance) {
                this.instance = this.cKEditor.instances[this.id];
            } else {
                this.mentionSvc.removeAllMentionForEditor(this.instance);
                this.instance.destroy();
                this.instance = null;
            }
        };

        public editing = (value?) => {
            return (value) ?  this.editValue = value : this.editValue;
        }


        public transcludeCallback = (ed) => {
            var tInstance = this.$uibModal.open({
                component: 'transcludeModal',
                resolve: {
                    editor: () => {
                        return this
                    },
                    viewLink: () => {
                        return false;
                    }
                },
                size: 'lg'
            });
            tInstance.result.then((tag) => {
                this._addWidgetTag(ed, tag);
            }, () => {
                var focusManager: CKEDITOR.focusManager = new this.cKEditor.focusManager( ed );
                focusManager.focus();
            });
        };

            // Controller for inserting view link
            // Defines scope variables for html template and how to handle user click
            // If user selects name or doc, link will be to first related doc
            // Also defines options for search interfaces -- see mmsSearch.js for more info



        public viewLinkCallback = (ed) => {
                var vInstance = this.$uibModal.open({
                    component: 'transcludeModal',
                    resolve: {
                        editor: () => {
                            return this
                        },
                        viewLink: () => {
                            return true;
                        }
                    },
                    size: 'lg'
                });
                vInstance.result.then((data) => {
                    this._addWidgetTag(ed, data.$value);
                });
            };

        public commentCallback = (ed) => {
            var cInstance = this.$uibModal.open({
                component: 'transcludeModal',
                resolve: {
                    editor: () => {
                        return this
                    },
                }
            });
            cInstance.result.then((tag) => {
                this._addWidgetTag(ed, tag);
            });
        };

        public resetCrossRef = (type, typeString) => {
            angular.forEach(type, (value, key) => {
                var transclusionObject = angular.element(value);
                var transclusionId = transclusionObject.attr('mms-element-id');
                var transclusionKey = this.utilsSvc.makeElementKey({elementId: transclusionId, projectId: this.mmsProjectId, refId: this.mmsRefId});
                var inCache: ElementObject = this.cacheSvc.get<ElementObject>(transclusionKey);
                if (inCache) {
                    transclusionObject.html('[cf:' + inCache.name + typeString);
                } else {
                    //TODO create Utils function to handle request objects
                    var reqOb = {elementId: transclusionId, projectId: this.mmsProjectId, refId: this.mmsRefId};
                    this.elementSvc.getElement(reqOb, 2)
                    .then((data) => {
                        transclusionObject.html('[cf:' + data.name + typeString);
                    }, (reason) => {
                        var error;
                        if (reason.status === 410)
                            error = 'deleted';
                        if (reason.status === 404)
                            error = 'not found';
                        transclusionObject.html('[cf:' + error + typeString);
                    });
                }
            });
        };

        public mmsResetCallback = (ed) => {
            var body = ed.document.getBody();
            this.resetCrossRef(body.find("mms-cf[mms-cf-type='name']").$, '.name]');
            this.resetCrossRef(body.find("mms-cf[mms-cf-type='doc']").$, '.doc]');
            this.resetCrossRef(body.find("mms-cf[mms-cf-type='val']").$, '.val]');
            this.resetCrossRef(body.find('mms-view-link').$, '.vlink]');
            this.update();
        };

        public update = () => {
            // getData() returns CKEditor's processed/clean HTML content.
            if (angular.isDefined(this.instance) && this.instance !== null)
                this.editing(this.instance.getData());
        };

        private _addWidgetTag = (editor, tag) => {
            editor.insertHtml( tag );
            this.utils.focusOnEditorAfterAddingWidgetTag(editor);
        }

        private _addInlineMention = () => {
            var keyupHandler;
            this.cKEditor.instances[this.id].on('contentDom', () => {
                keyupHandler = this.cKEditor.instances[this.instance.name].document.on('keyup', (e) => {
                    if(this._isMentionKey(e.data.$)) {
                        this.mentionSvc.createMention(this.instance, this.$scope.$new(), this.mmsProjectId, this.mmsRefId);
                    } else {
                        this.mentionSvc.handleInput(e, this.instance, this.mmsProjectId, this.mmsRefId);
                    }
                });
            });

            this.cKEditor.instances[this.id].on('contentDomUnload', () => {
                if (keyupHandler) {
                    keyupHandler.removeListener();
                }
            });
        }

        private _keyHandler = (e) => {
            if (this._isMentionKey(e.data.domEvent.$)) {
                return false; // to prevent "@" from getting written to the editor
            }

            // when tab is pressed or any of these special keys is pressed while the mention results show up, ignore default ckeditor's behaviour
            var ignoreDefaultBehaviour = this._isTabKey(e) || (this._isSpecialKey(e) && this.mentionSvc.hasMentionResults(this.instance) );
            if ( ignoreDefaultBehaviour ) {
                e.cancel(); e.stop();
            }

            if (this._isTabKey(e) && !this._isShiftKeyOn(e.data.domEvent.$)) {
                this.instance.insertHtml('&nbsp;&nbsp;&nbsp;&nbsp;');
            }

            if (!ignoreDefaultBehaviour) {
                this.deb(e);
            }
        }

            // 13 = enter, 38 = up arrow, 40 = down arrow
         private _isSpecialKey = (event) => {
            var key = event.data.domEvent.$.which;
            return key === 13 || key === 38 || key === 40;
        }

         private _isTabKey = (event) => {
            return event.data.domEvent.$.which === 9;
        }

         private _isMentionKey = (keyboardEvent) => {
            return this._isShiftKeyOn(keyboardEvent) && keyboardEvent.key === '@';
        }

         private _isShiftKeyOn = (keyboardEvent) => {
            return keyboardEvent.shiftKey;
        }

         private _addContextMenuItems = (editor) => {
             this._addFormatAsCodeMenuItem(editor);
        }

         private _addFormatAsCodeMenuItem = (editor: CKEDITOR.editor) => {
            editor.addCommand('formatAsCode', {
                exec: (editor: CKEDITOR.editor) => {
                    var selected_text = editor.getSelection().getSelectedText();
                    var newElement = new this.cKEditor.dom.element("code");
                    newElement.addClass('inlineCode');
                    newElement.setText(selected_text);
                    editor.insertElement(newElement);
                    return true;
                }
            });
            editor.addMenuGroup('veGroup');
            editor.addMenuItem('formatAsCode', {
                label: 'Format as inline code',
                command: 'formatAsCode',
                group: 'veGroup',
                icon: 'codeSnippet'
            });
            editor.contextMenu.addListener((element) => {
                return {formatAsCode: this.cKEditor.TRISTATE_OFF};
            });
            editor.setKeystroke( this.cKEditor.CTRL + 75, 'formatAsCode' );
        }
}

let veEditorComponent: VeComponentOptions = {
    selector: 'veEditor',
    template: `<textarea id="{{$ctrl.id}}"></textarea>`,
    bindings: {
        editValue: "&",
        mmsElementId: "<",
        mmsProjectId: '@',
        mmsRefId: '@',
        autosaveKey: '@',
        mmsEditorType: '@',
        mmsEditorApi: '<?'
    },
    controller: VeEditorController
}

veCore.component(veEditorComponent.selector,veEditorComponent);
