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
      require: '?ngModel',
      link: function(scope, element, attrs, ngModel) {
        if (!ngModel) return;

        ngModel.$render = function() {
          element.html(ngModel.$viewValue || '');
        }

        element.ready(function() {
          scope.$apply(read);
        });
        element.on('blur keyup change', function() {
          scope.$apply(read);
        });
        
        read();

        function read() {
          var html = element.html();
          if (attrs.stripBr && html == '<br>') {
            html = '';
          }
          ngModel.$setViewValue(html);
        }

        // Set up Froala
        angular.element(element).editable({
          buttons: ['bold', 'italic', 'underline', 'strikethrough', 'fontsize', 'color', 'sep',
                    'formatBlock', 'align', 'insertOrderedList', 'insertUnorderedList', 'outdent', 'indent', 'sep',
                    'createLink', 'insertImage', 'insertVideo', 'undo', 'redo', 'html', 'sep',
                    'transclude'],

          // Define custom buttons.
          customButtons: {
            transclude: {
              title: 'Transclude',
              icon: {
                type: 'txt',
                value: 't'
              },
              callback: function(editor) {
                editor.placeMarker(editor.getRange(), true);
                editor.hide();
                angular.element('#menu').modal('show');
              }
            }
          }
        });
      }
    };
  });
