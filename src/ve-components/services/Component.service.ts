import angular, { Injectable } from 'angular'
import $ from 'jquery'

import { ConfirmDeleteModalResolveFn } from '@ve-app/main/modals/confirm-delete-modal.component'
import { SpecApi } from '@ve-components/spec-tools'
import { ITransclusion } from '@ve-components/transclusions'
import { ButtonBarApi } from '@ve-core/button-bar'
import { VeEditorApi } from '@ve-core/editor'
import {
    AuthService,
    CacheService,
    ElementService,
    PermissionsService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client'
import {
    AutosaveService,
    EventService,
    RootScopeService,
    UtilsService,
} from '@ve-utils/services'
import { ValueSpec } from '@ve-utils/utils'

import { veComponents } from '@ve-components'

import {
    ElementObject,
    PropertySpec,
    UserObject,
    ViewObject,
} from '@ve-types/mms'
import { VeModalService, VeModalSettings } from '@ve-types/view-editor'

export interface ExtensionController {
    element: ElementObject
    commitId: string
    edit: ElementObject
    view?: ViewObject
    instanceSpec?: ElementObject
    instanceVal?: any
    elementSaving: boolean
    bbApi?: ButtonBarApi
    editorApi?: VeEditorApi
    specApi?: SpecApi
    // isEnumeration: boolean,
    skipBroadcast: boolean
    isEditing: boolean
    inPreviewMode: boolean
    editValues: any[]
    $scope: angular.IScope
}

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
 *
 * @description
 * Utility methods for performing edit like behavior to a transclude element
 * WARNING These are intended to be internal utility functions and not designed to be used as api
 *
 */
export class ComponentService {
    //locals
    private addItemData

    static $inject = [
        '$q',
        '$uibModal',
        '$timeout',
        '$compile',
        '$window',
        'growl',
        'URLService',
        'CacheService',
        'ElementService',
        'ViewService',
        'UtilsService',
        'AuthService',
        'PermissionsService',
        'RootScopeService',
        'EventService',
        'AutosaveService',
    ]

    constructor(
        private $q: angular.IQService,
        private $uibModal: VeModalService,
        private $timeout: angular.ITimeoutService,
        private $compile: angular.ICompileService,
        private $window: angular.IWindowService,
        private growl: angular.growl.IGrowlService,
        private uRLSvc: URLService,
        private cacheSvc: CacheService,
        private elementSvc: ElementService,
        private viewSvc: ViewService,
        private utilsSvc: UtilsService,
        private authSvc: AuthService,
        private permissionsSvc: PermissionsService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService,
        private autosaveSvc: AutosaveService
    ) {}

    public hasCircularReference(
        ctrl: ITransclusion,
        curId: string,
        curType: string
    ) {
        let curscope = ctrl.$scope
        while (curscope.$parent) {
            const parent = curscope.$parent
            if (curscope.$parent.$ctrl) {
                if (
                    parent.$ctrl.mmsElementId === curId &&
                    parent.$ctrl.cfType === curType
                )
                    return true
            }
            curscope = parent
        }
        return false
    }

    public clearAutosave(autosaveKey: string, elementType: string) {
        if (elementType === 'Slot') {
            Object.keys(this.$window.localStorage).forEach((key) => {
                if (key.indexOf(autosaveKey) !== -1) {
                    this.$window.localStorage.removeItem(key)
                }
            })
        } else {
            this.$window.localStorage.removeItem(autosaveKey)
        }
    }

    // var ENUM_ID = '_9_0_62a020a_1105704885400_895774_7947';
    // var ENUM_LITERAL = '_9_0_62a020a_1105704885423_380971_7955';

    public setupValEditFunctions(ctrl: ITransclusion) {
        ctrl.addValueTypes = {
            string: 'LiteralString',
            boolean: 'LiteralBoolean',
            integer: 'LiteralInteger',
            real: 'LiteralReal',
        }
        ctrl.addValue = (type) => {
            let newValueSpec: ValueSpec
            let elementOb: ElementObject = {
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
                        id: this.utilsSvc.createMmsId(),
                        ownerId: ctrl.element.id,
                    })
                    newValueSpec = new ValueSpec(elementOb)
                    break
                }
                case 'LiteralInteger': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: 0,
                        id: this.utilsSvc.createMmsId(),
                        ownerId: ctrl.element.id,
                    })
                    newValueSpec = new ValueSpec(elementOb)
                    break
                }
                case 'LiteralString': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: '',
                        id: this.utilsSvc.createMmsId(),
                        ownerId: ctrl.element.id,
                    })
                    newValueSpec = new ValueSpec(elementOb)
                    break
                }
                case 'LiteralReal': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: 0.0,
                        id: this.utilsSvc.createMmsId(),
                        ownerId: ctrl.element.id,
                    })
                    newValueSpec = new ValueSpec(elementOb)
                    break
                }
                default: {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: {},
                        id: this.utilsSvc.createMmsId(),
                        ownerId: ctrl.element.id,
                    })
                }
            }

            ctrl.editValues.push(newValueSpec)
            if (
                ctrl.element.type == 'Property' ||
                ctrl.element.type == 'Port'
            ) {
                ctrl.edit.defaultValue = newValueSpec
            }
        }
        ctrl.addValueType = 'LiteralString'

        ctrl.addEnumerationValue = () => {
            const newValueSpec: ValueSpec = new ValueSpec({
                type: 'InstanceValue',
                instanceId: ctrl.options[0],
                _projectId: ctrl.mmsProjectId,
                _refId: ctrl.mmsRefId,
                id: this.utilsSvc.createMmsId(),
                ownerId: ctrl.element.id,
            })
            ctrl.editValues.push(newValueSpec)
            if (
                ctrl.element.type == 'Property' ||
                ctrl.element.type == 'Port'
            ) {
                ctrl.edit.defaultValue = newValueSpec
            }
        }

        ctrl.removeVal = (i) => {
            ctrl.editValues.splice(i, 1)
        }
    }

    public setupValCf(elementOb: ElementObject): any[] {
        if (elementOb.type === 'Property' || elementOb.type === 'Port') {
            if (elementOb.defaultValue) {
                return [elementOb.defaultValue]
            } else {
                return []
            }
        }
        if (elementOb.type === 'Slot') {
            return elementOb.value
        }
        if (elementOb.type === 'Constraint' && elementOb.specification) {
            return [elementOb.specification]
        }
        if (elementOb.type === 'Expression') {
            return elementOb.operand
        }
    }

    /**
     * @ngdoc function
     * @name Utils#save
     * @methodOf veComponents.ExtUtilsService
     *
     * @description
     * save edited element
     *
     * @param {ElementObject} edit the edit object to save
     * @param {VeEditorApi} [editorApi=null] optional editor api
     * @param {ExtensionController} ctrl angular scope that has common functions
     * @param continueEdit
     * @return {Promise} promise would be resolved with updated element if save is successful.
     *      For unsuccessful saves, it will be rejected with an object with type and message.
     *      Type can be error or info. In case of conflict, there is an option to discard, merge,
     *      or force save. If the user decides to discord or merge, type will be info even though
     *      the original save failed. Error means an actual error occurred.
     */
    public save(
        edit: ElementObject,
        editorApi: VeEditorApi,
        ctrl: { element: ElementObject; values?: any[] },
        continueEdit: boolean
    ) {
        const deferred = this.$q.defer()
        if (editorApi && editorApi.save) {
            editorApi.save()
        }
        this.elementSvc.updateElement(edit, false, true).then(
            (element) => {
                deferred.resolve(element)
                ctrl.values = this.setupValCf(ctrl.element)
                const data = {
                    element: element,
                    continueEdit: continueEdit ? continueEdit : false,
                }
                this.eventSvc.$broadcast('element.updated', data)
            },
            (reason) => {
                if (reason.status === 409) {
                    const latest = reason.data.elements[0]
                    const instance = this.$uibModal.open({
                        component: 'saveConflict',
                        size: 'lg',
                        resolve: {
                            latest: () => {
                                return latest
                            },
                        },
                    })
                    instance.result.then((data) => {
                        const choice = data.$value
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
                            edit._read = latest._read
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
                    })
                } else {
                    deferred.reject({ type: 'error', message: reason.message })
                }
            }
        )
        return deferred.promise
    }

    /**
     * @ngdoc function
     * @name Utils#hasEdits
     * @methodOf  veComponents.ExtUtilsService
     *
     * @description
     * whether editor object has changes compared to base element,
     * currently compares name, doc, property values, if element is not
     * editable, returns false
     *
     * @param {object} editOb edit object
     * @return {boolean} has changes or not
     */
    public hasEdits(editOb: ElementObject): boolean {
        editOb._commitId = 'latest'
        const cachedKey = this.apiSvc.makeCacheKey(
            this.utilsSvc.makeRequestObject(editOb)
        )
        const elementOb: ElementObject =
            this.cacheSvc.get<ElementObject>(cachedKey)
        if (editOb.name !== elementOb.name) {
            return true
        }
        if (editOb.documentation !== elementOb.documentation) {
            return true
        }
        if (
            (editOb.type === 'Property' || editOb.type === 'Port') &&
            !angular.equals(editOb.defaultValue, elementOb.defaultValue)
        ) {
            return true
        } else if (
            editOb.type === 'Slot' &&
            !angular.equals(editOb.value, elementOb.value)
        ) {
            return true
        } else if (
            editOb.type === 'Constraint' &&
            !angular.equals(editOb.specification, elementOb.specification)
        ) {
            return true
        }
        return false
    }

    /**
     * @ngdoc function
     * @name Utils#revertEdits
     * @methodOf veComponents.ExtUtilsService
     *
     * @description
     * reset editor object back to base element values for name, doc, values
     *
     * @param editValues
     * @param {object} editOb scope with common properties
     * @param {object} editorApi editor api to kill editor if reverting changes
     */
    public revertEdits(
        editValues: any[],
        editOb: ElementObject,
        editorApi?: VeEditorApi
    ) {
        // if (editorApi && editorApi.destroy) {
        //     editorApi.destroy();
        // }
        editOb._commitId = 'latest'
        const cachedKey = this.apiSvc.makeCacheKey(
            this.utilsSvc.makeRequestObject(editOb)
        )
        const elementOb: ElementObject =
            this.cacheSvc.get<ElementObject>(cachedKey)

        if (elementOb.name) {
            editOb.name = elementOb.name
        }
        editOb.documentation = elementOb.documentation
        if (editOb.type === 'Property' || editOb.type === 'Port') {
            editOb.defaultValue = JSON.parse(
                JSON.stringify(elementOb.defaultValue)
            )
            if (editOb.defaultValue) {
                editValues = [editOb.defaultValue]
            } else {
                editValues = []
            }
        } else if (editOb.type === 'Slot') {
            editOb.value = JSON.parse(JSON.stringify(elementOb.value))
            editValues = editOb.value
        } else if (editOb.type === 'Constraint' && editOb.specification) {
            editOb.specification = JSON.parse(
                JSON.stringify(elementOb.specification)
            )
            editValues = [editOb.specification]
        }
        return editValues
    }

    public handleError(reason: { type: string; message: any }) {
        if (reason.type === 'info') this.growl.info(reason.message)
        else if (reason.type === 'warning') this.growl.warning(reason.message)
        else if (reason.type === 'error') this.growl.error(reason.message)
    }

    /**
     * @ngdoc function
     * @name Utils#isEnumeration
     * @methodOf veComponents.ExtUtilsService
     *
     * @description
     * Check if element is enumeration and if true get enumerable options
     *
     * @param {object} elementOb element object
     * @return {Promise} promise would be resolved with options and if object is enumerable.
     *      For unsuccessful saves, it will be rejected with an object with reason.
     */
    public isEnumeration(
        elementOb: ElementObject
    ): angular.IPromise<PropertySpec> {
        const deferred: angular.IDeferred<PropertySpec> = this.$q.defer()
        if (elementOb.type === 'Enumeration') {
            const isEnumeration = true
            const reqOb = {
                elementId: elementOb.id,
                projectId: elementOb._projectId,
                refId: elementOb._refId,
                depth: 1,
            }
            this.elementSvc.getOwnedElements(reqOb).then(
                (val) => {
                    const newArray = []
                    // Filter for enumeration type
                    for (let i = 0; i < val.length; i++) {
                        if (val[i].type === 'EnumerationLiteral') {
                            newArray.push(val[i])
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

    public getPropertySpec(
        elementOb: ElementObject
    ): angular.IPromise<PropertySpec> {
        const deferred: angular.IDeferred<PropertySpec> = this.$q.defer()
        let id = elementOb.typeId
        let isSlot = false
        let isEnum = false
        let options = []
        if (elementOb.type === 'Slot') {
            isSlot = true
            id = elementOb.definingFeatureId
        }
        if (!id) {
            //no property type, will not be enum
            deferred.resolve({
                options: options,
                isEnumeration: isEnum,
                isSlot: isSlot,
            })
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
                if (isSlot) {
                    if (!value.typeId) {
                        deferred.resolve({
                            options: options,
                            isEnumeration: isEnum,
                            isSlot: isSlot,
                        })
                        return
                    }
                    //if it is a slot
                    reqOb.elementId = value.typeId
                    this.elementSvc
                        .getElement(reqOb) //this gets tyep of defining feature
                        .then((val) => {
                            this.isEnumeration(val).then(
                                (enumValue) => {
                                    if (enumValue.isEnumeration) {
                                        isEnum = enumValue.isEnumeration
                                        options = enumValue.options
                                    }
                                    deferred.resolve({
                                        options: options,
                                        isEnumeration: isEnum,
                                        isSlot: isSlot,
                                    })
                                },
                                (reason) => {
                                    deferred.resolve({
                                        options: options,
                                        isEnumeration: isEnum,
                                        isSlot: isSlot,
                                    })
                                }
                            )
                        })
                } else {
                    this.isEnumeration(value).then(
                        (enumValue) => {
                            if (enumValue.isEnumeration) {
                                isEnum = enumValue.isEnumeration
                                options = enumValue.options
                            }
                            deferred.resolve({
                                options: options,
                                isEnumeration: isEnum,
                                isSlot: isSlot,
                            })
                        },
                        (reason) => {
                            deferred.reject(reason)
                        }
                    )
                }
            },
            (reason) => {
                deferred.resolve({
                    options: options,
                    isEnumeration: isEnum,
                    isSlot: isSlot,
                })
            }
        )
        return deferred.promise
    }

    /**
     * @ngdoc function
     * @name Utils#startEdit
     * @methodOf veComponents.ExtUtilsService
     * @description
     * called by transcludes and section, adds the editor frame
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
     * @param {ExtensionController} ctrl scope of the transclude directives or view section directive
     * @param editCtrl
     * @param {object} domElement dom of the directive, jquery wrapped
     * @param {string} template template to compile
     * @param {boolean} doNotScroll whether to scroll to element
     */
    public startEdit(
        ctrl: ExtensionController,
        isEditable: boolean,
        domElement: JQuery<HTMLElement>,
        template: string | Injectable<(...args: any[]) => string>,
        doNotScroll
    ): void {
        if (
            isEditable &&
            !ctrl.isEditing &&
            ctrl.element &&
            ctrl.commitId === 'latest' &&
            this.permissionsSvc.hasProjectIdBranchIdEditPermission(
                ctrl.element._projectId,
                ctrl.element._refId
            )
        ) {
            const elementOb = ctrl.element
            const reqOb = {
                elementId: elementOb.id,
                projectId: elementOb._projectId,
                refId: elementOb._refId,
            }
            this.elementSvc.getElementForEdit(reqOb).then((data) => {
                ctrl.isEditing = true
                ctrl.inPreviewMode = false
                ctrl.edit = data

                if (data.type === 'Property' || data.type === 'Port') {
                    if (ctrl.edit.defaultValue) {
                        ctrl.editValues = [ctrl.edit.defaultValue]
                    }
                } else if (data.type === 'Slot') {
                    if (Array.isArray(data.value)) {
                        ctrl.editValues = data.value
                    }
                } else if (data.type === 'Constraint' && data.specification) {
                    ctrl.editValues = [data.specification]
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
                        this.growl.error(
                            'Editing is not supported for Injected Templates!'
                        )
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
            }, this.handleError)

            this.elementSvc.isCacheOutdated(ctrl.element).then((data) => {
                if (
                    data.status &&
                    data.server._modified > data.cache._modified
                ) {
                    this.growl.warning(
                        'This element has been updated on the server'
                    )
                }
            })
        }
    }

    /**
     * @ngdoc function
     * @name Utils#saveAction
     * @methodOf veComponents.ExtUtilsService
     * @description
     * called by transcludes and section, saves edited element
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   elementSaving - boolean
     *   isEditing - boolean
     *   bbApi - button bar api - handles spinny
     * sets these in the scope:
     *   elementSaving - boolean
     *
     * @param {ExtensionController} ctrl
     * @param {object} domElement dom of the directive, jquery wrapped
     * @param {boolean} continueEdit save and continue
     */
    public saveAction(
        ctrl: ExtensionController,
        domElement: JQuery,
        continueEdit
    ) {
        if (ctrl.elementSaving) {
            this.growl.info('Please Wait...')
            return
        }
        this.clearAutosave(
            ctrl.element._projectId + ctrl.element._refId + ctrl.element.id,
            ctrl.edit.type
        )
        if (ctrl.bbApi) {
            if (!continueEdit) {
                ctrl.bbApi.toggleButtonSpinner('presentation-element-save')
            } else {
                ctrl.bbApi.toggleButtonSpinner('presentation-element-saveC')
            }
        }

        ctrl.elementSaving = true

        const work = () => {
            this.save(ctrl.edit, ctrl.editorApi, ctrl, continueEdit)
                .then(
                    (data) => {
                        ctrl.elementSaving = false
                        if (!continueEdit) {
                            ctrl.isEditing = false
                            this.eventSvc.$broadcast(
                                'presentationElem.save',
                                ctrl.edit
                            )
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
                            ctrl.bbApi.toggleButtonSpinner(
                                'presentation-element-save'
                            )
                        } else {
                            ctrl.bbApi.toggleButtonSpinner(
                                'presentation-element-saveC'
                            )
                        }
                    }
                })
        }
        this.$timeout(work, 1000, false) //to give ckeditor time to save any changes
    }

    /**
     * @ngdoc function
     * @name veUtils/directives.Utils#cancelAction
     * @methodOf veUtils/directives.Utils
     * @description
     * called by transcludes and section, cancels edited element
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
        ctrl: ExtensionController,
        recompile: (preview?) => void,
        domElement: JQuery<HTMLElement>
    ) {
        if (ctrl.elementSaving) {
            this.growl.info('Please Wait...')
            return
        }
        const cancelCleanUp = () => {
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
        if (ctrl.editorApi && ctrl.editorApi.cancel) {
            ctrl.editorApi.cancel()
        }
        // Only need to confirm the cancellation if edits have been made:
        if (this.hasEdits(ctrl.edit)) {
            const deleteOb = {
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
                        ctrl.bbApi.toggleButtonSpinner(
                            'presentation-element-cancel'
                        )
                    }
                })
        } else {
            cancelCleanUp()
            if (ctrl.bbApi) {
                ctrl.bbApi.toggleButtonSpinner('presentation-element-cancel')
            }
        }
    }

    public deleteEditModal(deleteOb) {
        const settings: VeModalSettings = {
            component: 'confirmDeleteModal',
            resolve: <ConfirmDeleteModalResolveFn>{
                getName: () => {
                    return deleteOb.type + ' ' + deleteOb.element.id
                },
                getType: () => {
                    return 'edit'
                },
                finalize: () => {
                    return () => {
                        this.clearAutosave(
                            deleteOb.element._projectId +
                                deleteOb.element._refId +
                                deleteOb.element.id,
                            deleteOb.type
                        )
                        return this.$q.resolve(true)
                    }
                },
            },
        }
        return this.$uibModal.open(settings)
    }

    public deleteAction(
        ctrl: ExtensionController,
        bbApi: ButtonBarApi,
        section: ViewObject
    ) {
        if (ctrl.elementSaving) {
            this.growl.info('Please Wait...')
            return
        }

        bbApi.toggleButtonSpinner('presentation-element-delete')
        const settings: VeModalSettings = {
            component: 'confirmDeleteModal',
            resolve: <ConfirmDeleteModalResolveFn>{
                getType: () => {
                    return ctrl.edit.type ? ctrl.edit.type : 'element'
                },
                getName: () => {
                    return ctrl.edit.name ? ctrl.edit.name : 'Element'
                },
                finalize: () => {
                    return () => {
                        this.clearAutosave(
                            ctrl.element._projectId +
                                ctrl.element._refId +
                                ctrl.element.id,
                            ctrl.edit.type
                        )
                        return this.$q.resolve(true)
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
                this.viewSvc
                    .removeElementFromViewOrSection(reqOb, ctrl.instanceVal)
                    .then((data) => {
                        if (
                            this.viewSvc.isSection(ctrl.instanceSpec) ||
                            this.viewSvc.isTable(ctrl.instanceSpec) ||
                            this.viewSvc.isFigure(ctrl.instanceSpec) ||
                            this.viewSvc.isEquation(ctrl.instanceSpec)
                        ) {
                            // Broadcast message to TreeCtrl:
                            this.eventSvc.$broadcast(
                                'viewctrl.delete.element',
                                ctrl.instanceSpec
                            )
                        }

                        this.eventSvc.$broadcast('content-reorder.refresh')

                        // Broadcast message for the ToolCtrl:
                        this.eventSvc.$broadcast(
                            'presentationElem.cancel',
                            ctrl.edit
                        )

                        this.growl.success('Remove Successful')
                    }, this.handleError)
            })
            .finally(() => {
                ctrl.bbApi.toggleButtonSpinner('presentation-element-delete')
            })
    }

    /**
     * @ngdoc function
     * @name Utils#previewAction
     * @methodOf veComponents.ExtUtilsService
     * @description
     * called by transcludes and section, previews edited element
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
    public previewAction(
        ctrl: ExtensionController,
        recompile: () => void,
        domElement: JQuery<HTMLElement>
    ) {
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

    public isDirectChildOfPresentationElementFunc(element, mmsViewCtrl) {
        let parent = element[0].parentElement
        while (
            parent &&
            parent.nodeName !== 'MMS-VIEW-PRESENTATION-ELEM' &&
            parent.nodeName !== 'MMS-VIEW'
        ) {
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

    public hasHtml(s) {
        return s.indexOf('<p>') !== -1
    }

    private _scrollToElement(domElement: JQuery) {
        this.$timeout(
            () => {
                const el = domElement[0]
                if ($(domElement).isOnScreen()) return
                el.scrollIntoView()
            },
            500,
            false
        )
    }

    /**
     * @ngdoc method
     * @name Utils#reopenUnsavedElts
     * @methodOf veComponents.ExtUtilsService
     * @description
     * called by transcludes when users have unsaved edits, leaves that view, and comes back to that view.
     * the editor will reopen if there are unsaved edits.
     * assumes no reload.
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   ve_edits - unsaved edits object
     *   startEdit - pop open the editor window
     * @param {object} scope scope of the transclude directives or view section directive
     * @param {String} transcludeType name, documentation, or value
     */
    public reopenUnsavedElts(ctrl: ITransclusion, transcludeType) {
        let unsavedEdits = {}
        if (this.autosaveSvc.openEdits() > 0) {
            unsavedEdits = this.autosaveSvc.getAll()
        }
        const key =
            ctrl.element.id +
            '|' +
            ctrl.element._projectId +
            '|' +
            ctrl.element._refId
        const thisEdits = unsavedEdits[key]
        if (!thisEdits || ctrl.commitId !== 'latest') {
            return
        }
        if (transcludeType === 'value') {
            if (
                ctrl.element.type === 'Property' ||
                ctrl.element.type === 'Port'
            ) {
                if (
                    ctrl.element.defaultValue.value !==
                        thisEdits.defaultValue.value ||
                    ctrl.element.defaultValue.instanceId !==
                        thisEdits.defaultValue.instanceId
                ) {
                    ctrl.startEdit()
                }
            } else if (ctrl.element.type === 'Slot') {
                const valList1 = thisEdits.value
                const valList2 = ctrl.element.value

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

    public getModifier(modifier: string): angular.IPromise<UserObject> {
        return this.authSvc.getUserData(modifier)
    }
}

veComponents.service('ComponentService', ComponentService)
