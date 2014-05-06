'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeVal', ['ElementService', '$compile', mmsTranscludeVal]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeVal
 *
 * @requires mms.ElementService
 * @requires $compile
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's value binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and val change,
 * and on click. The element should be a Property. Nested transclusions within 
 * string values will also be registered.
 *
 * @param {string} eid The id of the property whose value to transclude
 */
function mmsTranscludeVal(ElementService, $compile) {
    var template = '<span ng-repeat="value in element.value">{{value}}</span>';
    var mmsTranscludeValLink = function(scope, element, attrs, mmsViewCtrl) {
        element.click(function(e) {
            if (mmsViewCtrl === null || mmsViewCtrl === undefined)
                return false;
            mmsViewCtrl.transcludeClicked(scope.eid);
            //e.stopPropagation();
            return false;
        });

        var recompile = function() {
            var toCompileList = [];
            for (var i = 0; i < scope.element.value.length; i++) {
                toCompileList.append(scope.element.value[i]);
            } 
            element.empty();
            var toCompile = toCompileList.join(', ');
            element.append(toCompile);
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
                if (scope.element.valueType === "LiteralString") {
                    recompile();
                    scope.$watchCollection('element.value', recompile);
                } else {
                    var el = $compile(template)(scope);
                    element.empty();
                    element.append(el);
                }
            });
        });
    };

    return {
        restrict: 'E',
        //template: template,
        scope: {
            eid: '@',
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsTranscludeValLink
    };
}