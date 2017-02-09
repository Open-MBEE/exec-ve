'use strict';

angular.module('mms.directives')
.directive('mmsViewPara', ['$compile', 'UtilsService', mmsViewPara]);

function mmsViewPara($compile, UtilsService) {

    var mmsViewParaLink = function(scope, element, attrs) {
        var html = UtilsService.makeHtmlPara(scope.para);
        element[0].innerHTML = html;
        $compile(element.contents())(scope);
        return;
    };

    return {
        restrict: 'E',
        scope: {
            para: '<mmsPara'
        },
        link: mmsViewParaLink
    };
}