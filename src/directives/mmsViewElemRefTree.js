'use strict';

angular.module('mms.directives')
.directive('mmsViewElemRefTree', ['ViewService', 'ElementService', '$templateCache', '$rootScope', mmsViewElemRefTree]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsViewElemRefTree
 *
 * @requires mms.ViewService
 * @requires $templateCache
 * @restrict E
 *
 * @description
 * Given a InstanceVal, parses the element reference tree to get the corresponding
 * presentation element, and renders it in the view
 * 
 * @param mmsInstanceVal A InstanceValue json object 
 */
function mmsViewElemRefTree(ViewService, ElementService, $templateCache, $rootScope) {
    var template = $templateCache.get('mms/templates/mmsViewElemRefTree.html');

    var mmsViewElemRefTreeCtrl = function($scope, $rootScope) {
        
        $scope.callBackFncs = {};
        $scope.presentationElem = {};
        $scope.instanceSpecName = "";
        $scope.presentationElemLoading = true;

        if ($scope.mmsInstanceVal) {

            // Parse the element reference tree for the presentation element:
            ViewService.parseExprRefTree($scope.mmsInstanceVal, $scope.workspace)
            .then(function(element) {
                $scope.presentationElem = element;

                // This is a kludge to get the template switch statement to work
                // for Sections:
                if (ViewService.isSection(element)) {
                    $scope.presentationElem.type = 'Section';
                }

                ElementService.getElement($scope.mmsInstanceVal.instance, false, $scope.workspace).
                then(function(instanceSpec) {
                    $scope.instanceSpecName = instanceSpec.name;
                });

                $scope.presentationElemLoading = false;
            });           
        }      

        $scope.cancel = function(instanceVal) {
            $scope.callBackFncs.cancel(instanceVal);  // Calls the cancel callback in mmsTranscludeDoc            
        };

        $scope.save = function(instanceVal, presentationElem) {
            $scope.callBackFncs.save(instanceVal, presentationElem);  // Calls the save callback in mmsTranscludeDoc
        };

        $scope.delete = function() {
            $rootScope.$broadcast('element.delete', $scope.mmsInstanceVal, $scope.presentationElem);
        };

        $scope.edit = function(instanceVal, presentationElem) {
            $scope.callBackFncs.edit(instanceVal, presentationElem);  // Calls the edit callback in mmsTranscludeDoc            
        };

        $scope.toggleFrame = function() {
            $rootScope.$broadcast("show.edits.wireframe", $scope.mmsInstanceVal);
        };

        this.toggleWireFrame = function() {
            $rootScope.$broadcast("show.edits.wireframe", $scope.mmsInstanceVal);
        };

        this.getInstanceId = function() {
            return $scope.mmsInstanceVal.instance;
        };

        this.registerCallBackFnc = function(callbackFnc, type) {
            $scope.callBackFncs[type] = callbackFnc;
        };

    };

    var mmsViewElemRefTreeLink = function(scope, element, attrs, mmsViewCtrl) {

        scope.showEdits = function () {
            return mmsViewCtrl.getShowEdits();
        };

        scope.showEditsWireFrame = function (instanceVal) {
            return mmsViewCtrl.getShowEditsWireFrame(instanceVal);
        };

        scope.isEditing = function(instanceVal) {
            return mmsViewCtrl.isEditing(instanceVal);
        };
       
    };


    return {
        restrict: 'E',
        template: template,
        require: '?^mmsView',
        scope: {
            mmsInstanceVal: '=',
        },
        controller: ['$scope', '$rootScope', mmsViewElemRefTreeCtrl],
        link: mmsViewElemRefTreeLink
    };
}