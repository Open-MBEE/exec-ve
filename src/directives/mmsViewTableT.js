'use strict';

angular.module('mms.directives')
.directive('mmsViewTableT', [mmsViewTableT]);

function mmsViewTableT() {

    return {
        restrict: 'E',
        template: '<mms-transclude-doc data-mms-eid="{{para.source}}"></mms-transclude-doc>',
        scope: {
            para: '<mmsPara'
        }
    };
}