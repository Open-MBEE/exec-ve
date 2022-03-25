import * as angular from "angular";
var veDirectives = angular.module('veDirectives');

veDirectives.directive('mmsViewTableT', [mmsViewTableT]);

function mmsViewTableT() {

    return {
        restrict: 'E',
        template: '<mms-cf mms-cf-type="doc" mms-element-id="{{para.source}}"></mms-cf>',
        scope: {
            para: '<mmsPara'
        }
    };
}