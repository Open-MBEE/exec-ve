'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('ToolCtrl', ['$scope', '$state', '$uibModal', '$q', '$timeout', 'hotkeys',
            'ElementService', 'ProjectService', 'growl', 'projectOb', 'refOb', 'tagObs', 'branchObs', 'documentOb', 'viewOb', 'Utils',
            'PermissionsService', 'RootScopeService', 'EventService', 'EditService', 'ToolbarService',
function($scope, $state, $uibModal, $q, $timeout, hotkeys,
            ElementService, ProjectService, growl, projectOb, refOb, tagObs, branchObs, documentOb, viewOb, Utils,
            PermissionsService, RootScopeService, EventService, EditService, ToolbarService) {

    const rootScopeSvc = RootScopeService;
    const eventSvc = EventService;
    const editSvc = EditService;

    const toolbar = ToolbarService;

    $scope.specInfo = {
        refId: refOb.id,
        commitId: 'latest',
        projectId: projectOb.id,
        id: null
    };
    $scope.projectOb = projectOb;
    $scope.editable = documentOb && refOb.type === 'Branch' && PermissionsService.hasBranchEditPermission(refOb);
    $scope.viewOb = viewOb;
    $scope.documentOb = documentOb;
    $scope.refOb = refOb;
    $scope.tagObs = tagObs;
    $scope.branchObs = branchObs;

    if (viewOb) {
        $scope.specInfo.id = viewOb.id;
        $scope.viewId = viewOb.id;
    } else if (documentOb) {
        $scope.specInfo.id = documentOb.id;
        $scope.viewId = documentOb.id;
    }

    $scope.specApi = {};
    $scope.viewContentsOrderApi = {};

    rootScopeSvc.mmsPaneClosed($scope.$pane.closed);
    $scope.$watch('$pane.closed',() => {
        rootScopeSvc.mmsPaneClosed($scope.$pane.closed);
    });

   $scope.subs.push(eventSvc.$on(editSvc.EVENT, function() {
        $scope.openEdits = editSvc.openEdits();
    }));
    $scope.edits = editSvc.getAll();
    
   $scope.subs.push(eventSvc.$on('mms-pane-toggle',(paneClosed) => {
        if (paneClosed === undefined) {
            $scope.$pane.toggle();
            rootScopeSvc.mmsPaneClosed($scope.$pane.closed);
        }
        else if (paneClosed && !$scope.$pane.closed) {
            $scope.$pane.toggle();
            rootScopeSvc.mmsPaneClosed($scope.$pane.closed);
        }
        else if (!paneClosed && $scope.$pane.closed) {
            $scope.$pane.toggle();
            rootScopeSvc.mmsPaneClosed($scope.$pane.closed);
        }
    }));

    $scope.show = {
        element: true,
        history: false,
        tags: false,
        reorder: false
    };
    $scope.tracker = {};


    $scope.etrackerChange = function() {
        $scope.specApi.keepMode();
        var id = $scope.tracker.etrackerSelected;
        if (!id)
            return;
        var info = id.split('|');
        $scope.specInfo.id = info[0];
        $scope.specInfo.projectId = info[1];
        $scope.specInfo.refId = info[2];
        $scope.specInfo.commitId = 'latest';
        eventSvc.$broadcast(toolbar.constants.SETPERMISSION, {id: 'element-editor', value: true});
    };

    var showPane = function(pane) {
        angular.forEach($scope.show, function(value, key) {
            if (key === pane)
                $scope.show[key] = true;
            else
                $scope.show[key] = false;
        });
    };

    // Check edit count and toggle appropriate save all and edit/edit-asterisk buttons
    var cleanUpSaveAll = function() {
        if (editSvc.openEdits() > 0) {
            eventSvc.$broadcast(toolbar.constants.SETPERMISSION, {id: 'element-editor-saveall', value: true});
            eventSvc.$broadcast(toolbar.constants.SETICON, {id: 'element-editor', value: 'fa-edit-asterisk'});
        } else {
            eventSvc.$broadcast(toolbar.constants.SETPERMISSION, {id: 'element-editor-saveall', value: false});
            eventSvc.$broadcast(toolbar.constants.SETICON, {id: 'element-editor', value: 'fa-edit'});
        }
    };

   $scope.subs.push(eventSvc.$on('element-history', function() {
        showPane('history');
    }));

   $scope.subs.push(eventSvc.$on('tags', function() {
        showPane('tags');
    }));

   $scope.subs.push(eventSvc.$on('gotoTagsBranches', function(){
        eventSvc.$broadcast(toolbar.constants.SELECT, {id: 'tags'});
        showPane('tags');
    }));

    var cleanUpEdit = function(editOb, cleanAll) {
        if (!Utils.hasEdits(editOb) || cleanAll) {
            var key = editOb.id + '|' + editOb._projectId + '|' + editOb._refId;
            editSvc.remove(key);
            cleanUpSaveAll();
        }
    };

   $scope.subs.push(eventSvc.$on('presentationElem.edit', function(editOb) {
        var key = editOb.id + '|' + editOb._projectId + '|' + editOb._refId;
        editSvc.addOrUpdate(key, editOb);
        cleanUpSaveAll();
    }));

   $scope.subs.push(eventSvc.$on('presentationElem.save', function(editOb) {
        cleanUpEdit(editOb, true);
    }));

   $scope.subs.push(eventSvc.$on('presentationElem.cancel', function(editOb) {
        cleanUpEdit(editOb);
    }));

   $scope.subs.push(eventSvc.$on('elementSelected', function(data) {
        let elementOb = data.elementOb;
        let commitId = (data.commitId) ? data.commitId : null;
        let displayOldContent = (data.displayOldContent) ? data.displayOldContent : null;
        $scope.specInfo.id = elementOb.id;
        $scope.specInfo.projectId = elementOb._projectId;
        $scope.specInfo.refId = elementOb._refId;
        $scope.specInfo.commitId = commitId ? commitId : elementOb._commitId;
        $scope.specInfo.mmsDisplayOldContent = displayOldContent;
        if($scope.show.element) {
            eventSvc.$broadcast(toolbar.constants.SELECT, {id: 'element-viewer'});
        }
        if ($scope.specApi.setEditing) {
            $scope.specApi.setEditing(false);
        }
        var editable = $scope.refOb.type === 'Branch' && commitId === 'latest' && PermissionsService.hasBranchEditPermission($scope.refOb);
        eventSvc.$broadcast(toolbar.constants.SETPERMISSION, {id: 'element-editor', value: editable});
        $scope.$apply();
    }));

   $scope.subs.push(eventSvc.$on('element-viewer', function() {
        $scope.specApi.setEditing(false);
        cleanUpSaveAll();
        showPane('element');
    }));
   $scope.subs.push(eventSvc.$on('element-editor', function() {
        $scope.specApi.setEditing(true);
        showPane('element');
        var editOb = $scope.specApi.getEdits();
        if (editOb) {
            var key = editOb.id + '|' + editOb._projectId + '|' + editOb._refId;
            $scope.tracker.etrackerSelected = key;
            editSvc.addOrUpdate(key, editOb);
            cleanUpSaveAll();
        }
        ElementService.isCacheOutdated(editOb)
        .then(function(data) {
            if (data.status && data.server._modified > data.cache._modified)
                growl.error('This element has been updated on the server. Please refresh the page to get the latest version.');
        });
    }));
   $scope.subs.push(eventSvc.$on('viewSelected', function(data) {
        let elementOb = data.elementOb;
        let commitId = (data.commitId) ? data.commitId : null;
        eventSvc.$broadcast('elementSelected', {elementOb: elementOb, commitId: commitId});
        $scope.viewOb = elementOb;
        var editable = $scope.refOb.type === 'Branch' && commitId === 'latest' && PermissionsService.hasBranchEditPermission($scope.refOb);
        $scope.viewCommitId = commitId ? commitId : elementOb._commitId;
        eventSvc.$broadcast(toolbar.constants.SETPERMISSION, {id: 'view-reorder', value: editable});
    }));

   $scope.subs.push(eventSvc.$on('view-reorder.refresh', function() {
        $scope.viewContentsOrderApi.refresh();
    }));

   $scope.subs.push(eventSvc.$on('view-reorder', function() {
        $scope.viewContentsOrderApi.setEditing(true);
        showPane('reorder');
    }));

    var elementSaving = false;
   $scope.subs.push(eventSvc.$on('element-editor-save', function() {
        save(false);
    }));
   $scope.subs.push(eventSvc.$on('element-editor-saveC', function() {
        save(true);
    }));
    var save = function(continueEdit) {
        if (elementSaving) {
            growl.info('Please Wait...');
            return;
        }
        var saveEdit = $scope.specApi.getEdits();
        Utils.clearAutosaveContent(saveEdit._projectId + saveEdit._refId + saveEdit.id, saveEdit.type);
        elementSaving = true;
        if (!continueEdit)
            eventSvc.$broadcast(toolbar.constants.TOGGLEICONSPINNER, {id: 'element-editor-save'});
        else
            eventSvc.$broadcast(toolbar.constants.TOGGLEICONSPINNER, {id: 'element-editor-saveC'});
        $timeout(function() {
        $scope.specApi.save().then(function(data) {
            elementSaving = false;
            growl.success('Save Successful');
            if (continueEdit)
                return;
            var saveEdit = $scope.specApi.getEdits();
            var key = saveEdit.id + '|' + saveEdit._projectId + '|' + saveEdit._refId;
            editSvc.remove(key);
            if (editSvc.openEdits() > 0) {
                var next = Object.keys(editSvc.getAll())[0];
                var id = next.split('|');
                $scope.tracker.etrackerSelected = next;
                $scope.specApi.keepMode();
                $scope.specInfo.id = id[0];
                $scope.specInfo.projectId = id[1];
                $scope.specInfo.refId = id[2];
                $scope.specInfo.commitId = 'latest';
            } else {
                $scope.specApi.setEditing(false);
                eventSvc.$broadcast(toolbar.constants.SELECT, {id: 'element-viewer'});
                cleanUpSaveAll();
            }
        }, function(reason) {
            elementSaving = false;
            if (reason.type === 'info')
                growl.info(reason.message);
            else if (reason.type === 'warning')
                growl.warning(reason.message);
            else if (reason.type === 'error')
                growl.error(reason.message);
        }).finally(function() {
            if (!continueEdit)
                eventSvc.$broadcast(toolbar.constants.TOGGLEICONSPINNER, {id: 'element-editor-save'});
            else
                eventSvc.$broadcast(toolbar.constants.TOGGLEICONSPINNER, {id: 'element-editor-saveC'});
        });
        }, 1000, false);
        eventSvc.$broadcast(toolbar.constants.SELECT, {id: 'element-editor'});
    };

    hotkeys.bindTo($scope)
    .add({
        combo: 'alt+a',
        description: 'save all',
        callback: function() {eventSvc.$broadcast('element-editor-saveall');}
    });
    var savingAll = false;
   $scope.subs.push(eventSvc.$on('element-editor-saveall', function() {
        if (savingAll) {
            growl.info('Please wait...');
            return;
        }
        if (editSvc.openEdits() === 0) {
            growl.info('Nothing to save');
            return;
        }

        Object.values(editSvc.getAll()).forEach(function(ve_edit) {
           Utils.clearAutosaveContent(ve_edit._projectId + ve_edit._refId + ve_edit.id, ve_edit.type);
        });

        if ($scope.specApi && $scope.specApi.editorSave)
            $scope.specApi.editorSave();
        savingAll = true;
        eventSvc.$broadcast(toolbar.constants.TOGGLEICONSPINNER, {id: 'element-editor-saveall'});
        ElementService.updateElements(Object.values(editSvc.getAll()))
            .then(function(responses) {
                responses.forEach(function(elementOb) {
                    editSvc.remove(elementOb.id + '|' + elementOb._projectId + '|' + elementOb._refId);
                    let data = {};
                    data.element = elementOb;
                    data.continueEdit = false;
                    eventSvc.$broadcast('element.updated', data);
                    eventSvc.$broadcast(toolbar.constants.SELECT, {id: 'element-viewer'});
                    $scope.specApi.setEditing(false);
                });
                growl.success("Save All Successful");

            }, function(responses) {
                // reset the last edit elementOb to one of the existing element
                var elementToSelect = Object.values(editSvc.getAll())[0];
                $scope.tracker.etrackerSelected = elementToSelect.id + '|' + elementToSelect._projectId + '|' + elementToSelect._refId;
                $scope.specApi.keepMode();
                $scope.specInfo.id = elementToSelect.id;
                $scope.specInfo.projectId = elementToSelect._projectId;
                $scope.specInfo.refId = elementToSelect._refId;
                $scope.specInfo.commitId = 'latest';
                growl.error("Some elements failed to save, resolve individually in edit pane");

            }).finally(function() {
                eventSvc.$broadcast(toolbar.constants.TOGGLEICONSPINNER, {id: 'element-editor-saveall'});
                savingAll = false;
                cleanUpSaveAll();
                if (editSvc.openEdits() === 0) {
                    eventSvc.$broadcast(toolbar.constants.SETICON, {id: 'element-editor', value: 'fa-edit'});
                }
            });
    }));
   $scope.subs.push(eventSvc.$on('element-editor-cancel', function() {
        var go = function() {
            var rmEdit = $scope.specApi.getEdits();
            editSvc.remove(rmEdit.id + '|' + rmEdit._projectId + '|' + rmEdit._refId);
            $scope.specApi.revertEdits();
            if (editSvc.openEdits() > 0) {
                var next = Object.keys(editSvc.getAll())[0];
                var id = next.split('|');
                $scope.tracker.etrackerSelected = next;
                $scope.specApi.keepMode();
                $scope.specInfo.id = id[0];
                $scope.specInfo.projectId = id[1];
                $scope.specInfo.refId = id[2];
                $scope.specInfo.commitId = 'latest';
            } else {
                $scope.specApi.setEditing(false);
                eventSvc.$broadcast(toolbar.constants.SELECT, {id: 'element-viewer'});
                eventSvc.$broadcast(toolbar.constants.SETICON, {id: 'element-editor', value: 'fa-edit'});
                cleanUpSaveAll();
            }
        };
        if ($scope.specApi.hasEdits()) {
            var instance = $uibModal.open({
                templateUrl: 'partials/mms/cancelConfirm.html',
                scope: $scope,
                controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
                    $scope.ok = function() {
                        var ve_edit = $scope.specApi.getEdits();
                        Utils.clearAutosaveContent(ve_edit._projectId + ve_edit._refId + ve_edit.id, ve_edit.type);

                        $uibModalInstance.close('ok');
                    };
                    $scope.cancel = function() {
                        $uibModalInstance.dismiss();
                    };
                }]
            });
            instance.result.then(function() {
                go();
            });
        } else
            go();
    }));
    var viewSaving = false;
   $scope.subs.push(eventSvc.$on('view-reorder-save', function() {
        if (viewSaving) {
            growl.info('Please Wait...');
            return;
        }
        viewSaving = true;
        eventSvc.$broadcast(toolbar.constants.TOGGLEICONSPINNER, {id: 'view-reorder-save'});
        $scope.viewContentsOrderApi.save().then(function(data) {
            viewSaving = false;
            $scope.viewContentsOrderApi.refresh();
            growl.success('Save Succesful');
            eventSvc.$broadcast(toolbar.constants.TOGGLEICONSPINNER, {id: 'view-reorder-save'});
            eventSvc.$broadcast('view.reorder.saved', {id: $scope.viewOb.id});
        }, function(response) {
            $scope.viewContentsOrderApi.refresh();
            viewSaving = false;
            var reason = response.failedRequests[0];
            growl.error(reason.message);
            eventSvc.$broadcast(toolbar.constants.TOGGLEICONSPINNER, {id: 'view-reorder-save'});
        });
        eventSvc.$broadcast(toolbar.constants.SELECT, {id: 'view-reorder'});
    }));
   $scope.subs.push(eventSvc.$on('view-reorder-cancel', function() {
        $scope.specApi.setEditing(false);
        $scope.viewContentsOrderApi.refresh();
        eventSvc.$broadcast(toolbar.constants.SELECT, {id: 'element-viewer'});
        showPane('element');
    }));
}]);
