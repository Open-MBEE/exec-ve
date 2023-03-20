import $ from 'jquery'
import _ from 'lodash'

import { InsertTransclusionData } from '@ve-components/transclusions'
import { MentionService } from '@ve-core/editor'
import { EditorService } from '@ve-core/editor/services/Editor.service'
import { ImageService } from '@ve-utils/application'
import {
    ApiService,
    CacheService,
    ElementService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client'

import { veCore } from '@ve-core'

import {
    VeComponentOptions,
    VeNgModelController,
    VeQService,
} from '@ve-types/angular'
import { InsertData, InsertResolveFn } from '@ve-types/components'
import { VeConfig } from '@ve-types/config'
import { EditingApi } from '@ve-types/core/editor'
import { ElementObject, ElementsResponse } from '@ve-types/mms'
import { VeModalService, VeModalSettings } from '@ve-types/view-editor'

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
export class EditorController implements angular.IComponentController {
    private veConfig: VeConfig = window.__env
    private ckEditor = window.CKEDITOR

    private ngModelCtrl: VeNgModelController<string>

    mmsProjectId: string
    mmsRefId: string
    private mmsEditorType: string
    private autosaveKey: string
    private mmsEditorApi: EditingApi

    private toolbar: Array<
        | string
        | string[]
        | {
              name: string
              items?: string[] | undefined
              groups?: string[] | undefined
          }
    >
    protected $transcludeEl: JQuery<HTMLElement>
    protected id: string
    private generatedIds: number = 0
    private instance: CKEDITOR.editor = null
    private deb: _.DebouncedFunc<(e) => void> = _.debounce((e) => {
        this.update().then(
            () => {
                /**/
            },
            () => {
                this.growl.error('Error saving editor content')
            }
        )
    }, 1000)

    private tokenStr: RegExp = new RegExp('([?&]token=[a-zA-Z0-9.]*)')

    static $inject = [
        '$compile',
        '$q',
        '$attrs',
        '$element',
        '$timeout',
        '$scope',
        '$uibModal',
        'growl',
        'CacheService',
        'ElementService',
        'ApiService',
        'ViewService',
        'URLService',
        'MentionService',
        'EditorService',
        'ImageService',
    ]

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
     * @param {CacheService} cacheSvc
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
        private cacheSvc: CacheService,
        private elementSvc: ElementService,
        private apiSvc: ApiService,
        private viewSvc: ViewService,
        private uRLSvc: URLService,
        private mentionSvc: MentionService,
        private editorSvc: EditorService,
        private imageSvc: ImageService
    ) {}
    //depends on angular bootstrap

    $onInit(): void {
        this.id = `mmsCkEditor${this.generatedIds++}`

        // Formatting editor toolbar
        const stylesToolbar = {
            name: 'styles',
            items: ['Styles', /*'Format',*/ 'FontSize', 'TextColor', 'BGColor'],
        }
        const basicStylesToolbar = {
            name: 'basicstyles',
            items: ['Bold', 'Italic', 'Underline', 'mmsExtraFormat'],
        }
        const clipboardToolbar = { name: 'clipboard', items: ['Undo', 'Redo'] }
        const justifyToolbar = {
            name: 'paragraph',
            items: ['JustifyLeft', 'JustifyCenter', 'JustifyRight'],
        }
        const editingToolbar = { name: 'editing', items: ['Find', 'Replace'] }
        const linksToolbar = { name: 'links', items: ['Link', 'Unlink', '-'] }
        const imageToolbar = { name: 'image', items: ['Image', 'Iframe'] }
        const listToolbar = {
            name: 'list',
            items: ['NumberedList', 'BulletedList', 'Outdent', 'Indent'],
        }
        const equationToolbar = {
            name: 'equation',
            items: ['Mathjax', 'SpecialChar'],
        }
        const sourceToolbar = {
            name: 'source',
            items: ['Maximize', 'Sourcedialog'],
        }
        const combinedToolbar = {
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
                'mmsExtraFeature',
            ],
        }
        const extrasToolbar = { name: 'extras', items: ['mmsExtraFeature'] }
        // var tableEquationToolbar = { name: 'tableEquation', items: ['Table', 'Mathjax', 'SpecialChar', '-']};

        let thisToolbar: Array<
            | string
            | string[]
            | {
                  name: string
                  items?: string[] | undefined
                  groups?: string[] | undefined
              }
        > = [
            stylesToolbar,
            basicStylesToolbar,
            justifyToolbar,
            listToolbar,
            linksToolbar,
            combinedToolbar,
            clipboardToolbar,
            editingToolbar,
            sourceToolbar,
        ]
        switch (this.mmsEditorType) {
            case 'TableT':
                //thisToolbar = [stylesToolbar, basicStylesToolbar, justifyToolbar, linksToolbar, tableEquationToolbar, dropdownToolbar, clipboardToolbar, editingToolbar, sourceToolbar];
                break
            case 'ListT':
                // TODO: Figure out why this doesnt work in typescript or how to make it work
                thisToolbar = [
                    stylesToolbar,
                    basicStylesToolbar,
                    justifyToolbar,
                    listToolbar,
                    linksToolbar,
                    equationToolbar,
                    extrasToolbar,
                    clipboardToolbar,
                    editingToolbar,
                    sourceToolbar,
                ]
                break
            case 'Equation':
                thisToolbar = [justifyToolbar, equationToolbar, sourceToolbar]
                break
            case 'Figure':
            case 'ImageT':
                thisToolbar = [justifyToolbar, imageToolbar, sourceToolbar]
                break
        }
        this.toolbar = thisToolbar
    }
    $postLink(): void {
        this.$timeout(
            () => {
                // Initialize ckeditor and set event handlers
                this.$element.empty()
                this.$transcludeEl = $(
                    '<textarea id="' + this.id + '"></textarea>'
                )
                this.$transcludeEl.val(this.ngModelCtrl.$modelValue)

                this.$element.append(this.$transcludeEl)
                this.$compile(this.$transcludeEl)(this.$scope)
                this.instance = this.ckEditor.replace(this.id, {
                    mmscf: { callbackModalFnc: this.transcludeCallback },
                    mmscomment: { callbackModalFnc: this.commentCallback },
                    mmsvlink: { callbackModalFnc: this.viewLinkCallback },
                    mmsreset: { callback: this.mmsResetCallback },
                    contentsCss: `${this.ckEditor.basePath}contents.css`,
                    toolbar: this.toolbar,
                })
                // Enable Autosave plugin only when provided with unique identifier (autosaveKey)
                if (this.autosaveKey) {
                    // Configuration for autosave plugin
                    this.instance.config.autosave = {
                        SaveKey: this.autosaveKey,
                        delay: 5,
                        NotOlderThen: 7200, // 5 days in minutes
                        enableAutosave: true,
                    }
                } else {
                    this.instance.config.autosave = { enableAutosave: false }
                }

                this.instance.on('instanceReady', () => {
                    addCkeditorHtmlFilterRule(this.instance)
                    this._addContextMenuItems(this.instance)
                    highlightActiveEditor(this.instance)
                })

                this.instance.on(
                    'toHtml',
                    () => {
                        this.instance.dataProcessor.dataFilter.addRules({
                            elements: {
                                // Adds the token to img's in the editor environment to allow images to be displayed while editor
                                $: (element: CKEDITOR.htmlParser.element) => {
                                    element
                                        .find(
                                            (
                                                el: CKEDITOR.htmlParser.element
                                            ) => {
                                                return (
                                                    el.name == 'img' &&
                                                    el.attributes[
                                                        'data-cke-saved-src'
                                                    ] &&
                                                    (el.attributes[
                                                        'data-cke-saved-src'
                                                    ].indexOf(
                                                        this.veConfig.apiUrl
                                                    ) > -1 ||
                                                        el.attributes[
                                                            'data-cke-saved-src'
                                                        ].indexOf('http') < 0)
                                                )
                                            },
                                            true
                                        )
                                        .forEach(
                                            (
                                                el: CKEDITOR.htmlParser.element
                                            ) => {
                                                el.attributes['src'] =
                                                    this.imageSvc.fixImgUrl(
                                                        el.attributes[
                                                            'data-cke-saved-src'
                                                        ],
                                                        true
                                                    )
                                                // el.attributes['src'] = el.attributes['data-cke-saved-src'];
                                            }
                                        )
                                },
                            },
                        })
                    },
                    null,
                    null,
                    9
                )

                this.instance.on('getData', () => {
                    this.instance.dataProcessor.htmlFilter.addRules({
                        elements: {
                            // Removes the token from the export src to prevent saving of token to server
                            $: (element: CKEDITOR.htmlParser.element) => {
                                element
                                    .find((el: CKEDITOR.htmlParser.element) => {
                                        return (
                                            el.name == 'img' &&
                                            el.attributes[
                                                'data-cke-saved-src'
                                            ] &&
                                            el.attributes[
                                                'data-cke-saved-src'
                                            ].indexOf(this.veConfig.apiUrl) > -1
                                        )
                                    }, true)
                                    .forEach(
                                        (el: CKEDITOR.htmlParser.element) => {
                                            el.attributes[
                                                'data-cke-saved-src'
                                            ] = this.imageSvc.fixImgUrl(
                                                el.attributes[
                                                    'data-cke-saved-src'
                                                ],
                                                false
                                            )
                                            // el.attributes['src'] = el.attributes['data-cke-saved-src'];
                                        }
                                    )
                            },
                        },
                    })
                })

                const highlightActiveEditor = (
                    instance: CKEDITOR.editor
                ): void => {
                    const activeEditorClass = 'actieditor'
                    $('transclude-doc')
                        .children('div')
                        .removeClass(activeEditorClass)
                    $(instance.element.$)
                        .closest('transclude-doc')
                        .children('div')
                        .addClass(activeEditorClass)

                    instance.on('focus', () => {
                        $('transclude-doc')
                            .children('div')
                            .removeClass(activeEditorClass)
                        $(instance.element.$)
                            .closest('transclude-doc')
                            .children('div')
                            .addClass(activeEditorClass)
                    })
                }

                const addCkeditorHtmlFilterRule = (
                    instance: CKEDITOR.editor
                ): void => {
                    instance.dataProcessor.htmlFilter.addRules({
                        elements: {
                            $: (element: CKEDITOR.htmlParser.element) => {
                                if (element.name === 'script') {
                                    element.remove()
                                    return
                                }

                                if (
                                    element.name.startsWith('transclude-') ||
                                    element.name.startsWith('present-') ||
                                    element.name.startsWith('view')
                                ) {
                                    if (
                                        element.name !== 'view-link' &&
                                        element.name !== 'transclusion' &&
                                        element.name !==
                                            'transclude-group-docs' &&
                                        element.name !==
                                            'transclude-diff-attr' &&
                                        element.name !== 'transclude-value-link'
                                    ) {
                                        element.replaceWithChildren()
                                        return
                                    }
                                }

                                const attributesToDelete = Object.keys(
                                    element.attributes
                                ).filter((attrKey) => {
                                    return attrKey.startsWith('ng-')
                                })
                                attributesToDelete.forEach((attrToDelete) => {
                                    delete element.attributes[attrToDelete]
                                })
                            },
                        },
                    })
                    instance.dataProcessor.dataFilter.addRules({
                        elements: {
                            $: (element: CKEDITOR.htmlParser.element) => {
                                if (element.name === 'script') {
                                    element.remove()
                                    return
                                }

                                if (
                                    element.name.startsWith('transclude-') ||
                                    element.name.startsWith('present-') ||
                                    element.name.startsWith('view')
                                ) {
                                    if (
                                        element.name !== 'view-link' &&
                                        element.name !==
                                            'transclude-group-docs' &&
                                        element.name !==
                                            'transclude-diff-merge-attr' &&
                                        element.name !== 'mms-value-link'
                                    ) {
                                        element.replaceWithChildren()
                                        return
                                    }
                                }

                                const attributesToDelete = Object.keys(
                                    element.attributes
                                ).filter((attrKey) => {
                                    return attrKey.startsWith('ng-')
                                })
                                attributesToDelete.forEach((attrToDelete) => {
                                    delete element.attributes[attrToDelete]
                                })
                            },
                        },
                    })
                }

                this.instance.on('init', (args) => {
                    this.ngModelCtrl.$setPristine()
                })

                this.instance.on('change', this.deb)
                this.instance.on('afterCommandExec', this.deb)
                this.instance.on('resize', this.deb)
                this.instance.on('destroy', this.deb)
                this.instance.on('blur', (e) => {
                    this.instance.focusManager.blur()
                })
                this.instance.on('key', this._keyHandler, null, null, 31) //priority is after indent list plugin's event handler

                this._addInlineMention()

                if (this.mmsEditorApi) {
                    this.mmsEditorApi.save = (): angular.IPromise<boolean> => {
                        return this.update()
                    }
                    this.mmsEditorApi.cancel =
                        (): angular.IPromise<boolean> => {
                            return this.update()
                        }
                }
                this.instance.on(
                    'fileUploadRequest',
                    (
                        evt: CKEDITOR.eventInfo<CKEDITOR.editor.events.fileUploadRequest>
                    ) => {
                        const fileLoader = evt.data.fileLoader
                        const formData = new FormData()
                        const xhr = fileLoader.xhr

                        xhr.open(
                            'POST',
                            this.uRLSvc.getPutArtifactsURL({
                                projectId: this.mmsProjectId,
                                refId: this.mmsRefId,
                                elementId: this.apiSvc
                                    .createUniqueId()
                                    .replace('MMS', 'VE'),
                            }),
                            true
                        )
                        //xhr.withCredentials = true;
                        xhr.setRequestHeader(
                            'Authorization',
                            this.uRLSvc.getAuthorizationHeaderValue()
                        )
                        formData.append(
                            'file',
                            fileLoader.file,
                            fileLoader.fileName
                        )
                        if (fileLoader.fileName) {
                            formData.append('name', fileLoader.fileName)
                        }

                        fileLoader.xhr.send(formData)

                        // Prevented the default behavior.
                        evt.stop()
                    }
                )
                this.instance.on(
                    'fileUploadResponse',
                    (
                        evt: CKEDITOR.eventInfo<CKEDITOR.editor.events.fileUploadRequest>
                    ) => {
                        // Prevent the default response handler.
                        evt.stop()

                        // Get XHR and response.
                        const data = evt.data
                        const xhr = data.fileLoader.xhr
                        const response: ElementsResponse<ElementObject> =
                            JSON.parse(
                                xhr.response as string
                            ) as ElementsResponse<ElementObject>

                        if (
                            !response.elements ||
                            response.elements.length == 0 ||
                            !response.elements[0]._artifacts ||
                            response.elements[0]._artifacts.length == 0
                        ) {
                            // An error occurred during upload.
                            //data.message = response[ 1 ];
                            evt.cancel()
                        } else {
                            //TODO does this need to be smarter?
                            const element = response.elements[0]
                            data.url = this.uRLSvc.getArtifactURL({
                                projectId: element._projectId,
                                refId: element._refId,
                                elementId: element.id,
                                artifactExtension:
                                    element._artifacts[0].extension,
                            })
                        }
                    }
                )
            },
            0,
            false
        ).then(
            () => {
                /* Do Nothing */
            },
            () => {
                /* Do Nothing */
            }
        )
    }

    $onDestroy(): void {
        if (!this.instance) {
            this.instance = this.ckEditor.instances[this.id]
        } else {
            this.mentionSvc.removeAllMentionForEditor(this.instance)
            this.instance.destroy()
            this.instance = null
        }
    }

    public transcludeCallback = (ed: CKEDITOR.editor): void => {
        const tSettings: VeModalSettings<
            InsertResolveFn<InsertTransclusionData>
        > = {
            component: 'transcludeModal',
            resolve: {
                getInsertData: (): InsertTransclusionData => {
                    return {
                        type: 'Transclusion',
                        viewLink: false,
                        addType: 'text',
                    }
                },
                getProjectId: () => {
                    return this.mmsProjectId
                },
                getRefId: () => {
                    return this.mmsRefId
                },
                getOrgId: () => {
                    return ''
                },
            },
            size: 'lg',
        }
        const tInstance = this.$uibModal.open<
            InsertResolveFn<InsertTransclusionData>,
            string
        >(tSettings)
        tInstance.result.then(
            (result) => {
                this._addWidgetTag(ed, result)
            },
            () => {
                const focusManager: CKEDITOR.focusManager =
                    new this.ckEditor.focusManager(ed)
                focusManager.focus()
            }
        )
    }

    // Controller for inserting view link
    // Defines scope variables for html template and how to handle user click
    // If user selects name or doc, link will be to first related doc
    // Also defines options for search interfaces -- see mmsSearch.js for more info

    public viewLinkCallback = (ed: CKEDITOR.editor): void => {
        const tSettings: VeModalSettings<
            InsertResolveFn<InsertTransclusionData>
        > = {
            component: 'transcludeModal',
            resolve: {
                getInsertData: (): InsertTransclusionData => {
                    return {
                        type: 'ViewLink',
                        viewLink: true,
                        addType: 'text',
                    }
                },
                getProjectId: () => {
                    return this.mmsProjectId
                },
                getRefId: () => {
                    return this.mmsRefId
                },
                getOrgId: () => {
                    return ''
                },
            },
            size: 'lg',
        }
        const tInstance = this.$uibModal.open<
            InsertResolveFn<InsertTransclusionData>,
            string
        >(tSettings)
        tInstance.result.then(
            (result) => {
                this._addWidgetTag(ed, result)
            },
            () => {
                const focusManager: CKEDITOR.focusManager =
                    new this.ckEditor.focusManager(ed)
                focusManager.focus()
            }
        )
    }

    public commentCallback = (ed: CKEDITOR.editor): void => {
        const cSettings: VeModalSettings<InsertResolveFn<InsertData>> = {
            component: 'insertElementModal',
            resolve: {
                getInsertData: (): InsertData => {
                    return {
                        type: 'Comment',
                        addType: 'item',
                    }
                },
                getProjectId: () => {
                    return this.mmsProjectId
                },
                getRefId: () => {
                    return this.mmsRefId
                },
                getOrgId: () => {
                    return ''
                },
            },
        }
        const cInstance = this.$uibModal.open<
            InsertResolveFn<InsertData>,
            ElementObject
        >(cSettings)

        cInstance.result.then(
            (data) => {
                const tag =
                    '<view-cf mms-cf-type="com" mms-element-id="' +
                    data.id +
                    '">comment:' +
                    data._creator +
                    '</view-cf>'
                this._addWidgetTag(ed, tag)
            },
            (reason) => {
                this.growl.error('Comment Error: ' + reason.message)
            }
        )
    }

    public resetCrossRef = (
        type: CKEDITOR.dom.node<Node>[],
        typeString: string
    ): void => {
        type.forEach((node, key) => {
            const value = node.$
            const transclusionObject = angular.element(value)
            const transclusionId = transclusionObject.attr('mms-element-id')
            const transclusionKey = this.apiSvc.makeCacheKey(
                {
                    projectId: this.mmsProjectId,
                    refId: this.mmsRefId,
                },
                transclusionId,
                false
            )
            const inCache: ElementObject =
                this.cacheSvc.get<ElementObject>(transclusionKey)
            if (inCache) {
                transclusionObject.html(`[cf:${inCache.name}${typeString}`)
            } else {
                //TODO create Utils function to handle request objects
                const reqOb = {
                    elementId: transclusionId,
                    projectId: this.mmsProjectId,
                    refId: this.mmsRefId,
                }
                this.elementSvc.getElement(reqOb, 2).then(
                    (data) => {
                        transclusionObject.html('[cf:' + data.name + typeString)
                    },
                    (reason) => {
                        let error: string
                        if (reason.status === 410) error = 'deleted'
                        if (reason.status === 404) error = 'not found'
                        transclusionObject.html('[cf:' + error + typeString)
                    }
                )
            }
        })
    }

    public mmsResetCallback = (ed: CKEDITOR.editor): void => {
        const body: CKEDITOR.dom.element = ed.document.getBody()
        this.resetCrossRef(
            body.find("view-cf[mms-cf-type='name']").toArray(),
            '.name]'
        )
        this.resetCrossRef(
            body.find("view-cf[mms-cf-type='doc']").toArray(),
            '.doc]'
        )
        this.resetCrossRef(
            body.find("view-cf[mms-cf-type='val']").toArray(),
            '.val]'
        )
        this.resetCrossRef(body.find('view-link').toArray(), '.vlink]')
        this.update().then(
            () => {
                /**/
            },
            () => {
                this.growl.error('Error saving editor content')
            }
        )
    }

    public update = (): angular.IPromise<boolean> => {
        // getData() returns CKEditor's processed/clean HTML content.
        if (this.instance)
            this.ngModelCtrl.$setViewValue(this.instance.getData())
        return this.$q.resolve<boolean>(true)
    }

    private _addWidgetTag = (editor: CKEDITOR.editor, tag: string): void => {
        editor.insertHtml(tag)
        this.editorSvc.focusOnEditorAfterAddingWidgetTag(editor)
    }

    private _addInlineMention = (): void => {
        let keyupHandler: CKEDITOR.listenerRegistration
        this.ckEditor.instances[this.id].on('contentDom', () => {
            keyupHandler = this.ckEditor.instances[
                this.instance.name
            ].document.on('keyup', (e) => {
                if (
                    this._isMentionKey(
                        (e.data as CKEDITOR.dom.node<KeyboardEvent>).$
                    )
                ) {
                    this.mentionSvc.createMention(
                        this.instance,
                        this.$scope.$new(),
                        this.mmsProjectId,
                        this.mmsRefId
                    )
                } else {
                    this.mentionSvc.handleInput(
                        e as CKEDITOR.eventInfo<
                            CKEDITOR.dom.event<KeyboardEvent>
                        >,
                        this.$scope.$new(),
                        this.instance,
                        this.mmsProjectId,
                        this.mmsRefId
                    )
                }
            })
        })

        this.ckEditor.instances[this.id].on('contentDomUnload', () => {
            if (keyupHandler) {
                keyupHandler.removeListener()
            }
        })
    }

    private _keyHandler = (
        e: CKEDITOR.eventInfo<CKEDITOR.editor.events.key>
    ): boolean => {
        if (this._isMentionKey(e.data.domEvent.$)) {
            return false // to prevent "@" from getting written to the editor
        }

        // when tab is pressed or any of these special keys is pressed while the mention results show up, ignore default ckeditor's behaviour
        const ignoreDefaultBehaviour =
            this._isTabKey(e) ||
            (this._isSpecialKey(e) &&
                this.mentionSvc.hasMentionResults(this.instance))
        if (ignoreDefaultBehaviour) {
            e.cancel()
            e.stop()
        }

        if (this._isTabKey(e) && !this._isShiftKeyOn(e.data.domEvent.$)) {
            this.instance.insertHtml('&nbsp;&nbsp;&nbsp;&nbsp;')
        }

        if (!ignoreDefaultBehaviour) {
            this.deb(e)
        }
        return true
    }

    // 13 = enter, 38 = up arrow, 40 = down arrow
    private _isSpecialKey = (
        event: CKEDITOR.eventInfo<CKEDITOR.editor.events.key>
    ): boolean => {
        const key = event.data.domEvent.$.which
        return key === 13 || key === 38 || key === 40
    }

    private _isTabKey = (
        event: CKEDITOR.eventInfo<CKEDITOR.editor.events.key>
    ): boolean => {
        return event.data.domEvent.$.which === 9
    }

    private _isMentionKey = (keyboardEvent: KeyboardEvent): boolean => {
        return this._isShiftKeyOn(keyboardEvent) && keyboardEvent.key === '@'
    }

    private _isShiftKeyOn = (keyboardEvent: KeyboardEvent): boolean => {
        return keyboardEvent.shiftKey
    }

    private _addContextMenuItems = (editor: CKEDITOR.editor): void => {
        this._addFormatAsCodeMenuItem(editor)
    }

    private _addFormatAsCodeMenuItem = (editor: CKEDITOR.editor): void => {
        editor.addCommand('formatAsCode', {
            exec: (editor: CKEDITOR.editor) => {
                const selected_text = editor.getSelection().getSelectedText()
                const newElement = new this.ckEditor.dom.element('code')
                newElement.addClass('inlineCode')
                newElement.setText(selected_text)
                editor.insertElement(newElement)
                return true
            },
        })
        editor.addMenuGroup('veGroup')
        editor.addMenuItem('formatAsCode', {
            label: 'Format as inline code',
            command: 'formatAsCode',
            group: 'group',
            icon: 'codeSnippet',
        })
        editor.contextMenu.addListener((element) => {
            return { formatAsCode: this.ckEditor.TRISTATE_OFF }
        })
        editor.setKeystroke(this.ckEditor.CTRL + 75, 'formatAsCode')
    }
}

const EditorComponent: VeComponentOptions = {
    selector: 'editor',
    template: `<textarea id="{{$ctrl.id}}"></textarea>`,
    require: {
        ngModelCtrl: '^ngModel',
    },
    bindings: {
        mmsElementId: '<',
        mmsProjectId: '@',
        mmsRefId: '@',
        autosaveKey: '@',
        mmsEditorType: '@',
        mmsEditorApi: '<?',
    },
    controller: EditorController,
}

veCore.component(EditorComponent.selector, EditorComponent)
