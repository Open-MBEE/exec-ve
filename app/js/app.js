'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', ['ui.router', 'mms'])
  
  .controller('ElementCtrl', ["$scope", "ElementService", function($scope, ElementService) {
    ElementService.getElement($scope.elementid).then(function(data) {
        $scope.element = data;
    });

    $scope.changeElement = function() {
        $scope.elementid = $scope.elementid == "_17_0_2_3_407019f_1386871384972_702931_26371" ? "_17_0_2_3_407019f_1390507392384_798171_29256" : "_17_0_2_3_407019f_1386871384972_702931_26371";
        ElementService.getElement($scope.elementid).then(function(data) {
            $scope.element = data;
        });
    };
  }])
  .config(function($stateProvider, $urlRouterProvider){
    $stateProvider
        .state('view', {
            url: '/view/:viewId',
            views: {
                'center': {
                    template: '<mms-view vid="{{vid}}" transclude-clicked="tscClicked(elementId)"></mms-view>',
                    controller: function($scope, viewid, $state) {
                        $scope.vid = viewid.viewid;
                        $scope.tscClicked = function(elementId) {
                            $state.go('element', {viewId: $scope.vid, elementId: elementId});
                        };
                    },
                    resolve: {
                        viewid: function($stateParams) {
                            return {viewid: $stateParams.viewId};
                        }
                    }
                }
            }
        })
        .state('element', {
            url: '/view/:viewId/element/:elementId',
            views: {
                'right': {
                    template: '<h5>Element Spec</h5><mms-spec eid="{{eid}}" editable-field="all" transcludable-elements="viewElements"></mms-spec>',
                    controller: function($scope, viewid, viewElements, elementId) {
                        $scope.viewid = viewid.viewid;
                        $scope.viewElements = viewElements;
                        $scope.eid = elementId.elementid;
                    },
                    resolve: {
                        viewid: function($stateParams) {
                            return {viewid: $stateParams.viewId};
                        },
                        viewElements: function($stateParams, ViewService) {
                            return ViewService.getViewAllowedElements($stateParams.viewId);
                        },
                        elementId: function($stateParams) {
                            return {elementid: $stateParams.elementId};
                        }
                    }
                },
                'center': {
                    template: '<mms-view vid="{{vid}}" transclude-clicked="tscClicked(elementId)"></mms-view>',
                    controller: function($scope, viewid, $state) {
                        $scope.vid = viewid.viewid;
                        $scope.tscClicked = function(elementId) {
                            $state.go('element', {viewId: $scope.vid, elementId: elementId});
                        };
                    },
                    resolve: {
                        viewid: function($stateParams) {
                            return {viewid: $stateParams.viewId};
                        }
                    }
                }
            }
        });

  });

// Declare module for Froala
angular.module('Froala', ['ui.router', 'mms'])
  .controller('FroalaCtrl', ['$scope', '$compile', 'ElementService', function($scope, $compile, ElementService) {
    $scope.insertElement = function() {
        var p = ElementService.getElement(document.getElementById("element-id-input").value);

        // if success, insert the text then unwrap the content from the span tag
        p.then(function(data) {
            var ins = $compile('<mms-transclude-name eid="'
                              + data.id
                              + '" class="ng-isolate-scope ng-binding"></mms-transclude-name>')($scope);
            angular.element('#marker-true').html(ins);
            angular.element('#marker-true').contents().unwrap();
        });

        // if error, clean up all markers
        p.catch(function(data) {
            angular.element('span[id*=marker-true').remove();
        });
    };

    $scope.cleanUp = function() {
        angular.element('span[id*=marker-true').remove();
    };

  }]);
