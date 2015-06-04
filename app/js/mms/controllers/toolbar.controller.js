'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('ToolbarCtrl', ['$scope', '$rootScope', '$state', '$timeout', 'UxService', 'workspace', 'tag', 'document', 'time',
function($scope, $rootScope, $state, $timeout, UxService, workspace, tag, document, time) {   

    $scope.tbApi = {};
    $scope.buttons = [];
    $scope.togglePane = {};

    // TODO: Manage rootScope in controllers, for now set/get in one area of the code
    // Set MMS $rootScope variables
    $rootScope.mms_tbApi = $scope.tbApi;

    // Get MMS $rootScope variables
    $scope.togglePane = $rootScope.mms_togglePane;

    $scope.tbApi.init = function() {

      $scope.tbApi.addButton(UxService.getToolbarButton("element.viewer"));
      $scope.tbApi.addButton(UxService.getToolbarButton("element.editor"));
      if ($rootScope.veEdits && Object.keys($rootScope.veEdits).length > 0) {
          $scope.tbApi.setIcon('element.editor', 'fa-edit-asterisk');
          $scope.tbApi.setPermission('element.editor.saveall', true);
      } 

      var editable = false;
      if ($state.includes('workspaces') && !$state.includes('workspace.sites')) {
          if (workspace === 'master' && tag.timestamp === 'latest')  // do not allow edit of master workspace
            editable = false;
          else
            editable = true;          
          $scope.tbApi.setPermission('element.editor', editable);
      } else if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document')) {
          editable = document && time === 'latest';
          $scope.tbApi.setPermission('element.editor', editable);
          $scope.tbApi.addButton(UxService.getToolbarButton("tags"));
          $scope.tbApi.setPermission('tags', true);
      } else if ($state.includes('workspace.site.document')) {
          editable = document.editable && time === 'latest';
          $scope.tbApi.addButton(UxService.getToolbarButton("view.reorder"));
          $scope.tbApi.addButton(UxService.getToolbarButton("document.snapshot"));
          $scope.tbApi.setPermission('element.editor',editable);
          // $scope.tbApi.setPermission('document.snapshot.refresh',editable);
          $scope.tbApi.setPermission('document.snapshot.create',editable);
          $scope.tbApi.setPermission("view.reorder", editable); 
      } else if ($state.includes('workspace.diff')) {
          $scope.tbApi.setPermission('element.editor', false);
      }
    };
}]);