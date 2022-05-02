import * as angular from 'angular'
import {Injectable} from "angular";
import {TransclusionService} from "../../transclusions/Transclusion.service";
import {EventService} from "../../../ve-utils/services/Event.service";
import {ToolbarService} from "./Toolbar.service";
import {EditService} from "../../../ve-utils/services/Edit.service";
import {ElementObject, ElementsRequest} from "../../../ve-utils/types/mms";
import {VeEditorApi} from "../../../ve-core/editor/CKEditor.service";
import {ElementService} from "../../../ve-utils/services/Element.service";
var veUtils = angular.module('veUtils');

export interface SpecObject {
    id: string,
    projectId: string,
    refId: string,
    refType: string,
    commitId?: string,
    displayOldContent?: boolean | null
}

export class SpecService implements Injectable<any> {
    private readonly specApi;
    private element: angular.IPromise<ElementObject>;
    private edit: ElementObject;
    private editing: boolean = false;
    public editable: boolean;
    private keeping: boolean;
    private editorApi: VeEditorApi;

    public specInfo: SpecObject

    public tracker: {
        etrackerSelected: any,
    };

    public editValues: any[] = [];

    static $inject = ['$timeout', 'growl', 'ElementService', 'EventService', 'ToolbarService', 'EditService', 'TransclusionService']
    constructor(private $timeout: angular.ITimeoutService, private growl: angular.growl.IGrowlService,
                private elementSvc: ElementService, private eventSvc: EventService, private toolbarSvc: ToolbarService,
                private editSvc: EditService, private transclusionSvc: TransclusionService) {
    }

    /**
     * @ngdoc function
     * @name veCore.directive:mmsSpec#toggleEditing
     * @methodOf veCore.directive:mmsSpec
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
     * @name veCore.directive:mmsSpec#setEditing
     * @methodOf veCore.directive:mmsSpec
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
     * @name veCore.directive:mmsSpec#getEditing
     * @methodOf veCore.directive:mmsSpec
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
     * @name veCore.directive:mmsSpec#getEdits
     * @methodOf veCore.directive:mmsSpec
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

    public setElement(reqOb: ElementsRequest) {
        let promise = this.elementSvc.getElement(reqOb)
        this.eventSvc.$broadcast('content-changed')
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
        return this.transclusionSvc.hasEdits(this.edit);
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
        this.editValues = this.transclusionSvc.revertEdits(this.editValues, this.edit, this.editorApi);
    };

    public save(continueEdit) {
        this.eventSvc.$broadcast('element-saving',true)
        var saveEdit = this.edit
        this.transclusionSvc.clearAutosaveContent(saveEdit._projectId + saveEdit._refId + saveEdit.id, saveEdit.type);
        if (!continueEdit)
            this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'content-editor-save'});
        else
            this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'content-editor-saveC'});
        this.$timeout(() => {
            this._save().then((data) => {
                this.eventSvc.$broadcast('element-saving',false)
                this.growl.success('Save Successful');
                if (continueEdit)
                    return;
                var saveEdit = this.specApi.getEdits();
                var key = saveEdit.id + '|' + saveEdit._projectId + '|' + saveEdit._refId;
                this.editSvc.remove(key);
                if (this.editSvc.openEdits() > 0) {
                    var next = Object.keys(this.editSvc.getAll())[0];
                    var id = next.split('|');
                    this.tracker.etrackerSelected = next;
                    this.specApi.keepMode();
                    this.specInfo.id = id[0];
                    this.specInfo.projectId = id[1];
                    this.specInfo.refId = id[2];
                    this.specInfo.commitId = 'latest';
                } else {
                    this.specApi.setEditing(false);
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'content-viewer'});
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
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'content-editor-save'});
                else
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'content-editor-saveC'});
            });
        }, 1000, false);
        this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'content-editor'});
    };

    private _save() {
        return this.transclusionSvc.save(this.edit, this.editorApi, this, false);
    };

    // Check edit count and toggle appropriate save all and edit/edit-asterisk buttons
    public cleanUpSaveAll() {
        if (this.editSvc.openEdits() > 0) {
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SETPERMISSION, {
                id: 'content-editor-saveall',
                value: true
            });
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SETICON, {
                id: 'content-editor',
                value: 'fa-edit-asterisk'
            });
        } else {
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SETPERMISSION, {
                id: 'content-editor-saveall',
                value: false
            });
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SETICON, {id: 'content-editor', value: 'fa-edit'});
        }
    };

}

veUtils.service('SpecService', SpecService)