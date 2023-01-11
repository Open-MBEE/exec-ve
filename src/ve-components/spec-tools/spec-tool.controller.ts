import { IPaneScope } from '@openmbee/pane-layout'
import angular, { IComponentController, Injectable } from 'angular'
import Rx from 'rx-lite'

import { ComponentService } from '@ve-components/services'
import { ToolbarService, ToolbarApi } from '@ve-core/toolbar'
import {
    ApiService,
    AuthService,
    ElementService,
    PermissionsService,
    ProjectService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client'
import { EventService, UtilsService } from '@ve-utils/services'

import { SpecApi, SpecService } from './services/Spec.service'

import { VePromise, VeQService } from '@ve-types/angular'
import { ComponentController } from '@ve-types/components'
import { EditingApi } from '@ve-types/core/editor'
import {
    ElementObject,
    RefObject,
    ValueObject,
    ViewObject,
} from '@ve-types/mms'

export interface ISpecTool extends IComponentController, ComponentController {
    $scope: ISpecToolScope
    commitId: string
    specType: string
    edit: ElementObject
    element: ElementObject
    isEditing: boolean
    inPreviewMode: boolean
    skipBroadcast: boolean
    editValues: ValueObject[]
    values?: any[]
    addValueTypes?: object
    addValueType?: string
    //Functions
    editorApi?: EditingApi
    addValue?(type: string): void
    removeVal?(i: number): void
}

export interface ISpecToolScope extends IPaneScope {
    $ctrl?: ISpecTool
    $parent: ISpecToolScope
}

/**
 * @ngdoc component
 * @name veComponents/SpecTool
 * @type {ISpecTool}
 *
 * @requires {angular.IScope} $scope
 * @requires {angular.ICompileService} $compile
 * @requires {angular.IRootElementService} $element
 * @requires {angular.growl.IGrowlService} growl
 * @requires {Utils} utils
 * @requires {ElementService} elementSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc
 * @requires {ToolbarService} toolbarSvc
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
export class SpecTool implements ISpecTool {
    //Bindings
    // mmsBranches
    // mmsTags
    // mmsElementId;
    // mmsProjectId;
    // mmsRefId;
    // mmsCommitId;
    // mmsElement;

    //
    public specApi: SpecApi

    //Customizers
    public specType: string
    public specTitle: string

    public subs: Rx.IDisposable[]
    protected tbApi: ToolbarApi

    public commitId: string
    protected projectId: string
    protected refId: string

    public editorApi: EditingApi = {}
    public isEditing: boolean
    public isEnumeration: boolean
    public inPreviewMode: boolean
    public elementSaving: boolean
    public skipBroadcast: boolean

    protected noEdit
    protected mmsDisplayOldSpec

    protected ran = false
    protected lastid = null //race condition check
    protected gettingSpec = false
    protected isSlot: boolean = false
    public element: ElementObject
    public document: ViewObject
    public ref: RefObject
    public values: any[]
    public edit: ElementObject
    protected modifier
    protected relatedDocuments: null
    protected elementTypeClass: string
    protected options: any
    protected elementDataLink: string
    protected qualifiedName: string

    public editValues: any[]

    protected $transcludeEl: JQuery<HTMLElement>

    protected template: string | Injectable<(...args: any[]) => string>

    static $inject = [
        '$scope',
        '$element',
        '$q',
        'growl',
        'ComponentService',
        'URLService',
        'AuthService',
        'ElementService',
        'ProjectService',
        'UtilsService',
        'ApiService',
        'ViewService',
        'PermissionsService',
        'EventService',
        'SpecService',
        'ToolbarService',
    ]

    constructor(
        public $scope: angular.IScope,
        public $element: JQuery<HTMLElement>,
        protected $q: VeQService,
        protected growl: angular.growl.IGrowlService,
        protected componentSvc: ComponentService,
        protected uRLSvc: URLService,
        protected authSvc: AuthService,
        protected elementSvc: ElementService,
        protected projectSvc: ProjectService,
        protected utilsSvc: UtilsService,
        protected apiSvc: ApiService,
        protected viewSvc: ViewService,
        protected permissionsSvc: PermissionsService,
        protected eventSvc: EventService,
        protected specSvc: SpecService,
        protected toolbarSvc: ToolbarService
    ) {}

    $onInit(): void {
        this.eventSvc.$init(this)

        this.editValues = this.specSvc.editValues
        this.toolbarSvc.waitForApi('right-toolbar').then(
            (result) => {
                this.tbApi = result
                if (
                    this.tbApi.buttons
                        .map((value) => value.id)
                        .filter((value) => value === this.specType).length <
                        1 &&
                    window.__env &&
                    window.__env.enableDebug
                ) {
                    console.log(
                        'Spec View: ' +
                            this.specType +
                            'is missing a button definition'
                    )
                }
            },
            (reason) => {
                this.growl.error(reason.message)
            }
        )
        this.changeElement()

        this.subs.push(
            this.eventSvc.$on('element.selected', () => {
                if (this.edit && this.editorApi.save) {
                    void this.editorApi.save()
                }
            })
        )
        this.subs.push(this.eventSvc.$on('spec.ready', this.changeElement))
        this.subs.push(this.eventSvc.$on(this.specType, this.initCallback))
    }

    $onDestroy(): void {
        this.eventSvc.destroy(this.subs)
        this.destroy()
    }

    /**
     * @name veComponents/SpecTool#config
     *
     * Use this API to implement any tool-specific initialization steps that would normally be called in the $onInit callback
     *
     * @protected
     */
    protected config = (): void => {
        /* Implement any initialization Logic Here */
    }

    /**
     * @name veComponents/SpecTool#initCallback
     *
     * This API is called whenever the element of focus for the Spec Tool window is changed
     *
     * @protected
     */
    protected initCallback: () => void = () => {
        /* Implement any post initialization steps here */
    }

    /**
     * @name veComponents/SpecTool#destroy
     *
     * This API is for whenever custom logic is required during the $onDestroy lifecycle stage
     * (To reset Services, unregister listeners, etc).
     * @protected
     */
    protected destroy: () => void = () => {
        /* Implement any custom on destroy logic to unregister listeners etc */
    }

    public changeElement = (): void => {
        this.specApi = this.specSvc.specApi
        this.refId = this.specApi.refId
        this.projectId = this.specApi.projectId
        this.commitId = this.specApi.commitId
        this.modifier = this.specSvc.getModifier()
        this.qualifiedName = this.specApi.qualifiedName
        this.element = this.specSvc.getElement()
        this.document = this.specSvc.getDocument()
        this.values = this.specSvc.getValues()
        this.ref = this.specSvc.getRef()

        this.initCallback()
    }

    //Spec Tool Common API

    public copyToClipboard($event: JQuery.ClickEvent, selector: string): void {
        this.utilsSvc.copyToClipboard(
            this.$element.find<HTMLElement>(selector),
            $event
        )
    }

    public cleanupVal(obj: { value: unknown }): void {
        obj.value = parseInt(obj.value as string)
    }

    public propertyTypeClicked = (id: string): void => {
        const elementOb = {
            id: id,
            _projectId: this.element._projectId,
            _refId: this.element._refId,
        }
        this.eventSvc.$broadcast('element.selected', { elementOb: elementOb })
    }

    public addHtml(value: { value: string }): void {
        value.value = '<p>' + value.value + '</p>'
    }

    /**
     * @name veComponents.component:mmsSpec#save
     * save edited element
     *
     * @return {Promise} promise would be resolved with updated element if save is successful.
     *      For unsuccessful saves, it will be rejected with an object with type and message.
     *      Type can be error or info. In case of conflict, there is an option to discard, merge,
     *      or force save. If the user decides to discord or merge, type will be info even though
     *      the original save failed. Error means an actual error occured.
     */
    public save(): VePromise<ElementObject> {
        return this.componentSvc.save(this.edit, this.editorApi, this, false)
    }

    public hasHtml = (s: string): boolean => {
        return this.componentSvc.hasHtml(s)
    }
}
