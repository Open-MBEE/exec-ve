'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('ToolCtrl', ['$scope', '$rootScope', '$state', '$uibModal', '$q', '$timeout', 'hotkeys',
            'ElementService', 'ProjectService', 'growl', 'projectOb', 'refOb', 'tagObs', 'branchObs', 'documentOb', 'viewOb', 'Utils',
            'PermissionsService', 'SessionService', 'EventService', 'EditService', 'ToolbarService',
function($scope, $rootScope, $state, $uibModal, $q, $timeout, hotkeys,
            ElementService, ProjectService, growl, projectOb, refOb, tagObs, branchObs, documentOb, viewOb, Utils,
            PermissionsService, SessionService, EventService, EditService, ToolbarService) {

    const session = SessionService;
    const eventSvc = EventService;
    const edit = EditService;
    let toolbar = ToolbarService.getApi();

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

    session.mmsPaneClosed($scope.$pane.closed);
    $scope.$watch($scope.$pane.closed,() => {
        session.mmsPaneClosed($scope.$pane.closed);
    });

    eventSvc.$on('mms-pane-toggle',(paneClosed) => {
        if (paneClosed === undefined) {
            $scope.$pane.toggle();
        }
        else if (paneClosed && !$scope.$pane.closed) {
            $scope.$pane.toggle();
        }
        else if (!paneClosed && $scope.$pane.closed) {
            $scope.$pane.toggle();
        }
    });

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
        toolbar.setPermission('element-editor', true);
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
        if (edit.openEdits() > 0) {
            toolbar.setPermission('element-editor-saveall', true);
            toolbar.setIcon('element-editor', 'fa-edit-asterisk');
        } else {
            toolbar.setPermission('element-editor-saveall', false);
            toolbar.setIcon('element-editor', 'fa-edit');
        }
    };

    eventSvc.$on('element-history', function() {
        showPane('history');
    });

    eventSvc.$on('tags', function() {
        showPane('tags');
    });

    eventSvc.$on('gotoTagsBranches', function(){
        toolbar.select('tags');
        showPane('tags');
    });

    var cleanUpEdit = function(editOb, cleanAll) {
        if (!Utils.hasEdits(editOb) || cleanAll) {
            var key = editOb.id + '|' + editOb._projectId + '|' + editOb._refId;
            delete $rootScope.ve_edits[key];
            cleanUpSaveAll();
        }
    };

    eventSvc.$on('presentationElem.edit', function(event, editOb) {
        var key = editOb.id + '|' + editOb._projectId + '|' + editOb._refId;
        edit.addOrUpdate(key, editOb);
        cleanUpSaveAll();
    });

    eventSvc.$on('presentationElem.save', function(event, editOb) {
        cleanUpEdit(editOb, true);
    });

    eventSvc.$on('presentationElem.cancel', function(event, editOb) {
        cleanUpEdit(editOb);
    });

    var elementSelected = function(data) {
        let elementOb = data.elementOb;
        let commitId = (data.commitId) ? data.commitId : null;
        let displayOldContent = (data.displayOldContent) ? data.displayOldContent : null;
        $scope.specInfo.id = elementOb.id;
        $scope.specInfo.projectId = elementOb._projectId;
        $scope.specInfo.refId = elementOb._refId;
        $scope.specInfo.commitId = commitId ? commitId : elementOb._commitId;
        $scope.specInfo.mmsDisplayOldContent = displayOldContent;
        if($scope.show.element) {
            toolbar.select('element-viewer');
        }
        if ($scope.specApi.setEditing) {
            $scope.specApi.setEditing(false);
        }
        var editable = $scope.refOb.type === 'Branch' && commitId === 'latest' && PermissionsService.hasBranchEditPermission($scope.refOb);
        toolbar.setPermission('element-editor', editable);
        $rootScope.$digest();
    };
    eventSvc.$on('elementSelected', elementSelected);
    eventSvc.$on('element-viewer', function() {
        $scope.specApi.setEditing(false);
        cleanUpSaveAll();
        showPane('element');
    });
    eventSvc.$on('element-editor', function() {
        $scope.specApi.setEditing(true);
        showPane('element');
        var editOb = $scope.specApi.getEdits();
        if (editOb) {
            var key = editOb.id + '|' + editOb._projectId + '|' + editOb._refId;
            $scope.tracker.etrackerSelected = key;
            edit.addOrUpdate(key, editOb);
            cleanUpSaveAll();
        }
        ElementService.isCacheOutdated(editOb)
        .then(function(data) {
            if (data.status && data.server._modified > data.cache._modified)
                growl.error('This element has been updated on the server. Please refresh the page to get the latest version.');
        });
    });
    eventSvc.$on('viewSelected', function(event, data) {
        let elementOb = data.elementOb;
        let commitId = (data.commitId) ? data.commitId : null;
        elementSelected(event, data);
        $scope.viewOb = elementOb;
        var editable = $scope.refOb.type === 'Branch' && commitId === 'latest' && PermissionsService.hasBranchEditPermission($scope.refOb);
        $scope.viewCommitId = commitId ? commitId : elementOb._commitId;
        toolbar.setPermission('view-reorder', editable);
    });

    eventSvc.$on('view-reorder.refresh', function() {
        $scope.viewContentsOrderApi.refresh();
    });

    eventSvc.$on('view-reorder', function() {
        $scope.viewContentsOrderApi.setEditing(true);
        showPane('reorder');
    });

    var elementSaving = false;
    eventSvc.$on('element-editor-save', function() {
        save(false);
    });
    eventSvc.$on('element-editor-saveC', function() {
        save(true);
    });
    var save = function(continueEdit) {
        if (elementSaving) {
            growl.info('Please Wait...');
            return;
        }
        var edit = $scope.specApi.getEdits();
        Utils.clearAutosaveContent(edit._projectId + edit._refId + edit.id, edit.type);
        elementSaving = true;
        if (!continueEdit)
            toolbar.toggleButtonSpinner('element-editor-save');
        else
            toolbar.toggleButtonSpinner('element-editor-saveC');
        $timeout(function() {
        $scope.specApi.save().then(function(data) {
            elementSaving = false;
            growl.success('Save Successful');
            if (continueEdit)
                return;
            var edit = $scope.specApi.getEdits();
            var key = edit.id + '|' + edit._projectId + '|' + edit._refId;
            edit.remove(key);
            if (edit.openEdits() > 0) {
                var next = edit.getAll()[0];
                var id = next.split('|');
                $scope.tracker.etrackerSelected = next;
                $scope.specApi.keepMode();
                $scope.specInfo.id = id[0];
                $scope.specInfo.projectId = id[1];
                $scope.specInfo.refId = id[2];
                $scope.specInfo.commitId = 'latest';
            } else {
                $scope.specApi.setEditing(false);
                toolbar.select('element-viewer');
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
                toolbar.toggleButtonSpinner('element-editor-save');
            else
                toolbar.toggleButtonSpinner('element-editor-saveC');
        });
        }, 1000, false);
        toolbar.select('element-editor');
    };

    hotkeys.bindTo($scope)
    .add({
        combo: 'alt+a',
        description: 'save all',
        callback: function() {eventSvc.$broadcast('element-editor-saveall');}
    });
    var savingAll = false;
    eventSvc.$on('element-editor-saveall', function() {
        if (savingAll) {
            growl.info('Please wait...');
            return;
        }
        if (edit.openEdits() === 0) {
            growl.info('Nothing to save');
            return;
        }

        Object.values(edit.getAll()).forEach(function(ve_edit) {
           Utils.clearAutosaveContent(ve_edit._projectId + ve_edit._refId + ve_edit.id, ve_edit.type);
        });

        if ($scope.specApi && $scope.specApi.editorSave)
            $scope.specApi.editorSave();
        savingAll = true;
        toolbar.toggleButtonSpinner('element-editor-saveall');
        ElementService.updateElements(Object.values($rootScope.ve_edits))
            .then(function(responses) {
                responses.forEach(function(elementOb) {
                    edit.remove(elementOb.id + '|' + elementOb._projectId + '|' + elementOb._refId);
                    let data = {};
                    data.element = elementOb;
                    data.continueEdit = false;
                    eventSvc.$broadcast('element.updated', data);
                    toolbar.select('element-viewer');
                    $scope.specApi.setEditing(false);
                });
                growl.success("Save All Successful");

            }, function(responses) {
                // reset the last edit elementOb to one of the existing element
                var elementToSelect = Object.values($rootScope.ve_edits)[0];
                $scope.tracker.etrackerSelected = elementToSelect.id + '|' + elementToSelect._projectId + '|' + elementToSelect._refId;
                $scope.specApi.keepMode();
                $scope.specInfo.id = elementToSelect.id;
                $scope.specInfo.projectId = elementToSelect._projectId;
                $scope.specInfo.refId = elementToSelect._refId;
                $scope.specInfo.commitId = 'latest';
                growl.error("Some elements failed to save, resolve individually in edit pane");

            }).finally(function() {
                toolbar.toggleButtonSpinner('element-editor-saveall');
                savingAll = false;
                cleanUpSaveAll();
                if (Object.keys($rootScope.ve_edits).length === 0) {
                    toolbar.setIcon('element-editor', 'fa-edit');
                }
            });
    });
    eventSvc.$on('element-editor-cancel', function() {
        var go = function() {
            var edit = $scope.specApi.getEdits();
            delete $rootScope.ve_edits[edit.id + '|' + edit._projectId + '|' + edit._refId];
            $scope.specApi.revertEdits();
            if (Object.keys($rootScope.ve_edits).length > 0) {
                var next = Object.keys($rootScope.ve_edits)[0];
                var id = next.split('|');
                $scope.tracker.etrackerSelected = next;
                $scope.specApi.keepMode();
                $scope.specInfo.id = id[0];
                $scope.specInfo.projectId = id[1];
                $scope.specInfo.refId = id[2];
                $scope.specInfo.commitId = 'latest';
            } else {
                $scope.specApi.setEditing(false);
                toolbar.select('element-viewer');
                toolbar.setIcon('element-editor', 'fa-edit');
                cleanUpSaveAll();
            }
        };
        if ($scope.specApi.hasEdits()) {
            var instance = $uibModal.open({
                templateUrl: 'partials/mms/cancelConfirm.html',
                scope: $scope,
                controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
                    $scope.ok = function() {
                        var edit = $scope.specApi.getEdits();
                        Utils.clearAutosaveContent(edit._projectId + edit._refId + edit.id, edit.type);

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
    });
    var viewSaving = false;
    eventSvc.$on('view-reorder-save', function() {
        if (viewSaving) {
            growl.info('Please Wait...');
            return;
        }
        viewSaving = true;
        toolbar.toggleButtonSpinner('view-reorder-save');
        $scope.viewContentsOrderApi.save().then(function(data) {
            viewSaving = false;
            $scope.viewContentsOrderApi.refresh();
            growl.success('Save Succesful');
            toolbar.toggleButtonSpinner('view-reorder-save');
            $rootScope.$broadcast('view.reorder.saved', $scope.viewOb.id);
        }, function(response) {
            $scope.viewContentsOrderApi.refresh();
            viewSaving = false;
            var reason = response.failedRequests[0];
            growl.error(reason.message);
            toolbar.toggleButtonSpinner('view-reorder-save');
        });
        toolbar.select('view-reorder');
    });
    eventSvc.$on('view-reorder-cancel', function() {
        $scope.specApi.setEditing(false);
        $scope.viewContentsOrderApi.refresh();
        toolbar.select('element-viewer');
        showPane('element');
    });
}]);
