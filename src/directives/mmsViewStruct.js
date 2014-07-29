'use strict';

angular.module('mms.directives')
.directive('mmsViewStruct', ['ViewService', '$templateCache', '$rootScope', 'growl', '_', mmsViewStruct]);

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
 * Visualize and edit the structure of a view 
 *
 * @param {string} mmsVid The id of the view
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsViewStruct(ViewService, $templateCache, $rootScope, growl, _) {
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
                scope.$emit('viewEditability', scope.edit.editable);
                delete scope.edit.name;
                delete scope.edit.documentation;
            }, function(reason) {
                growl.error('Getting View Error: ' + reason.message);
            });
        });

        scope.structEditable = false;
        scope.structEdit = 'Edit Order';
        scope.sortableOptions = {
            axis: 'y'
        };
        scope.toggleStructEdit = function() {
            scope.structEditable = !scope.structEditable;
            scope.structEdit = scope.structEditable ? 'Cancel' : 'Edit Order';
            element.find('.ui-sortable').sortable('option', 'cancel', scope.structEditable ? '' : 'div');
        };
        scope.toggleStructEdit();
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