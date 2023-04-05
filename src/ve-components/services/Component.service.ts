import $ from 'jquery'
import _ from 'lodash'

import { ConfirmDeleteModalResolveFn } from '@ve-app/main/modals/confirm-delete-modal.component'
import { SaveConflictResolveFn } from '@ve-components/diffs'
import { ViewController } from '@ve-components/presentations'
import { ITransclusion } from '@ve-components/transclusions'
import { ButtonBarApi } from '@ve-core/button-bar'
import { RootScopeService } from '@ve-utils/application'
import { AutosaveService, EventService } from '@ve-utils/core'
import {
    ApiService,
    CacheService,
    ElementService,
    PermissionsService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client'
import { ValueSpec } from '@ve-utils/utils'

import { PropertySpec, veComponents } from '@ve-components'

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular'
import { ComponentController } from '@ve-types/components'
import { EditingApi, EditingToolbar } from '@ve-types/core/editor'
import {
    ConstraintObject,
    ElementObject,
    ElementsRequest,
    ElementsResponse,
    ElementTaggedValueObject,
    ElementValueObject,
    ExpressionObject,
    InstanceValueObject,
    LiteralObject,
    SlotObject,
    TaggedValueObject,
    ValueObject,
    ViewObject,
} from '@ve-types/mms'
import { VeModalInstanceService, VeModalService, VeModalSettings } from '@ve-types/view-editor'

/**
 * @internal
 * @name ComponentService
 * @requires $q
 * @requires $uibModal
 * @requires $timeout
 * @requires $compile
 * @requires $window
 * @requires URLService
 * @requires CacheService
 * @requires ElementService
 * @requires AutosaveService
 * @requires _
 * * Utility methods for performing edit like behavior to a transclude element
 * WARNING These are intended to be internal utility functions and not designed to be used as api
 *
 */
export class ComponentService {
    static $inject = [
        '$q',
        '$timeout',
        '$compile',
        '$uibModal',
        'growl',
        'URLService',
        'CacheService',
        'ElementService',
        'ViewService',
        'PermissionsService',
        'RootScopeService',
        'EventService',
        'AutosaveService',
        'ApiService',
    ]

    constructor(
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private $compile: angular.ICompileService,
        private $uibModal: VeModalService,
        private growl: angular.growl.IGrowlService,
        private uRLSvc: URLService,
        private cacheSvc: CacheService,
        private elementSvc: ElementService,
        private viewSvc: ViewService,
        private permissionsSvc: PermissionsService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService,
        private autosaveSvc: AutosaveService,
        private apiSvc: ApiService
    ) {}

    public hasCircularReference = (ctrl: ITransclusion, curId: string, curType: string): boolean => {
        let curscope = ctrl.$scope
        while (curscope.$parent) {
            const parent = curscope.$parent
            if (curscope.$parent.$ctrl) {
                if (parent.$ctrl.mmsElementId === curId && parent.$ctrl.cfType === curType) return true
            }
            curscope = parent
        }
        return false
    }

    public clearAutosave = (autosaveKey: string, elementType: string): void => {
        if (elementType === 'Slot') {
            Object.keys(window.localStorage).forEach((key) => {
                if (key.indexOf(autosaveKey) !== -1) {
                    window.localStorage.removeItem(key)
                }
            })
        } else {
            window.localStorage.removeItem(autosaveKey)
        }
    }

    // var ENUM_ID = '_9_0_62a020a_1105704885400_895774_7947';
    // var ENUM_LITERAL = '_9_0_62a020a_1105704885423_380971_7955';

    public setupValEditFunctions(ctrl: { propertySpec: PropertySpec } & ITransclusion): void {
        ctrl.addValueTypes = {
            string: 'LiteralString',
            boolean: 'LiteralBoolean',
            integer: 'LiteralInteger',
            real: 'LiteralReal',
        }
        ctrl.addValue = (type: string): void => {
            let newValueSpec: ValueSpec
            let elementOb: LiteralObject<unknown> = {
                id: '',
                _projectId: ctrl.mmsProjectId,
                _refId: ctrl.mmsRefId,
                type: '',
            }
            switch (type) {
                case 'LiteralBoolean': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: false,
                        id: this.apiSvc.createUniqueId(),
                        ownerId: ctrl.element.id,
                    })
                    newValueSpec = new ValueSpec(elementOb)
                    break
                }
                case 'LiteralInteger': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: 0,
                        id: this.apiSvc.createUniqueId(),
                        ownerId: ctrl.element.id,
                    })
                    newValueSpec = new ValueSpec(elementOb)
                    break
                }
                case 'LiteralString': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: '',
                        id: this.apiSvc.createUniqueId(),
                        ownerId: ctrl.element.id,
                    })
                    newValueSpec = new ValueSpec(elementOb)
                    break
                }
                case 'LiteralReal': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: 0.0,
                        id: this.apiSvc.createUniqueId(),
                        ownerId: ctrl.element.id,
                    })
                    newValueSpec = new ValueSpec(elementOb)
                    break
                }
                default: {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: {},
                        id: this.apiSvc.createUniqueId(),
                        ownerId: ctrl.element.id,
                    })
                }
            }

            ctrl.editValues.push(newValueSpec)
            if (ctrl.element.type == 'Property' || ctrl.element.type == 'Port') {
                ctrl.edit.defaultValue = newValueSpec
            }
        }
        ctrl.addValueType = 'LiteralString'

        ctrl.addEnumerationValue = (): void => {
            let newValueSpec: InstanceValueObject | ElementValueObject = new ValueSpec({
                type: 'InstanceValue',
                instanceId: ctrl.propertySpec.options[0],
                _projectId: ctrl.mmsProjectId,
                _refId: ctrl.mmsRefId,
                id: this.apiSvc.createUniqueId(),
                ownerId: ctrl.element.id,
            })
            if (ctrl.propertySpec.isTaggedValue) {
                newValueSpec = new ValueSpec({
                    type: 'ElementValue',
                    elementId: ctrl.propertySpec.options[0],
                    _projectId: ctrl.mmsProjectId,
                    _refId: ctrl.mmsRefId,
                    id: this.apiSvc.createUniqueId(),
                    ownerId: ctrl.element.id,
                })
            }
            ctrl.editValues.push(newValueSpec)
            if (ctrl.element.type == 'Property' || ctrl.element.type == 'Port') {
                ctrl.edit.defaultValue = newValueSpec
            }
        }

        ctrl.removeVal = (i): void => {
            ctrl.editValues.splice(i, 1)
        }
    }

    public setupValCf(elementOb: ElementObject): ValueObject[] {
        if (elementOb.type === 'Property' || elementOb.type === 'Port') {
            if (elementOb.defaultValue) {
                return [elementOb.defaultValue] as ValueObject[]
            } else {
                return []
            }
        }
        if (elementOb.type === 'Slot') {
            return (elementOb as SlotObject).value
        }
        if (elementOb.type === 'Constraint' && elementOb.specification) {
            return [(elementOb as ConstraintObject).specification]
        }
        if (elementOb.type === 'Expression') {
            return (elementOb as ExpressionObject<ValueObject>).operand
        }
        const i = elementOb.type.indexOf('TaggedValue')
        if (i > 0) {
            let spoofType = ''
            const type = elementOb.type.slice(0, i)
            if (type === 'Element') {
                spoofType = 'ElementValue'
                elementOb.value = []
                for (const [index, val] of (elementOb as ElementTaggedValueObject).valueIds.entries()) {
                    ;(elementOb as ElementTaggedValueObject).value.push({
                        id: `${elementOb.id}-slotvalue-${index}-elementvalue`,
                        type: spoofType,
                        elementId: val,
                        _projectId: elementOb._projectId,
                        _refId: elementOb._refId,
                    } as ElementValueObject)
                }
            } else {
                spoofType = `Literal${type}`
                for (const val of (elementOb as TaggedValueObject).value) {
                    val.type = spoofType
                }
            }
            return (elementOb as TaggedValueObject).value
        }
    }

    /**
     * @name Utils#save
     * save edited element
     *
     * @param {ElementObject} edit the edit object to save
     * @param {EditingApi} [editorApi=null] optional editor api
     * @param {ComponentController} ctrl angular scope that has common functions
     * @param continueEdit
     * @return {Promise} promise would be resolved with updated element if save is successful.
     *      For unsuccessful saves, it will be rejected with an object with type and message.
     *      Type can be error or info. In case of conflict, there is an option to discard, merge,
     *      or force save. If the user decides to discord or merge, type will be info even though
     *      the original save failed. Error means an actual error occurred.
     */
    public save<T extends ElementObject>(
        edit: T,
        editorApi: EditingApi,
        ctrl: ComponentController<T>,
        continueEdit: boolean
    ): VePromise<T> {
        const deferred = this.$q.defer<T>()
        this.updateEditor(ctrl).then(
            (success) => {
                if (!success) {
                    this.handleError({
                        message: 'Problem Saving from Editor',
                        type: 'warning',
                    })
                }
                this.elementSvc.updateElement(edit, false, true).then(
                    (element: T) => {
                        deferred.resolve(element)
                        ctrl.values = this.setupValCf(ctrl.element)
                        const data = {
                            element: element,
                            continueEdit: continueEdit ? continueEdit : false,
                        }
                        this.eventSvc.$broadcast('element.updated', data)
                    },
                    (reason: VePromiseReason<ElementsResponse<T>>) => {
                        if (reason.status === 409) {
                            const latest = reason.data.elements[0]
                            const instance = this.$uibModal.open<SaveConflictResolveFn<T>, string>({
                                component: 'saveConflict',
                                size: 'lg',
                                resolve: {
                                    latest: () => {
                                        return latest
                                    },
                                },
                            })
                            instance.result.then(
                                (data) => {
                                    const choice = data
                                    if (choice === 'ok') {
                                        const reqOb = {
                                            elementId: latest.id,
                                            projectId: latest._projectId,
                                            refId: latest._refId,
                                            commitId: 'latest',
                                        }
                                        this.elementSvc.cacheElement(reqOb, latest, true)
                                        this.elementSvc.cacheElement(reqOb, latest, false)
                                    } else if (choice === 'force') {
                                        edit._modified = latest._modified
                                        this.save(edit, editorApi, ctrl, continueEdit).then(
                                            (resolved) => {
                                                deferred.resolve(resolved)
                                            },
                                            (error) => {
                                                deferred.reject(error)
                                            }
                                        )
                                    } else {
                                        deferred.reject({ type: 'cancel' })
                                    }
                                },
                                () => {
                                    this.handleError({
                                        message: 'An error occurred. Please try your request again',
                                        type: 'error',
                                    })
                                }
                            )
                        } else {
                            reason.type = 'error'
                            deferred.reject(reason)
                        }
                    }
                )
            },
            () => {
                this.handleError({
                    message: 'Error Saving from Editor; Please Retry',
                    type: 'error',
                })
            }
        )

        return deferred.promise
    }
    /**
     * @name Utils#hasEdits
     * whether editor object has changes compared to base element,
     * currently compares name, doc, property values, if element is not
     * editable, returns false
     *
     * @param {object} editOb edit object
     * @return {boolean} has changes or not
     */
    public hasEdits = (editOb: ElementObject): boolean => {
        editOb._commitId = 'latest'
        const cachedKey = this.apiSvc.makeCacheKey(this.apiSvc.makeRequestObject(editOb), editOb.id, false)
        const elementOb: ElementObject = this.cacheSvc.get<ElementObject>(cachedKey)
        if (editOb.name !== elementOb.name) {
            return true
        }
        if (editOb.documentation !== elementOb.documentation) {
            return true
        }
        if (
            (editOb.type === 'Property' || editOb.type === 'Port') &&
            !_.isEqual(editOb.defaultValue, elementOb.defaultValue)
        ) {
            return true
        } else if (editOb.type === 'Slot' && !_.isEqual(editOb.value, elementOb.value)) {
            return true
        } else if (editOb.type === 'Constraint' && !_.isEqual(editOb.specification, elementOb.specification)) {
            return true
        }
        return false
    }

    /**
     * @name Utils#revertEdits
     * reset editor object back to base element values for name, doc, values
     *
     * @param editValues
     * @param {object} editOb scope with common properties
     * @param {object} editorApi editor api to kill editor if reverting changes
     */
    public revertEdits(editValues: ValueObject[], editOb: ElementObject): ValueObject[] {
        editOb._commitId = 'latest'
        const cachedKey = this.apiSvc.makeCacheKey(this.apiSvc.makeRequestObject(editOb), editOb.id, false)
        const elementOb: ElementObject = this.cacheSvc.get<ElementObject>(cachedKey)

        if (elementOb.name) {
            editOb.name = elementOb.name
        }
        editOb.documentation = elementOb.documentation
        if (editOb.type === 'Property' || editOb.type === 'Port') {
            editOb.defaultValue = _.cloneDeep(elementOb.defaultValue)
            if (editOb.defaultValue) {
                editValues = [editOb.defaultValue]
            } else {
                editValues = []
            }
        } else if (editOb.type === 'Slot') {
            ;(editOb as SlotObject).value = _.cloneDeep((elementOb as SlotObject).value)
            editValues = (editOb as SlotObject).value
        } else if (editOb.type === 'Constraint' && editOb.specification) {
            ;(editOb as ConstraintObject).specification = _.cloneDeep((elementOb as ConstraintObject).specification)
            editValues = [(editOb as ConstraintObject).specification]
        }
        return editValues
    }

    public handleError<T>(reason: { message: string; type: 'error' | 'warning' | 'info' } | VePromiseReason<T>): void {
        if (reason.type === 'info') this.growl.info(reason.message)
        else if (reason.type === 'warning') this.growl.warning(reason.message)
        else if (reason.type === 'error') this.growl.error(reason.message)
    }

    /**
     * @name Utils#isEnumeration
     * Check if element is enumeration and if true get enumerable options
     *
     * @param {object} elementOb element object
     * @return {Promise} promise would be resolved with options and if object is enumerable.
     *      For unsuccessful saves, it will be rejected with an object with reason.
     */
    public isEnumeration(elementOb: ElementObject): VePromise<PropertySpec> {
        const deferred = this.$q.defer<PropertySpec>()
        if (elementOb.type === 'Enumeration') {
            const isEnumeration = true
            const reqOb: ElementsRequest<string> = {
                elementId: elementOb.id,
                projectId: elementOb._projectId,
                refId: elementOb._refId,
            }
            const query = {
                params: {
                    ownerId: elementOb.id,
                },
            }
            this.elementSvc.search<ElementObject>(reqOb, query).then(
                (val) => {
                    const newArray: ElementObject[] = []
                    // Filter for enumeration type
                    for (let i = 0; i < val.elements.length; i++) {
                        if (val.elements[i].type === 'EnumerationLiteral') {
                            newArray.push(val.elements[i])
                        }
                    }
                    newArray.sort((a, b) => {
                        return a.name.localeCompare(b.name)
                    })
                    deferred.resolve({
                        options: newArray,
                        isEnumeration: isEnumeration,
                    })
                },
                (reason) => {
                    deferred.reject(reason)
                }
            )
        } else {
            deferred.resolve({ options: [], isEnumeration: false })
        }
        return deferred.promise
    }

    public getPropertySpec(elementOb: ElementObject): VePromise<PropertySpec> {
        const deferred = this.$q.defer<PropertySpec>()
        let id: string = elementOb.typeId
        let isSlot = false
        let isEnumeration = false
        let isTaggedValue = false
        let options: ElementObject[] = []
        if (elementOb.type === 'Slot') {
            isSlot = true
            id = (elementOb as SlotObject).definingFeatureId
        }
        if (elementOb.type.includes('TaggedValue')) {
            isTaggedValue = true
            id = (elementOb as TaggedValueObject).tagDefinitionId
        }
        if (!id) {
            //no property type, will not be enum
            deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue })
            return deferred.promise
        }
        // Get defining feature or type info
        const reqOb = {
            elementId: id,
            projectId: elementOb._projectId,
            refId: elementOb._refId,
        }
        this.elementSvc.getElement(reqOb).then(
            (value) => {
                if (isSlot || isTaggedValue) {
                    if (!value.typeId) {
                        deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue })
                        return
                    }
                    //if it is a slot or tagged value check if the definition type is enumeration
                    reqOb.elementId = value.typeId
                    this.elementSvc.getElement(reqOb).then(
                        (val) => {
                            this.isEnumeration(val).then(
                                (enumValue: PropertySpec) => {
                                    if (enumValue.isEnumeration) {
                                        isEnumeration = enumValue.isEnumeration
                                        options = enumValue.options
                                    }
                                    deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue })
                                },
                                () => {
                                    deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue })
                                }
                            )
                        },
                        () => {
                            deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue })
                        }
                    )
                } else {
                    this.isEnumeration(value).then(
                        (enumValue) => {
                            if (enumValue.isEnumeration) {
                                isEnumeration = enumValue.isEnumeration
                                options = enumValue.options
                            }
                            deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue })
                        },
                        (reason) => {
                            deferred.reject(reason)
                        }
                    )
                }
            },
            (reason) => {
                deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue })
            }
        )
        return deferred.promise
    }

    /**
     * @name Utils#startEdit     * called by transcludes and section, adds the editor frame
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   isEditing - boolean
     *   commitId - calculated commit id
     *   isEnumeration - boolean
     *   recompileScope - child scope of directive scope
     *   skipBroadcast - boolean (whether to broadcast presentationElem.edit for keeping track of open edits)
     * sets these in the scope:
     *   edit - editable element object
     *   isEditing - true
     *   inPreviewMode - false
     *   editValues - array of editable values (for element that are of type Property, Slot, Port, Constraint)
     *
     * @param {ComponentController} ctrl scope of the transclude directives or view section directive
     * @param editCtrl
     * @param {object} domElement dom of the directive, jquery wrapped
     * @param {string} template template to compile
     * @param {boolean} doNotScroll whether to scroll to element
     */
    public startEdit(
        ctrl: ComponentController,
        isEditable: boolean,
        domElement: JQuery<HTMLElement>,
        template: string | angular.Injectable<(...args: any[]) => string>,
        doNotScroll
    ): void {
        if (
            isEditable &&
            !ctrl.isEditing &&
            ctrl.element &&
            ctrl.commitId === 'latest' &&
            this.permissionsSvc.hasBranchEditPermission(ctrl.element._projectId, ctrl.element._refId)
        ) {
            ctrl.editLoading = true
            const elementOb = ctrl.element
            const reqOb = {
                elementId: elementOb.id,
                projectId: elementOb._projectId,
                refId: elementOb._refId,
            }
            this.elementSvc
                .getElementForEdit(reqOb)
                .then(
                    (data) => {
                        ctrl.isEditing = true
                        ctrl.inPreviewMode = false
                        ctrl.edit = data

                        if (data.type === 'Property' || data.type === 'Port') {
                            if (ctrl.edit.defaultValue) {
                                ctrl.editValues = [ctrl.edit.defaultValue]
                            }
                        } else if (data.type === 'Slot') {
                            if (Array.isArray(data.value)) {
                                ctrl.editValues = (data as SlotObject).value
                            }
                        } else if (data.type.includes('TaggedValue')) {
                            if (Array.isArray(data.value)) {
                                ctrl.editValues = (data as TaggedValueObject).value
                            }
                        } else if (data.type === 'Constraint' && data.specification) {
                            ctrl.editValues = [(data as ConstraintObject).specification]
                        }
                        if (!ctrl.editValues) {
                            ctrl.editValues = []
                        }
                        /*
                if (ctrl.isEnumeration && ctrl.editValues.length === 0) {
                    ctrl.editValues.push({type: 'InstanceValue', instanceId: null});
                }
                */
                        if (template) {
                            domElement.empty()
                            let transcludeEl: JQuery<HTMLElement>
                            if (typeof template === 'string') {
                                transcludeEl = $(template)
                            } else {
                                this.growl.error('Editing is not supported for Injected Templates!')
                                return
                            }
                            domElement.append(transcludeEl)
                            this.$compile(transcludeEl)(ctrl.$scope)
                        }
                        if (!ctrl.skipBroadcast) {
                            // Broadcast message for the toolCtrl:
                            this.eventSvc.$broadcast('presentationElem.edit', ctrl.edit)
                        } else {
                            ctrl.skipBroadcast = false
                        }
                        if (!doNotScroll) {
                            this._scrollToElement(domElement)
                        }
                    },
                    (reason: VePromiseReason<ElementsResponse<ElementObject>>) => {
                        reason.type = 'error'
                        this.handleError(reason)
                    }
                )
                .finally(() => {
                    ctrl.editLoading = false
                })

            this.elementSvc.isCacheOutdated(ctrl.element).then(
                (data) => {
                    if (data.status && data.server._modified > data.cache._modified) {
                        this.handleError({
                            message: 'This element has been updated on the server',
                            type: 'warning',
                        })
                    }
                },
                (reason) => {
                    this.handleError(reason)
                }
            )
        }
    }

    /**
     * @name Utils#saveAction     * called by transcludes and section, saves edited element
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   elementSaving - boolean
     *   isEditing - boolean
     *   bbApi - button bar api - handles spinny
     * sets these in the scope:
     *   elementSaving - boolean
     *
     * @param {ComponentController} ctrl
     * @param {object} domElement dom of the directive, jquery wrapped
     * @param {boolean} continueEdit save and continue
     */
    public saveAction = (ctrl: ComponentController, domElement: JQuery, continueEdit: boolean): void => {
        if (ctrl.elementSaving) {
            this.growl.info('Please Wait...')
            return
        }
        this.clearAutosave(ctrl.element._projectId + ctrl.element._refId + ctrl.element.id, ctrl.edit.type)
        if (ctrl.bbApi) {
            if (!continueEdit) {
                ctrl.bbApi.toggleButtonSpinner('presentation-element-save')
            } else {
                ctrl.bbApi.toggleButtonSpinner('presentation-element-saveC')
            }
        }

        ctrl.elementSaving = true
        this.save(ctrl.edit, ctrl.editorApi, ctrl, continueEdit)
            .then(
                (data) => {
                    ctrl.elementSaving = false
                    if (!continueEdit) {
                        ctrl.isEditing = false
                        this.eventSvc.$broadcast('presentationElem.save', ctrl.edit)
                    }
                    if (!data) {
                        this.growl.info('Save Skipped (No Changes)')
                    } else {
                        this.growl.success('Save Successful')
                    }
                    //scrollToElement(domElement);
                },
                (reason) => {
                    ctrl.elementSaving = false
                    this.handleError(reason)
                }
            )
            .finally(() => {
                if (ctrl.bbApi) {
                    if (!continueEdit) {
                        ctrl.bbApi.toggleButtonSpinner('presentation-element-save')
                    } else {
                        ctrl.bbApi.toggleButtonSpinner('presentation-element-saveC')
                    }
                }
            })
    }

    /**
     * @name veUtils/directives.Utils#cancelAction     * called by transcludes and section, cancels edited element
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   edit - edit object
     *   elementSaving - boolean
     *   isEditing - boolean
     *   bbApi - button bar api - handles spinny
     * sets these in the scope:
     *   isEditing - false
     *
     * @param {object} ctrl scope of the transclude directives or view section directive
     * @param {object} recompile recompile function object
     * @param {object} domElement dom of the directive, jquery wrapped
     */
    public cancelAction(
        ctrl: ComponentController,
        recompile: (preview?) => void,
        domElement: JQuery<HTMLElement>
    ): void {
        if (ctrl.elementSaving) {
            this.growl.info('Please Wait...')
            return
        }
        const cancelCleanUp = (): void => {
            ctrl.isEditing = false
            this.revertEdits(ctrl.editValues, ctrl.edit)
            // Broadcast message for the ToolCtrl:
            this.eventSvc.$broadcast('presentationElem.cancel', ctrl.edit)
            recompile()
            // scrollToElement(domElement);
        }
        if (ctrl.bbApi) {
            ctrl.bbApi.toggleButtonSpinner('presentation-element-cancel')
        }
        // const cancelFn: () => VePromise<boolean> = (): VePromise<boolean> => {
        //     if (ctrl.editorApi && ctrl.editorApi.cancel) {
        //         return ctrl.editorApi.cancel()
        //     }
        //     return this.$q.resolve<boolean>(true)
        // }
        this.updateEditor(ctrl).then(
            (success) => {
                // Only need to confirm the cancellation if edits have been made:
                if (!success) {
                    this.handleError({
                        message: 'Problem Saving from Editor',
                        type: 'warning',
                    })
                }
                if (this.hasEdits(ctrl.edit)) {
                    const deleteOb: { type: string; element: ElementObject } = {
                        type: ctrl.edit.type,
                        element: ctrl.element,
                    }
                    const instance = this.deleteEditModal(deleteOb)
                    instance.result
                        .then(() => {
                            cancelCleanUp()
                        })
                        .finally(() => {
                            if (ctrl.bbApi) {
                                ctrl.bbApi.toggleButtonSpinner('presentation-element-cancel')
                            }
                        })
                } else {
                    cancelCleanUp()
                    if (ctrl.bbApi) {
                        ctrl.bbApi.toggleButtonSpinner('presentation-element-cancel')
                    }
                }
            },
            () => {
                this.handleError({
                    message: 'Error Saving from Editor; Please Retry',
                    type: 'error',
                })
            }
        )
    }

    public updateEditor(ctrl: ComponentController): VePromise<boolean> {
        if (ctrl.editorOptions && ctrl.editorOptions.callback) {
            return ctrl.editorOptions.callback()
        }
        return this.$q.resolve<boolean>(true)
    }

    public deleteEditModal(deleteOb: { type: string; element: ElementObject }): VeModalInstanceService<string> {
        const settings: VeModalSettings<ConfirmDeleteModalResolveFn> = {
            component: 'confirmDeleteModal',
            resolve: {
                getName: () => {
                    return `${deleteOb.type} ${deleteOb.element.id}`
                },
                getType: () => {
                    return 'edit'
                },
                finalize: () => {
                    return () => {
                        this.clearAutosave(
                            deleteOb.element._projectId + deleteOb.element._refId + deleteOb.element.id,
                            deleteOb.type
                        )
                        return this.$q.resolve()
                    }
                },
            },
        }
        return this.$uibModal.open<ConfirmDeleteModalResolveFn, string>(settings)
    }

    public deleteAction = (ctrl: ComponentController, bbApi: ButtonBarApi, section: ViewObject): void => {
        if (ctrl.elementSaving) {
            this.growl.info('Please Wait...')
            return
        }

        bbApi.toggleButtonSpinner('presentation-element-delete')
        const settings: VeModalSettings<ConfirmDeleteModalResolveFn> = {
            component: 'confirmDeleteModal',
            resolve: {
                getType: () => {
                    return ctrl.edit.type ? ctrl.edit.type : 'element'
                },
                getName: () => {
                    return ctrl.edit.name ? ctrl.edit.name : 'Element'
                },
                finalize: () => {
                    return () => {
                        this.clearAutosave(
                            ctrl.element._projectId + ctrl.element._refId + ctrl.element.id,
                            ctrl.edit.type
                        )
                        return this.$q.resolve()
                    }
                },
            },
        }
        const instance = this.$uibModal.open(settings)
        instance.result
            .then(() => {
                const viewOrSec = section ? section : ctrl.view
                const reqOb = {
                    elementId: viewOrSec.id,
                    projectId: viewOrSec._projectId,
                    refId: viewOrSec._refId,
                    commitId: 'latest',
                }
                this.viewSvc.removeElementFromViewOrSection(reqOb, ctrl.instanceVal).then(
                    (data) => {
                        if (
                            this.viewSvc.isSection(ctrl.instanceSpec) ||
                            this.viewSvc.isTable(ctrl.instanceSpec) ||
                            this.viewSvc.isFigure(ctrl.instanceSpec) ||
                            this.viewSvc.isEquation(ctrl.instanceSpec)
                        ) {
                            // Broadcast message to TreeCtrl:
                            this.eventSvc.$broadcast('viewctrl.delete.element', ctrl.instanceSpec)
                        }

                        this.eventSvc.$broadcast('content-reorder.refresh')

                        // Broadcast message for the ToolCtrl:
                        this.eventSvc.$broadcast('presentationElem.cancel', ctrl.edit)

                        this.growl.success('Remove Successful')
                    },
                    (reason) => this.handleError(reason)
                )
            })
            .finally(() => {
                ctrl.bbApi.toggleButtonSpinner('presentation-element-delete')
            })
    }

    /**
     * @name Utils#previewAction     * called by transcludes and section, previews edited element
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   edit - edit object
     *   elementSaving - boolean
     *   inPreviewMode - boolean
     *   isEditing - boolean
     *   bbApi - button bar api - handles spinny
     * sets these in the scope:
     *   skipBroadcast - true
     *   inPreviewMode - false
     *   isEditing - false
     *   elementSaving - false
     *
     * @param ctrl
     * @param {object} recompile recompile function object
     * @param {object} domElement dom of the directive, jquery wrapped
     */
    public previewAction(ctrl: ComponentController, recompile: () => void, domElement: JQuery<HTMLElement>): void {
        if (ctrl.elementSaving) {
            this.growl.info('Please Wait...')
            return
        }
        if (ctrl.edit && this.hasEdits(ctrl.edit) && !ctrl.inPreviewMode) {
            ctrl.skipBroadcast = true //preview next click to go into edit mode from broadcasting
            ctrl.inPreviewMode = true
            recompile()
        } else {
            //nothing has changed, cancel instead of preview
            if (ctrl.edit && ctrl.isEditing) {
                // Broadcast message for the ToolCtrl to clear out the tracker window:
                this.eventSvc.$broadcast('presentationElem.cancel', ctrl.edit)
                if (ctrl.element) {
                    recompile()
                }
            }
        }
        ctrl.isEditing = false
        ctrl.elementSaving = false
        this._scrollToElement(domElement)
    }

    public isDirectChildOfPresentationElementFunc(element: JQuery<HTMLElement>, mmsViewCtrl: ViewController): boolean {
        let parent = element[0].parentElement
        while (parent && parent.nodeName !== 'MMS-VIEW-PRESENTATION-ELEM' && parent.nodeName !== 'MMS-VIEW') {
            if (mmsViewCtrl.isTranscludedElement(parent.nodeName)) {
                return false
            }
            if (
                parent.nodeName === 'MMS-VIEW-TABLE' ||
                parent.nodeName === 'MMS-VIEW-LIST' ||
                parent.nodeName === 'MMS-VIEW-SECTION'
            )
                return false
            parent = parent.parentElement
        }
        return parent && parent.nodeName !== 'MMS-VIEW'
    }

    public hasHtml = (s: string): boolean => {
        return s.indexOf('<p>') !== -1
    }

    private _scrollToElement = (domElement: JQuery): void => {
        this.$timeout(
            () => {
                const el = domElement[0]
                if ($(domElement).isOnScreen()) return
                el.scrollIntoView()
            },
            500,
            false
        ).then(
            () => {
                /**/
            },
            () => {
                /**/
            }
        )
    }

    /**
     * @name Utils#reopenUnsavedElts     * called by transcludes when users have unsaved edits, leaves that view, and comes back to that view.
     * the editor will reopen if there are unsaved edits.
     * assumes no reload.
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   ve_edits - unsaved edits object
     *   startEdit - pop open the editor window
     * @param {ITransclusion} ctrl scope of the transclude directives or view section directive
     * @param {String} transcludeType name, documentation, or value
     */
    public reopenUnsavedElts = (ctrl: ITransclusion & EditingToolbar, transcludeType: string): void => {
        let unsavedEdits: { [p: string]: ElementObject } = {}
        if (this.autosaveSvc.openEdits() > 0) {
            unsavedEdits = this.autosaveSvc.getAll()
        }
        const key = ctrl.element.id + '|' + ctrl.element._projectId + '|' + ctrl.element._refId
        const thisEdits = unsavedEdits[key]
        if (!thisEdits || ctrl.commitId !== 'latest') {
            return
        }
        if (transcludeType === 'value') {
            if (ctrl.element.type === 'Property' || ctrl.element.type === 'Port') {
                if (
                    ctrl.element.defaultValue.value !== thisEdits.defaultValue.value ||
                    ctrl.element.defaultValue.instanceId !== thisEdits.defaultValue.instanceId
                ) {
                    ctrl.startEdit()
                }
            } else if (ctrl.element.type === 'Slot') {
                const valList1 = (thisEdits as SlotObject).value
                const valList2 = (ctrl.element as SlotObject).value

                // Check if the lists' lengths are the same
                if (valList1.length !== valList2.length) {
                    ctrl.startEdit()
                } else {
                    for (let j = 0; j < valList1.length; j++) {
                        if (
                            valList1[j].value !== valList2[j].value ||
                            valList1[j].instanceId !== valList2[j].instanceId
                        ) {
                            ctrl.startEdit()
                            break
                        }
                    }
                }
            }
        } else if (ctrl.element[transcludeType] !== thisEdits[transcludeType]) {
            ctrl.startEdit()
        }
    }
}

veComponents.service('ComponentService', ComponentService)
