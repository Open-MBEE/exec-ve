'use strict';

angular.module('mms.directives')
.directive('mmsViewTable', ['$compile', '$timeout', '$templateCache', 'UtilsService', mmsViewTable]);

function mmsViewTable($compile, $timeout, $templateCache, UtilsService) {
    var template = $templateCache.get('mms/templates/mmsViewTable.html');
    
    var mmsViewTableCtrl = function ($scope, $rootScope) {
    };

    var mmsViewTableLink = function(scope, element, attrs) {

        scope.searchTerm = '';
        var html = UtilsService.makeHtmlTable(scope.table);
        html = '<div class="tableSearch"><input type="text" ng-model="searchTerm"></input><button ng-click="search()">search</button></div>' + html;
        element[0].innerHTML = html;
        var nextIndex = 0;
        var thead = element.find('thead');
        $compile(thead)(scope);
        var searchbar = element.children('div');
        $compile(searchbar)(scope);
        //Add the search input here (before the TRS, aka the columns/rows)
        var trs = element.children('table').children('tbody').children('tr');
        var lastIndex = trs.length;
        function compile() {
            $timeout(function() {
                var first = lastIndex - 100;
                if (first < 0)
                    first = 0;
                var now = trs.slice(first, lastIndex);
                $compile(now)(scope);
                lastIndex = lastIndex - 100;
                if (lastIndex > 0)
                    compile();
            }, 200, false);
        }
        compile();
        scope.search = function() {
            var text = scope.searchTerm;
            var rows = trs.length;
            var columns = trs[0].getElementsByTagName("td").length;

            var i = 0, j = 0;
            if(text.length === 0) { //If Search Empty, Reset all rows
                for(i = 0; i < rows; i++) {
                    for(j = 0; j < columns; j++) {
                        trs[i].getElementsByTagName("td")[j].style.display = "";
                    }
                }
            }
            else if(text.length >0 && rows > 0) {
                for(i = 0; i < rows; i++) {
                    var toggle = true;
                    for(j = 0; j < columns; j++) {
                        var string = trs[i].getElementsByTagName("span")[j].innerHTML;
                        if( string.indexOf(text) >= 0 ) {
                            toggle = false;
                        }
                    }
                    console.log('for: ' + i + ' Toggle: ' + toggle);
                    /* */
                    if(toggle) {
                        for (j = 0; j < columns; j++) {
                            trs[i].getElementsByTagName("td")[j].style.display = "none";
                        }
                    }
                    else {
                        for(j = 0; j < columns; j++) {
                            trs[i].getElementsByTagName("td")[j].style.display = "";
                        }
                    }
                }
            }

            console.log(trs[0].getElementsByTagName("span")[0].innerHTML);

            /*
            //Toggle a Row
            var size = trs[0].getElementsByTagName("td").length;

            var i = 0;
            if(trs[0].getElementsByTagName("td")[0].style.display == "none") {
                for(i = 0; i < size; i++) {
                    trs[0].getElementsByTagName("td")[i].style.display = "";
                }
            }
            else {
                for (i = 0; i < size; i++) {
                    trs[0].getElementsByTagName("td")[i].style.display = "none";
                }
            }
            */
        };
        return;

        /*scope.tableLimit = 20;

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
*/
    };

    return {
        restrict: 'E',
        //template: template,
        scope: {
            table: '=mmsTable'
        },
        controller: ['$scope', '$rootScope', mmsViewTableCtrl],
        link: mmsViewTableLink
    };
}