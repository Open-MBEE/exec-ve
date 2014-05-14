'use strict';

angular.module('mms.directives')
.directive('mmsView', ['ViewService', 'ElementService', '$templateCache', mmsView]);

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
function mmsView(ViewService, ElementService, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsView.html');

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
            element.toggleClass('editing');
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