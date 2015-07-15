'use strict';

angular.module('mms.directives')
.directive('mmsViewSection', ['$compile', '$templateCache', '$rootScope', 'ElementService', 'ViewService', 'UxService', 'Utils', mmsViewSection]);

function mmsViewSection($compile, $templateCache, $rootScope, ElementService, ViewService, UxService, Utils) {

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
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation.element.preview", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("section.add.dropdown", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation.element.save", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation.element.cancel", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation.element.delete", $scope));
                $scope.bbApi.setPermission("presentation.element.delete", $scope.isDirectChildOfPresentationElement);
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
            e.stopPropagation();
        });

        var recompile = function() {
            // do nothing
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
            if (viewVersion)
                scope.ws = viewVersion.workspace;
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
            if (scope.instanceSpec.specialization.classifier[0] === ViewService.typeToClassifierId.Section)
                scope.isDirectChildOfPresentationElement = false;
            var type = "name";

            var callback = function() {
                Utils.showEditCallBack(scope,mmsViewCtrl,element,null,recompile,recompileEdit,type,scope.section);
            };

            mmsViewCtrl.registerPresenElemCallBack(callback);

            scope.$on('$destroy', function() {
                mmsViewCtrl.unRegisterPresenElemCallBack(callback);
            });

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
            section: '=mmsSection'
        },
        require: ['?^mmsView','?^mmsViewPresentationElem'],
        controller: ['$scope', '$rootScope', mmsViewSectionCtrl],
        link: mmsViewSectionLink
    };
}