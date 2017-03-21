'use strict';

/* Controllers */

angular.module('mmsApp').controller('WorkspaceDiffChangeController', ["_", "$timeout", "$scope", "$rootScope", "$state", "$stateParams", "$uibModal", "growl", "WorkspaceService", "ElementService", "diff", "UxService", "paneManager", "targetName", function(_, $timeout, $scope, $rootScope, $state, $stateParams, $uibModal, growl, WorkspaceService, ElementService, diff, UxService, paneManager, targetName)
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
	$scope.stagedChanges = [];
	$scope.unstagedChanges = [];

	$scope.id2change = {};

	$rootScope.id2node = {};

	$scope.stagedCounter = 0;
	$scope.unstagedCounter = 0;

	$scope.workspace1Name = targetName;

	$scope.mergeInfo = $rootScope.mergeInfo;

	$scope.targetTime = $stateParams.targetTime;

	if($scope.targetTime !== 'latest'){
		$scope.targetIsTag = true;
	} else {
		$scope.targetIsTag = false;
	}

  $scope.stagingOrder = '';
  $scope.unstagingOrder = '';
  $scope.orderValues = [
    { name: 'Name', value: 'name' },
    { name: 'Type of Change', value: 'type' },
    { name: 'Type of Element', value: 'delta.type' },
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
		var modalInstance = $uibModal.open({
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
				treeNode = $scope.id2node[change.delta.id];

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
				treeNode = $scope.id2node[change.original.id];

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
				treeNode = $scope.id2node[change.original.id];

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
				treeNode = $scope.id2node[change.original.id];

				var currentParentNode = $scope.id2node[change.original.ownerId];
				var newParentNode = $scope.id2node[change.delta.ownerId];

				if (change.staged)
				{
// 					treeNode.status = "moved";

					// remove from current parent node
					index = findIndexByID(currentParentNode.children, change.original.id);
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
					index = findIndexByID(newParentNode.children, change.original.id);
					newParentNode.children.splice(index, 1);

				}
			}
			var i;
			if (change.staged)
			{
				treeNode.detail.stageStatus = "apply";
				$scope.stagedChanges.push(change);
				i = $scope.unstagedChanges.indexOf(change);
				if (i > -1)
					$scope.unstagedChanges.splice(i, 1);
			}
			else
			{
				treeNode.detail.stageStatus = "ignore";
				$scope.unstagedChanges.push(change);
				i = $scope.stagedChanges.indexOf(change);
				if (i > -1)
					$scope.stagedChanges.splice(i, 1);
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
			nodeId = change.delta.id;
		else
			nodeId = change.original.id;
		
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
					delete change.ws2object._read;
					delete change.ws2object._modified;
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

	var findIndexByID = function(array, id)
	{
			for (var i = 0; i < array.length; i++)
			{
				if (array[i].data.id === id)
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
		
		if (change.type === "added") elementId = change.delta.id;
		else elementId = change.original.id;
		
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

			// var emptyElement = { name: "", ownerId: "", documentation: "", specialization : { type: "", value_type: "", values: ""} };
			
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
					if (change.delta)
						change.typeIcon = UxService.getTypeIcon(change.delta.type);
					else
						change.typeIcon = UxService.getTypeIcon('Element');

					change.staged = false;
					change.ws2object = ws2object;

					change.properties = {};
					change.properties.name = {};
					change.properties.ownerId = {};
					change.properties.documentation = {};
					change.properties.qualifiedName = {};
					change.properties.id = {};

					updateChangeProperty(change.properties.name, "clean");
					updateChangeProperty(change.properties.ownerId, "clean");
					updateChangeProperty(change.properties.documentation, "clean");
					updateChangeProperty(change.properties.qualifiedName, "clean");
					updateChangeProperty(change.properties.id, "clean");

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
					if (element)
						node.type = element.type;
					else
						node.type = 'Element';
					node.children = [];

					// node.visible = true;
					node.status = status;

					return node;
				};

			var id2data = {};
			var id2node = {};

			ws1.elements.forEach(function(e)
			{
				id2data[e.id] = e;

				var node = createTreeNode(e, "clean", 'something');

				id2node[e.id] = node;

			});

			ws1.elements.forEach(function(e)
			{
				if (!id2node.hasOwnProperty(e.ownerId)) $rootScope.treeData.push(id2node[e.id]);
				else id2node[e.ownerId].children.push(id2node[e.id]);
			});

			// $scope.treeApi.refresh();
			// $scope.treeApi.expand_all();
			ws2.addedElements.forEach(function(e)
			{
				var emptyElement = {
					id: e.id,
					name: "",
					ownerId: "",
					documentation: "",
					specialization: {}
				};

				id2data[e.id] = e;

				var node = createTreeNode(e, "clean", "addition");

				id2node[e.id] = node;

				id2node[e.id].detail = {
					type: 'addition',
					stageStatus: 'ignore',
					icon: 'plus',
					iconType: 'added'
				};

				var change = createChange(e.name, emptyElement, e, "added", "fa-plus", e);

				updateChangeProperty(change.properties.name, "added");
				updateChangeProperty(change.properties.ownerId, "added");
				updateChangeProperty(change.properties.documentation, "added");
				updateChangeProperty(change.properties.qualifiedName, "added");
				updateChangeProperty(change.properties.id, "added");

				if (e.hasOwnProperty('specialization'))
				{
					Object.keys(e.specialization).forEach(function(property)
					{
						change.properties.specialization[property] = {};
						updateChangeProperty(change.properties.specialization[property], "added");
					});
				}

				$scope.changes.push(change);
				$scope.unstagedChanges.push(change);
				$scope.id2change[e.id] = change;

			});

			ws2.deletedElements.forEach(function(e)
			{
				var emptyElement = {
					id: e.id,
					name: "",
					ownerId: "",
					documentation: "",
					specialization: {}
				};

				var deletedElement = id2data[e.id];

				var change = createChange(deletedElement.name, deletedElement, emptyElement, "removed", "fa-times", e);

				id2node[e.id].detail = {
					type: 'deletion',
					stageStatus: 'ignore',
					icon: 'times',
					iconType: 'removed'
				};

				updateChangeProperty(change.properties.name, "removed");
				updateChangeProperty(change.properties.ownerId, "removed");
				updateChangeProperty(change.properties.documentation, "removed");
				updateChangeProperty(change.properties.qualifiedName, "removed");
				updateChangeProperty(change.properties.id, "removed");

				if (deletedElement.hasOwnProperty('specialization'))
				{
					Object.keys(deletedElement.specialization).forEach(function(property)
					{
						change.properties.specialization[property] = {};
						updateChangeProperty(change.properties.specialization[property], "removed");
					});
				}

				$scope.changes.push(change);
				$scope.unstagedChanges.push(change);
				$scope.id2change[e.id] = change;

			});

			ws2.updatedElements.forEach(function(e)
			{

				var updatedElement = id2data[e.id];

				var deltaElement = _.cloneDeep(updatedElement);

				var change = createChange(updatedElement.name, updatedElement, deltaElement, "updated", "fa-pencil", e);

				id2node[e.id].detail = {
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
				if (e.hasOwnProperty('ownerId'))
				{
					deltaElement.ownerId = e.ownerId;
					updateChangeProperty(change.properties.ownerId, "updated");
				}
				if (e.hasOwnProperty('documentation'))
				{
					deltaElement.documentation = e.documentation;
					updateChangeProperty(change.properties.documentation, "updated");
				}
				if (e.hasOwnProperty('qualifiedName'))
				{
					deltaElement.qualifiedName = e.qualifiedName;
					updateChangeProperty(change.properties.qualifiedName, "updated");
				}
				if (e.hasOwnProperty('id'))
				{
					deltaElement.id = e.id;
					updateChangeProperty(change.properties.id, "updated");
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
				$scope.unstagedChanges.push(change);
				$scope.id2change[e.id] = change;
			});

			// Added second pass to populate additions
			ws2.addedElements.forEach(function(e)
			{

				var treeNode = id2node[e.id];
				var parentNode = id2node[e.ownerId];

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

          var movedElement = id2data[e.id];

          var deltaElement = _.cloneDeep(movedElement);

          var change = createChange(movedElement.name, movedElement, deltaElement, "moved", "fa-arrows", e);

          if (e.hasOwnProperty('ownerId')) {
            deltaElement.ownerId = e.ownerId;
            updateChangeProperty(change.properties.ownerId, "moved");
          }

          $scope.changes.push(change);
          $scope.id2change[e.id] = change;

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
			size: "20%",
			min: '20px'
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