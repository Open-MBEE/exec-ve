'use strict';

angular.module('mms.directives')
.factory('Utils', ['$q','$modal','$templateCache','WorkspaceService','ConfigService','ElementService', Utils]);

/**
 * @ngdoc service
 * @name mms.directives.Utils
 * @requires 
 * 
 * @description
 * 
 */
function Utils($q, $modal, $templateCache, WorkspaceService, ConfigService, ElementService) {
    
     var conflictCtrl = function($scope, $modalInstance) {
        $scope.ok = function() {
            $modalInstance.close('ok');
        };
        $scope.cancel = function() {
            $modalInstance.close('cancel');
        };
        $scope.force = function() {
            $modalInstance.close('force');
        };
        $scope.merge = function() {
            $modalInstance.close('merge');
        };
    };

    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsSpec#save
     * @methodOf mms.directives.directive:mmsSpec
     * 
     * @description 
     * save edited element
     * 
     * @return {Promise} promise would be resolved with updated element if save is successful.
     *      For unsuccessful saves, it will be rejected with an object with type and message.
     *      Type can be error or info. In case of conflict, there is an option to discard, merge,
     *      or force save. If the user decides to discord or merge, type will be info even though 
     *      the original save failed. Error means an actual error occured. 
     */
    var save = function(edit, mmsWs, mmsType, mmsEid, tinymceApi, $scope) {
        var deferred = $q.defer();
        // TODO: put this back when removed scope.editing from view documentation edit
        /* if (!scope.editable || !scope.editing) {
            deferred.reject({type: 'error', message: "Element isn't editable and can't be saved."});
            return deferred.promise;
        } */

        if (tinymceApi && tinymceApi.save)
            tinymceApi.save();
        if (mmsType === 'workspace') {
            WorkspaceService.update(edit)
            .then(function(data) {
                deferred.resolve(data);
            }, function(reason) {
                deferred.reject({type: 'error', message: reason.message});
            });
        } else if (mmsType === 'tag') {
            ConfigService.update(edit, mmsWs)
            .then(function(data) {
                deferred.resolve(data);
            }, function(reason) {
                deferred.reject({type: 'error', message: reason.message});
            });
        } else {
            ElementService.updateElement(edit, mmsWs)
            .then(function(data) {
                deferred.resolve(data);
                //growl.success("Save successful");
                //scope.editing = false;
            }, function(reason) {
                if (reason.status === 409) {
                    $scope.latest = reason.data.elements[0];
                    var instance = $modal.open({
                        template: $templateCache.get('mms/templates/saveConflict.html'),
                        controller: ['$scope', '$modalInstance', conflictCtrl],
                        scope: $scope,
                        size: 'lg'
                    });
                    instance.result.then(function(choice) {
                        if (choice === 'ok') {
                            ElementService.getElementForEdit(mmsEid, true, mmsWs)
                            .then(function(data) {
                                //growl.info("Element Updated to Latest");
                                deferred.reject({type: 'info', message: 'Element Updated to Latest'});
                            }, function(reason) {
                                //growl.error("Element Update Error: " + reason.message);
                                deferred.reject({type: 'error', message: 'Element Update Error: ' + reason.message});
                            }); 
                        } else if (choice === 'merge') { 
                            ElementService.getElement(mmsEid, true, mmsWs)
                            .then(function(data) {
                                var currentEdit = edit;
                                if (data.name !== currentEdit.name)
                                    currentEdit.name = data.name + ' MERGE ' + currentEdit.name;
                                if (data.documentation !== currentEdit.documentation)
                                    currentEdit.documentation = data.documentation + '<p>MERGE</p>' + currentEdit.documentation;
                                currentEdit.read = data.read;
                                currentEdit.modified = data.modified;
                                //growl.info("Element name and doc merged");
                                deferred.reject({type: 'info', message: 'Element name and doc merged'});
                            }, function(reason2) {
                                //growl.error("Merge error: " + reason2.message);
                                deferred.reject({type: 'error', message: 'Merge error: ' + reason2.message});
                            });
                        } else if (choice === 'force') {
                            edit.read = $scope.latest.read;
                            edit.modified = $scope.latest.modified;
                            save().then(function(resolved) {
                                deferred.resolve(resolved);
                            }, function(error) {
                                deferred.reject(error);
                            });
                        } else
                            deferred.reject({type: 'cancel'});
                    });
                } else {
                    deferred.reject({type: 'error', message: reason.message});
                    //growl.error("Save Error: Status " + reason.status);
                }
            });
        }

        return deferred.promise;
    };

    return {
        save: save,
    };

}