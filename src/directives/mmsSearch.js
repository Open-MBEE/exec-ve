'use strict';

angular.module('mms.directives')
.directive('mmsSearch', ['$rootScope','$templateCache', mmsSearch]);

function mmsSearch($rootScope,$templateCache) {
    var template = $templateCache.get('mms/templates/mmsSearch.html');

    var mmsSearchLink = function(scope, element, attrs) {
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
        scope.userResultClick = function(elem, property) {
            if (scope.mmsOptions.callback) {
                scope.mmsOptions.callback(elem, property);
            }
        };
        scope.userRelatedClick = function(event, doc, view, elem) {
            event.preventDefault();
            event.stopPropagation();
            if (scope.mmsOptions.relatedCallback)
                scope.mmsOptions.relatedCallback(doc, view, elem);
        };
    };

    return {
        restrict: 'E', 
        template: template,
        link: mmsSearchLink,
        scope: {
            mmsOptions: '=',
            search: '=',
        },
    };
}