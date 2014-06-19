'use strict';

angular.module('mms.directives')
.directive('mmsViewStruct', ['ViewService', '$templateCache', 'growl', '_', mmsViewStruct]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsViewStruct
 *
 * @requires mms.ViewService
 * @requires $templateCache
 *
 * @restrict E
 *
 * @description
 * Given a view id, renders the view according to the json given by mms.ViewService
 * The view have a text edit mode, where transclusions can be clicked, and structure
 * edit mode, where the view "contains" list ordering can be modified. The view's last 
 * modified time and author is the latest of any transcluded element modified time. 
 *
 * @param {string} mmsVid The id of the view
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 * @param {expression=} mmsCfClicked The expression to handle transcluded elements 
 *     in the view being clicked, this should be a function whose argument is 'elementId'
 */
function mmsViewStruct(ViewService, $templateCache, growl, _) {
    var template = $templateCache.get('mms/templates/mmsViewStruct.html');

    var mmsViewStructCtrl = function($scope, ViewService) {
        this.getStructEditable = function() {
            return $scope.structEditable;
        };
    };

    var mmsViewStructLink = function(scope, element, attrs) {
        scope.$watch('mmsVid', function(newVal, oldVal) {
            if (!newVal)
                return;
            ViewService.getView(scope.mmsVid, false, scope.mmsWs, scope.mmsVersion)
            .then(function(data) {
                scope.view = data;
                scope.lastModified = data.lastModified;
                scope.author = data.author;
                scope.edit = _.cloneDeep(scope.view);
                delete scope.edit.name;
                delete scope.edit.documentation;
            }, function(reason) {
                growl.error('Getting View Error: ' + reason.message);
            });
        });
        scope.structEditable = false;
        scope.structEdit = 'Edit Order';
        scope.sortableOptions = {
            cancel: 'div',
            axis: 'y'
        };
        scope.toggleStructEdit = function() {
            scope.structEditable = !scope.structEditable;
            scope.structEdit = scope.structEditable ? 'Cancel' : 'Show Elements';
            element.find('.ui-sortable').sortable('option', 'cancel', scope.structEditable ? '' : 'div');
        };

        scope.save = function() {
            ViewService.updateView(scope.edit)
            .then(function(result) {
                growl.success("Save Successful.");
                scope.edit.read = result.read;
                scope.toggleStructEdit();
            }, function(reason) {
                growl.error("Failed: " + reason.message);
            });
        };
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsVid: '@',
            mmsWs: '@',
            mmsVersion: '@',
            mmsOrder: '='
        },
        controller: ['$scope', 'ViewService', mmsViewStructCtrl],
        link: mmsViewStructLink
    };
}