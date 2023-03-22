import { ComponentService } from '@ve-components/services'
import { ToolbarService } from '@ve-core/toolbar'
import { UtilsService } from '@ve-utils/application'
import { AutosaveService, EventService } from '@ve-utils/core'
import {
    AuthService,
    ElementService,
    PermissionsService,
    ProjectService,
    URLService,
    UserService,
    ViewService,
} from '@ve-utils/mms-api-client'

import { PropertySpec, veComponents } from '@ve-components'

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular'
import { EditingApi } from '@ve-types/core/editor'
import {
    DocumentObject,
    ElementObject,
    ElementsRequest,
    ElementsResponse,
    LiteralObject,
    RefObject,
    UserObject,
    ValueObject,
    ViewObject,
} from '@ve-types/mms'

export interface SpecApi extends ElementsRequest<string> {
    rootId?: string
    refType: string
    displayOldSpec?: boolean | null
    relatedDocuments?: ViewObject[]
    propSpec?: PropertySpec
    typeClass?: string
    dataLink?: string
    qualifiedName?: string
}

export class SpecService implements angular.Injectable<any> {
    private element: ElementObject
    private document: DocumentObject
    private modifier: UserObject
    private ref: RefObject
    private values: ValueObject[]
    private edit: ElementObject
    private editing: boolean = false
    public editable: boolean
    private keeping: boolean = false
    private editorApi: EditingApi

    public specApi: SpecApi
    public tracker: {
        etrackerSelected?: string
    } = {}

    public editValues: ValueObject[] = []

    static $inject = [
        '$q',
        '$timeout',
        'growl',
        'ElementService',
        'ProjectService',
        'ViewService',
        'EventService',
        'ToolbarService',
        'AutosaveService',
        'ComponentService',
        'URLService',
        'AuthService',
        'UserService',
        'PermissionsService',
        'UtilsService',
    ]
    private ran: boolean
    private lastid: string
    private gettingSpec: boolean
    constructor(
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private projectSvc: ProjectService,
        private viewSvc: ViewService,
        private eventSvc: EventService,
        private toolbarSvc: ToolbarService,
        private autosaveSvc: AutosaveService,
        private componentSvc: ComponentService,
        private uRLSvc: URLService,
        private authSvc: AuthService,
        private userSvc: UserService,
        private permissionsSvc: PermissionsService,
        private utilsSvc: UtilsService
    ) {}

    /**
     * @name veComponents.component:mmsSpec#toggleEditing
     * toggles editor
     *
     * @return {boolean} toggle successful
     */
    public toggleEditing = (): boolean => {
        if (!this.editing) {
            if (this.editable) this.editing = true
            else return false
        } else {
            this.editing = false
        }
        return true
    }
    /**
     * @name veComponents.component:mmsSpec#setEditing
     * sets editor state
     *
     * @param {boolean} mode true or false
     * @return {boolean} set successful
     */
    public setEditing = (mode): boolean => {
        if (mode) {
            if (this.editable) this.editing = true
            else return false
        } else this.editing = false
        return true
    }
    /**
     * @name veComponents.component:mmsSpec#getEditing
     * get editor state
     *
     * @return {boolean} editor or not
     */
    public getEditing = (): boolean => {
        return this.editing
    }
    /**
     * @name veComponents.component:mmsSpec#getEdits
     * get current edit object
     *
     * @return {Object} may be null or undefined, if not, is
     *  current element object that can be edited (may include changes)
     */
    public getEdits = (): ElementObject => {
        return this.edit
    }

    public setEdits = (edit: ElementObject): void => {
        this.edit = edit
    }

    public getElement = (): ElementObject => {
        return this.element
    }

    public getDocument = (): DocumentObject => {
        return this.document
    }

    public getModifier = (): UserObject => {
        return this.modifier
    }

    public getValues(): ValueObject[] {
        return this.values
    }

    public getRef = (): RefObject => {
        return this.ref
    }

    public getTypeClass = (element: ElementObject): void => {
        // Get Type
        this.specApi.typeClass = this.utilsSvc.getElementTypeClass(element, this.viewSvc.getElementType(element))
    }

    public getQualifiedName(element: ElementObject): VePromise<boolean> {
        const deferred = this.$q.defer<boolean>()
        if (this.edit) element = this.edit
        const reqOb: ElementsRequest<string> = {
            commitId: element._commitId ? element._commitId : 'latest',
            projectId: element._projectId,
            refId: element._refId,
            elementId: element.id,
        }
        this.elementSvc.getElementQualifiedName(reqOb).then(
            (result) => {
                this.specApi.qualifiedName = result
                deferred.resolve(true)
            },
            (reason) => {
                deferred.reject(reason)
            }
        )
        return deferred.promise
    }

    public setElement = (): void => {
        this.specApi.relatedDocuments = null
        this.specApi.propSpec = {}

        this.ran = true
        this.lastid = this.specApi.elementId

        this.specApi.extended = !(this.specApi.commitId && this.specApi.commitId !== 'latest')

        this._updateElement()
    }

    private _updateElement = (): void => {
        const reqOb = Object.assign({}, this.specApi)
        this.elementSvc
            .getElement(reqOb, 2, false)
            .then(
                (data) => {
                    const promises: angular.IPromise<any>[] = []
                    if (data.id !== this.lastid) {
                        return
                    }
                    this.element = data
                    this.values = this.componentSvc.setupValCf(data)
                    promises.push(
                        this.userSvc.getUserData(data._modifier).then((result) => {
                            this.modifier = result
                        })
                    )
                    if (!this.specApi.commitId || this.specApi.commitId === 'latest') {
                        promises.push(
                            this.elementSvc
                                .search<ViewObject>(reqOb, {
                                    size: 1,
                                    params: {
                                        id: data.id,
                                        _projectId: data._projectId,
                                    },
                                })
                                .then((searchResultOb) => {
                                    if (data.id !== this.lastid) {
                                        return
                                    }
                                    const searchResult = searchResultOb.elements
                                    if (
                                        searchResult &&
                                        searchResult.length == 1 &&
                                        searchResult[0].id === data.id &&
                                        searchResult[0]._relatedDocuments &&
                                        searchResult[0]._relatedDocuments.length > 0
                                    ) {
                                        this.specApi.relatedDocuments = searchResult[0]._relatedDocuments
                                    }
                                })
                        )
                    }
                    if (this.specApi.rootId) {
                        const docReq: ElementsRequest<string> = {
                            elementId: this.specApi.rootId,
                            projectId: this.specApi.projectId,
                            refId: this.specApi.refId,
                            commitId: this.specApi.commitId ? this.specApi.commitId : 'latest',
                        }
                        promises.push(
                            this.viewSvc.getProjectDocument(docReq, 1).then((result) => {
                                this.document = result
                            })
                        )
                    }
                    if (
                        (this.specApi.commitId && this.specApi.commitId !== 'latest') ||
                        !this.permissionsSvc.hasBranchEditPermission(this.specApi.projectId, this.specApi.refId) ||
                        this.specApi.refType === 'Tag'
                    ) {
                        this.editable = false
                        this.edit = null
                        this.setEditing(false)
                    } else {
                        promises.push(
                            this.elementSvc.getElementForEdit(reqOb).then((data) => {
                                if (data.id !== this.lastid) return
                                this.edit = data
                                this.editable = true
                                if (!this.getKeepMode()) this.setEditing(false)
                                this.setKeepMode(false)
                                if (
                                    this.edit.type === 'Property' ||
                                    this.edit.type === 'Port' ||
                                    this.edit.type === 'Slot'
                                ) {
                                    // Array.isArray(this.specSvc.edit.value)) {
                                    if (this.edit.defaultValue) {
                                        this.setEditValues([this.edit.defaultValue])
                                    } else if (this.edit.value) {
                                        let values: ValueObject | ValueObject[] = (
                                            this.edit as LiteralObject<ValueObject>
                                        ).value
                                        if (!Array.isArray(values)) {
                                            values = [values]
                                        }
                                        this.setEditValues(values)
                                    } else this.setEditValues([])
                                    this.componentSvc.getPropertySpec(this.element).then(
                                        (value) => {
                                            this.specApi.propSpec.isEnumeration = value.isEnumeration
                                            this.specApi.propSpec.isSlot = value.isSlot
                                            this.specApi.propSpec.options = value.options
                                        },
                                        (reason) => {
                                            this.growl.error('Failed to get property spec: ' + reason.message)
                                        }
                                    )
                                }
                                if (this.edit.type === 'Constraint' && this.edit.specification) {
                                    this.setEditValues([this.edit.specification])
                                }
                            })
                        )
                    }
                    promises.push(
                        this.projectSvc.getRef(this.specApi.refId, this.specApi.projectId).then((result) => {
                            this.ref = result
                        })
                    )
                    this.getTypeClass(this.element)
                    promises.push(this.getQualifiedName(this.element))
                    this.specApi.dataLink =
                        this.uRLSvc.getRoot() +
                        '/projects/' +
                        this.element._projectId +
                        '/refs/' +
                        this.element._refId +
                        '/elements/' +
                        this.element.id +
                        '?commitId=' +
                        this.element._commitId +
                        '&token=' +
                        this.authSvc.getToken()

                    this.$q.allSettled(promises).then(
                        () => this.eventSvc.resolve<boolean>('spec.ready', true),
                        (reason: VePromiseReason<unknown>) => {
                            this.growl.error('Getting Element Error: ' + reason.message)
                        }
                    )
                },
                (reason) => {
                    this.growl.error('Getting Element Error: ' + reason.message)
                }
            )
            .finally(() => {
                this.gettingSpec = false
            })
    }

    /**
     * @name Spec.service:SpecApi#hasEdits
     * whether editor object has changes compared to base element,
     * currently compares name, doc, property values, if element is not
     * editable, returns false
     *
     * @return {boolean} has changes or not
     */
    public hasEdits = (): boolean => {
        return this.componentSvc.hasEdits(this.edit)
    }

    public setEditValues<T extends ValueObject>(values: T[]): void {
        this.editValues.length = 0
        this.editValues.push(...values)
    }

    public setKeepMode = (value?: boolean): void => {
        if (value === undefined) {
            this.keepMode()
        }
        this.keeping = value
    }

    public getKeepMode = (): boolean => {
        return this.keeping
    }

    public keepMode = (): void => {
        this.keeping = true
    }

    public editorSave(): VePromise<boolean> {
        if (this.edit && this.editorApi.save) {
            return this.editorApi.save()
        }
        return this.$q.resolve(false)
    }

    revertEdits = (): void => {
        this.editValues = this.componentSvc.revertEdits(this.editValues, this.edit)
    }

    public save = (toolbarId: string, continueEdit: boolean): VePromise<void, ElementsResponse<ElementObject>> => {
        const deferred = this.$q.defer<void>()
        this.eventSvc.$broadcast('element-saving', true)
        const saveEdit = this.edit
        this.componentSvc.clearAutosave(saveEdit._projectId + saveEdit._refId + saveEdit.id, saveEdit.type)
        return new this.$q((resolve, reject) => {
            this._save().then(
                (data) => {
                    this.eventSvc.$broadcast('element-saving', false)
                    if (!data) {
                        this.growl.info('Save Skipped (No Changes)')
                    } else {
                        this.growl.success('Save Successful')
                    }
                    if (continueEdit) return
                    const saveEdit = this.getEdits()
                    const key = saveEdit.id + '|' + saveEdit._projectId + '|' + saveEdit._refId
                    this.autosaveSvc.remove(key)
                    if (this.autosaveSvc.openEdits() > 0) {
                        const next = Object.keys(this.autosaveSvc.getAll())[0]
                        const id = next.split('|')
                        this.tracker.etrackerSelected = next
                        this.keepMode()
                        this.specApi.elementId = id[0]
                        this.specApi.projectId = id[1]
                        this.specApi.refId = id[2]
                        this.specApi.commitId = 'latest'
                    } else {
                        this.setEditing(false)
                        this.cleanUpSaveAll(toolbarId)
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

    private _save(): VePromise<ElementObject> {
        return this.componentSvc.save(this.edit, this.editorApi, { element: this.element }, false)
    }

    // Check edit count and toggle appropriate save all and edit/edit-asterisk buttons
    public cleanUpSaveAll = (toolbarId: string): void => {
        this.toolbarSvc.waitForApi(toolbarId).then(
            (api) => {
                if (this.autosaveSvc.openEdits() > 0) {
                    api.setPermission('spec-editor.saveall', true)
                    api.setIcon('spec-editor', 'fa-edit-asterisk')
                } else {
                    api.setPermission('spec-editor.saveall', false)
                    api.setIcon('spec-editor', 'fa-edit')
                }
            },
            (reason) => {
                this.growl.error(ToolbarService.error(reason))
            }
        )
    }
}

veComponents.service('SpecService', SpecService)
