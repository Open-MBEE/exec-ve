'use strict';

/* Directives */

angular.module('myApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);

angular.module('Froala')
  .directive('froala', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        $(element).editable();
      }
    };
  });
