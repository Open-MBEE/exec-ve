'use strict';

angular.module('mms.directives')
.directive('mmsDiffAttr', ['$compile', '$rootScope', '$interval', '$templateCache', '$q', 'ElementService', mmsDiffAttr]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsDiffAttr
 *
 * @requires mms.ElementService
 * @requires $compile
 * @requires $rootScope
 * @requires $interval
 *
 * @restrict E
 *
 * @description
 *  Compares a element at two different refs/commits and generates a pretty diff.
 * ## Example
 * <mms-diff-attr mms-element-id="" mms-attr="name|doc|val"
 * (mms-project-id="" mms-base-ref-id="" mms-compare-ref-id=""
 * mms-base-commit-id="" mms-compare-commit-id="")></mms-diff-attr>
 */
function mmsDiffAttr($compile, $rootScope, $interval, $templateCache, $q, ElementService) {
    var template = $templateCache.get('mms/templates/mmsDiffAttr.html');

    var baseNotFound = false;
    var compNotFound = false;
    var baseDeleted = false;
    var compDeleted = false;

    return {
        restrict: 'E',
        scope: {
            mmsAttr: '@',
            mmsProjectId: '@',
            mmsBaseRefId: '@',
            mmsBaseCommitId: '@',
            mmsCompareRefId: '@',
            mmsCompareCommitId: '@',
            mmsElementId: '@'
        },
        template: template,
        link: mmsDiffAttrLink,
        controller: ['$scope', mmsDiffAttrCtrl]
    };

    function mmsDiffAttrLink(scope, element, attrs) {}

    function mmsDiffAttrCtrl($scope) {
        $scope.diffFinish = function() {
            $scope.diffLoading = false;
        };

        $scope.$watch('mmsBaseCommitId', function(newVal, oldVal) {
            commitIdChangeHandler(newVal, oldVal, $scope);
        });

        $scope.$watch('mmsCompareCommitId', function(newVal, oldVal) {
            commitIdChangeHandler(newVal, oldVal, $scope);
        });

        setupDiff($scope);
    }

    function commitIdChangeHandler(newVal, oldVal, scope) {
        if (newVal !== oldVal) {
            setupDiff(scope);
        }
    }

    function setupDiff(scope) {
        scope.diffLoading = true;
        baseNotFound = false;
        compNotFound = false;
        baseDeleted = false;
        compDeleted = false;

        var projectId = scope.mmsProjectId;
        var elementId = scope.mmsElementId;

        var baseRefId = scope.mmsBaseRefId || 'master';
        var baseCommitId = scope.mmsBaseCommitId || 'latest';

        var compareRefId = scope.mmsCompareRefId || baseRefId;
        var compareCommitId = scope.mmsCompareCommitId || 'latest';

        if (baseCommitId === compareCommitId) {
            scope.message = ' Comparing same commit.';
            scope.diffLoading = false;
            return;
        }

        var baseElementPromise = getElementData(projectId, baseRefId, baseCommitId, elementId);
        var comparedElementPromise = getElementData(projectId, compareRefId, compareCommitId, elementId);

        $q.allSettled([baseElementPromise, comparedElementPromise]).then(function(responses) {
            var message;

            var respForBaseElement = responses[0];
            if (respForBaseElement.state === 'fulfilled') {
                fullyRender(respForBaseElement.value, scope, function(baseElementHtml) {
                    scope.baseElementHtml = baseElementHtml;
                });
            } else {
                message = respForBaseElement.reason.data.message;
                if (message && message.toLowerCase().includes("deleted")) {
                    baseDeleted = true;
                } else {
                    baseNotFound = true;
                    scope.baseElementHtml = '';
                }
            }

            var respForComparedElement = responses[1];
            if(respForComparedElement.state === 'fulfilled') {
                fullyRender(respForComparedElement.value, scope, function(comparedElementHtml) {
                    scope.comparedElementHtml = comparedElementHtml;
                });
            } else {
                message = respForComparedElement.reason.data.message;
                if (message && message.toLowerCase().includes("deleted")) {
                    compDeleted = true;
                } else {
                    compNotFound = true;
                    scope.comparedElementHtml = '';
                }
            }

            scope.message = checkElement(baseNotFound, compNotFound, baseDeleted, compDeleted);
        });
    }


    function getElementData(projectId, refId, commitId, elementId) {
        return ElementService.getElement({
            projectId:  projectId,
            elementId:  elementId,
            refId:      refId,
            commitId:   commitId
        });
    }

    function fullyRender(data, scope, finishRenderCb) {
        var dataAsHtmlDom = createTransclude(data.id, scope.mmsAttr, data._projectId, data._refId, data._commitId);
        $compile(dataAsHtmlDom)($rootScope.$new());
        var baseHtml = angular.element(dataAsHtmlDom).html();
        var handler = $interval(function() {
            if (!baseHtml.includes("(loading...)")) {
                $interval.cancel(handler);
                finishRenderCb(angular.element(dataAsHtmlDom).html());
            }
        }, 10);
    }

    function createTransclude(elementId, type, projectId, refId, commitId) {
        var transcludeElm = angular.element('<mms-cf>');
        transcludeElm.attr("mms-cf-type", type);
        transcludeElm.attr("mms-element-id", elementId);
        transcludeElm.attr("mms-project-id", projectId);
        transcludeElm.attr("mms-ref-id", refId);
        transcludeElm.attr("mms-commit-id", commitId);
        return transcludeElm;
    }

    function checkElement(baseNotFound, compNotFound, baseDeleted, compDeleted) {
        var message = '';
        if (baseNotFound && compNotFound) {
            message = ' Both base and compare elements do not exist.';
        } else if (baseNotFound) {
            message = ' This is a new element.';
        } else if (compNotFound) {
            message = ' Comparison element does not exist.';
        }
        if (baseDeleted && compDeleted) {
            message = ' This element has been deleted.';
        } else if (baseDeleted){
            message = ' Base element has been deleted.';
        } else if (compDeleted){
            message = ' Comparison element has been deleted.';
        }
        return message;
    }
}
