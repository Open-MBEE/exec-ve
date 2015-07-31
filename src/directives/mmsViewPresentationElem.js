'use strict';

angular.module('mms.directives')
.directive('mmsViewPresentationElem', ['ViewService', 'ElementService', '$templateCache', '$rootScope', mmsViewPresentationElem]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsViewPresentationElem
 *
 * @requires mms.ViewService
 * @requires $templateCache
 * @restrict E
 *
 * @description
 * Given a InstanceVal, parses the element reference tree to get the corresponding
 * presentation element, and renders it in the view
 * 
 * @param {Object} mmsInstanceVal A InstanceValue json object 
 * @param {Object} mmsParentSection the parent section if available
 */
function mmsViewPresentationElem(ViewService, ElementService, $templateCache, $rootScope) {
    var template = $templateCache.get('mms/templates/mmsViewPresentationElem.html');

    var mmsViewPresentationElemCtrl = function($scope, $rootScope) {
        
        $scope.presentationElemLoading = true;
        this.getInstanceSpec = function() {
            return $scope.instanceSpec;
        };

        this.getInstanceVal = function() {
            return $scope.mmsInstanceVal;
        };

        this.getPresentationElement = function() {
            return $scope.presentationElem;
        };

        this.getParentSection = function() {
            return $scope.mmsParentSection;
        };
    };

    var mmsViewPresentationElemLink = function(scope, element, attrs, mmsViewCtrl) {
        if (scope.mmsInstanceVal) {
            var ws = null;
            var version = null;
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getWsAndVersion();
                ws = viewVersion.workspace;
                version = viewVersion.version;
            }
            // Parse the element reference tree for the presentation element:
            ViewService.parseExprRefTree(scope.mmsInstanceVal, ws, version)
            .then(function(element) {
                scope.presentationElem = element;
                // This is a kludge to get the template switch statement to work
                // for Sections:
                if (ViewService.isSection(element)) {
                    scope.presentationElem.type = 'Section';
                }

                ElementService.getElement(scope.mmsInstanceVal.instance, false, ws, version).
                then(function(instanceSpec) {
                    scope.instanceSpec = instanceSpec;
                    scope.presentationElemLoading = false;
                });
            });
        } 
    };

    return {
        restrict: 'E',
        template: template,
        require: '?^mmsView',
        scope: {
            mmsInstanceVal: '=',
            mmsParentSection: '=',
        },
        controller: ['$scope', '$rootScope', mmsViewPresentationElemCtrl],
        link: mmsViewPresentationElemLink
    };
}