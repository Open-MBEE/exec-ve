'use strict';

/* Controllers */

angular.module('myApp')
.controller('ToolbarCtrl', ['$scope', '$rootScope', '$timeout', 'UxService',
function($scope, $rootScope, $timeout, UxService) {   
    $scope.tbApi = {};

    $scope.buttons = [];

    $scope.togglePane = {};

    $timeout(function() {
      $scope.togglePane = $rootScope.togglePane;
      $rootScope.tbApi = $scope.tbApi;
      $scope.tbApi.addButton(UxService.getToolbarButton("element.viewer"));
    }, 500);

    $scope.onClick = function(button) {
    };
}])
.controller('WorkspaceTreeCtrl', ['$scope', '$rootScope', '$location', '$timeout', '$state', '$stateParams','$anchorScroll', 'WorkspaceService', 'ElementService', 'ViewService', 'UtilsService', 'ConfigService', 'growl', '$modal', '$q', '$filter', 'workspaces', 'UxService',
function($scope, $rootScope, $location, $timeout, $state, $stateParams, $anchorScroll, WorkspaceService, ElementService, ViewService, UtilsService, ConfigService, growl, $modal, $q, $filter, workspaces, UxService) {

    $scope.bbApi = {};
    $rootScope.bbApi = $scope.bbApi;

    $scope.buttons = [];

    $timeout(function() {
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.expand"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.collapse"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.filter"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.add.task"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.add.configuration"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.delete"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.merge"));
    }, 500);

    $scope.$on('tree.expand', function() {
        $scope.treeApi.expand_all();
    });

    $scope.$on('tree.collapse', function() {
        $scope.treeApi.collapse_all();
    });

    $scope.$on('tree.filter', function() {
        $scope.toggleFilter();
    });

    $scope.$on('tree.add.task', function() {
        $scope.addWorkspace();
    });

    $scope.$on('tree.add.configuration', function() {
        $scope.addConfiguration();
    });

    $scope.$on('tree.delete', function() {
        $scope.deleteWorkspaceOrConfig();
    });

    $scope.$on('tree.merge', function() {
        $scope.toggleMerge();
    });

    $scope.filterOn = false;
    $scope.toggleFilter = function() {
        $scope.filterOn = !$scope.filterOn;
    };

    $scope.mergeOn = false;
    $scope.toggleMerge = function() {
        var branch = treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Compare Error: Select task or tag to compare from");
            return;
        }
        var parent_branch = treeApi.get_parent_branch(branch);
        $scope.mergeOn = !$scope.mergeOn;
        $scope.mergeFrom = branch;
        $scope.mergeTo = parent_branch;
    };

    $scope.pickNew = function(source, branch) {
        if (!branch) {
            growl.warning("Select new task or tag to compare");
            return;
        }
        if (source == 'from')
            $scope.mergeFrom = branch;
        if (source == 'to')
            $scope.mergeTo = branch;
    };

    $scope.comparing = false;
    $scope.compare = function() {
        if ($scope.comparing) {
            growl.info("Please wait...");
            return;
        }
        if (!$scope.mergeFrom || !$scope.mergeTo) {
            growl.warning("From and To fields must be filled in");
            return;
        }
        var sourceWs = $scope.mergeFrom.data.id;
        var sourceTime = 'latest';
        if ($scope.mergeFrom.type === 'Configuration') {
            sourceWs = $scope.mergeFrom.workspace;
            sourceTime = $scope.mergeFrom.data.timestamp;
        }
        var targetWs = $scope.mergeTo.data.id;
        var targetTime = 'latest';
        if ($scope.mergeTo.type === 'Configuration') {
            targetWs = $scope.mergeTo.workspace;
            targetTime = $scope.mergeTo.data.timestamp;
        }
        $scope.comparing = true;
        $state.go('mm.diff', {source: sourceWs, target: targetWs, sourceTime: sourceTime, targetTime: targetTime});
    };

    var treeApi = {};
    $scope.treeApi = treeApi;
    $rootScope.treeApi = treeApi;
 
    var level2Func = function(workspaceId, workspaceTreeNode) {
        ConfigService.getConfigs(workspaceId).then (function (data) {
            data.forEach(function (config) {
                var configTreeNode = { 
                    label : config.name, 
                    type : "Configuration",
                    data : config, 
                    workspace: workspaceId,
                    children : [] 
                };

                // check all the children of the workspace to see if any tasks match the timestamp of the config
                // if so add the workspace as a child of the configiration it was tasked from
                for (var i = 0; i < workspaceTreeNode.children.length; i++) {
                    var childWorkspaceTreeNode = workspaceTreeNode.children[i];
                    if (childWorkspaceTreeNode.type === 'Workspace') {
                        if (childWorkspaceTreeNode.data.branched === config.timestamp) {
                            configTreeNode.children.push(childWorkspaceTreeNode);
                            
                            workspaceTreeNode.children.splice(i, 1);
                            i--;
                        }
                    }
                }

                workspaceTreeNode.children.unshift(configTreeNode); 
            });
            if ($scope.treeApi.refresh)
                $scope.treeApi.refresh();
        });
    };

    var dataTree = UtilsService.buildTreeHierarchy(workspaces, "id", "Workspace", "parent", level2Func);

    $scope.my_data = dataTree;

    $scope.my_tree_handler = function(branch) {
        if (branch.type === 'Workspace')
            $state.go('mm.workspace', {ws: branch.data.id});
        else if (branch.type === 'Configuration')
            $state.go('mm.workspace.config', {ws: branch.workspace, config: branch.data.id});
    };

    var sortFunction = function(a, b) {
        if (a.type != b.type && a.type === 'Configuration') return -1;

        if(a.label.toLowerCase() < b.label.toLowerCase()) return -1;
        if(a.label.toLowerCase() > b.label.toLowerCase()) return 1;
        return 0;
    };

    $scope.tree_options = {
        types: {
            "section": "fa fa-file-o fa-fw",
            "view": "fa fa-file fa-fw",
            "Workspace": "fa fa-tasks fa-fw",
            "Configuration": "fa fa-tag fa-fw"
        },
        sort: sortFunction
    };

    $rootScope.tree_initial = "";
    $timeout(function() {
        $scope.treeApi.refresh();
    }, 5000);
    
    $scope.addWorkspace = function() {
        var branch = treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Add Task Error: Select a task or tag first");
            return;
        }
        if (branch.type === 'Configuration') {
            $scope.createWsParentId = branch.workspace;
            $scope.createWsTime = branch.data.timestamp;
            $scope.from = 'Tag ' + branch.data.name;
        } else {
            $scope.createWsParentId = branch.data.id;
            $scope.createWsTime = $filter('date')(new Date(), 'yyyy-MM-ddTHH:mm:ss.sssZ');
            $scope.from = 'Task ' + branch.data.name;
        }
        var instance = $modal.open({
            templateUrl: 'partials/mm/new.html',
            scope: $scope,
            controller: ['$scope', '$modalInstance', workspaceCtrl]
        });
        instance.result.then(function(data) {
            var newbranch = {
                label: data.name,
                type: "Workspace",
                data: data,
                children: []
            };
            
            // Want to see branches under tags now, commenting this out
            /*if (branch.type === 'Configuration') {
                treeApi.add_branch(treeApi.get_parent_branch(branch), newbranch);
            } else {
                treeApi.add_branch(branch, newbranch);
            }*/
            treeApi.add_branch(branch, newbranch);
        });
    };

    $scope.deleteWorkspaceOrConfig = function() {
        var branch = treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Delete Error: Select item to delete.");
            return;
        }
        $scope.deleteBranch = branch;
        var instance = $modal.open({
            templateUrl: 'partials/mm/delete.html',
            scope: $scope,
            controller: ['$scope', '$modalInstance', deleteCtrl]
        });
        instance.result.then(function(data) {
            // If the deleted item is a configration, then all of its child workspaces
            // are re-associated with the parent task of the configuration
            if (branch.type === 'Configuration') {
                var parentWsBranch = treeApi.get_parent_branch(branch);
                branch.children.forEach(function(branchChild) {
                    parentWsBranch.children.push(branchChild);
                });
            }
            treeApi.remove_branch(branch);
        });
    };

    var deleteCtrl = function($scope, $modalInstance) {
        $scope.oking = false;
        var branch = $scope.deleteBranch;
        $scope.type = branch.type === 'Workspace' ? 'Task' : 'Tag';
        $scope.name = branch.data.name;
        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            if (branch.type === "Workspace") {
                WorkspaceService.deleteWorkspace(branch.data.id)
                .then(function(data) {
                    growl.success("Task Deleted");
                    $modalInstance.close('ok');
                }, function(reason) {
                    growl.error("Task Delete Error: " + reason.message);
                }).finally(function() {
                    $scope.oking = false;
                });
            } else if (branch.type === "Configuration") {
                ConfigService.deleteConfig(branch.data.id)
                .then(function(data) {
                    growl.success("Configuration Deleted");
                    $modalInstance.close('ok');
                }, function(reason) {
                    growl.error("Configuration Delete Error: " + reason.message);
                }).finally(function() {
                    $scope.oking = false;
                });
            } 
        };
        $scope.cancel = function() {
            $modalInstance.dismiss();
        };
    };

    $scope.addConfiguration = function() {

        var branch = treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Add Configuration Error: Select parent task first");
            return;
        } else if (branch.type != "Workspace") {
            growl.warning("Add Configuration Error: Selection must be a task");
            return;
        }

        $scope.createConfigParentId = branch.data.id;
        $scope.configuration = {};
        $scope.configuration.now = true;

        var instance = $modal.open({
            templateUrl: 'partials/mm/new-configuration.html',
            scope: $scope,
            controller: ['$scope', '$modalInstance', configurationCtrl]
        });
        instance.result.then(function(data) {
          treeApi.add_branch(branch, {
              label: data.name,
              type: "Configuration",
              workspace: branch.data.id,
              data: data,
              children: []
          }, true);
        });
    };

    var configurationCtrl = function($scope, $modalInstance) {
        $scope.configuration = {};
        $scope.configuration.name = "";
        $scope.configuration.description = "";
        $scope.configuration.now = "true";
        $scope.configuration.timestamp = "";
        $scope.oking = false;
        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            var config = {"name": $scope.configuration.name, "description": $scope.configuration.description};

            if ($scope.configuration.now === "false") {
                config.timestamp = $scope.configuration.timestamp;
            }

            ConfigService.createConfig(config, $scope.createConfigParentId)
            .then(function(data) {
                growl.success("Configuration Created");
                $modalInstance.close(data);
            }, function(reason) {
                growl.error("Configuration Error: " + reason.message);
            }).finally(function(){
                $scope.oking = false;
            });
        };
        $scope.cancel = function() {
            $modalInstance.dismiss();
        };
    };

    var workspaceCtrl = function($scope, $modalInstance) {
        $scope.workspace = {};
        $scope.workspace.name = "";
        $scope.oking = false;
        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            WorkspaceService.create($scope.workspace.name, $scope.createWsParentId, $scope.createWsTime)
            .then(function(data) {
                growl.success("Task Created");
                $modalInstance.close(data);
            }, function(reason) {
                growl.error("Task Error: " + reason.message);
            }).finally(function(){
                $scope.oking = false;
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
            if (!parentNode) {
                $rootScope.treeData.push(treeNode);
            } else {
                parentNode.children.push(treeNode);
            }
            treeNode.status = "added";
        } else {
            treeNode.status = "clean";
            if (!parentNode) {
                index = findIndexBySysMLID($rootScope.treeData, change.delta.sysmlid);
                $rootScope.treeData.splice(index, 1);
            } else {
                index = findIndexBySysMLID(parentNode.children, change.delta.sysmlid);
                parentNode.children.splice(index,1);
            }
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
        //var deletedElements = [];
        //var changedElements = [];

        var object = {
            workspace1: {
                id: ws1
            },
            workspace2: {
                id: ws2,
                addedElements: [],
                deletedElements: [],
                updatedElements: []
            }
        };

        $scope.changes.forEach(function(change) {
            if (change.staged) {
                if (change.type === "removed") {
                    object.workspace2.deletedElements.push(change.ws2object);
            //deletedElements.push(change.original);
                } else if (change.type === 'updated') {
                    object.workspace2.updatedElements.push(change.ws2object);
            //delete change.delta.read;
            //changedElements.push(change.delta);
                } else if (change.type === 'added') {
                    object.workspace2.addedElements.push(change.ws2object);
                }
            }
        });
        $scope.saving = true;
        WorkspaceService.merge(object, $stateParams.sourceTime)
        .then(function(data) {
              growl.success("Workspace Elements Merged");
              $scope.saving = false;
              $state.go('mm', {}, {reload:true});
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

        var createChange = function (name, element, deltaElement, changeType, changeIcon, ws2object) {
          var change = {};
          
          change.name = name;
          change.original = element;
          change.delta = deltaElement;
          change.type = changeType;
          change.icon = changeIcon;
          change.staged = false;
          change.ws2object = ws2object;

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

          var change = createChange(e.name, emptyElement, e, "added", "fa-plus", e);

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

          var change = createChange(deletedElement.name, deletedElement, emptyElement, "removed", "fa-times", e);

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

          var change = createChange(updatedElement.name, updatedElement, deltaElement, "updated", "fa-pencil", e);

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

          var change = createChange(movedElement.name, movedElement, deltaElement, "moved", "fa-arrows", e);

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
