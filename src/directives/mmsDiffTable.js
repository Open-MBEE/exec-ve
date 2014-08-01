'use strict';

angular.module('mms.directives')
.directive('mmsDiffTable', ['$templateCache', '$rootScope', 'DiffService', mmsDiffTable]);

function mmsDiffTable($templateCache, $rootScope, DiffService) {
  
  var MMSDiffTableLink = function(scope, element, attrs) {
    // Diff the two workspaces picked in the Workspace Picker
    var response = DiffService.diff('ws1', 'ws2');
    var originals = response.workspace1.elements;
    var deltas = response.workspace2;

    // Initializations
    $rootScope.tableElement = null;
    scope.original = {};
    scope.delta = {};

    scope.ownerDiff = [];
    // Watch for user selections in the containment tree
    $rootScope.$watch('tableElement', function() {
      if ($rootScope.tableElement !== null) {
        scope.original.name = $rootScope.tableElement.name;
        scope.original.owner = $rootScope.tableElement.owner;
        scope.original.documentation = $rootScope.tableElement.documentation;
        scope.original.specialization = $rootScope.tableElement.specialization;
        scope.original.specialization.value = $rootScope.tableElement.specialization.value;
        
        scope.delta.name = scope.original.name;
        scope.delta.owner = scope.original.owner;
        scope.delta.documentation = scope.original.documentation;
        scope.delta.specialization = scope.original.specialization;
        scope.delta.specialization.value = scope.original.specialization.value;

        if($rootScope.mergeConflict){
          for(var conflictKey in $rootScope.conflictElement){
            if(scope.delta.hasOwnProperty(conflictKey)){
              scope.delta[conflictKey] = $rootScope.conflictElement[conflictKey];
            }
          }
        }

        if($rootScope.elementMoved){
          for(var movedKey in $rootScope.movedElement){
            if(scope.delta.hasOwnProperty(movedKey)){
              scope.delta[movedKey] = $rootScope.movedElement[movedKey];
            } 
          }
        }

        if($rootScope.elementUpdated){
          for(var updateKey in $rootScope.updatedElement){
            if(scope.delta.hasOwnProperty(updateKey)){
              scope.delta[updateKey] = $rootScope.updatedElement[updateKey];
            }
          }
        }

        if($rootScope.elementAdded){
          for(var addKey in $rootScope.updatedElement){
            if(scope.delta.hasOwnProperty(addKey)){
              scope.delta[addKey] = $rootScope.addedElement[addKey];
            }
          }
          scope.original.name = null;
          scope.original.owner = null;
          scope.original.documentation = null;
          scope.original.specialization = null;
        }

        if($rootScope.elementDeleted){
          scope.delta.name = null;
          scope.delta.owner = null;
          scope.delta.documentation = null;
          scope.delta.specialization = null;
        }

      }
    });

    scope.differenceTypes = [];
    scope.nameDiff = [];
    // scope.ownerDiff = [];

    // generateDifferenceTypes(scope, deltas);
  };

  var generateDifferenceTypes = function(scope, deltas) {
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
  };

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

  var MMSDiffTableTemplate = $templateCache.get('mms/templates/mmsDiffTable.html');

  return {
    restrict: 'E',
    template: MMSDiffTableTemplate,
    link: MMSDiffTableLink
  };
}