'use strict';

/* Directives */

angular.module('myApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);

/**
 * Creates the "froala" attribute that makes an HTML element editable with
 * Froala.
 */
angular.module('Froala')
  .directive('froala', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        jQuery(element).editable({
          buttons: ['undo', 'redo', 'sep', 'transclude'],

          // Define custom buttons.
          customButtons: {
            transclude: {
              title: 'Transclude',
              icon: {
                type: 'txt',
                value: 't'
              },
              callback: function (editor) {
                alert('Transclusion occurs')
              }
            }
          }
        });
      }
    };
  });
