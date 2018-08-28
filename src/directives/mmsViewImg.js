'use strict';

angular.module('mms.directives')
.directive('mmsViewImg', [mmsViewImg]);

function mmsViewImg() {
    var template = '<figure><mms-cf mms-cf-type="img" mms-element-id="{{image.id}}"></mms-cf><figcaption><span ng-if="!image.excludeFromList">Figure {{mmsPe._veNumber}}. </span>{{image.title || mmsPe.name}}</figcaption></figure>';
    return {
        restrict: 'E',
        template: template,
        scope: {
            image: '<mmsImage',
            mmsPe: '<'
        },
        link: function(scope, element, attrs) {
        }
    };
}