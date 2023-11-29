'use strict';

angular.module('mms.directives')
.directive('mmsViewEquation', [mmsViewEquation]);

function mmsViewEquation() {

    return {
        restrict: 'E',
        template: '<mms-cf mms-cf-type="doc" mms-element-id="{{para.source}}"></mms-cf>',
        scope: {
            para: '<mmsPara'
        }
    };
}