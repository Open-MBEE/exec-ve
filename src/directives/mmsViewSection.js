'use strict';

angular.module('mms.directives')
.directive('mmsViewSection', ['$compile', '$templateCache', '$rootScope', 'ViewService', 'UxService', 'Utils', mmsViewSection]);

function mmsViewSection($compile, $templateCache, $rootScope, ViewService, UxService, Utils) {

    var defaultTemplate = $templateCache.get('mms/templates/mmsViewSection.html');

    var mmsViewSectionCtrl = function($scope, $rootScope) {

        $scope.sectionInstanceVals = [];
        $scope.bbApi = {};
        $scope.buttons = [];
        $scope.buttonsInit = false;
        $scope.element = $scope.section;  // This is for methods in Utils 

        $scope.bbApi.init = function() {
            if (!$scope.buttonsInit) {
                $scope.buttonsInit = true;
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-preview", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("section-add-dropdown", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-save", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-cancel", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-delete", $scope));
                $scope.bbApi.setPermission("presentation-element-delete", $scope.isDirectChildOfPresentationElement);
            }     
        };

    };

    var mmsViewSectionLink = function(scope, element, attrs, controllers) {

        var mmsViewCtrl = controllers[0];
        var mmsViewPresentationElemCtrl = controllers[1];

        element.click(function(e) {
            //should not do anything if section is not an instancespec
            if (scope.addFrame)
                scope.addFrame();
            if (mmsViewCtrl && mmsViewPresentationElemCtrl)
                mmsViewCtrl.transcludeClicked(scope.section.sysmlId); //show instance spec if clicked
            e.stopPropagation();
        });

        var recompile = function() {
            scope.isEditing = false;
            scope.recompileEdit = false;
        };

        var recompileEdit = function() {
            // do nothing
        };

        element.append(defaultTemplate);
        $compile(element.contents())(scope); 

        scope.structEditable = function() {
            if (mmsViewCtrl) {
                return mmsViewCtrl.getStructEditable();
            } else
                return false;
        };

        if (mmsViewCtrl) {
            var viewVersion = mmsViewCtrl.getWsAndVersion();
            if (viewVersion) {
                scope.ws = viewVersion.workspace;
                scope.version = viewVersion.version;
            }
            if (!scope.version)
                scope.version = 'latest';
        }

        if (mmsViewCtrl && mmsViewPresentationElemCtrl) {
            
            scope.isEditing = false;
            scope.recompileEdit = false;
            scope.elementSaving = false;
            scope.cleanUp = false;
            scope.instanceSpec = mmsViewPresentationElemCtrl.getInstanceSpec();
            scope.instanceVal = mmsViewPresentationElemCtrl.getInstanceVal();
            scope.presentationElem = mmsViewPresentationElemCtrl.getPresentationElement();
            scope.view = mmsViewCtrl.getView();
            scope.isDirectChildOfPresentationElement = Utils.isDirectChildOfPresentationElementFunc(element, mmsViewCtrl);
            if (scope.instanceSpec.classifierIds[0] === ViewService.TYPE_TO_CLASSIFIER_ID.Section)
                scope.isDirectChildOfPresentationElement = false;
            var type = "name";

            if (scope.version === 'latest') {
                scope.$on('element.updated', function(event, eid, ws, type, continueEdit) {
                    if (eid === scope.section.sysmlId && ws === scope.ws && (type === 'all' || type === 'name') && !continueEdit)
                        recompile();
                });
            }

            scope.save = function() {
                Utils.saveAction(scope,recompile,scope.bbApi,scope.section,type);
            };

            scope.cancel = function() {
                Utils.cancelAction(scope,recompile,scope.bbApi,type);
            };

            scope.delete = function() {
                Utils.deleteAction(scope,scope.bbApi,mmsViewPresentationElemCtrl.getParentSection());
            };

            scope.addFrame = function() {
                Utils.addFrame(scope,mmsViewCtrl,element,null,scope.section);
            };

            scope.preview = function() {
                Utils.previewAction(scope, recompileEdit, recompile, type);
            };
        } 
    };

    return {
        restrict: 'E',
        scope: {
            section: '<mmsSection' //this is json if contains, the instancespec if contents
        },
        require: ['?^mmsView','?^mmsViewPresentationElem'],
        controller: ['$scope', '$rootScope', mmsViewSectionCtrl],
        link: mmsViewSectionLink
    };
}