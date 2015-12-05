'use strict';

angular.module('mms.directives')
.directive('mmsSearchResults', ['$rootScope','$templateCache', mmsSearchResults]);

function mmsSearchResults($rootScope,$templateCache) {
	var template = $templateCache.get('mms/templates/mmsSearchResults.html');

	var mmsSearchResultsLink = function(scope, element, attrs) {
		scope.facet = '$';
    scope.filterQuery = {query: ""};
    scope.$watchGroup(['filterQuery.query', 'facet'], function(newVal, oldVal){
        scope.searchFilter = {};
        scope.searchFilter[scope.facet] = scope.filterQuery.query;
    });

    scope.setFilterFacet = function(filterFacet) {
        if(filterFacet === 'all') scope.facet = '$';
        else  scope.facet = filterFacet;
        angular.element('.search-filter-type button').removeClass('active');
        angular.element('.btn-filter-facet-' + filterFacet).addClass('active');
    };

    scope.emptyDocTxt = scope.mmsOptions.emptyDocTxt;
    scope.userResultClick = function(elementId, property, name) {
      if (scope.mmsOptions.callback && scope.mmsOptions.type === 'center-search') {
        scope.mmsOptions.callback(elementId);
      } else if (scope.mmsOptions.callback && scope.mmsOptions.type === 'modal-search')  {
        scope.mmsOptions.callback(elementId,property,name);
      }
    };
	};

	return {
		restrict: 'E', 
		template: template,
    link: mmsSearchResultsLink,
    scope: {
        mmsOptions: '=',
        search: '=',
    },
	};
}