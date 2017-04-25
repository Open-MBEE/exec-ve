'use strict';

angular.module('mms.directives')
.directive('mmsViewPresentationElem', ['ViewService', 'ElementService', '$templateCache', '$rootScope', '$timeout', '$location', '$anchorScroll', 'growl', mmsViewPresentationElem]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsViewPresentationElem
 *
 * @requires mms.ViewService
 * @requires mms.ElementService
 * @requires $templateCache
 * @requires $location
 * @requires $timeout
 * @requires $rootScope
 * @requires $anchorScroll
 * @requires growl
 *
 *
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
            if (!scope.mmsInstanceVal.instanceId) {
                element.html('<span class="mms-error">Reference is null</span>');
                return;
            }
            var projectId = null;
            var refId = null;
            var commitId = null;
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getElementOrigin();
                projectId = viewVersion.projectId;
                refId = viewVersion.refId;
                commitId = viewVersion.commitId;
            }
            // Parse the element reference tree for the presentation element:
            element.addClass("isLoading");
            var reqOb = {elementId: scope.mmsInstanceVal.instanceId, projectId: projectId, refId: refId, commitId: commitId};
            ElementService.getElement(reqOb, 1)
            .then(function(instanceSpec) {
                scope.presentationElem = ViewService.getPresentationElementSpec(instanceSpec);
                scope.instanceSpec = instanceSpec;
                scope.presentationElemLoading = false;
                var hash = $location.hash();
                if (hash === instanceSpec.id) {
                    $timeout(function() {
                        $anchorScroll();
                    }, 1000, false);
                }
                if (mmsViewCtrl) {
                    mmsViewCtrl.elementTranscluded(instanceSpec);
                }
                element.click(function(e) {
                    if (mmsViewCtrl)
                        mmsViewCtrl.transcludeClicked(instanceSpec);
                    e.stopPropagation();
                });
            }, function(reason) {
                if (reason.status === 500) {
                    element.html('<span class="mms-error">View element reference error: ' + scope.mmsInstanceVal.instanceId + ' invalid specification</span>');
                } else {
                    var status = ' not found';
                    if (reason.status === 410)
                        status = ' deleted';
                    element.html('<span class="mms-error">View element reference error: ' + scope.mmsInstanceVal.instanceId + ' ' + status + '</span>');
                }
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