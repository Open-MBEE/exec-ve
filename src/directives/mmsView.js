'use strict';

angular.module('mms.directives')
.directive('mmsView', ['ViewService', 'ElementService', mmsView]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsView
 *
 * @requires mms.ViewService
 * @requires mms.ElementService
 *
 * @restrict E
 *
 * @description
 * Given a view id, renders the view according to the json given by mms.ViewService
 * The view have a text edit mode, where transclusions can be clicked, and structure
 * edit mode, where the view "contains" list ordering can be modified. The view's last 
 * modified time and author is the latest of any transcluded element modified time. 
 *
 * @param {string} vid The id of the view
 * @param {expression=} transcludeClicked The expression to handle transcluded elements 
 *     in the view being clicked, this should be a function whose argument is the element id
 */
function mmsView(ViewService, ElementService) {
    var template = '<div>' +
                '<div><div class="btn-toolbar pull-right" role="toolbar">' + 
                    '<div class="btn-group btn-group-sm">' + 
                        '<button type="button" class="btn btn-default" ng-click="toggleTextEdit()">' + 
                            '<span class="glyphicon glyphicon-edit"></span> {{textEdit}}' +
                        '</button>' +
                        '<button type="button" class="btn btn-default" ng-click="toggleStructEdit()">' +
                            '<span class="glyphicon glyphicon-th-list"></span> {{structEdit}}' +
                        '</button>' +       
                    '</div>' +
                '</div></div>' + 
                '<h4 class="inline"><mms-transclude-name eid="{{viewElement.id}}"></mms-transclude-name></h4>' + 
                '<div>Last Modified: {{lastModified}} by {{author}}</div><br/>' +
                '<div ui-sortable="sortableOptions" ng-model="view.contains">' +
                    '<div ng-repeat="contain in view.contains" ng-switch on="contain.type">' + 
                    '<div ng-class="structEditable ? \'panel panel-default\' : \'\'">'+
                    '<div ng-class="structEditable ? \'panel-body\' : \'\'">' +
                        '<mms-view-para para="contain" ng-switch-when="Paragraph"></mms-view-para>' +
                        '<mms-view-table table="contain" ng-switch-when="Table"></mms-view-table>' +
                        '<mms-view-list list="contain" ng-switch-when="List"></mms-view-list>' +
                        '<mms-view-img image="contain" ng-switch-when="Image"></mms-view-img>' +
                    '</div></div></div>' +
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
        this.elementTranscluded = function(elem) {
            if (elem.lastModified > $scope.lastModified)
                $scope.lastModified = elem.lastModified;
            $scope.author = elem.author;
        };
        this.getWorkspaceAndVersion = function() {
            return {
                workspace: $scope.workspace, 
                version: $scope.version
            };
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
                scope.lastModified = data.lastModified;
                scope.author = data.author;
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
            workspace: '@',
            version: '@',
            transcludeClicked: '&'
        },
        controller: ['$scope', 'ViewService', 'ElementService', mmsViewCtrl],
        link: mmsViewLink
    };
}