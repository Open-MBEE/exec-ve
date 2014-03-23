'use strict';

angular.module('mms')
.directive('mmsTransclude', ['ElementService', mmsTransclude]);

function mmsTransclude(ElementService) {

    return {
        restrict: 'E',
        template: '{{element[property]}}',
        scope: {
            id: '@',
            property: '@'
        },
        //controller: ['$scope', controller]
        link: function(scope, element, attr) {
            scope.$watch('id', function(newVal, oldVal) {
                if (newVal === undefined || newVal === null || newVal === '')
                    return;
                ElementService.getElement(scope.id).then(function(data) {
                    scope.element = data;
                });
            });
        }
    };
}