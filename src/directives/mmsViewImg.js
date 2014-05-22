'use strict';

angular.module('mms.directives')
.directive('mmsViewImg', [mmsViewImg]);

function mmsViewImg() {
    var template = '<mms-transclude-img mms-eid="{{image.id}}"></mms-transclude-img>';
    return {
        restrict: 'E',
        template: template,
        scope: {
            image: '=mmsImage',
        },
        //controller: ['$scope', controller]
        link: function(scope, element, attrs) {
        }
    };
}