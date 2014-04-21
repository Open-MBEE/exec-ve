'use strict';

angular.module('mms')
.directive('mmsView', ['ViewService', 'ElementService', mmsView]);

function mmsView(ViewService, ElementService) {
    var template = '<div>' +
                '<div><h4 class="inline"><mms-transclude-name eid="{{viewElement.id}}"></mms-transclude-name></h4>' + 
                '<span class="pull-right"><button class="btn" ng-click="toggleTextEdit()">{{textEdit}}</button>' +
                '<button class="btn" ng-click="toggleStructEdit()">{{structEdit}}</button></span></div>' +
                '<div ui-sortable="sortableOptions" ng-model="view.contains">' +
                '<div ng-repeat="contain in view.contains" ng-switch on="contain.type">' +
                    '<mms-view-para para="contain" ng-switch-when="Paragraph"></mms-view-para>' +
                    '<mms-view-table table="contain" ng-switch-when="Table"></mms-view-table>' +
                    '<mms-view-list list="contain" ng-switch-when="List"></mms-view-list>' +
                '</div>' +
                '</div>' +
            '</div>';

    var mmsViewCtrl = function($scope, ViewService, ElementService) {
        this.getViewAllowedElements = function() {
            return ViewService.getViewAllowedElements($scope.vid);
        };
        this.transcludeClicked = function(elementId) {
            if ($scope.textEditable && $scope.transcludeClicked)
                $scope.transcludeClicked({elementId: elementId});
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
        scope.textEditable = false;
        scope.structEditable = false;
        scope.textEdit = 'Edit Text';
        scope.structEdit = 'Edit Order';
        scope.sortableOptions = {
            cancel: 'div',
            axis: 'y'
        };
        scope.toggleTextEdit = function() {
            scope.textEditable = !scope.textEditable;
            scope.textEdit = scope.textEditable ? 'Stop Text Edit' : 'Edit Text';
        };
        scope.toggleStructEdit = function() {
            scope.structEditable = !scope.structEditable;
            scope.structEdit = scope.structEditable ? 'Stop Order Edit' : 'Edit Order';
            element.find('.ui-sortable').sortable('option', 'cancel', scope.structEditable ? '' : 'div');
        };
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            vid: '@',
            transcludeClicked: '&'
        },
        controller: ['$scope', 'ViewService', 'ElementService', mmsViewCtrl],
        link: mmsViewLink
    };
}