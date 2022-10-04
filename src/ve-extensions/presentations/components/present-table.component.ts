import * as angular from "angular";
import {INgModelOptions} from "angular";
import $ from "jquery";
import JQuery from "jquery";
import Rx from 'rx-lite'

import {IPresentation, Presentation, PresentationComponentOptions, PresentationService} from "@ve-ext/presentations";
import {EventService} from "@ve-utils/core-services";
import {TableCell, TableConfig, ViewHtmlService} from "@ve-ext/presentations";

import {veExt, ExtUtilService} from "@ve-ext";
import {SchemaService} from "@ve-utils/model-schema";
import {ButtonBarService} from "@ve-utils/button-bar";

class PresentTableController extends Presentation implements IPresentation {

    public $searchEl: JQuery<HTMLElement>;
    public $tHeadEl: JQuery<HTMLElement>;
    public $captionEl: JQuery<HTMLTableCaptionElement>;

    public table
    public tableConfig: TableConfig
    private trs: any;
    public ngModelOptions: INgModelOptions
    public showFilter: boolean = false
    public fixedHeaders: boolean = false
    public fixedColumns: boolean = false
    private _fixedHeadersElem: JQuery<HTMLElement> = null
    private _fixedColumnsElem: JQuery<HTMLElement> = null
    public numFixedColumns: number = 2
    private nextIndex: number;
    private tbody: JQuery<HTMLElement>;
    private lastIndex: number;
    private numTotal: number;

    /** Full Table Filter **/
    public _fullTableFilterSub: Rx.IDisposable

    private _searchTerm: string = '';
    private numFiltered: number;

    /** Column Filter **/
    private _columnsInputSubs: {} = {};

    /**
     * _filterTermForColumns is used to keep track of filter terms on each header's column for multi-columns
     * filtering. Some header columns could be a merged column, and have children columns. "columns" property
     * keeps track, of all the children columns number that it is a parent of. ie:
     * {filterTermForColumn01: {filterTerm: 'A', columns: [0,1]}, filterTermForColumn11: {filterTerm: 'B', columns: [1]}} **/
    private _filterTermForColumns: {[filterTermForColumn: string]: {filterTerm: string, columns: number[]}} = {};

    /** Variables for Sorting Functions **/
    private _rowSortOrderAttrName = 'data-original-row-num';
    public isAscending: boolean = false;
    private showSortReset: boolean = false;
    private resetSort: () => void;
    private filterByColumn: (filterTerm, startColNum, endColNum, filterInputBinding) => void;


    static $inject = [...Presentation.$inject, '$document', '$window', '$timeout']

    constructor($element: JQuery<HTMLElement>, $scope: angular.IScope,
                $compile: angular.ICompileService, growl: angular.growl.IGrowlService, schemaSvc: SchemaService, viewHtmlSvc: ViewHtmlService,
                presentationSvc: PresentationService,  extUtilSvc: ExtUtilService, eventSvc: EventService,
                buttonBarSvc: ButtonBarService, private $document: angular.IDocumentService,
                private $window: angular.IWindowService, private $timeout: angular.ITimeoutService) {
        super($element, $scope, $compile, growl, schemaSvc, viewHtmlSvc, presentationSvc, extUtilSvc, eventSvc, buttonBarSvc)
    }

    recompile = () => {
        this.isEditing = false;
        this.inPreviewMode = false;

        this.setNumber();


        this.$transcludeEl = $(this.getContent());
        this.$transcludeEl.find('img').each((index, element) => {
            this.extUtilSvc.fixImgSrc($(element));
        });

        this.$element.append(this.$transcludeEl);
        this.nextIndex = 0;
        this.$tHeadEl = this.$transcludeEl.find('thead');
        this.$compile(this.$tHeadEl)(this.$scope);
        this.$searchEl = this.$element.children().eq(0);
        this.$compile(this.$searchEl)(this.$scope);
        this.$captionEl = this.$transcludeEl.find('caption');
        this.$compile(this.$captionEl)(this.$scope);
        //Add the search input here (before the TRS, aka the columns/rows)
        this.tbody = $(this.$element).find('.table-wrapper').children('table').children('tbody');
        this.trs = this.tbody.children('tr');

        this.lastIndex = this.trs.length;
        this.numFiltered = this.lastIndex;
        this.numTotal = this.lastIndex;

        this.addFullTableFilter(this.trs);
        this.addColumnsWiseFilter(this.tableConfig, this.trs);
        this.addSorting(this.trs, this.tbody);

        this.compileTable();
    }

    config = () => {

        if (!this.peObject.showIfEmpty && this.peObject.body.length === 0) {
            return;
        }

        this.table = this.peObject;
        this.tableConfig = this.viewHtmlSvc.tableConfig;
        this.ngModelOptions = {
            debounce: this.tableConfig.filterDebounceRate,
            getterSetter: true
        }
    }

    getContent = () => {
        const html = this.viewHtmlSvc.makeHtmlTable(this.table, true, true, this.element);
        return '<div class="table-wrapper">' + html + '</div>'
    }

    /** Full Table Filter **/
    public searchTerm = (newTerm: string): string => {
        this.eventSvc.$broadcast('update-search',{newInputVal: newTerm, oldInputVal: this._searchTerm});
        if (newTerm != this._searchTerm) {
            return this._searchTerm = newTerm;
        }
        else {
            return this._searchTerm;
        }
    };

    /** Add Full Table Filter ability **/
    public addFullTableFilter = (trs: JQuery<HTMLElement>): void => {
        this._fullTableFilterSub = this._addWatcherToFullTableFilterInput(() => {
            this._fullTableFilter(trs);
        });
    }

    /** Add a watcher to the Full Table Filter Input **/
    private _addWatcherToFullTableFilterInput = (performFilter: () => void): Rx.IDisposable => {
        return this.eventSvc.$on('update-search',(data) => {
            if (data.newInputVal !== data.oldInputVal) {
                performFilter();
            }
        })
    }

    /** Filter rows by search term **/
    private _fullTableFilter = (trs: JQuery<HTMLElement>) => {
        this._resetColumnWiseFilterInputs();
        if ( this._searchTerm === '' ) {
            this.numFiltered = trs.length;
            trs.show();
        } else {
            this.numFiltered = 0;
            this._displaySomeRows(trs, () => { this.numFiltered++; });
        }
    }

    /** Display rows that match the filter term **/
    private _displaySomeRows = (trs, increaseNumOfRowToShow) => {
        var regExp = new RegExp(this._searchTerm, 'i');
        for (let i = 0, numRows = trs.length; i < numRows; i++) {
            var string = $(trs[i]).text();
            if (regExp.test(string)) {
                $(trs[i]).show();
                increaseNumOfRowToShow();
            } else {
                $(trs[i]).hide();
            }
        }
    }
    /** End of Full Table Filter **/



    /** Column(s)-Wise Filter **/
    // vm.addColumnsWiseFilter = addColumnsWiseFilter;
    // vm._addWatchersForAllHeaderColumnsInput = _addWatchersForAllHeaderColumnsInput;
    // vm._addWatcherToColumnInput = _addWatcherToColumnInput;
    // vm._displayRowsMatchingAllColumnsFilterTerms = _displayRowsMatchingAllColumnsFilterTerms;
    // vm._storeColumnWiseFilterTerm = _storeColumnWiseFilterTerm;
    // vm._addNewColumnWiseFilterTerm = _addNewColumnWiseFilterTerm;
    // vm._updateExistingColumnWiseFilterTerm = _updateExistingColumnWiseFilterTerm;
    // vm._getCellValueForFiltering = _getCellValueForFiltering;
    // vm._resetColumnWiseFilterInputs = _resetColumnWiseFilterInputs;
    // vm._resetFullTableFilterInput = _resetFullTableFilterInput;

    /** Add column(s)-wise filter ability **/
    public addColumnsWiseFilter = (tableConfig: TableConfig, trs: JQuery<HTMLElement>) => {
        this._addWatchersForAllHeaderColumnsInput(tableConfig);
        this.filterByColumn = (filterTerm, startColNum, endColNum, filterInputBinding) => {
            this._resetFullTableFilterInput(trs);
            this._storeColumnWiseFilterTerm(filterInputBinding, startColNum, endColNum, filterTerm);
            this.numFiltered = 0;
            this._displayRowsMatchingAllColumnsFilterTerms(trs, () => {this.numFiltered++;});
        };

    }



    /** Add watchers to all header columns inputs for filtering **/
    private _addWatchersForAllHeaderColumnsInput = (tableConfig: TableConfig) => {
        if (!this.table.header) {
            return;
        }
        this.table.header.forEach((headerRow) => {
            headerRow.forEach((cell: TableCell) => {
                var filterInputBinding = tableConfig.filterTermColumnPrefixBinding + cell.startCol + cell.endCol;
                this._addWatcherToColumnInput(filterInputBinding, cell);
            });
        });
    }

    /** Add a watcher to one header column's input for filtering **/
    private _addWatcherToColumnInput = (filterInputBinding: string, cell: TableCell) => {
        this._columnsInputSubs[filterInputBinding] = {
            sub: this.eventSvc.$on(filterInputBinding, (data) => {
                if (data.newInputVal !== data.oldInputVal) {
                    this.filterByColumn(data.newInputVal, cell.startCol, cell.endCol, filterInputBinding);
                }
            }),
            cell: cell
        };
    }

    /** Clear out the filter term from the Full Table Filter input **/
    private _resetFullTableFilterInput = (trs: JQuery<HTMLElement>) => {
        if (this._searchTerm !== '') {
            this._fullTableFilterSub.dispose();
            this.searchTerm('');
            this._fullTableFilterSub = this._addWatcherToFullTableFilterInput(() =>{this._fullTableFilter(trs);});
        }
    }

    /** Only show the rows that has contents matching all currently outstanding filter terms **/
    private _displayRowsMatchingAllColumnsFilterTerms = (trs: JQuery<HTMLElement>, increaseNumOfRowToShow: () => any) => {
        trs.toArray().forEach((row) => {
            var shouldKeepRow = Object.keys(this._filterTermForColumns).every((k) => {
                var regExp = new RegExp(this._filterTermForColumns[k].filterTerm, 'i');
                return this._filterTermForColumns[k].columns.some((colNum) => {
                    return regExp.test(this._getCellValueForFiltering(row, colNum));
                });
            });
            if (shouldKeepRow) {
                $(row).show();
                increaseNumOfRowToShow();
            } else {
                $(row).hide();
            }
        });
    }

    /** Update or add a new filter term for a header column with the given filterInputBinding **/
    private _storeColumnWiseFilterTerm = (filterInputBinding: string, startColNum: number, endColNum: number, filterTerm: string) => {
        if (this._filterTermForColumns[filterInputBinding]) {
            this._updateExistingColumnWiseFilterTerm(filterInputBinding, filterTerm);
        } else {
            this._addNewColumnWiseFilterTerm(filterInputBinding, startColNum, endColNum, filterTerm);
        }
    }

    /** Add a new filter term to a header column with the given filterInputBinding **/
    private _addNewColumnWiseFilterTerm = (filterInputBinding: string, startColNum: number, endColNum: number, filterTerm: string) => {
        this._filterTermForColumns[filterInputBinding] = {filterTerm: filterTerm, columns: startColNum === endColNum ? [startColNum] : [startColNum, endColNum] };
    }

    /** Update a filter term for a header column with the given filterInputBinding **/
    private _updateExistingColumnWiseFilterTerm = (filterInputBinding: string, filterTerm: string) => {
        this._filterTermForColumns[filterInputBinding].filterTerm = filterTerm;
    }

    /** Return the content of a cell given a row & columnIndex **/
    private _getCellValueForFiltering = (row: HTMLElement, columnIndex: number) => {
        var cell = $(row).children('td').eq(columnIndex);
        return cell.text().trim();
    }

    /** Clear out filter term(s) for all header's columns that used to be filtered by before **/
    private _resetColumnWiseFilterInputs = () => {
        var listOfFilterInputBindings = Object.keys(this._filterTermForColumns);
        if ( listOfFilterInputBindings.length > 0 ) {
            listOfFilterInputBindings.forEach((filterInputBinding) => {
                if (this._filterTermForColumns[filterInputBinding].filterTerm !== '' ) {
                    this.eventSvc.destroy(this._columnsInputSubs[filterInputBinding].sub);
                }
                //$scope[filterInputBinding] = '';
                this._addWatcherToColumnInput(filterInputBinding, this._columnsInputSubs[filterInputBinding].cell );
                delete this._filterTermForColumns[filterInputBinding];
            });

        }
    }
    /** End of Column(s)-Wise Filter **/



    /** Sorting feature **/

    /** Add sorting ability **/
    public addSorting = (trs: JQuery<HTMLElement>, tbody: JQuery<HTMLElement>) => {
        this._addDefaultSortOrder(trs);
        this._addSortingBinding(trs, tbody);
        this._addSortResetBinding(trs, tbody);
    }

    /** Remember the original row number for each row. Used to restore sort order **/
    private _addDefaultSortOrder = (trs: JQuery<HTMLElement>) => {
        trs.each((rowNumber, tr) => {
            $(tr).attr(this._rowSortOrderAttrName, rowNumber );
        });
    }

    /** Used to sort columns(s). Add sort binding to each header columns of the outermost table **/
    private _addSortingBinding = (trs: JQuery<HTMLElement>, tbody: JQuery<HTMLElement>) => {

        this.tableConfig.showBindingForSortIcon = -1;

        this.tableConfig.sortByColumnFn = (sortColumnNum: number) => {
            this.tableConfig.showBindingForSortIcon = sortColumnNum;
            var rows = trs.toArray();
            var sortedRows = this._areAllCellValidNumber(rows, sortColumnNum) ?
                rows.sort(this._numericalComparator(sortColumnNum)) : rows.sort(this._generalComparator(sortColumnNum));

            this.isAscending = !this.isAscending;

            if (!this.isAscending) {
                sortedRows = sortedRows.reverse();
            }

            this._displaySortedRows(sortedRows, tbody);
            this.showSortReset = true;
        };
    }

    /** Used to restore the sort order of table's rows **/
    private _addSortResetBinding = (trs, tbody) => {
        this.resetSort = () => {
            var sortedRows = trs.toArray().sort(this._comparatorForSortReset());
            this._displaySortedRows(sortedRows, tbody);

            this.showSortReset = false;
            this.tableConfig.showBindingForSortIcon = -1;
        };
    }

    /** A comparator for sorting table's rows. When one of them is null ( null is reserved for non-sortable content
     *  such as  image, list, table ), that content is pushed to the end of the final sorted list regardless of
     *  whether sorting asc or dsc **/
    private _generalComparator = (columnIndex: number): (rowA: HTMLElement, rowB: HTMLElement) => number => {
        return (rowA: HTMLElement, rowB: HTMLElement): number => {
            var cellValueA = this._getCellValueForSorting(rowA, columnIndex);
            var cellValueB = this._getCellValueForSorting(rowB, columnIndex);

            if (cellValueA === null && cellValueB === null) {
                return 0;
            }

            if (cellValueA === null && cellValueB !== null) {
                return this.isAscending ? 1 : -1;
            }

            if (cellValueA !== null && cellValueB === null) {
                return this.isAscending ? -1 : 1;
            }

            if (cellValueA !== null && cellValueB !== null) {
                cellValueA = cellValueA.toLowerCase();
                cellValueB = cellValueB.toLowerCase();
                return cellValueA < cellValueB ? -1 : cellValueA > cellValueB ? 1 : 0;
            }
        };
    }

    /** Return true if and only if all cells' value can be converted to a valid number **/
    private _areAllCellValidNumber = (rows: HTMLElement[], columnIndex) => {
        return rows.every((row): boolean => {
            return this._isValidNumber(this._getCellValueForSorting(row, columnIndex));
        });
    }

    private _numericalComparator = (columnIndex: number): (rowA: HTMLElement, rowB: HTMLElement) => number => {
        return (rowA: HTMLElement, rowB: HTMLElement) => {
            var cellValueA = Number(this._getCellValueForSorting(rowA, columnIndex));
            var cellValueB = Number(this._getCellValueForSorting(rowB, columnIndex));
            return cellValueA - cellValueB;
        };
    }

    private _isValidNumber = (val) => {
        return val !== null && !isNaN(Number(val));
    }

    /** Get content of a cell given its row and its columnIndex. Return null for a cell that contains non-sortable
     *  content such as image, table, list **/
    private _getCellValueForSorting = (row: HTMLElement, columnIndex: number) => {
        var cell = $(row).children('td').eq(columnIndex);
        var containerDivContent = cell.children('div').contents();
        // if there is no content, think of it as empty string
        if (containerDivContent.length === 0) {
            return '';
        } else if(!containerDivContent.prop('tagName')) {
            return cell.text().trim();
        } else {
            var cf = 'mms-cf';
            var contentTag = containerDivContent.prop('tagName').toLowerCase();
            var contentTagAttr = containerDivContent.attr('mms-cf-type');
            if ( contentTag === 'img' || contentTag === 'table' || contentTag === cf && ( contentTagAttr === 'img' || contentTagAttr === 'table' )) {
                return null;
            } else {
                return cell.text().trim();
            }
        }
    }

    /** Display newly sorted rows **/
    private _displaySortedRows = (sortedRows, tbody) => {
        $(sortedRows).detach().appendTo(tbody);
    }

    /** This special comparator is used to turn the table's rows into its original sort order **/
    private _comparatorForSortReset = () => {
        return (rowA, rowB) => {
            var rowARowNumber = Number($(rowA).attr(this._rowSortOrderAttrName));
            var rowBRowNumber = Number($(rowB).attr(this._rowSortOrderAttrName));
            return rowARowNumber < rowBRowNumber ? -1 : rowARowNumber > rowBRowNumber ? 1 : 0;
        };
    }
    /** End of Sorting feature **/


    /** Begin Linking Functions **/

    public getSortIconClass = (cellColumn) => {
        var sortingColumnNumber = this.tableConfig.showBindingForSortIcon;
        if ( sortingColumnNumber !== cellColumn ) {
            return ['fa', 'fa-sort', 'sort-default' ];
        } else {
            if ( this.isAscending ) {
                return ['fa', 'fa-caret-down', 'sort-activated' ];
            } else {
                return ['fa', 'fa-caret-up', 'sort-activated' ];
            }
        }
    };


    makeCsv = () => {
        var csvString = this.$element.find('.table-wrapper').children('table').table2CSV({delivery:'value'});
        // var bom = "\xEF\xBB\xBF"; //just for excel
        var bom2 = "\uFEFF";      //just for excel
        var blob = new Blob([bom2 + csvString], {
            type: "text/csv;charset=utf-8;"
        });

        var downloadContainer = angular.element('<div data-tap-disabled="true"><a></a></div>');
        var downloadLink = angular.element(downloadContainer.children()[0]);
        downloadLink.attr('href', window.URL.createObjectURL(blob));
        downloadLink.attr('download', 'TableData.csv');
        downloadLink.attr('target', '_blank');

        this.$document.find('body').append(downloadContainer);
        this.$timeout(() => {
            downloadLink[0].click();
            downloadLink.remove();
        }, null);
    };

    public scroll = () => {
        if (this.fixedColumns) {
            $(this._fixedColumnsElem).css('transform', function(this: HTMLElement, index: number, value: string ) {
                return 'translateX('+ this.scrollLeft + 'px)';
            });
        }
        if (this.fixedHeaders) {
            $(this._fixedHeadersElem).css('transform', function(this: HTMLElement, index: number, value: string ) {
                return 'translateY('+ this.scrollTop +'px)'
            });
        }
        if (this._fixedHeadersElem && this._fixedColumnsElem) {
            this.$captionEl.css('transform', function (this: HTMLElement, index: number, value: string) {
                return 'translate(' + this.scrollLeft + 'px, ' + this.scrollTop + 'px)'
            });
        }
    }
    public makeFixedHeader = () => {
        if (!this.fixedHeaders) {
            this.$element.find('.table-wrapper').removeClass('table-fix-head').css('height', '');
            this._fixedHeadersElem.css('transform', '').css('will-change', '');
            this._fixedHeadersElem = null;
            this.$window.localStorage.setItem('ve-table-header-' + this.element.id, 'false');
            return;
        }
        this.$element.find('.table-wrapper').addClass('table-fix-head').css('height', this.$window.innerHeight - 36*3);
        //heights for navbar, menu, toolbar
        this._fixedHeadersElem =this.$element.find('thead, caption');
        this._fixedHeadersElem.css('will-change', 'transform'); //browser optimization
        this.$element.find('.table-fix-head').on('scroll', this.scroll);
        this.$window.localStorage.setItem('ve-table-header-' + this.element.id, 'true');
    }


    public makeFixedColumn = () => {
        if (!this.fixedColumns) {
            this.$element.find('.table-wrapper').removeClass('table-fix-column').css('width', '');
            this._fixedColumnsElem.css('transform', '').css('will-change', '').removeClass('table-fixed-cell');
            this._fixedColumnsElem = null;
            this.$window.localStorage.setItem('ve-table-column-' + this.element.id, 'false');
            return;
        }
        this.$element.find('.table-wrapper').addClass('table-fix-column').css('width', this.$window.innerWidth - 400);
        this._fixedColumnsElem = this._findColumnCells('thead', 'th', this.numFixedColumns);
        this._fixedColumnsElem = this._fixedColumnsElem.add(this._findColumnCells('tbody', 'td', this.numFixedColumns));
        this._fixedColumnsElem = this._fixedColumnsElem.add(this.$element.find('.table-fix-column caption'));
        this._fixedColumnsElem.css('will-change', 'transform'); //browser optimization
        this._fixedColumnsElem.addClass('table-fixed-cell');
        this.$element.find('.table-fix-column').on('scroll', this.scroll);
        this.$window.localStorage.setItem('ve-table-column-' + this.element.id, this.numFixedColumns.toString());
    };

    public updateFixedColumns = () => {
        this.fixedColumns = false;
        this.makeFixedColumn();
        this.fixedColumns = true;
        this.makeFixedColumn();
    };

    private _findColumnCells = (bodyTag, cellTag, n) => {
        var spanData = {}; //if spanData[curRow][curCol] is true that means that 'cell' should be "" due to merged cell
        var curRow = 0;
        var data = $();
        $(this.$element).find('.table-fix-column table').children(bodyTag).children('tr').each((index, element) => {
            var curCol = 0;
            $(element).children(cellTag).each((index, element) => {
                while(spanData[curRow] && spanData[curRow][curCol]) {
                    curCol++;
                }
                if (curCol >= n) {
                    return;
                }
                data = data.add($(element));
                var rowstring = $(element).attr('rowspan');
                if (rowstring) {
                    var rowspan = parseInt(rowstring);
                    if (rowspan > 1) {
                        for (var i = 1; i < rowspan; i++) {
                            if (!spanData[curRow + i]) {
                                spanData[curRow + i] = {};
                            }
                            spanData[curRow + i][curCol] = true;
                        }
                    }
                }
                var colstring = $(element).attr('colspan');
                if (!colstring) {
                    curCol++;
                    return;
                }
                var colspan = parseInt(colstring);
                while (colspan > 1) {
                    curCol++;
                    colspan--;
                    if (rowspan > 1) {
                        for (var j = 1; j < rowspan; j++) {
                            spanData[curRow + j][curCol] = true;
                        }
                    }
                }
                curCol++;
            });
            curRow++;
        });
        return data;
    };

    private compileTable() {
        this.$timeout(() => {
            var first = this.nextIndex;
            if (first > this.lastIndex)
                return;
            var now = this.trs.slice(first, first + 300);
            this.$compile(now)(this.$scope);
            this.nextIndex = first + 300;
            if (this.nextIndex < this.lastIndex)
                this.compileTable();
            else {
                if (this.$window.localStorage.getItem('ve-table-header-' + this.element.id) == 'true') {
                    this.fixedHeaders = true;
                    this.makeFixedHeader();
                }
                var columnFix = this.$window.localStorage.getItem('ve-table-column-' + this.element.id);
                if (columnFix != 'false' && columnFix != null && columnFix != 'null') {
                    this.fixedColumns = true;
                    this.numFixedColumns = Number.parseInt(columnFix);
                    this.makeFixedColumn();
                }
            }
        }, 100, false);
    }
}

let PresentTableComponent: PresentationComponentOptions = {
    selector: 'presentTable',
    template: `
    <div class="tableSearch ve-table-filter">
    <button class="btn btn-sm export-csv-button btn-default" ng-click="$ctrl.makeCsv()">Export CSV</button> 
    <button class="btn btn-sm filter-table-button btn-default" ng-click="$ctrl.showFilter = !$ctrl.showFilter">Filter table</button> 
    <label class="btn btn-sm btn-default table-button"><input type="checkbox" class="fixed-header-checkbox" ng-model="$ctrl.fixedHeaders" ng-change="$ctrl.makeFixedHeader()" /> Freeze Headers</label> 
    <label class="btn btn-sm btn-default table-button"><input type="checkbox" class="fixed-header-checkbox" ng-model="$ctrl.fixedColumns" ng-change="$ctrl.makeFixedColumn()" /> Freeze Columns</label> 
    <label class="btn btn-sm table-button column-input-label" ng-show="fixedColumns">Columns to Freeze <input type="text" ng-show="$ctrl.fixedColumns" size="3" class="column-input" ng-model="$ctrl.numFixedColumns" /></label> 
    <button class="btn btn-sm btn-default table-button" ng-show="fixedColumns" ng-click="$ctrl.updateFixedColumns()">Update</button> 
    <button class="btn btn-sm reset-sort-button btn-default reset-sort-fade" ng-show="showSortReset" ng-click="$ctrl.resetSort()">Reset Sort</button>
    <span class = "ve-show-filter" ng-show="$ctrl.showFilter">
        <form style="display: inline" class="ve-filter-table-form"><input type="text" size="75" placeholder="Filter table" ng-model="$ctrl.searchTerm" ng-model-options="$ctrl.ngModelOptions"></form>
        <span class = "ve-filter-status">Showing <strong>{{$ctrl.numFiltered}}</strong> of <strong>{{$ctrl.numTotal}}</strong> Rows: </span>
    </span>
</div>          
`,
    bindings: {
        peObject: '<',
        element: '<',
        peNumber: '<'
    },
    controller: PresentTableController
}

veExt.component(PresentTableComponent.selector,PresentTableComponent);
