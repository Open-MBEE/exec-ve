'use strict';

angular.module('mms.directives.diff')
.directive('mmsDiffTree', ['$templateCache', 'DiffService', mmsDiffTree]);

function mmsDiffTree($templateCache, DiffService) {
  
  var MMSDiffTreeController = function($scope) {
    // Diff the two workspaces picked in the Workspace Picker
    var response = DiffService.diff('ws1', 'ws2');
    var originals = response.workspace1.elements;
    var deltas = response.workspace2;

    // Populate the left pane containment tree
    $scope.elementNames = [];
    angular.forEach(originals, function(value, key) {
      $scope.elementNames.push(value.name);
    });

    // Proxy function called with ngClick in template
    $scope.loadTableWithElement = function(element) {
      DiffService.loadTableWithElement(element);
    };
  };

  var MMSDiffTreeTemplate = $templateCache.get('mms/templates/mmsDiffTree.html');

  return {
    restrict: 'E',
    template: MMSDiffTreeTemplate,
    controller: ['$scope', MMSDiffTreeController]
  };
}