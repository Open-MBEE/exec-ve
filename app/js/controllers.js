'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('ConfigsCtrl', ["$scope", "$http", "$window", function($scope, $http, $window) {
    $scope.messages = {message:""};
    $scope.loading = true;
    $http({method: 'GET', url: '/alfresco/service/javawebscripts/configurations/' + $scope.currentSite}).
        success(function(data, status, headers, config) {
            $scope.configurations = data.configurations;
            $scope.loading = false;
        }).
        error(function(data, status, headers, config) {
            //$window.alert("loading configs failed!");
        });
    $scope.newFormButton = function() {
        if ($scope.hideNewForm)
            return "Create New Configuration";
        else
            return "Cancel";
    };
    $scope.hideNewForm = true;
    $scope.toggleNewForm = function() {
        $scope.hideNewForm = !$scope.hideNewForm;
    };
    $scope.createNew = function() {
        //$window.alert("sending " + $scope.newConfigName + " " + $scope.newConfigDesc);
        $http.post('/alfresco/service/javawebscripts/configurations/' + $scope.currentSite, 
            {"name": $scope.newConfigName, "description": $scope.newConfigDesc}).
            success(function(data, status, headers, config) {
                //$window.alert("success, wait for email");
                $scope.messages.message = "New Configuration Created! Please wait for an email notification.";
                $scope.hideNewForm = true;
            }).
            error(function(data, status, headers, config) {
                $scope.messages.message = "Creating new configuration failed!";
            });
    };
  }])
  .controller('ConfigCtrl', ["$scope", "$http", "$window", function($scope, $http, $window) {
    $scope.nodeid = $scope.config.nodeid;
    $scope.newConfigName = $scope.config.name;
    $scope.newConfigDesc = $scope.config.description;
    $scope.hide = true;
    $scope.toggleChangeFormButton = function() {
        if ($scope.hideChangeForm)
            return 'Change name or description';
        else
            return 'Cancel';
    };
    $scope.toggle = function() {
        $scope.hide = !$scope.hide;
    };
    $scope.hideChangeForm = true;
    $scope.toggleChangeForm = function() {
        $scope.hideChangeForm = !$scope.hideChangeForm;
    };
    $scope.change = function() {
        //$window.alert("sending " + $scope.newConfigName + " " + $scope.newConfigDesc + " " + $scope.nodeid);
        $http.post('/alfresco/service/javawebscripts/configurations/' + $scope.currentSite, 
            {"name": $scope.newConfigName, "description": $scope.newConfigDesc, "nodeid": $scope.nodeid}).
            success(function(data, status, headers, config) {
                $scope.messages.message = "Change Successful";
                $scope.config.name = $scope.newConfigName;
                $scope.config.description = $scope.newConfigDesc;
                $scope.hideChangeForm = true;
            }).
            error(function(data, status, headers, config) {
                $scope.messages.message = "Change Failed!";
            });
    };
  }]);