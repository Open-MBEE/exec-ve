'use strict';

/* Controllers */

angular.module('myApp')
.controller('ToolbarCtrl', ['$scope', '$rootScope',
function($scope, $rootScope) {   
    $scope.tbApi = {};
    $rootScope.veTbApi = $scope.tbApi;

    $scope.buttons = [
        {id: 'elementViewer', icon: 'fa fa-eye', selected: true, active: true, tooltip: 'Preview Element', 
            onClick: function() {$rootScope.$broadcast('elementViewerSelected');}},
        {id: 'elementEditor', icon: 'fa fa-edit', selected: false, active: true, tooltip: 'Edit Element',
            onClick: function() {$rootScope.$broadcast('elementEditorSelected');}},
        {id: 'viewStructEditor', icon: 'fa fa-arrows-v', selected: false, active: true, tooltip: 'Reorder View',
            onClick: function() {$rootScope.$broadcast('viewStructEditorSelected');}},
        {id: 'documentSnapshots', icon: 'fa fa-camera', selected: false, active: true, tooltip: 'Snapshots',
            onClick: function() {$rootScope.$broadcast('snapshotsSelected');}},
        {id: 'elementSave', icon: 'fa fa-save', pullDown: true, dynamic: true, selected: false, active: false, tooltip: 'Save',
            onClick: function() {$rootScope.$broadcast('elementSave');}},
        {id: 'elementCancel', icon: 'fa fa-times', dynamic: true, selected: false, active: false, tooltip: 'Cancel',
            onClick: function() {$rootScope.$broadcast('elementCancel');}},
        {id: 'viewSave', icon: 'fa fa-save', pullDown: true, dynamic: true, selected: false, active: false, tooltip: 'Save',
            onClick: function() {$rootScope.$broadcast('viewSave');}},
        {id: 'viewCancel', icon: 'fa fa-times', dynamic: true, selected: false, active: false, tooltip: 'Cancel',
            onClick: function() {$rootScope.$broadcast('viewCancel');}},
        {id: 'snapRefresh', icon: 'fa fa-refresh', pullDown: true, dynamic: true, selected: false, active: false, tooltip: 'Refresh',
            onClick: function() {$rootScope.$broadcast('refreshSnapshots');}},
        {id: 'snapNew', icon: 'fa fa-plus', dynamic: true, selected: false, active: false, tooltip: 'Create Snapshot',
            onClick: function() {$rootScope.$broadcast('newSnapshot');}}
    ];

    $scope.onClick = function(button) {
    };
}])
.controller('WorkspaceTreeCtrl', ['$scope', '$rootScope', '$location', '$timeout', '$state', '$stateParams','$anchorScroll', 'WorkspaceService', 'ElementService', 'ViewService', 'UtilsService', 'ConfigService', 'growl', '$modal', '$q', '$filter', 'workspaces',
function($scope, $rootScope, $location, $timeout, $state, $stateParams, $anchorScroll, WorkspaceService, ElementService, ViewService, UtilsService, ConfigService, growl, $modal, $q, $filter, workspaces) {

    $scope.buttons = [
    {
        action: function(){ $scope.treeApi.refresh(); },        
        tooltip: "Refresh",
        icon: "fa-refresh",
        permission: true
    }, {
        action: function(){ $scope.treeApi.expand_all(); },        
        tooltip: "Expand All",
        icon: "fa-caret-square-o-down",
        permission: true
    }, {
        action: function(){ $scope.treeApi.collapse_all(); },
        tooltip: "Collapse All",
        icon: "fa-caret-square-o-up",
        permission: true
    }, {
        action: function(){ $scope.toggleFilter(); },
        tooltip: "Filter Tasks",
        icon: "fa-filter",
        permission: true
    },
    {
        action: function(){ $scope.addWorkspace(); },
        tooltip: "Add Task",
        icon: "fa-plus",
        permission: true
        // TODO: permission: $scope.editable
    },
    {
        action: function(){ $scope.addConfiguration(); },
        tooltip: "Add Configuration",
        icon: "fa-tag",
        permission: true
        // TODO: permission: $scope.editable
    },
    {
        action: function(){ $scope.deleteWorkspaceOrConfig(); },
        tooltip: "Delete",
        icon: "fa-times",
        permission: true
        // TODO: permission: $scope.editable
    },
    {
        action: function(){ $scope.toggleMerge(); },
        tooltip: "Merge Task",
        icon: "fa-share-alt fa-flip-horizontal",
        permission: true
        // TODO: permission: $scope.editable
    }];

    $scope.filterOn = false;
    $scope.toggleFilter = function() {
        $scope.filterOn = !$scope.filterOn;
    };

    $scope.mergeOn = false;
    $scope.toggleMerge = function() {

        var branch = treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Merge Error: Select task to merge from");
            return;
        }

        var parent_branch = treeApi.get_parent_branch(branch);

        $scope.mergeOn = !$scope.mergeOn;
        $scope.mergeFromWs = branch.data;
        $scope.mergeToWs = parent_branch.data;
    };

    $scope.pickNewTarget = function(branch) {
        $scope.mergeToWs = branch.data;
    };

    $scope.tooltipPlacement = function(arr) {
        arr[0].placement = "bottom-left";
        for(var i=1; i<arr.length; i++){
            arr[i].placement = "bottom";
        }
    };
    $scope.comparing = false;
    $scope.compare = function() {
      if ($scope.comparing) {
        growl.info("Please wait...");
        return;
      }
      $scope.comparing = true;
      $state.go('mm.diff', {source: $scope.mergeFromWs.id, target: $scope.mergeToWs.id, sourceTime: 'latest', targetTime: 'latest'});
    };

    var treeApi = {};
    $scope.tooltipPlacement($scope.buttons);
    $scope.treeApi = treeApi;
    $rootScope.treeApi = treeApi;
 
    var level2Func = function(workspaceId, workspaceTreeNode) {
      ConfigService.getConfigs(workspaceId).then (function (data) {
        data.forEach(function (config) {
          workspaceTreeNode.children.push( { 
                                              label : config.name, 
                                              type : "Configuration",
                                              data : config, 
                                              children : [] }
                                          ); 
        });
      });
    };

    var dataTree = UtilsService.buildTreeHierarchy(workspaces, "id", "Workspace", "parent", level2Func, "Configuraiton");

    $scope.my_data = dataTree;

    $scope.my_tree_handler = function(branch) {
        $state.go('mm.workspace', {ws: branch.data.id});
    };

    $scope.tree_options = {
        types: {
            "section": "fa fa-file-o fa-fw",
            "view": "fa fa-file fa-fw",
            "Workspace": "fa fa-tasks fa-fw",
            "Configuration": "fa fa-tag fa-fw"
        }
    };

    $rootScope.tree_initial = "";

    $scope.createWorkspace = function (branch, wsParentId) {
      $scope.createWsParentId = wsParentId;

      var instance = $modal.open({
          templateUrl: 'partials/mm/new.html',
          scope: $scope,
          controller: ['$scope', '$modalInstance', workspaceCtrl]
      });
      instance.result.then(function(data) {
        treeApi.add_branch(branch, {
            label: data.name,
            type: "Workspace",
            data: data,
            children: []
        });
      });
    };

    var deleteWorkspaceOrConfig = false;
    $scope.deleteWorkspaceOrConfig = function() {

        if (deleteWorkspaceOrConfig) {
            growl.info('Please wait...');
            return;
        }

        var branch = treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Delete Error: Select item to delete.");
            return;
        }

        deleteWorkspaceOrConfig = true;

        $scope.buttons[6].icon = 'fa-spin fa-spinner';

        if (branch.type === "Workspace") {

          WorkspaceService.deleteWorkspace(branch.data.id)
          .then(function(data) {
              treeApi.remove_branch(branch);
              growl.success("Task Deleted");
              deleteWorkspaceOrConfig = false;
              $scope.buttons[6].icon = 'fa-times';
          }, function(reason) {
              growl.error("Task Delete Error: " + reason.message);
              deleteWorkspaceOrConfig = false;
              $scope.buttons[6].icon = 'fa-times';
          });

        } else if (branch.type === "Configuration") {

          ConfigService.deleteConfig(branch.data.id)
          .then(function(data) {
              treeApi.remove_branch(branch);
              growl.success("Configuration Deleted");
              deleteWorkspaceOrConfig = false;
              $scope.buttons[6].icon = 'fa-times';
          }, function(reason) {
              growl.error("Configuration Delete Error: " + reason.message);
              deleteWorkspaceOrConfig = false;
              $scope.buttons[6].icon = 'fa-times';
          });

        } else {
              $scope.buttons[6].icon = 'fa-times';          
              deleteWorkspaceOrConfig = false;
        }

    };

    $scope.addConfiguration = function() {

        var branch = treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Add Configuration Error: Select parent view first");
            return;
        } else if (branch.type != "Workspace") {
            growl.warning("Add Configuration Error: Selection must be a task");
            return;
        }

        $scope.createConfigParentId = branch.data.id;

        var instance = $modal.open({
            templateUrl: 'partials/mm/new-configuration.html',
            scope: $scope,
            controller: ['$scope', '$modalInstance', configurationCtrl]
        });
        instance.result.then(function(data) {
          treeApi.add_branch(branch, {
              label: data.name,
              type: "Configuration",
              data: data,
              children: []
          });
        });
    };

      var configurationCtrl = function($scope, $modalInstance) {
        $scope.configuration = {};
        $scope.configuration.name = "";
        $scope.configuration.description = "";

        $scope.ok = function() {
            var config = {"name": $scope.configuration.name, "description": $scope.configuration.name};
            ConfigService.createConfig(config, $scope.createWsParentId)
            .then(function(data) {
                growl.success("Configuration Created");
                $modalInstance.close(data);
            }, function(reason) {
                growl.error("Configuration Error: " + reason.message);
            });
        };
        $scope.cancel = function() {
            $modalInstance.dismiss();
        };
    };

    $scope.addWorkspace = function() {

        var branch = treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Add Task Error: Select parent view first");
            return;
        }

        $scope.createWorkspace(branch, branch.data.id);
    };


      var workspaceCtrl = function($scope, $modalInstance) {
        $scope.workspace = {};
        $scope.workspace.name = "";

        $scope.ok = function() {
            WorkspaceService.create($scope.workspace.name, $scope.createWsParentId)
            .then(function(data) {
                growl.success("Task Created");
                $modalInstance.close(data);
            }, function(reason) {
                growl.error("Task Error: " + reason.message);
            });
        };
        $scope.cancel = function() {
            $modalInstance.dismiss();
        };
    };
}])
.controller('WorkspaceDiffChangeController', ["_", "$timeout", "$scope", "$rootScope", "$http", "$state", "$stateParams", "$modal", "growl", "WorkspaceService", "ElementService", "diff",
function(_, $timeout, $scope, $rootScope, $http, $state, $stateParams, $modal, growl, WorkspaceService, ElementService, diff) {

    var ws1 = $stateParams.target;
    var ws2 = $stateParams.source;

    $scope.treeApi = {};

    var treeApiLocal = $rootScope.treeApi;

    $scope.treeApi = treeApiLocal;

    $rootScope.treeData = [];

    $scope.diff = diff;
    
    $scope.changes = [];

    $scope.id2change = {};

    $rootScope.id2node = {};

    $scope.stagedCounter = 0;
    $scope.unstagedCounter = 0;

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
        'moved'   : { style: "moved" },
        'added'   : { style: "addition" },
        'removed' : { style: "removal" },
        'updated' : { style: "update" },
        'conflict': { style: "" }
      }
    };

    var stageChange = function(change) {
      change.staged = ! change.staged;

      var treeNode = null;
      var index;

      if (change.type === "added") {
        treeNode = $scope.id2node[change.delta.sysmlid];

        var parentNode = $scope.id2node[change.delta.owner];
        
        if (change.staged) {
          parentNode.children.push(treeNode);

          treeNode.status = "added";
        } else {
          treeNode.status = "clean";

          // remove node from tree
          index = findIndexBySysMLID(parentNode.children, change.delta.sysmlid);
          parentNode.children.splice(index,1);
        }
      } else if (change.type === "removed") {
        treeNode = $scope.id2node[change.original.sysmlid];

        if (change.staged) {
          treeNode.status = "removed";
        } else {
          treeNode.status = "clean";
        } 
      } else if (change.type === "updated") {
        treeNode = $scope.id2node[change.original.sysmlid];

        // handle if the name of element has changed on update
        if (change.staged) {
          treeNode.status = "updated";
          treeNode.data = change.delta;

        } else {
          treeNode.status = "clean";
          treeNode.data = change.original;
        }
      } else if (change.type === "moved") {
        treeNode = $scope.id2node[change.original.sysmlid];

        var currentParentNode = $scope.id2node[change.original.owner];
        var newParentNode = $scope.id2node[change.delta.owner];
        
        if (change.staged) {
          treeNode.status = "moved";

          // remove from current parent node
          index = findIndexBySysMLID(currentParentNode.children, change.original.sysmlid);
          currentParentNode.children.splice(index,1);

          // add to new parent node
          newParentNode.children.push(treeNode);

        } else {
          treeNode.status = "clean";

          // remove from new parent node
          currentParentNode.children.push(treeNode);

          // add back to current parent node
          index = findIndexBySysMLID(newParentNode.children, change.original.sysmlid);
          newParentNode.children.splice(index,1);

        }
      }      

      $rootScope.treeApi.refresh();
      $rootScope.treeApi.expand_all();

      refreshStageCounters();
    };

    $scope.goBack = function () {
      $state.go('mm', {}, {reload:true});
    };

    $scope.mergeStagedChanges = function (workspaceId) {
      var deletedElements = [];
      var changedElements = [];

      $scope.changes.forEach(function(change) {
        if (change.staged) {
          if (change.type === "deleted") {
            deletedElements.push(change.original);
          } else {
            delete change.delta.read;
            changedElements.push(change.delta);
          }
        }
      });
      $scope.saving = true;
      ElementService.updateElements(changedElements, ws1)
      .then(function(data) {

          ElementService.deleteElements(deletedElements, ws1)
          .then(function(data) {
              growl.success("Workspace Elements Merged");
              $scope.saving = false;
              $state.go('mm', {}, {reload:true});
          }, function(reason) {
            growl.error("Workspace Merge Error: " + reason.message);
            $scope.saving = false;
          });       

      }, function(reason) {
          growl.error("Workspace Merge Error: " + reason.message);
          $scope.saving = false;
      }); 
    };

    $scope.stageAllUnstaged = function (changes) {
      changes.forEach(function (change) {
        if (!change.staged) {
          stageChange(change);
        }
      });
    };

    $scope.unstageAllStaged = function (changes) {
      changes.forEach(function (change) {
        if (change.staged) {
          stageChange(change);
        }
      });
    };

    var refreshStageCounters = function () {
      $scope.stagedCounter = 0;
      $scope.unstagedCounter = 0;

      $scope.changes.forEach(function (change) {
        if (change.staged) {
          $scope.stagedCounter++;
        } else {
          $scope.unstagedCounter++;
        }
      });
    };

    var findIndexBySysMLID = function (array, sysmlid) {
     for (var i = 0; i < array.length; i++) {
        if (array[i].data.sysmlid === sysmlid) {
          return i;
        }
      }
      return -1; 
    };

    $scope.stageChange = stageChange;

    $scope.selectChange = function (change) {
      var elementId;
      if (change.type === "added")
        elementId = change.delta.sysmlid;
      else
        elementId = change.original.sysmlid;

      $state.go('mm.diff.view', {elementId: elementId});
    };



    // Diff the two workspaces picked in the Workspace Picker
    /* WorkspaceService.diff(ws1, ws2).then(
     function(result) {
        
        setupChangesList(result.workspace1, result.workspace2); 

      },
      function(reason) {
        growl.error("Workspace diff failed: " + reason.message);
      }
    );   */

      /*
       * Preps mms-tree with data and display options.
       */
    var setupChangesList = function(ws1, ws2) {

        // var emptyElement = { name: "", owner: "", documentation: "", specialization : { type: "", value_type: "", values: ""} };

        var emptyElement = { name: "", owner: "", documentation: "", specialization : {} };

        var createChange = function (name, element, deltaElement, changeType, changeIcon) {
          var change = {};
          
          change.name = name;
          change.original = element;
          change.delta = deltaElement;
          change.type = changeType;
          change.icon = changeIcon;
          change.staged = false;

          change.properties = {};
          change.properties.name = {};
          change.properties.owner = {};
          change.properties.documentation = {};

          updateChangeProperty(change.properties.name, "clean");
          updateChangeProperty(change.properties.owner, "clean");
          updateChangeProperty(change.properties.documentation, "clean");

          change.properties.specialization = {};
          if (element.hasOwnProperty('specialization')) {
            Object.keys(element.specialization).forEach(function (property) {
              change.properties.specialization[property] = {};
              updateChangeProperty(change.properties.specialization[property], "clean");
            });
          }
          if (deltaElement.hasOwnProperty('specialization')) {
            Object.keys(deltaElement.specialization).forEach(function (property) {
              change.properties.specialization[property] = {};
              updateChangeProperty(change.properties.specialization[property], "clean");
            });
          }

          return change;
        };

        var updateChangeProperty = function(property, changeType) {
          property.type = changeType;
          property.staged = false;
        };

        // dynamically create 1st order of depth of specialization properties
        /*var updateChangePropertySpecializations = function(specialization, changeType) {

          Object.keys(specialization).forEach(function (property) {
            specialization[property].type = changeType;
            specialization[property].staged = false;
          });

        }; */

        var createTreeNode = function (element, status) {
          var node = {};
          
          node.data = element;
          node.label = element.name;
          node.type = element.specialization.type;
          node.children = [];

          // node.visible = true;
          node.status = status;

          return node;
        };

        var id2data = {};
        var id2node = {};

        ws1.elements.forEach(function(e) {
          id2data[e.sysmlid] = e;

          var node = createTreeNode(e, "clean");

          id2node[e.sysmlid] = node;

        });

        ws1.elements.forEach(function(e) {
          if (!id2node.hasOwnProperty(e.owner)) 
              $rootScope.treeData.push(id2node[e.sysmlid]);          
          else
              id2node[e.owner].children.push(id2node[e.sysmlid]);
        });

        // $scope.treeApi.refresh();
        // $scope.treeApi.expand_all();

        ws2.addedElements.forEach(function(e) {
          id2data[e.sysmlid] = e;

          var node = createTreeNode(e, "clean");

          id2node[e.sysmlid] = node;

          var change = createChange(e.name, emptyElement, e, "added", "fa-plus", null);

          updateChangeProperty(change.properties.name, "added");
          updateChangeProperty(change.properties.owner, "added");
          updateChangeProperty(change.properties.documentation, "added");
          
          if (e.hasOwnProperty('specialization')) {
            Object.keys(e.specialization).forEach(function (property) {
              change.properties.specialization[property] = {};
              updateChangeProperty(change.properties.specialization[property], "added");
            });            
          }

          $scope.changes.push(change);
          $scope.id2change[e.sysmlid] = change;

        });

        ws2.deletedElements.forEach(function(e) {

          var deletedElement = id2data[e.sysmlid];

          var change = createChange(deletedElement.name, deletedElement, emptyElement, "removed", "fa-times", null);

          updateChangeProperty(change.properties.name, "removed");
          updateChangeProperty(change.properties.owner, "removed");
          updateChangeProperty(change.properties.documentation, "removed");
          
          if (deletedElement.hasOwnProperty('specialization')) {
            Object.keys(deletedElement.specialization).forEach(function (property) {
              change.properties.specialization[property] = {};
              updateChangeProperty(change.properties.specialization[property], "removed");
            });            
          }

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
          if (e.hasOwnProperty('specialization')) {
            Object.keys(e.specialization).forEach(function (property) {
              deltaElement.specialization[property] = e.specialization[property];
              change.properties.specialization[property] = {};
              updateChangeProperty(change.properties.specialization[property], "updated");
            });            
          }

          /* if (e.hasOwnProperty('specialization') && e.specialization.hasOwnProperty('type')) {
            deltaElement.specialization.type = e.specialization.type;
            updateChangeProperty(change.properties.specialization.type, "updated");
          }
          if (e.hasOwnProperty('specialization') && e.specialization.hasOwnProperty('value')) {
            deltaElement.specialization.value = e.specialization.value;
            updateChangeProperty(change.properties.specialization.value_type, "updated");
            updateChangeProperty(change.properties.specialization.values, "updated");
          } */

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

        $rootScope.id2node = id2node;

        var id2change = $scope.id2change;

        $rootScope.id2change = id2change;

        refreshStageCounters();
    };

    $timeout(function () { setupChangesList(diff.workspace1, diff.workspace2); } ); 
}])
.controller('WorkspaceDiffTreeController', ["_", "$timeout", "$scope", "$rootScope", "$http", "$state", "$stateParams", "$modal", "growl", "WorkspaceService", "ElementService", "diff",
function(_, $timeout, $scope, $rootScope, $http, $state, $stateParams, $modal, growl, WorkspaceService, ElementService, diff) {

    $scope.treeApi = {};

    $scope.treeData = [];
    
    $scope.treeData = $rootScope.treeData;

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
        'moved'   : { style: "moved" },
        'added'   : { style: "addition" },
        'removed' : { style: "removal" },
        'updated' : { style: "update" },
        'conflict': { style: "" }
      }
    };

    var options = $scope.options;

    $rootScope.options = options;

    $timeout(function () { $scope.treeApi.refresh(); $scope.treeApi.expand_all(); $rootScope.treeApi = $scope.treeApi; } ); 
    
    

}])
.controller('WorkspaceDiffElementViewController', ["_", "$timeout", "$scope", "$rootScope", "$http", "$state", "$stateParams", "$modal", "growl", "WorkspaceService", "ElementService", "diff",
function(_, $timeout, $scope, $rootScope, $http, $state, $stateParams, $modal, growl, WorkspaceService, ElementService, diff) {
    $scope.source = $stateParams.source;
    $scope.target = $stateParams.target;
    $scope.sourceTime = $stateParams.sourceTime;
    $scope.targetTime = $stateParams.targetTime;
    $scope.diff = diff;

    $scope.options = $rootScope.options;

    $scope.change = $rootScope.id2change[$stateParams.elementId];

}]);
