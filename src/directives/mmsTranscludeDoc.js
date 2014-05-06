'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeDoc', ['ElementService', '$compile', mmsTranscludeDoc]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeDoc
 *
 * @requires mms.ElementService
 * @requires $compile
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's documentation binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 *
 * @param {string} eid The id of the element whose doc to transclude
 */
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