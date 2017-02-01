'use strict';

angular.module('mmsApp')
.directive('currentTag',['$rootScope', currentTag]);

/**
* @ngdoc directive
* @name mmsApp.directive:currentTag
*
* @restrict E
*
* @description
* Displays the current tag in which the view resides
*
* ##Example
* <current-tag></current-tag>
*
*/
function currentTag($rootScope){

  var currentTagLink = function(scope, element, attrs){
    var tag = $rootScope.mms_tag;
    if (!tag || tag.name === 'latest') //if undefined (latest may be undefined)
      scope.tag = 'Latest';
    else {
      scope.tag = tag.name;
    }
  };

  return {
    restrict: 'E',
    scope: {},
    template: 'Current Tag: {{ tag }}',
    link: currentTagLink
  };
}
