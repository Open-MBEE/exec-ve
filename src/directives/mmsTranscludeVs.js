'use strict';

angular.module('mms')
.directive('mmsTranscludeVs', ['ElementService', '$compile', mmsTranscludeVs]);

function mmsTranscludeVs(ElementService, $compile) {

    var mmsTranscludeVsLink = function(scope, element, attrs) {
        scope.$watch('eid', function(newVal, oldVal) {
            if (newVal === undefined || newVal === null || newVal === '')
                return;
            ElementService.getElement(scope.eid).then(function(data) {
                scope.element = data;
                var s = scope.element.string;
                element.append(s);
                $compile(element.contents())(scope);
                //var el = $compile(doc)(scope);
                //element.append(el);
                scope.$watch('element.string', function(n, o) {
                    element.empty();
                    s = scope.element.string;
                    element.append(s);
                    $compile(element.contents())(scope); 
                    //var el = $compile(doc)(scope); 
                    //element.append(el); 
                    //above prevents nested transclusions from getting view controller
                });
            });
        });
    };

    return {
        restrict: 'E',
        scope: {
            eid: '@',
        },
        //controller: ['$scope', controller]
        link: mmsTranscludeVsLink
    };
}