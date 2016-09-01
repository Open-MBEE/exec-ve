'use strict';

angular.module('mms.directives')
.directive('mmsSearch', ['ElementService', 'growl', '$rootScope','$templateCache', 'mmsRootSites', mmsSearch]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsSearch
 *
 * @restrict E
 *
 * @description
 * TBA
 *
 */
function mmsSearch(ElementService, growl, $rootScope, $templateCache, mmsRootSites) {
    var template = $templateCache.get('mms/templates/mmsSearch.html');

    var mmsSearchLink = function(scope, element, attrs) {
        scope.paginationCache=[];
        scope.searchClass = "";
        scope.proposeClass = "";
        scope.filter = '';
        scope.searchText = '';
        scope.searchType = 'all';
        scope.facet = '$';
        scope.filterQuery = {query: ""};
        scope.currentPage = 0;
        scope.itemsPerPage = 50;
        scope.ws = scope.mmsWs ? scope.mmsWs : 'master';

        scope.$watchGroup(['filterQuery.query', 'facet'], function(newVal, oldVal) {
            scope.resultFilter = {};
            scope.resultFilter[scope.facet] = scope.filterQuery.query;
        });
        scope.$watch('searchResults', function(newVal) {
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
                    elem.properties2 = properties;
                }
            });
        });

        scope.next = function() {
            if(scope.paginationCache[scope.currentPage+1]){
                scope.searchResults= scope.paginationCache[scope.currentPage+1];
                scope.currentPage += 1;   
            }
            else{
                scope.search(scope.searchText, scope.currentPage + 1, scope.itemsPerPage);
            }
        };

        scope.prev = function() {
            if(scope.paginationCache[scope.currentPage-1]){
                scope.searchResults= scope.paginationCache[scope.currentPage-1];
                scope.currentPage -= 1;   
            }
            else{
                scope.search(scope.searchText, scope.currentPage - 1, scope.itemsPerPage);
            }
        };

        scope.setSearchType = function(searchType) {
            scope.searchType = searchType;
            angular.element('.btn-search-all').removeClass('active');
            angular.element('.btn-search-name').removeClass('active');
            angular.element('.btn-search-documentation').removeClass('active');
            angular.element('.btn-search-value').removeClass('active');
            angular.element('.btn-search-id').removeClass('active');
            angular.element('.btn-search-' + searchType).addClass('active');
        };
        scope.setFilterFacet = function(filterFacet) {
            if (filterFacet === 'all') 
                scope.facet = '$';
            else
                scope.facet = filterFacet;
            angular.element('.search-filter-type button').removeClass('active');
            angular.element('.btn-filter-facet-' + filterFacet).addClass('active');
        };
        function filterBySites(data) {
            var data1 = [];
            var qualified, i;
            if (mmsRootSites && mmsRootSites.length > 0) {
                for (i = 0; i < data.length; i++) {
                    if (data[i].qualifiedId) {
                        qualified = data[i].qualifiedId.split('/');
                        if (qualified.length > 1 && mmsRootSites.indexOf(qualified[1]) >= 0) {
                            data1.push(data[i]);
                        }
                    }
                }
            } else {
                data1 = data;
            }
            return data1;
        }
        scope.search = function(searchText, page, numItems) {
            scope.searchClass = "fa fa-spin fa-spinner";
            if (scope.searchType === 'all')
              scope.searchType = '*';
            ElementService.search(searchText, [scope.searchType], null, page, numItems, false, scope.mmsWs, 2)
            .then(function(data) {
                var data1 = filterBySites(data);
                if (scope.mmsOptions.filterCallback) {
                  scope.searchResults = scope.mmsOptions.filterCallback(data1);
                } else {
                  scope.searchResults = data1;
                }
                scope.searchClass = "";
                scope.currentPage = page;
                scope.paginationCache.push(scope.searchResults);
            }, function(reason) {
                growl.error("Search Error: " + reason.message);
                scope.searchClass = "";
            });
        };

        // Set options 
        if (scope.mmsOptions.searchResult) {
            var data1 = filterBySites(scope.mmsOptions.searchResult);
            scope.searchResults = data1;
            scope.paginationCache.push(data1);
        }
        if (scope.mmsOptions.searchInput) {
            scope.searchText = scope.mmsOptions.searchInput;          
        }
        if (scope.mmsOptions.itemsPerPage) {
            scope.itemsPerPage = scope.mmsOptions.itemsPerPage;
        }
        scope.emptyDocTxt = scope.mmsOptions.emptyDocTxt;
        scope.userResultClick = function(elem, property) {
            if (scope.mmsOptions.callback) {
                scope.mmsOptions.callback(elem, property, scope.mmsOptions.nonEditableCheckbox);
            }
        };
        scope.userRelatedClick = function(event, doc, view, elem) {
            event.preventDefault();
            event.stopPropagation();
            if (scope.mmsOptions.relatedCallback)
                scope.mmsOptions.relatedCallback(doc, view, elem);
        };
        scope.newSearch = function(searchText, page, numItems){
            scope.paginationCache=[];
            console.log(scope.paginationCache.length);
            scope.search(searchText, page, numItems);
        };
    };

    return {
        restrict: 'E', 
        template: template,
        link: mmsSearchLink,
        scope: {
            mmsOptions: '<',
            mmsWs: '@',
        },
    };
}