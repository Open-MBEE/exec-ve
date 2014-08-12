
'use strict';

angular.module('mms.directives')
.directive('mmsDiffTree', ['$templateCache', '$rootScope', 'WorkspaceService', 'growl', mmsDiffTree]);

function mmsDiffTree($templateCache, $rootScope, WorkspaceService, growl) {
  var originalElements = [];
  var deltaElements = [];
  var deltaArrays = null;
  var epsilonCache = [];

  var MMSDiffTreeTemplate = $templateCache.get('mms/templates/mmsDiffTree.html');
  
  var MMSDiffTreeController = function($scope, $rootScope) {

    $scope.treeData = [];

    // Diff the two workspaces picked in the Workspace Picker
    WorkspaceService.diff('ws1', 'ws2').then(
     function(result) {
        originalElements = result.workspace1.elements;
        deltaArrays = result.workspace2;
        
        $scope.epsilon = [];
        setUpMMSTree($scope);

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
        };
      },
      function(reason) {
        growl.error("Workspace diff failed: " + reason.message);
      }
    );


  };
  
  /*
   * Returns an array of the deltas, if any exist.
   * Returns [], otherwise.
   */
  var getDeltas = function() {
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
  };

  /*
   * Preps mms-tree with data and display options.
   */
  var setUpMMSTree = function(scope) {

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
    };

    var id2node = {};
    scope.treeData = [];
    scope.options = {
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
        'move': { style: "'update'", button: 'update' },
        'add': { style: "'addition'", button: 'add' },
        'remove': { style: "'removal'", button: 'remove' },
        'update': { style: "'update'", button: 'update' },
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
    originalElements.forEach(function(e) {
      var node = {};
      node.data = e;
      id2node[e.sysmlid] = node;
      node.label = e.name;
      node.type = e.specialization.type;
      node.children = [];
    });

    originalElements.forEach(function(e) {
      if (!id2node.hasOwnProperty(e.owner))
          scope.treeData.push(id2node[e.sysmlid]);
      else
          id2node[e.owner].children.push(id2node[e.sysmlid]);
    });

    deltaArrays.addedElements.forEach(function(e) {
      var node = {};
      node.data = e;
      id2node[e.sysmlid] = node;
      node.label = e.name;
      node.type = e.specialization.type;
      node.children = [];
      node.status = "add";
    });

    deltaArrays.addedElements.forEach(function(e) {
      if (!id2node.hasOwnProperty(e.owner))
          scope.treeData.push(id2node[e.sysmlid]);
      else
          id2node[e.owner].children.push(id2node[e.sysmlid]);
    });

    deltaArrays.deletedElements.forEach(function(e) {
      id2node[e.sysmlid].status = "remove";
    });

    deltaArrays.updatedElements.forEach(function(e) {
      id2node[e.sysmlid].status = "update";
    });

    deltaArrays.movedElements.forEach(function(e) {
      var ws1node = id2node[e.sysmlid];
      ws1node.status = "move";
    });
  };
  
  return {
    restrict: 'E',
    template: MMSDiffTreeTemplate,
    controller: ['$scope', '$rootScope', MMSDiffTreeController]
  };
}