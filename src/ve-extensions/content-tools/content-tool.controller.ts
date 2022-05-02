import * as angular from "angular";
import Rx from "rx";

import {TransclusionService} from "../transclusions/Transclusion.service";
import {ElementService} from "../../ve-utils/services/Element.service";
import {UtilsService} from "../../ve-utils/services/Utils.service";
import {ViewService} from "../../ve-utils/services/View.service";
import {ToolbarService} from "./services/Toolbar.service";
import {AuthService} from "../../ve-utils/services/Authorization.service";
import {EventService} from "../../ve-utils/services/Event.service";
import {MathJaxService} from "../../ve-utils/services/MathJax.service";
import {ElementObject, ViewObject} from "../../ve-utils/types/mms";
import {VeEditorApi} from "../../ve-core/editor/CKEditor.service";
import {handleChange, onChangesCallback} from "../../ve-utils/utils/change.util";
import {veExt} from "../ve-extensions.module";
import {veUtils} from "../../ve-utils/ve-utils.module"
import {Injectable} from "angular";
import {ContentToolController, TButton} from "./content-tool";
import {URLService} from "../../ve-utils/services/URL.provider";
import {PermissionsService} from "../../ve-utils/services/Permissions.service";
import {SpecObject, SpecService} from "./services/Spec.service";
import {ToolbarApi} from "./services/Toolbar.api";

/**
 * @ngdoc component
 * @name veExt/TranscludeDocController
 * @type {TransclusionController}
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
 <mms-transclude-doc mms-element-id="element_id"></mms-transclude-doc>
 </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {bool} mmsWatchId set to true to not destroy element ID watcher
 * @param {boolean=false} nonEditable can edit inline or not
 */
export class ContentToolControllerImpl implements ContentToolController {

    //Bindings
    mmsElementId;
    mmsProjectId;
    mmsRefId;
    mmsCommitId;
    mmsElement;

    //
    protected specInfo: SpecObject

    //Customizers
    public contentType: string
    public contentTitle: string
    protected contentKind: string
    public contentButton: TButton


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
    protected mmsDisplayOldContent;

    protected ran = false;
    protected lastid = null; //race condition check
    protected gettingSpec = false;
    protected isSlot: boolean = false;
    public element: ElementObject;
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


    static $inject = ['$scope', '$element', 'growl', 'TransclusionService', 'URLService', 'AuthService', 'ElementService',
        'UtilsService', 'ViewService', 'PermissionsService', 'EventService', 'SpecService', 'ToolbarService'];

    constructor(public $scope: angular.IScope, protected $element: JQuery<HTMLElement>,
                protected growl: angular.growl.IGrowlService, protected transclusionSvc: TransclusionService, protected uRLSvc: URLService,
                protected authSvc: AuthService, protected elementSvc: ElementService, protected utilsSvc: UtilsService,
                protected viewSvc: ViewService, protected permissionsSvc: PermissionsService,
                protected eventSvc: EventService, protected specSvc: SpecService, protected toolbarSvc: ToolbarService) {

    }

    $onInit() {
        this.eventSvc.$init(this);
        this.tbApi = this.toolbarSvc.getApi('right-toolbar');
        this.specInfo = this.specSvc.specInfo;
        this.editValues = this.specSvc.editValues;

        if (!this.contentButton && window.__env && window.__env.debug) {
            console.log("Spec View: " + this.contentType + "is missing a button definition")
        }

        this.subs.push(this.eventSvc.$on('change-content', this.changeElement))
        this.config();
    }

    $onDestroy() {
        this.eventSvc.destroy(this.subs);
        this.destroy()
    }

        /**
     * @name veExt/SpecPaneControllerImpl#config
     *
     * @description
     *
     * @protected
     */
    protected config:() => void = () => {}

    /**
     * @name veExt/SpecPaneControllerImpl#config
     *
     * @description
     *
     * @protected
     */
    protected destroy:() => void = () => {}

    /**
     * @ngdoc function
     * @name veCore.directive:mmsSpec#changeElement
     * @methodOf veCore.directive:mmsSpec
     *
     * @description
     * change element in the spec, this would reevaluate whether it's editable
     *
     * @param {string} newVal new element id
     */
    public changeElement: onChangesCallback = (newVal, oldVal) => {}

    //public readonly showPane:

}
