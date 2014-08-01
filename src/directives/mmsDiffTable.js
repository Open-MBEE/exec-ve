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

        if ($rootScope.conflict) {
          for (var conflictKey in $rootScope.conflictElement) {
            if (scope.delta.hasOwnProperty(conflictKey)) {
              scope.delta[conflictKey] = $rootScope.conflictElement[conflictKey];
            }
          }
        }

        if ($rootScope.elementMoved) {
          for (var movedKey in $rootScope.movedElement) {
            if (scope.delta.hasOwnProperty(movedKey)) {
              scope.delta[movedKey] = $rootScope.movedElement[movedKey];
            } 
          }
        }

        if ($rootScope.elementUpdated) {
          for (var updateKey in $rootScope.updatedElement) {
            if (scope.delta.hasOwnProperty(updateKey)) {
              scope.delta[updateKey] = $rootScope.updatedElement[updateKey];
            }
          }
        }

        if ($rootScope.elementAdded) {
          for (var addKey in $rootScope.updatedElement) {
            if (scope.delta.hasOwnProperty(addKey)) {
              scope.delta[addKey] = $rootScope.addedElement[addKey];
            }
          }
          scope.original.name = null;
          scope.original.owner = null;
          scope.original.documentation = null;
          scope.original.specialization = null;
        }

        if ($rootScope.elementDeleted){
          scope.delta.name = null;
          scope.delta.owner = null;
          scope.delta.documentation = null;
          scope.delta.specialization = null;
        }

        scope.nameAddition = (scope.original.name !== scope.delta.name) && (scope.original.name === null || scope.original.name === '');
        scope.nameRemoval = (scope.original.name !== null && scope.original.name !== '') && (scope.delta.name === null || scope.delta.name === '');
        scope.nameUpdate = scope.original.name !== scope.delta.name && (scope.original.name !== null && scope.original.name !== '') && (scope.delta.name !== null && scope.delta.name !== '');
        scope.nameClean = scope.original.name === null && scope.delta.name === null;

        scope.ownerAddition = scope.original.owner !== scope.delta.owner && (scope.original.owner === null || scope.original.owner === '');
        scope.ownerRemoval = (scope.original.owner !== null && scope.original.owner !== '') && (scope.delta.owner === null || scope.delta.owner === '');
        scope.ownerUpdate = scope.original.owner !== scope.delta.owner && (scope.original.owner !== null && scope.original.owner !== '') && (scope.delta.owner !== null && scope.delta.owner !== '');
        scope.ownerClean = scope.original.owner === null && scope.delta.owner === null;

        scope.docAddition = scope.original.documentation !== scope.delta.documentation && (scope.original.documentation === null || scope.original.documentation === '');
        scope.docRemoval = (scope.original.documentation !== null && scope.original.documentation !== '') && (scope.delta.documentation === null || scope.delta.documentation === '');
        scope.docUpdate = scope.original.documentation !== scope.delta.documentation && (scope.original.documentation !== null && scope.original.documentation !== '') && (scope.delta.documentation !== null && scope.delta.documentation !== '');
        scope.docClean = scope.original.documentation === null && scope.delta.documentation === null;

        scope.typeAddition = scope.original.specialization !== scope.delta.specialization && (scope.original.specialization === null || scope.original.specialization === '');
        scope.typeRemoval = (scope.original.specialization !== null && scope.original.specialization !== '') && (scope.delta.specialization === null || scope.delta.specialization === '');
        scope.typeUpdate = scope.original.specialization !== scope.delta.specialization && (scope.original.specialization !== null && scope.original.specialization !== '') && (scope.delta.specialization !== null && scope.delta.specialization !== '');
        scope.typeClean = scope.original.specialization === null && scope.delta.specialization === null;

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

  var MMSDiffTableTemplate = $templateCache.get('mms/templates/mmsDiffTable.html');

  return {
    restrict: 'E',
    template: MMSDiffTableTemplate,
    link: MMSDiffTableLink
  };
}