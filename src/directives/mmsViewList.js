'use strict';

angular.module('mms.directives')
.directive('mmsViewList', ['$compile', 'UtilsService', mmsViewList]);

function mmsViewList($compile, UtilsService) {

    return {
        restrict: 'E',
        scope: {
            list: '<mmsList'
        },
        link: function(scope, element, attrs) {
            var html = UtilsService.makeHtmlList(scope.list);
            element[0].innerHTML = html;
            $compile(element.contents())(scope);
            return;
        }
    };
}