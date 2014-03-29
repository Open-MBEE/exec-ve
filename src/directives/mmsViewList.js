'use strict';

angular.module('mms')
.directive('mmsViewList', ['$compile', mmsViewList]);

function mmsViewList($compile) {
    var template = '<ol ng-if="list.ordered">' + 
            '<li ng-repeat="listitem in list">' + 
                '<div ng-repeat="thing in listitem" ng-switch on="thing.type">' +
                    '<mms-view-para para="thing" ng-switch-when="Paragraph"></mms-view-para>' +
                    '<mms-view-table table="thing" ng-switch-when="Table"></mms-view-table>' +
                    '<mms-view-list list="thing" ng-switch-when="List"></mms-view-list>' +
                '</div>' +
            '</li>' + 
        '</ol>' + 
        '<ul ng-if="!(list.ordered)">' + 
            '<li ng-repeat="listitem in list">' + 
                '<div ng-repeat="thing in listitem" ng-switch on="thing.type">' +
                    '<mms-view-para para="thing" ng-switch-when="Paragraph"></mms-view-para>' +
                    '<mms-view-table table="thing" ng-switch-when="Table"></mms-view-table>' +
                    '<mms-view-list list="thing" ng-switch-when="List"></mms-view-list>' +
                '</div>' +
            '</li>' + 
        '</ul>';
    return {
        restrict: 'E',
        //template: template,
        scope: {
            list: '=',
        },
        //controller: ['$scope', controller]
        link: function(scope, element, attrs) {
            var el = $compile(template)(scope);
            element.append(el);
        }
    };
}