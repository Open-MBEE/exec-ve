'use strict';

angular.module('mms.directives')
.directive('mmsSearchResults', ['$rootScope','$templateCache', mmsSearchResults]);

function mmsSearchResults($rootScope,$templateCache) {
    var template = $templateCache.get('mms/templates/mmsSearchResults.html');

    var mmsSearchResultsLink = function(scope, element, attrs) {
        scope.$watch('search', function(newVal) {
            if (!newVal)
                return;
            newVal.forEach(function(elem) {
                if (elem.properties && elem.properties[0]) {
                    var properties = [];
                    for (var i = 0; i < elem.properties.length; i++) {
                        if (i % 3 === 0) {
                            properties.push([]);
                        }
                        properties[properties.length-1].push(elem.properties[i]);
                    }
                    elem.properties = properties;
                }
            });
        });
        
        scope.facet = '$';
        scope.filterQuery = {query: ""};
        scope.$watchGroup(['filterQuery.query', 'facet'], function(newVal, oldVal) {
            scope.searchFilter = {};
            scope.searchFilter[scope.facet] = scope.filterQuery.query;
        });
    
        scope.setFilterFacet = function(filterFacet) {
            if (filterFacet === 'all') 
                scope.facet = '$';
            else
                scope.facet = filterFacet;
            angular.element('.search-filter-type button').removeClass('active');
            angular.element('.btn-filter-facet-' + filterFacet).addClass('active');
        };

        // Set options 
        scope.emptyDocTxt = scope.mmsOptions.emptyDocTxt;
        scope.userResultClick = function(elementId, property, name) {
            if (scope.mmsOptions.callback) {
                scope.mmsOptions.callback(elementId,property,name);
            }
        };
        scope.userRelatedClick = function(event, siteId, documentId, viewId) {
            event.preventDefault();
            event.stopPropagation();
            if (scope.mmsOptions.relatedCallback)
                scope.mmsOptions.relatedCallback(siteId, documentId, viewId);
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