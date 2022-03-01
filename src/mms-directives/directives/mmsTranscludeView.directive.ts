import * as angular from "angular";
var mmsDirectives = angular.module('mmsDirectives');

mmsDirectives.directive('mmsTranscludeView', ['Utils','ElementService', 'UtilsService', 'ViewService', 'UxService', 'AuthService',
    'EventService', '$compile', '$templateCache', 'growl', 'MathJax', mmsTranscludeView]);


const TranscludeViewComponent = {
    selector: "mms-transclude-view",
    template: `
    <div class="panel panel-default no-print">
        <mms-view mms-element-id="view_element_id" mms-project-id="view_project_id" mms-cf-clicked="handler(elementId)" mms-view-api="api"></mms-view>
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
        mmsViewCtrl: '?^^mmsView',
        mmsViewPresentationElemCtrl: '?^^mmsViewPresentationElem'
    },
    controller: class TranscludeViewController {
        static $inject = ['Utils','ElementService', 'UtilsService', 'ViewService', 'UxService', 'AuthService',
            'EventService', '$compile', '$element', 'growl', 'MathJax'];

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

        private utils
        private elementSvc
        private subs
        private utilsSvc
        private viewSvc
        private uxSvc
        private authSvc
        private eventSvc
        private $compile
        private domElement
        private growl
        private _
        private mathJax


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


        constructor(Utils, ElementService, UtilsService, ViewService, UxService, AuthService, EventService, $compile, $element, growl, _, MathJax) {
            this.utils = Utils;
            this.elementSvc = ElementService;
            this.utilsSvc = UtilsService;
            this.viewSvc = ViewService;
            this.uxSvc = UxService;
            this.authSvc = AuthService;
            this.eventSvc = EventService;
            this.$compile = $compile;
            this.domElement = $element;
            this.growl = growl;
            this._ = _;
            this.mathJax = MathJax;

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


            this.domElement.on("click", (e) => {
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
                this.isDirectChildOfPresentationElement = this.utils.isDirectChildOfPresentationElementFunc(this.domElement, this.mmsViewCtrl);

                this.save = () => {
                    this.utils.saveAction(this, this.domElement, false);
                };

                this.saveC = () => {
                    this.utils.saveAction(this, this.domElement, true);
                };

                this.cancel = () => {
                    this.utils.cancelAction(this, this.recompile, this.domElement);
                };

                this.startEdit = () => {
                    this.utils.startEdit(this, this.mmsViewCtrl, this.domElement, TranscludeViewComponent.template, false);
                };

                this.preview = () => {
                    this.utils.previewAction(this, this.recompile, this.domElement);
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
                    this.domElement.html('<span class="mms-error">Circular Reference!</span>');
                    return;
                }
                this.projectId = this.mmsProjectId;
                this.refId = this.mmsRefId ? this.mmsRefId : 'master';
                this.commitId = this.mmsCommitId ? this.mmsCommitId : 'latest';
                this.domElement.html('(loading...)');
                this.domElement.addClass("isLoading");
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
                        this.domElement.html('<span mms-annotation mms-req-ob="$failure.reqOb" mms-recent-element="$failure.recentElement" mms-type="$failure.type" mms-cf-label="$failure.cfLabel"></span>');
                        this.$failure = {
                            reqOb: reqOb,
                            recentElement: reason.data.recentVersionOfElement,
                            type: this.viewSvc.AnnotationType.mmsTranscludeView,
                            cfLabel: this.mmsCfLabel
                        }
                        this.$compile(this.domElement.contents())(this)
                    }).finally(() => {
                    this.domElement.removeClass("isLoading");
                });

            }

        }

        recompile(preview?) {}
        //     if (this.recompileScope) {
        //         this.recompileScope.$destroy();
        //     }
        //     this.domElement.empty();
        //     var doc = preview ? this.edit.documentation : this.element.documentation;
        //     if (!doc || this.emptyRegex.test(doc)) {
        //         doc = '<p class="no-print placeholder">(no ' + this.panelType + ')</p>';
        //     }
        //     doc = doc.replace(this.fixPreSpanRegex, "<mms-cf");
        //     doc = doc.replace(this.fixPostSpanRegex, "</mms-cf>");
        //     doc = doc.replace(this.spacePeriod, '>.');
        //     doc = doc.replace(this.spaceSpace, '> ');
        //     doc = doc.replace(this.spaceComma, '>,');
        //     if (preview) {
        //         this.domElement[0].innerHTML = '<div class="panel panel-info">'+doc+'</div>';
        //     } else {
        //         this.isEditing = false;
        //         this.domElement[0].innerHTML = doc;
        //     }
        //     $(domElement[0]).find('img').each(function(index) {
        //         this.utils.fixImgSrc($(this));
        //     });
        //     if (mmsViewPresentationElemCtrl) {
        //         var peSpec = mmsViewPresentationElemCtrl.getPresentationElement();
        //         var pe = mmsViewPresentationElemCtrl.getInstanceSpec();
        //         if (pe && pe._veNumber && peSpec && (peSpec.type === 'TableT' || peSpec.type === 'Figure' || peSpec.type === 'Equation' || peSpec.type === 'ImageT')) {
        //             var type = (peSpec.type === 'TableT') ? 'table' : peSpec.type.toLowerCase();
        //             if (type === 'imaget') {
        //                 type = 'figure';
        //             }
        //             UtilsService.addLiveNumbering(pe, $('#' + pe.id), type);
        //         }
        //     }
        //     if (MathJax && !scope.mmsGenerateForDiff) {
        //         MathJax.Hub.Queue(["Typeset", MathJax.Hub, domElement[0]]);
        //     }
        //     scope.recompileScope = scope.$new();
        //     $compile(domElement.contents())(scope.recompileScope);
        //     if (mmsViewCtrl) {
        //         mmsViewCtrl.elementTranscluded(scope.element);
        //     }
        // };





    }
}



/**
 * @ngdoc directive
 * @name mmsDirectives.directive:mmsTranscludeView
 *
 * @requires mms.ElementService
 * @requires mms.UtilsService
 * @requires mms.ViewService
 * @requires mms.UxService
 * @requires mms.Utils
 * @requires $compile
 * @requires $templateCache
 * @requires growl
 * @requires _
 * @requires MathJax
 *
 * @restrict E
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
function mmsTranscludeView(Utils, ElementService, UtilsService, ViewService, UxService, AuthService, EventService, $compile, $templateCache, growl, _, MathJax) {

    const eventSvc = EventService;

    var template = 'partials/mms-directives/mmsTranscludeView.html';

    var fixPreSpanRegex = /<\/span>\s*<mms-cf/g;
    var fixPostSpanRegex = /<\/mms-cf>\s*<span[^>]*>/g;
    var emptyRegex = /^\s*$/;
    var spacePeriod = />(?:\s|&nbsp;)\./g;
    var spaceSpace = />(?:\s|&nbsp;)(?:\s|&nbsp;)/g;
    var spaceComma = />(?:\s|&nbsp;),/g;

    var mmsTranscludeViewCtrl = function($scope) {

        eventSvc.$init($scope);

        $scope.bbApi = {};
        $scope.buttons = [];
        $scope.buttonsInit = false;

        $scope.bbApi.init = function() {
            if (!$scope.buttonsInit) {
                $scope.buttonsInit = true;
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-preview", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-save", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-saveC", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-cancel", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-delete", $scope));
                $scope.bbApi.setPermission("presentation-element-delete", $scope.isDirectChildOfPresentationElement);
            }
        };
    };

    var mmsTranscludeViewLink = function(scope, domElement : angular.IAugmentedJQuery, attrs, controllers) {
        var mmsViewCtrl = controllers[0];
        var mmsViewPresentationElemCtrl = controllers[1];
        scope.recompileScope = null;
        scope.cfType = 'doc';
        scope.editorApi = {};
        domElement.on("click",function(e) {
            if (scope.startEdit && !scope.nonEditable)
                scope.startEdit();

            if (mmsViewCtrl)
                mmsViewCtrl.transcludeClicked(scope.element);
            if (scope.nonEditable && mmsViewCtrl && mmsViewCtrl.isEditable()) {
                growl.warning("Cross Reference is not editable.");
            }
            e.stopPropagation();
        });

        var recompile = function(preview?) {
            if (scope.recompileScope) {
                scope.recompileScope.$destroy();
            }
            domElement.empty();
            var doc = preview ? scope.edit.documentation : scope.element.documentation;
            if (!doc || emptyRegex.test(doc)) {
                doc = '<p class="no-print placeholder">(no ' + scope.panelType + ')</p>';
            }
            doc = doc.replace(fixPreSpanRegex, "<mms-cf");
            doc = doc.replace(fixPostSpanRegex, "</mms-cf>");
            doc = doc.replace(spacePeriod, '>.');
            doc = doc.replace(spaceSpace, '> ');
            doc = doc.replace(spaceComma, '>,');
            if (preview) {
                domElement[0].innerHTML = '<div class="panel panel-info">'+doc+'</div>';
            } else {
                scope.isEditing = false;
                domElement[0].innerHTML = doc;
            }
            $(domElement[0]).find('img').each(function(index) {
                Utils.fixImgSrc($(this));
            });
            if (mmsViewPresentationElemCtrl) {
                var peSpec = mmsViewPresentationElemCtrl.getPresentationElement();
                var pe = mmsViewPresentationElemCtrl.getInstanceSpec();
                if (pe && pe._veNumber && peSpec && (peSpec.type === 'TableT' || peSpec.type === 'Figure' || peSpec.type === 'Equation' || peSpec.type === 'ImageT')) {
                    var type = (peSpec.type === 'TableT') ? 'table' : peSpec.type.toLowerCase();
                    if (type === 'imaget') {
                        type = 'figure';
                    }
                    UtilsService.addLiveNumbering(pe, $('#' + pe.id), type);
                }
            }
            if (MathJax && !scope.mmsGenerateForDiff) {
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, domElement[0]]);
            }
            scope.recompileScope = scope.$new();
            $compile(domElement.contents())(scope.recompileScope);
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.element);
            }
        };

        var idwatch = scope.$watch('mmsElementId', function(newVal) {
            if (!newVal || !scope.mmsProjectId) {
                return;
            }
            if (!scope.mmsWatchId) {
                idwatch();
            }
            if (UtilsService.hasCircularReference(scope, scope.mmsElementId, 'doc')) {
                domElement.html('<span class="mms-error">Circular Reference!</span>');
                return;
            }
            scope.projectId = scope.mmsProjectId;
            scope.refId = scope.mmsRefId ? scope.mmsRefId : 'master';
            scope.commitId = scope.mmsCommitId ? scope.mmsCommitId : 'latest';
            domElement.html('(loading...)');
            domElement.addClass("isLoading");
            var reqOb = {elementId: scope.mmsElementId, projectId: scope.projectId, refId: scope.refId, commitId: scope.commitId, includeRecentVersionElement: true};
            ElementService.getElement(reqOb, 1, false)
            .then(function(data) {
                scope.element = data;
                if (!scope.panelTitle) {
                    scope.panelTitle = scope.element.name + " Documentation";
                    scope.panelType = "Text";
                }
                recompile();
                Utils.reopenUnsavedElts(scope, "documentation");

                if (scope.commitId === 'latest') {
                   scope.subs.push(eventSvc.$on('element.updated', function (data) {
                        let elementOb = data.element;
                        let continueEdit = data.continueEdit;
                        if (elementOb.id === scope.element.id && elementOb._projectId === scope.element._projectId &&
                            elementOb._refId === scope.element._refId && !continueEdit) {
                            recompile();
                        }
                    }));
                }
            }, function(reason) {
                domElement.html('<span mms-annotation mms-req-ob="::reqOb" mms-recent-element="::recentElement" mms-type="::type" mms-cf-label="::cfLabel"></span>');
                $compile(domElement.contents())(Object.assign(scope.$new(), {
                    reqOb: reqOb,
                    recentElement: reason.data.recentVersionOfElement,
                    type: ViewService.AnnotationType.mmsTranscludeView,
                    cfLabel: scope.mmsCfLabel
                }));
            }).finally(function() {
                domElement.removeClass("isLoading");
            });
        });

        if (mmsViewCtrl) {
            scope.isEditing = false;
            scope.elementSaving = false;
            scope.view = mmsViewCtrl.getView();
            //TODO remove this when deleting in parent PE directive
            scope.isDirectChildOfPresentationElement = Utils.isDirectChildOfPresentationElementFunc(domElement, mmsViewCtrl);

            scope.save = function() {
                Utils.saveAction(scope, domElement, false);
            };

            scope.saveC = function() {
                Utils.saveAction(scope, domElement, true);
            };

            scope.cancel = function() {
                Utils.cancelAction(scope, recompile, domElement);
            };

            scope.startEdit = function() {
                Utils.startEdit(scope, mmsViewCtrl, domElement, template, false);
            };

            scope.preview = function() {
                Utils.previewAction(scope, recompile, domElement);
            };
        }

        if (mmsViewPresentationElemCtrl) {
            scope.delete = function() {
                Utils.deleteAction(scope, scope.bbApi, mmsViewPresentationElemCtrl.getParentSection());
            };

            scope.instanceSpec = mmsViewPresentationElemCtrl.getInstanceSpec();
            scope.instanceVal = mmsViewPresentationElemCtrl.getInstanceVal();
            scope.presentationElem = mmsViewPresentationElemCtrl.getPresentationElement();
            var auto = [ViewService.TYPE_TO_CLASSIFIER_ID.Image, ViewService.TYPE_TO_CLASSIFIER_ID.Paragraph,
                ViewService.TYPE_TO_CLASSIFIER_ID.List, ViewService.TYPE_TO_CLASSIFIER_ID.Table];

            if (auto.indexOf(scope.instanceSpec.classifierIds[0]) >= 0)
            //do not allow model generated to be deleted
                scope.isDirectChildOfPresentationElement = false;
            if (scope.isDirectChildOfPresentationElement) {
                scope.panelTitle = scope.instanceSpec.name;
                scope.panelType = scope.presentationElem.type; //this is hack for fake table/list/equation until we get actual editors
                if (scope.panelType.charAt(scope.panelType.length-1) === 'T')
                    scope.panelType = scope.panelType.substring(0, scope.panelType.length-1);
                if (scope.panelType === 'Paragraph')
                    scope.panelType = 'Text';
                if (scope.panelType === 'Figure' || scope.panelType === 'ImageT')
                    scope.panelType = 'Image';
            }
            if (scope.presentationElem) {
                scope.editorType = scope.presentationElem.type;
            }
        }
    };

    return {
        restrict: 'E',
        scope: {
            mmsElementId: '@',
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsCommitId: '@',
            mmsWatchId: '@',
            nonEditable: '<',
            mmsCfLabel: '@',
            mmsGenerateForDiff: '<'
        },
        require: ['?^^mmsView','?^^mmsViewPresentationElem'],
        controller: ['$scope', mmsTranscludeViewCtrl],
        link: mmsTranscludeViewLink
    };
}
