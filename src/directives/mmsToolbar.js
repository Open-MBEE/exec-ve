'use strict';

angular.module('mms.directives')
.directive('mmsToolbar', ['$templateCache', '$rootScope', 'toolService', '$stateParams', 'ConfigService', 'ElementService', mmsToolbar]);

function mmsToolbar($templateCache, $rootScope, toolService, $stateParams, ConfigService){
	var template = $templateCache.get('mms/templates/mmsToolbar.html');
	$rootScope.elementIsOpen = true;
	$rootScope.editorIsOpen = false;
	$rootScope.reorderIsOpen = false;
	$rootScope.showVersionList = false;
	var hasPermission;
	
	$rootScope.$on('viewDataLoaded', function(){
		hasPermission = $rootScope.hasEditingPermission;
		$rootScope.$broadcast('test', $rootScope.hasEditingPermission);
	});

	var mmsToolbarLink = function(scope, $rootScope, element, attrs, $stateParams, ConfigService, ElementService){
		scope.tools = [
			{tooltype: "viewer", icon: "fa-eye", selected: true, permission: true},
			{tooltype: "editor", icon: "fa-edit", selected: false, permission: hasPermission},
			{tooltype: "reorder", icon: "fa-arrows", selected: false, permission: hasPermission},
			{tooltype: "versions", icon: "fa-camera", selected: false, permission: true}
		];

		scope.$on('test', function(){
			scope.tools[1].permission = hasPermission;
			scope.tools[2].permission = hasPermission; 
		});

		// $rootScope.$on('viewDataLoaded', function(){
		//	console.log($rootScope.hasEditingPermission);
		// });

		scope.setVal = function(str){
			toolService.selectTool(str);
			switch(str){
				case "viewer":
					scope.tools[0].selected = true;
					scope.tools[1].selected = false;
					scope.tools[2].selected = false;
					scope.tools[3].selected = false;
					break;

				case "editor":
					scope.tools[0].selected = false;
					scope.tools[1].selected = true;
					scope.tools[2].selected = false;
					scope.tools[3].selected = false;
					break;

				case "reorder": 
					scope.tools[0].selected = false;
					scope.tools[1].selected = false;
					scope.tools[2].selected = true;
					scope.tools[3].selected = false;
					break;

				case "versions":
					scope.tools[0].selected = false;
					scope.tools[1].selected = false;
					scope.tools[2].selected = false;
					scope.tools[3].selected = true;
					break;

				default:
					scope.tools[0].selected = true;
					scope.tools[1].selected = false;
					scope.tools[2].selected = false;
					scope.tools[3].selected = false;
					break;
			}

		};
	};

	return {
		restrict: 'E', 
		template: template,
		link: mmsToolbarLink
	};
}

angular.module('mms.directives')
.factory('toolService', function ($rootScope){
	return {
		selectTool: function(str){
			switch(str){
				case "viewer":
					$rootScope.elementIsOpen = true;
					$rootScope.editorIsOpen = false;
					$rootScope.reorderIsOpen = false;
					$rootScope.showVersionList = false;
					break;

				case "editor":
					$rootScope.elementIsOpen = false;
					$rootScope.editorIsOpen = true;
					$rootScope.reorderIsOpen = false;
					$rootScope.showVersionList = false;
					break;

				case "reorder":
					$rootScope.elementIsOpen = false;
					$rootScope.editorIsOpen = false;
					$rootScope.reorderIsOpen = true;
					$rootScope.showVersionList = false;
					break;

				case "versions":
					$rootScope.elementIsOpen = false;
					$rootScope.editorIsOpen = false;
					$rootScope.reorderIsOpen = false;
					$rootScope.showVersionList = true;
					break;

				default: 
					$rootScope.elementIsOpen = true;
					$rootScope.editorIsOpen = false;
					$rootScope.reorderIsOpen = false;
					$rootScope.showVersionList = false;
					break;
			}			
		}
	};
});