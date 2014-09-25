'use strict';

angular.module('mms.directives')
.directive('mmsFooter', ['$templateCache', mmsFooter]);

function mmsFooter($templateCache) {
	var template = $templateCache.get('mms/templates/mmsFooter.html');
	
	return {
		restrict: 'E', 
		template: template,
        transclude: true
	};
}