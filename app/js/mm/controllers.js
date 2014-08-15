'use strict';

angular.module('mm')
.controller('DiffTreeController', ["$scope", "$rootScope", "$http", "$state", "$stateParams", "growl", "WorkspaceService",
function($scope, $rootScope, $http, $state, $stateParams, growl, WorkspaceService) {

    /*var originalElements = [];
    var deltaElements = [];
    var deltaArrays = null;
    var epsilonCache = []; */

    $scope.treeData = [];

    // Diff the two workspaces picked in the Workspace Picker
    WorkspaceService.diff('ws1', 'ws2').then(
     function(result) {
        
        setupModelTree(result.workspace1, result.workspace2);

        $scope.select_branch_id = function (sysmlid) {
          $state.go('main.diff.view', {elementId: sysmlid});
        };


        /* setUpMMSTree($scope);

           $scope.epsilon = [];

        // Sets an element (tableElement) for the table to load
        $scope.loadTableWithElement = function(sysmlid) {
          if ($rootScope.workspaces !== null) {
            $rootScope.tableElement = originalElements.filter(function(entry) {
                return entry && entry.sysmlid.indexOf(sysmlid) !== -1;
              })[0];

            if ($rootScope.tableElement === undefined) {
              $rootScope.tableElement = deltaArrays.addedElements.filter(function(entry) {
                return entry && entry.sysmlid.indexOf(sysmlid) !== -1;
              })[0];
            }

            deltaArrays.conflicts.forEach(function(elem) {
              if(elem.sysmlid === $rootScope.tableElement.sysmlid){
                 $rootScope.conflictElement = deltaArrays.conflicts;
                 $rootScope.conflict = true;
              } else {
                $rootScope.conflictElement = null;
                $rootScope.conflict = false;
              }
            });

            deltaArrays.movedElements.forEach(function(elem) {
              if(elem.sysmlid === $rootScope.tableElement.sysmlid) {
                $rootScope.movedElement = elem;
                $rootScope.elementMoved = true;
              } else {
                $rootScope.movedElement = null;
                $rootScope.elementMoved = false;
              }
            });

            deltaArrays.updatedElements.forEach(function(elem) {
              if(elem.sysmlid === $rootScope.tableElement.sysmlid) {
                $rootScope.updatedElement = elem;
                $rootScope.elementUpdated = true;
              } else {
                $rootScope.updatedElement = null;
                $rootScope.elementUpdated = false;
              }
            });

            deltaArrays.addedElements.forEach(function(elem) {
              if(elem.sysmlid === $rootScope.tableElement.sysmlid) {
                $rootScope.addedElement = elem;
                $rootScope.elementAdded = true;
              } else {
                $rootScope.addedElement = null;
                $rootScope.elementAdded = false;
              }
            });

            deltaArrays.deletedElements.forEach(function(elem) {
              if(elem.sysmlid === $rootScope.tableElement.sysmlid) {
                $rootScope.deletedElement = elem;
                $rootScope.elementDeleted = true;
              } else {
                $rootScope.deletedElement = null;
                $rootScope.elementDeleted = false;
              }
            });
          }
        };

        // Submits the user's changes to the server
        $scope.submitChanges = function() {
          console.log('Submitting epsilon to server...');
          console.log('Epsilon:');
          console.log($scope.epsilon);
        };

        // Returns the user to the workspace picker route
        $scope.goBack = function() {
          console.log('Cleaning up...');
          $scope.epsilon = [];
          console.log('Moving to previous route...');
        }; */



      },
      function(reason) {
        growl.error("Workspace diff failed: " + reason.message);
      }
    );   


      /*
       * Returns an array of the deltas, if any exist.
       * Returns [], otherwise.
       */
      /*var getDeltas = function() {
        if (deltaArrays !== null) {
          angular.forEach(deltaArrays, function(diffType, key) {
            diffType.forEach(function(elem) {
              deltaElements.push(elem);
            });
          });
          return deltaElements;
        } else {
          return [];
        }
      };*/

      /*
       * Preps mms-tree with data and display options.
       */
      var setupModelTree = function(ws1, ws2) {

        /*
         var stageChange = function(branch) {
          // Get the change ref'd by sysmlid in deltaElements
          var change = getDeltas().filter(function(entry) {
           return entry && entry.sysmlid.indexOf(branch.data.sysmlid) !== -1;
          })[0];

          epsilonCache.push({ 'sysmlid': branch.data.sysmlid, 'branch': angular.copy(branch) });

          // Push the element onto epsilon, the array we send to the server
          scope.epsilon.push(change);

          // Replace the button with an undo button to revert the change
          branch.status = 'undo';
        };

        var undoChange = function(branch) {
          var changeToUndo = scope.epsilon.filter(function(entry) {
            return entry && entry.sysmlid.indexOf(branch.data.sysmlid) !== -1;
          })[0];

          if (changeToUndo) {
            // Iterate over each entry in epsilon to find and splice the change to undo
            scope.epsilon.some(function(entry) {
              if (entry) {
                var index = scope.epsilon.indexOf(changeToUndo);
                if (index > -1) {
                  console.log('Removing ' + changeToUndo.sysmlid + ' at index' + index + '...');
                  scope.epsilon.splice(index, 1);
                  return true;
                }
              }
            });

            // Get the element's original status to reset the button
            branch.status = epsilonCache.filter(function(entry) {
              return entry && entry.sysmlid.indexOf(branch.data.sysmlid) !== -1;
            })[0].branch.status;
          }
        }; */

        var stageChange = function (branch) {
          branch.status = "undo";
          branch.merge_status = ! branch.merge_status;
        };

        var undoChange = function(branch) {
          branch.status = branch.change_type;
          branch.merge_status = ! branch.merge_status;
        };

        var id2node = {};
        
        $scope.treeData = [];
        
        $scope.options = {
          types: {
            'Element': 'fa fa-square',
            'Property': 'fa fa-circle',
            'View': 'fa fa-square',
            'Dependency': 'fa fa-long-arrow-right',
            'DirectedRelationship': 'fa fa-long-arrow-right',
            'Generalization': 'fa fa-chevron-right',
            'Package': 'fa fa-folder',
            'Connector': 'fa fa-expand'
          },
          statuses: {
            'moved': { style: "'update'", button: 'update' },
            'added': { style: "'addition'", button: 'add' },
            'removed': { style: "'removal'", button: 'remove' },
            'updated': { style: "'update'", button: 'update' },
            'conflict': "",
            'resolve': "",
            'undo': { style: "'undo'", button: 'undo' }
          },
          buttons: {
            "update": {
              style: "btn btn-primary btn-xs",
              action: function(branch) { stageChange(branch); } 
            },
            "remove": {
              style: "btn btn-danger btn-xs",
              action: function(branch) { stageChange(branch); } 
            },
            "add": {
              style: "btn btn-success btn-xs",
              action: function(branch) { stageChange(branch); } 
            },
            "undo": {
              style: "btn btn-danger btn-xs",
              action: function(branch) { undoChange(branch); } 
            }
          }
        };

        // Load up the tree with elements
        ws1.elements.forEach(function(e) {
          var node = {};
          node.data = e;
          node.label = e.name;
          node.type = e.specialization.type;
          node.children = [];

          id2node[e.sysmlid] = node;
        });

        ws1.elements.forEach(function(e) {
          if (!id2node.hasOwnProperty(e.owner))
              $scope.treeData.push(id2node[e.sysmlid]);
          else
              id2node[e.owner].children.push(id2node[e.sysmlid]);
       });

        ws2.addedElements.forEach(function(e) {
          var node = {};
          node.data = e;
          node.label = e.name;
          node.type = e.specialization.type;
          node.children = [];

          id2node[e.sysmlid] = node;
          
          if (e.hasOwnProperty('owner')) {
            id2node[e.owner].children.push(id2node[e.sysmlid]);
          } else {
              $scope.treeData.push(id2node[e.sysmlid]);
          }

          node.change_type = "added";
          node.status = "added";
        });

        ws2.deletedElements.forEach(function(e) {
          id2node[e.sysmlid].change_type = "removed";
          id2node[e.sysmlid].status = "removed";
        });

        ws2.updatedElements.forEach(function(e) {
          id2node[e.sysmlid].change_type = "updated";
          id2node[e.sysmlid].status = "updated";
        });

        ws2.movedElements.forEach(function(e) {
          id2node[e.sysmlid].change_type = "moved";
          id2node[e.sysmlid].status = "moved";
        });
      };
}])
.controller('DiffViewController', ["$scope", "$rootScope", "$http", "$state", "$stateParams", "growl", "WorkspaceService",
function($scope, $rootScope, $http, $state, $stateParams, growl, WorkspaceService) {
 
    /*
    // Initializations
    $scope.original = {};
    $scope.delta = {};
    $scope.ownerDiff = [];
    $scope.differenceTypes = [];

    // Watch for user selections in the containment tree
    $rootScope.$watch('tableElement', function() {

      if (($rootScope.tableElement === null) || ($rootScope.tableElement === undefined)) {
        return;
      }

      // Load the table
      loadTableDeltaAndOriginal($scope);
      loadTableHighlighting($scope);
      loadTableHeading($scope);
    }); */

  /*
   * Sets delta and original so the table can display values
   *
  var loadTableDeltaAndOriginal = function(scope) {
    scope.original.name = $rootScope.tableElement.name;
    scope.original.owner = $rootScope.tableElement.owner;
    scope.original.documentation = $rootScope.tableElement.documentation;
    scope.original.specialization = $rootScope.tableElement.specialization;
    scope.original.specialization.value = $rootScope.tableElement.specialization.value;
    scope.original.specialization.valueArray = [];
    
    scope.delta.name = scope.original.name;
    scope.delta.owner = scope.original.owner;
    scope.delta.documentation = scope.original.documentation;
    scope.delta.specialization = scope.original.specialization;
    scope.delta.specialization.value = scope.original.specialization.value;
    var keyIndex = 0;
    var valArrIndex = 0;

    //loop iterates over value obj and places each value in valueArray
    if($rootScope.tableElement.specialization.value !== null && $rootScope.tableElement.specialization.value !== undefined){
      for(var keyVar in $rootScope.tableElement.specialization.value[0]){
        scope.original.specialization.valueArray[keyIndex] = $rootScope.tableElement.specialization.value[0][keyVar];
        keyIndex++;
      }
    }

    //runs if selected element has a conflict
    if ($rootScope.conflict) {
      for (var conflictKey in $rootScope.conflictElement) {
        if (scope.delta.hasOwnProperty(conflictKey)) {
          scope.delta[conflictKey] = $rootScope.conflictElement[conflictKey];
        }
      }

      //updates valueArray if new/updated element has changed values
      if($rootScope.conflictElement.specialization !== undefined && $rootScope.conflictElement.specialization.value !== undefined){
        valArrIndex = 0;
        for (var valKey0 in $rootScope.conflictElement.specialization.value[0][valKey0]){
          if(scope.delta.specialization.valueArray[valArrIndex] !== $rootScope.conflictElement.specialization.value[0][valKey0]){
            scope.delta.specialization.valueArray[valArrIndex] = $rootScope.conflictElement.specialization.value[0][valKey0];
          }
        }
      }
    }

    //runs if selected element has been moved
    if ($rootScope.elementMoved) {
      for (var movedKey in $rootScope.movedElement) {
        if (scope.delta.hasOwnProperty(movedKey)) {
          scope.delta[movedKey] = $rootScope.movedElement[movedKey];
        } 
      }

      //updates valueArray if new/updated element has changed values
      if($rootScope.movedElement.specialization !== undefined && $rootScope.movedElement.specialization.value !== undefined){
        valArrIndex = 0;
        for (var valKey1 in $rootScope.movedElement.specialization.value[0][valKey1]){
          if(scope.delta.specialization.valueArray[valArrIndex] !== $rootScope.movedElement.specialization.value[0][valKey1]){
            scope.delta.specialization.valueArray[valArrIndex] = $rootScope.movedElement.specialization.value[0][valKey1];
          }
        }
      }
    }

    //runs if selected element has been updated
    if ($rootScope.elementUpdated) {
      for (var updateKey in $rootScope.updatedElement) {
        if (scope.delta.hasOwnProperty(updateKey)) {
          scope.delta[updateKey] = $rootScope.updatedElement[updateKey];
        }
      }

      //updates valueArray if new/updated element has changed values
      if($rootScope.updatedElement.specialization !== undefined && $rootScope.updatedElement.specialization.value !== undefined){
        valArrIndex = 0;
        for (var valKey2 in $rootScope.updatedElement.specialization.value[0][valKey2]){
          if(scope.delta.specialization.valueArray[valArrIndex] !== $rootScope.updatedElement.specialization.value[0][valKey2]){
            scope.delta.specialization.valueArray[valArrIndex] = $rootScope.updatedElement.specialization.value[0][valKey2];
          }
        }
      }
    }

    //runs if selected element is a new element; only appears as delta
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

    //runs if selected element has been deleted by another user; only appears as "mine"
    if ($rootScope.elementDeleted) {
      scope.delta.name = null;
      scope.delta.owner = null;
      scope.delta.documentation = null;
      scope.delta.specialization = null;
    }
  };

  /*
   * Sets up CSS class truth values for table highlighting
   *
  var loadTableHighlighting = function(scope) {
    //following variables are created to store logic and be more understandable for reading
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

    //the following variables are only initialized here; their values are set later
    var specsAreDifferent = false;
    var originalSpecIsNull = false;
    var originalSpecIsEmpty = false;
    var deltaSpecIsNull = false;
    var deltaSpecIsEmpty = false;

    var typesAreDifferent = false;
    var originalTypeIsNull = false;
    var originalTypeIsEmpty = false;
    var deltaTypeIsNull = false;
    var deltaTypeIsEmpty = false;

    var valsAreDifferent = false;
    var originalValIsNull = false;
    var originalValIsEmpty = false;
    var deltaValIsNull = false;
    var deltaValIsEmpty = false;

    //logic to set css classes for first table
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

    //due to the nature of the value obj in workspaces, the following else-if block is only for the specialization table
    //if both specializations are not null, follow the same logic as all other addition/update/removal cases
    if(scope.original.specialization !== null && scope.delta.specialization !== null){

      specsAreDifferent = scope.original.specialization.type !== scope.delta.specialization.type;
      originalSpecIsNull = scope.original.specialization.type === null;
      originalSpecIsEmpty = scope.original.specialization.type === '';
      deltaSpecIsNull = scope.delta.specialization.type === null;
      deltaSpecIsEmpty = scope.delta.specialization.type === '';

      typesAreDifferent = scope.original.specialization.valueArray[0] !== scope.delta.specialization.valueArray[0];
      originalTypeIsNull = scope.original.specialization.valueArray[0] === null;
      originalTypeIsEmpty = scope.original.specialization.valueArray[0] === '';
      deltaTypeIsNull = scope.delta.specialization.valueArray[0] === null;
      deltaTypeIsEmpty = scope.delta.specialization.valueArray[0] === '';

      typesAreDifferent = scope.original.specialization.valueArray[1] !== scope.delta.specialization.valueArray[1];
      originalTypeIsNull = scope.original.specialization.valueArray[1] === null;
      originalTypeIsEmpty = scope.original.specialization.valueArray[1] === '';
      deltaTypeIsNull = scope.delta.specialization.valueArray[1] === null;
      deltaTypeIsEmpty = scope.delta.specialization.valueArray[1] === '';

      scope.typeUpdate = (scope.original.specialization !== scope.delta.specialization) &&
                         (!originalTypeIsNull && !originalTypeIsEmpty) &&
                         (deltaTypeIsNull && deltaTypeIsEmpty);
      scope.typeAddition = false;
      scope.typeRemoval = false;

      scope.specUpdate = (!originalSpecIsNull && !originalSpecIsEmpty) && 
                          (deltaSpecIsNull || deltaSpecIsEmpty);
      scope.specAddition = false;
      scope.specRemoval = false;

      scope.valUpdate = (!originalValIsNull && !originalValIsEmpty) && 
                          (deltaValIsNull || deltaValIsEmpty);
      scope.valAddition = false;
      scope.valRemoval = false;

    } else if(scope.original.specialization === null && scope.delta.specialization !== null){
      //if the original is null and the delta is not, then it must be an addition case
      scope.typeRemoval = false;
      scope.typeAddition = true;

      scope.valRemoval = false;
      scope.valAddition = true;

      scope.specRemoval = false;
      scope.specAddition = true;

    } else if(scope.delta.specialization === null && scope.original.specialization !== null){
      //if the delta is null and the original is not, then it must be a removal case
      scope.typeRemoval = true;
      scope.typeAddition = false;

      scope.valRemoval = true;
      scope.valAddition = false;

      scope.specRemoval = true;
      scope.specAddition = false;

    } else {
      //sets all to false if anything else is clicked
      scope.typeRemoval = false;
      scope.typeAddition = false;
      scope.typeUpdate = false;

      scope.valRemoval = false;
      scope.valAddition = false;
      scope.valUpdate = false;

      scope.specRemoval = false;
      scope.specAddition = false;
      scope.specUpdate = false;
    }
  };

  /*
   * Evaluates the type(s) of difference(s) in the table and provides them to the scope
   *
  var loadTableHeading = function(scope) {
    scope.differenceTypes = [];

    if (scope.nameAddition || scope.ownerAddition || scope.docAddition || scope.typeAddition) {
      scope.differenceTypes.push('Addition');
    }
    
    if (scope.nameRemoval || scope.ownerRemoval || scope.docRemoval || scope.typeRemoval) {
      scope.differenceTypes.push('Deletion');
    }

    if (scope.nameUpdate || scope.ownerUpdate || scope.docUpdate || scope.typeUpdate) {
      scope.differenceTypes.push('Update');
    }
  }; */
}]);
