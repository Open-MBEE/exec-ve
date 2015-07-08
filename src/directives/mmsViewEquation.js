'use strict';

angular.module('mms.directives')
.directive('mmsViewEquation', ['$templateCache', '$compile', '$rootScope', mmsViewEquation]);

function mmsViewEquation($templateCache, $compile, $rootScope) {

    return {
        restrict: 'E',
        template: '<mms-transclude-doc data-mms-eid="{{para.source}}"></mms-transclude-doc>',
        scope: {
            para: '=mmsPara'
        }
    };
}