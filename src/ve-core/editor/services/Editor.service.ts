import $ from 'jquery'
import _ from 'lodash'

import { ButtonBarApi } from '@ve-core/button-bar'
import { EditDialogService } from '@ve-core/editor/services/EditDialog.service'
import { ToolbarService } from '@ve-core/toolbar'
import { AutosaveService, EventService } from '@ve-utils/core'
import { ApiService, CacheService, ElementService, PermissionsService, ViewService } from '@ve-utils/mms-api-client'
import { ValueService } from '@ve-utils/mms-api-client/Value.service'

import { veCore } from '@ve-core'

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular'
import { ComponentController } from '@ve-types/components'
import {
    ConstraintObject,
    ElementObject,
    ElementsResponse,
    SlotObject,
    TaggedValueObject,
    ValueObject,
    ViewObject,
} from '@ve-types/mms'

export class EditorService {
    public generatedIds: number = 0
    private ckEditor = window.CKEDITOR
    private edit2editor: { [autosaveKey: string]: string }
    public savingAll: boolean = false

    constructor(
        private $q: VeQService,
        private growl: angular.growl.IGrowlService,
        private apiSvc: ApiService,
        private cacheSvc: CacheService,
        private permissionsSvc: PermissionsService,
        private elementSvc: ElementService,
        private valueSvc: ValueService,
        private viewSvc: ViewService,
        private toolbarSvc: ToolbarService,
        private editdialogSvc: EditDialogService,
        private eventSvc: EventService,
        private autosaveSvc: AutosaveService
    ) {}

    public get(autosaveKey: string): CKEDITOR.editor {
        if (this.edit2editor[autosaveKey]) return this.ckEditor.instances[this.edit2editor[autosaveKey]]
    }

    public getData(autosaveKey: string): string {
        if (this.edit2editor[autosaveKey]) return this.ckEditor.instances[autosaveKey].getData()
    }

    public add(autosaveKey: string, editorId: string): void {
        this.edit2editor[autosaveKey] = editorId
    }

    public remove(autosaveKey: string): void {
        if (this.edit2editor[autosaveKey]) this.ckEditor.instances[this.edit2editor[autosaveKey]].destroy()
        this.edit2editor[autosaveKey]
    }

    public getId(autosaveKey: string, field?: string): string {
        let id = autosaveKey
        if (field) id = `${id}-${field}`
        if (this.ckEditor.instances[id]) id = `${id}-${this.generatedIds++}`

        return id
    }
    public getAll(): { [autosaveKey: string]: CKEDITOR.editor } {
        return this.ckEditor.instances
    }
    public focusOnEditorAfterAddingWidgetTag(editor: CKEDITOR.editor): void {
        const element = editor.widgets.focused.element.getParent()
        editor.focusManager.focus(element)
    }

    public save = (
        saveEdit: ElementObject,
        continueEdit: boolean
    ): VePromise<void, ElementsResponse<ElementObject>> => {
        this.eventSvc.$broadcast('element-saving', true)
        const autoSaveKey = saveEdit._projectId + saveEdit._refId + saveEdit.id
        this.autosaveSvc.clearAutosave(autoSaveKey, saveEdit.type)
        return new this.$q((resolve, reject) => {
            this.save2(autoSaveKey).then(
                (data) => {
                    this.eventSvc.$broadcast('element-saving', false)
                    if (!data) {
                        this.growl.info('Save Skipped (No Changes)')
                    } else {
                        this.growl.success('Save Successful')
                    }

                    resolve()
                },
                (reason) => {
                    this.eventSvc.$broadcast('element-saving', false)
                    reject(reason)
                }
            )
        })
    }

    public saveAll = (): VePromise<void, void> => {
        if (this.savingAll) {
            this.growl.info('Please wait...')
            return this.$q.resolve()
        }
        if (this.autosaveSvc.openEdits() === 0) {
            this.growl.info('Nothing to save')
            return this.$q.resolve()
        }

        Object.values(this.autosaveSvc.getAll()).forEach((ve_edit: ElementObject) => {
            this.autosaveSvc.clearAutosave(ve_edit._projectId + ve_edit._refId + ve_edit.id, ve_edit.type)
        })

        this.savingAll = true
        return new this.$q((resolve, reject) => {
            this.elementSvc.updateElements(Object.values(this.autosaveSvc.getAll())).then((responses) => {
                responses.forEach((elementOb) => {
                    this.autosaveSvc.remove(elementOb.id + '|' + elementOb._projectId + '|' + elementOb._refId)
                    const data = {
                        element: elementOb,
                        continueEdit: false,
                    }
                    this.eventSvc.$broadcast('element.updated', data)
                })
                this.growl.success('Save All Successful')
                resolve()
            }, reject)
        })
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
    public save2<T extends ElementObject>(editKey: string, continueEdit: boolean): VePromise<T> {
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

                        ctrl.values = this.valueSvc.setupValCf(ctrl.element)
                        const data = {
                            element: element,
                            continueEdit: continueEdit ? continueEdit : false,
                        }
                        this.eventSvc.$broadcast('element.updated', data)
                        if (continueEdit) return
                        const key = edit.id + '|' + edit._projectId + '|' + edit._refId
                        this.autosaveSvc.remove(key)
                    },
                    (reason: VePromiseReason<ElementsResponse<T>>) => {
                        if (reason.status === 409) {
                            const latest = reason.data.elements[0]
                            const instance = this.editdialogSvc.saveConflictDialog(latest).result.then(
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
                                        this.save2(edit, editorApi, ctrl, continueEdit).then(
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
        this.autosaveSvc.clearAutosave(ctrl.element._projectId + ctrl.element._refId + ctrl.element.id, ctrl.edit.type)
        if (ctrl.bbApi) {
            if (!continueEdit) {
                ctrl.bbApi.toggleButtonSpinner('presentation-element-save')
            } else {
                ctrl.bbApi.toggleButtonSpinner('presentation-element-saveC')
            }
        }

        ctrl.elementSaving = true
        this.save2(ctrl.edit, ctrl.editorApi, ctrl, continueEdit)
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
                    this.editdialogSvc
                        .deleteEditModal(deleteOb)
                        .result.then(() => {
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

    public deleteAction = (ctrl: ComponentController, bbApi: ButtonBarApi, section: ViewObject): void => {
        if (ctrl.elementSaving) {
            this.growl.info('Please Wait...')
            return
        }

        bbApi.toggleButtonSpinner('presentation-element-delete')

        this.editdialogSvc
            .deleteConfirmModal(ctrl.edit, ctrl.element)
            .result.then(() => {
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
}

veCore.service('EditorService', EditorService)
