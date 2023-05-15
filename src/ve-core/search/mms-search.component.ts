import { StateService } from '@uirouter/angularjs'
import _ from 'lodash'

import { ButtonBarApi, ButtonBarService } from '@ve-core/button-bar'
import { veCoreEvents } from '@ve-core/events'
import { search_default_buttons } from '@ve-core/search/mms-search-buttons.config'
import { UtilsService } from '@ve-utils/application'
import { CacheService, EventService } from '@ve-utils/core'
import { ElementService, ProjectService, ViewService, ValueService } from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'

import { veCore } from '@ve-core'

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular'
import {
    DocumentObject,
    ElementObject,
    MountObject,
    ProjectObject,
    QueryObject,
    RequestObject,
    SearchResponse,
    ViewObject,
} from '@ve-types/mms'
import { VeSearchOptions } from '@ve-types/view-editor'

export interface SearchQuery {
    searchText: string
    selectedSearchMetatypes: any[]
    searchField: SearchField
    from?: number
    size?: number
}

export interface AdvancedSearchQuery extends SearchQuery {
    operator: string
}

export interface SearchField {
    id: string
    label: string
}

export interface SearchFilter {
    appliedStereotypeIds?: string[]
    classifierIds?: string[]
}

export interface SearchObject extends ViewObject {
    allRelatedDocuments?: ViewObject[]
    remainingRelatedDocuments?: ViewObject[]
}

/**
 * @ngdoc directive
 * @name veCore.directive:mmsSearch
 *
 * * TBA
 *
 * @scope
 *
 */
export class SearchController implements angular.IComponentController {
    private mmsOptions: VeSearchOptions<ElementObject>
    private mmsProjectId: string
    private mmsRefId: string
    private embedded: boolean

    //Search Results
    private metatypeSearch: string
    protected searchResults: ElementObject[] = []
    protected baseSearchResults: ElementObject[] = []
    protected filteredSearchResults: ElementObject[] = []
    protected showFilterOptions: boolean
    protected searchLoading: boolean = false
    protected firstSearch: boolean = true
    protected mainSearch: SearchQuery = {
        searchText: '',
        searchField: {
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
    // Search result settings
    protected activeFilter: any[] = []

    // Pagination settings
    protected totalResults: number = 0
    protected paginationCache: { [key: number]: ElementObject[] } = {}
    private maxPages: number
    protected currentPage: number = 0
    protected itemsPerPage: number = 10
    // Advanced search settings
    protected advanceSearch: boolean = false
    protected advancedSearchResults: boolean
    protected advanceSearchRows: AdvancedSearchQuery[] = []
    protected stringQuery = this.mainSearch.searchText

    // View property settings
    protected showSearchResultProps = false
    protected switchText = 'More'
    protected limitForProps = 6

    // Set search options
    public fieldTypeList: SearchField[] = [
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
            id: 'type',
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
    public multiselectEvent: {
        onItemSelect(ob): void
        onItemDeselect(ob): void
        onDeselectAll(ob): void
    }

    bbId: string
    bbApi: ButtonBarApi
    private filterList: QueryObject[] = []

    private schema = 'cameo'

    static $inject = [
        '$q',
        '$timeout',
        '$anchorScroll',
        '$state',
        'growl',
        'CacheService',
        'EventService',
        'ElementService',
        'ProjectService',
        'UtilsService',
        'ViewService',
        'ValueService',
        'SchemaService',
        'ButtonBarService',
    ]

    constructor(
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private $anchorScroll: angular.IAnchorScrollService,
        private $state: StateService,
        private growl: angular.growl.IGrowlService,
        private cacheSvc: CacheService,
        private eventSvc: EventService,
        private elementSvc: ElementService,
        private projectSvc: ProjectService,
        private utilsSvc: UtilsService,
        private viewSvc: ViewService,
        private valueSvc: ValueService,
        private schemaSvc: SchemaService,
        private buttonBarSvc: ButtonBarService
    ) {}

    $onInit(): void {
        this.showFilterOptions = !this.mmsOptions.hideFilterOptions
        if (this.showFilterOptions) {
            this.bbId = this.buttonBarSvc.generateBarId('mms-search')
            this.bbApi = this.buttonBarSvc.initApi(this.bbId, this.bbInit, search_default_buttons)
            this.eventSvc.$on<veCoreEvents.buttonClicked>(this.bbId, (data) => {
                this.bbApi.toggleButton(data.clicked)
                this.filterSearchResults(this.buttonBarSvc.getButtonDefinition(data.clicked).type)
            })
        }
        this.refId = this.mmsRefId ? this.mmsRefId : 'master'

        // Set functions
        void this.projectSvc.getProjectMounts(this.mmsProjectId, this.refId)
        //ensure project mounts object is cached
        // Function used to get string value of metatype names for advanced search

        this.getMetaTypes()

        this.multiselectEvent = {
            onItemSelect: (ob): void => {
                void this.$timeout(() => {
                    this.stringQueryUpdate()
                }, 500)
            },
            onItemDeselect: (ob): void => {
                void this.$timeout(() => {
                    this.stringQueryUpdate()
                }, 500)
            },
            onDeselectAll: (ob): void => {
                void this.$timeout(() => {
                    this.stringQueryUpdate()
                }, 500)
            },
        }

        this.addAdvanceSearchRow() // Second row created by default

        // Set options
        if (this.mmsOptions.searchResult) {
            const data1 = this.mmsOptions.searchResult
            this.searchResults = data1
            this.paginationCache[0] = data1
        }
        if (this.mmsOptions.searchField) {
            for (const field of this.fieldTypeList) {
                if (this.mmsOptions.searchField === field.label || this.mmsOptions.searchField === field.id) {
                    this.mainSearch.searchField = field
                    break
                }
            }
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

    handleChange = (newVal: ElementObject[]): void => {
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
                const reqOb = {
                    elementId: elem.id,
                    projectId: elem._projectId,
                    refId: elem._refId,
                    depth: 2,
                }
                this.elementSvc.getOwnedElements(reqOb, 2).then(
                    (data: ElementObject[]) => {
                        const properties: ElementObject[] = []
                        //TODO might not be elements
                        data.forEach((elt) => {
                            if (this.valueSvc.isValue(elt)) properties.push(elt)
                        })
                        elem._properties = properties
                        // OLD CODE - splits into 3cols
                        // if (elem._properties && elem._properties[0]) {
                        //     var properties2 = [];
                        //     for (let i = 0; i < elem._properties.length; i++) {
                        //         if (i % 3 === 0) {
                        //             properties2.push([]);
                        //         }
                        //         properties2[properties2.length - 1].push(elem._properties[i]);
                        //     }
                        //     elem._properties2 = properties2;
                        // }
                    },
                    (reason) => {
                        this.growl.error(reason.message)
                    }
                )
            }
        })
    }

    bbInit = (api: ButtonBarApi): void => {
        api.addButton(this.buttonBarSvc.getButtonBarButton('search-filter-document'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('search-filter-paragraph'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('search-filter-table'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('search-filter-image'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('search-filter-equation'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('search-filter-comment'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('search-filter-section'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('search-filter-view'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('search-filter-req'))
    }

    public qualifiedNameFormatter = (qualifiedName: string): string => {
        if (qualifiedName) {
            const parts = qualifiedName.split('/')
            let result = qualifiedName
            if (parts.length > 7) {
                result = parts.slice(0, 4).join('/') + '/.../' + parts.slice(parts.length - 3, parts.length).join('/')
            }
            return result
        }
    }

    public expandQualifiedName = ($event: JQuery.ClickEvent, qualifiedName: string): void => {
        ;($event.currentTarget as HTMLElement).innerHTML = qualifiedName
    }

    public showMoreRelatedViews = (element: SearchObject): void => {
        element.remainingRelatedDocuments = element.allRelatedDocuments.slice(3, element.allRelatedDocuments.length)
    }

    public closeSearch = (): void => {
        if (this.mmsOptions.closeCallback) {
            this.mmsOptions.closeCallback()
        } else {
            void this.$state.go('main.project.ref.portal', { search: null, field: null }, { reload: true })
        }
    }

    public advancedSearchHandler = (): void => {
        /* TODO: Reimplement Advanced Search */
    }

    // Get metatypes for dropdown options
    public getMetaTypes = (): void => {
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

    public getMetatypeSelection = (id: string): string => {
        const mainElement = angular.element(id)
        return mainElement.find('div').attr('value')
    }

    public getTypeClass = (element: ElementObject): string => {
        // Get Type
        return this.utilsSvc.getElementTypeClass(element, this.viewSvc.getElementType(element))
    }

    // Filter options
    public getActiveFilterClass = (item: unknown[]): boolean => {
        if (!this.activeFilter.length) {
            return false
        }
        return _.includes(this.activeFilter, item)
    }

    public filterSearchResults = (type: string): void => {
        const tempArr = _.clone(this.activeFilter)
        if (_.includes(this.activeFilter, type)) {
            _.pull(this.activeFilter, type)
        } else {
            this.activeFilter.push(type)
        }
        this._applyFiltersAndPaginate()
    }

    private _applyFiltersAndPaginate = (): void => {
        if (!this.activeFilter.length) {
            this.filteredSearchResults = this.searchResults
        } else {
            this.filteredSearchResults = _.filter(this.baseSearchResults, (item) => {
                return _.includes(this.activeFilter, this.viewSvc.getElementType(item))
            })
        }
        this.maxPages = Math.ceil(this.filteredSearchResults.length / this.itemsPerPage)
        for (const pg of [...Array(this.maxPages).keys()]) {
            this.paginationCache[pg] = this.searchResults.slice(pg * this.itemsPerPage, (pg + 1) * this.itemsPerPage)
        }
    }

    // var findRefineOptions = (results) => {
    //     var presentationElements = _.map(results, this.viewSvc.getElementType);
    //     var uniqTypes = _.uniq(presentationElements);
    //     scope.filterOptions = _.difference(uniqTypes, [false, undefined, '']);
    // };

    /**
     * @name veCore.directive:mmsSearch#stringQueryUpdate
     * Updates advanced search main query input
     */
    public stringQueryUpdate = (): void => {
        const rowLength = this.advanceSearchRows.length
        this.stringQuery = Array(rowLength + 1).join('(')
        this.stringQuery += this.mainSearch.searchField.label + ':'
        if (this.mainSearch.searchField.id === 'metatype') {
            this.stringQuery += this.getMetatypeSelection('#searchMetatypeSelectAdvance')
        } else {
            this.stringQuery += this.mainSearch.searchText
        }
        for (let i = 0; i < rowLength; i++) {
            this.stringQuery +=
                ' ' +
                this.advanceSearchRows[i].operator.toUpperCase() +
                ' ' +
                this.advanceSearchRows[i].searchField.label +
                ':'
            if (this.advanceSearchRows[i].searchField.id === 'metatype') {
                this.stringQuery += this.getMetatypeSelection('#searchMetatypeSelect-' + i.toString()) + ')'
            } else {
                this.stringQuery += this.advanceSearchRows[i].searchText + ')'
            }
        }
    }

    /**
     * @name veCore.directive:mmsSearch#addAdvanceSearchRow
     * Adds new row with empty fields and updates advanced search main query input
     */
    public addAdvanceSearchRow = (): void => {
        this.advanceSearchRows.push({
            operator: 'And',
            searchField: {
                id: 'all',
                label: 'All Fields',
            },
            searchText: '',
            selectedSearchMetatypes: [],
        })
        this.stringQueryUpdate()
    }
    /**
     * @name veCore.directive:mmsSearch#removeRowAdvanceSearch
     * Removes selected row and updates advanced search main query input
     *
     * @param {object} row advanced search row
     */
    public removeRowAdvanceSearch = (row: AdvancedSearchQuery): void => {
        this.advanceSearchRows = _.without(this.advanceSearchRows, row)
        this.stringQueryUpdate()
    }

    public modifyAdvanceSearch = (): void => {
        this.advanceSearch = !this.advanceSearch
        this.advancedSearchResults = !this.advancedSearchResults
    }

    public pageChanged = (): void => {
        if (this.paginationCache[this.currentPage]) {
            this.baseSearchResults = this.paginationCache[this.currentPage]
        } else {
            this.search(this.mainSearch, this.currentPage, this.itemsPerPage)
        }
    }

    /**
     * @name veCore.directive:mmsSearch#search
     * Call ElementService to make search post and get search results. Check for filterCallback
     * to further filter search results. Reassign pagination variables.
     *
     * @param {object} query search type and keyword from user input
     * @param {number} page page number of search results
     * @param {number} numItems number of items to return per page
     */
    public search = (query: SearchQuery, page: number, numItems: number): void => {
        this.searchLoading = true
        if (!this.embedded) {
            void this.$state.go('.', {
                search: query.searchText,
                field: query.searchField.id,
            })
        }
        const queryObs: QueryObject[] = this.buildQuery(query)
        // for (const queryOb of queryObs) {
        //     queryOb.from = page * numItems + page
        //     queryOb.size = numItems
        // }
        const reqOb: RequestObject = {
            projectId: this.mmsProjectId,
            refId: this.refId,
        }
        const promises: VePromise<SearchResponse<ElementObject>, SearchResponse<ElementObject>>[] = []
        for (const queryOb of queryObs) {
            promises.push(this._performSearch(reqOb, queryOb))
        }

        this.$q
            .allSettled<SearchResponse<ElementObject>>(promises)
            .then(
                (data) => {
                    const elements: ElementObject[] = []
                    this.searchResults = []
                    this.totalResults = 0
                    for (const d of data) {
                        elements.push(...d.value.elements)
                        this.totalResults = this.totalResults + d.value.total
                    }
                    if (this.mmsOptions.filterCallback) {
                        const results = this.mmsOptions.filterCallback(elements)
                        if (results) {
                            this.searchResults = results
                        } else {
                            this.searchResults = []
                        }
                    } else if (elements.length > 0) {
                        this.searchResults = elements
                    }
                    this.combineRelatedViews()
                    this.currentPage = page
                    this._applyFiltersAndPaginate()
                    this.baseSearchResults = this.paginationCache[page]
                    if (this.advanceSearch) {
                        // scope.advanceSearch = !scope.advanceSearch;
                        this.advancedSearchResults = true
                    }

                    // scope.refineOptions = findRefineOptions(baseSearchResults);
                },
                (reason) => {
                    this.growl.error('Search Error: ' + reason.message)
                }
            )
            .finally(() => {
                this.searchLoading = false
                this.firstSearch = false
            })
    }

    private _performSearch(
        reqOb: RequestObject,
        queryOb: QueryObject
    ): VePromise<SearchResponse<ElementObject>, SearchResponse<ElementObject>> {
        return this.elementSvc.search<ElementObject>(reqOb, queryOb)
    }

    public newSearch = (query: SearchQuery): void => {
        this.searchResults.length = 0
        this.searchLoading = true
        this.paginationCache = {}
        this.search(query, 0, this.itemsPerPage)
    }

    /**
     * @name veCore.directive:mmsSearch#getProjectMountsQuery
     * Create a JSON object that returns a term key with a list of all mounted
     * project ids within the current project.
     *
     * Elastic format
     *
     * @return {object} Elastic query JSON object with list of project mounts
     */
    getProjectMountsQuery = (): VePromise<MountObject[]> => {
        const deferred: angular.IDeferred<MountObject[]> = this.$q.defer()
        const projList: MountObject[] = []

        const mountCacheKey = ['project-mounts', this.mmsProjectId, this.refId]
        if (this.cacheSvc.exists(mountCacheKey)) {
            const project = this.cacheSvc.get<MountObject>(mountCacheKey)
            this.getAllMountsAsArray(project, projList)
            deferred.resolve(projList)
        } else {
            // Get project element data to gather mounted project list
            this.projectSvc.getProjectMounts(this.mmsProjectId, this.refId).then(
                (project) => {
                    this.getAllMountsAsArray(project, projList)
                    deferred.resolve(projList)
                },
                (reason) => {
                    this.growl.error('Problem getting Project Mounts:' + reason.message)
                    deferred.resolve(projList)
                }
            )
        }
        return deferred.promise
    }

    /**
     * @name veCore.directive:mmsSearch#getAllMountsAsArray
     * Use projectsList to populate list with all the mounted project ids for
     * specified project.
     *
     */
    public getAllMountsAsArray = (project: ProjectObject, projectsList: ProjectObject[]): void => {
        projectsList.push(project)
        const mounts = (project as MountObject)._mounts
        if (Array.isArray(mounts) && mounts.length !== 0) {
            for (let i = 0; i < mounts.length; i++) {
                if (mounts[i]._mounts) {
                    this.getAllMountsAsArray(mounts[i], projectsList)
                }
            }
        }
    }

    public buildSearchClause = (query): void => {
        /*TODO*/
    }

    /**
     * @name veCore.directive:mmsSearch#buildQuery
     * Build JSON object for Elastic query.
     *
     *
     * @return {object} {{query: {bool: {must: *[]}}}} JSON object from post data.
     */
    public buildQuery = (query: SearchQuery): QueryObject[] => {
        // Set project and mounted projects filter
        //var projectList = this.getProjectMountsQuery()
        const filterTerms: { [key: string]: string[] } = {}
        const filterQueries: QueryObject[] = []
        const queryObs: QueryObject[] = []
        this.filterList = []

        if (query.searchField.id === 'all') {
            for (const type of this.fieldTypeList) {
                if (type.id !== 'all') {
                    const queryOb: QueryObject = { params: {} }
                    queryOb.params[type.id] = query.searchText
                    queryObs.push(queryOb)
                }
            }
        } else {
            const queryOb: QueryObject = { params: {} }
            queryOb.params[query.searchField.id] = query.searchText
            queryObs.push(queryOb)
        }

        if (this.mmsOptions.filterQueryList) {
            for (const filterQuery of this.mmsOptions.filterQueryList) {
                for (const [term, list] of Object.entries(filterQuery())) {
                    if (!filterTerms[term]) {
                        filterTerms[term] = []
                    }

                    filterTerms[term].push(
                        ...list.filter((value) => {
                            return filterTerms[term].includes(value)
                        })
                    )
                }
            }
        }
        if (this.docsviews.selected) {
            const stereoIds = [
                this.schemaSvc.getSchema<string>('VIEW_SID', this.schema),
                this.schemaSvc.getSchema<string>('DOCUMENT_SID', this.schema),
                ...this.schemaSvc.getSchema<string[]>('OTHER_VIEW_SID', this.schema),
            ]
            /*If the filter list already contain the view id's do not add them a second time since filtering is done
            client side */
            if (!filterTerms.appliedStereotypeIds) {
                filterTerms.appliedStereotypeIds = []
            }
            filterTerms.appliedStereotypeIds.push(
                ...stereoIds.filter((value) => {
                    return !filterTerms.appliedStereotypeIds.includes(value)
                })
            )
        }

        if (Object.entries(filterTerms).length > 0) {
            for (const queryOb of queryObs) {
                for (const [term, list] of Object.entries(filterTerms)) {
                    if (list.length > 0) {
                        for (const sid of list) {
                            const newOb = _.cloneDeep(queryOb)
                            newOb.params[term] = sid
                            filterQueries.push(newOb)
                        }
                    }
                }
            }
        }
        if (filterQueries.length > 0) return filterQueries
        else return queryObs
    }

    private combineRelatedViews = (): void => {
        this.searchResults.forEach((element: ViewObject) => {
            const allRelatedDocuments: {
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

    public userResultClick = (elem: ElementObject, property: string): void => {
        if (this.mmsOptions.callback) {
            this.mmsOptions.callback(elem, property)
        }
    }

    public userRelatedClick = (
        event: JQuery.ClickEvent,
        doc: DocumentObject,
        view: ViewObject,
        elem: ElementObject
    ): void => {
        event.preventDefault()
        event.stopPropagation()
        if (this.mmsOptions.relatedCallback) this.mmsOptions.relatedCallback(doc, view, elem)
    }

    private toggleDocs(): void {
        this.docsviews.selected = !this.docsviews.selected
    }
}
const SearchComponent: VeComponentOptions = {
    selector: 'mmsSearch',
    template: `
    <div class="mms-search">
    <div class="search-header" ng-class="{searchresults : $ctrl.searchResults}">
        <div class="mms-search-input" ng-hide="$ctrl.advanceSearch || $ctrl.advancedSearchResults">
            <form class="form-inline basic-search-form" ng-submit="$ctrl.newSearch($ctrl.mainSearch)">
                <!-- search type menu -->
                <div class="form-group fixed-content-m">
                    <label class="sr-only" for="searchFieldSelect">Search type menu</label>
                    <div class="btn-group ve-light-dropdown" uib-dropdown keyboard-nav is-open="mainSearchField.isopen">
                        <button id="searchFieldSelect" class="dropdown-toggle" type="button" uib-dropdown-toggle>
                            {{$ctrl.mainSearch.searchField.label}}&nbsp;<i class="fa fa-caret-down" aria-hidden="true"></i>
                        </button>
                        <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="searchFieldSelect">
                            <li ng-click="$ctrl.mainSearch.searchField = type;" ng-repeat="type in $ctrl.fieldTypeList"
                                ng-class="{'checked-list-item': type.id === $ctrl.mainSearch.searchField.id}">
                                <a>{{ type.label }}</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <!-- search keyword input -->
                <div class="form-group" ng-show="$ctrl.mainSearch.searchField.id != 'metatype'">
                    <label class="sr-only" for="searchInput">Search keyword</label>
                    <input class="search-input" type="text" id="searchInput" ng-model="$ctrl.mainSearch.searchText" autofocus/>
                </div>
                <div class="form-group" ng-if="$ctrl.mainSearch.searchField.id === 'metatype'">
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
                    <label class="sr-only" for="searchFieldSelectAdvance">Search type menu</label>
                    <div class="btn-group ve-light-dropdown" uib-dropdown keyboard-nav is-open="mainSearchField.isopen2">
                        <button id="searchFieldSelectAdvance" class="dropdown-toggle" type="button" uib-dropdown-toggle>
                            {{$ctrl.mainSearch.searchField.label}}&nbsp;<i class="fa fa-caret-down" aria-hidden="true"></i>
                        </button>
                        <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="searchFieldSelectAdvance">
                            <li ng-click="$ctrl.mainSearch.searchField = type; $ctrl.stringQueryUpdate()" ng-repeat="type in $ctrl.fieldTypeList"
                                ng-class="{'checked-list-item': type.id === $ctrl.mainSearch.searchField.id}">
                                <a>{{ type.label }}</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <!-- search keyword input -->
                <div class="form-group" ng-show="$ctrl.mainSearch.searchField.id != 'metatype'">
                    <label class="sr-only" for="searchText">Advanced search query</label>
                    <input class="search-input" type="text" id="searchText" ng-model="$ctrl.mainSearch.searchText" ng-change="$ctrl.stringQueryUpdate()" autofocus/>
                </div>
                <!-- metatype multiselect -->
                <div class="form-group" ng-if="$ctrl.mainSearch.searchField.id === 'metatype'">
                    <label class="sr-only" for="searchMetatypeSelectAdvance">Search metatype menu</label>
                    <div id="searchMetatypeSelectAdvance" ng-dropdown-multiselect="" options="$ctrl.metatypeList" selected-model="$ctrl.mainSearch.selectedSearchMetatypes" extra-settings="$ctrl.metatypeSettings" events="$ctrl.multiselectEvent"></div>
                </div>
            </div>

<!--            &lt;!&ndash; Advanced search rows &ndash;&gt;-->
<!--            <div ng-repeat="row in $ctrl.advanceSearchRows">-->
<!--                <div class="form-inline">-->
<!--                    &lt;!&ndash; operator &ndash;&gt;-->
<!--                    <div class="form-group fixed-content-s">-->
<!--                        <label class="sr-only" for="operator-{{$index}}">Search row operator</label>-->
<!--                        <div class="btn-group ve-light-dropdown" uib-dropdown keyboard-nav is-open="row.operatorisopen">-->
<!--                            <button id="operator-{{$index}}" class="dropdown-toggle" type="button" uib-dropdown-toggle>-->
<!--                                {{row.operator}}&nbsp;<i class="fa fa-caret-down" aria-hidden="true"></i>-->
<!--                            </button>-->
<!--                            <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="operator-{{$index}}">-->
<!--                                <li ng-click="row.operator = value; stringQueryUpdate()" ng-repeat="(key, value) in $ctrl.operatorList"-->
<!--                                    ng-class="{'checked-list-item': value === row.operator}">-->
<!--                                    <a>{{ value }}</a>-->
<!--                                </li>-->
<!--                            </ul>-->
<!--                        </div>-->
<!--                    </div>-->
<!--                    &lt;!&ndash; row search type menu &ndash;&gt;-->
<!--                    <div class="form-group fixed-content-m">-->
<!--                        <label class="sr-only" for="searchFieldSelect-{{$index}}">Search type menu</label>-->
<!--                        <div class="btn-group ve-light-dropdown" uib-dropdown keyboard-nav is-open="row.isopen">-->
<!--                            <button id="searchFieldSelect-{{$index}}" class="dropdown-toggle" type="button" uib-dropdown-toggle>-->
<!--                                {{row.searchField.label}}&nbsp;<i class="fa fa-caret-down" aria-hidden="true"></i>-->
<!--                            </button>-->
<!--                            <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="searchFieldSelect-{{$index}}">-->
<!--                                <li ng-click="row.searchField = type; $ctrl.stringQueryUpdate()" ng-repeat="type in $ctrl.fieldTypeList"-->
<!--                                    ng-class="{'checked-list-item': type.id === row.searchField.id}">-->
<!--                                    <a>{{ type.label }}</a>-->
<!--                                </li>-->
<!--                            </ul>-->
<!--                        </div>-->
<!--                    </div>-->
<!--                    &lt;!&ndash; row search keyword input &ndash;&gt;-->
<!--                    <div class="form-group" ng-show="row.searchField.id != 'metatype'">-->
<!--                        <label class="sr-only" for="searchText-{{$index}}">Advanced search query</label>-->
<!--                        <input class="search-input" type="text" id="searchText-{{$index}}" ng-model="row.searchText" ng-change="$ctrl.stringQueryUpdate()" autofocus/>-->
<!--                    </div>-->
<!--                    &lt;!&ndash; row metatype multiselect &ndash;&gt;-->
<!--                    <div class="form-group" ng-if="row.searchField.id === 'metatype'">-->
<!--                        <label class="sr-only" for="searchMetatypeSelect-{{$index}}">Search metatype menu</label>-->
<!--                        <div id="searchMetatypeSelect-{{$index}}" ng-dropdown-multiselect="" options="$ctrl.metatypeList" selected-model="row.selectedSearchMetatypes" extra-settings="$ctrl.metatypeSettings" events="multiselectEvent"></div>-->
<!--                    </div>-->
<!--                    &lt;!&ndash; remove row button &ndash;&gt;-->
<!--                    <a type="button" ng-click="$ctrl.removeRowAdvanceSearch(row)" class="btn btn-secondary">-->
<!--                        <i class="fa fa-times"></i>-->
<!--                    </a>-->
<!--                </div>-->
<!--            </div>-->
<!--            &lt;!&ndash; add row button &ndash;&gt;-->
<!--            <a type="button" ng-click="$ctrl.addAdvanceSearchRow()" class="btn btn-secondary">-->
<!--                <i class="fa fa-plus"></i>&nbsp;Add Row-->
<!--            </a>-->
            <div class="advanced-views-docs">
                <input type="checkbox" ng-model="$ctrl.docsviews.selected"> <span ng-click="$ctrl.toggleDocs">Search for Views and Documents</span>
            </div>
        </div>
        <span class="close-button-container" ng-if="$ctrl.mmsOptions.closeable">
            <a class="close-button"  ng-click="$ctrl.closeSearch()">
                <i tooltip-placement="left" uib-tooltip="Close Search"  class="fa fa-times"></i>
            </a>
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
    
    <div id="ve-search-results" class="misc-form-field results-count" ng-hide="($ctrl.searchLoading || _.isEmpty($ctrl.paginationCache)) && !$ctrl.firstSearch">
        <div class="ve-search-filter" ng-hide="!$ctrl.showFilterOptions">
            <span class="label-for-filter ve-secondary-text">FILTER: </span>
            <div class="btn-group btn-group-sm" role="group"  aria-label="mms-search-results-filter">
                <button-bar button-id="$ctrl.bbId" class="bordered-button-bar"></button-bar>
            </div>
        </div>
    
        <div class="ve-secondary-text">Showing items <b>{{$ctrl.currentPage * $ctrl.itemsPerPage + 1}} - {{$ctrl.currentPage * $ctrl.itemsPerPage + $ctrl.itemsPerPage}}</b> of {{$ctrl.searchResults.length}}. (Page {{$ctrl.currentPage + 1}} of {{$ctrl.maxPages}})</div>
    </div>
    <div class="container-fluid search-nav-top" ng-show="$ctrl.searchResults.length > 0">
    <ul uib-pagination max-size="10" boundary-link-numbers="true" total-items="$ctrl.searchResults.length" items-per-page="$ctrl.itemsPerPage" ng-model="$ctrl.currentPage" ng-change="$ctrl.pageChanged()"></ul>
        
    </div>


    <div class="search-results" ng-show="$ctrl.searchResults.length > 0">
        <div class="elem-wrapper" ng-repeat="elem in $ctrl.filteredSearchResults">
            <mms-search-results mms-element="elem"></mms-search-results>
        </div>    
    </div>
    <div class="container-no-results container-fluid" ng-show="(!$ctrl.searchResults || $ctrl.searchResults.length === 0) && !$ctrl.searchLoading && !ctrl.firstSearch">
        <h3>No Results Found.</h3>
    </div>
    
    <div class="container-fluid search-nav text-center" ng-show="$ctrl.searchResults.length > 0">
        <div class="btn-group btn-group-sm" role="navigation">
            <button ng-show="$ctrl.currentPage > 0" ng-click="$ctrl.prevPage()">&lt; Prev</button>
            <button ng-show="$ctrl.searchResults.length > 0" class="btn btn-secondary" ng-repeat="page in Object.keys($ctrl.paginationCache)" ng-click="$ctrl.goTo(page)">{{ page }}</button>
            <button ng-show="$ctrl.searchResults.length > 0 && $ctrl.currentPage < $ctrl.maxPages" class="btn btn-secondary text-center" ng-click="$ctrl.nextPage()">Next &gt;</button>
        </div>
    </div>

    
</div>

  `,
    bindings: {
        mmsOptions: '<',
        mmsProjectId: '@',
        mmsRefId: '@',
        embedded: '<',
    },
    controller: SearchController,
}

veCore.component(SearchComponent.selector, SearchComponent)
