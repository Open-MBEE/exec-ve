'use strict';

angular.module('mms.directives')
.directive('mmsViewList', ['$compile', '$templateCache', 'UtilsService', mmsViewList]);

function mmsViewList($compile, $templateCache, UtilsService) {
    var template = $templateCache.get('mms/templates/mmsViewList.html');
    
    var mmsViewListCtrl = function ($scope, $rootScope) {
    };

    return {
        restrict: 'E',
        //template: template,
        scope: {
            list: '=mmsList'
        },
        controller: ['$scope', '$rootScope', mmsViewListCtrl],
        link: function(scope, element, attrs) {
            /*var html = UtilsService.makeHtmlList(scope.list);
            element.append(html);
            $compile(element.contents())(scope);
            return;*/
            
            element.append(template);
            $compile(element.contents())(scope); 
            //var el = $compile(template)(scope);
            //element.append(el);
            
        }
    };
}