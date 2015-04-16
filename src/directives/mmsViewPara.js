'use strict';

angular.module('mms.directives')
.directive('mmsViewPara', ['$templateCache', '$compile', '$rootScope', mmsViewPara]);

function mmsViewPara($templateCache, $compile, $rootScope) {
    var template = $templateCache.get('mms/templates/mmsViewPara.html');
    
    var mmsViewParamCtrl = function ($scope, $rootScope) {
        $scope.callDoubleClick = function(value) {
            growl.info(value.type);
        };
    };

    var mmsViewParaLink = function(scope, element, attrs) {
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
            para: '=mmsPara',
            instanceVal: '=mmsInstanceVal'
        },
        controller: ['$scope', '$rootScope', mmsViewParamCtrl],
        link: mmsViewParaLink
    };
}