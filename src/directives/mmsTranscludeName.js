'use strict';

angular.module('mms')
.directive('mmsTranscludeName', ['ElementService', '$compile', '$modal', mmsTranscludeName]);

function mmsTranscludeName(ElementService, $compile, $modal) {

    return {
        restrict: 'E',
        template: '{{element.name}}',
        scope: {
            eid: '@',
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: function(scope, element, attrs, mmsViewCtrl) {
            scope.$watch('eid', function(newVal, oldVal) {
                if (newVal === undefined || newVal === null || newVal === '')
                    return;
                element.on('click', function() {
                    $modal.open({
                        template: '<mms-spec eid="{{eid}}"></mms-spec><button ng-click="close()">Close</button>',
                        scope: scope,
                        controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
                            $scope.close = function() {
                                $modalInstance.close(true);
                            };
                        }]
                    });
                });
                element.hover(function() {
                    element.css('cursor', 'pointer');
                }, function() {
                    element.css('cursor', 'default');
                });
                ElementService.getElement(scope.eid).then(function(data) {
                    scope.element = data;
                });
            });
        }
    };
}