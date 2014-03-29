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
  }]);

// Declare module for Froala
angular.module('Froala', ['ui.router', 'mms'])
  .controller('FroalaCtrl', ['$scope', 'ElementService', function($scope, ElementService) {
    $scope.insertElement = function() {
        ElementService.getElement(document.getElementById("element-id-input").value).then(function(data) {
        });
    };
  }]);
