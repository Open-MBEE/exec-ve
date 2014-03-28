'use strict';

angular.module('mms')
.directive('mmsViewTable', ['$compile', mmsViewTable]);

function mmsViewTable($compile) {
    var template = '<table>' +
                '<caption>{{table.title}}</caption>' +
                '<tr ng-repeat="row in table.header">' +
                    '<th colspan="{{cell.colspan}}" rowspan="{{cell.rowspan}}" ng-repeat="cell in row">' +
                        '<div ng-repeat="content in cell.content" ng-switch on="content.type">' +
                            '<mms-view-para para="content" ng-switch-when="Paragraph"></mms-view-para>' +
                            '<mms-view-table table="content" ng-switch-when="Table"></mms-view-table>' +
                            '<mms-view-list list="content" ng-switch-when="List"></mms-view-list>' +
                        '</div>' +
                    '</th>' +
                '</tr>' +
                '<tr ng-repeat="row in table.body">' +
                    '<td colspan="{{cell.colspan}}" rowspan="{{cell.rowspan}}" ng-repeat="cell in row">' +
                        '<div ng-repeat="content in cell.content" ng-switch on="content.type">' +
                            '<mms-view-para para="content" ng-switch-when="Paragraph"></mms-view-para>' +
                            '<mms-view-table table="content" ng-switch-when="Table"></mms-view-table>' +
                            '<mms-view-list list="content" ng-switch-when="List"></mms-view-list>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
            '</table>';
    return {
        restrict: 'E',
        //template: template,
        scope: {
            table: '=',
        },
        //controller: ['$scope', controller]
        link: function(scope, element, attrs) {
            var el = $compile(template)(scope);
            element.append(el);
        }
    };
}