import * as angular from "angular";
import Rx from "rx";

import {TransclusionService} from "./Transclusion.service";
import {ElementService} from "../../ve-utils/services/Element.service";
import {UtilsService} from "../../ve-utils/services/Utils.service";
import {ViewService} from "../../ve-utils/services/View.service";
import {UxService} from "../../ve-utils/services/Ux.service";
import {AuthService} from "../../ve-utils/services/Authorization.service";
import {EventService} from "../../ve-utils/services/Event.service";
import {MathJaxService} from "../../ve-utils/services/MathJax.service";
import {BButton, ButtonBarApi, ButtonBarService} from "../../ve-core/button-bar/ButtonBar.service";
import {ViewController} from "../../ve-core/view/view.component";
import {ViewPresentationElemController} from "../views/view-pe.component";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";
import {ElementObject, ViewObject} from "../../ve-utils/types/mms";
import {VeEditorApi} from "../../ve-core/editor/CKEditor.service";
import {handleChange, onChangesCallback} from "../../ve-utils/utils/change.util";
import {TransclusionController, TranscludeScope} from "./transclusion";
import {veExt} from "../ve-extensions.module";
import {veUtils} from "../../ve-utils/ve-utils.module"
import {Injectable} from "angular";

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
 * @requires {UxService} uxSvc
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
export class TransclusionControllerImpl implements TransclusionController {

    //Required Controllers
    protected mmsViewCtrl: ViewController
    protected mmsViewPresentationElemCtrl: ViewPresentationElemController

    //Bindings
    mmsElementId: string;
    mmsProjectId: string;
    mmsRefId: string;
    mmsCommitId: string;
    mmsWatchId: string;
    nonEditable: boolean;
    mmsCfLabel: string;
    mmsGenerateForDiff: boolean;

    //Customizers
    public cfType: string
    protected cfTitle: string
    protected cfKind: string
    protected checkCircular: any;

    //Locals
    protected isDirectChildOfPresentationElement: boolean;

    public subs: Rx.IDisposable[];

    public commitId: string;
    protected projectId: string;
    protected refId: string;

    public editorApi: VeEditorApi = {};
    public isEditing: boolean;
    public isEnumeration: boolean;
    public inPreviewMode: boolean;
    public elementSaving: boolean;
    public skipBroadcast: boolean;
    protected clearWatch: boolean = false;

    protected view: ViewObject;
    public edit: ElementObject;
    public editValues: any[];
    public element: ElementObject;
    protected type: string = '';
    protected editorType: string;
    protected instanceSpec: any;
    protected instanceVal: any;
    protected presentationElem: any;
    protected panelTitle: string;
    protected panelType: string;

    protected $transcludeEl: JQuery<HTMLElement>;

    protected template: string | Injectable<(...args: any[]) => string>


    static $inject: string[] = [
        '$q',
        '$scope',
        '$compile',
        '$element',
        'growl',
        'TransclusionService',
        'ElementService',
        'UtilsService',
        'ViewService',
        'UxService',
        'AuthService',
        'EventService',
        'MathJaxService',
    ]

    constructor(public $q: angular.IQService, public $scope: angular.IScope, protected $compile: angular.ICompileService,
                protected $element: JQuery<HTMLElement>, protected growl: angular.growl.IGrowlService,
                protected transclusionSvc: TransclusionService, protected elementSvc: ElementService, protected utilsSvc: UtilsService,
                protected viewSvc: ViewService, protected uxSvc: UxService, protected authSvc: AuthService,
                protected eventSvc: EventService, protected mathJaxSvc: MathJaxService) {}


    $onDestroy() {
        this.eventSvc.destroy(this.subs);
    }

    $onChanges(onChangesObj: angular.IOnChangesObject) {
        handleChange(onChangesObj, 'mmsElementId', this.changeAction);
    }

    $postLink() {
        this.changeAction(this.mmsElementId,'',false);
    }



    public getContent = (preview?): angular.IPromise<string | HTMLElement[]> => {
        return this.$q.resolve('Not Yet Implemented');
    }

    protected recompile = (preview?): void =>  {
        this.getContent(preview).then((result) => {
            this.$element.empty();
            this.$transcludeEl = $(result);
            this.$element.append(this.$transcludeEl);
            this.$compile(this.$transcludeEl)(this.$scope.$new());
            if (this.mmsViewCtrl) {
                this.mmsViewCtrl.elementTranscluded(this.$element, this.type)
            }
        }, (reason) => {
            this.growl.error(reason);
        })

    };

    protected changeAction: onChangesCallback = (
        newVal,
        oldVal,
        firstChange
    ) => {
        if (this.clearWatch || !newVal || !this.mmsProjectId || firstChange) {
            return;
        }
        if (!this.mmsWatchId && newVal) {
            this.clearWatch = true;
        }
        if (this.checkCircular) {
            if (this.utilsSvc.hasCircularReference(this, this.mmsElementId, 'doc')) {
                this.$element.html('<span class="mms-error">Circular Reference!</span>');
                return;
            }
        }
        this.projectId = this.mmsProjectId;
        this.refId = this.mmsRefId ? this.mmsRefId : 'master';
        this.commitId = this.mmsCommitId ? this.mmsCommitId : 'latest';
        this.$element.html('(loading...)');
        this.$element.addClass("isLoading");
        var reqOb = {
            elementId: this.mmsElementId,
            projectId: this.projectId,
            refId: this.refId,
            commitId: this.commitId,
            includeRecentVersionElement: true,
        }
        this.elementSvc.getElement(reqOb, 1, false)
            .then((data) => {
                this.element = data;
                if (!this.panelTitle) {
                    this.panelTitle = this.element.name + " " + this.cfTitle;
                    this.panelType = this.cfKind;
                }
                this.recompile();
                this.transclusionSvc.reopenUnsavedElts(this, this.cfTitle.toLowerCase());

                if (this.commitId === 'latest') {
                    this.subs.push(this.eventSvc.$on('element.updated', (data) => {
                        let elementOb = data.element;
                        let continueEdit = data.continueEdit;
                        if (elementOb.id === this.element.id && elementOb._projectId === this.element._projectId &&
                            elementOb._refId === this.element._refId && !continueEdit) {
                            this.recompile();
                        }
                    }));
                }
            }, (reason) => {
                this.$element.empty()
                this.$transcludeEl = $('<annotation mms-req-ob="::reqOb" mms-recent-element="::recentElement" mms-type="::type" mms-cf-label="::cfLabel"></annotation>');
                this.$element.append(this.$transcludeEl);
                this.$compile(this.$transcludeEl)(Object.assign(this.$scope.$new(), {
                    reqOb: reqOb,
                    recentElement: reason.data.recentVersionOfElement,
                    type: this.viewSvc.AnnotationType.mmsTranscludeName,
                    cfLabel: this.mmsCfLabel
                }));
            }).finally(() => {
            this.$element.removeClass("isLoading");
        });
    }

}
