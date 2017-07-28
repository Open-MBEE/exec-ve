'use strict';

angular.module('mms.directives')
.directive('mmsSearch', ['CacheService', 'ElementService', 'UtilsService', 'growl', '$templateCache', mmsSearch]);

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
function mmsSearch(CacheService, ElementService, UtilsService, growl, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsSearch.html');

    var mmsSearchLink = function(scope, element, attrs) {
        scope.paginationCache = [];
        scope.searchClass = "";
        scope.proposeClass = "";
        scope.filter = '';
        scope.searchText = '';
        scope.searchType = 'all';
        scope.facet = '$';
        scope.filterQuery = {query: ""};
        scope.currentPage = 0;
        scope.itemsPerPage = 50;
        scope.docsviews = {
            selected: false
        };
        scope.refId = scope.mmsRefId ? scope.mmsRefId : 'master';

        scope.$watchGroup(['filterQuery.query', 'facet'], function(newVal, oldVal) {
            scope.resultFilter = {};
            scope.resultFilter[scope.facet] = scope.filterQuery.query;
        });

        scope.$watch('searchResults', function(newVal) {
            if (!newVal)
                return;
            if (!scope.mmsOptions.getProperties) {
                return;
            }
            newVal.forEach(function(elem) {
                if (elem._properties) {
                    return;
                }
                // Create a flag for getting properties - only want them when global and general cf
                
                    //Design - have ellen come up with design for list of properties in columns

                    // mms does not return properties will need to make a call for the results whose type is Class
                    // Call ElementService.getOwnedElements with depth of 2
                    // filter out results that have type = to Property and Slot
                    // for Property check that ownerId is same as the class id
                if (elem.type === 'Class') {
                    var reqOb = {elementId: elem.id, projectId: elem._projectId, refId: elem._refId, depth: 2};
                    ElementService.getOwnedElements(reqOb, 2)
                        .then(function (data) {
                            var properties = [];
                            //TODO might not be elements
                            angular.forEach(data, function (elt) {
                                if (elt.type === 'Property' && elt.ownerId == elem.classId) {
                                    properties.push(elt);
                                } else if (elt.type === 'Slot') {
                                    properties.push(elt);
                                }
                            });
                            elem._properties = properties;
                            // OLD CODE - splits into 3cols
                            if (elem._properties && elem._properties[0]) {
                                var properties2 = [];
                                for (var i = 0; i < elem._properties.length; i++) {
                                    if (i % 3 === 0) {
                                        properties2.push([]);
                                    }
                                    properties2[properties2.length - 1].push(elem._properties[i]);
                                }
                                elem._properties2 = properties2;
                            }
                        });
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

        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsSearch#setSearchType
         * @methodOf mms.directives.directive:mmsSearch
         *
         * @description
         * Activate selected filter facet button and set searchType scope variable which will be
         * used to build query.
         *
         * @param {string} searchType search filter type i.e. all, name, id
         */
        scope.setSearchType = function(searchType) {
            scope.searchType = searchType;
            angular.element('.btn-search-all').removeClass('active');
            angular.element('.btn-search-name').removeClass('active');
            angular.element('.btn-search-documentation').removeClass('active');
            angular.element('.btn-search-value').removeClass('active');
            angular.element('.btn-search-id').removeClass('active');
            angular.element('.btn-search-' + searchType).addClass('active');
        };


        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsSearch#setFilterFacet
         * @methodOf mms.directives.directive:mmsSearch
         *
         * @description
         * Activate selected filter facet button and use angularJS built-in filter component to filter
         * on search results. Use object expression to filter based on filter type.
         *
         * @param {string} filterFacet filter facet type i.e. all, name, id
         */
        scope.setFilterFacet = function(filterFacet) {
            if (filterFacet === 'all') {
                scope.facet = '$';
            } else {
                scope.facet = filterFacet;
            }
            angular.element('.search-filter-type button').removeClass('active');
            angular.element('.btn-filter-facet-' + filterFacet).addClass('active');
        };

        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsSearch#search
         * @methodOf mms.directives.directive:mmsSearch
         *
         * @description
         * Call ElementService to make search post and get search results. Check for filerCallback
         * to further filter search results. Reassign pagination variables.
         *
         * @param {string} searchText search string from user input
         * @param {number} page page number of search results
         * @param {number} numItems number of items to return per page
         */
        scope.search = function(searchText, page, numItems) {
            scope.searchClass = "fa fa-spin fa-spinner";
            var queryOb = buildQuery(searchText);
            queryOb.from = page*numItems + page;
            queryOb.size = numItems;
            var reqOb = {projectId: scope.mmsProjectId, refId: scope.refId};
            ElementService.search(reqOb, queryOb, page, numItems, 2)
            .then(function(data) {
                if (scope.mmsOptions.filterCallback) {
                  scope.searchResults = scope.mmsOptions.filterCallback(data);
                } else {
                  scope.searchResults = data;
                }
                scope.searchClass = "";
                scope.currentPage = page;
                scope.paginationCache.push(scope.searchResults);
            }, function(reason) {
                growl.error("Search Error: " + reason.message);
                scope.searchClass = "";
            });
        };

        scope.newSearch = function(searchText, page, numItems){
            scope.paginationCache = [];
            // console.log(scope.paginationCache.length);
            scope.search(searchText, page, numItems);
        };

        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsSearch#getProjectMountsQuery
         * @methodOf mms.directives.directive:mmsSearch
         *
         * @description
         * Create a JSON object that returns a term key with a list of all mounted
         * project ids within the current project. Elastic format
         *
         * @return {object} Elastic query JSON object with list of project mounts
         */
        var getProjectMountsQuery = function () {
            var projList = [];
            var projectTermsOb = {};
            var cacheKey = ['project', scope.mmsProjectId, scope.mmsRefId];
            var cachedProj = CacheService.get(cacheKey);
            if (cachedProj) {
                getAllMountsAsArray(cachedProj, projList);
            }
            var q = {};
            if ( projList.length === 0 ) {
                projList.push({
                    bool: {
                        must: [
                            {
                                term: {
                                    _projectId: scope.mmsProjectId
                                }
                            }, {
                                term:{
                                    _inRefIds: scope.mmsRefId
                                }
                            }
                        ]
                    }
                });
            }
            q._projectId = projList;
            projectTermsOb.bool = {should: projList};
            return projectTermsOb;
        };

        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsSearch#getAllMountsAsArray
         * @methodOf mms.directives.directive:mmsSearch
         *
         * @description
         * Use projectsList to populate list with all the mounted project ids for
         * specified project.
         *
         */
        var getAllMountsAsArray = function(project, projectsList) {
            projectsList.push({
                    bool: {
                        must: [
                            {
                                term: {
                                    _projectId: project.id
                                }
                            }, {
                                term:{
                                    _inRefIds: project._refId
                                }
                            }
                        ]
                    }
                });
            var mounts = project._mounts;
            if ( angular.isArray(mounts) && mounts.length !== 0 ) {
                for (var i = 0; i < mounts.length; i++) {
                    if (mounts[i]._mounts) {
                        getAllMountsAsArray(mounts[i], projectsList);
                    }
                }
            }
            return;
        };

        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsSearch#buildQuery
         * @methodOf mms.directives.directive:mmsSearch
         *
         * @description
         * Build JSON object for Elastic query.
         *
         *
         * @return {object} {{query: {bool: {must: *[]}}}} JSON object from post data.
         */
        var buildQuery = function (searchTxt) {
            var mainQuery = {};
            var q = {};
            var valueSearchFields = ["defaultValue.value", "value.value", "specification.value"];
            if (scope.searchType === 'all') {
                q = {};
                var idQuery = {};
                q.id = searchTxt;
                idQuery.term = q;

                var q2 = {};
                var allQuery = {};
                q2.query = searchTxt;
                q2.fields = valueSearchFields.slice();
                q2.fields.push('name', 'documentation');
                allQuery.multi_match = q2;
                mainQuery = {
                    "bool": {
                        "should": [
                            idQuery,
                            allQuery
                        ]
                    }
                };

            }
            if (scope.searchType === 'name' || scope.searchType === 'documentation') {
                // "{"query":{"bool":{"must":[{"match":{"name":"val"}}]}}}"
                // "{"query":{"bool":{"must":[{"match":{"documentation":"val"}}]}}}"
                var type = scope.searchType;
                q = {};
                q[type] = searchTxt;
                mainQuery.match = q;
            }
            if (scope.searchType === 'id') {
                // "{"query":{"bool":{"must":[{"term":{"id":"val"}}]}}}"
                q = {};
                q.id = searchTxt;
                mainQuery.term = q;
            }
            if (scope.searchType === 'value') {
                // "{"query":{"bool":{"must":[{"multi_match":{"query":"val","fields":["defaultValue.value","value.value","specification.value"]}}]}}}"
                q = {};
                q.query = searchTxt;
                q.fields = valueSearchFields;
                mainQuery.multi_match = q;
            }

            var projectTermsOb = getProjectMountsQuery();
            var mainBoolQuery = [mainQuery];
            var filterList = [projectTermsOb];
            if (scope.mmsOptions.filterQueryList) {
                angular.forEach(scope.mmsOptions.filterQueryList, function(filterOb){
                    filterList.push(filterOb());
                });
            }

            // Add filter for all views and docs if selected
            if (scope.docsviews.selected) {
                var viewsAndDocs = {
                    terms : {'_appliedStereotypeIds': [UtilsService.VIEW_SID, UtilsService.DOCUMENT_SID].concat(UtilsService.OTHER_VIEW_SID)}
                };
                filterList.push(viewsAndDocs);
            }
            var jsonQueryOb = {
                "sort" : [
                    "_score",
                    { "_modified" : {"order" : "desc"}}
                ],
                "query": {
                    "bool": {
                        "must": mainBoolQuery,
                        "filter": filterList
                    }
                }
            };
            return jsonQueryOb;
        };


        // Set options
        if (scope.mmsOptions.searchResult) {
            var data1 = scope.mmsOptions.searchResult;
            scope.searchResults = data1;
            scope.paginationCache.push(data1);
        }
        if (scope.mmsOptions.searchInput) {
            scope.searchText = scope.mmsOptions.searchInput;
            scope.newSearch(scope.searchText, 0, 50 , 2);
        }
        if (scope.mmsOptions.itemsPerPage) {
            scope.itemsPerPage = scope.mmsOptions.itemsPerPage;
        }
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
            mmsOptions: '<',
            mmsProjectId: '@',
            mmsRefId: '@'
        }
    };
}