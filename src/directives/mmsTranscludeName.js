'use strict';

angular.module('mms')
.directive('mmsTranscludeName', ['ElementService', '$compile', '$modal', mmsTranscludeName]);

function mmsTranscludeName(ElementService, $compile, $modal) {

    var mmsTranscludeNameLink = function(scope, element, attrs, mmsViewCtrl) {
        var modalTemplate = '<mms-spec eid="{{eid}}" editable-field="name"></mms-spec><button ng-click="close()">Close</button>';
        
        element.on('click', function() {
            if (mmsViewCtrl === null || !mmsViewCtrl.isEditable())
                return false;
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
            });
        });
    };

    return {
        restrict: 'E',
        template: '{{element.name}}',
        scope: {
            eid: '@',
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsTranscludeNameLink
    };
}