'use strict';

angular.module('mms')
.directive('mmsTranscludeName', ['ElementService', '$compile', mmsTranscludeName]);

function mmsTranscludeName(ElementService, $compile) {

    return {
        restrict: 'E',
        template: '{{element.name}}',
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
                });
            });
        }
    };
}