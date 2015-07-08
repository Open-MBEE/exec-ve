'use strict';

angular.module('mms.directives')
.directive('mmsViewFigure', ['$templateCache', '$compile', '$rootScope', mmsViewFigure]);

function mmsViewFigure($templateCache, $compile, $rootScope) {

    return {
        restrict: 'E',
        template: '<mms-transclude-doc data-mms-eid="{{para.source}}"></mms-transclude-doc>',
        scope: {
            para: '=mmsPara'
        }
    };
}