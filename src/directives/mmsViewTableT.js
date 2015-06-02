'use strict';

angular.module('mms.directives')
.directive('mmsViewTableT', ['$templateCache', '$compile', '$rootScope', mmsViewTableT]);

function mmsViewTableT($templateCache, $compile, $rootScope) {

    return {
        restrict: 'E',
        template: '<mms-transclude-doc data-mms-eid="{{para.source}}"></mms-transclude-doc>',
        scope: {
            para: '=mmsPara'
        }
    };
}