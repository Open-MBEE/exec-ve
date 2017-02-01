'use strict';

angular.module('mmsApp')
.directive('currentTag',['$rootScope', currentTag]);

function currentTag($rootScope){

  var currentTagLink = function(scope, element, attrs){
    var tag = $rootScope.mms_tag;
    if (!tag)
      scope.tag = 'latest';
    else {
      scope.tag = tag.name;
    }
  };

  return {
    restrict: 'E',
    template: 'Current Tag: {{ tag }}',
    link: currentTagLink
  };
}
