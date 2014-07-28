'use strict';

angular.module('mms.directives')
.directive('mmsDiffTable', ['$templateCache', mmsDiffTable]);

function mmsDiffTable($templateCache) {
  var template = $templateCache.get('mms/templates/mmsDiffTable.html');

  var link = function(scope, element, attrs) {
  };

  return {
    restrict: 'E',
    template: template,
    link: link
  };
}