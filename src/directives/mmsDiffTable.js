'use strict';

angular.module('mms.directives')
.directive('mmsDiffTable', ['$templateCache', '$rootScope', 'DiffService', mmsDiffTable]);

function mmsDiffTable($templateCache, $rootScope, DiffService) {

  var MMSDiffTableTemplate = $templateCache.get('mms/templates/mmsDiffTable.html');
  
  var MMSDiffTableLink = function(scope, element, attrs) {
    // Initializations
    scope.original = {};
    scope.delta = {};
    scope.ownerDiff = [];
    scope.differenceTypes = [];

    // Watch for user selections in the containment tree
    $rootScope.$watch('tableElement', function() {
      if (($rootScope.tableElement === null) || ($rootScope.tableElement === undefined)) {
        return;
      }

      // Load the table
      loadTableDeltaAndOriginal(scope);
      loadTableHighlighting(scope);
      loadTableHeading(scope);
    });
  };

  /*
   * Sets delta and original so the table can display values
   */
  var loadTableDeltaAndOriginal = function(scope) {
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

    if ($rootScope.elementDeleted) {
      scope.delta.name = null;
      scope.delta.owner = null;
      scope.delta.documentation = null;
      scope.delta.specialization = null;
    }
  };

  /*
   * Sets up CSS class truth values for table highlighting
   */
  var loadTableHighlighting = function(scope) {
    var namesAreDifferent = scope.original.name !== scope.delta.name;
    var originalNameIsNull = scope.original.name === null;
    var originalNameIsEmpty = scope.original.name === '';
    var deltaNameIsNull = scope.delta.name === null;
    var deltaNameIsEmpty = scope.delta.name === '';

    var ownersAreDifferent = scope.original.owner !== scope.delta.owner;
    var originalOwnerIsNull = scope.original.owner === null;
    var originalOwnerIsEmpty = scope.original.owner === '';
    var deltaOwnerIsNull = scope.delta.owner === null;
    var deltaOwnerIsEmpty = scope.delta.owner === '';

    var docsAreDifferent = scope.original.documentation !== scope.delta.documentation;
    var originalDocIsNull = scope.original.documentation === null;
    var originalDocIsEmpty = scope.original.documentation === '';
    var deltaDocIsNull = scope.delta.documentation === null;
    var deltaDocIsEmpty = scope.delta.documentation === '';

    var typesAreDifferent = scope.original.specialization !== scope.delta.specialization;
    var originalTypeIsNull = scope.original.specialization === null;
    var originalTypeIsEmpty = scope.original.specialization === '';
    var deltaTypeIsNull = scope.delta.specialization === null;
    var deltaTypeIsEmpty = scope.delta.specialization === '';

    scope.nameAddition = namesAreDifferent && 
                         (originalNameIsNull || originalNameIsEmpty);
    scope.nameRemoval = (!originalNameIsNull && !originalNameIsEmpty) && 
                        (deltaNameIsNull || deltaNameIsEmpty);
    scope.nameUpdate = scope.original.name !== scope.delta.name && 
                       (!originalNameIsNull && !originalNameIsEmpty) &&
                       (!deltaNameIsNull && !deltaNameIsEmpty);
    scope.nameClean = originalNameIsNull && deltaNameIsNull;


    scope.ownerAddition = ownersAreDifferent && 
                          (originalOwnerIsNull || originalOwnerIsEmpty);
    scope.ownerRemoval = (!originalOwnerIsNull && !originalOwnerIsEmpty) && 
                         (deltaOwnerIsNull || deltaOwnerIsEmpty);
    scope.ownerUpdate = scope.original.owner !== scope.delta.owner && 
                        (!originalOwnerIsNull && !originalOwnerIsEmpty) &&
                        (!deltaOwnerIsNull && !deltaOwnerIsEmpty);
    scope.ownerClean = originalOwnerIsNull && deltaOwnerIsNull;


    scope.docAddition = docsAreDifferent && 
                        (originalDocIsNull || originalDocIsEmpty);
    scope.docRemoval = (!originalDocIsNull && !originalDocIsEmpty) && 
                       (deltaDocIsNull || deltaDocIsEmpty);
    scope.docUpdate = (scope.original.documentation !== scope.delta.documentation) && 
                      (!originalDocIsNull && !originalDocIsEmpty) &&
                      (deltaDocIsNull && deltaDocIsEmpty);
    scope.docClean = originalDocIsNull && deltaDocIsNull;


    scope.typeAddition = typesAreDifferent && 
                         (originalTypeIsNull || originalTypeIsEmpty);
    scope.typeRemoval = (!originalTypeIsNull && !originalTypeIsEmpty) && 
                        (deltaTypeIsNull || deltaTypeIsEmpty);
    scope.typeUpdate = (scope.original.specialization !== scope.delta.specialization) &&
                       (!originalTypeIsNull && !originalTypeIsEmpty) &&
                       (deltaTypeIsNull && deltaTypeIsEmpty);
    scope.typeClean = originalTypeIsNull && deltaTypeIsNull;
  };

  /*
   * Evaluates the type(s) of difference(s) in the table and provides them ot the scope
   */
  var loadTableHeading = function(scope) {
    if (scope.nameAddition || scope.ownerAddition || scope.docAddition || scope.typeAddition) {
      scope.differenceTypes.push('Addition');
    }
    
    if (scope.nameRemoval || scope.ownerRemoval || scope.docRemoval || scope.typeRemoval) {
      scope.differenceTypes.push('Deletion');
    }

    if (scope.nameUpdate || scope.ownerUpdate || scope.docUpdate || scope.typeUpdate) {
      scope.differenceTypes.push('Update');
    }
  };

  return {
    restrict: 'E',
    template: MMSDiffTableTemplate,
    link: MMSDiffTableLink
  };
}