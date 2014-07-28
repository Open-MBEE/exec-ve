'use strict';

angular.module('mms.directives')
.directive('mmsDiffTree', ['$templateCache', mmsDiffTree]);

function mmsDiffTree($templateCache) {
  var template = $templateCache.get('mms/templates/mmsDiffTree.html');

  var link = function(scope, element, attrs) {
  };

  return {
    restrict: 'E',
    template: template,
    link: link
  };
}