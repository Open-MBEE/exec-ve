'use strict';

angular.module('mms.directives')
.directive('mmsView', ['ViewService', '$templateCache', 'growl', mmsView]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsView
 *
 * @requires mms.ViewService
 * @requires $templateCache
 *
 * @restrict E
 *
 * @description
 * Given a view id, renders the view according to the json given by mms.ViewService
 * The view have a text edit mode, where transclusions can be clicked. The view's last 
 * modified time and author is the latest of any transcluded element modified time. 
 *
 * ## Example
 *  <pre>
    <mms-view mms-vid="view_element_id" mms-cf-clicked="elementClickedHandler(elementId)"></mms-view>
    <!-- the elementClickedHandler would be a function in your scope -->
    </pre>
 * ## Example view at a certain time
 *  <pre>
    <mms-view mms-vid="view_element_id" mms-version="2014-07-01T08:57:36.915-0700"></mms-view>
    </pre>
 *
 * @param {string} mmsVid The id of the view
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 * @param {expression=} mmsCfClicked The expression to handle transcluded elements 
 *     in the view being clicked, this should be a function whose argument is 'elementId'
 */
function mmsView(ViewService, $templateCache, growl) {
    var template = $templateCache.get('mms/templates/mmsView.html');

    var mmsViewCtrl = function($rootScope, $scope, ViewService) {

        $scope.my_tree = $rootScope.tree;

        this.getViewElements = function() {
            return ViewService.getViewElements($scope.mmsVid, false, $scope.mmsWs, $scope.mmsVersion);
        };
        this.transcludeClicked = function(elementId) {
            if ($scope.mmsCfClicked)
                $scope.mmsCfClicked({elementId: elementId});
        };
        this.elementTranscluded = function(elem) {
            if (elem.lastModified > $scope.lastModified) { 
                $scope.lastModified = elem.lastModified;
                $scope.author = elem.author;
            }
        };
        this.getWsAndVersion = function() {
            return {
                workspace: $scope.mmsWs, 
                version: $scope.mmsVersion
            };
        };
        this.getStructEditable = function() {
            return $scope.structEditable;
        };
    };

    var mmsViewLink = function(scope, element, attrs) {
        scope.$watch('mmsVid', function(newVal, oldVal) {
            if (!newVal)
                return;
            ViewService.getView(scope.mmsVid, false, scope.mmsWs, scope.mmsVersion)
            .then(function(data) {
                scope.view = data;
                scope.lastModified = data.lastModified;
                scope.author = data.author;
            }, function(reason) {
                growl.error('Getting View Error: ' + reason.message);
            });
        });
        scope.textEditable = false;
        scope.structEditable = false;
        scope.reviewing = false;
        scope.textEdit = 'Show Elements';
        scope.structEdit = 'Edit Order';
        scope.review = 'Show Comments';
        scope.sortableOptions = {
            cancel: 'div',
            axis: 'y'
        };
        scope.toggleTextEdit = function() {
            scope.textEditable = !scope.textEditable;
            scope.textEdit = scope.textEditable ? 'Hide Elements' : 'Show Elements';
            element.toggleClass('editing');
        };
        scope.toggleStructEdit = function() {
            scope.structEditable = !scope.structEditable;
            scope.structEdit = scope.structEditable ? 'Stop Order Edit' : 'Edit Order';
            element.find('.ui-sortable').sortable('option', 'cancel', scope.structEditable ? '' : 'div');
        };
        scope.toggleReview = function() {
            scope.reviewing = !scope.reviewing;
            scope.review = scope.reviewing ? 'Hide Comments' : 'Show Comments';
            element.toggleClass('reviewing');
        };
        scope.nextSection = function() {
            scope.my_tree.select_next_branch(scope.my_tree.get_selected_branch());
        };
        scope.prevSection = function() {
            scope.my_tree.select_prev_branch(scope.my_tree.get_selected_branch());
        };
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsVid: '@',
            mmsWs: '@',
            mmsVersion: '@',
            mmsCfClicked: '&',
        },
        controller: ['$rootScope', '$scope', 'ViewService', mmsViewCtrl],
        link: mmsViewLink
    };
}