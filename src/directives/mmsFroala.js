'use strict';

angular.module('mms.directives')
.directive('mmsFroala', ['ElementService', '$modal', '$templateCache', '_', mmsFroala]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsFroala
 *
 * @requires mms.ElementService
 * @requires $modal
 *
 * @restrict A
 *
 * @description
 * Make any div with an ngModel attached to be a Froala content editable. This
 * requires the Froala library. Transclusion is supported. ngModel is required.
 *
 * @param {Array=} transcludableElements Array of element objects as returned by ElementService
 *      that can be transcluded. Regardless, transclusion allows keyword searching 
 *      elements to transclude from alfresco
 */
function mmsFroala(ElementService, $modal, $templateCache, _) { //depends on angular bootstrap
    
    var mmsFroalaLink = function(scope, element, attrs, ngModelCtrl) {
        var transcludeModalTemplate = $templateCache.get('mms/templates/mmsFroala.html');

        var modalCtrl = function($scope, $modalInstance) {
            $scope.filter = '';
            $scope.searchText = '';
            $scope.choose = function(elementId, property, name) {
                var tag = '<mms-transclude-' + property + ' eid="' + elementId + '">[cf:' + name + '.' + property + ']</mms-transclude-' + property + '>';
                $modalInstance.close(tag);
            };
            $scope.cancel = function() {
                $modalInstance.dismiss();
            };
            $scope.search = function(searchText) {
                //var searchText = $scope.searchText; //TODO investigate why searchText isn't in $scope
                ElementService.search(searchText).then(function(data) {
                    $scope.transcludableElements = data;
                });
            };
        };

        var transcludeCallback = function(editor) {
            editor.saveSelection(); //this is needed to preserve editor selection used by insertHTML
            var instance = $modal.open({
                template: transcludeModalTemplate,
                scope: scope,
                controller: ['$scope', '$modalInstance', modalCtrl],
            });
            instance.result.then(function(tag) {
                editor.restoreSelection();
                editor.saveUndoStep();
                editor.insertHTML(tag);
                editor.saveUndoStep();
            });
        };

        function read() {
            var html = element.editable("getHTML"); 
            if (_.isArray(html))
                html = html.join('');
            ngModelCtrl.$setViewValue(html);
        }

        element.html(ngModelCtrl.$viewValue);

        element.editable({
            buttons: ['bold', 'italic', 'underline', 'strikethrough', 'fontsize', 'color', 'sep',
                'formatBlock', 'align', 'insertOrderedList', 'insertUnorderedList', 'outdent', 'indent', 'sep',
                'createLink', 'insertImage', 'insertVideo', 'undo', 'redo', 'html', 'sep',
                'transclude'],
            inlineMode: true,
            autosaveInterval: 1000,
            contentChangedCallback: function() {
                //scope.$apply(read);
                read();
            },
            imageUploadURL: '', //prevent default upload to public url
            placeholder: 'Placeholder, currently empty',
            spellcheck: true,
            customButtons: {
                transclude: {
                    title: 'crossReference',
                    icon: {
                        type: 'txt',
                        value: 'cf'
                    },
                    callback: transcludeCallback
                }
            }
        });

        ngModelCtrl.$render = function() {
            element.editable("setHTML", ngModelCtrl.$viewValue || '');
        };

        scope.$on('$destroy', function() {
            element.editable("destroy");
        });
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            transcludableElements: '='
        },
        link: mmsFroalaLink
    };
}
