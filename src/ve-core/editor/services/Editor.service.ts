import $ from 'jquery'
import _ from 'lodash'

import { ButtonBarApi } from '@ve-core/button-bar'
import { EditorController } from '@ve-core/editor/editor.component'
import { EditDialogService } from '@ve-core/editor/services/EditDialog.service'
import { ToolbarService } from '@ve-core/toolbar'
import { CacheService, EditService, EventService } from '@ve-utils/core'
import { ApiService, ElementService, PermissionsService, ViewService } from '@ve-utils/mms-api-client'
import { ValueService } from '@ve-utils/mms-api-client/Value.service'

import { veCore } from '@ve-core'

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular'
import { ComponentController } from '@ve-types/components'
import { ConstraintObject, ElementObject, ElementsResponse, SlotObject, ValueObject, ViewObject } from '@ve-types/mms'

export class EditorService {
    public generatedIds: number = 0
    private ckEditor = window.CKEDITOR
    private edit2editor: { [autosaveKey: string]: { [editorId: string]: EditorController } }
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
        private autosaveSvc: EditService
    ) {}

    public get(autosaveKey: string): { [editorId: string]: EditorController } {
        return this.edit2editor[autosaveKey]
    }

    public updateAllData(autosaveKey: string): VePromise<void, string> {
        return new this.$q<void, string>((resolve, reject) => {
            if (this.edit2editor[autosaveKey]) {
                const promises: VePromise<void, string>[] = []
                for (const id of Object.keys(this.edit2editor[autosaveKey])) {
                    promises.push(this.edit2editor[autosaveKey][id].update())
                }
                this.$q.all(promises).then(resolve, reject)
            } else {
                reject({ status: 500, message: 'No editors present to update from' })
            }
        })
    }

    public add(autosaveKey: string, editorId: string, ctrl: EditorController): void {
        if (!this.edit2editor[autosaveKey]) this.edit2editor[autosaveKey] = {}
        this.edit2editor[autosaveKey][editorId] = ctrl
    }

    public remove(autosaveKey: string, editorId: string): void {
        if (this.edit2editor[autosaveKey] && this.edit2editor[autosaveKey][editorId]) {
            this.ckEditor.instances[editorId].destroy()
            delete this.edit2editor[autosaveKey][editorId]
            if (Object.keys(this.edit2editor[autosaveKey]).length === 0) {
                delete this.edit2editor[autosaveKey]
            }
        }
    }

    public createId(autosaveKey: string, field?: string): string {
        let id = autosaveKey
        if (field) id = `${id}-${field}`
        if (Object.keys(this.ckEditor.instances)) id = `${id}-${this.generatedIds++}`

        return id
    }
    public focusOnEditorAfterAddingWidgetTag(editor: CKEDITOR.editor): void {
        const element = editor.widgets.focused.element.getParent()
        editor.focusManager.focus(element)
    }

    public save = (autosaveKey: string, continueEdit: boolean): VePromise<void, ElementsResponse<ElementObject>> => {
        this.eventSvc.$broadcast('element-saving', true)
        const autoSaveKey = saveEdit._projectId + saveEdit._refId + saveEdit.id
        this.autosaveSvc.clearAutosave(autoSaveKey, saveEdit.type)
        return new this.$q((resolve, reject) => {
            this._save(autoSaveKey, continueEdit).then(
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
     * @param {string} editKey The autosave key that points to the object being saved
     * @param continueEdit
     * @return {Promise} promise would be resolved with updated element if save is successful.
     *      For unsuccessful saves, it will be rejected with an object with type and message.
     *      Type can be error or info. In case of conflict, there is an option to discard, merge,
     *      or force save. If the user decides to discord or merge, type will be info even though
     *      the original save failed. Error means an actual error occurred.
     */
    private _save<T extends ElementObject>(editKey: string, continueEdit?: boolean): VePromise<T> {
        return new this.$q<T>((resolve, reject) => {
            this.updateAllData(editKey).then(
                () => {
                    const edit = this.autosaveSvc.get(editKey)
                    this.elementSvc.updateElement(edit, false, true).then(
                        (element: T) => {
                            resolve(element)
                            const data = {
                                element: element,
                                continueEdit: continueEdit ? continueEdit : false,
                            }
                            this.eventSvc.$broadcast('element.updated', data)
                            if (continueEdit) return
                            this.autosaveSvc.remove(editKey)
                        },
                        (reason: VePromiseReason<ElementsResponse<T>>) => {
                            if (reason.status === 409) {
                                const latest = reason.data.elements[0]
                                this.editdialogSvc.saveConflictDialog(latest).result.then(
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
                                            this._save<T>(editKey, continueEdit).then(
                                                (resolved) => {
                                                    resolve(resolved)
                                                },
                                                (error) => {
                                                    reject(error)
                                                }
                                            )
                                        } else {
                                            reject({ status: 444, type: 'info', message: 'Save cancelled!' })
                                        }
                                    },
                                    () => {
                                        reject({
                                            status: 500,
                                            message: 'An error occurred. Please try your request again',
                                            type: 'error',
                                        })
                                    }
                                )
                            } else {
                                reason.type = 'error'
                                reject(reason)
                            }
                        }
                    )
                },
                () => {
                    reject({
                        status: 500,
                        message: 'Error Saving from Editor; Please Retry',
                        type: 'error',
                    })
                }
            )
        })
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
        this.elementSvc.getElement<ElementObject>(this.elementSvc.getElementRequest(editOb)).then(
            (elementOb) => {
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
            },
            () => {
                return false
            }
        )
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
        this.scrollToElement(domElement)
    }

    public scrollToElement = (domElement: JQuery): void => {
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
