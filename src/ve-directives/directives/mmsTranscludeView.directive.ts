import * as angular from "angular";
import * as _ from "lodash";
import {Utils} from "../services/Utils.service";
import {ElementService} from "../../ve-utils/services/ElementService.service";
import {UtilsService} from "../../ve-utils/services/UtilsService.service";
import {ViewService} from "../../ve-utils/services/ViewService.service";
import {UxService} from "../../ve-utils/services/UxService.service";
import {AuthService} from "../../ve-utils/services/AuthorizationService.service";
import {EventService} from "../../ve-utils/services/EventService.service";
import {MathJaxService} from "../services/MathJax.service";
var veDirectives = angular.module('veDirectives');

const TranscludeViewComponent: angular.ve.ComponentOptions = {
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
    controller: class TranscludeViewController implements angular.IComponentController {


        //bindings
        private mmsElementId
        private mmsProjectId
        private mmsRefId
        private mmsCommitId
        private mmsWatchId
        private nonEditable
        private mmsCfLabel
        private mmsGenerateForDiff


        //req'd controllers
        private mmsViewCtrl
        private mmsViewPresentationElemCtrl

        private mathJax
        private subs: Promise<PushSubscription>[];


        public idWatch
        emptyRegex
        fixPreSpanRegex
        fixPostSpanRegex
        spacePeriod
        spaceSpace
        spaceComma
        bbApi
        buttons
        buttonsInit
        recompileScope
        cfType
        editorApi
        element
        edit
        isDirectChildOfPresentationElement
        isEditing
        elementSaving
        view
        projectId
        refId
        commitId
        instanceSpec
        instanceVal
        presentationElem
        panelTitle
        panelType
        editorType
        $failure

        //fxns
        public save
        saveC
        cancel
        startEdit
        preview
        delete

        static $inject = ['$scope', '$compile', '$element', 'growl', 'Utils','ElementService', 'UtilsService',
            'ViewService', 'UxService', 'AuthService', 'EventService', 'MathJaxService'];

        constructor(private $scope: angular.IScope, private $compile: angular.ICompileService, private $element: angular.IRootElementService,
                    private growl: angular.growl.IGrowlService, private utils: Utils,
                    private elementSvc: ElementService, private utilsSvc: UtilsService, private viewSvc: ViewService,
                    private uxSvc: UxService, private authSvc: AuthService, private eventSvc: EventService, private mathJaxSvc: MathJaxService) {

            this.fixPreSpanRegex = /<\/span>\s*<mms-cf/g;
            this.fixPostSpanRegex = /<\/mms-cf>\s*<span[^>]*>/g;
            this.emptyRegex = /^\s*$/;
            this.spacePeriod = />(?:\s|&nbsp;)\./g;
            this.spaceSpace = />(?:\s|&nbsp;)(?:\s|&nbsp;)/g;
            this.spaceComma = />(?:\s|&nbsp;),/g;

            this.idWatch = true;
            this.recompileScope = null;
            this.cfType = 'view';
            this.editorApi = {};

        }

        $onInit() {

            this.eventSvc.$init(this);

            this.bbApi = {};
            this.buttons = [];
            this.buttonsInit = false;

            this.bbApi.init = () => {
                if (!this.buttonsInit) {
                    this.buttonsInit = true;
                    this.bbApi.addButton(this.uxSvc.getButtonBarButton("presentation-element-preview", this));
                    this.bbApi.addButton(this.uxSvc.getButtonBarButton("presentation-element-save", this));
                    this.bbApi.addButton(this.uxSvc.getButtonBarButton("presentation-element-saveC", this));
                    this.bbApi.addButton(this.uxSvc.getButtonBarButton("presentation-element-cancel", this));
                    this.bbApi.addButton(this.uxSvc.getButtonBarButton("presentation-element-delete", this));
                    this.bbApi.setPermission("presentation-element-delete", this.isDirectChildOfPresentationElement);
                }
            };


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

        $onChanges(changes) {
            if (changes.mmsElementId && this.idWatch) {
                let newVal = changes.mmsElementId.currentValue;
                if (!newVal || !this.mmsProjectId) {
                    return;
                }
                if (!this.mmsWatchId) {
                    this.idWatch = false;
                }
                if (this.utilsSvc.hasCircularReference(this, this.mmsElementId, 'doc')) {
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
                        this.$element.html('<annotation mms-req-ob="$failure.reqOb" mms-recent-element="$failure.recentElement" mms-type="$failure.type" mms-cf-label="$failure.cfLabel"></annotation>');
                        this.$failure = {
                            reqOb: reqOb,
                            recentElement: reason.data.recentVersionOfElement,
                            type: this.viewSvc.AnnotationType.mmsTranscludeView,
                            cfLabel: this.mmsCfLabel
                        }
                        this.$compile(this.$element)(this.$scope)
                    }).finally(() => {
                    this.$element.removeClass("isLoading");
                });

            }

        }

        recompile(preview?) {
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
            $(this.$element[0]).find('img').each((index,elmt) => {
                this.utils.fixImgSrc($(elmt));
            });
            if (this.mmsViewPresentationElemCtrl) {
                var peSpec = this.mmsViewPresentationElemCtrl.getPresentationElement();
                var pe = this.mmsViewPresentationElemCtrl.getInstanceSpec();
                if (pe && pe._veNumber && peSpec && (peSpec.type === 'TableT' || peSpec.type === 'Figure' || peSpec.type === 'Equation' || peSpec.type === 'ImageT')) {
                    var type = (peSpec.type === 'TableT') ? 'table' : peSpec.type.toLowerCase();
                    if (type === 'imaget') {
                        type = 'figure';
                    }
                    this.utilsSvc.addLiveNumbering(pe, $('#' + pe.id), type);
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

        private _finalize() {
            this.recompileScope = this.$scope.$new();
            this.$compile(this.$element)(this.recompileScope);
            if (this.mmsViewCtrl) {
                this.mmsViewCtrl.elementTranscluded(this.element);
            }
        }





    }
}

veDirectives.component(TranscludeViewComponent.selector, TranscludeViewComponent);