'use strict';

angular.module('mms.directives')
.directive('mmsViewTable', ['$compile', '$timeout', '$templateCache', mmsViewTable]);

function mmsViewTable($compile, $timeout, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsViewTable.html');
    
    var mmsViewTableLink = function(scope, element, attrs) {
        scope.tableLimit = 10;

        var addLimit = function() {
            if (scope.tableLimit < scope.table.body.length) {
                scope.tableLimit += 10;
                $timeout(addLimit, 10);
            }
        };

        element.append(template);
        $timeout(function() {
            $compile(element.contents())(scope);
            addLimit();
            }, 10);
    };

    return {
        restrict: 'E',
        //template: template,
        scope: {
            table: '=mmsTable',
        },
        link: mmsViewTableLink
    };
}