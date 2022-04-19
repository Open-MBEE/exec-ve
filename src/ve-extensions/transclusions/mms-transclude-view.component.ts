import * as angular from "angular";
import Rx from "rx";

import {Utils} from "../../ve-core/utilities/Utils.service";
import {ElementService} from "../../ve-utils/services/Element.service";
import {UtilsService} from "../../ve-utils/services/Utils.service";
import {ViewService} from "../../ve-utils/services/View.service";
import {UxService} from "../../ve-utils/services/Ux.service";
import {AuthService} from "../../ve-utils/services/Authorization.service";
import {EventService} from "../../ve-utils/services/Event.service";
import {MathJaxService} from "../../ve-core/editor/MathJax.service";
import {BButton, ButtonBarApi, ButtonBarService} from "../../ve-core/button-bar/ButtonBar.service";
import {ViewController} from "../../ve-core/view/view.component";
import {ViewPresentationElemController} from "../views/view-pe.component";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";
import {ElementObject, ViewObject} from "../../ve-utils/types/mms";
import {VeEditorApi} from "../../ve-core/editor/CKEditor.service";
import {handleChange, onChangesCallback} from "../../ve-utils/utils/change.util";
import {TranscludeController} from "./transclusion";
import {veExt} from "../ve-extensions.module";
import {veUtils} from "../../ve-utils/ve-utils.module"

/**
 * @ngdoc component
 * @name veExt/TranscludeViewController
 * @type {TranscludeController}
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
 * Given an element id, puts in the view that is described by that element, if there's a parent
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 *
 * ## Example
 *  <pre>
 <mms-transclude-view mms-element-id="element_id"></mms-transclude-view>
 </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {bool} mmsWatchId set to true to not destroy element ID watcher
 * @param {boolean=false} nonEditable can edit inline or not
 */
export class TranscludeViewController implements TranscludeController {

    //Required Controllers
    private mmsViewCtrl: ViewController
    private mmsViewPresentationElemCtrl: ViewPresentationElemController

    //Bindings
    mmsElementId: string;
    mmsProjectId: string;
    mmsRefId: string;
    mmsCommitId: string;
    mmsWatchId: string;
    nonEditable: boolean;
    mmsCfLabel: string;
    mmsGenerateForDiff: boolean;

    //Locals
    private fixPreSpanRegex:RegExp = /<\/span>\s*<mms-cf/g;
    private fixPostSpanRegex:RegExp = /<\/mms-cf>\s*<span[^>]*>/g;
    private emptyRegex:RegExp = /^\s*$/;
    private spacePeriod:RegExp = />(?:\s|&nbsp;)\./g;
    private spaceSpace:RegExp = />(?:\s|&nbsp;)(?:\s|&nbsp;)/g;
    private spaceComma:RegExp = />(?:\s|&nbsp;),/g;
    private isDirectChildOfPresentationElement: boolean;

    public bbApi: ButtonBarApi;
    public bars: string[];
    protected buttons: BButton[] = [];

    public subs: Rx.IDisposable[];

    public commitId: string;
    private projectId: string;
    private refId: string;

    public recompileScope: angular.IScope;
    public editorApi: VeEditorApi = { save: () => {} }
    public isEditing: boolean;
    public isEnumeration: boolean;
    public inPreviewMode: boolean;
    public elementSaving: boolean;
    public skipBroadcast: boolean;
    private clearWatch: boolean = false;

    private view: ViewObject;
    public edit: ElementObject;
    public editValues: any[];
    public element: ElementObject;
    private type: string = '';
    public cfType: string = "view";
    private editorType: string;
    private instanceSpec: any;
    private instanceVal: any;
    private presentationElem: any;
    private panelTitle: string;
    private panelType: string;


    //Api Functions
    public save?(): void;
    public saveC?(): void
    public cancel?(): void;
    public startEdit?(): void;
    public preview?(): void;
    public delete?(): void;

    static $inject = ['$scope', '$compile', '$element', 'growl', 'Utils','ElementService', 'UtilsService',
        'ViewService', 'UxService', 'AuthService', 'EventService', 'ButtonBarService', 'MathJaxService'];

    constructor(public $scope: angular.IScope, private $compile: angular.ICompileService,
                private $element: angular.IRootElementService, private growl: angular.growl.IGrowlService,
                private utils: Utils, private elementSvc: ElementService, private utilsSvc: UtilsService,
                private viewSvc: ViewService, private uxSvc: UxService, private authSvc: AuthService,
                private eventSvc: EventService, private buttonBarSvc: ButtonBarService, private mathJaxSvc: MathJaxService) {}

    $onInit() {

        this.eventSvc.$init(this);
        this.bbApi = this.buttonBarSvc.initApi('', this.bbInit, this);
        this.buttons = this.bbApi.buttons;


        this.$element.on("click", (e) => {
            if (this.startEdit && !this.nonEditable)
                this.startEdit();

            if (this.mmsViewCtrl)
                this.mmsViewCtrl.transcludeClicked(this.element);
            if (this.nonEditable && this.mmsViewCtrl && this.mmsViewCtrl.isEditable()) {
                this.growl.warning("Cross Reference is not editable.");
            }
            e.stopPropagation();
        })

        if (this.mmsViewCtrl) {
            this.isEditing = false;
            this.elementSaving = false;
            this.view = this.mmsViewCtrl.getView();
            //TODO remove this when deleting in parent PE directive
            this.isDirectChildOfPresentationElement = this.utils.isDirectChildOfPresentationElementFunc(this.$element, this.mmsViewCtrl);

            this.save = () => {
                this.utils.saveAction(this, this.$element, false);
            };

            this.saveC = () => {
                this.utils.saveAction(this, this.$element, true);
            };

            this.cancel = () => {
                this.utils.cancelAction(this, this.recompile, this.$element);
            };

            this.startEdit = () => {
                this.utils.startEdit(this, this.mmsViewCtrl, this.$element, TranscludeViewComponent.template, false);
            };

            this.preview = () => {
                this.utils.previewAction(this, this.recompile, this.$element);
            };
        }

        if (this.mmsViewPresentationElemCtrl) {
            this.delete = () => {
                this.utils.deleteAction(this, this.bbApi, this.mmsViewPresentationElemCtrl.getParentSection());
            };

            this.instanceSpec = this.mmsViewPresentationElemCtrl.getInstanceSpec();
            this.instanceVal = this.mmsViewPresentationElemCtrl.getInstanceVal();
            this.presentationElem = this.mmsViewPresentationElemCtrl.getPresentationElement();
            var auto = [this.viewSvc.TYPE_TO_CLASSIFIER_ID.Image, this.viewSvc.TYPE_TO_CLASSIFIER_ID.Paragraph,
                this.viewSvc.TYPE_TO_CLASSIFIER_ID.List, this.viewSvc.TYPE_TO_CLASSIFIER_ID.Table];

            if (auto.indexOf(this.instanceSpec.classifierIds[0]) >= 0)
                //do not allow model generated to be deleted
                this.isDirectChildOfPresentationElement = false;
            if (this.isDirectChildOfPresentationElement) {
                this.panelTitle = this.instanceSpec.name;
                this.panelType = this.presentationElem.type; //this is hack for fake table/list/equation until we get actual editors
                if (this.panelType.charAt(this.panelType.length-1) === 'T')
                    this.panelType = this.panelType.substring(0, this.panelType.length-1);
                if (this.panelType === 'Paragraph')
                    this.panelType = 'Text';
                if (this.panelType === 'Figure' || this.panelType === 'ImageT')
                    this.panelType = 'Image';
            }
            if (this.presentationElem) {
                this.editorType = this.presentationElem.type;
            }
        }
    }

    $onDestroy() {
        this.eventSvc.destroy(this.subs);
        this.buttonBarSvc.destroy(this.bars);
    }

    $onChanges(onChangesObj: angular.IOnChangesObject) {
        handleChange(onChangesObj, 'mmsElementId', this.changeAction);
    }

    private bbInit = (api: ButtonBarApi) => {
        api.addButton(this.uxSvc.getButtonBarButton("presentation-element-preview"));
        api.addButton(this.uxSvc.getButtonBarButton("presentation-element-save"));
        api.addButton(this.uxSvc.getButtonBarButton("presentation-element-saveC"));
        api.addButton(this.uxSvc.getButtonBarButton("presentation-element-cancel"));
        api.addButton(this.uxSvc.getButtonBarButton("presentation-element-delete"));
        api.setPermission("presentation-element-delete", this.isDirectChildOfPresentationElement);
    }

    public recompile = (preview?) =>  {
        if (this.recompileScope) {
            this.recompileScope.$destroy();
        }
        this.$element.empty();
        var doc = preview ? this.edit.documentation : this.element.documentation;
        if (!doc || this.emptyRegex.test(doc)) {
            doc = '<p class="no-print placeholder">(no ' + this.panelType + ')</p>';
        }
        doc = doc.replace(this.fixPreSpanRegex, "<mms-cf");
        doc = doc.replace(this.fixPostSpanRegex, "</mms-cf>");
        doc = doc.replace(this.spacePeriod, '>.');
        doc = doc.replace(this.spaceSpace, '> ');
        doc = doc.replace(this.spaceComma, '>,');
        if (preview) {
            this.$element[0].innerHTML = '<div class="panel panel-info">'+doc+'</div>';
        } else {
            this.isEditing = false;
            this.$element[0].innerHTML = doc;
        }
        $(this.$element[0]).find('img').each((index) => {
            this.utils.fixImgSrc($(this));
        });
        if (this.mmsViewPresentationElemCtrl) {
            var peSpec = this.mmsViewPresentationElemCtrl.getPresentationElement();
            var pe = this.mmsViewPresentationElemCtrl.getInstanceSpec();
            if (pe && pe._veNumber && peSpec && (peSpec.type === 'TableT' || peSpec.type === 'Figure' || peSpec.type === 'Equation' || peSpec.type === 'ImageT')) {
                this.type = (peSpec.type === 'TableT') ? 'table' : peSpec.type.toLowerCase();
                if (this.type === 'imaget') {
                    this.type = 'figure';
                }
                this.utilsSvc.addLiveNumbering(pe, $('#' + pe.id), this.type);
            }
        }
        if (!this.mmsGenerateForDiff) {
            this.mathJaxSvc.typeset(this.$element[0], this.$scope).then(
                () => this._finalize()
            );
        }else {
            this._finalize();
        }
    };

    public _finalize = () =>  {
        this.recompileScope = this.$scope.$new();
        this.$compile(this.$element)(this.recompileScope);
        if (this.mmsViewCtrl) {
            this.mmsViewCtrl.elementTranscluded(this.$element, this.type);
        }
    }

    private changeAction: onChangesCallback = (newVal, oldVal, firstChange) => {
        if (this.clearWatch || !newVal || !this.mmsProjectId) {
            return;
        }
        if (!this.mmsWatchId && newVal) {
            this.clearWatch = true;
            return;
        }
        if (this.utilsSvc.hasCircularReference(this, this.mmsElementId, 'view')) {
            this.$element.html('<span class="mms-error">Circular Reference!</span>');
            return;
        }
        this.projectId = this.mmsProjectId;
        this.refId = this.mmsRefId ? this.mmsRefId : 'master';
        this.commitId = this.mmsCommitId ? this.mmsCommitId : 'latest';
        this.$element.html('(loading...)');
        this.$element.addClass("isLoading");
        var reqOb = {elementId: this.mmsElementId, projectId: this.projectId, refId: this.refId, commitId: this.commitId, includeRecentVersionElement: true};
        this.elementSvc.getElement(reqOb, 1, false)
        .then((data) => {
            this.element = data;
            if (!this.panelTitle) {
                this.panelTitle = this.element.name + " Documentation";
                this.panelType = "Text";
            }
            this.recompile();
            this.utils.reopenUnsavedElts(this, "documentation");

            if (this.commitId === 'latest') {
                this.subs.push(this.eventSvc.$on('element.updated',(data) => {
                    let elementOb = data.element;
                    let continueEdit = data.continueEdit;
                    if (elementOb.id === this.element.id && elementOb._projectId === this.element._projectId &&
                        elementOb._refId === this.element._refId && !continueEdit) {
                        this.recompile();
                    }
                }));
            }
        }, (reason) => {
            this.$element.html('<annotation mms-req-ob="::reqOb" mms-recent-element="::recentElement" mms-type="::type" mms-cf-label="::cfLabel"></annotation>');
            this.$compile(this.$element)(Object.assign(this.$scope.$new(), {
                reqOb: reqOb,
                recentElement: reason.data.recentVersionOfElement,
                type: this.viewSvc.AnnotationType.mmsTranscludeView,
                cfLabel: this.mmsCfLabel
            }));
        }).finally(() => {
            this.$element.removeClass("isLoading");
        });
    };

}


const TranscludeViewComponent: VeComponentOptions = {
    selector: "mmsTranscludeView",
    template: `
    <div class="panel panel-default no-print">
        <mms-view mms-element-id="$ctrl.mmsElementId" mms-project-id="$ctrl.mmsProjectId" mms-cf-clicked="handler(elementId)" mms-view-api="api"></mms-view>
</div>  
`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsWatchId: '@',
        nonEditable: '<',
        mmsCfLabel: '@',
        mmsGenerateForDiff: '<'
    },
    require: {
        mmsViewCtrl: '?^^view',
        mmsViewPresentationElemCtrl: '?^^mmsViewPresentationElem'
    },
    controller: TranscludeViewController
}

veExt.component(TranscludeViewComponent.selector, TranscludeViewComponent);