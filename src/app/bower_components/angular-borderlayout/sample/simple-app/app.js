var app = angular.module('app',
  ["fa.directive.borderLayout", "ngAnimate", "ngRoute"]);

app.config(function ($routeProvider) {
  $routeProvider.when("/", {
    templateUrl: "home.html"
  });
  $routeProvider.when("/home", {
    templateUrl: "home.html"
  });
  $routeProvider.when("/about", {
    templateUrl: "about.html"
  });
});

app.controller('MainCtrl', function ($scope) {
  $scope.name = 'World';
  $scope.panes = ["north", "south"];
});
