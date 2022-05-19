import * as angular from "angular";
import {Injectable} from "angular";
import Rx from 'rx-lite';

import {veExt, ExtUtilService, ExtensionController} from "@ve-ext";
import {
    AuthService,
    ElementService,
    EventService,
    MathJaxService,
    UtilsService,
    UxService,
    ViewService
} from "@ve-utils/services";
import {ButtonBarService} from "@ve-utils/button-bar";
import {ViewController} from "@ve-core/view";
import {ElementObject, ViewObject} from "@ve-types/mms";
import {VeEditorApi} from "@ve-core/editor";
import {handleChange, onChangesCallback} from "../../ve-utils/utils/change.util";
import {IPaneScope} from "angular-pane-layout";
import {ViewPresentationElemController} from "@ve-ext/presentations/view-pe.component";

export interface ITransclusion extends angular.IComponentController, ExtensionController {
    $scope: TranscludeScope
    mmsElementId: string
    mmsProjectId: string
    mmsRefId: string;
    commitId: string
    cfType: string
    edit: ElementObject
    element: ElementObject
    isEditing: boolean
    inPreviewMode: boolean
    skipBroadcast: boolean
    addValueTypes?: object
    addValueType?: string
    recompileScope?: TranscludeScope,
    //Functions
    editorApi?: VeEditorApi,
    addValue?(type: string): void,
    removeVal?(i: number): void

    save?(e?): void
    saveC?(e?): void
    cancel?(e?): void
    startEdit?(e?): void
    preview?(e?): void
    delete?(e?): void

}

export interface TranscludeScope extends IPaneScope {
    $ctrl?: ITransclusion
    $parent: TranscludeScope
}


/**
 * @ngdoc component
 * @name veExt/Transclusion
 * @type {ITransclusion}
 *
 * @requires {angular.IScope} $scope
 * @requires {angular.ICompileService} $compile
 * @requires {angular.IRootElementService} $element
 * @requires {angular.growl.IGrowlService} growl
 * @requires {ExtUtilService} extUtilSvc
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
export class Transclusion implements ITransclusion {

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


    public edit: ElementObject;
    public editValues: any[];
    public element: ElementObject;
    protected type: string = '';
    protected editorType: string;

    public view: ViewObject;
    public instanceSpec: any;
    public instanceVal: any;

    protected presentationElem: any;

    protected panelTitle: string;
    protected panelType: string;

    protected $transcludeEl: JQuery<HTMLElement>;

    protected template: string | Injectable<(...args: any[]) => string>

    public save?(e?): void
    public saveC?(e?): void
    public cancel?(e?): void
    public startEdit?(e?): void
    public preview?(e?): void
    public delete?(e?): void

    static $inject: string[] = [
        '$q',
        '$scope',
        '$compile',
        '$element',
        'growl',
        'ExtUtilService',
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
                protected extUtilSvc: ExtUtilService, protected elementSvc: ElementService, protected utilsSvc: UtilsService,
                protected viewSvc: ViewService, protected uxSvc: UxService, protected authSvc: AuthService,
                protected eventSvc: EventService, protected mathJaxSvc: MathJaxService) {}

    $onInit() {
        if (this.$element.prop("tagName").includes('mms')) {
            this.growl.warning("mmsTransclude(*) Syntax is deprecated and will be removed in a future version" +
                "please see the release documentation for further details");
        }
        this.config();
    }

    $onDestroy() {
        this.eventSvc.destroy(this.subs);
    }

    $onChanges(onChangesObj: angular.IOnChangesObject) {
        handleChange(onChangesObj, 'mmsElementId', this.changeAction);
    }

    $postLink() {
        this.changeAction(this.mmsElementId,'',false);
    }

    /**
     * @name veExt/Transclusion#config
     *
     * @description
     *
     * @protected
     */
    protected config:() => void = () => {}

    /**
     * @name veExt/Transclusion#config
     *
     * @description
     *
     * @protected
     */
    protected destroy:() => void = () => {}



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
                this.extUtilSvc.reopenUnsavedElts(this, this.cfTitle.toLowerCase());

                if (this.commitId === 'latest') {
                    this.subs.push(this.eventSvc.$on('element.updated', (data) => {
                        let elementOb = data.element;
                        let continueEdit = data.continueEdit;
                        if (elementOb.id === this.element.id && elementOb._projectId === this.element._projectId &&
                            elementOb._refId === this.element._refId && !continueEdit) {
                            this.element = elementOb;
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
