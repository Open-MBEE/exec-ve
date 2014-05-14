'use strict';

angular.module('mms.directives')
.directive('mmsViewTable', ['$compile', '$templateCache', mmsViewTable]);

function mmsViewTable($compile, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsViewTable.html');
    
    return {
        restrict: 'E',
        //template: template,
        scope: {
            table: '=',
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