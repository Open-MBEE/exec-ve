'use strict';

angular.module('mms.directives')
.directive('mmsViewElemRefTree', ['ViewService', 'ElementService', '$templateCache', mmsViewElemRefTree]);

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
 * @param mmsInstanceVal A InstanceValue json object or sysmlid
 */
function mmsViewElemRefTree(ViewService, ElementService, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsViewElemRefTree.html');

    var mmsViewElemRefTreeCtrl = function($scope) {
        
        $scope.presentationElem = {};

        // If mmsInstanceVal is string, then assume its a sysmlid and search 
        // for the node.  This allows us to be flexible to whether
        // instanceSpecificationSpecification will use embedded json or not:
        if ($scope.mmsInstanceVal) {
            if ($scope.mmsInstanceVal.constructor == String) {
                    ElementService.getElement($scope.mmsInstanceVal, false, $scope.workspace)
                    .then(function(instanceVal) {
                        // Parse the element reference tree for the presentation element:
                        ViewService.parseExprRefTree(instanceVal, $scope.workspace)
                        .then(function(element) {
                            $scope.presentationElem = element;
                        });
                    });
            }
            else {
                // Parse the element reference tree for the presentation element:
                ViewService.parseExprRefTree($scope.mmsInstanceVal, $scope.workspace)
                .then(function(element) {
                    $scope.presentationElem = element;
                });
            }
        }
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsInstanceVal: '=',
        },
        controller: ['$scope', mmsViewElemRefTreeCtrl],
        //link: mmsViewElemRefTreeLink
    };
}