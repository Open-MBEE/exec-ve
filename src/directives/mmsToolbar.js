'use strict';

angular.module('mms.directives')
.directive('mmsToolbar', ['$templateCache', '$rootScope', 'toolService', mmsToolbar]);

function mmsToolbar($templateCache, $rootScope, toolService){
	var template = $templateCache.get('mms/templates/mmsToolbar.html');
	$rootScope.elementIsOpen = false;
	$rootScope.editorIsOpen = false;
	$rootScope.reorderIsOpen = false;

	var mmsToolbarLink = function(scope, element, attrs, rootScope){
		scope.tools = [
			{tooltype: "viewer", icon: "fa-eye", selected: false},
			{tooltype: "editor", icon: "fa-edit", selected: false},
			{tooltype: "reorder", icon: "fa-arrows", selected: false}
		];

		scope.setVal = function(str){
			toolService.selectTool(str);
			switch(str){
				case "viewer":
					scope.tools[0].selected = true;
					scope.tools[1].selected = false;
					scope.tools[2].selected = false;
					break;

				case "editor":
					scope.tools[0].selected = false;
					scope.tools[1].selected = true;
					scope.tools[2].selected = false;
					break;

				case "reorder": 
					scope.tools[0].selected = false;
					scope.tools[1].selected = false;
					scope.tools[2].selected = true;
					break;

				default:
					scope.tools[0].selected = false;
					scope.tools[1].selected = false;
					scope.tools[2].selected = false;
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
					console.log("Viewer Selected");
					break;

				case "editor":
					$rootScope.elementIsOpen = false;
					$rootScope.editorIsOpen = true;
					$rootScope.reorderIsOpen = false;
					console.log("Editor Selected");
					break;

				case "reorder":
					$rootScope.elementIsOpen = false;
					$rootScope.editorIsOpen = false;
					$rootScope.reorderIsOpen = true;
					console.log("Reordering Selected");
					break;

				default: 
					$rootScope.elementIsOpen = false;
					$rootScope.editorIsOpen = false;
					$rootScope.reorderIsOpen = false;
					break;
			}			
		}
	};
});