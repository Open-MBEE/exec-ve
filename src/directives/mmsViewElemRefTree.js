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
 * @param mmsInstanceVal A InstanceValue json object 
 */
function mmsViewElemRefTree(ViewService, ElementService, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsViewElemRefTree.html');

    var mmsViewElemRefTreeCtrl = function($scope) {
        
        $scope.presentationElem = {};

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
            });           
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