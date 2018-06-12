'use strict';

angular.module('mms.directives')
    .directive('mmsHtmlDiff', ['$templateCache', 'HtmlRenderedDiff', mmsHtmlDiff]);

function mmsHtmlDiff($templateCache, HtmlRenderedDiff) {
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
        var diffResult = HtmlRenderedDiff.generateDiff(baseHtml, comparedHtml);
        // still need to run math stuff to render it properly
        // if (MathJax) {
        //     MathJax.Hub.Queue(["Typeset", MathJax.Hub, domElement[0]]);
        // }
        scope.diffResult = diffResult;
        scope.mmsDiffFinish();
    }
}
