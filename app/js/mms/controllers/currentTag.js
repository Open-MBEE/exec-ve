'use strict';

angular.module('mmsApp')
.directive('currentTag',['$rootScope', currentTag]);

function currentTag($rootScope){

  var currentTagLink = function(scope, element, attrs){
    scope.tag = $rootScope.mmsTag;

    if (scope.tag === "")
      scope.tag = 'latest';
  };

  return {
    restrict: 'E',
    template: 'Current Tag: {{ tag }}',
    link: currentTagLink
  };
}
