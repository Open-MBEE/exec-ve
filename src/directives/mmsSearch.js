'use strict';

angular.module('mms.directives')
.directive('mmsSearch', ['CacheService', 'ElementService', 'ProjectService', 'UtilsService', '_', 'growl', '$templateCache', '$timeout', mmsSearch]);

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
function mmsSearch(CacheService, ElementService, ProjectService, UtilsService, _, growl, $templateCache, $timeout) {
    var template = $templateCache.get('mms/templates/mmsSearch.html');

    var mmsSearchLink = function(scope, element, attrs) {
        scope.paginationCache = [];
        scope.searchClass = "";
        scope.proposeClass = "";
        scope.filter = '';
        scope.mainSearch = {searchText:'', searchType:{id:'all', label:'All Fields'}, selectedSearchMetatypes: []};
        scope.stringQuery = scope.mainSearch.searchText;
        scope.facet = '$';
        scope.filterQuery = {query: ""};
        scope.currentPage = 0;
        scope.itemsPerPage = 50;
        scope.advanceSearch = false;
        scope.advanceSearchRows = [];
        scope.docsviews = {
            selected: false
        };
        scope.refId = scope.mmsRefId ? scope.mmsRefId : 'master';
        ProjectService.getProjectMounts(scope.mmsProjectId, scope.refId); //ensure project mounts object is cached
        scope.$watchGroup(['filterQuery.query', 'facet'], function(newVal, oldVal) {
            scope.resultFilter = {};
            scope.resultFilter[scope.facet] = scope.filterQuery.query;
        });


        scope.fieldTypeList = [
            { id:'all', label:'All Fields' },
            { id:'name', label:'Name' },
            { id:'documentation', label:'Documentation' },
            { id:'value', label:'Value' },
            { id:'id', label:'ID' },
            { id:'metatype', label:'Metatype' }
        ];

        scope.operatorList = ['And', 'Or', 'And Not'];

        // settings for multiselect metatype dropdown
        scope.metatypeSettings = {
            scrollableHeight: '300px',
            scrollable: true,
            enableSearch: true,
            displayProp: 'name',
            showCheckAll: false,
            smartButtonMaxItems: 10,
            buttonClasses: ''
        };
        // event handler for multiselect metatype dropdown
        scope.multiselectEvent = {
            onItemSelect: function(ob) {
                $timeout( function(){
                    scope.stringQueryUpdate();
                }, 500 );
            },
            onItemDeselect: function(ob) {
                $timeout( function(){
                    scope.stringQueryUpdate();
                }, 500 );
            },
            onDeselectAll: function(ob) {
                $timeout( function(){
                    scope.stringQueryUpdate();
                }, 500 );
            }
        };
        // Get metatypes
        var metatypes = {
            "size": 0,
            "aggs": {
                "stereotypedElements": {
                    "filter": { "bool": {
                        "must": [
                          { "term": {"_projectId": scope.mmsProjectId} },
                          { "term": {"_inRefIds": scope.refId} },
                          { "exists": {"field": "_appliedStereotypeIds"} }
                        ],
                        "must_not" : [
                            {
                                "terms": {
                                    "_appliedStereotypeIds": ["_17_0_5_407019f_1336584858932_290814_11897", "_17_0_2_407019f_1354126823633_971278_12922", "_17_0_2_3_407019f_1390932205525_919663_29081", "_17_0_1_407019f_1328144768208_151103_11611", "_18_5_8bf0285_1486490948776_422870_16475", "_17_0_2_3_407019f_1380044908011_537162_29414", "_18_0_6_8bf0285_1480702282066_678566_13974", "_18_0_5_407019f_1470005595314_374414_14088", "_17_0_1_407019f_1320688868391_878682_2122", "_17_0_5_407019f_1334873987130_64195_11860", "_17_0_1_244d03ea_1319490838789_76536_23321", "_17_0_1_244d03ea_1319490696098_585884_23244", "_17_0_1_244d03ea_1319490675924_494597_23220", "_17_0_2_3_e81034b_1378849795852_475880_29502", "_17_0_1_244d03ea_1319490856319_735016_23345", "_17_0_5_407019f_1346952773459_128964_11915", "_17_0_1_244d03ea_1319492675769_542703_24690", "_17_0_1_244d03ea_1319490805237_397889_23292", "_17_0_1_244d03ea_1319491813759_405316_23859", "_17_0_1_22b603cd_1319577320837_597116_24044", "_17_0_1_244d03ea_1319490870282_714178_23369", "_17_0_1_244d03ea_1319490921274_829705_23417", "_17_0_2_3_e81034b_1378849355455_639118_29417", "_17_0_1_244d03ea_1319490658057_783239_23196", "_17_0_1_244d03ea_1319490607459_890787_23148", "_17_0_1_244d03ea_1319490639053_446661_23172", "_17_0_1_24c603f9_1318965749289_636288_15241", "_17_0_1_244d03ea_1319490721410_468874_23268", "_17_0_1_244d03ea_1319490880431_889010_23393", "_17_0_2_3_407019f_1377878750778_198079_29401", "_17_0_2_3_407019f_1377881591361_754431_29966", "_17_0_5_407019f_1337970852079_693660_12393", "_17_0_2_3_407019f_1377878719961_37575_29374", "_17_0_1_24c603f9_1318965764947_847626_15265", "_17_0_2_1_407019f_1358445062164_196970_12977", "_17_0_1_244d03ea_1319496225382_275996_25443", "_17_0_1_244d03ea_1319498258297_961829_27083", "_17_0_1_244d03ea_1319496302084_771803_25570", "_17_0_1_244d03ea_1319496280368_246829_25514", "_18_5_2_8bf0285_1506039168690_925234_16001", "_17_0_1_407019f_1326235066484_404532_2489", "_17_0_1_244d03ea_1319512564304_251824_28229", "_18_0_5_ef50357_1480453603002_831462_13966", "_17_0_2_3_407019f_1383246724224_41450_29079", "_17_0_2_3_407019f_1375477696989_696093_29350", "_17_0_2_3_407019f_1375478079564_152907_29404", "_17_0_2_3_407019f_1392933505529_270043_29089", "_17_0_2_3_e9f034d_1375474838719_217024_29345", "_17_0_2_3_eac0346_1374702066208_763130_29330", "_17_0_2_3_eac0346_1374701945748_238477_29309", "_17_0_2_3_407019f_1383165357327_898985_29071", "_9_0_be00301_1108044380615_150487_0", "_10_0_622020d_1127207234373_259585_1", "_12_1_8f90291_1173963323875_662612_98", "_16_0_62a020a_1227788740027_441955_240", "_17_0_2_3_ff3038a_1383749269646_31940_44489", "_16_5beta1_8ba0276_1232443673758_573873_267", "_9_0_be00301_1108044563999_784946_1", "_11_5EAPbeta_be00301_1151484491369_618395_1", "_15_5EAPbeta1_8f90291_1207743469046_796042_162", "_18_0beta_8e8028e_1384177586203_506524_3245", "_9_0_be00301_1108044721245_236588_411", "_17_0_2beta_903028d_1330931963982_116619_1920", "_18_5beta_8ba0279_1468931052415_679497_4210", "_17_0_2beta_903028d_1330931963978_770627_1918", "_18_1_8760276_1416414449210_764904_3981", "_17_0_5beta_f720368_1373961709543_89140_3280", "_9_0_be00301_1108044705753_203399_228"]
                                }
                            },
                            {
                                "terms": {
                                    "type": ["Dependency", "Abstraction", "ComponentRealization", "InterfaceRealization", "Deployment", "Manifestation", "Realization", "Substitution", "Usage", "ElementImport", "Extend", "Include", "InformationFlow", "PackageImport", "ProfileApplication", "ProtocolConformance", "TemplateBinding", "Generalization", "Association", "Connector", "ConnectorEnd", "ControlFlow", "ObjectFlow", "Mount", "FinalNode", "JoinNode", "ForkNode", "MergeNode", "FlowFinalNode", "InitialNode", "ActivityFinalNode", "ActivityPartition", "DecisionNode", "Transition"]
                                }
                            }
                        ]
                    }},
                    "aggs": {
                        "stereotypeIds": {
                            "terms": {
                                "field": "_appliedStereotypeIds",
                                "size": 50
                            }
                        }
                    }
                }
            }
        };

        var getMetaTypes = function(metatypes) {
            scope.metatypeSearch = "fa fa-spin fa-spinner";
            var queryOb = metatypes;
            ProjectService.getMetatypes(scope.mmsProjectId, scope.refId, queryOb)
            .then(function(data) {
                // cache metatypes
                scope.metatypeList = data;
            }, function(reason) {
                growl.error("Search Error: " + reason.message);
            }).finally(function() {
                scope.metatypeSearch = "";
            });
        };
        getMetaTypes(metatypes);


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
                if (elem.type === 'Class' || elem.type === 'Component') {
                    var reqOb = {elementId: elem.id, projectId: elem._projectId, refId: elem._refId, depth: 2};
                    ElementService.getOwnedElements(reqOb, 2)
                        .then(function (data) {
                            var properties = [];
                            //TODO might not be elements
                            angular.forEach(data, function (elt) {
                                if (elt.type === 'Property' && elt.ownerId == elem.id) {
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

        // advanced search handlers
        scope.addAdvanceSearchRow = function() {
            scope.advanceSearchRows.push({operator:'And',searchType:{id:'all', label:'All Fields'},searchText:'',selectedSearchMetatypes:[]});
            scope.stringQueryUpdate();
        };

        // Function used to get string value of metatype names for advanced search
        var getMetatypeSelection = function(id) {
            var mainElement = angular.element(id);
            return mainElement.find('div').attr('value');
        };

        // update string query for advanced search on change
        scope.stringQueryUpdate = function() {
            var metatypeFilterString;
            var rowLength = scope.advanceSearchRows.length;
            scope.stringQuery = Array(rowLength+1).join('(');
            scope.stringQuery += scope.mainSearch.searchType.label + ':';
            if (scope.mainSearch.searchType.id === 'metatype') {
                scope.stringQuery += getMetatypeSelection('#searchMetatypeSelect');
            } else {
                scope.stringQuery += scope.mainSearch.searchText;
            }
            for ( var i = 0; i < rowLength; i++) {
                scope.stringQuery += ' ' + scope.advanceSearchRows[i].operator.toUpperCase() + ' ' + scope.advanceSearchRows[i].searchType.label + ':';
                if (scope.advanceSearchRows[i].searchType.id === 'metatype') {
                    scope.stringQuery += getMetatypeSelection('#searchMetatypeSelect-'+i) + ')';
                } else {
                    scope.stringQuery += scope.advanceSearchRows[i].searchText + ')';
                }
            }
        };

        scope.removeRowAdvanceSearch = function(row) {
            scope.advanceSearchRows = _.without(scope.advanceSearchRows, row);
            scope.stringQueryUpdate();
        };

        scope.modifyAdvanceSearch = function() {
            scope.advanceSearch = !scope.advanceSearch;
            scope.advancedSearchResults = !scope.advancedSearchResults;
        };

        scope.next = function() {
            if (scope.paginationCache[scope.currentPage+1]) {
                scope.searchResults= scope.paginationCache[scope.currentPage+1];
                scope.currentPage += 1;
            } else{
                scope.search(scope.mainSearch, scope.currentPage + 1, scope.itemsPerPage);
            }
        };

        scope.prev = function() {
            if (scope.paginationCache[scope.currentPage-1]) {
                scope.searchResults= scope.paginationCache[scope.currentPage-1];
                scope.currentPage -= 1;
            } else {
                scope.search(scope.mainSearch, scope.currentPage - 1, scope.itemsPerPage);
            }
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
         * @param {object} query search type and keyword from user input
         * @param {number} page page number of search results
         * @param {number} numItems number of items to return per page
         */
        scope.search = function(query, page, numItems) {
            scope.searchClass = "fa fa-spin fa-spinner";
            var queryOb = buildQuery(query);
            queryOb.from = page*numItems + page;
            queryOb.size = numItems;
            var reqOb = {projectId: scope.mmsProjectId, refId: scope.refId};
            ElementService.search(reqOb, queryOb, 2)
            .then(function(data) {
                if (scope.mmsOptions.filterCallback) {
                  scope.searchResults = scope.mmsOptions.filterCallback(data);
                } else {
                  scope.searchResults = data;
                }
                scope.searchClass = "";
                scope.currentPage = page;
                scope.paginationCache.push(scope.searchResults);
                if (scope.advanceSearch) {
                    scope.advanceSearch = !scope.advanceSearch;
                    scope.advancedSearchResults = true;
                }
            }, function(reason) {
                growl.error("Search Error: " + reason.message);
                scope.searchClass = "";
            });
        };

        scope.newSearch = function(query) {
            scope.paginationCache = [];
            scope.search(query, 0, scope.itemsPerPage);
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
            var cacheKey = ['project', scope.mmsProjectId, scope.refId];
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
                                    _inRefIds: scope.refId
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
        // TODO cache results
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

        var buildSearchClause = function(query) {
            var clause = {};
            var q = {};
            var valueSearchFields = ["defaultValue.value", "value.value", "specification.value"];
            if (query.searchType.id === 'all') {
                // Set query term for ID
                var idQuery = {};
                idQuery.term = {"id": query.searchText};

                // Set query for value,doc,name fields
                var allQuery = {};
                q.query = query.searchText;
                q.fields = valueSearchFields.slice();
                q.fields.push('name', 'documentation');
                allQuery.multi_match = q;
                clause = {
                    "bool": {
                        "should": [
                            idQuery,
                            allQuery
                        ]
                    }
                };
            } else if (query.searchType.id === 'name' || query.searchType.id === 'documentation') {
                // "{"query":{"bool":{"must":[{"match":{"name":"val"}}]}}}"
                // "{"query":{"bool":{"must":[{"match":{"documentation":"val"}}]}}}"
                var type = query.searchType.id;
                q[type] = query.searchText;
                clause.match = q;
            } else if (query.searchType.id === 'id') {
                // "{"query":{"bool":{"must":[{"term":{"id":"val"}}]}}}"
                clause.term = {"id": query.searchText};
            } else if (query.searchType.id === 'value') {
                // "{"query":{"bool":{"must":[{"multi_match":{"query":"val","fields":["defaultValue.value","value.value","specification.value"]}}]}}}"
                q.query = query.searchText;
                q.fields = valueSearchFields;
                clause.multi_match = q;
            } else if (query.searchType.id === 'metatype') {
                var metatypeFilterList = _.pluck(query.selectedSearchMetatypes, 'id');
                clause.terms = {"_appliedStereotypeIds": metatypeFilterList};
            }
            return clause;
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
        var buildQuery = function (query) {
            // Set project and mounted projects filter
            var projectTermsOb = getProjectMountsQuery();
            var filterList = [projectTermsOb];
            // Set custom filter options for query
            if (scope.mmsOptions.filterQueryList) {
                angular.forEach(scope.mmsOptions.filterQueryList, function(filterOb){
                    filterList.push(filterOb());
                });
            }

            // Set filter for all views and docs, if selected
            if (scope.docsviews.selected) {
                var viewsAndDocs = {
                    terms : {'_appliedStereotypeIds': [UtilsService.VIEW_SID, UtilsService.DOCUMENT_SID].concat(UtilsService.OTHER_VIEW_SID)}
                };
                filterList.push(viewsAndDocs);
            }

            // Set main query
            var mainBoolQuery = {};
            var jsonQueryOb = {};
            var rowLength = scope.advanceSearchRows.length;
            if (!scope.advanceSearch || rowLength === 0) {
                mainBoolQuery = buildSearchClause(query);
                mainBoolQuery = { "bool": {
                        "must": mainBoolQuery,
                    } };
            } else {
                var boolQuery, clause2;
                var clause1 = buildSearchClause(scope.mainSearch);

                for (var i = 0; i < rowLength; i++) {
                    // if must, must_not or should
                    var row = scope.advanceSearchRows[i];
                    var operator = row.operator;
                    clause2 = buildSearchClause(row);
                    if (operator === "And") {
                        clause1 = { "bool": { "must": [ clause1, clause2 ] } };
                    } else if (operator === "Or") {
                        clause1 = { "bool": { "should": [ clause1, clause2 ],
                                    "minimum_should_match": 1 } };
                    } else if (operator === "And Not") {
                        clause1 = { "bool": { "must": [ clause1, { "bool": {"must_not": clause2} } ] } };
                    }
                }
                mainBoolQuery = clause1;
                // jsonQueryOb = {
                //     "sort" : [
                //         "_score",
                //         { "_modified" : {"order" : "desc"}}
                //     ],
                //     "query": {
                //         "bool": {
                //             "must": mainBoolQuery,
                //             "filter": filterList
                //         }
                //     }
                // };
            }

            jsonQueryOb = {
                "sort" : [
                    "_score",
                    { "_modified" : {"order" : "desc"}}
                ],
                "query": { }
            };
            jsonQueryOb.query = mainBoolQuery;
            jsonQueryOb.query.bool.filter = filterList;
            return jsonQueryOb;
        };


        // Set options
        if (scope.mmsOptions.searchResult) {
            var data1 = scope.mmsOptions.searchResult;
            scope.searchResults = data1;
            scope.paginationCache.push(data1);
        }
        if (scope.mmsOptions.searchInput) {
            scope.mainSearch.searchText = scope.mmsOptions.searchInput;
            scope.newSearch(scope.mainSearch);
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