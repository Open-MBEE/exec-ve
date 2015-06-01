'use strict';

angular.module('mms.directives')
.directive('mmsViewPara', ['$templateCache', '$compile', 'UtilsService', mmsViewPara]);

function mmsViewPara($templateCache, $compile, UtilsService) {
    var template = $templateCache.get('mms/templates/mmsViewPara.html');
    
    var mmsViewParamCtrl = function ($scope, $rootScope) {
        $scope.callDoubleClick = function(value) {
            // growl.info(value.type);
        };
    };

    var mmsViewParaLink = function(scope, element, attrs) {
        /*var html = UtilsService.makeHtmlPara(scope.para);
        element.append(html);
        $compile(element.contents())(scope);
        return;*/
        
        if (scope.para.sourceType === 'text') {
            element.append(scope.para.text);
            $compile(element.contents())(scope); 
        } else {
            element.append(template);
            $compile(element.contents())(scope); 
        }
    };

    return {
        restrict: 'E',
        //template: template,
        scope: {
            para: '=mmsPara'
        },
        controller: ['$scope', '$rootScope', mmsViewParamCtrl],
        link: mmsViewParaLink
    };
}