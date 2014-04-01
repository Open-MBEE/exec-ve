'use strict';

angular.module('mms')
.directive('mmsFroala', ['ElementService', '$modal', '_', mmsFroala]);

function mmsFroala(ElementService, $modal, _) { //depends on angular bootstrap
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {},
        link: function(scope, element, attrs, ngModelCtrl) {
            function read() {
                var html = element.editable("getHTML"); //if froala editor is in html mode, this becomes empty textarea
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
                inlineMode: false,
                contentChangedCallback: function() {
                    scope.$apply(read);
                    //read();
                },
                imageUploadURL: '', //prevent default upload to public url
                placeholder: 'Placeholder, currently empty',
                spellcheck: true,
                customButtons: {
                    transclude: {
                        title: 'Transclude',
                        icon: {
                            type: 'txt',
                            value: 't'
                        },
                        callback: function(editor) {
                            var instance = $modal.open({
                                template: 'Element id: <input type="text" ng-model="input.eid"/><br/>Property: <input type="text" ng-model="input.prop"/><br/><button ng-click="save()">Save</button>',
                                scope: scope,
                                controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
                                    $scope.input = {eid: '', prop: ''};
                                    $scope.save = function() {
                                        var tag = '<mms-transclude-' + $scope.input.prop + ' eid="' + $scope.input.eid + '"></mms-transclude-' + $scope.input.prop + '>';
                                        $modalInstance.close(tag);
                                    };
                                }],
                            });
                            instance.result.then(function(tag) {
                                editor.insertHTML(tag); //froala strips unknown html tags (or to mms), this doesn't work
                            });
                        }
                    }
                }
            });

            ngModelCtrl.$render = function() {
                element.editable("setHTML", ngModelCtrl.$viewValue || '');
            };

            scope.$on('$destroy', function() {
                element.editable("destroy");
            });
        }
    };
}
