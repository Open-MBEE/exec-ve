'use strict';

angular.module('mms.directives')
.directive('mmsViewSection', ['$compile', '$templateCache', '$rootScope', 'ElementService', 'UxService', 'Utils', mmsViewSection]);

function mmsViewSection($compile, $templateCache, $rootScope, ElementService, UxService, Utils) {

    // TODO: 
    //      Deleting sections with in sections gives a console error, prob b/c the section is not
    //      added to the tree correctly which needs to fixed
    //
    //      Tracker is not cleared for children of the section that are opened when the section
    //      is opened also.


    var defaultTemplate = $templateCache.get('mms/templates/mmsViewSection.html');
    var frameTemplate = $templateCache.get('mms/templates/mmsViewSectionFrame.html');
    var editTemplate = $templateCache.get('mms/templates/mmsViewSectionEdit.html');

    var mmsViewSectionCtrl = function($scope, $rootScope) {

        $scope.sectionInstanceVals = [];
        $scope.bbApi = {};
        $scope.buttons = [];
        $scope.buttonsInit = false;
        $scope.element = $scope.section;  // This is for methods in Utils 

        // if ($scope.section && $scope.section.specialization && 
        //     $scope.section.specialization.instanceSpecificationSpecification && 
        //     $scope.section.specialization.instanceSpecificationSpecification.operand) {

        //     $scope.sectionInstanceVals = $scope.section.specialization.instanceSpecificationSpecification.operand;
        // }

        $scope.bbApi.init = function() {
            if (!$scope.buttonsInit) {
                $scope.buttonsInit = true;
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
            if (scope.addFrame)
                scope.addFrame();
        });

        var recompile = function() {
            element.empty();
            element.append(defaultTemplate);
            $compile(element.contents())(scope); 
        };

        var recompileEdit = function() {
            element.empty();
            element.append(editTemplate);
            $compile(element.contents())(scope); 
        };

        // element.append(defaultTemplate);
        // $compile(element.contents())(scope); 
        recompile();

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
            scope.elementSaving = false;
            scope.cleanUp = false;
            scope.instanceSpec = mmsViewPresentationElemCtrl.getInstanceSpec();
            scope.instanceVal = mmsViewPresentationElemCtrl.getInstanceVal();
            scope.presentationElem = mmsViewPresentationElemCtrl.getPresentationElement();
            scope.view = mmsViewCtrl.getView();
            scope.isDirectChildOfPresentationElement = Utils.isDirectChildOfPresentationElementFunc(element, mmsViewCtrl);

            mmsViewCtrl.registerPresenElemCallBack(function() {
                Utils.showEditCallBack(scope,mmsViewCtrl,element,frameTemplate,recompile,recompileEdit,"name",scope.section);
            });

            scope.save = function() {
                Utils.saveAction(scope,recompile,mmsViewCtrl,scope.bbApi,scope.section);
            };

            scope.cancel = function() {
                Utils.cancelAction(scope,mmsViewCtrl,recompile,scope.bbApi,"name");
            };

            scope.delete = function() {
                Utils.deleteAction(scope,scope.bbApi,mmsViewPresentationElemCtrl.getParentSection());
            };

            scope.addFrame = function() {
                Utils.addFrame(scope,mmsViewCtrl,element,frameTemplate,scope.section);
            };
        } 
    };

    return {
        restrict: 'E',
        scope: {
            section: '=mmsSection',
            instanceVal: '=mmsInstanceVal'
        },
        require: ['?^mmsView','?^mmsViewPresentationElem'],
        controller: ['$scope', '$rootScope', mmsViewSectionCtrl],
        link: mmsViewSectionLink
    };
}