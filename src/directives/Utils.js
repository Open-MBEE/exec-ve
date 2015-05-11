'use strict';

angular.module('mms.directives')
.factory('Utils', ['$q','$modal','$templateCache','$rootScope','$compile','WorkspaceService','ConfigService','ElementService','ViewService', 'growl','_', Utils]);

/**
 * @ngdoc service
 * @name mms.directives.Utils
 * @requires $q
 * @requires $modal
 * @requires $templateCache
 * @requires mms.WorkspaceService
 * @requires mms.ConfigService
 * @requires mms.ElementService
 * @requires _
 *
 * @description
 * Utility methods for performing edit like behavior to a element
 *
 */
function Utils($q, $modal, $templateCache, $rootScope, $compile, WorkspaceService, ConfigService, ElementService, ViewService, growl, _) {
    
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
     * @name mms.directives.Utils#save
     * @methodOf mms.directives.Utils
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

    /**
     * @ngdoc function
     * @name mms.directives.Utils#hasEdits
     * @methodOf  mms.directives.Utils
     * 
     * @description 
     * whether editing object has changes compared to base element,
     * currently compares name, doc, property values, if element is not 
     * editable, returns false
     * 
     * @return {boolean} has changes or not
     */
     var hasEdits = function($scope) {
        if ($scope.edit === null)
            return false;
        if ($scope.edit.name !== $scope.element.name)
            return true;
        if ($scope.edit.documentation !== $scope.element.documentation)
            return true;
        if ($scope.edit.specialization && $scope.edit.specialization.type === 'Property' && 
            !angular.equals($scope.edit.specialization.value, $scope.element.specialization.value))
            return true;
        if ($scope.edit.description !== $scope.element.description)
            return true;
        return false;
    };

    /**
     * @ngdoc function
     * @name mms.directives.Utils#revertEdits
     * @methodOf mms.directives.Utils
     * 
     * @description 
     * reset editing object back to base element values for name, doc, values
     * 
     */
    var revertEdits = function($scope) {
        if ($scope.mmsType === 'workspace') {
            $scope.edit.name = $scope.element.name;
        } else if ($scope.mmsType === 'tag') {
            $scope.edit.name = $scope.element.name;
            $scope.edit.description = $scope.element.description;
        } else {
        $scope.edit.name = $scope.element.name;
        $scope.edit.documentation = $scope.element.documentation;
        if ($scope.edit.specialization.type === 'Property' && angular.isArray($scope.edit.specialization.value)) {
            $scope.edit.specialization.value = _.cloneDeep($scope.element.specialization.value);
            $scope.editValues = $scope.edit.specialization.value;
        }
        if ($scope.edit.specialization.type === 'Constraint' && $scope.edit.specialization.specification) {
            $scope.edit.specialization.specification = _.cloneDeep($scope.element.specialization.specification);
            $scope.editValue = $scope.edit.specialization.specification;
        }
        }
    };

    var handleError = function(reason) {
        if (reason.type === 'info')
            growl.info(reason.message);
        else if (reason.type === 'warning')
            growl.warning(reason.message);
        else if (reason.type === 'error')
            growl.error(reason.message);
    };

    var addFrame = function($scope, mmsViewCtrl, element,template) {

        if (mmsViewCtrl.isEditable() && !$scope.isEditing && !$scope.cleanUp) {

            ElementService.getElementForEdit($scope.mmsEid, false, $scope.ws)
            .then(function(data) {
                $scope.isEditing = true;
                $scope.edit = data;
                element.empty();
                element.append(template);
                $compile(element.contents())($scope); 

                // Broadcast message for the toolCtrl:
                $rootScope.$broadcast('presentationElem.edit',$scope.edit, $scope.ws);
                mmsViewCtrl.incrementNumOpenEdits();
            }, handleError);

            // TODO: Should this check the entire or just the instance specification
            // TODO: How smart does it need to be, since the instance specification is just a reference.
            // Will need to unravel until the end to check all references
            ElementService.isCacheOutdated($scope.mmsEid, $scope.ws)
            .then(function(data) {
                if (data.status && data.server.modified > data.cache.modified)
                    growl.warning('This element has been updated on the server');
            });
        }

        // This logic prevents a cancel/save from also triggering a open edit
        if ($scope.cleanUp) {
            $scope.cleanUp = false;
        }
    };

    var saveAction = function($scope, recompile, mmsViewCtrl, bbApi) {

        if ($scope.elementSaving) {
            growl.info('Please Wait...');
            return;
        }
        bbApi.toggleButtonSpinner('presentation.element.save');
        $scope.elementSaving = true;

        save($scope.edit, $scope.ws, "element", $scope.mmsEid, null, $scope).then(function(data) {
            $scope.elementSaving = false;
            $scope.isEditing = false;
            $scope.cleanUp = true;
            // Broadcast message for the toolCtrl:
            $rootScope.$broadcast('presentationElem.save',$scope.edit, $scope.ws);
            recompile();
            mmsViewCtrl.decrementNumOpenEdits();
            growl.success('Save Successful');
        }, function(reason) {
            $scope.elementSaving = false;
            handleError(reason);
        }).finally(function() {
            bbApi.toggleButtonSpinner('presentation.element.save');
        });

    };

    var cancelAction = function($scope, mmsViewCtrl, recompile, bbApi) {

        var cancelCleanUp = function() {
            $scope.isEditing = false;
            $scope.cleanUp = true;
            revertEdits($scope);
             // Broadcast message for the ToolCtrl:
            $rootScope.$broadcast('presentationElem.cancel',$scope.edit, $scope.ws);
            recompile();
            mmsViewCtrl.decrementNumOpenEdits();
        };

        bbApi.toggleButtonSpinner('presentation.element.cancel');

        // Only need to confirm the cancellation if edits have been made:
        if (hasEdits($scope)) {
            var instance = $modal.open({
                templateUrl: 'partials/mms/cancelConfirm.html',
                scope: $scope,
                controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
                    $scope.ok = function() {
                        $modalInstance.close('ok');
                    };
                    $scope.cancel = function() {
                        $modalInstance.dismiss();
                    };
                }]
            });
            instance.result.then(function() {
                cancelCleanUp();
            }).finally(function() {
                bbApi.toggleButtonSpinner('presentation.element.cancel');
            });
        }
        else {
            cancelCleanUp();
            bbApi.toggleButtonSpinner('presentation.element.cancel');
        }
    };

    var deleteAction = function($scope, bbApi) {
        bbApi.toggleButtonSpinner('presentation.element.delete');
        ViewService.deleteElementFromView($scope.view.sysmlid, $scope.ws, $scope.instanceVal).then(function(data) {
            growl.success('Delete Successful');
        }, handleError).finally(function() {
            bbApi.toggleButtonSpinner('presentation.element.delete');
        });

        if (ViewService.isSection($scope.presentationElem)) {
            // Broadcast message to TreeCtrl:
            $rootScope.$broadcast('viewctrl.delete.section', $scope.presentationElem.name);
        }

    };

    return {
        save: save,
        hasEdits: hasEdits,
        revertEdits: revertEdits,
        addFrame: addFrame,
        saveAction: saveAction,
        cancelAction: cancelAction,
        deleteAction: deleteAction
    };

}