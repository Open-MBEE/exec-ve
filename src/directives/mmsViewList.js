'use strict';

angular.module('mms.directives')
.directive('mmsViewList', ['$compile', '$templateCache', mmsViewList]);

function mmsViewList($compile, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsViewList.html');
    
    return {
        restrict: 'E',
        //template: template,
        scope: {
            list: '=',
        },
        //controller: ['$scope', controller]
        link: function(scope, element, attrs) {
            element.append(template);
            $compile(element.contents())(scope); 
            //var el = $compile(template)(scope);
            //element.append(el);
        }
    };
}