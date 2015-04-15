'use strict';

angular.module('mms.directives')
.directive('mmsViewTable', ['$compile', '$timeout', '$templateCache', mmsViewTable]);

function mmsViewTable($compile, $timeout, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsViewTable.html');
    
    var mmsViewTableCtrl = function ($scope, $rootScope) {
    };

    var mmsViewTableLink = function(scope, element, attrs) {
        scope.tableLimit = 20;

        var addLimit = function() {
            if (scope.tableLimit < scope.table.body.length) {
                scope.tableLimit += 25;
                $timeout(addLimit, 100);
            }
        };

        element.append(template);
        $timeout(function() {
            $compile(element.contents())(scope);
            addLimit();
            }, 100);
    };

    return {
        restrict: 'E',
        //template: template,
        scope: {
            table: '=mmsTable',
            instanceVal: '=mmsInstanceVal'
        },
        controller: ['$scope', '$rootScope', mmsViewTableCtrl],
        link: mmsViewTableLink
    };
}