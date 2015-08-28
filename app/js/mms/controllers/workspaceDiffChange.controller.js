'use strict';

/* Controllers */

angular.module('mmsApp').controller('WorkspaceDiffChangeController', ["_", "$timeout", "$scope", "$rootScope", "$state", "$stateParams", "$modal", "growl", "WorkspaceService", "ElementService", "diff", "UxService", "paneManager", "targetName", function(_, $timeout, $scope, $rootScope, $state, $stateParams, $modal, growl, WorkspaceService, ElementService, diff, UxService, paneManager, targetName)
{

	var ws1 = $stateParams.target;
	var ws2 = $stateParams.source;

	$scope.treeApi = {};

	var treeApiLocal = $rootScope.treeApi;

	$scope.treeApi = treeApiLocal;
	
	$rootScope.mms_pane_toggleable = false;

	$rootScope.treeData = [];

	$scope.diff = diff;

	$scope.changes = [];

	$scope.id2change = {};

	$rootScope.id2node = {};

	$scope.stagedCounter = 0;
	$scope.unstagedCounter = 0;

	$scope.workspace1Name = targetName;

	$scope.mergeInfo = $rootScope.mergeInfo;

	$scope.targetTime = $stateParams.targetTime;

	if($scope.diff.workspace1.timestamp){
		$scope.targetIsTag = true;
	} else {
		$scope.targetIsTag = false;
	}

	$rootScope.$on('tree-pane-item-clicked', function(event, data){

		var previousActiveElement = angular.element('.row-selected');
		previousActiveElement.removeClass("row-selected");

		var activeElement = angular.element('#'+data.data.sysmlid);
		if(activeElement){
			if(!activeElement.isOnScreen()){
				activeElement.get(0).scrollIntoView();
			}
			activeElement.addClass("row-selected");
		}

	});

  $scope.stagingOrder = '';
  $scope.unstagingOrder = '';
  $scope.orderValues = [
    { name: 'Name', value: 'name' },
    { name: 'Type of Change', value: 'type' },
    { name: 'Type of Element', value: 'delta.specialization.type' },
    { name: 'Username', value: 'delta.modifier' }
  ];


	$scope.options = {
		types: UxService.getTreeTypes(),
		statuses: {
			'moved': {
				style: "moved"
			},
			'added': {
				style: "addition"
			},
			'removed': {
				style: "removal"
			},
			'updated': {
				style: "update"
			},
			'conflict': {
				style: ""
			}
		}
	};

	if($scope.diff.status === "GENERATING" || $scope.diff.status === "OUTDATED"){
		var modalInstance = $modal.open({
			templateUrl: 'partials/mms/diffPageModal.html',
			controller: 'diffPageModalCtrl',
			resolve: {
				diff: function(){return $scope.diff;}
			},
			backdrop: 'static',
			keyboard: false
		});
	}

	var stageChange = function(change)
	{

			// @TODO: Compare original and new owner to determine if a move has occurred
			change.staged = !change.staged;

			var treeNode = null;
			var index;

			if (change.type === "added")
			{
				treeNode = $scope.id2node[change.delta.sysmlid];

				if (change.staged)
				{
// 					treeNode.status = "added";
				}
				else
				{
// 					treeNode.status = "clean";
				}
			}
			else if (change.type === "removed")
			{
				treeNode = $scope.id2node[change.original.sysmlid];

				if (change.staged)
				{
// 					treeNode.status = "removed";
				}
				else
				{
// 					treeNode.status = "clean";
				}
			}
			else if (change.type === "updated")
			{
				treeNode = $scope.id2node[change.original.sysmlid];

				// handle if the name of element has changed on update
				if (change.staged)
				{
// 					treeNode.status = "updated";
					treeNode.data = change.delta;

				}
				else
				{
// 					treeNode.status = "clean";
					treeNode.data = change.original;
				}
			}
			else if (change.type === "moved")
			{
				treeNode = $scope.id2node[change.original.sysmlid];

				var currentParentNode = $scope.id2node[change.original.owner];
				var newParentNode = $scope.id2node[change.delta.owner];

				if (change.staged)
				{
// 					treeNode.status = "moved";

					// remove from current parent node
					index = findIndexBySysMLID(currentParentNode.children, change.original.sysmlid);
					currentParentNode.children.splice(index, 1);

					// add to new parent node
					newParentNode.children.push(treeNode);

				}
				else
				{
// 					treeNode.status = "clean";

					// remove from new parent node
					currentParentNode.children.push(treeNode);

					// add back to current parent node
					index = findIndexBySysMLID(newParentNode.children, change.original.sysmlid);
					newParentNode.children.splice(index, 1);

				}
			}

			if (change.staged)
			{
				treeNode.detail.stageStatus = "apply";
			}
			else
			{
				treeNode.detail.stageStatus = "ignore";
			}

			$rootScope.treeApi.refresh();
			$rootScope.treeApi.expand_all();

			refreshStageCounters();
		};

	var highlightTreeRow = function(change)
	{
		var treeNode;
		var nodeId;
		var index;
		
		if (change.type === "added")
			nodeId = change.delta.sysmlid;
		else
			nodeId = change.original.sysmlid;
		
		treeNode = $scope.id2node[nodeId];
		$rootScope.treeApi.select_branch(treeNode);
		/*angular.forEach($scope.id2node, function(node)
		{
			node.selected = null;
		});
		
		change.selected = true;
		treeNode.selected = true;
		
		var branch = window.document.getElementById("tree-branch-" + nodeId);
		branch.scrollIntoView();
		
		$rootScope.treeApi.refresh();
		$rootScope.treeApi.expand_all();*/
	};

	$scope.goBack = function()
	{
		$state.go('workspace', {}, {
			reload: true
		});
	};

	$scope.mergeStagedChanges = function(workspaceId)
	{
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
				updatedElements: [],
				movedElements: []
			}
		};

		$scope.changes.forEach(function(change)
		{
			if (change.staged)
			{
				if (change.type === "removed")
				{
					object.workspace2.deletedElements.push(change.ws2object);
					//deletedElements.push(change.original);
				}
				else if (change.type === 'updated')
				{
					object.workspace2.updatedElements.push(change.ws2object);
					delete change.ws2object.read;
					delete change.ws2object.modified;
					//delete change.delta.read;
					//changedElements.push(change.delta);
				}
				else if (change.type === 'added')
				{
					object.workspace2.addedElements.push(change.ws2object);
				}
				else if (change.type === 'moved')
				{
					object.workspace2.movedElements.push(change.ws2object);
				}
			}
		});
		$scope.saving = true;
		WorkspaceService.merge(object, $stateParams.sourceTime).then(function(data)
		{
			growl.success("Workspace Elements Merged");
			$scope.saving = false;
			$state.go('workspace', {}, {
				reload: true
			});
		}, function(reason)
		{
			growl.error("Workspace Merge Error: " + reason.message);
			$scope.saving = false;
		});
	};

	$scope.stageAllUnstaged = function(changes)
	{
		changes.forEach(function(change)
		{
			if (!change.staged)
			{
				stageChange(change);
			}
		});
	};

	$scope.unstageAllStaged = function(changes)
	{
		changes.forEach(function(change)
		{
			if (change.staged)
			{
				stageChange(change);
			}
		});
	};

	var refreshStageCounters = function()
	{
			$scope.stagedCounter = 0;
			$scope.unstagedCounter = 0;

			$scope.changes.forEach(function(change)
			{
				if (change.staged)
				{
					$scope.stagedCounter++;
				}
				else
				{
					$scope.unstagedCounter++;
				}
			});
		};

	var findIndexBySysMLID = function(array, sysmlid)
	{
			for (var i = 0; i < array.length; i++)
			{
				if (array[i].data.sysmlid === sysmlid)
				{
					return i;
				}
			}
			return -1;
		};

	$scope.stageChange = stageChange;

	$scope.selectChange = function(change)
	{
		var elementId;
		
		if (change.type === "added") elementId = change.delta.sysmlid;
		else elementId = change.original.sysmlid;
		
		if( ! $rootScope.diffPerspective)
			$rootScope.diffPerspective = 'detail';
		
		$rootScope.$broadcast('elementId', elementId);

		highlightTreeRow(change);
		
// 		$state.go('workspace.diff.view', {elementId: elementId});
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
	var setupChangesList = function(ws1, ws2)
	{

			// var emptyElement = { name: "", owner: "", documentation: "", specialization : { type: "", value_type: "", values: ""} };
			var emptyElement = {
				name: "",
				owner: "",
				documentation: "",
				specialization: {}
			};

			var createChange = function(name, element, deltaElement, changeType, changeIcon, ws2object)
				{
					var change = {};

					change.name = name;
					change.original = element;
					change.delta = deltaElement;
					change.type = changeType;
					change.icon = changeIcon;
					// @test var
					change.changeTypeName = UxService.getChangeTypeName(change.type);
					change.typeIcon = UxService.getTypeIcon(change.delta.specialization.type);

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
					if (element.hasOwnProperty('specialization'))
					{
						Object.keys(element.specialization).forEach(function(property)
						{
							change.properties.specialization[property] = {};
							updateChangeProperty(change.properties.specialization[property], "clean");
						});
					}
					if (deltaElement.hasOwnProperty('specialization'))
					{
						Object.keys(deltaElement.specialization).forEach(function(property)
						{
							change.properties.specialization[property] = {};
							updateChangeProperty(change.properties.specialization[property], "clean");
						});
					}

					return change;
				};

			var updateChangeProperty = function(property, changeType)
				{
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

			var createTreeNode = function(element, status, detailType)
				{
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

			ws1.elements.forEach(function(e)
			{
				id2data[e.sysmlid] = e;

				var node = createTreeNode(e, "clean", 'something');

				id2node[e.sysmlid] = node;

			});

			ws1.elements.forEach(function(e)
			{
				if (!id2node.hasOwnProperty(e.owner)) $rootScope.treeData.push(id2node[e.sysmlid]);
				else id2node[e.owner].children.push(id2node[e.sysmlid]);
			});

			// $scope.treeApi.refresh();
			// $scope.treeApi.expand_all();
			ws2.addedElements.forEach(function(e)
			{
				id2data[e.sysmlid] = e;

				var node = createTreeNode(e, "clean", "addition");

				id2node[e.sysmlid] = node;

				id2node[e.sysmlid].detail = {
					type: 'addition',
					stageStatus: 'ignore',
					icon: 'plus',
					iconType: 'added'
				};

				var change = createChange(e.name, emptyElement, e, "added", "fa-plus", e);

				updateChangeProperty(change.properties.name, "added");
				updateChangeProperty(change.properties.owner, "added");
				updateChangeProperty(change.properties.documentation, "added");

				if (e.hasOwnProperty('specialization'))
				{
					Object.keys(e.specialization).forEach(function(property)
					{
						change.properties.specialization[property] = {};
						updateChangeProperty(change.properties.specialization[property], "added");
					});
				}

				$scope.changes.push(change);
				$scope.id2change[e.sysmlid] = change;

			});

			ws2.deletedElements.forEach(function(e)
			{

				var deletedElement = id2data[e.sysmlid];

				var change = createChange(deletedElement.name, deletedElement, emptyElement, "removed", "fa-times", e);

				id2node[e.sysmlid].detail = {
					type: 'deletion',
					stageStatus: 'ignore',
					icon: 'times',
					iconType: 'removed'
				};

				updateChangeProperty(change.properties.name, "removed");
				updateChangeProperty(change.properties.owner, "removed");
				updateChangeProperty(change.properties.documentation, "removed");

				if (deletedElement.hasOwnProperty('specialization'))
				{
					Object.keys(deletedElement.specialization).forEach(function(property)
					{
						change.properties.specialization[property] = {};
						updateChangeProperty(change.properties.specialization[property], "removed");
					});
				}

				$scope.changes.push(change);
				$scope.id2change[e.sysmlid] = change;

			});

			ws2.updatedElements.forEach(function(e)
			{

				var updatedElement = id2data[e.sysmlid];

				var deltaElement = _.cloneDeep(updatedElement);

				var change = createChange(updatedElement.name, updatedElement, deltaElement, "updated", "fa-pencil", e);

				id2node[e.sysmlid].detail = {
					type: 'modification',
					stageStatus: 'ignore',
					icon: 'pencil',
					iconType: 'updated'
				};

				if (e.hasOwnProperty('name'))
				{
					change.name = e.name;
					deltaElement.name = e.name;
					updateChangeProperty(change.properties.name, "updated");
				}
				if (e.hasOwnProperty('owner'))
				{
					deltaElement.owner = e.owner;
					updateChangeProperty(change.properties.owner, "updated");
				}
				if (e.hasOwnProperty('documentation'))
				{
					deltaElement.documentation = e.documentation;
					updateChangeProperty(change.properties.documentation, "updated");
				}
				if (e.hasOwnProperty('specialization'))
				{
					Object.keys(e.specialization).forEach(function(property)
					{
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

			// Added second pass to populate additions
			ws2.addedElements.forEach(function(e)
			{

				var treeNode = id2node[e.sysmlid];
				var parentNode = id2node[e.owner];

				if (!parentNode)
				{
					$rootScope.treeData.push(treeNode);
				}
				else
				{
					parentNode.children.push(treeNode);
				}
			});

/*
          TODO: removing this was a hack, we removed it because the moved elements
          also show up in the updated list and creates duplicates 
           
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

        }); */

			$rootScope.id2node = id2node;

			var id2change = $scope.id2change;

			$rootScope.id2change = id2change;

			refreshStageCounters();
		};

	// Hiding the right-hand pane
	paneManager.get("right-pane").setOptions(
	{
		closed: true,
		noToggle: true,
		//handle: 0
	});
	paneManager.get("left-pane").setOptions(
	{
		// noToggle: true,
		min: "20%",
		// max: "50%",
		// handle: 50,
		size: "45%"
	});

	// Showing the right-hand pane once we leave the diff view
	$scope.$on('$destroy', function()
	{
		paneManager.get("right-pane").setOptions(
		{
			noToggle: false,
			handle: 14
		});
		paneManager.get("left-pane").setOptions(
		{
			noToggle: false,
			handle: 13,
			size: "20%"
		});
		
		$rootScope.selectedElementId = null;
		$rootScope.diffPerspective = null;
		$rootScope.mms_pane_toggleable = null;
	});

	$timeout(function()
	{
		setupChangesList(diff.workspace1, diff.workspace2);
	});
}]);