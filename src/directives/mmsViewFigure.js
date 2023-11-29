'use strict';

angular.module('mms.directives')
.directive('mmsViewFigure', [mmsViewFigure]);

function mmsViewFigure() {

    return {
        restrict: 'E',
        template: '<mms-cf mms-cf-type="doc" mms-element-id="{{para.source}}"></mms-cf>',
        scope: {
            para: '<mmsPara'
        }
    };
}