'use strict';

angular.module('mms.directives')
.factory('Utils', ['$q','$modal','$timeout', '$templateCache','$rootScope','$compile','WorkspaceService','ConfigService','ElementService','ViewService', 'UtilsService', 'growl','_', Utils]);

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
 * Utility methods for performing edit like behavior to a transclude element
 *
 */
function Utils($q, $modal, $timeout, $templateCache, $rootScope, $compile, WorkspaceService, ConfigService, ElementService, ViewService, UtilsService, growl, _) {
    
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
     * @param {object} edit the edit object to save
     * @param {string} mmsWs workspace
     * @param {string} mmsType workspace/tag/element
     * @param {string} mmsEid id of element
     * @param {object} [tinymceApi=null] optional tinymce api
     * @param {object} scope angular scope that has common functions
     * @param {string} type name/documentation/value/all
     * @return {Promise} promise would be resolved with updated element if save is successful.
     *      For unsuccessful saves, it will be rejected with an object with type and message.
     *      Type can be error or info. In case of conflict, there is an option to discard, merge,
     *      or force save. If the user decides to discord or merge, type will be info even though 
     *      the original save failed. Error means an actual error occured. 
     */
    var save = function(edit, mmsWs, mmsType, mmsEid, tinymceApi, scope, type) {
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
                $rootScope.$broadcast('element.updated', edit.sysmlid, (mmsWs ? mmsWs : 'master'), type);
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
                            UtilsService.mergeElement(scope.latest, mmsEid, mmsWs, true, type);
                            deferred.reject({type: 'info', message: 'Element Updated to Latest'});
                        } else if (choice === 'merge') { 
                            UtilsService.mergeElement(scope.latest, mmsEid, mmsWs, false, type);
                            var currentEdit = scope.edit;
                            if (scope.latest.name !== currentEdit.name && (type === 'name' || type === 'all'))
                                currentEdit.name = scope.latest.name + ' MERGE ' + currentEdit.name;
                            if (scope.latest.documentation !== currentEdit.documentation && (type === 'documentation' || type === 'all'))
                                currentEdit.documentation = scope.latest.documentation + '<p>MERGE</p>' + currentEdit.documentation;
                            currentEdit.read = scope.latest.read;
                            currentEdit.modified = scope.latest.modified;
                                //growl.info("Element name and doc merged");
                            var message = 'Element name and doc merged';
                            if (type === 'name')
                                message = 'Element name merged';
                            else if (type === 'documentation')
                                message = 'Element documentation merged';
                            deferred.reject({type: 'info', message: message});
                        } else if (choice === 'force') {
                            edit.read = scope.latest.read;
                            edit.modified = scope.latest.modified;
                            save(edit, mmsWs, mmsType, mmsEid, tinymceApi, scope, type).then(function(resolved) {
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
     * @param {object} scope scope with common properties
     * @param {string} type name/documentation/value
     * @param {boolena} checkAll check everything
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
     * @param {object} scope scope with common properties
     * @param {string} type name/documentation/value
     * @param {boolean} revertAll revert all properties
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

    var addFrame = function(scope, mmsViewCtrl, element, template, editObj, doNotScroll) {

        if (mmsViewCtrl.isEditable() && !scope.isEditing && scope.element.editable && scope.version === 'latest') { // && !scope.cleanUp) {

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
                    if (scope.recompileScope)
                        scope.recompileScope.$destroy();
                    scope.recompileScope = scope.$new();
                    element.empty();
                    element.append(template);
                    $compile(element.contents())(scope.recompileScope);
                }

                if (!scope.skipBroadcast) {
                    // Broadcast message for the toolCtrl:
                    $rootScope.$broadcast('presentationElem.edit',scope);
                }
                else {
                    scope.skipBroadcast = false;
                }
                if (!doNotScroll)
                    scrollToElement(element);
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
    };

    //called by transcludes
    var saveAction = function(scope, recompile, bbApi, editObj, type, element) {

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
        save(myEdit, scope.ws, "element", id, null, scope, type).then(function(data) {
            scope.elementSaving = false;
            scope.isEditing = false;
            // Broadcast message for the toolCtrl:
            $rootScope.$broadcast('presentationElem.save', scope);
            $rootScope.$broadcast('view.reorder.refresh');
            //recompile();
            growl.success('Save Successful');
            scrollToElement(element);
        }, function(reason) {
            scope.elementSaving = false;
            handleError(reason);
        }).finally(function() {
            bbApi.toggleButtonSpinner('presentation.element.save');
        });
    };

    //called by transcludes
    var cancelAction = function(scope, recompile, bbApi, type, element) {

        var cancelCleanUp = function() {
            scope.isEditing = false;
            revertEdits(scope, type);
             // Broadcast message for the ToolCtrl:
            $rootScope.$broadcast('presentationElem.cancel', scope);
            recompile();
            scrollToElement(element);
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

        scope.name = scope.edit.name;

        var instance = $modal.open({
            templateUrl: 'partials/mms/delete.html',
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

            var viewOrSecId = section ? section.sysmlid : scope.view.sysmlid;
            ViewService.deleteElementFromViewOrSection(viewOrSecId, scope.ws, scope.instanceVal).then(function(data) {
                if (ViewService.isSection(scope.presentationElem)) {
                    // Broadcast message to TreeCtrl:
                    $rootScope.$broadcast('viewctrl.delete.section', scope.presentationElem);
                }

                $rootScope.$broadcast('view.reorder.refresh');

                 // Broadcast message for the ToolCtrl:
                $rootScope.$broadcast('presentationElem.cancel',scope);

                growl.success('Delete Successful');
            }, handleError);

        }).finally(function() {
            bbApi.toggleButtonSpinner('presentation.element.delete');
        });
    };

    var leaveEditModeOrFrame = function(scope, recompile, recompileEdit, type) {

        if (scope.edit && hasEdits(scope, type) && !scope.recompileEdit) {
            scope.skipBroadcast = true;
            scope.recompileEdit = true;
            recompileEdit();
        }
        else {
            if (scope.edit && scope.ws && scope.isEditing) {
                // Broadcast message for the ToolCtrl to clear out the tracker window:
                $rootScope.$broadcast('presentationElem.cancel',scope);
                if (scope.element)
                    recompile();
            }
        }
        scope.isEditing = false;
        scope.elementSaving = false;
    };

    var previewAction = function(scope, recompileEdit, recompile, type, element) {
        leaveEditModeOrFrame(scope, recompile, recompileEdit, type);
        scrollToElement(element);
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
            leaveEditModeOrFrame(scope, recompile, recompileEdit, type);
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

    var scrollToElement = function(element) {
        $timeout(function() {
            var el = element.get(0);
            if (element.isOnScreen())
                return;
            el.scrollIntoView();
        }, 500, false);
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