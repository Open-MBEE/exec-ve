'use strict';

angular.module('mms')
.directive('mmsViewImg', [mmsViewImg]);

function mmsViewImg() {
    var template = '<mms-transclude-img eid="{{image.id}}"></mms-transclude-img>';
    return {
        restrict: 'E',
        template: template,
        scope: {
            image: '=',
        },
        //controller: ['$scope', controller]
        link: function(scope, element, attrs) {
        }
    };
}