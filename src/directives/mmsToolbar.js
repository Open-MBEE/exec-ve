'use strict';

angular.module('mms.directives')
.directive('mmsToolbar', ['$templateCache', mmsToolbar]);

function mmsToolbar($templateCache){
	var template = $templateCache.get('mms/templates/mmsToolbar.html');

	var mmsToolbarLink = function(scope, element, attrs){
		scope.tools = [
			{tooltype: "viewer", icon: "fa-eye"},
			{tooltype: "editor", icon: "fa-edit"},
			{tooltype: "reorder", icon: "fa-arrows"}
		];
	};

	return {
		restrict: 'E', 
		template: template,
		link: mmsToolbarLink
	};
}