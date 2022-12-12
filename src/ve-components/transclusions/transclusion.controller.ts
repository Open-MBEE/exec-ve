import { IPaneScope } from '@openmbee/pane-layout'
import angular, { IComponentController, Injectable } from 'angular'
import $ from 'jquery'
import Rx from 'rx-lite'

import { ViewPresentationElemController } from '@ve-components/presentations/view-pe.component'
import { ViewController } from '@ve-components/presentations/view.component'
import { ComponentService, ExtensionService } from '@ve-components/services'
import {
    ButtonBarApi,
    ButtonBarService,
    IButtonBarButton,
} from '@ve-core/button-bar'
import { EditingApi } from '@ve-core/editor'
import { AuthService, ElementService } from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import {
    EventService,
    ImageService,
    MathJaxService,
    UtilsService,
} from '@ve-utils/services'
import { handleChange, onChangesCallback } from '@ve-utils/utils'

import { VePromise } from '@ve-types/angular'
import { ComponentController } from '@ve-types/components'
import {
    ElementObject,
    InstanceSpecObject,
    InstanceValueObject,
    PresentationInstanceObject,
    ValueObject,
    ViewObject,
} from '@ve-types/mms'

export interface ITransclusion
    extends IComponentController,
        ComponentController {
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

    save?(e?): void
    saveC?(e?): void
    cancel?(e?): void
    startEdit?(e?): void
    preview?(e?): void
    delete?(e?): void
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
 * @requires {MathJaxService} mathJaxSvc
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
export class Transclusion implements ITransclusion {
    //Regex
    fixPreSpanRegex: RegExp = /<\/span>\s*<mms-cf/g
    fixPostSpanRegex: RegExp = /<\/mms-cf>\s*<span[^>]*>/g
    emptyRegex: RegExp = /^\s*$/
    spacePeriod: RegExp = />(?:\s|&nbsp;)\./g
    spaceSpace: RegExp = />(?:\s|&nbsp;)(?:\s|&nbsp;)/g
    spaceComma: RegExp = />(?:\s|&nbsp;),/g

    //Required Controllers
    protected mmsViewCtrl: ViewController
    protected mmsViewPresentationElemCtrl: ViewPresentationElemController

    //Bindings
    mmsElementId: string
    mmsProjectId: string
    mmsRefId: string
    mmsCommitId: string
    mmsWatchId: string
    nonEditable: boolean
    mmsCfLabel: string
    mmsGenerateForDiff: boolean
    mmsCallback: () => void

    //Customizers
    public cfType: string
    protected cfTitle: string
    protected cfKind: string
    protected checkCircular: boolean

    //Locals
    protected isDirectChildOfPresentationElement: boolean

    public subs: Rx.IDisposable[]

    public commitId: string
    protected projectId: string
    protected refId: string

    public editorApi: EditingApi = {}
    public isEditing: boolean
    public inPreviewMode: boolean
    public elementSaving: boolean
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

    protected template: string | Injectable<(...args: unknown[]) => string>

    public bbApi: ButtonBarApi
    public bars: string[]
    protected buttons: IButtonBarButton[] = []

    public schema = 'cameo'

    public save?(e?): void
    public saveC?(e?): void
    public cancel?(e?): void
    public startEdit?(e?): void
    public preview?(e?): void
    public delete?(e?): void

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
        'AuthService',
        'EventService',
        'MathJaxService',
        'ExtensionService',
        'ButtonBarService',
        'ImageService',
    ]

    constructor(
        public $q: angular.IQService,
        public $scope: angular.IScope,
        protected $compile: angular.ICompileService,
        protected $element: JQuery<HTMLElement>,
        protected growl: angular.growl.IGrowlService,
        protected componentSvc: ComponentService,
        protected elementSvc: ElementService,
        protected utilsSvc: UtilsService,
        protected schemaSvc: SchemaService,
        protected authSvc: AuthService,
        protected eventSvc: EventService,
        protected mathJaxSvc: MathJaxService,
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
        this.config()
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
     * @name veComponents/Transclusion#config
     *     *
     * @protected
     */
    protected config: () => void = () => {
        /* Implement custom initialization logic here */
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

    public getContent = (
        preview?: boolean
    ): VePromise<string | HTMLElement[], string> => {
        return this.$q.resolve('Not Yet Implemented')
    }

    protected recompile = (preview?: boolean): void => {
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

    protected changeAction: onChangesCallback = (
        newVal,
        oldVal,
        firstChange
    ) => {
        if (this.clearWatch || !newVal || !this.mmsProjectId || firstChange) {
            return
        }
        if (!this.mmsWatchId && newVal) {
            this.clearWatch = true
        }
        if (this.checkCircular) {
            if (
                this.componentSvc.hasCircularReference(
                    this,
                    this.mmsElementId,
                    'doc'
                )
            ) {
                this.$element.html(
                    '<span class="ve-error">Circular Reference!</span>'
                )
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
                    this.componentSvc.reopenUnsavedElts(
                        this,
                        this.cfTitle.toLowerCase()
                    )

                    if (this.commitId === 'latest') {
                        this.subs.push(
                            this.eventSvc.$on(
                                'element.updated',
                                (data: {
                                    element: ElementObject
                                    continueEdit: boolean
                                }) => {
                                    const elementOb = data.element
                                    const continueEdit = data.continueEdit
                                    if (
                                        elementOb.id === this.element.id &&
                                        elementOb._projectId ===
                                            this.element._projectId &&
                                        elementOb._refId ===
                                            this.element._refId &&
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
                        '<annotation mms-req-ob="::reqOb" mms-recent-element="::recentElement" mms-type="::type" mms-cf-label="::cfLabel"></annotation>'
                    )
                    this.$element.append(this.$transcludeEl)
                    this.$compile(this.$transcludeEl)(
                        Object.assign(this.$scope.$new(), {
                            reqOb: reqOb,
                            recentElement: reason.recentVersionOfElement,
                            type: this.extensionSvc.AnnotationType,
                            cfLabel: this.mmsCfLabel,
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
        api.addButton(
            this.buttonBarSvc.getButtonBarButton(
                'presentation-element-preview',
                this
            )
        )
        api.addButton(
            this.buttonBarSvc.getButtonBarButton(
                'presentation-element-save',
                this
            )
        )
        api.addButton(
            this.buttonBarSvc.getButtonBarButton(
                'presentation-element-saveC',
                this
            )
        )
        api.addButton(
            this.buttonBarSvc.getButtonBarButton(
                'presentation-element-cancel',
                this
            )
        )
        api.addButton(
            this.buttonBarSvc.getButtonBarButton(
                'presentation-element-delete',
                this
            )
        )
        api.setPermission(
            'presentation-element-delete',
            this.isDirectChildOfPresentationElement
        )
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
