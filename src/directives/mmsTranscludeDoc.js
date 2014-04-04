'use strict';

angular.module('mms')
.directive('mmsTranscludeDoc', ['ElementService', '$compile', '$modal', mmsTranscludeDoc]);

function mmsTranscludeDoc(ElementService, $compile, $modal) {

    var mmsTranscludeDocLink = function(scope, element, attrs, mmsViewCtrl) {
        var modalTemplate = '<mms-spec eid="{{eid}}" editable-field="documentation"></mms-spec><button ng-click="close()">Close</button>';
        if (mmsViewCtrl !== null) {
            modalTemplate = '<mms-spec eid="{{eid}}" editable-field="documentation" transcludable-elements="viewElements"></mms-spec><button ng-click="close()">Close</button>';
        }

        element.on('click', function() {
            if (mmsViewCtrl === null || !mmsViewCtrl.isEditable())
                return false;
            mmsViewCtrl.getViewAllowedElements().then(function(elems) {
                    scope.viewElements = elems;
            });
            $modal.open({
                template: modalTemplate,
                scope: scope,
                controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
                    $scope.close = function() {
                        $modalInstance.close(true);
                    };
                }]
            });
            return false;
        });

        scope.$watch('eid', function(newVal, oldVal) {
            if (newVal === undefined || newVal === null || newVal === '')
                return;
            ElementService.getElement(scope.eid).then(function(data) {
                scope.element = data;
                var doc = scope.element.documentation;
                var el = $compile(doc)(scope);
                element.append(el);
                scope.$watch('element.documentation', function(n, o) {
                    element.empty();
                    doc = scope.element.documentation;
                    var el = $compile(doc)(scope);
                    element.append(el);
                });
            });
        });
    };

    return {
        restrict: 'E',
        scope: {
            eid: '@',
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsTranscludeDocLink
    };
}