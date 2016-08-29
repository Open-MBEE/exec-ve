'use strict';

angular.module('mms.directives')
.directive('mmsViewPresentationElem', ['ViewService', 'ElementService', '$templateCache', '$rootScope', '$timeout', '$location', '$anchorScroll', 'growl', mmsViewPresentationElem]);

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
function mmsViewPresentationElem(ViewService, ElementService, $templateCache, $rootScope, $timeout, $location, $anchorScroll, growl) {
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
            if (!scope.mmsInstanceVal.instance) {
                element.html('<span class="mms-error">Reference is null</span>');
                //growl.error("A presentation element reference is null.");
                return;
            }
            var ws = null;
            var version = null;
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getWsAndVersion();
                ws = viewVersion.workspace;
                version = viewVersion.version;
            }
            // Parse the element reference tree for the presentation element:
            element.addClass("isLoading");
            ViewService.parseExprRefTree(scope.mmsInstanceVal, ws, version, 1)
            .then(function(elem) {
                scope.presentationElem = elem;
                // This is a kludge to get the template switch statement to work
                // for Sections:
                if (ViewService.isSection(elem)) {
                    scope.presentationElem.type = 'Section';
                }

                ElementService.getElement(scope.mmsInstanceVal.instance, false, ws, version, 1).
                then(function(instanceSpec) {
                    scope.instanceSpec = instanceSpec;
                    scope.presentationElemLoading = false;
                    var hash = $location.hash();
                    if (hash === instanceSpec.sysmlId) {
                        $timeout(function() {
                            $anchorScroll();
                        }, 1000, false);
                    }
                    element.click(function(e) {
                        if (mmsViewCtrl)
                            mmsViewCtrl.transcludeClicked(instanceSpec.sysmlId, ws, version);
                        e.stopPropagation();
                    });
                });
            }, function(reason) {
                if (reason.status === 500) {
                    element.html('<span class="mms-error">View element reference error: ' + scope.mmsInstanceVal.instance + ' invalid specification</span>');
                } else {
                    var status = ' not found';
                    if (reason.status === 410)
                        status = ' deleted';
                    element.html('<span class="mms-error">View element reference error: ' + scope.mmsInstanceVal.instance + ' ' + status + '</span>');
                }//growl.error('View Element Ref Error: ' + scope.mmsInstanceVal.instance + ' ' + reason.message);
            }).finally(function() {
                element.removeClass("isLoading");
            }); 
        } 
    };

    return {
        restrict: 'E',
        template: template,
        require: '?^mmsView',
        scope: {
            mmsInstanceVal: '<',
            mmsParentSection: '<',
        },
        controller: ['$scope', '$rootScope', mmsViewPresentationElemCtrl],
        link: mmsViewPresentationElemLink
    };
}