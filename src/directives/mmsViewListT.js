'use strict';

angular.module('mms.directives')
.directive('mmsViewListT', [mmsViewListT]);

function mmsViewListT() {

    return {
        restrict: 'E',
        template: '<mms-transclude-doc data-mms-eid="{{para.source}}"></mms-transclude-doc>',
        scope: {
            para: '<mmsPara'
        }
    };
}