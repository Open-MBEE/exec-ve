'use strict';

angular.module('mm')
.controller('DiffTreeController', ["$scope", "$rootScope", "$http", "$state", "$stateParams", "growl", "WorkspaceService",
function($scope, $rootScope, $http, $state, $stateParams, growl, WorkspaceService) {

    $scope.modelTree = {};

    $scope.modelTree.toggle = {};
    $scope.modelTree.toggle.mine = false;
    $scope.modelTree.toggle.theirs = false;
    $scope.modelTree.toggle.staged = true;
    $scope.modelTree.toggle.deltas = false;

    $scope.modelTree.data = {};

    $scope.changes = [];

    $scope.stageChange = function(change) {
      change.staged = ! change.staged;
    };

    $scope.toggleTree = function(treeType) {
      $scope.modelTree.toggle.mine = false;
      $scope.modelTree.toggle.theirs = false;
      $scope.modelTree.toggle.staged = false;
      $scope.modelTree.toggle.deltas = false;

      $scope.modelTree.toggle[treeType] = true;
    };

    $scope.selectChange = function (change) {
      $state.go('main.diff.view', {elementId: change.data.sysmlid});
    };

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

        var registerChange = function(branch) {

          if (branch.status === branch.change_type)
            branch.status = "undo";
          else
            branch.status = branch.change_type;

          branch.merge_status = ! branch.merge_status;

          registerPropertyChange(branch, "name");
          registerPropertyChange(branch, "owner");
          registerPropertyChange(branch, "documentation");
        };

        var registerPropertyChange = function (branch, property) {
          if (branch.property_status[property] === branch.property_status_type[property])
            branch.property_status[property] = "undo";
          else
            branch.property_status[property] = branch.property_status_type[property];

          branch.property_merge_status[property] = ! branch.property_merge_status[property];
        };

        var setBranchState = function (branch, state, status_type, conflict_status, merge_status) {
          branch.status = state;
          branch.change_type = status_type;
          branch.merge_status = false;

          if (! branch.property_status)
            branch.property_status = {};

          if (! branch.property_status_type)
            branch.property_status_type = {};

          if (! branch.property_conflict_status)
            branch.property_conflict_status = {};

          if (! branch.property_merge_status)
            branch.property_merge_status = {};

          setPropertyState(branch, "name", state, status_type, conflict_status, merge_status);
          setPropertyState(branch, "owner", state, status_type, conflict_status, merge_status);
          setPropertyState(branch, "documentation", state, status_type, conflict_status, merge_status);
        };

        var setPropertyState = function (branch, property, state, status_type, conflict_status, merge_status) {
            branch.property_status[property] = state;
            branch.property_status_type[property]  = status_type;
            branch.property_conflict_status[property]  = conflict_status;
            branch.property_merge_status[property]  = merge_status;
        };

        var id2node = {};

        $scope.id2node = id2node;

        $scope.registerPropertyChange = registerPropertyChange;
        
        $scope.options_staged = {
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
            'moved': { style: "update"},
            'added': { style: "addition"},
            'removed': { style: "removal"},
            'updated': { style: "update"},
            'conflict': "",
            'resolve': "",
            'undo': { style: "undo"}
          }
        };

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
            'undo': { style: "undo", button: 'undo' }
          },
          buttons: {
            "update": {
              style: "btn btn-primary btn-xs",
              action: function(branch) { registerChange(branch); } 
            },
            "remove": {
              style: "btn btn-danger btn-xs",
              action: function(branch) { registerChange(branch); } 
            },
            "add": {
              style: "btn btn-success btn-xs",
              action: function(branch) { registerChange(branch); } 
            },
            "undo": {
              style: "btn btn-danger btn-xs",
              action: function(branch) { registerChange(branch); } 
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

          setBranchState(node, "clean", "clean", false, false);

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
          
          setBranchState(node, "added", "added", true, false);


          var change = {};
          change.data = e;
          change.type = "added";
          change.staged = false;
          change.treeNode = node;

          $scope.changes.push(change);

        });

        ws2.deletedElements.forEach(function(e) {
          
          id2node[e.sysmlid].change_type = "removed";
          id2node[e.sysmlid].status = "removed";

          setPropertyState(id2node[e.sysmlid], "name", "removed", "removed", true, false);
          setPropertyState(id2node[e.sysmlid], "owner", "removed", "removed", true, false);
          setPropertyState(id2node[e.sysmlid], "documentation", "removed", "removed", true, false);

          var change = {};
          change.data = e;
          change.type = "removed";
          change.staged = false;
          change.treeNode = id2node[e.sysmlid];

          $scope.changes.push(change);

        });

        ws2.updatedElements.forEach(function(e) {

          id2node[e.sysmlid].change_type = "updated";
          id2node[e.sysmlid].status = "updated";

          if (e.hasOwnProperty('name'))
            setPropertyState(id2node[e.sysmlid], "name", "updated", "updated", true, false);
          if (e.hasOwnProperty('owner'))
            setPropertyState(id2node[e.sysmlid], "owner", "updated", "updated", true, false);
          if (e.hasOwnProperty('documentation'))
            setPropertyState(id2node[e.sysmlid], "documentation", "updated", "updated", true, false);  

          var change = {};
          change.data = e;
          change.type = "updated";
          change.staged = false;
          change.treeNode = id2node[e.sysmlid];

          $scope.changes.push(change);

        });

        ws2.movedElements.forEach(function(e) {

          id2node[e.sysmlid].change_type = "moved";
          id2node[e.sysmlid].status = "moved";

          if (e.hasOwnProperty('name'))
            setPropertyState(id2node[e.sysmlid], "name", "moved", "moved", true, false);
          if (e.hasOwnProperty('owner'))
            setPropertyState(id2node[e.sysmlid], "owner", "moved", "moved", true, false);
          if (e.hasOwnProperty('documentation'))
            setPropertyState(id2node[e.sysmlid], "documentation", "moved", "moved", true, false);

          var change = {};
          change.data = e;
          change.type = "moved";
          change.staged = false;
          change.treeNode = id2node[e.sysmlid];

          $scope.changes.push(change);

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
