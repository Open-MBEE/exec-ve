'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeDoc', ['ElementService', '$compile', mmsTranscludeDoc]);

function mmsTranscludeDoc(ElementService, $compile) {

    var mmsTranscludeDocLink = function(scope, element, attrs, mmsViewCtrl) {
        element.click(function(e) {
            if (mmsViewCtrl === null || mmsViewCtrl === undefined)
                return false;
            mmsViewCtrl.transcludeClicked(scope.eid);
            //e.stopPropagation();
            return false;
        });

        var recompile = function() {
            element.empty();
            var doc = scope.element.documentation;
            element.append(doc);
            $compile(element.contents())(scope); 
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.element);
            }
        };

        scope.$watch('eid', function(newVal, oldVal) {
            if (newVal === undefined || newVal === null || newVal === '')
                return;
            ElementService.getElement(scope.eid).then(function(data) {
                scope.element = data;
                recompile();
                scope.$watch('element.documentation', recompile);
            });
        });
    };

    return {
        restrict: 'E',
        scope: {
            eid: '@',
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsTranscludeDocLink
    };
}