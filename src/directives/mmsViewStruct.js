'use strict';

angular.module('mms.directives')
.directive('mmsViewStruct', ['ViewService', '$templateCache', 'growl', '$q', '_', mmsViewStruct]);

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
function mmsViewStruct(ViewService, $templateCache, growl, $q, _) {
    var template = $templateCache.get('mms/templates/mmsViewStruct.html');

    var mmsViewStructCtrl = function($scope, ViewService) {
        this.getEditing = function() {
            return $scope.editing;
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
                scope.editable = scope.edit.editable && scope.mmsVersion === 'latest';
                delete scope.edit.name;
                delete scope.edit.documentation;

                if (data.specialization.contents) {
                    scope.instance2presentation = {};
                    scope.instance2specification = {};
                    
                    angular.forEach(data.specialization.contents.operand, function(content) {

                        ViewService.parseExprRefTree(content, scope.mmsWs).then(function(presentationElement) {

                            scope.instance2presentation[content.instance] = presentationElement;

                        });

                        ViewService.getInstanceSpecification(content, scope.mmsWs).then(function(instanceSpecification) {

                            scope.instance2specification[content.instance] = instanceSpecification;

                        });
                    });
                }

            }, function(reason) {
                growl.error('View Error: ' + reason.message);
            });
        });

        scope.editing = false;
        scope.sortableOptions = {
            axis: 'y'
        };
        scope.toggleEditing = function() {
            if (!scope.editable) 
                return false;
            scope.editing = !scope.editing;
            element.find('.ui-sortable').sortable('option', 'cancel', scope.editing ? '' : 'div');
            return true;
        };
        scope.save = function() {
            var deferred = $q.defer();
            if (!scope.editable || !scope.editing) {
                deferred.reject({type: 'error', message: "View isn't editable and can't be saved."});
                return deferred.promise;
            }
            ViewService.updateView(scope.edit, scope.mmsWs)
            .then(function(data) {
                deferred.resolve(data);
            }, function(reason) {
                if (reason.status === 409) {
                    scope.latest = reason.data.elements[0];
                    scope.edit.read = scope.latest.read;
                    scope.save().then(function(resolved) {
                        deferred.resolve(resolved);
                    }, function(rejected) {
                        deferred.reject(rejected);
                    });
                } else {
                    deferred.reject({type: 'error', message: reason.message});
                    //growl.error("Save Error: Status " + reason.status);
                }
            });
            return deferred.promise;
        };
        scope.revert = function() {
            scope.edit.specialization.contains = _.cloneDeep(scope.view.specialization.contains);
        };
        if (angular.isObject(scope.mmsViewStructApi)) {
            var api = scope.mmsViewStructApi;
            api.toggleEditing = scope.toggleEditing;
            api.save = scope.save;
            api.setEditing = function(mode) {
                if (!scope.editable && mode)
                    return false;
                scope.editing = mode;
                element.find('.ui-sortable').sortable('option', 'cancel', scope.editing ? '' : 'div');
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
            mmsViewStructApi: '='
        },
        controller: ['$scope', 'ViewService', mmsViewStructCtrl],
        link: mmsViewStructLink
    };
}