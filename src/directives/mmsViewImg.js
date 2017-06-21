'use strict';

angular.module('mms.directives')
.directive('mmsViewImg', [mmsViewImg]);

function mmsViewImg() {
    var template = '<figure><mms-cf mms-cf-type="img" mms-element-id="{{image.id}}"></mms-cf><figcaption>{{image.title}}</figcaption></figure>';
    return {
        restrict: 'E',
        template: template,
        scope: {
            image: '<mmsImage'
        },
        link: function(scope, element, attrs) {
        }
    };
}