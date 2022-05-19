import * as angular from 'angular'
import {Injectable} from 'angular'
import {
    AuthService,
    EditService,
    ElementService,
    EventService,
    PermissionsService, URLService,
    UtilsService, ViewService
} from "@ve-utils/services";
import {ToolbarService} from "@ve-ext/spec-tools";
import {ElementObject, ElementsRequest, PropertySpec, RequestObject} from "@ve-types/mms";
import {VeEditorApi} from "@ve-core/editor";
import {veExt, ExtUtilService, ExtensionController} from "@ve-ext";

export interface SpecApi extends ElementsRequest {
    elementId: string,
    refType: "Branch"| "Tag",
    displayOldSpec?: boolean | null
    relatedDocuments?: any
    modifier?: any;
    propSpec?: PropertySpec;
    typeClass?: string
    dataLink?: string
    qualifiedName?: string
}

export class SpecService implements Injectable<any> {
    private element: ElementObject;
    private values: any[];
    private edit: ElementObject;
    private editing: boolean = false;
    public editable: boolean;
    private keeping: boolean;
    private editorApi: VeEditorApi;

    public specApi: SpecApi

    public tracker: {
        etrackerSelected: any,
    };

    public editValues: any[] = [];

    static $inject = ['$q', '$timeout', 'growl', 'ElementService', 'ViewService', 'EventService', 'ToolbarService', 'EditService',
        'ExtUtilService', 'URLService', 'AuthService', 'PermissionsService', 'UtilsService']
    private ran: boolean;
    private lastid: string;
    private gettingSpec: boolean;
    constructor(private $q: angular.IQService, private $timeout: angular.ITimeoutService, private growl: angular.growl.IGrowlService,
                private elementSvc: ElementService, private viewSvc: ViewService, private eventSvc: EventService, private toolbarSvc: ToolbarService,
                private editSvc: EditService, private extUtilSvc: ExtUtilService, private uRLSvc: URLService, private authSvc: AuthService,
                private permissionsSvc: PermissionsService, private utilsSvc: UtilsService) {
    }

    /**
     * @ngdoc function
     * @name veExt.directive:mmsSpec#toggleEditing
     * @methodOf veExt.directive:mmsSpec
     *
     * @description
     * toggles editing
     *
     * @return {boolean} toggle successful
     */
    public toggleEditing() {
        if (!this.editing) {
            if (this.editable)
                this.editing = true;
            else
                return false;
        } else {
            this.editing = false;
        }
        return true;
    };
    /**
     * @ngdoc function
     * @name veExt.directive:mmsSpec#setEditing
     * @methodOf veExt.directive:mmsSpec
     *
     * @description
     * sets editing state
     *
     * @param {boolean} mode true or false
     * @return {boolean} set successful
     */
    public setEditing(mode) {
        if (mode) {
            if (this.editable)
                this.editing = true;
            else
                return false;
        } else
            this.editing = false;
        return true;
    };
    /**
     * @ngdoc function
     * @name veExt.directive:mmsSpec#getEditing
     * @methodOf veExt.directive:mmsSpec
     *
     * @description
     * get editing state
     *
     * @return {boolean} editing or not
     */
    public getEditing() {
        return this.editing;
    };
    /**
     * @ngdoc function
     * @name veExt.directive:mmsSpec#getEdits
     * @methodOf veExt.directive:mmsSpec
     *
     * @description
     * get current edit object
     *
     * @return {Object} may be null or undefined, if not, is
     *  current element object that can be edited (may include changes)
     */
    public getEdits() {
        return this.edit;
    };

    setEdits(edit: ElementObject) {
        this.edit = edit;
    }

    public getElement() {
        return this.element
    }

    public getValues() {
        return this.values;
    }

    public getModifier(modifier) {
        this.authSvc.getUserData(modifier).then((modifierData) =>{
            return modifierData.users[0];
        }, () => {
            return modifier;
        });
    };

    public getTypeClass(element: ElementObject) {
        // Get Type
        this.specApi.typeClass = this.utilsSvc.getElementTypeClass(element, this.viewSvc.getElementType(element));
    };

    public getQualifiedName() {
        let elementOb = this.element
        if (this.edit !== undefined)
            elementOb = this.edit
        const reqOb: ElementsRequest = {
            commitId: (elementOb._commitId) ? elementOb._commitId : "latest",
            projectId: elementOb._projectId,
            refId: elementOb._refId,
            elementId: elementOb.id
        }
        this.elementSvc.getElementQualifiedName(reqOb).then((result: string) => {
            this.specApi.qualifiedName = result;
        })
    }

    public setElement(): angular.IPromise<boolean> {

        this.specApi.relatedDocuments = null;
        this.specApi.propSpec = {}

        this.ran = true;
        this.lastid = this.specApi.elementId



        this.specApi.extended = !(this.specApi.commitId && this.specApi.commitId !== 'latest');

        return this._updateElement()
    }

    private _updateElement(): angular.IPromise<boolean> {
        const deferred: angular.IDeferred<boolean> = this.$q.defer()
        const reqOb: ElementsRequest = Object.assign({}, this.specApi);
            this.elementSvc.getElement(reqOb, 2, false).then((data) => {
                if (data.id !== this.lastid) {
                    return;
                }
                this.element = data;
                this.values = this.extUtilSvc.setupValCf(data);
                this.specApi.modifier = this.getModifier(data._modifier);
                if (!this.specApi.commitId || this.specApi.commitId === 'latest') {
                    this.elementSvc.search(reqOb, {
                        size: 1,
                        params: {id: data.id, _projectId: data._projectId}
                    }, 2).then((searchResultOb) => {
                        if (data.id !== this.lastid) {
                            return;
                        }
                        var searchResult = searchResultOb.elements;
                        if (searchResult && searchResult.length == 1 && searchResult[0].id === data.id && searchResult[0]._relatedDocuments && searchResult[0]._relatedDocuments.length > 0) {
                            this.specApi.relatedDocuments = searchResult[0]._relatedDocuments;
                        }
                    });
                }
                if ((this.specApi.commitId && this.specApi.commitId !== 'latest') || !this.permissionsSvc.hasProjectIdBranchIdEditPermission(this.specApi.projectId, this.specApi.refId)) {
                    this.editable = false;
                    this.edit = null;
                    this.setEditing(false);
                } else {
                    this.elementSvc.getElementForEdit(reqOb)
                        .then((data) => {
                            if (data.id !== this.lastid)
                                return;
                            this.edit = data;
                            this.editable = true;
                            if (!this.getKeepMode())
                                this.setEditing(false);
                            this.setKeepMode(false);
                            if (this.edit.type === 'Property' || this.edit.type === 'Port' || this.edit.type === 'Slot') {// angular.isArray(this.specSvc.edit.value)) {
                                if (this.edit.defaultValue)
                                    this.setEditValues([this.edit.defaultValue]);
                                else if (this.edit.value)
                                    this.setEditValues(this.edit.value);
                                else
                                    this.setEditValues([]);
                                this.extUtilSvc.getPropertySpec(this.element)
                                    .then((value) => {
                                        this.specApi.propSpec.isEnumeration = value.isEnumeration;
                                        this.specApi.propSpec.isSlot = value.isSlot;
                                        this.specApi.propSpec.options = value.options;
                                    }, (reason) => {
                                        this.growl.error('Failed to get property spec: ' + reason.message);
                                    });
                            }
                            if (this.edit.type === 'Constraint' && this.edit.specification) {
                                this.setEditValues([this.edit.specification]);
                            }
                        });
                }
                this.getTypeClass(this.element);
                this.getQualifiedName()
                this.specApi.dataLink = this.uRLSvc.getRoot() + '/projects/' + this.element._projectId + '/refs/' + this.element._refId + '/elements/' + this.element.id + '?commitId=' + this.element._commitId + '&token=' + this.authSvc.getToken();
                this.gettingSpec = false;
                deferred.resolve(true)
            }, (reason) => {
                deferred.reject(reason);
                this.gettingSpec = false;
                //this.growl.error("Getting Element Error: " + reason.message);
            });
        return deferred.promise;
    }


    /**
     * @ngdoc function
     * @name Spec.service:SpecApi#hasEdits
     * @methodOf Spec.service:SpecApi
     *
     * @description
     * whether editing object has changes compared to base element,
     * currently compares name, doc, property values, if element is not
     * editable, returns false
     *
     * @return {boolean} has changes or not
     */
    public hasEdits() {
        return this.extUtilSvc.hasEdits(this.edit);
    };


    public setEditValues(values: any[]) {
        this.editValues.length = 0;
        this.editValues.push(...values);
    }

    public setKeepMode(value?: boolean) {
        if (value === undefined) {
            this.keepMode()
        }
        this.keeping = value;
    }

    public getKeepMode() {
        return this.keeping;
    }

    public keepMode() {
        this.keeping = true;
    };

    public editorSave() {
        if (this.edit && this.editorApi.save)
            this.editorApi.save();
    };

    revertEdits() {
        this.editValues = this.extUtilSvc.revertEdits(this.editValues, this.edit, this.editorApi);
    };

    public save(continueEdit) {
        this.eventSvc.$broadcast('element-saving',true)
        var saveEdit = this.edit
        this.extUtilSvc.clearAutosave(saveEdit._projectId + saveEdit._refId + saveEdit.id, saveEdit.type);
        if (!continueEdit)
            this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'spec-editor-save'});
        else
            this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'spec-editor-saveC'});
        this.$timeout(() => {
            this._save().then((data) => {
                this.eventSvc.$broadcast('element-saving',false)
                if (!data) {
                    this.growl.info('Save Skipped (No Changes)')
                }else {
                    this.growl.success('Save Successful');
                }
                if (continueEdit)
                    return;
                var saveEdit = this.getEdits();
                var key = saveEdit.id + '|' + saveEdit._projectId + '|' + saveEdit._refId;
                this.editSvc.remove(key);
                if (this.editSvc.openEdits() > 0) {
                    var next = Object.keys(this.editSvc.getAll())[0];
                    var id = next.split('|');
                    this.tracker.etrackerSelected = next;
                    this.keepMode();
                    this.specApi.elementId = id[0];
                    this.specApi.projectId = id[1];
                    this.specApi.refId = id[2];
                    this.specApi.commitId = 'latest';
                } else {
                    this.setEditing(false);
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'spec-inspector'});
                    this.cleanUpSaveAll();
                }
            }, (reason) => {
                this.eventSvc.$broadcast('element-saving',false)
                if (reason.type === 'info')
                    this.growl.info(reason.message);
                else if (reason.type === 'warning')
                    this.growl.warning(reason.message);
                else if (reason.type === 'error')
                    this.growl.error(reason.message);
            }).finally(() => {
                if (!continueEdit)
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'spec-editor-save'});
                else
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'spec-editor-saveC'});
            });
        }, 1000, false);
        this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'spec-editor'});
    };

    private _save() {
        return this.extUtilSvc.save(this.edit, this.editorApi, {element: this.element}, false);
    };

    // Check edit count and toggle appropriate save all and edit/edit-asterisk buttons
    public cleanUpSaveAll(): void {
        if (this.editSvc.openEdits() > 0) {
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SETPERMISSION, {
                id: 'spec-editor-saveall',
                value: true
            });
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SETICON, {
                id: 'spec-editor',
                value: 'fa-edit-asterisk'
            });
        } else {
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SETPERMISSION, {
                id: 'spec-editor-saveall',
                value: false
            });
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SETICON, {id: 'spec-editor', value: 'fa-edit'});
        }
    };

}

veExt.service('SpecService', SpecService)