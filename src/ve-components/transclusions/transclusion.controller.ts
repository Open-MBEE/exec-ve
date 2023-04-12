import { IPaneScope } from '@openmbee/pane-layout'
import $ from 'jquery'

import { ViewPresentationElemController } from '@ve-components/presentations/view-pe.component'
import { ViewController } from '@ve-components/presentations/view.component'
import { ComponentService, ExtensionService } from '@ve-components/services'
import { SpecTool } from '@ve-components/spec-tools'
import { ButtonBarApi, ButtonBarService, IButtonBarButton } from '@ve-core/button-bar'
import { ImageService, MathService, UtilsService } from '@ve-utils/application'
import { EventService } from '@ve-utils/core'
import { ElementService } from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import { handleChange, onChangesCallback } from '@ve-utils/utils'

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular'
import { ComponentController } from '@ve-types/components'
import { EditingToolbar, EditingApi } from '@ve-types/core/editor'
import {
    ElementObject,
    InstanceSpecObject,
    InstanceValueObject,
    PresentationInstanceObject, PresentTextObject,
    ValueObject,
    ViewObject,
} from '@ve-types/mms'

export interface ITransclusion extends angular.IComponentController, ComponentController {
    $scope: TranscludeScope
    mmsElementId: string
    mmsProjectId: string
    mmsRefId: string
    commitId: string
    cfType: string
    edit: ElementObject
    element: ElementObject
    isEditing: boolean
    inPreviewMode: boolean
    skipBroadcast: boolean
    addValueTypes?: object
    addValueType?: string
    recompileScope?: TranscludeScope
    values?: ValueObject[]
    //Functions
    editorApi?: EditingApi
    editValues?: ValueObject[]
    addValue?(type: string): void
    removeVal?(i: number): void
    addEnumerationValue?(): void
}

export interface ITransclusionComponentOptions extends VeComponentOptions {
    bindings: TranscludeDefaultBindings
}

interface TranscludeDefaultBindings {
    mmsElementId: '@'
    mmsProjectId: '@'
    mmsRefId: '@'
    mmsCommitId: '@'
    mmsWatchId: '<'
    mmsCfLabel: '@'
    mmsGenerateForDiff?: '<'
    noClick?: '<'
    nonEditable?: '<'
    [key: string]: string
}

export interface TranscludeScope extends IPaneScope {
    $ctrl?: ITransclusion
    $parent: TranscludeScope
}

/**
 * @ngdoc component
 * @name veComponents/Transclusion
 * @type {ITransclusion}
 *
 * @requires {angular.IScope} $scope
 * @requires {angular.ICompileService} $compile
 * @requires {angular.IRootElementService} $element
 * @requires {angular.growl.IGrowlService} growl
 * @requires {ComponentService} componentSvc
 * @requires {ElementService} elementSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc

 * @requires {AuthService} authSvc
 * @requires {EventService} eventSvc
 * @requires {ButtonBarService} buttonBarSvc
 * @requires {MathService} mathSvc
 * * Given an element id, puts in the element's documentation binding, if there's a parent
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 *
 * ## Example
 *  <pre>
 <transclude-doc mms-element-id="element_id"></transclude-doc>
 </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {bool} mmsWatchId set to true to not destroy element ID watcher
 * @param {boolean=false} nonEditable can edit inline or not
 */
export class Transclusion implements ITransclusion, EditingToolbar {
    //Regex
    fixPreSpanRegex: RegExp = /<\/span>\s*<view-cf/g
    fixPostSpanRegex: RegExp = /<\/view-cf>\s*<span[^>]*>/g
    emptyRegex: RegExp = /^\s*$/
    spacePeriod: RegExp = />(?:\s|&nbsp;)\./g
    spaceSpace: RegExp = />(?:\s|&nbsp;)(?:\s|&nbsp;)/g
    spaceComma: RegExp = />(?:\s|&nbsp;),/g

    //Required Controllers
    protected mmsViewCtrl: ViewController
    protected mmsViewPresentationElemCtrl: ViewPresentationElemController
    protected mmsSpecEditorCtrl: SpecTool

    //Bindings
    mmsElementId: string
    mmsProjectId: string
    mmsRefId: string
    mmsCommitId: string
    mmsWatchId: string
    nonEditable: boolean
    noClick: boolean
    mmsCfLabel: boolean
    mmsGenerateForDiff: boolean
    mmsCallback: () => void

    //Customizers
    public cfType: string
    protected cfTitle: string
    protected cfKind: string
    protected checkCircular: boolean

    //Locals
    protected isDirectChildOfPresentationElement: boolean
    protected editable: () => boolean = () => false

    public subs: Rx.IDisposable[]

    public commitId: string
    protected projectId: string
    protected refId: string

    public editorApi: EditingApi = {}
    public isEditing: boolean = false
    public inPreviewMode: boolean
    public elementSaving: boolean = false
    public editLoading: boolean = false
    public skipBroadcast: boolean
    protected clearWatch: boolean = false

    public edit: ElementObject
    public editValues: ValueObject[]
    public element: ElementObject
    protected type: string = ''
    protected editorType: string

    public view: ViewObject
    public instanceSpec: InstanceSpecObject
    public instanceVal: InstanceValueObject

    protected presentationElem: PresentationInstanceObject | ElementObject

    protected panelTitle: string
    protected panelType: string

    protected $transcludeEl: JQuery<HTMLElement>

    // Possible templates to manage api functions
    protected template: string | angular.Injectable<(...args: unknown[]) => string>
    protected editTemplate: string | angular.Injectable<(...args: unknown[]) => string>
    protected previewTemplate: string | angular.Injectable<(...args: unknown[]) => string>

    public bbApi: ButtonBarApi
    public bbId: string
    public bars: string[]
    protected buttons: IButtonBarButton[] = []

    public schema = 'cameo'

    //Default Toolbar Api
    /* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
    cancel(e?): void {}
    delete(e?): void {}
    preview(e?): void {}
    save(e?): void {}
    saveC(e?): void {}
    startEdit(e?): void {}
    /* eslint-enable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */

    static $inject: string[] = [
        '$q',
        '$scope',
        '$compile',
        '$element',
        'growl',
        'ComponentService',
        'ElementService',
        'UtilsService',
        'SchemaService',
        'EventService',
        'MathService',
        'ExtensionService',
        'ButtonBarService',
        'ImageService',
    ]

    constructor(
        public $q: VeQService,
        public $scope: angular.IScope,
        protected $compile: angular.ICompileService,
        protected $element: JQuery<HTMLElement>,
        protected growl: angular.growl.IGrowlService,
        protected componentSvc: ComponentService,
        protected elementSvc: ElementService,
        protected utilsSvc: UtilsService,
        protected schemaSvc: SchemaService,
        protected eventSvc: EventService,
        protected mathSvc: MathService,
        protected extensionSvc: ExtensionService,
        protected buttonBarSvc: ButtonBarService,
        protected imageSvc: ImageService
    ) {}

    $onInit(): void {
        this.eventSvc.$init(this)

        if ((this.$element.prop('tagName') as string).includes('mms')) {
            this.growl.warning(
                'mmsTransclude(*) Syntax is deprecated and will be removed in a future version' +
                    'please see the release documentation for further details'
            )
        }
        if (this.mmsViewCtrl) {
            this.view = this.mmsViewCtrl.getView()
            this.editable = this.mmsViewCtrl.isEditable
        }
        if (this.mmsSpecEditorCtrl && this.mmsSpecEditorCtrl.specApi.elementId === this.mmsElementId) {
            this.editable = (): boolean => this.mmsSpecEditorCtrl.specSvc.editable
        }
        if (this.mmsViewPresentationElemCtrl) {
            this.delete = (): void => {
                this.componentSvc.deleteAction(this, this.bbApi, this.mmsViewPresentationElemCtrl.getParentSection())
            }
            this.instanceSpec = this.mmsViewPresentationElemCtrl.getInstanceSpec()
            this.instanceVal = this.mmsViewPresentationElemCtrl.getInstanceVal()
            this.presentationElem = this.mmsViewPresentationElemCtrl.getPresentationElement()
            const isOpaque = this.instanceSpec.classifierIds &&
                this.instanceSpec.classifierIds.length > 0 &&
                this.schemaSvc
                    .getMap<string[]>('OPAQUE_CLASSIFIERS', this.schema)
                    .indexOf(this.instanceSpec.classifierIds[0]) >= 0
            if (!isOpaque && this.mmsElementId === (this.presentationElem as PresentTextObject).source && this.mmsElementId === this.instanceSpec.id) {
                this.isDirectChildOfPresentationElement = true
            }
        }
        if (this.editTemplate) {
            this.save = (e: JQuery.ClickEvent): void => {
                if (e) e.stopPropagation()
                this.componentSvc.saveAction(this, this.$element, false)
            }

            this.saveC = (): void => {
                this.componentSvc.saveAction(this, this.$element, true)
            }

            this.cancel = (e?: JQuery.ClickEvent): void => {
                if (e) e.stopPropagation()
                this.componentSvc.cancelAction(this, this.recompile, this.$element)
            }

            this.startEdit = (): void => {
                this.componentSvc.startEdit(this, this.editable(), this.$element, this.editTemplate, false)
            }

            this.preview = (): void => {
                this.componentSvc.previewAction(this, this.recompile, this.$element)
            }
        }
    }

    $onDestroy(): void {
        this.eventSvc.destroy(this.subs)
    }

    $onChanges(onChangesObj: angular.IOnChangesObject): void {
        this.watch(onChangesObj)
        handleChange(onChangesObj, 'mmsElementId', this.changeAction)
        handleChange(onChangesObj, 'mmsRefId', this.changeAction)
        handleChange(onChangesObj, 'mmsCommitId', this.changeAction)
    }

    $postLink(): void {
        this.changeAction(this.mmsElementId, '', false)
    }

    /**
     * @name veComponents/Transclusion/watch
     * Allows a transclusion to add its own custom watch behavior
     * which will be triggered by the Angular $onChanges lifecycle hook.
     *
     * @param {angular.IOnChangesObject} onChangesObj
     * @return void
     */
    protected watch: (onChangesObj: angular.IOnChangesObject) => void = () => {
        /* Implement custom watch logic here */
    }

    /**
     * @name veComponents/Transclusion#config
     *     *
     * @protected
     */
    protected destroy: () => void = () => {
        /* Implement Custom Destroy Logic Here */
    }

    public getContent = (preview?: boolean): VePromise<string | HTMLElement[], string> => {
        return this.$q.resolve('Not Yet Implemented')
    }

    protected recompile = (preview?: boolean): void => {
        this.defaultRecompile(preview)
    }

    public defaultRecompile = (preview?: boolean): void => {
        this.getContent(preview).then(
            (result) => {
                this.$element.empty()
                this.$transcludeEl = $(result)
                this.$element.append(this.$transcludeEl)
                this.$compile(this.$transcludeEl)(this.$scope.$new())
                if (this.mmsViewCtrl) {
                    this.mmsViewCtrl.elementTranscluded(this.element, this.type)
                }
                $(this.$element)
                    .find('img')
                    .each((index, element) => {
                        this.imageSvc.fixImgSrc($(element))
                    })
            },
            (reason) => {
                this.growl.error(`Transclusion Error: ${reason.message}`)
            }
        )
    }

    protected changeAction: onChangesCallback<string> = (newVal, oldVal, firstChange) => {
        if (!newVal || !this.mmsProjectId || firstChange || newVal === oldVal) {
            return
        }
        if (this.checkCircular) {
            if (this.componentSvc.hasCircularReference(this, this.mmsElementId, 'doc')) {
                this.$element.html('<span class="ve-error">Circular Reference!</span>')
                return
            }
        }
        this.projectId = this.mmsProjectId
        this.refId = this.mmsRefId ? this.mmsRefId : 'master'
        this.commitId = this.mmsCommitId ? this.mmsCommitId : 'latest'
        this.$element.html('(loading...)')
        this.$element.addClass('isLoading')
        const reqOb = {
            elementId: this.mmsElementId,
            projectId: this.projectId,
            refId: this.refId,
            commitId: this.commitId,
            //includeRecentVersionElement: true,
        }
        this.elementSvc
            .getElement(reqOb, 1, false)
            .then(
                (data) => {
                    this.element = data
                    if (!this.panelTitle) {
                        this.panelTitle = this.element.name + ' ' + this.cfTitle
                        this.panelType = this.cfKind
                    }
                    this.recompile()
                    this.componentSvc.reopenUnsavedElts(this, this.cfTitle.toLowerCase())

                    if (this.commitId === 'latest') {
                        this.subs.push(
                            this.eventSvc.$on(
                                'element.updated',
                                (data: { element: ElementObject; continueEdit: boolean }) => {
                                    const elementOb = data.element
                                    const continueEdit = data.continueEdit
                                    if (
                                        elementOb.id === this.element.id &&
                                        elementOb._projectId === this.element._projectId &&
                                        elementOb._refId === this.element._refId &&
                                        !continueEdit
                                    ) {
                                        this.element = elementOb
                                        this.recompile()
                                    }
                                }
                            )
                        )
                    }
                },
                (reason) => {
                    this.$element.empty()
                    //TODO: Add reason/errorMessage handling here.
                    this.$transcludeEl = $(
                        '<annotation mms-req-ob="::reqOb" mms-recent-element="::recentElement" mms-type="::type"></annotation>'
                    )
                    this.$element.append(this.$transcludeEl)
                    this.$compile(this.$transcludeEl)(
                        Object.assign(this.$scope.$new(), {
                            reqOb: reqOb,
                            recentElement: reason.recentVersionOfElement,
                            type: this.extensionSvc.AnnotationType,
                        })
                    )
                }
            )
            .finally(() => {
                this.$element.removeClass('isLoading')
                if (this.mmsCallback) this.mmsCallback()
            })
    }

    protected bbInit = (api: ButtonBarApi): void => {
        api.addButton(this.buttonBarSvc.getButtonBarButton('presentation-element-preview', this))
        api.addButton(this.buttonBarSvc.getButtonBarButton('presentation-element-save', this))
        api.addButton(this.buttonBarSvc.getButtonBarButton('presentation-element-saveC', this))
        api.addButton(this.buttonBarSvc.getButtonBarButton('presentation-element-cancel', this))
        api.addButton(this.buttonBarSvc.getButtonBarButton('presentation-element-delete', this))
        api.setPermission('presentation-element-delete', this.isDirectChildOfPresentationElement)
    }

    //Transclusion API

    protected hasHtml = (s: string): boolean => {
        return this.componentSvc.hasHtml(s)
    }

    protected cleanupVal(obj: { value: string | number }): void {
        obj.value = parseInt(obj.value as string)
    }

    protected addHtml(value: { value: string | number }): void {
        value.value = `<p>${value.value}</p>`
    }
}
