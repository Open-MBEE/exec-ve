'use strict';

angular.module('mms.directives')
.directive('mmsViewTable', ['$compile', '$timeout', '$document', 'UtilsService', mmsViewTable]);

function mmsViewTable($compile, $timeout, $document, UtilsService) {

    var mmsViewTableLink = function(scope, element, attrs) {
        if (!scope.table.showIfEmpty && scope.table.body.length === 0)
            return;
        scope.searchTerm = '';
        scope.showFilter = false;
        var html = UtilsService.makeHtmlTable(scope.table);
        html = '<div class="tableSearch ve-table-buttons">' +
                '<button class="btn btn-sm export-csv-button btn-default" ng-click="doClick()">Export CSV</button> ' +
                '<button class="btn btn-sm filter-table-button btn-default" ng-click="showFilter = !showFilter">Filter Table</button> ' +
                '<span ng-show="showFilter"><span>Showing {{numFiltered}} of {{numTotal}} Rows </span>' + 
                    '<form style="display: inline" ng-submit="search()" class="ve-filter-table-form"><input type="text" size="75" placeholder="regex filter" ng-model="searchTerm"></input></form>' +
                '<button class="btn btn-sm btn-primary" ng-click="search()">Apply</button>' + 
                '<button class="btn btn-sm btn-danger" ng-click="resetSearch()">Reset</button></span></div>' + html;

        scope.doClick = function() {
            var csvString = element.children('table').table2CSV({delivery:'value'});
            var bom = "\xEF\xBB\xBF"; //just for excel
            var bom2 = "\uFEFF";      //just for excel
            var blob = new Blob([bom2 + csvString], {
                type: "text/csv;charset=utf-8;"
            });

            if (window.navigator.msSaveOrOpenBlob) {
                navigator.msSaveBlob(blob,'TableData.csv');
            } else {

                var downloadContainer = angular.element('<div data-tap-disabled="true"><a></a></div>');
                var downloadLink = angular.element(downloadContainer.children()[0]);
                downloadLink.attr('href', window.URL.createObjectURL(blob));
                downloadLink.attr('download', 'TableData.csv');
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
        scope.numFiltered = lastIndex;
        scope.numTotal = lastIndex;
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
            scope.numFiltered = 0;
            var text = scope.searchTerm;
            var rows = trs.length;
            // Go through each row, if match show row, else hide row
            for(var i = 0; i < rows; i++) {
                var string = $(trs[i]).text();      //Gets Row Text
                var regExp = new RegExp(text, 'i'); //Added Regex Searching
                if(regExp.test(string))
                {
                    $(trs[i]).show();
                    scope.numFiltered++;
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
    };

    return {
        restrict: 'E',
        scope: {
            table: '<mmsTable'
        },
        link: mmsViewTableLink
    };
}