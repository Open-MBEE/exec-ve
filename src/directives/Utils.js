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
    var save = function(edit, mmsWs, mmsType, mmsEid, tinymceApi, scope) {
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
                    scope.latest = reason.data.elements[0];
                    var instance = $modal.open({
                        template: $templateCache.get('mms/templates/saveConflict.html'),
                        controller: ['$scope', '$modalInstance', conflictCtrl],
                        scope: scope,
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
                            edit.read = scope.latest.read;
                            edit.modified = scope.latest.modified;
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
     var hasEdits = function(scope, type, checkAll) {
        if (!scope.edit)
            return false;
        if (type === 'name' || checkAll) {
            if (scope.edit.name !== scope.element.name)
                return true;
        }
        if (type === 'documentation' || checkAll) {
            if (scope.edit.documentation !== scope.element.documentation)
                return true;
        }
        if (type === 'value' || checkAll) {
            if (scope.edit.specialization && scope.edit.specialization.type === 'Property' && 
                    !angular.equals(scope.edit.specialization.value, scope.element.specialization.value))
                return true;
            if (scope.edit.specialization.type === 'Constraint' && 
                    !angular.equals(scope.edit.specialization.specification, scope.element.specialization.specification))
                return true;
        }
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
    var revertEdits = function(scope, type, revertAll) {
        if (scope.mmsType === 'workspace') {
            scope.edit.name = scope.element.name;
        } 
        else if (scope.mmsType === 'tag') {
            scope.edit.name = scope.element.name;
            scope.edit.description = scope.element.description;
        } 
        else {
            if (type === 'name' || revertAll) {
                scope.edit.name = scope.element.name;
            }
            if (type === 'documentation' || revertAll) {
                scope.edit.documentation = scope.element.documentation;
            }
            if (type === 'value' || revertAll) {
                if (scope.edit.specialization && scope.edit.specialization.type === 'Property' && angular.isArray(scope.edit.specialization.value)) {
                    scope.edit.specialization.value = _.cloneDeep(scope.element.specialization.value);
                    scope.editValues = scope.edit.specialization.value;
                }
                if (scope.edit.specialization && scope.edit.specialization.type === 'Constraint' && scope.edit.specialization.specification) {
                    scope.edit.specialization.specification = _.cloneDeep(scope.element.specialization.specification);
                    scope.editValues = [scope.edit.specialization.specification];
                    scope.editValue = scope.edit.specialization.specification;
                }
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

    var addFrame = function(scope, mmsViewCtrl, element, template, editObj, skipBroadcast) {

        if (mmsViewCtrl.isEditable() && !scope.isEditing && !scope.cleanUp) {

            var id = editObj ? editObj.sysmlid : scope.mmsEid;
            ElementService.getElementForEdit(id, false, scope.ws)
            .then(function(data) {
                scope.isEditing = true;
                scope.recompileEdit = false;
                scope.edit = data;

                if (data.specialization.type === 'Property' && angular.isArray(data.specialization.value)) {
                    scope.editValues = data.specialization.value;
                }
                if (data.specialization.type === 'Constraint' && data.specialization.specification) {
                    scope.editValues = [data.specialization.specification];
                }

                if (template) {
                    element.empty();
                    element.append(template);
                    $compile(element.contents())(scope);
                }

                if (!skipBroadcast) {
                    // Broadcast message for the toolCtrl:
                    $rootScope.$broadcast('presentationElem.edit',scope.edit, scope.ws);
                }
            }, handleError);

            // TODO: Should this check the entire or just the instance specification
            // TODO: How smart does it need to be, since the instance specification is just a reference.
            // Will need to unravel until the end to check all references
            ElementService.isCacheOutdated(id, scope.ws)
            .then(function(data) {
                if (data.status && data.server.modified > data.cache.modified)
                    growl.warning('This element has been updated on the server');
            });
        }

        // This logic prevents a cancel/save from also triggering a open edit
        if (scope.cleanUp) {
            scope.cleanUp = false;
        }
    };

    //called by transcludes
    var saveAction = function(scope, recompile, bbApi, editObj, type) {

        if (scope.elementSaving) {
            growl.info('Please Wait...');
            return;
        }
        bbApi.toggleButtonSpinner('presentation.element.save');
        scope.elementSaving = true;
        var id = editObj ? editObj.sysmlid : scope.mmsEid;

        // If it is a Section, then merge the changes b/c deletions to the Section's contents
        // are not done on the scope.edit.
        if (editObj && ViewService.isSection(editObj)) {
            _.merge(scope.edit, editObj, function(a,b,id) {
                if (angular.isArray(a) && angular.isArray(b) && b.length < a.length) {
                    return b;
                }

                if (id === 'name') {
                    return a;
                }
            });
        }

        // Want the save object to contain only what properties were edited:
        var myEdit = {
                        sysmlid: scope.edit.sysmlid,
                        modified: scope.edit.modified,
                        read: scope.edit.read
                     };
        if (type === 'name' || type === 'documentation') {
            myEdit[type] = scope.edit[type];
        } else if (type === 'value') {
            if (scope.edit.specialization.type === 'Property' && angular.isArray(scope.edit.specialization.value)) {
                myEdit.specialization = {
                                            value: scope.edit.specialization.value,
                                            type: 'Property'
                                        };
            }
            if (scope.edit.specialization.type === 'Constraint' && scope.edit.specialization.specification) {
                myEdit.specialization = {
                                            specification: scope.edit.specialization.specification,
                                            type: 'Constraint'
                                        };
            }
        } else {
            myEdit = scope.edit;
        }
        save(myEdit, scope.ws, "element", id, null, scope).then(function(data) {
            scope.elementSaving = false;
            scope.cleanUp = true;
            scope.isEditing = false;
            // Broadcast message for the toolCtrl:
            $rootScope.$broadcast('presentationElem.save', scope.edit, scope.ws, type);
            recompile();
            growl.success('Save Successful');
        }, function(reason) {
            scope.elementSaving = false;
            handleError(reason);
        }).finally(function() {
            bbApi.toggleButtonSpinner('presentation.element.save');
        });
    };

    //called by transcludes
    var cancelAction = function(scope, recompile, bbApi, type) {

        var cancelCleanUp = function() {
            scope.cleanUp = true;
            scope.isEditing = false;
            revertEdits(scope, type);
             // Broadcast message for the ToolCtrl:
            $rootScope.$broadcast('presentationElem.cancel', scope.edit, scope.ws, type);
            recompile();
        };

        bbApi.toggleButtonSpinner('presentation.element.cancel');

        // Only need to confirm the cancellation if edits have been made:
        if (hasEdits(scope, type)) {
            var instance = $modal.open({
                templateUrl: 'partials/mms/cancelConfirm.html',
                scope: scope,
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

    var deleteAction = function(scope, bbApi, section) {
        bbApi.toggleButtonSpinner('presentation.element.delete');
        var viewOrSecId = section ? section.sysmlid : scope.view.sysmlid;
        ViewService.deleteElementFromViewOrSection(viewOrSecId, scope.ws, scope.instanceVal).then(function(data) {
            if (ViewService.isSection(scope.presentationElem)) {
                // Broadcast message to TreeCtrl:
                $rootScope.$broadcast('viewctrl.delete.section', scope.presentationElem);
            }
             // Broadcast message for the ToolCtrl:
            $rootScope.$broadcast('presentationElem.cancel',scope.edit, scope.ws);

            growl.success('Delete Successful');
        }, handleError).finally(function() {
            bbApi.toggleButtonSpinner('presentation.element.delete');
        });
    };

    var previewAction = function(scope, recompileEdit) {
        scope.recompileEdit = true;
        scope.isEditing = false;
        scope.cleanUp = true;
        recompileEdit();
    };

    var showEditCallBack = function(scope, mmsViewCtrl, element, template, recompile, recompileEdit, type, editObj) {

        // Going into edit mode, so add a frame if had a previous edit in progress:
        if (mmsViewCtrl.isEditable()) {
            if (scope.edit && hasEdits(scope, type) && !scope.isEditing) {
                addFrame(scope,mmsViewCtrl,element,template,editObj,true);
            }
        }
        // Leaving edit mode, so highlight the unsaved edit if needed:
        else {
            if (scope.edit && hasEdits(scope, type) && !scope.recompileEdit) {
                scope.recompileEdit = true;
                recompileEdit();
            }
            else {
                if (scope.edit && scope.ws && scope.isEditing) {
                    // Broadcast message for the ToolCtrl to clear out the tracker window:
                    $rootScope.$broadcast('presentationElem.cancel',scope.edit, scope.ws);
                    if (scope.element)
                        recompile();
                }
            }
            scope.isEditing = false;
            scope.cleanUp = false;
            scope.elementSaving = false;
        }
    };

    var isDirectChildOfPresentationElementFunc = function(element, mmsViewCtrl) {
        var currentElement = (element[0]) ? element[0] : element;
        var viewElementCount = 0;
        while (currentElement.parentElement) {
            var parent = (currentElement.parentElement[0]) ? currentElement.parentElement[0] : currentElement.parentElement;
            if (mmsViewCtrl.isTranscludedElement(parent.nodeName))
                return false;
            if (mmsViewCtrl.isViewElement(parent.nodeName)) {
                viewElementCount++;
                if (viewElementCount > 1)
                    return false;
            }
            if (mmsViewCtrl.isPresentationElement(parent.nodeName))
                return true;
            currentElement = parent;
        }
        return false;
    };

    var hasHtml = function(s) {
        if (s.indexOf('<p>') === -1)
            return false;
        return true;
    };

    return {
        save: save,
        hasEdits: hasEdits,
        revertEdits: revertEdits,
        addFrame: addFrame,
        saveAction: saveAction,
        cancelAction: cancelAction,
        deleteAction: deleteAction,
        previewAction: previewAction,
        showEditCallBack: showEditCallBack,
        isDirectChildOfPresentationElementFunc: isDirectChildOfPresentationElementFunc,
        hasHtml: hasHtml,
    };

}