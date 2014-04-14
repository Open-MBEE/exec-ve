'use strict';

angular.module('mms')
.directive('mmsTranscludeVal', ['ElementService', '$compile', mmsTranscludeVal]);

function mmsTranscludeVal(ElementService, $compile) {
    var template = '<span ng-repeat="value in element.value">{{value}}</span>';
    return {
        restrict: 'E',
        //template: template,
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
                    var el;
                    element.empty();
                    if (scope.element.valueType === "LiteralString") {
                        var toCompile = ''; //to account for transclusions inside string values
                        for (var i = 0; i < scope.element.value.length; i++) {
                            toCompile += '<div>' + scope.element.value[i] + '</div>';
                        }
                        element.append(toCompile);
                        $compile(element.contents())(scope);
                        //el = $compile(toCompile)(scope);
                        //element.append(el);
                        scope.$watchCollection('element.value', function(n, o) {
                            element.empty();
                            toCompile = '';
                            for (var i = 0; i < scope.element.value.length; i++) {
                                toCompile += '<div>' + scope.element.value[i] + '</div>';
                            }
                            element.append(toCompile);
                            $compile(element.contents())(scope);
                            //el = $compile(toCompile)(scope);
                            //element.append(el);
                        });
                    } else {
                        el = $compile(template)(scope);
                        element.append(el);
                    }
                });
            });
        }
    };
}