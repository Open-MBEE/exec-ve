'use strict';

angular.module('mms.directives')
    .directive('mmsHtmlDiff', ['$templateCache', 'htmldiff', mmsHtmlDiff]);

function mmsHtmlDiff($templateCache, htmldiff) {
    var template = $templateCache.get('mms/templates/mmsHtmlDiff.html');
    return {
        restrict: 'E',
        scope: {
            mmsBaseHtml: '<',
            mmsComparedHtml: '<',
            mmsDiffFinish: '<'
        },
        template: template,
        controller: ['$scope', mmsHtmlDiffCtrl],
        link: mmsHtmlDiffLink
    };

    function mmsHtmlDiffCtrl($scope) {
        performDiff($scope, $scope.mmsBaseHtml, $scope.mmsComparedHtml);
    }

    function mmsHtmlDiffLink(scope, element, attrs) {
        scope.$watch('mmsBaseHtml', function(newBaseHtml, oldBaseHtml) {
            if (newBaseHtml !== oldBaseHtml) {
                performDiff(scope, scope.mmsBaseHtml, scope.mmsComparedHtml);
            }
        });

        scope.$watch('mmsComparedHtml', function(newComparedHtml, oldComparedHtml) {
            if(newComparedHtml !== oldComparedHtml) {
                performDiff(scope, scope.mmsBaseHtml, scope.mmsComparedHtml);
            }
        });
    }

    function performDiff(scope, baseHtml, comparedHtml) {
        var diffResult = htmldiff(baseHtml, comparedHtml);
        scope.diffResult = diffResult;
        scope.mmsDiffFinish();
    }
}