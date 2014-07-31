'use strict';

angular.module('mms.directives')
.directive('mmsDiffTree', ['$templateCache', 'DiffService', mmsDiffTree]);

function mmsDiffTree($templateCache, DiffService) {

  var MMSDiffTreeLink = function (scope, element, attrs) {
    // Diff the two workspaces picked in the Workspace Picker
    var response = DiffService.diff('ws1', 'ws2');
    var originals = response.workspace1.elements;
    var deltas = response.workspace2;

    // Populate the left pane containment tree
    scope.elementNames = [];
    angular.forEach(originals, function(value, key) {
      scope.elementNames.push(value.name);
    });

    // Proxy function called with ngClick in template
    scope.loadTableWithElement = function(elem) {
      DiffService.loadTableWithElement(elem);
    };
  };
  
  var MMSDiffTreeTemplate = $templateCache.get('mms/templates/mmsDiffTree.html');

  return {
    restrict: 'E',
    template: MMSDiffTreeTemplate,
    link: MMSDiffTreeLink
  };
}