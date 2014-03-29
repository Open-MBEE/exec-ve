'use strict';

angular.module('mms')
.directive('mmsTranscludeDoc', ['ElementService', '$compile', mmsTranscludeDoc]);

function mmsTranscludeDoc(ElementService, $compile) {

    return {
        restrict: 'E',
        //template: '<div ng-bind-html="element[property]"></div>',
        scope: {
            eid: '@',
        },
        //controller: ['$scope', controller]
        link: function(scope, element, attrs) {
            scope.$watch('eid', function(newVal, oldVal) {
                if (newVal === undefined || newVal === null || newVal === '')
                    return;
                ElementService.getElement(scope.eid).then(function(data) {
                    scope.element = data;
                    var el = $compile(scope.element.documentation)(scope);
                    element.append(el);
                    //element.append(scope.element[scope.property]);
                    //$compile(element.contents())(scope);
                    scope.$watch('element.documentation', function(n, o) {
                        element.empty();
                        var el = $compile(scope.element.documentation)(scope);
                        element.append(el);
                        //element.append(scope.element[scope.property]);
                        //$compile(element.contents())(scope);
                    });
                });
            });
        }
    };
}