import * as angular from 'angular'
import {Injectable} from "angular";
import {Utils} from "../utilities/Utils.service";
import {EventService} from "../../ve-utils/services/Event.service";
import {ToolbarService} from "./Toolbar.service";
import {EditService} from "../../ve-utils/services/Edit.service";
import {ElementObject} from "../../ve-utils/types/mms";
import {VeEditorApi} from "../editor/CKEditor.service";
var veUtils = angular.module('veUtils');

export class SpecService implements Injectable<any> {
    private readonly specApi;
    private edit: ElementObject;
    private editing: boolean = false;
    public editable: boolean;
    //private edit: ElementObject;
    private keeping: boolean;
    private editorApi: VeEditorApi;

    public specInfo: {
        refId: string,
        commitId: string,
        projectId: string,
        id: string
    };
    public tracker: {
        etrackerSelected: any,
    };

    public editValues = [];

    static $inject = ['$timeout', 'growl', 'EventService', 'ToolbarService', 'EditService', 'Utils']
    constructor(private $timeout: angular.ITimeoutService, private growl: angular.growl.IGrowlService,
                private eventSvc: EventService, private toolbarSvc: ToolbarService, private editSvc: EditService, private utils: Utils) {
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
        return this.utils.hasEdits(this.edit);
    };


    public setEditValues(values: any[]) {
        this.editValues = values
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
        this.editValues = this.utils.revertEdits(this.editValues, this.edit, this.editorApi);
    };

    public save(continueEdit) {
        this.eventSvc.$broadcast('element-saving',true)
        var saveEdit = this.edit
        this.utils.clearAutosaveContent(saveEdit._projectId + saveEdit._refId + saveEdit.id, saveEdit.type);
        if (!continueEdit)
            this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'element-editor-save'});
        else
            this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'element-editor-saveC'});
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
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'element-viewer'});
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
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'element-editor-save'});
                else
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'element-editor-saveC'});
            });
        }, 1000, false);
        this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'element-editor'});
    };

    private _save() {
        return this.utils.save(this.edit, this.editorApi, this, false);
    };

    // Check edit count and toggle appropriate save all and edit/edit-asterisk buttons
    public cleanUpSaveAll() {
        if (this.editSvc.openEdits() > 0) {
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SETPERMISSION, {
                id: 'element-editor-saveall',
                value: true
            });
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SETICON, {
                id: 'element-editor',
                value: 'fa-edit-asterisk'
            });
        } else {
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SETPERMISSION, {
                id: 'element-editor-saveall',
                value: false
            });
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SETICON, {id: 'element-editor', value: 'fa-edit'});
        }
    };

}

veUtils.service('SpecService', SpecService)