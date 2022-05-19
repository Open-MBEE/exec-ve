import * as angular from 'angular'
import * as _ from 'lodash'
import {VeComponentOptions} from '../../ve-utils/types/view-editor'
import {CacheService} from "@ve-utils/services"
import {ElementService} from "@ve-utils/services"
import {ProjectService} from "@ve-utils/services"
import {UtilsService} from "@ve-utils/services"
import {ViewService} from "@ve-utils/services"
import {ElementObject, ProjectObject, QueryObject, RequestObject, ViewObject,} from '../../ve-utils/types/mms'

//veCore.directive('mmsSearch', ['$window', '$anchorScroll', 'CacheService', 'ElementService', 'ProjectService', 'UtilsService', 'ViewService', 'growl', '$templateCache', '$timeout', mmsSearch]);

/**
 * @ngdoc directive
 * @name veCore.directive:mmsSearch
 *
 * @restrict E
 *
 * @description
 * TBA
 *
 * @scope
 *
 */
class SearchController implements angular.IComponentController {
    private mmsOptions: {
        getProperties: any
        emptyDocTxt?: string
        searchResult?: ElementObject[]
        searchInput?: string
        itemsPerPage: number
        hideFilterOptions?: boolean
        callback?(elem, property): void
        relatedCallback?(doc, view, elem): void
        filterCallback?(elements: ElementObject[]): ElementObject[]
    }
    private mmsProjectId: string
    private mmsRefId: string

    //Search Results
    private metatypeSearch: string
    protected searchResults: ElementObject[]
    protected baseSearchResults: ElementObject[] = []
    protected showFilterOptions: boolean
    protected searchLoading: boolean = false
    protected mainSearch: {
        searchText: string
        selectedSearchMetatypes: any[]
        searchType: { id: string; label: string }
    } = {
        searchText: '',
        searchType: {
            id: 'all',
            label: 'All Fields',
        },
        selectedSearchMetatypes: [],
    }
    protected docsviews: { selected: boolean } = {
        selected: false,
    }
    private emptyDocTxt: string
    protected refId: string
    // Search resulte settings
    protected activeFilter: any[] = []

    // Pagination settings
    protected totalResults: number = 0
    protected paginationCache: { [key: number]: ElementObject[] } = {}
    private maxPages: number
    protected currentPage: number = 0
    protected itemsPerPage: number = 100

    // Advanced search settings
    protected advanceSearch: boolean = false
    protected advancedSearchResults: boolean
    protected advanceSearchRows: {
        operator: any
        searchText: string
        selectedSearchMetatypes: any[]
        searchType: {
            id: string
            label: string
        }
    }[] = []
    protected stringQuery = this.mainSearch.searchText

    // View property settings
    protected showSearchResultProps = false
    protected switchText = 'More'
    protected limitForProps = 6

    // Set search options
    public fieldTypeList: { id: string; label: string }[] = [
        {
            id: 'all',
            label: 'All Fields',
        },
        {
            id: 'name',
            label: 'Name',
        },
        {
            id: 'documentation',
            label: 'Documentation',
        },
        {
            id: 'value',
            label: 'Value',
        },
        {
            id: 'id',
            label: 'ID',
        },
        {
            id: 'metatype',
            label: 'Metatype',
        },
    ]

    public operatorList = ['And', 'Or', 'And Not']

    // settings for multiselect metatype dropdown
    public metatypeSettings = {
        scrollableHeight: '300px',
        scrollable: true,
        enableSearch: true,
        displayProp: 'name',
        showCheckAll: false,
        smartButtonMaxItems: 10,
        buttonClasses: '',
    }

    // event handler for multiselect metatype dropdown
    public multiselectEvent = {
        onItemSelect: (ob) => {},
        onItemDeselect: (ob) => {},
        onDeselectAll: (ob) => {},
    }

    protected filterOptions = [
        { display: 'Documents', icon: null, type: 'Document' },
        // { display: "Sections/Views", icon: null, type: "View", "Section" },
        { display: 'Text', icon: 'pe-type-Paragraph', type: 'Paragraph' },
        { display: 'Tables', icon: 'pe-type-Table', type: 'Table' },
        { display: 'Images', icon: 'pe-type-Image', type: 'Image' },
        { display: 'Equations', icon: 'pe-type-Equation', type: 'Equation' },
        { display: 'Comments', icon: 'pe-type-Comment', type: 'Comment' },
        { display: 'Sections', icon: 'pe-type-Section', type: 'Section' },
        { display: 'Views', icon: 'pe-type-View', type: 'View' },
        { display: 'Requirements', icon: 'pe-type-Req', type: 'Requirement' },
    ]

    constructor(
        private growl: angular.growl.IGrowlService,
        private $timeout: angular.ITimeoutService,
        private $anchorScroll: angular.IAnchorScrollService,
        private cacheSvc: CacheService,
        private elementSvc: ElementService,
        private projectSvc: ProjectService,
        private utilsSvc: UtilsService,
        private viewSvc: ViewService
    ) {}

    $onInit() {
        this.showFilterOptions = !this.mmsOptions.hideFilterOptions
        this.refId = this.mmsRefId ? this.mmsRefId : 'master'

        // Set functions
        this.projectSvc.getProjectMounts(this.mmsProjectId, this.refId) //ensure project mounts object is cached
        // Function used to get string value of metatype names for advanced search

        this.getMetaTypes()

        this.multiselectEvent = {
            onItemSelect: (ob) => {
                this.$timeout(() => {
                    this.stringQueryUpdate()
                }, 500)
            },
            onItemDeselect: (ob) => {
                this.$timeout(() => {
                    this.stringQueryUpdate()
                }, 500)
            },
            onDeselectAll: (ob) => {
                this.$timeout(() => {
                    this.stringQueryUpdate()
                }, 500)
            },
        }

        this.addAdvanceSearchRow() // Second row created by default

        // Set options
        if (this.mmsOptions.searchResult) {
            var data1: ElementObject[] = this.mmsOptions.searchResult
            this.searchResults = data1
            this.paginationCache[0] = data1
        }
        if (this.mmsOptions.searchInput) {
            this.mainSearch.searchText = this.mmsOptions.searchInput
            this.newSearch(this.mainSearch)
        }
        if (this.mmsOptions.itemsPerPage) {
            this.itemsPerPage = this.mmsOptions.itemsPerPage
        }
        if (this.mmsOptions.emptyDocTxt) {
            this.emptyDocTxt = this.mmsOptions.emptyDocTxt
        }
    }

    handleChange = (newVal) => {
        if (!newVal) return
        if (!this.mmsOptions.getProperties) {
            return
        }
        newVal.forEach((elem) => {
            if (elem._properties) {
                return
            }
            // mms does not return properties will need to make a call for the results whose type is Class
            // Call this.elementSvc.getOwnedElements with depth of 2
            // filter out results that have type = to Property and Slot
            // for Property check that ownerId is same as the class id
            if (elem.type === 'Class' || elem.type === 'Component') {
                var reqOb = {
                    elementId: elem.id,
                    projectId: elem._projectId,
                    refId: elem._refId,
                    depth: 2,
                }
                this.elementSvc
                    .getOwnedElements(reqOb, 2)
                    .then((data: ElementObject[]) => {
                        var properties: ElementObject[] = []
                        //TODO might not be elements
                        angular.forEach(data, (elt) => {
                            if (
                                elt.type === 'Property' &&
                                elt.ownerId == elem.id
                            ) {
                                properties.push(elt)
                            } else if (elt.type === 'Slot') {
                                properties.push(elt)
                            }
                        })
                        elem._properties = properties
                        // OLD CODE - splits into 3cols
                        // if (elem._properties && elem._properties[0]) {
                        //     var properties2 = [];
                        //     for (var i = 0; i < elem._properties.length; i++) {
                        //         if (i % 3 === 0) {
                        //             properties2.push([]);
                        //         }
                        //         properties2[properties2.length - 1].push(elem._properties[i]);
                        //     }
                        //     elem._properties2 = properties2;
                        // }
                    })
            }
        })
    }

    public qualifiedNameFormatter = (qualifiedName) => {
        if (qualifiedName) {
            var parts = qualifiedName.split('/')
            var result = qualifiedName
            if (parts.length > 7) {
                result =
                    parts.slice(0, 4).join('/') +
                    '/.../' +
                    parts.slice(parts.length - 3, parts.length).join('/')
            }
            return result
        }
    }

    public expandQualifiedName = ($event, qualifiedName) => {
        $event.currentTarget.innerHTML = qualifiedName
    }

    public showMoreRelatedViews = (element) => {
        element.remainingRelatedDocuments = element.allRelatedDocuments.slice(
            3,
            element.allRelatedDocuments.length
        )
    }

    public closeSearch = () => {
        window.history.back()
    }

    public advancedSearchHandler = () => {
        this.growl.error(
            "Search Error: Advanced Search hasn't been implemented yet"
        )
    }

    // Get metatypes for dropdown options
    public getMetaTypes = () => {
        // this.metatypeSearch = "fa fa-spin fa-spinner";
        // this.projectSvc.getMetatypes(scope.mmsProjectId, scope.refId)
        //     .then((data) => {
        //       // cache metatypes
        //       scope.metatypeList = data;
        //     }, (reason) => {
        //       growl.error("Search Error: " + reason.message);
        //     }).finally(() => {
        //   scope.metatypeSearch = "";
        // });
        this.advancedSearchHandler()
    }

    public getMetatypeSelection = (id) => {
        var mainElement = angular.element(id)
        return mainElement.find('div').attr('value')
    }

    public getTypeClass = (element) => {
        // Get Type
        return this.utilsSvc.getElementTypeClass(
            element,
            this.viewSvc.getElementType(element)
        )
    }

    // Filter options
    public getActiveFilterClass = (item) => {
        if (!this.activeFilter.length) {
            return ''
        }
        return _.includes(this.activeFilter, item)
    }

    public filterSearchResults = (type) => {
        var tempArr = _.clone(this.activeFilter)
        if (_.includes(this.activeFilter, type)) {
            _.pull(this.activeFilter, type)
        } else {
            this.activeFilter.push(type)
        }
        this._applyFilters()
    }

    private _applyFilters = () => {
        if (!this.activeFilter.length) {
            this.searchResults = this.baseSearchResults
        } else {
            this.searchResults = _.filter(this.baseSearchResults, (item) => {
                return _.includes(
                    this.activeFilter,
                    this.viewSvc.getElementType(item)
                )
            })
        }
    }

    // var findRefineOptions = (results) => {
    //     var presentationElements = _.map(results, this.viewSvc.getElementType);
    //     var uniqTypes = _.uniq(presentationElements);
    //     scope.filterOptions = _.difference(uniqTypes, [false, undefined, '']);
    // };

    /**
     * @ngdoc function
     * @name veCore.directive:mmsSearch#stringQueryUpdate
     * @methodOf veCore.directive:mmsSearch
     *
     * @description
     * Updates advanced search main query input
     */
    public stringQueryUpdate = () => {
        var rowLength = this.advanceSearchRows.length
        this.stringQuery = Array(rowLength + 1).join('(')
        this.stringQuery += this.mainSearch.searchType.label + ':'
        if (this.mainSearch.searchType.id === 'metatype') {
            this.stringQuery += this.getMetatypeSelection(
                '#searchMetatypeSelectAdvance'
            )
        } else {
            this.stringQuery += this.mainSearch.searchText
        }
        for (var i = 0; i < rowLength; i++) {
            this.stringQuery +=
                ' ' +
                this.advanceSearchRows[i].operator.toUpperCase() +
                ' ' +
                this.advanceSearchRows[i].searchType.label +
                ':'
            if (this.advanceSearchRows[i].searchType.id === 'metatype') {
                this.stringQuery +=
                    this.getMetatypeSelection('#searchMetatypeSelect-' + i) +
                    ')'
            } else {
                this.stringQuery += this.advanceSearchRows[i].searchText + ')'
            }
        }
    }

    /**
     * @ngdoc function
     * @name veCore.directive:mmsSearch#addAdvanceSearchRow
     * @methodOf veCore.directive:mmsSearch
     *
     * @description
     * Adds new row with empty fields and updates advanced search main query input
     */
    public addAdvanceSearchRow = () => {
        this.advanceSearchRows.push({
            operator: 'And',
            searchType: {
                id: 'all',
                label: 'All Fields',
            },
            searchText: '',
            selectedSearchMetatypes: [],
        })
        this.stringQueryUpdate()
    }
    /**
     * @ngdoc function
     * @name veCore.directive:mmsSearch#removeRowAdvanceSearch
     * @methodOf veCore.directive:mmsSearch
     *
     * @description
     * Removes selected row and updates advanced search main query input
     *
     * @param {objecy} row advanced search row
     */
    public removeRowAdvanceSearch = (row) => {
        this.advanceSearchRows = _.without(this.advanceSearchRows, row)
        this.stringQueryUpdate()
    }

    public modifyAdvanceSearch = () => {
        this.advanceSearch = !this.advanceSearch
        this.advancedSearchResults = !this.advancedSearchResults
    }

    public nextPage = () => {
        if (this.paginationCache[this.currentPage + 1]) {
            this.baseSearchResults = this.paginationCache[this.currentPage + 1]
            this.currentPage += 1
            this._applyFilters()
        } else {
            this.search(
                this.mainSearch,
                this.currentPage + 1,
                this.itemsPerPage
            )
        }
        this.$anchorScroll('ve-search-results')
    }

    public prevPage = () => {
        if (this.paginationCache[this.currentPage - 1]) {
            this.baseSearchResults = this.paginationCache[this.currentPage - 1]
            this.currentPage -= 1
            this._applyFilters()
        } else {
            this.search(
                this.mainSearch,
                this.currentPage - 1,
                this.itemsPerPage
            )
        }
    }

    /**
     * @ngdoc function
     * @name veCore.directive:mmsSearch#search
     * @methodOf veCore.directive:mmsSearch
     *
     * @description
     * Call ElementService to make search post and get search results. Check for filterCallback
     * to further filter search results. Reassign pagination variables.
     *
     * @param {object} query search type and keyword from user input
     * @param {number} page page number of search results
     * @param {number} numItems number of items to return per page
     */
    public search = (query: {}, page: number, numItems: number) => {
        this.searchLoading = true
        var queryOb: QueryObject = this.buildQuery(query)
        queryOb.from = page * numItems + page
        queryOb.size = numItems
        var reqOb: RequestObject = {
            projectId: this.mmsProjectId,
            refId: this.refId,
        }
        this.elementSvc
            .search(reqOb, queryOb, 2)
            .then(
                (data) => {
                    let elements = data.elements
                    if (this.mmsOptions.filterCallback) {
                        let results = this.mmsOptions.filterCallback(elements)
                        if (results) {
                            this.searchResults = results
                        } else {
                            this.searchResults = []
                        }
                    } else {
                        this.searchResults = elements
                    }
                    this.baseSearchResults = this.searchResults
                    this.combineRelatedViews(this)
                    this.totalResults = data.total
                    this.maxPages = Math.ceil(
                        this.totalResults / this.itemsPerPage
                    )
                    this.currentPage = page
                    this.paginationCache[page] = this.searchResults
                    if (this.advanceSearch) {
                        // scope.advanceSearch = !scope.advanceSearch;
                        this.advancedSearchResults = true
                    }
                    this._applyFilters()
                    // scope.refineOptions = findRefineOptions(baseSearchResults);
                },
                (reason) => {
                    this.growl.error('Search Error: ' + reason.message)
                }
            )
            .finally(() => {
                this.searchLoading = false
            })
    }

    newSearch = (query) => {
        this.paginationCache = {}
        this.search(query, 0, this.itemsPerPage)
    }

    /**
     * @ngdoc function
     * @name veCore.directive:mmsSearch#getProjectMountsQuery
     * @methodOf veCore.directive:mmsSearch
     *
     * @description
     * Create a JSON object that returns a term key with a list of all mounted
     * project ids within the current project.
     *
     * Elastic format
     *
     * @return {object} Elastic query JSON object with list of project mounts
     */
    getProjectMountsQuery = () => {
        var projList: ProjectObject[] = []

        var mountCacheKey = ['project-mounts', this.mmsProjectId, this.refId]
        if (this.cacheSvc.exists(mountCacheKey)) {
            projList = <ProjectObject[]>(
                this.cacheSvc.get<ProjectObject[]>(mountCacheKey)
            )
        } else {
            // Get project element data to gather mounted project list
            var cacheKey = ['project', this.mmsProjectId, this.refId]
            var cachedProj: ProjectObject | undefined =
                this.cacheSvc.get(cacheKey)
            if (cachedProj) {
                this.getAllMountsAsArray(cachedProj, projList)
            } else {
                var project: ProjectObject = {
                    id: this.mmsProjectId,
                    _refId: this.refId,
                }
                this.getAllMountsAsArray(project, projList)
            }
            this.cacheSvc.put(mountCacheKey, projList, false)
        }
        return projList
    }

    /**
     * @ngdoc function
     * @name veCore.directive:mmsSearch#getAllMountsAsArray
     * @methodOf veCore.directive:mmsSearch
     *
     * @description
     * Use projectsList to populate list with all the mounted project ids for
     * specified project.
     *
     */
    public getAllMountsAsArray = (
        project: ProjectObject,
        projectsList: ProjectObject[]
    ) => {
        projectsList.push(project)
        var mounts = project._mounts
        if (angular.isArray(mounts) && mounts.length !== 0) {
            for (var i = 0; i < mounts.length; i++) {
                if (mounts[i]._mounts) {
                    this.getAllMountsAsArray(mounts[i], projectsList)
                }
            }
        }
        return
    }

    public buildSearchClause = (query) => {}

    /**
     * @ngdoc function
     * @name veCore.directive:mmsSearch#buildQuery
     * @methodOf veCore.directive:mmsSearch
     *
     * @description
     * Build JSON object for Elastic query.
     *
     *
     * @return {object} {{query: {bool: {must: *[]}}}} JSON object from post data.
     */
    public buildQuery = (query) => {
        // Set project and mounted projects filter
        var projectList = this.getProjectMountsQuery()
        return query
    }

    private combineRelatedViews = (scope) => {
        scope.searchResults.forEach((element: ViewObject) => {
            var allRelatedDocuments: {
                relatedDocument: ViewObject
                relatedView: ViewObject
            }[] = []
            if (element._relatedDocuments) {
                element._relatedDocuments.forEach((relatedDoc: ViewObject) => {
                    if (relatedDoc._parentViews) {
                        relatedDoc._parentViews.forEach((parentView) => {
                            allRelatedDocuments.push({
                                relatedDocument: relatedDoc,
                                relatedView: parentView,
                            })
                        })
                    }
                })
            }
            element.allRelatedDocuments = allRelatedDocuments
            element.someRelatedDocuments = allRelatedDocuments.slice(0, 3)
        })
    }

    public userResultClick = (elem, property) => {
        if (this.mmsOptions.callback) {
            this.mmsOptions.callback(elem, property)
        }
    }

    public userRelatedClick = (event, doc, view, elem) => {
        event.preventDefault()
        event.stopPropagation()
        if (this.mmsOptions.relatedCallback)
            this.mmsOptions.relatedCallback(doc, view, elem)
    }
}
let SearchComponent: VeComponentOptions = {
    selector: 'mmsSearch',
    template: `
    <div class="mms-search">
    <div class="search-header" ng-class="{searchresults : $ctrl.searchResults}">
        <div class="mms-search-input" ng-hide="$ctrl.advanceSearch || $ctrl.advancedSearchResults">
            <form class="form-inline basic-search-form" ng-submit="$ctrl.newSearch($ctrl.mainSearch)">
                <!-- search type menu -->
                <div class="form-group fixed-content-m">
                    <label class="sr-only" for="searchTypeSelect">Search type menu</label>
                    <div class="btn-group ve-light-dropdown" uib-dropdown keyboard-nav is-open="mainSearchType.isopen">
                        <button id="searchTypeSelect" class="dropdown-toggle" type="button" uib-dropdown-toggle>
                            {{$ctrl.mainSearch.searchType.label}}&nbsp;<i class="fa fa-caret-down" aria-hidden="true"></i>
                        </button>
                        <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="searchTypeSelect">
                            <li ng-click="$ctrl.mainSearch.searchType = type;" ng-repeat="type in $ctrl.fieldTypeList"
                                ng-class="{'checked-list-item': type.id === $ctrl.mainSearch.searchType.id}">
                                <a>{{ type.label }}</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <!-- search keyword input -->
                <div class="form-group" ng-show="$ctrl.mainSearch.searchType.id != 'metatype'">
                    <label class="sr-only" for="searchInput">Search keyword</label>
                    <input class="search-input" type="text" id="searchInput" ng-model="$ctrl.mainSearch.searchText" autofocus/>
                </div>
                <div class="form-group" ng-if="$ctrl.mainSearch.searchType.id === 'metatype'">
                    <label class="sr-only" for="searchMetatypeSelect">Search metatype menu</label>
                    <div id="searchMetatypeSelect" ng-dropdown-multiselect="" options="$ctrl.metatypeList" selected-model="$ctrl.mainSearch.selectedSearchMetatypes" extra-settings="$ctrl.metatypeSettings"></div>
                </div>
                <button class="btn btn-primary" type="button" ng-click="$ctrl.newSearch($ctrl.mainSearch)">
                    <span class="btn-text">Search</span> <i ng-if="$ctrl.searchLoading" class="fa fa-spin fa-spinner"></i>
                </button>
            </form>
            <div>
                <input type="checkbox" ng-model="$ctrl.docsviews.selected"> Search for Views and Documents
                <a class="pull-right" ng-click="$ctrl.advanceSearch = !$ctrl.advanceSearch">Advanced Search</a>
            </div>
        </div>

        <div class="mms-search-input" ng-show="$ctrl.advanceSearch">
            <div class="misc-form-field search-nav-back">
                <a ng-click="$ctrl.advanceSearch = !$ctrl.advanceSearch"><i class="fa fa-arrow-left"></i>Basic Search</a>
            </div>
            <!-- submit change -->
            <form class="form-inline advanced-query" ng-submit="$ctrl.newSearch($ctrl.mainSearch)">
                <!-- advanced search query input disabled -->
                <h3 class="fixed-content-m">Advanced Search</h3>
                <div class="form-group">
                    <label class="sr-only" for="searchQuery">Advanced search query (disabled)</label>
                    <input class="search-input disabled-input" type="text" id="searchQuery" ng-model="$ctrl.stringQuery" disabled />
                </div>
                <button class="btn btn-primary" type="button" ng-click="$ctrl.newSearch(mainSearch)">
                    <span class="btn-text">Search</span> <i ng-if="$ctrl.searchLoading" class="fa fa-spin fa-spinner"></i>
                </button>
            </form>

            <div class="form-inline" style="justify-content: flex-end">
                <div class="form-group fixed-content-s">
                </div>
                <!-- search type menu -->
                <div class="form-group fixed-content-m">
                    <label class="sr-only" for="searchTypeSelectAdvance">Search type menu</label>
                    <div class="btn-group ve-light-dropdown" uib-dropdown keyboard-nav is-open="mainSearchType.isopen2">
                        <button id="searchTypeSelectAdvance" class="dropdown-toggle" type="button" uib-dropdown-toggle>
                            {{$ctrl.mainSearch.searchType.label}}&nbsp;<i class="fa fa-caret-down" aria-hidden="true"></i>
                        </button>
                        <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="searchTypeSelectAdvance">
                            <li ng-click="$ctrl.mainSearch.searchType = type; $ctrl.stringQueryUpdate()" ng-repeat="type in $ctrl.fieldTypeList"
                                ng-class="{'checked-list-item': type.id === $ctrl.mainSearch.searchType.id}">
                                <a>{{ type.label }}</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <!-- search keyword input -->
                <div class="form-group" ng-show="$ctrl.mainSearch.searchType.id != 'metatype'">
                    <label class="sr-only" for="searchText">Advanced search query</label>
                    <input class="search-input" type="text" id="searchText" ng-model="$ctrl.mainSearch.searchText" ng-change="$ctrl.stringQueryUpdate()" autofocus/>
                </div>
                <!-- metatype multiselect -->
                <div class="form-group" ng-if="$ctrl.mainSearch.searchType.id === 'metatype'">
                    <label class="sr-only" for="searchMetatypeSelectAdvance">Search metatype menu</label>
                    <div id="searchMetatypeSelectAdvance" ng-dropdown-multiselect="" options="$ctrl.metatypeList" selected-model="$ctrl.mainSearch.selectedSearchMetatypes" extra-settings="$ctrl.metatypeSettings" events="$ctrl.multiselectEvent"></div>
                </div>
            </div>

            <!-- Advanced search rows -->
            <div ng-repeat="row in $ctrl.advanceSearchRows">
                <div class="form-inline">
                    <!-- operator -->
                    <div class="form-group fixed-content-s">
                        <label class="sr-only" for="operator-{{$index}}">Search row operator</label>
                        <div class="btn-group ve-light-dropdown" uib-dropdown keyboard-nav is-open="row.operatorisopen">
                            <button id="operator-{{$index}}" class="dropdown-toggle" type="button" uib-dropdown-toggle>
                                {{row.operator}}&nbsp;<i class="fa fa-caret-down" aria-hidden="true"></i>
                            </button>
                            <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="operator-{{$index}}">
                                <li ng-click="row.operator = value; stringQueryUpdate()" ng-repeat="(key, value) in $ctrl.operatorList"
                                    ng-class="{'checked-list-item': value === row.operator}">
                                    <a>{{ value }}</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <!-- row search type menu -->
                    <div class="form-group fixed-content-m">
                        <label class="sr-only" for="searchTypeSelect-{{$index}}">Search type menu</label>
                        <div class="btn-group ve-light-dropdown" uib-dropdown keyboard-nav is-open="row.isopen">
                            <button id="searchTypeSelect-{{$index}}" class="dropdown-toggle" type="button" uib-dropdown-toggle>
                                {{row.searchType.label}}&nbsp;<i class="fa fa-caret-down" aria-hidden="true"></i>
                            </button>
                            <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="searchTypeSelect-{{$index}}">
                                <li ng-click="row.searchType = type; $ctrl.stringQueryUpdate()" ng-repeat="type in $ctrl.fieldTypeList"
                                    ng-class="{'checked-list-item': type.id === row.searchType.id}">
                                    <a>{{ type.label }}</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <!-- row search keyword input -->
                    <div class="form-group" ng-show="row.searchType.id != 'metatype'">
                        <label class="sr-only" for="searchText-{{$index}}">Advanced search query</label>
                        <input class="search-input" type="text" id="searchText-{{$index}}" ng-model="row.searchText" ng-change="$ctrl.stringQueryUpdate()" autofocus/>
                    </div>
                    <!-- row metatype multiselect -->
                    <div class="form-group" ng-if="row.searchType.id === 'metatype'">
                        <label class="sr-only" for="searchMetatypeSelect-{{$index}}">Search metatype menu</label>
                        <div id="searchMetatypeSelect-{{$index}}" ng-dropdown-multiselect="" options="$ctrl.metatypeList" selected-model="row.selectedSearchMetatypes" extra-settings="$ctrl.metatypeSettings" events="multiselectEvent"></div>
                    </div>
                    <!-- remove row button -->
                    <a type="button" ng-click="$ctrl.removeRowAdvanceSearch(row)" class="btn btn-secondary">
                        <i class="fa fa-times"></i>
                    </a>
                </div>
            </div>
            <!-- add row button -->
            <a type="button" ng-click="$ctrl.addAdvanceSearchRow()" class="btn btn-secondary">
                <i class="fa fa-plus"></i>&nbsp;Add Row
            </a>
            <div class="advanced-views-docs">
                <input type="checkbox" ng-model="$ctrl.docsviews.selected"> Search for Views and Documents
            </div>
        </div>
        <span class="close-button-container">
            <span class="close-button" ng-if="$ctrl.mmsOptions.closeable" ng-click="$ctrl.closeSearch()">
                <i tooltip-placement="left" uib-tooltip="Close Search"  class="fa fa-times"></i>
            </span>
        </span>

        <!-- <div ng-show="advancedSearchResults" class="mms-search-input"> -->
            <!-- advanced search query input disabled -->
            <!-- <div class="form-group">
                <div class="misc-form-field search-nav-back">
                    <a ng-click="advancedSearchResults = !advancedSearchResults"><i class="fa fa-arrow-left"></i>Basic Search</a>
                </div>
                <form class="form-inline" ng-submit="newSearch(mainSearch)"> -->
                    <!-- advanced search query input disabled -->
                    <!-- <h3 class="fixed-content-m">Advanced Search</h3>
                    <label class="sr-only" for="searchText">Advanced search query (disabled)</label>
                    <span ng-click="modifyAdvanceSearch()" class="search-input disabled-input-container">
                        <input class="search-input disabled-input form-group" type="text" id="searchText" ng-model="stringQuery" disabled />
                    </span>
                    <a ng-click="modifyAdvanceSearch()">Modify</a>
                </form>
            </div>
        </div> -->
    </div> 
<!--    <div class="slide-animate" ng-include="'partials/mms-directives/mmsSearchResults.html'"></div> &lt;!&ndash; TODO: Need to make this a separate component &ndash;&gt;-->
    <div id="ve-search-results" class="misc-form-field results-count" ng-hide="$ctrl.searchLoading || !$ctrl.paginationCache.length">
        <div class="ve-search-filter" ng-hide="!$ctrl.showFilterOptions">
            <span class="label-for-filter ve-secondary-text">FILTER: </span>
            <div class="btn-group btn-group-sm" role="group"  aria-label="mms-search-results-filter">
                <button type="button" ng-repeat="item in $ctrl.filterOptions" ng-click="$ctrl.filterSearchResults(item.type)"
                title="Filter {{item.display}}" class="btn ve-btn-group-default {{item.icon}}"
                ng-class="{'active': getActiveFilterClass(item.type)}">{{item.display}}</button>
            </div>
        </div>
    
        <div class="ve-secondary-text">Showing <b>{{$ctrl.searchResults.length}}</b> <!--of {{searchResults.length}} -->search results. (Page {{$ctrl.currentPage + 1}})</div>
    </div>


    <div class="search-results" ng-show="$ctrl.searchResults.length > 0">
    <div class="elem-wrapper" ng-repeat="elem in filteredElms = (searchResults)">
    
    <div class="container-fluid search-nav">
        <a ng-show="$ctrl.currentPage > 0" ng-click="$ctrl.prevPage()">&lt; Prev</a>
        <a ng-show="$ctrl.searchResults.length > 0 && $ctrl.currentPage < $ctrl.maxPages" class="pull-right" ng-click="$ctrl.nextPage()">Next ></a>
    </div>

    <div class="container-no-results container-fluid" ng-show="$ctrl.searchResults.length === 0 && !$ctrl.searchLoading">
        <h3>No Results Found.</h3>
    </div>
</div>

  `,
    bindings: {
        mmsOptions: '<',
        mmsProjectId: '@',
        mmsRefId: '@',
    },
    controller: SearchController,
}
