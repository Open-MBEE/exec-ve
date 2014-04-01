'use strict';

angular.module('mms')
.directive('mmsTranscludeDoc', ['ElementService', '$compile', '$modal', mmsTranscludeDoc]);

function mmsTranscludeDoc(ElementService, $compile, $modal) {

    return {
        restrict: 'E',
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
                    var doc = scope.element.documentation;
                    var el = $compile(doc)(scope);
                    element.append(el);
                    //element.append(scope.element[scope.property]);
                    //$compile(element.contents())(scope);
                    scope.$watch('element.documentation', function(n, o) {
                        element.empty();
                        doc = scope.element.documentation;
                        var el = $compile(doc)(scope);
                        element.append(el);
                        //element.append(scope.element[scope.property]);
                        //$compile(element.contents())(scope);
                    });
                });
            });
        }
    };
}