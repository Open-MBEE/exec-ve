'use strict';

angular.module('mms.directives')
.directive('mmsViewTable', ['$compile', '$timeout', '$document', '$templateCache', 'UtilsService', mmsViewTable]);

function mmsViewTable($compile, $timeout, $document, $templateCache, UtilsService) {
    var template = $templateCache.get('mms/templates/mmsViewTable.html');
    
    var mmsViewTableCtrl = function ($scope, $rootScope) {
    };

    var mmsViewTableLink = function(scope, element, attrs) {
        if (!scope.table.showIfEmpty && scope.table.body.length === 0)
            return;
        scope.searchTerm = '';
        scope.showFilter = false;
        var html = UtilsService.makeHtmlTable(scope.table);
        html = '<div class="tableSearch">' +
                '<button class="btn btn-sm btn-primary" ng-click="doClick()">Export</button> ' +
                '<button class="btn btn-sm btn-primary" ng-click="showFilter = !showFilter">Filter Table</button> ' +
                '<span ng-show="showFilter"><form style="display: inline" ng-submit="search()"><input type="text" size="75" placeholder="regex filter" ng-model="searchTerm"></input></form>' +
                '<button class="btn btn-sm btn-primary" ng-click="search()">Apply</button>' + 
                '<button class="btn btn-sm btn-danger" ng-click="resetSearch()">Reset</button></span></div>' + html;

        scope.doClick = function() {
            var csvString = element.children('table').table2CSV({delivery:'value'});
            var blob = new Blob([csvString], { //Blob([scope.csv]) <- is the getArray ; replace with the string
                type: "text/csv;charset=utf-8;"
            });

            if (window.navigator.msSaveOrOpenBlob) {
                navigator.msSaveBlob(blob,'flename.csv');
            } else {

                var downloadContainer = angular.element('<div data-tap-disabled="true"><a></a></div>');
                var downloadLink = angular.element(downloadContainer.children()[0]);
                downloadLink.attr('href', window.URL.createObjectURL(blob));
                downloadLink.attr('download', 'flename.csv');
                downloadLink.attr('target', '_blank');

                $document.find('body').append(downloadContainer);
                $timeout(function () {
                    downloadLink[0].click();
                    downloadLink.remove();
                }, null);
            }
        };

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
                var first = nextIndex;
                if (first > lastIndex)
                    return;
                var now = trs.slice(first, first + 100);
                $compile(now)(scope);
                nextIndex = first + 100;
                if (nextIndex < lastIndex)
                    compile();
            }, 100, false);
        }
        compile();
        scope.search = function() {
            var text = scope.searchTerm;
            var rows = trs.length;
            // Go through each row, if match show row, else hide row
            for(var i = 0; i < rows; i++) {
                var string = $(trs[i]).text();      //Gets Row Text
                var regExp = new RegExp(text, 'i'); //Added Regex Searching
                if(regExp.test(string))
                {
                    $(trs[i]).show();
                }
                else {
                    $(trs[i]).hide();
                }
            }
        };

        scope.resetSearch = function() {
            scope.searchTerm = '';
            scope.search();
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