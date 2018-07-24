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
        $scope.$watch('mmsBaseCommitId', _commitIdChangeHandler);
        $scope.$watch('mmsCompareCommitId', _commitIdChangeHandler);

        var baseNotFound = false;
        var compNotFound = false;
        var baseDeleted = false;
        var compDeleted = false;

        _setupDiff();

        function _setupDiff() {
            $scope.diffLoading = true;
            baseNotFound = false;
            compNotFound = false;
            baseDeleted = false;
            compDeleted = false;

            var projectId = $scope.mmsProjectId;
            var elementId = $scope.mmsElementId;

            var baseRefId = $scope.mmsBaseRefId || 'master';
            var baseCommitId = $scope.mmsBaseCommitId || 'latest';

            var compareRefId = $scope.mmsCompareRefId || baseRefId;
            var compareCommitId = $scope.mmsCompareCommitId || 'latest';

            if (baseCommitId === compareCommitId) {
                $scope.message = ' Comparing same commit.';
                $scope.diffLoading = false;
                return;
            }

            var baseElementPromise = _getElementData(projectId, baseRefId, baseCommitId, elementId);
            var comparedElementPromise = _getElementData(projectId, compareRefId, compareCommitId, elementId);

            $q.allSettled([baseElementPromise, comparedElementPromise]).then(function(responses) {
                var message;

                var respForBaseElement = responses[0];
                if (respForBaseElement.state === 'fulfilled') {
                    _fullyRender(respForBaseElement.value, function(baseElementHtml) {
                        $scope.baseElementHtml = baseElementHtml;
                    });
                } else {
                    message = respForBaseElement.reason.data.message;
                    if (message && message.toLowerCase().includes("deleted")) {
                        baseDeleted = true;
                    } else {
                        baseNotFound = true;
                        $scope.baseElementHtml = '';
                    }
                }

                var respForComparedElement = responses[1];
                if(respForComparedElement.state === 'fulfilled') {
                    _fullyRender(respForComparedElement.value, function(comparedElementHtml) {
                        $scope.comparedElementHtml = comparedElementHtml;
                    });
                } else {
                    message = respForComparedElement.reason.data.message;
                    if (message && message.toLowerCase().includes("deleted")) {
                        compDeleted = true;
                    } else {
                        compNotFound = true;
                        $scope.comparedElementHtml = '';
                    }
                }

                $scope.message = _checkElement();
            });
        }

        function _commitIdChangeHandler(newVal, oldVal) {
            if (newVal !== oldVal) {
                _setupDiff();
            }
        }

        function _getElementData(projectId, refId, commitId, elementId) {
            return ElementService.getElement({
                projectId:  projectId,
                elementId:  elementId,
                refId:      refId,
                commitId:   commitId
            });
        }

        function _fullyRender(data, finishRenderCb) {
            var element = _createElement($scope.mmsAttr, data.id, data._projectId, data._refId, data._commitId);
            var handler = $interval(function() {
                var baseHtml = element.html();
                if (!baseHtml.includes("(loading...)")) {
                    $interval.cancel(handler);
                    finishRenderCb(baseHtml);
                }
            }, 10);
        }

        function _createElement(type, mmsElementId, mmsProjectId, mmsRefId, mmsCommitId) {
            var html;
            var ignoreMathjaxAutoFormatting = type === 'doc' || type === 'val' || type === 'com';
            html = '<mms-cf ' + (ignoreMathjaxAutoFormatting ? 'mms-generate-for-diff="mmsGenerateForDiff" ' : '') +  'mms-cf-type="{{type}}" mms-element-id="{{mmsElementId}}" mms-project-id="{{mmsProjectId}}" mms-ref-id="{{mmsRefId}}" mms-commit-id="{{mmsCommitId}}"></mms-cf>';
            var newScope = $rootScope.$new();
            newScope = Object.assign(newScope, {
                type: type,
                mmsElementId: mmsElementId,
                mmsProjectId: mmsProjectId,
                mmsRefId: mmsRefId,
                mmsCommitId: mmsCommitId,
                mmsGenerateForDiff: true
            });
            return $compile(html)(newScope);
        }

        function _checkElement() {
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
}
