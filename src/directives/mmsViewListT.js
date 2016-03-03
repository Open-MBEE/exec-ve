'use strict';

angular.module('mms.directives')
.directive('mmsViewListT', ['$templateCache', '$compile', '$rootScope', mmsViewListT]);

function mmsViewListT($templateCache, $compile, $rootScope) {

    return {
        restrict: 'E',
        template: '<mms-transclude-doc data-mms-eid="{{para.source}}"></mms-transclude-doc>',
        scope: {
            para: '=mmsPara'
        }
    };
}