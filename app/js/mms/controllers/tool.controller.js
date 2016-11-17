'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('ToolCtrl', ['$scope', '$rootScope', '$state', '$uibModal', '$q', '$stateParams', '$timeout',
            'ConfigService', 'ElementService', 'WorkspaceService', 'growl', 
            'workspaceObj', 'tags', 'tag', 'site', 'document', 'commit', 'Utils', 'hotkeys',
function($scope, $rootScope, $state, $uibModal, $q, $stateParams, $timeout, ConfigService, ElementService, WorkspaceService, growl, workspaceObj, tags, tag, site, document, commit, Utils, hotkeys) {

    // TODO rename variable ws
    var ws = $stateParams.workspace;
    $scope.specWs = ws;
    $scope.specVersion = commit;
    $scope.document = document;
    $scope.ws = ws;
    $scope.editable = document && document._editable && commit === 'latest';
    $scope.tags = tags;
    $scope.site = site;
    $scope.version = commit;

    if (document)
        $scope.eid = $scope.document.sysmlId;
    else
        $scope.eid = null;

    $scope.vid = $scope.eid;
    if($scope.document)
        $scope.docId = $scope.document.sysmlId;
    $scope.specApi = {};
    $scope.viewApi = {};
    $scope.viewOrderApi = {};
    $rootScope.mms_togglePane = $scope.$pane;

    $scope.show = {
        element: true,
        history: false,
        reorder: false,
        snapshots: false,
        tags: false,
        jobs: false
    };
    $scope.tracker = {};
    if (!$rootScope.veEdits)
        $rootScope.veEdits = {};
    $scope.presentElemEditCnts = {};

    // TODO: for editing of workspace/tag elements
    if ($state.current.name === 'workspace') {
        if (tag.name !== 'latest') {
            $scope.document = tag;
            $scope.eid = tag.id;
        }
        else {
            $scope.document = workspaceObj;
            $scope.eid = workspaceObj.id;            
        }
    }

    // Set edit count for tracker view 
    $scope.veEditsLength = function() {
        return Object.keys($rootScope.veEdits).length;
    };

    $scope.snapshotClicked = function() {
        $scope.snapshotLoading = 'fa fa-spinner fa-spin';
    };

    $scope.etrackerChange = function() {
        $scope.specApi.keepMode();
        var id = $scope.tracker.etrackerSelected;
        if (!id)
            return;
        var info = id.split('|');
        if (info[0] === 'element') {
            $scope.eid = info[1];
            $scope.elementType = 'element';
            $scope.specWs = info[2];
            $scope.specVersion = 'latest';
        } else if (info[0] === 'workspace') {
            $scope.eid = info[1];
            $scope.elementType = 'workspace';
            $scope.specWs = info[1];
            $scope.specVersion = 'latest';
        } else if (info[0] === 'tag') {
            $scope.eid = info[1];
            $scope.elementType = 'tag';
            $scope.specWs = info[2];
            $scope.specVersion = 'latest';
        }
        $rootScope.mms_tbApi.setPermission('element-editor', true);
    };

    $scope.showTracker = function() {
        /*if (time !== 'latest')
            return false;*/
        return true;
        /* if (Object.keys($rootScope.veEdits).length > 1 && $scope.specApi.getEditing())
            return true;
        return false; */
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
        if ($scope.veEditsLength() > 0) {
            $rootScope.mms_tbApi.setPermission('element-editor-saveall', true);
            $rootScope.mms_tbApi.setIcon('element-editor', 'fa-edit-asterisk');
        } else {
            $rootScope.mms_tbApi.setPermission('element-editor-saveall', false);
            $rootScope.mms_tbApi.setIcon('element-editor', 'fa-edit');
        }
    };

    $scope.$on('document-snapshot', function() {
        showPane('snapshots');
    });

    $scope.$on('tags', function() {
        showPane('tags');
    });

    $scope.$on('jobs', function() {
        showPane('jobs');
    });

    $scope.$on('element-history', function() {
        showPane('history');
    });

    var cleanUpEdit = function(scope) {
        var ws = scope.ws;
        var edit = scope.edit;
        var key = 'element|' + edit.sysmlId + '|' + ws;
        var currentCnt = 0;

        if ($scope.presentElemEditCnts.hasOwnProperty(key)) {
            currentCnt = $scope.presentElemEditCnts[key];
        }
        if (currentCnt <= 1 && !Utils.hasEdits(scope,null,true)) {
            delete $rootScope.veEdits[key];
            delete $scope.presentElemEditCnts[key];
            cleanUpSaveAll();
        }
        else {
            $scope.presentElemEditCnts[key] = currentCnt - 1;
        }
    };

    $scope.$on('presentationElem.edit', function(event, scope) {
        var ws = scope.ws;
        var edit = scope.edit;
        var key = 'element|' + edit.sysmlId + '|' + ws;
        var currentCnt = 1;
        $rootScope.veEdits[key] = edit;
        if ($scope.presentElemEditCnts.hasOwnProperty(key)) {
            currentCnt = $scope.presentElemEditCnts[key] + 1;
        }
        $scope.presentElemEditCnts[key] = currentCnt;
        cleanUpSaveAll();
    });

    $scope.$on('presentationElem.save', function(event, scope) {
        cleanUpEdit(scope);
    });

    $scope.$on('presentationElem.cancel', function(event, scope) {
        cleanUpEdit(scope);           
    });

    $scope.$on('elementSelected', function(event, eid, type, ws, version) {
        $scope.elementType = type;
        $scope.eid = eid;
        $rootScope.mms_tbApi.select('element-viewer');
        if ($rootScope.togglePane && $rootScope.togglePane.closed)
            $rootScope.togglePane.toggle();

        showPane('element');
        if ($scope.specApi.setEditing)
            $scope.specApi.setEditing(false);
        if (type !== 'element') {
            if (type === 'workspace' && eid === 'master')
                $rootScope.mms_tbApi.setPermission('element-editor', false);
            else
                $rootScope.mms_tbApi.setPermission('element-editor', true);
        }
        if (type === 'element') {
            $scope.specWs = ws;
            $scope.specVersion = version;
            ElementService.getElement(eid, false, ws, version, 2).
            then(function(element) {
                var editable = element._editable && version === 'latest';
                $rootScope.mms_tbApi.setPermission('element-editor', editable);
                $rootScope.mms_tbApi.setPermission("document-snapshot-create", editable);
            });
        } else {
            $scope.specWs = $scope.ws;
            $scope.specVersion = $scope.version;
        }
    });
    $scope.$on('element-viewer', function() {
        $scope.specApi.setEditing(false);
        cleanUpSaveAll();
        showPane('element');
    });
    $scope.$on('element-editor', function() {
        $scope.specApi.setEditing(true);
        showPane('element');
        var edit = $scope.specApi.getEdits();
        if (edit) {
            $scope.tracker.etrackerSelected = $scope.elementType + '|' + (edit.sysmlId || edit.id) + '|' + $scope.specWs;
            $rootScope.veEdits[$scope.elementType + '|' + (edit.sysmlId || edit.id) + '|' + $scope.specWs] = edit;
            cleanUpSaveAll();
        }
        if ($scope.elementType !== 'element')
            return;
        ElementService.isCacheOutdated($scope.eid, $scope.specWs)
        .then(function(data) {
            if (data.status && data.server._modified > data.cache._modified)
                growl.error('This element has been updated on the server. Please refresh the page to get the latest version.');
        });
    });
    $scope.$on('viewSelected', function(event, vid, viewElements) {
        $scope.eid = vid;
        $scope.vid = vid;
        $scope.viewElements = viewElements;
        $scope.elementType = 'element';
        $scope.specWs = ws;
        $scope.specVersion = commit;
        $rootScope.mms_tbApi.select('element-viewer');
        showPane('element');
        ElementService.getElement(vid, false, ws, commit, 2).
        then(function(element) {
            var editable = element._editable && commit === 'latest';
            $rootScope.mms_tbApi.setPermission('element-editor', editable);
            $rootScope.mms_tbApi.setPermission('view-reorder', editable);
            $rootScope.mms_tbApi.setPermission("document-snapshot-create", editable);
        });
        $scope.specApi.setEditing(false);
    });

    $scope.$on('view-reorder.refresh', function() {
        $scope.viewOrderApi.refresh();
    });

    $scope.$on('view-reorder', function() {
        $scope.viewOrderApi.setEditing(true);
        showPane('reorder');
    });
    
    var elementSaving = false;
    $scope.$on('element-editor-save', function() {
        save(false);
    });
    $scope.$on('element-editor-saveC', function() {
        save(true);
    });
    var save = function(continueEdit) {
        if (elementSaving) {
            growl.info('Please Wait...');
            return;
        }
        elementSaving = true;
        if (!continueEdit)
            $rootScope.mms_tbApi.toggleButtonSpinner('element-editor-save');
        else
            $rootScope.mms_tbApi.toggleButtonSpinner('element-editor-saveC');
        $timeout(function() {
        $scope.specApi.save().then(function(data) {
            elementSaving = false;
            growl.success('Save Successful');
            if (continueEdit) 
                return;
            var edit = $scope.specApi.getEdits();
            delete $rootScope.veEdits[$scope.elementType + '|' + (edit.sysmlId || edit.id ) + '|' + $scope.specWs];
            if (Object.keys($rootScope.veEdits).length > 0) {
                var next = Object.keys($rootScope.veEdits)[0];
                var id = next.split('|');
                $scope.tracker.etrackerSelected = next;
                $scope.specApi.keepMode();
                $scope.eid = id[1];
                $scope.specWs = id[2];
                $scope.elementType = id[0];
            } else {
                $scope.specApi.setEditing(false);
                $rootScope.mms_tbApi.select('element-viewer');
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
                $rootScope.mms_tbApi.toggleButtonSpinner('element-editor-save');
            else
                $rootScope.mms_tbApi.toggleButtonSpinner('element-editor-saveC');
        });
        }, 1000, false);
        $rootScope.mms_tbApi.select('element-editor');
    };

    hotkeys.bindTo($scope)
    .add({
        combo: 'alt+a',
        description: 'save all',
        callback: function() {$scope.$broadcast('element-editor-saveall');}
    });
    var savingAll = false;
    $scope.$on('element-editor-saveall', function() {
        if (savingAll) {
            growl.info('Please wait...');
            return;
        }
        if (Object.keys($rootScope.veEdits).length === 0) {
            growl.info('Nothing to save');
            return;
        }
        if ($scope.specApi && $scope.specApi.editorSave)
            $scope.specApi.editorSave();
        savingAll = true;
        $rootScope.mms_tbApi.toggleButtonSpinner('element-editor-saveall');
        var promises = [];
        angular.forEach($rootScope.veEdits, function(value, key) {
            var defer = $q.defer();
            promises.push(defer.promise);
            var keys = key.split('|');
            var elementWs = keys[2];
            var elementType = keys[0];
            if (elementType === 'element') {
                ElementService.updateElement(value, elementWs)
                .then(function(e) {
                    defer.resolve({status: 200, id: e.sysmlId, type: elementType, ws: elementWs});
                }, function(reason) {
                    defer.resolve({status: reason.status, id: value.sysmlId});
                });
            } else if (elementType === 'tag') {
                ConfigService.update(value, elementWs)
                .then(function(e) {
                    defer.resolve({status: 200, id: e.id, type: elementType, ws: elementWs});
                }, function(reason) {
                    defer.resolve({status: reason.status, id: value.id});
                });
            } else if (elementType === 'workspace') {
                WorkspaceService.update(value)
                .then(function(e) {
                    defer.resolve({status: 200, id: e.id, type: elementType, ws: elementWs});
                }, function(reason) {
                    defer.resolve({status: reason.status, id: value.id});
                });
            }
        });
        $q.all(promises).then(function(results) {
            var somefail = false;
            var failedId = null;
            var failedType = 'element';
            var failedWs = 'master';
            results.forEach(function(ob) {
                if (ob.status === 200) {
                    delete $rootScope.veEdits[ob.type + '|' + ob.id + '|' + ob.ws];
                    if (ob.type === 'element')
                        $rootScope.$broadcast('element.updated', ob.id, ob.ws, 'all');
                } else {
                    somefail = true;
                    failedId = ob.id;
                    failedType = ob.type;
                    failedWs = ob.ws;
                }
            });
            if (!somefail) {
                growl.success("Save All Successful");
                $rootScope.mms_tbApi.select('element-viewer');
                $scope.specApi.setEditing(false);
            } else {
                $scope.tracker.etrackerSelected = failedType + '|' + failedId + '|' + failedWs;
                $scope.specApi.keepMode();
                $scope.eid = failedId;
                $scope.specWs = failedWs;
                $scope.specVersion = 'latest';
                $scope.elementType = failedType;
                growl.error("Some elements failed to save, resolve individually in edit pane");
            }
            $rootScope.mms_tbApi.toggleButtonSpinner('element-editor-saveall');
            savingAll = false;
            cleanUpSaveAll();

            if (Object.keys($rootScope.veEdits).length === 0) {
                $rootScope.mms_tbApi.setIcon('element-editor', 'fa-edit');
            }
        });
    });
    $scope.$on('element-editor-cancel', function() {
        var go = function() {
            var edit = $scope.specApi.getEdits();
            delete $rootScope.veEdits[$scope.elementType + '|' + (edit.sysmlId || edit.id) + '|' + $scope.specWs];
            $scope.specApi.revertEdits();
            if (Object.keys($rootScope.veEdits).length > 0) {
                var next = Object.keys($rootScope.veEdits)[0];
                var id = next.split('|');
                $scope.tracker.etrackerSelected = next;
                $scope.specApi.keepMode();
                $scope.eid = id[1];
                $scope.specWs = id[2];
                $scope.specVersion = 'latest';
                $scope.elementType = id[0];
            } else {
                $scope.specApi.setEditing(false);
                $rootScope.mms_tbApi.select('element-viewer');
                $rootScope.mms_tbApi.setIcon('element-editor', 'fa-edit');
                cleanUpSaveAll();
            }
        };
        if ($scope.specApi.hasEdits()) {
            var instance = $uibModal.open({
                templateUrl: 'partials/mms/cancelConfirm.html',
                scope: $scope,
                controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
                    $scope.ok = function() {
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
    $scope.$on('view-reorder-save', function() {
        if (viewSaving) {
            growl.info('Please Wait...');
            return;
        }
        viewSaving = true;
        $rootScope.mms_tbApi.toggleButtonSpinner('view-reorder-save');
        $scope.viewOrderApi.save().then(function(data) {
            viewSaving = false;
            $scope.viewOrderApi.refresh();
            growl.success('Save Succesful');
            $rootScope.mms_tbApi.toggleButtonSpinner('view-reorder-save');
            $rootScope.$broadcast('view.reorder.saved', $scope.vid);
        }, function(reason) {
            $scope.viewOrderApi.refresh();
            viewSaving = false;
            if (reason.type === 'info')
                growl.info(reason.message);
            else if (reason.type === 'warning')
                growl.warning(reason.message);
            else if (reason.type === 'error')
                growl.error(reason.message);
            $rootScope.mms_tbApi.toggleButtonSpinner('view-reorder-save');
        });
        $rootScope.mms_tbApi.select('view-reorder');
    });
    $scope.$on('view-reorder-cancel', function() {
        $scope.specApi.setEditing(false);
        $scope.viewOrderApi.refresh();
        $rootScope.mms_tbApi.select('element-viewer');
        showPane('element');
    });
}]);