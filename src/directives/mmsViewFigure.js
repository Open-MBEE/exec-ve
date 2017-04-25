'use strict';

angular.module('mms.directives')
.directive('mmsViewFigure', [mmsViewFigure]);

function mmsViewFigure() {

    return {
        restrict: 'E',
        template: '<mms-transclude-doc data-mms-eid="{{para.source}}"></mms-transclude-doc>',
        scope: {
            para: '<mmsPara'
        }
    };
}