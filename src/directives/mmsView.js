'use strict';

angular.module('mms')
.directive('mmsView', ['ViewService', 'ElementService', mmsView]);

function mmsView(ViewService, ElementService) {
    var template = '<div>' +
                '<h1>{{viewElement.name}}</h1>' +
                '<div ng-repeat="contain in view.contains" ng-switch on="contain.type">' +
                    '<mms-view-para para="contain" ng-switch-when="Paragraph"></mms-view-para>' +
                    '<mms-view-table table="contain" ng-switch-when="Table"></mms-view-table>' +
                    '<mms-view-list list="contain" ng-switch-when="List"></mms-view-list>' +
                '</div>' +
            '</div>';

    var mmsViewCtrl = function($scope, ViewService, ElementService) {
        this.getViewAllowedElements = function() {
            return ViewService.getViewAllowedElements($scope.vid);
        };
        this.isEditable = function() {
            return $scope.editable;
        };
    };

    var mmsViewLink = function(scope, element, attrs) {
        scope.$watch('vid', function(newVal, oldVal) {
            if (newVal === undefined || newVal === null || newVal === '')
                return;
            ViewService.getView(scope.vid).then(function(data) {
                scope.view = data;
            });
            ElementService.getElement(scope.vid).then(function(data) {
                scope.viewElement = data;
            });
        });
        scope.editable = true;
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            vid: '@',
        },
        controller: ['$scope', 'ViewService', 'ElementService', mmsViewCtrl],
        link: mmsViewLink
    };
}