'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('ToolbarCtrl', ['$scope', '$state', 'UxService', 'refOb', 'documentOb', 'PermissionsService',
    'EditService', 'EventService', 'ToolbarService',
function($scope, $state, UxService, refOb, documentOb, PermissionsService, EditService, EventService, ToolbarService) {

    let edit = EditService;

    let eventSvc = EventService;
    eventSvc.$init($scope);

    let toolbar = ToolbarService;
    $scope.buttons = [];



    const tbInit = function()
    {
        let tbApi = $scope.tbApi;
        tbApi.addButton(UxService.getToolbarButton("element-viewer"));
        tbApi.addButton(UxService.getToolbarButton("element-editor"));
        if (edit.openEdits() > 0) {
            tbApi.setIcon('element-editor', 'fa-edit-asterisk');
            tbApi.setPermission('element-editor-saveall', true);
        }
        var editable = false;
        tbApi.addButton(UxService.getToolbarButton("element-history"));
        tbApi.addButton(UxService.getToolbarButton("tags"));
        if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
            editable = refOb.type === 'Branch' && PermissionsService.hasBranchEditPermission(refOb);
            tbApi.setPermission('element-editor', editable);
            if ($state.includes('project.ref.preview')) {
                tbApi.addButton(UxService.getToolbarButton("view-reorder"));
                tbApi.setPermission("view-reorder", editable);
            }
        } else if ($state.includes('project.ref.document')) {
            editable = refOb.type === 'Branch' && PermissionsService.hasBranchEditPermission(refOb);
            tbApi.addButton(UxService.getToolbarButton("view-reorder"));
            tbApi.setPermission('element-editor', editable);
            tbApi.setPermission("view-reorder", editable);
        }
    };

    $scope.tbApi = ToolbarService.getApi($scope.buttons, tbInit);

   $scope.subs.push(eventSvc.$on(toolbar.constants.SETPERMISSION, (data) => {
        $scope.tbApi.setPermission(data.id,data.value);
    }));

   $scope.subs.push(eventSvc.$on(toolbar.constants.SETICON, (data) => {
        $scope.tbApi.setIcon(data.id,data.value);
    }));

   $scope.subs.push(eventSvc.$on(toolbar.constants.TOGGLEICONSPINNER, (data) => {
        $scope.tbApi.toggleButtonSpinner(data.id);
    }));

   $scope.subs.push(eventSvc.$on(toolbar.constants.SELECT, (data) => {
        $scope.tbApi.select(data.id);
    }));

}]);