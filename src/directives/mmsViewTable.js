'use strict';

angular.module('mms.directives')
.directive('mmsViewTable', ['$compile', '$timeout', '$templateCache', 'UtilsService', mmsViewTable]);

function mmsViewTable($compile, $timeout, $templateCache, UtilsService) {
    var template = $templateCache.get('mms/templates/mmsViewTable.html');
    
    var mmsViewTableCtrl = function ($scope, $rootScope) {
    };

    var mmsViewTableLink = function(scope, element, attrs) {
        if (!scope.table.showIfEmpty && scope.table.body.length === 0)
            return;
        scope.searchTerm = '';
        scope.showFilter = false;
        var html = UtilsService.makeHtmlTable(scope.table);
        html = //'<script src="../../node_modules/ng-csv/build/ng-csv.js"></script>' +
            '<div class="tableSearch">' +
                //'<div ng-app="myapp">' +
                // '<div ng-controller="myctrl">' +
                '<button class="btn btn-sm btn-primary" ng-csv="getArray()" csv-header="[\'Field A\', \'Field B\', \'Field C\']" filename="test.csv">Export</button> ' +
                '<button type="button" ng-csv="getArray" filename="test.csv">Export</button>' +
                '<button class="btn btn-default" ng-csv="getArray" filename="ralf.csv" field-separator="file,dog,house" decimal-separator="." >Export to CSV</button>' +
                '<button class="btn btn-default" ng-csv="getArray" csv-header="getHeader()" filename="dog" field-separator="file,dog,house" decimal-separator="." >Export to CSV with header</button>' +
                '<button class="btn btn-default" ng-csv="getArray" csv-label="true" filename="dog.csv" field-separator="file,dog,house" decimal-separator="." >Export to CSV with keys</button>' +
                '<button class="btn btn-default" ng-csv="getArray" csv-header="getHeader()" filename="house" field-separator="file,dog,house" decimal-separator="." ng-click="clickFn()">Export with ng-click</button>' +
                '<button class="btn btn-default" ng-csv="getArray" filename="house.csv" field-separator="file,dog,house" decimal-separator="." add-bom="true" >With BOM</button>' +
                '<button class="btn btn-sm btn-primary" ng-click="showFilter = !showFilter">Filter Table</button> ' +
                '<span ng-show="showFilter"><form style="display: inline" ng-submit="search()"><input type="text" size="75" placeholder="regex filter" ng-model="searchTerm"></input></form>' +
                '<button class="btn btn-sm btn-primary" ng-click="search()">Apply</button>' + 
                '<button class="btn btn-sm btn-danger" ng-click="resetSearch()">Reset</button></span></div>' + html;


        //var myapp = angular.module('mmsApp', ["ngSanitize", "ngCsv"]); // ng-app = "mmsApp"
        //myapp.controller('myctrl', function($scope) { // ng-controller="myctrl"
            scope.filename = "test";
            scope.getArray = [{a: 1, b:2}, {a:3, b:4}];
            scope.addRandomRow = function() {
                scope.getArray.push({a: Math.floor((Math.random()*10)+1), b: Math.floor((Math.random()*10)+1)});
            };
            scope.getHeader = function () { return ["A", "B"]; };
            scope.clickFn = function() {
                console.log("click click click");
            };
        //});

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