'use strict';

angular.module('mm')
.controller('DiffTreeController', ["$scope", "$rootScope", "$http", "$state", "$stateParams", "growl", "WorkspaceService",
function($scope, $rootScope, $http, $state, $stateParams, growl, WorkspaceService) {

    $scope.treeData = [];
    $scope.id2node = {};
    $scope.ws1 = {};
    $scope.ws2id2node = {};

    // Diff the two workspaces picked in the Workspace Picker
    WorkspaceService.diff('ws1', 'ws2').then(
     function(result) {
        
        $scope.ws1 = result.workspace1;
        $scope.ws2 = result.workspace2;

        setupModelTree(result.workspace1, result.workspace2);

        $scope.select_branch_id = function (sysmlid) {
          $state.go('main.diff.view', {elementId: sysmlid});
        };

      },
      function(reason) {
        growl.error("Workspace diff failed: " + reason.message);
      }
    );   

      /*
       * Preps mms-tree with data and display options.
       */
      var setupModelTree = function(ws1, ws2) {

        var stageChange = function (branch) {
          branch.status = "undo";
          branch.merge_status = ! branch.merge_status;

          branch.property_status.name = "undo";
          branch.property_status.owner = "undo";
          branch.property_status.documentation = "undo";

          branch.property_merge_status.name = ! branch.property_merge_status.name;
          branch.property_merge_status.owner = ! branch.property_merge_status.owner;
          branch.property_merge_status.documentation = ! branch.property_merge_status.documentation;

        };

        var undoChange = function(branch) {
          branch.status = branch.change_type;
          branch.merge_status = ! branch.merge_status;

          branch.property_status.name = branch.property_status_type.name;
          branch.property_status.owner = branch.property_status_type.owner;
          branch.property_status.documentation = branch.property_status_type.documentation;

          branch.property_merge_status.name = ! branch.property_merge_status.name;
          branch.property_merge_status.owner = ! branch.property_merge_status.owner;
          branch.property_merge_status.documentation = ! branch.property_merge_status.documentation;

        };

        var registerPropertyChange = function (branch, property) {
          if (branch.property_status[property] === branch.property_status_type[property])
            branch.property_status[property] = "undo";
          else
            branch.property_status[property] = branch.property_status_type[property];

          branch.property_merge_status[property] = ! branch.property_merge_status[property];
        };

        var stagePropertyChange = function (branch, property) {
          branch.property_status[property] = "undo";

          branch.property_merge_status[property] = ! branch.property_merge_status[property];
        };

        var undoPropertyChange = function (branch, property) {
          branch.property_status[property] = branch.property_status_type[property];

          branch.property_merge_status[property] = ! branch.property_merge_status[property];
        };

        var id2node = {};

        $scope.id2node = id2node;

        $scope.registerPropertyChange = registerPropertyChange;
        
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
            'moved': { style: "update", button: 'update' },
            'added': { style: "addition", button: 'add' },
            'removed': { style: "removal", button: 'remove' },
            'updated': { style: "update", button: 'update' },
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

          node.status = "clean";
          node.merge_status = false;

          node.property_status = {};
          node.property_status.name = "clean";
          node.property_status.owner = "clean";
          node.property_status.documentation = "clean";

          node.property_status_type = {};
          node.property_status_type.name = "clean";
          node.property_status_type.owner = "clean";
          node.property_status_type.documentation = "clean";

          node.property_conflict_status = {};
          node.property_conflict_status.name = false;
          node.property_conflict_status.owner = false;
          node.property_conflict_status.documentation = false;

          node.property_merge_status = {};
          node.property_merge_status.name = false;
          node.property_merge_status.owner = false;
          node.property_merge_status.documentation = false;

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
          node.merge_status = false;

          node.property_status = {};
          node.property_status.name = "added";
          node.property_status.owner = "added";
          node.property_status.documentation = "added";

          node.property_status_type = {};
          node.property_status_type.name = "added";
          node.property_status_type.owner = "added";
          node.property_status_type.documentation = "added";

          node.property_conflict_status = {};
          node.property_conflict_status.name = true;
          node.property_conflict_status.owner = true;
          node.property_conflict_status.documentation = true;

          node.property_merge_status = {};
          node.property_merge_status.name = false;
          node.property_merge_status.owner = false;
          node.property_merge_status.documentation = false;
        });

        ws2.deletedElements.forEach(function(e) {
          id2node[e.sysmlid].change_type = "removed";
          id2node[e.sysmlid].status = "removed";

          id2node[e.sysmlid].property_status.name = "removed";
          id2node[e.sysmlid].property_status.owner = "removed";
          id2node[e.sysmlid].property_status.documentation = "removed";

          id2node[e.sysmlid].property_status_type = {};
          id2node[e.sysmlid].property_status_type.name = "removed";
          id2node[e.sysmlid].property_status_type.owner = "removed";
          id2node[e.sysmlid].property_status_type.documentation = "removed";

          id2node[e.sysmlid].property_conflict_status.name = true;
          id2node[e.sysmlid].property_conflict_status.owner = true;
          id2node[e.sysmlid].property_conflict_status.documentation = true;

        });

        ws2.updatedElements.forEach(function(e) {
          id2node[e.sysmlid].change_type = "updated";
          id2node[e.sysmlid].status = "updated";

          if (e.hasOwnProperty('name')) {
            id2node[e.sysmlid].property_status.name = "updated";
            id2node[e.sysmlid].property_status_type.name = "updated";
            id2node[e.sysmlid].property_conflict_status.name = true;
          }
          if (e.hasOwnProperty('owner')) {
            id2node[e.sysmlid].property_status.owner = "updated";
            id2node[e.sysmlid].property_status_type.owner = "updated";
            id2node[e.sysmlid].property_conflict_status.owner = true;
          }
          if (e.hasOwnProperty('documentation')) {
            id2node[e.sysmlid].property_status.documentation = "updated";
            id2node[e.sysmlid].property_status_type.documentation = "updated";
            id2node[e.sysmlid].property_conflict_status.documentation = true;
          }          

        });

        ws2.movedElements.forEach(function(e) {
          id2node[e.sysmlid].change_type = "moved";
          id2node[e.sysmlid].status = "moved";

          if (e.hasOwnProperty('name')) {
            id2node[e.sysmlid].property_status.name = "moved";
            id2node[e.sysmlid].property_status_type.name = "moved";
            id2node[e.sysmlid].property_conflict_status.name = true;
          }
          if (e.hasOwnProperty('owner')) {
            id2node[e.sysmlid].property_status.owner = "moved";
            id2node[e.sysmlid].property_status_type.owner = "moved";
            id2node[e.sysmlid].property_conflict_status.owner = true;
          }
          if (e.hasOwnProperty('documentation')) {
            id2node[e.sysmlid].property_status.documentation = "moved";
            id2node[e.sysmlid].property_status_type.documentation = "moved";
            id2node[e.sysmlid].property_conflict_status.documentation = true;
          }  
        });
      };
}])
.controller('DiffViewController', ["$scope", "$rootScope", "$http", "$state", "$stateParams", "_", "growl", "WorkspaceService",
function($scope, $rootScope, $http, $state, $stateParams, _, growl, WorkspaceService) {
 
    var elementId = $stateParams.elementId;

    var originalNode = $scope.id2node[elementId];

    $scope.original = originalNode.data;
    $scope.originalNode = originalNode;

    // make the delta object
    var delta = _.cloneDeep(originalNode.data);

    if (originalNode.change_type === "updated") {

    }

    $scope.delta = delta;

}]);
