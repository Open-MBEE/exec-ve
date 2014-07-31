'use strict';

angular.module('mms.directives.diff')
.directive('mmsDiffTable', ['$templateCache', 'DiffService', mmsDiffTable]);

function mmsDiffTable($templateCache, DiffService) {
  
  var MMSDiffTableController = function($scope, $rootScope) {
    // Diff the two workspaces picked in the Workspace Picker
    var response = DiffService.diff('ws1', 'ws2');
    var originals = response.workspace1.elements;
    var deltas = response.workspace2;

    // Initializations
    $rootScope.tableElement = null;
    $scope.original = {};
    $scope.delta = {};

    // Watch for user selections in the containment tree
    $rootScope.$watch('tableElement', function() {
      if ($rootScope.tableElement !== null) {
        $scope.original.name = $rootScope.tableElement.name;
        $scope.original.owner = $rootScope.tableElement.owner;

        // TODO - set $scope.delta with proper values
      }
    });

    $scope.differenceTypes = [];
    $scope.nameDiff = [];
    $scope.ownerDiff = [];

    this.generateDifferenceTypes($scope, deltas);
  };

  MMSDiffTableController.prototype = {
    generateDifferenceTypes: function(scope, deltas) {
      if (deltas.updatedElements.length > 0) {
        scope.differenceTypes.push('Update');
      }

      if (deltas.addedElements.length > 0) {
        scope.differenceTypes.push('Addition');
      }

      if (deltas.deletedElements.length > 0) {
        scope.differenceTypes.push('Deletion');
      }

      if (deltas.movedElements.length > 0) {
        scope.differenceTypes.push('Move');
      }

      if (deltas.conflicts.length > 0) {
        scope.differenceTypes.push('Conflict');
      }
    },

    /*
     * Fills scope booleans for two elements.
     *
     * scope.*Diff[0] is True, if element is in clean state. False, otherwise.
     * scope.*Diff[1] is True, if element is in addition state. False, otherwise.
     * scope.*Diff[2] is True, if element is in removal state. False, otherwise.
     * scope.*Diff[3] is True, if element is in conflict state. False, otherwise.
     */
    /* TODO
    generateTableClasses: function(original, delta) {
      this.scope.nameDiff[0] = (this.scope.name[0] === this.scope.name[1]);
      this.scope.nameDiff[1] = (this.scope.name[0] === '') && (this.scope.name[1].length > 0);
      this.scope.nameDiff[2] = (this.scope.name[1] === '') && (this.scope.name[0].length > 0);
      this.scope.nameDiff[3] = false;

      this.scope.ownerDiff[0] = (this.scope.owner[0] === this.scope.owner[1]);
      this.scope.ownerDiff[1] = (this.scope.owner[0] === '') && (this.scope.owner[1].length > 0);
      this.scope.ownerDiff[2] = (this.scope.owner[1] === '') && (this.scope.owner[0].length > 0);
      this.scope.ownerDiff[3] = false;
    }
    */
  };

  var MMSDiffTableTemplate = $templateCache.get('mms/templates/mmsDiffTable.html');

  return {
    restrict: 'E',
    template: MMSDiffTableTemplate,
    controller: ['$scope', '$rootScope', 'DiffService' , MMSDiffTableController]
  };
}