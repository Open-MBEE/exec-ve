'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['ui.router', 'mms'])
  
  .controller('OneCtrl', ["$scope", "ElementService", function($scope, ElementService) {
    ElementService.getElement('_17_0_2_3_407019f_1386871384972_702931_26371').then(function(data) {
        $scope.element = data;
    });
    
    $scope.change = function() {
        ElementService.updateElement({id: '_17_0_2_3_407019f_1386871384972_702931_26371', name: 'Stuff'}).then(function(data) {
            //$scope.$apply();
        });
    };
  }]).controller('TwoCtrl', ["$scope", "ElementService", function($scope, ElementService) {
    ElementService.getElement('_17_0_2_3_407019f_1386871384972_702931_26371').then(function(data) {
        $scope.element = data;
    });
    
    $scope.change = function() {
        ElementService.updateElement({id: '_17_0_2_3_407019f_1386871384972_702931_26371', name: 'Stuff'}).then(function(data) {
            //$scope.$apply();
        });
    };
  }]);
