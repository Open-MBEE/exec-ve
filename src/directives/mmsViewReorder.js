'use strict';

angular.module('mms.directives')
.directive('mmsViewReorder', ['ViewService', '$templateCache', 'growl', '$q', '_', mmsViewReorder]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsViewReorder
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
function mmsViewReorder(ViewService, $templateCache, growl, $q, _) {
    var template = $templateCache.get('mms/templates/mmsViewReorder.html');

    var mmsViewReorderCtrl = function($scope, ViewService) {
        this.getEditing = function() {
            return $scope.editing;
        };
        $scope.treeOptions = {
            accept: function(sourceNodeScope, destNodeScope, destIndex) {
                if (destNodeScope.$element.hasClass('root'))
                    return true;
                if (destNodeScope.element.presentationElement.type === 'Section')
                    return true;
                return false;
            }
        };
    };

    var mmsViewReorderLink = function(scope, element, attrs) {
        scope.$watch('mmsVid', function(newVal, oldVal) {
            if (!newVal)
                return;
            
            ViewService.getView(scope.mmsVid, false, scope.mmsWs, scope.mmsVersion)
            .then(function(data) {
                scope.view = data;
                scope.lastModified = data.lastModified;
                scope.author = data.author;
                // TODO remove scope.edit = _.cloneDeep(scope.view);
                scope.edit = { sysmlid: data.sysmlid };
                scope.edit.specialization = _.cloneDeep(scope.view.specialization);

                scope.editable = scope.view.editable && scope.mmsVersion === 'latest';
                // delete scope.edit.name;
                // delete scope.edit.documentation;

                if (data.specialization.contents) {
                    ViewService.getElementReferenceTree(data.specialization.contents, scope.mmsWs, scope.mmsVersion).then(function(elementReferenceTree) {
                        scope.elementReferenceTree = elementReferenceTree;
                    });
                }

            }, function(reason) {
                growl.error('View Error: ' + reason.message);
            });
        });

        scope.editing = false;
        scope.elementReferenceTree = {};

        scope.toggleEditing = function() {
            if (!scope.editable) 
                return false;
            scope.editing = !scope.editing;
            // TODO: element.find('.ui-sortable').sortable('option', 'cancel', scope.editing ? '' : 'div');
            return true;
        };

        scope.save = function() {
            var deferred = $q.defer();
            if (!scope.editable || !scope.editing) {
                deferred.reject({type: 'error', message: "View isn't editable and can't be saved."});
                return deferred.promise;
            }

            // Update the View edit object on Save
            if (scope.edit.specialization.contents) {
                scope.edit.specialization.contents.operand = [];
                for (var i = 0; i < scope.elementReferenceTree.length; i++) {
                    scope.edit.specialization.contents.operand.push(scope.elementReferenceTree[i].instanceVal);
                }
            }

            ViewService.updateView(scope.edit, scope.mmsWs)
            .then(function(data) {
                deferred.resolve(data);
            }, function(reason) {
                deferred.reject(reason);
            });
            return deferred.promise;
        };

        scope.revert = function() {
            // TODO: 
            // scope.edit = _.cloneDeep(scope.elementReferenceTree);
        };

        if (angular.isObject(scope.mmsViewReorderApi)) {
            var api = scope.mmsViewReorderApi;
            api.toggleEditing = scope.toggleEditing;
            api.save = scope.save;
            api.setEditing = function(mode) {
                if (!scope.editable && mode)
                    return false;
                scope.editing = mode;
                // TODO: element.find('.ui-sortable').sortable('option', 'cancel', scope.editing ? '' : 'div');
            };
            api.revertEdits = scope.revert;
        }
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsVid: '@',
            mmsWs: '@',
            mmsVersion: '@',
            mmsOrder: '=',
            mmsViewReorderApi: '='
        },
        controller: ['$scope', 'ViewService', mmsViewReorderCtrl],
        link: mmsViewReorderLink
    };
}