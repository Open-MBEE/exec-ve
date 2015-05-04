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
            $rootScope.$broadcast('element.edit.cancel', $scope.mmsInstanceVal);
        };

        $scope.save = function(instanceVal) {
            $rootScope.$broadcast('element.edit.save', $scope.mmsInstanceVal);
        };

        $scope.delete = function() {
            $rootScope.$broadcast('element.delete', $scope.mmsInstanceVal, $scope.presentationElem);
        };

        $scope.edit = function(instanceVal) {
            $rootScope.$broadcast('element.edit', instanceVal);            
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

    };

    var mmsViewElemRefTreeLink = function(scope, element, attrs, mmsViewCtrl) {

        scope.showEdits = function () {
            return mmsViewCtrl.getShowEdits();
        };

        scope.showEditsWireFrame = function (instanceVal) {
            return mmsViewCtrl.getShowEditsWireFrame(instanceVal);
        };

        scope.isEditing = function(instance) {
            return mmsViewCtrl.isEditingInstance(instance.instance);
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