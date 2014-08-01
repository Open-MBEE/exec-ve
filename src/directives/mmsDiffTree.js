'use strict';

angular.module('mms.directives')
.directive('mmsDiffTree', ['$templateCache', '$rootScope', 'DiffService', mmsDiffTree]);

function mmsDiffTree($templateCache, $rootScope, DiffService) {
  var originalElements = [];
  var deltaElements = [];
  var deltaArrays = null;

  var MMSDiffTreeController = function($scope, $rootScope) {
    // Diff the two workspaces picked in the Workspace Picker
    var response = DiffService.diff('ws1', 'ws2');
    originalElements = response.workspace1.elements;
    deltaArrays = response.workspace2;
    
    var id2node = {};

    // Set up mms-tree
    $scope.treeData = [];
    $scope.options = {
      types: {
        "Element": "fa fa-square",
        "Property": "fa fa-circle",
        "View": "fa fa-square",
        "Dependency": "fa fa-long-arrow-right",
        "DirectedRelationship": "fa fa-long-arrow-right",
        "Generalization": "fa fa-chevron-right",
        "Package": "fa fa-folder",
        "Connector": "fa fa-expand"
      },
      statuses: {
        "moved": "",
        "added": "",
        "deleted": "",
        "updated": "",
        "conflict": "",
        "resolved": ""
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
          $scope.treeData.push(id2node[e.sysmlid]);
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
      node.status = "added";
    });

    deltaArrays.addedElements.forEach(function(e) {
      if (!id2node.hasOwnProperty(e.owner))
          $scope.treeData.push(id2node[e.sysmlid]);
      else
          id2node[e.owner].children.push(id2node[e.sysmlid]);
    });

    deltaArrays.deletedElements.forEach(function(e) {
      id2node[e.sysmlid].status = "deleted";
    });

    deltaArrays.updatedElements.forEach(function(e) {
      id2node[e.sysmlid].status = "updated";
    });

    deltaArrays.movedElements.forEach(function(e) {
      var ws1node = id2node[e.sysmlid];
      ws1node.status = "moved";
      //id2node[e.owner].children.push(ws1node);
    });

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
  };

  var MMSDiffTreeLink = function(scope, element, attrs) {
    scope.epsilon = [];

    scope.stageChange = function(sysmlid) {
      // Get the element ref'd by sysmlid in deltaElements
      var elem = getDeltas().filter(function(entry) {
       return entry && entry.sysmlid.indexOf(sysmlid) !== -1;
      })[0];

      scope.epsilon.push(elem);
    };

    // Send epsilon to the server
    scope.submitAllChanges = function() {
    };

    // Delete epsilon and return to workspace picker state
    scope.cancelAllChanges = function() {
    };
  };
  
  var MMSDiffTreeTemplate = $templateCache.get('mms/templates/mmsDiffTree.html');

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
  
  return {
    restrict: 'E',
    template: MMSDiffTreeTemplate,
    link: MMSDiffTreeLink,
    controller: ['$scope', '$rootScope', MMSDiffTreeController]
  };
}