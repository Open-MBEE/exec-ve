'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeName', ['ElementService', '$compile', mmsTranscludeName]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeName
 *
 * @requires mms.ElementService
 * @requires $compile
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's name binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and name change,
 * and on click
 *
 * @param {string} eid The id of the element whose name to transclude
 */
function mmsTranscludeName(ElementService, $compile) {

    var mmsTranscludeNameLink = function(scope, element, attrs, mmsViewCtrl) {
        element.click(function(e) {
            if (mmsViewCtrl === null || mmsViewCtrl === undefined)
                return false;
            mmsViewCtrl.transcludeClicked(scope.eid);
            return false;
        });

        scope.$watch('eid', function(newVal, oldVal) {
            if (newVal === undefined || newVal === null || newVal === '')
                return;
            ElementService.getElement(scope.eid).then(function(data) {
                scope.element = data;
                if (mmsViewCtrl) {
                    mmsViewCtrl.elementTranscluded(scope.element);
                    scope.watch('element.name', function() {
                        mmsViewCtrl.elementTranscluded(scope.element);
                    });
                }
            });
        });
    };

    return {
        restrict: 'E',
        template: '{{element.name}}',
        scope: {
            eid: '@',
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsTranscludeNameLink
    };
}