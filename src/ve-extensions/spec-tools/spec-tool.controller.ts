import * as angular from "angular";
import {Injectable} from "angular";
import Rx from 'rx-lite';

import {
    AuthService,
    ElementService,
    PermissionsService,
    URLService,
    ViewService
} from "@ve-utils/mms-api-client"
import {
    EventService,
    MathJaxService,
    UtilsService
} from "@ve-utils/core-services";
import {ISpecToolButton, ToolbarService} from "./services/Toolbar.service";
import {ElementObject, ElementsRequest} from "@ve-types/mms";
import {VeEditorApi} from "@ve-core/editor";
import {onChangesCallback} from "@ve-utils/utils";
import {veExt, ExtUtilService, ExtensionController} from "@ve-ext";
import {SpecApi, SpecService} from "./services/Spec.service";
import {ToolbarApi} from "./services/Toolbar.api";
import {IPaneScope} from "@openmbee/pane-layout";

export interface ISpecTool extends angular.IComponentController, ExtensionController {
    $scope: ISpecToolScope
    commitId: string
    specType: string
    edit: ElementObject
    element: ElementObject
    isEditing: boolean
    inPreviewMode: boolean
    skipBroadcast: boolean
    editValues: any[]
    values?: any[]
    addValueTypes?: object
    addValueType?: string
    //Functions
    editorApi?: VeEditorApi,
    addValue?(type: string): void,
    removeVal?(i: number): void

}

export interface ISpecToolScope extends IPaneScope {
    $ctrl?: ISpecTool
    $parent: ISpecToolScope
}

/**
 * @ngdoc component
 * @name veExt/SpecTool
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
 *
 * @description
 * Given an element id, puts in the element's documentation binding, if there's a parent
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
    // mmsElementId;
    // mmsProjectId;
    // mmsRefId;
    // mmsCommitId;
    // mmsElement;

    //
    protected specApi: SpecApi

    //Customizers
    public specType: string
    public specTitle: string
    protected specKind: string
    public specButton: ISpecToolButton


    public subs: Rx.IDisposable[];
    protected tbApi: ToolbarApi

    public commitId: string;
    protected projectId: string;
    protected refId: string;

    public editorApi: VeEditorApi = {};
    public isEditing: boolean;
    public isEnumeration: boolean;
    public inPreviewMode: boolean;
    public elementSaving: boolean;
    public skipBroadcast: boolean;

    protected noEdit;
    protected mmsDisplayOldSpec;

    protected ran = false;
    protected lastid = null; //race condition check
    protected gettingSpec = false;
    protected isSlot: boolean = false;
    public element: ElementObject;
    public values: any[];
    public edit: ElementObject;
    protected modifier;
    protected relatedDocuments: null;
    protected elementTypeClass: string;
    protected options: any;
    protected elementDataLink: string;
    protected qualifiedName: string;

    public editValues: any[]

    protected $transcludeEl: JQuery<HTMLElement>;

    protected template: string | Injectable<(...args: any[]) => string>


    static $inject = ['$scope', '$element', 'growl', 'ExtUtilService', 'URLService', 'AuthService', 'ElementService',
        'UtilsService', 'ViewService', 'PermissionsService', 'EventService', 'SpecService', 'ToolbarService'];

    constructor(public $scope: angular.IScope, protected $element: JQuery<HTMLElement>,
                protected growl: angular.growl.IGrowlService, protected extUtilSvc: ExtUtilService, protected uRLSvc: URLService,
                protected authSvc: AuthService, protected elementSvc: ElementService, protected utilsSvc: UtilsService,
                protected viewSvc: ViewService, protected permissionsSvc: PermissionsService,
                protected eventSvc: EventService, protected specSvc: SpecService, protected toolbarSvc: ToolbarService) {

    }

    $onInit() {
        this.eventSvc.$init(this);
        this.tbApi = this.toolbarSvc.getApi('right-toolbar');
        this.editValues = this.specSvc.editValues;

        this.changeElement();

        if (this.tbApi.buttons.map((value) => value.id).filter((value) => value === this.specType).length < 1
                && window.__env && window.__env.enableDebug) {
            console.log("Spec View: " + this.specType + "is missing a button definition")
        }

        this.subs.push(this.eventSvc.$on('element.selected', () => {
            if (this.edit && this.editorApi.save) {
                this.editorApi.save();
            }
        }));
        this.subs.push(this.eventSvc.$on('spec.ready', this.changeElement))
        this.config();
        this.subs.push(this.eventSvc.$on(this.specType, this.initCallback));
        this.initCallback();
    }

    $onDestroy() {
        this.eventSvc.destroy(this.subs);
        this.destroy()
    }

    /**
     * @name veExt/SpecTool#config
     *
     * @description
     *
     * @protected
     */
    protected config:() => void = () => {}

    /**
     * @name veExt/SpecTool#initCallback
     *
     * @description
     *
     * @protected
     */
    protected initCallback: () => void = () => {};

    /**
     * @name veExt/SpecTool#destroy
     *
     * @description
     *
     * @protected
     */
    protected destroy:() => void = () => {}

    public changeElement = () => {
        this.specApi = this.specSvc.specApi;
        this.element = this.specSvc.getElement();
        this.values = this.specSvc.getValues();
        this.modifier = this.specApi.modifier;
        this.qualifiedName = this.specApi.qualifiedName
    }


    //Spec Tool Common API

    public copyToClipboard($event, selector) {
        this.utilsSvc.copyToClipboard(this.$element.find(selector), $event);
    };

    public cleanupVal(obj) {
        obj.value = parseInt(obj.value);
    };

    public propertyTypeClicked(id) {
        var elementOb = {id: id, _projectId: this.element._projectId, _refId: this.element._refId};
        this.eventSvc.$broadcast('element.selected', {elementOb: elementOb});
    };

    public addHtml(value) {
        value.value = "<p>" + value.value + "</p>";
    };

    /**
     * @ngdoc function
     * @name veExt.directive:mmsSpec#save
     * @methodOf veExt.directive:mmsSpec
     *
     * @description
     * save edited element
     *
     * @return {Promise} promise would be resolved with updated element if save is successful.
     *      For unsuccessful saves, it will be rejected with an object with type and message.
     *      Type can be error or info. In case of conflict, there is an option to discard, merge,
     *      or force save. If the user decides to discord or merge, type will be info even though
     *      the original save failed. Error means an actual error occured.
     */
    public save() {
        return this.extUtilSvc.save(this.edit, this.editorApi, this, false);
    };

    public hasHtml(s) {
        return this.extUtilSvc.hasHtml(s);
    };

}
