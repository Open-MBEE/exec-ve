'use strict';

angular.module('mms.directives')
.directive('mmsViewElemRefTree', ['ViewService', 'ElementService', '$templateCache', '$rootScope', mmsViewElemRefTree]);

// TODO CHANGE THE NAME OF THIS DIRECTIVE TO PRESENATION ELEMENT!!!!

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
                    $scope.instanceSpec = instanceSpec;
                    $scope.instanceSpecName = instanceSpec.name;
                });

                $scope.presentationElemLoading = false;
            });           
        } 

        this.getInstanceSpec = function() {
            return $scope.instanceSpec;
        };

        this.getInstanceVal = function() {
            return $scope.mmsInstanceVal;
        };

        this.getPresentationElement = function() {
            return $scope.presentationElem;
        };      
    };

    var mmsViewElemRefTreeLink = function(scope, element, attrs, mmsViewCtrl) {
       
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