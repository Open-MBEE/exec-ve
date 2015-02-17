'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('ToolbarCtrl', ['$scope', '$rootScope', '$timeout', 'UxService',
function($scope, $rootScope, $timeout, UxService) {   

    $scope.tbApi = {};
    $scope.buttons = [];
    $scope.togglePane = {};

    // TODO: Manage rootScope in controllers, for now set/get in one area of the code
    // Set MMS $rootScope variables
    $rootScope.mms_tbApi = $scope.tbApi;

    // Get MMS $rootScope variables
    $scope.togglePane = $rootScope.mms_togglePane;


    // TODO: convert to callback rather than timeout
    $timeout(function() {

      $scope.tbApi.addButton(UxService.getToolbarButton("element.viewer"));
      $scope.tbApi.addButton(UxService.getToolbarButton("element.editor"));

      // TODO: if state is View Editor only
      $scope.tbApi.addButton(UxService.getToolbarButton("view.reorder"));
      $scope.tbApi.addButton(UxService.getToolbarButton("document.snapshot"));

      // TODO: remove this button from UxService not needed anymore
      // $scope.tbApi.addButton(UxService.getToolbarButton("element.editor.mm"));

      $scope.tbApi.addButton(UxService.getToolbarButton("configurations"));

    }, 500);

    $scope.onClick = function(button) {
    };
}]);