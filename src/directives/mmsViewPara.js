'use strict';

angular.module('mms.directives')
.directive('mmsViewPara', ['$templateCache', '$compile', mmsViewPara]);

function mmsViewPara($templateCache, $compile) {
    var template = $templateCache.get('mms/templates/mmsViewPara.html');
    
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
        },
        //controller: ['$scope', controller]
        link: mmsViewParaLink
    };
}