'use strict';

angular.module('mm')
.controller('DiffTreeController', ["_", "$scope", "$rootScope", "$http", "$state", "$stateParams", "growl", "WorkspaceService",
function(_, $scope, $rootScope, $http, $state, $stateParams, growl, WorkspaceService) {

    var ws1 = $stateParams.source;
    var ws2 = $stateParams.target;

    $scope.treeapi = {};

    $scope.treeData = [];

    $scope.changes = [];

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
        'moved': { style: "moved", button: 'update' },
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
          action: function(branch) { stageChange(branch); } 
        }
      } 
    };

    var stageChange = function(change) {
      change.staged = ! change.staged;
    };

    $scope.stageChange = stageChange;

    $scope.selectChange = function (change) {
      var elementId;
      if (change.type === "added")
        elementId = change.delta.sysmlid;
      else
        elementId = change.original.sysmlid;

      $state.go('main.diff.view', {elementId: elementId});
    };

    $scope.id2change = {};

    // Diff the two workspaces picked in the Workspace Picker
    WorkspaceService.diff(ws1, ws2).then(
     function(result) {
        
        setupChangesList(result.workspace1, result.workspace2); 

      },
      function(reason) {
        growl.error("Workspace diff failed: " + reason.message);
      }
    );   
      /*
       * Preps mms-tree with data and display options.
       */
      var setupChangesList = function(ws1, ws2) {

        var emptyElement = { name: "", owner: "", documentation: ""};

        var createChange = function (name, element, deltaElement, changeType, changeIcon, treeNode) {
          var change = {};
          
          change.name = name;
          change.original = element;
          change.delta = deltaElement;
          change.type = changeType;
          change.icon = changeIcon;
          change.staged = false;
          change.treeNode = treeNode;

          change.properties = {};
          change.properties.name = {};
          change.properties.owner = {};
          change.properties.documentation = {};

          updateChangeProperty(change.properties.name, "clean");
          updateChangeProperty(change.properties.owner, "clean");
          updateChangeProperty(change.properties.documentation, "clean");

          return change;
        };

        var updateChangeProperty = function(property, changeType) {
          property.type = changeType;
          property.staged = false;
        };

        var id2data = {};
        var id2node = {};

        ws1.elements.forEach(function(e) {
          id2data[e.sysmlid] = e;

          var node = {};
          node.data = e;
          node.label = e.name;
          node.type = e.specialization.type;
          node.children = [];

          node.visible = true;
          node.status = "clean";

          // setBranchState(node, "clean", "clean", false, false);

          id2node[e.sysmlid] = node;

        });

        ws1.elements.forEach(function(e) {
          if (!id2node.hasOwnProperty(e.owner)) 
              $scope.treeData.push(id2node[e.sysmlid]);          
          else
              id2node[e.owner].children.push(id2node[e.sysmlid]);
       });

        $scope.treeapi.refresh();

        ws2.addedElements.forEach(function(e) {
          id2data[e.sysmlid] = e;

          var change = createChange(e.name, emptyElement, e, "added", "fa-plus-circle", null);

          updateChangeProperty(change.properties.name, "added");
          updateChangeProperty(change.properties.owner, "added");
          updateChangeProperty(change.properties.documentation, "added");

          $scope.changes.push(change);
          $scope.id2change[e.sysmlid] = change;

        });

        ws2.deletedElements.forEach(function(e) {

          var deletedElement = id2data[e.sysmlid];

          var change = createChange(deletedElement.name, deletedElement, emptyElement, "removed", "fa-times-circle", null);

          updateChangeProperty(change.properties.name, "removed");
          updateChangeProperty(change.properties.owner, "removed");
          updateChangeProperty(change.properties.documentation, "removed");

          $scope.changes.push(change);
          $scope.id2change[e.sysmlid] = change;

        });

        ws2.updatedElements.forEach(function(e) {

          var updatedElement = id2data[e.sysmlid];

          var deltaElement = _.cloneDeep(updatedElement);

          var change = createChange(updatedElement.name, updatedElement, deltaElement, "updated", "fa-pencil", null);

          if (e.hasOwnProperty('name')) {
            change.name = e.name;
            deltaElement.name = e.name;
            updateChangeProperty(change.properties.name, "updated");
          }
          if (e.hasOwnProperty('owner')) {
            deltaElement.owner = e.owner;
            updateChangeProperty(change.properties.owner, "updated");
          }
          if (e.hasOwnProperty('documentation')) {
            deltaElement.documentation = e.documentation;
            updateChangeProperty(change.properties.documentation, "updated");
          }

          $scope.changes.push(change);
          $scope.id2change[e.sysmlid] = change;

        });

        ws2.movedElements.forEach(function(e) {

          var movedElement = id2data[e.sysmlid];

          var deltaElement = _.cloneDeep(movedElement);

          var change = createChange(movedElement.name, movedElement, deltaElement, "moved", "fa-arrows", null);

          if (e.hasOwnProperty('owner')) {
            deltaElement.owner = e.owner;
            updateChangeProperty(change.properties.owner, "moved");
          }

          $scope.changes.push(change);
          $scope.id2change[e.sysmlid] = change;

        });
      };

}])
.controller('DiffViewController', ["$scope", "$rootScope", "$http", "$state", "$stateParams", "_", "growl", "WorkspaceService",
function($scope, $rootScope, $http, $state, $stateParams, _, growl, WorkspaceService) {
 
    var elementId = $stateParams.elementId;

    $scope.change = $scope.id2change[elementId];
    
}]);
