'use strict';

angular.module('mms.directives')
.directive('mmsViewSection', ['$compile', '$templateCache', 'ViewService', 'UxService', 'Utils', 'EventService', 'growl', mmsViewSection]);

function mmsViewSection($compile, $templateCache, ViewService, UxService, Utils, EventService, growl) {

    const eventSvc = EventService;

    var defaultTemplate = $templateCache.get('mms/templates/mmsViewSection.html');

    var mmsViewSectionCtrl = function($scope) {



        $scope.sectionInstanceVals = [];
        $scope.bbApi = {};
        $scope.buttons = [];
        $scope.buttonsInit = false;
        //$scope.element = $scope.section;  

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

    var mmsViewSectionLink = function(scope, domElement, attrs, controllers) {
        scope.element = scope.section; // This is for methods in Utils
        var mmsViewCtrl = controllers[0];
        var mmsViewPresentationElemCtrl = controllers[1];
        scope.setPeLineVisibility = function($event) {
            window.setTimeout(function() {
                var peContainer = $($event.currentTarget).closest('.add-pe-button-container');
                if (peContainer.find('.dropdown-menu').css('display') == 'none') {
                    peContainer.find('hr').css('visibility', 'hidden');
                } else {
                    peContainer.find('hr').css('visibility', 'visible');
                }
            });
        };
        domElement.click(function(e) {
            //should not do anything if section is not an instancespec
            if (scope.startEdit)
                scope.startEdit();
            if (mmsViewCtrl && mmsViewPresentationElemCtrl)
                mmsViewCtrl.transcludeClicked(scope.section); //show instance spec if clicked
            e.stopPropagation();
        });

        var recompile = function() {
            scope.isEditing = false;
            scope.inPreviewMode = false;
        };

        var recompileEdit = function() {
            // do nothing
        };

        if (scope.section.specification && scope.section.specification.operand) {
            var dups = Utils.checkForDuplicateInstances(scope.section.specification.operand);
            if (dups.length > 0) {
                growl.warning("There are duplicates in this section, dupilcates ignored!");
            }
        }
        if (scope.section._veNumber) {
            scope.level = scope.section._veNumber.split('.').length;
        }
        domElement.append(defaultTemplate);
        $compile(domElement.contents())(scope);

        var projectId = scope.mmsProjectId;
        var refId = scope.mmsRefId;
        var commitId = scope.mmsCommitId;

        if (mmsViewCtrl) {
            var viewVersion = mmsViewCtrl.getElementOrigin();
            if (!projectId)
                projectId = viewVersion.projectId;
            if (!refId)
                refId = viewVersion.refId;
            if (!commitId)
                commitId = viewVersion.commitId;
        }
        scope.projectId = projectId;
        scope.refId = refId ? refId : 'master';
        scope.commitId = commitId ? commitId : 'latest';

        if (mmsViewCtrl && mmsViewPresentationElemCtrl) {

            scope.isEditing = false;
            scope.inPreviewMode = false;
            scope.elementSaving = false;
            scope.cleanUp = false;
            scope.instanceSpec = mmsViewPresentationElemCtrl.getInstanceSpec();
            scope.instanceVal = mmsViewPresentationElemCtrl.getInstanceVal();
            scope.presentationElem = mmsViewPresentationElemCtrl.getPresentationElement();
            scope.view = mmsViewCtrl.getView();
            scope.isDirectChildOfPresentationElement = Utils.isDirectChildOfPresentationElementFunc(domElement, mmsViewCtrl);
            if (scope.instanceSpec.classifierIds[0] === ViewService.TYPE_TO_CLASSIFIER_ID.Section)
                scope.isDirectChildOfPresentationElement = false;
            var type = "name";

            if (scope.commitId === 'latest') {
                scope.subs.push(eventSvc.$on('element.updated', function(data) {
                    let elementOb = data.element;
                    let continueEdit = data.continueEdit;
                    if (elementOb.id === scope.element.id && elementOb._projectId === scope.element._projectId &&
                        elementOb._refId === scope.element._refId && !continueEdit) {
                        recompile();
                    }
                }));
            }

            scope.save = function() {
                Utils.saveAction(scope, domElement, false);
            };

            scope.saveC = function() {
                Utils.saveAction(scope, domElement, true);
            };

            scope.cancel = function() {
                Utils.cancelAction(scope, recompile, domElement);
            };

            scope.delete = function() {
                Utils.deleteAction(scope, scope.bbApi, mmsViewPresentationElemCtrl.getParentSection());
            };

            scope.startEdit = function() {
                Utils.startEdit(scope,mmsViewCtrl,domElement,null,scope.section);
            };

            scope.preview = function() {
                Utils.previewAction(scope, recompileEdit, recompile, type);
            };
        }

        scope.addEltAction = function(index, type, e) {
            if (!mmsViewCtrl || !mmsViewCtrl.isEditable()) {
                return;
            }
            e.stopPropagation();
            scope.addPeIndex = index;
            Utils.addPresentationElement(scope, type, scope.section);
        };

    };

    return {
        restrict: 'E',
        scope: {
            section: '<mmsSection' //this is json if contains, the instancespec if contents
        },
        require: ['?^mmsView','?^mmsViewPresentationElem'],
        controller: ['$scope', mmsViewSectionCtrl],
        link: mmsViewSectionLink
    };
}