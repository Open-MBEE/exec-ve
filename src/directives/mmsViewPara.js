'use strict';

angular.module('mms.directives')
.directive('mmsViewPara', ['$templateCache', mmsViewPara]);

function mmsViewPara($templateCache) {
    var template = $templateCache.get('mms/templates/mmsViewPara.html');
    
    return {
        restrict: 'E',
        template: template,
        scope: {
            para: '=',
        },
        //controller: ['$scope', controller]
        link: function(scope, element, attrs) {
        }
    };
}