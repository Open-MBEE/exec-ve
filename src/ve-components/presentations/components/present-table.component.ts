import $ from 'jquery';

import { Presentation, PresentationService, ViewHtmlService } from '@ve-components/presentations';
import { Table2CSVService } from '@ve-components/presentations/services/Table2CSV.service';
import { ComponentService, ExtensionService } from '@ve-components/services';
import { ButtonBarService } from '@ve-core/button-bar';
import { ImageService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { SchemaService } from '@ve-utils/model-schema';

import { veComponents } from '@ve-components';

import { VePromise, VeQService } from '@ve-types/angular';
import { IPresentationComponentOptions, ITableConfig } from '@ve-types/components/presentation';
import { PresentTableObject, TableEntryObject } from '@ve-types/mms';

class PresentTableController extends Presentation {
    public $searchEl: JQuery<HTMLElement>;
    public $tHeadEl: JQuery<HTMLElement>;
    public $captionEl: JQuery<HTMLTableCaptionElement>;

    public table: PresentTableObject;
    public tableConfig: ITableConfig;
    private trs: JQuery<HTMLElement>;
    public ngModelOptions: angular.INgModelOptions;
    public showFilter: boolean = false;
    public fixedHeaders: boolean = false;
    public fixedColumns: boolean = false;
    private _fixedHeadersElem: JQuery<HTMLElement> = null;
    private _fixedColumnsElem: JQuery<HTMLElement> = null;
    public numFixedColumns: number = 2;
    private nextIndex: number;
    private tbody: JQuery<HTMLElement>;
    private lastIndex: number;
    private numTotal: number;
    private sortColumnNum: number;

    /** Full Table Filter **/

    private searchTerm: string = '';
    private numFiltered: number;

    /** Column Filter **/
    private _columnsInputSubs: {
        [columnId: string]: { sub: Rx.IDisposable; cell: TableEntryObject };
    } = {};

    /**
     * _filterTermForColumns is used to keep track of filter terms on each header's column for multi-columns
     * filtering. Some header columns could be a merged column, and have children columns. "columns" property
     * keeps track, of all the children columns number that it is a parent of. ie:
     * {filterTermForColumn01: {filterTerm: 'A', columns: [0,1]}, filterTermForColumn11: {filterTerm: 'B', columns: [1]}} **/
    private _filterTermForColumns: {
        [filterTermForColumn: string]: { filterTerm: string; columns: number[] };
    } = {};
    private filterTermForColumn: { [cols: string]: string } = {};

    /** Variables for Sorting Functions **/
    private _rowSortOrderAttrName = 'data-original-row-num';
    public isAscending: boolean = false;
    private showSortReset: boolean = false;

    static $inject = [...Presentation.$inject, '$timeout'];

    constructor(
        $q: VeQService,
        $element: JQuery<HTMLElement>,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        growl: angular.growl.IGrowlService,
        schemaSvc: SchemaService,
        viewHtmlSvc: ViewHtmlService,
        presentationSvc: PresentationService,
        componentSvc: ComponentService,
        eventSvc: EventService,
        imageSvc: ImageService,
        buttonBarSvc: ButtonBarService,
        extensionSvc: ExtensionService,
        private $timeout: angular.ITimeoutService
    ) {
        super(
            $q,
            $element,
            $scope,
            $compile,
            growl,
            schemaSvc,
            viewHtmlSvc,
            presentationSvc,
            componentSvc,
            eventSvc,
            imageSvc,
            buttonBarSvc,
            extensionSvc
        );
    }

    recompile = (): void => {
        this.$element.on('click', (e) => {
            const tag = (e.target as unknown as Element).tagName;
            if (tag === 'INPUT' || tag === 'LABEL' || tag === 'BUTTON') {
                e.stopPropagation();
            }
        });
        this.setNumber();
        this.getContent().then(
            (result) => {
                this.$transcludeEl = $(result);
                this.$transcludeEl.find('img').each((index, element) => {
                    this.imageSvc.fixImgSrc($(element));
                });

                this.$element.append(this.$transcludeEl);
                this.nextIndex = 0;
                this.$tHeadEl = this.$element.find('thead');
                this.$compile(this.$tHeadEl)(this.$scope);
                this.$searchEl = this.$element.children('div').eq(0);
                //this.$compile(this.$searchEl)(this.$scope) //already compiled due to template
                this.$captionEl = this.$element.find('caption');
                this.$compile(this.$captionEl)(this.$scope);
                //Add the search input here (before the TRS, aka the columns/rows)
                this.tbody = this.$element.find('.table-wrapper').children('table').children('tbody');
                this.trs = this.tbody.children('tr');

                this.lastIndex = this.trs.length;
                this.numFiltered = this.lastIndex;
                this.numTotal = this.lastIndex;

                //this.addColumnsWiseFilter(this.tableConfig, this.trs)
                this.addSorting(this.trs, this.tbody);

                this.compileTable();
            },
            (reason) => {
                const reqOb = {
                    elementId: this.instanceSpec.id,
                    projectId: this.projectId,
                    refId: this.refId,
                    commitId: this.commitId,
                    //includeRecentVersionElement: true,
                };
                this.$element.empty();
                //TODO: Add reason/errorMessage handling here.
                this.$transcludeEl = $(
                    '<annotation mms-element-id="::elementId" mms-recent-element="::recentElement" mms-type="::type"></annotation>'
                );
                this.$element.append(this.$transcludeEl);
                this.$compile(this.$transcludeEl)(
                    Object.assign(this.$scope.$new(), {
                        elementId: reqOb.elementId,
                        recentElement: reason.recentVersionOfElement,
                        type: 'presentation',
                    })
                );
            }
        );
    };

    config = (): void => {
        if (
            !(this.peObject as PresentTableObject).showIfEmpty &&
            (this.peObject as PresentTableObject).body.length === 0
        ) {
            return;
        }

        this.table = this.peObject as PresentTableObject;
        this.sortColumnNum = -1;
        this.ngModelOptions = {
            debounce: 300,
            getterSetter: true,
        };
    };

    getContent = (): VePromise<string, string> => {
        const html = this.viewHtmlSvc.makeHtmlTable(this.table, true, true, this.instanceSpec);
        return this.$q.resolve(`<div class="table-wrapper">${html}</div>`);
    };

    /** Filter rows by search term **/
    private fullTableFilter = (): void => {
        this._resetColumnWiseFilterInputs();
        if (this.searchTerm === '') {
            this.numFiltered = this.trs.length;
            this.trs.show();
        } else {
            this.numFiltered = 0;
            this._displaySomeRows(this.trs, () => {
                this.numFiltered++;
            });
        }
    };

    /** Display rows that match the filter term **/
    private _displaySomeRows = (trs: JQuery<HTMLElement>, increaseNumOfRowToShow: () => void): void => {
        const regExp = new RegExp(this.searchTerm, 'i');
        for (let i = 0, numRows = trs.length; i < numRows; i++) {
            const string = $(trs[i]).text();
            if (regExp.test(string)) {
                $(trs[i]).show();
                increaseNumOfRowToShow();
            } else {
                $(trs[i]).hide();
            }
        }
    };
    /** End of Full Table Filter **/

    /** Add column(s)-wise filter ability **/
    private filterByColumn = (startColNum: number, endColNum: number): void => {
        this.searchTerm = '';
        const filterTerm = this.filterTermForColumn[`filter${startColNum}${endColNum}`];
        const filterInputBinding = `columnFilter${startColNum}${endColNum}`;
        this._storeColumnWiseFilterTerm(filterInputBinding, startColNum, endColNum, filterTerm);
        this.numFiltered = 0;
        this._displayRowsMatchingAllColumnsFilterTerms(this.trs, () => {
            this.numFiltered++;
        });
    };

    /** Only show the rows that has contents matching all currently outstanding filter terms **/
    private _displayRowsMatchingAllColumnsFilterTerms = (
        trs: JQuery<HTMLElement>,
        increaseNumOfRowToShow: () => void
    ): void => {
        trs.toArray().forEach((row) => {
            const shouldKeepRow = Object.keys(this._filterTermForColumns).every((k) => {
                const regExp = new RegExp(this._filterTermForColumns[k].filterTerm, 'i');
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
    };

    /** Update or add a new filter term for a header column with the given filterInputBinding **/
    private _storeColumnWiseFilterTerm = (
        filterInputBinding: string,
        startColNum: number,
        endColNum: number,
        filterTerm: string
    ): void => {
        if (this._filterTermForColumns[filterInputBinding]) {
            this._updateExistingColumnWiseFilterTerm(filterInputBinding, filterTerm);
        } else {
            this._addNewColumnWiseFilterTerm(filterInputBinding, startColNum, endColNum, filterTerm);
        }
    };

    /** Add a new filter term to a header column with the given filterInputBinding **/
    private _addNewColumnWiseFilterTerm = (
        filterInputBinding: string,
        startColNum: number,
        endColNum: number,
        filterTerm: string
    ): void => {
        this._filterTermForColumns[filterInputBinding] = {
            filterTerm: filterTerm,
            columns: startColNum === endColNum ? [startColNum] : [startColNum, endColNum],
        };
    };

    /** Update a filter term for a header column with the given filterInputBinding **/
    private _updateExistingColumnWiseFilterTerm = (filterInputBinding: string, filterTerm: string): void => {
        this._filterTermForColumns[filterInputBinding].filterTerm = filterTerm;
    };

    /** Return the content of a cell given a row & columnIndex **/
    private _getCellValueForFiltering = (row: HTMLElement, columnIndex: number): string => {
        const cell = $(row).children('td').eq(columnIndex);
        return cell.text().trim();
    };

    /** Clear out filter term(s) for all header's columns that used to be filtered by before **/
    private _resetColumnWiseFilterInputs = (): void => {
        const listOfFilterInputBindings = Object.keys(this._filterTermForColumns);
        if (listOfFilterInputBindings.length > 0) {
            listOfFilterInputBindings.forEach((filterInputBinding) => {
                delete this._filterTermForColumns[filterInputBinding];
            });
        }
        Object.keys(this.filterTermForColumn).forEach((key) => {
            this.filterTermForColumn[key] = '';
        });
    };
    /** End of Column(s)-Wise Filter **/

    /** Sorting feature **/

    /** Add sorting ability **/
    public addSorting = (trs: JQuery<HTMLElement>, tbody: JQuery<HTMLElement>): void => {
        this._addDefaultSortOrder(trs);
    };

    /** Remember the original row number for each row. Used to restore sort order **/
    private _addDefaultSortOrder = (trs: JQuery<HTMLElement>): void => {
        trs.each((rowNumber, tr) => {
            $(tr).attr(this._rowSortOrderAttrName, rowNumber);
        });
    };

    /** Used to sort columns(s). Add sort binding to each header columns of the outermost table **/

    private sortByColumnFn = (event: Event, sortColumnNum: number): void => {
        this.sortColumnNum = sortColumnNum;
        event.stopPropagation();
        const rows = this.trs.toArray();
        let sortedRows = this._areAllCellValidNumber(rows, sortColumnNum)
            ? rows.sort(this._numericalComparator(sortColumnNum))
            : rows.sort(this._generalComparator(sortColumnNum));

        this.isAscending = !this.isAscending;

        if (!this.isAscending) {
            sortedRows = sortedRows.reverse();
        }

        this._displaySortedRows(sortedRows, this.tbody);
        this.showSortReset = true;
    };
    /** Used to restore the sort order of table's rows **/
    private resetSort = (): void => {
        const sortedRows = this.trs.toArray().sort(this._comparatorForSortReset());
        this._displaySortedRows(sortedRows, this.tbody);
        this.showSortReset = false;
        this.sortColumnNum = -1;
    };
    /** A comparator for sorting table's rows. When one of them is null ( null is reserved for non-sortable content
     *  such as  image, list, table ), that content is pushed to the end of the final sorted list regardless of
     *  whether sorting asc or dsc **/
    private _generalComparator = (columnIndex: number): ((rowA: HTMLElement, rowB: HTMLElement) => number) => {
        return (rowA: HTMLElement, rowB: HTMLElement): number => {
            let cellValueA = this._getCellValueForSorting(rowA, columnIndex);
            let cellValueB = this._getCellValueForSorting(rowB, columnIndex);

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
    };

    /** Return true if and only if all cells' value can be converted to a valid number **/
    private _areAllCellValidNumber = (rows: HTMLElement[], columnIndex: number): boolean => {
        return rows.every((row): boolean => {
            return this._isValidNumber(this._getCellValueForSorting(row, columnIndex));
        });
    };

    private _numericalComparator = (columnIndex: number): ((rowA: HTMLElement, rowB: HTMLElement) => number) => {
        return (rowA: HTMLElement, rowB: HTMLElement) => {
            const cellValueA = Number(this._getCellValueForSorting(rowA, columnIndex));
            const cellValueB = Number(this._getCellValueForSorting(rowB, columnIndex));
            return cellValueA - cellValueB;
        };
    };

    private _isValidNumber = (val): boolean => {
        return val !== null && !isNaN(Number(val));
    };

    /** Get content of a cell given its row and its columnIndex. Return null for a cell that contains non-sortable
     *  content such as image, table, list **/
    private _getCellValueForSorting = (row: HTMLElement, columnIndex: number): string => {
        const cell = $(row).children('td').eq(columnIndex);
        const containerDivContent = cell.children('div').contents();
        // if there is no content, think of it as empty string
        if (containerDivContent.length === 0) {
            return '';
        } else if (!containerDivContent.prop('tagName')) {
            return cell.text().trim();
        } else {
            const cf = 'mms-cf';
            const contentTag: string = (containerDivContent.prop('tagName') as object).toString().toLowerCase();
            const contentTagAttr = containerDivContent.attr('mms-cf-type');
            if (
                contentTag === 'img' ||
                contentTag === 'table' ||
                (contentTag === cf && (contentTagAttr === 'img' || contentTagAttr === 'table'))
            ) {
                return null;
            } else {
                return cell.text().trim();
            }
        }
    };

    /** Display newly sorted rows **/
    private _displaySortedRows = (sortedRows: HTMLElement[], tbody: JQuery<HTMLElement>): void => {
        $(sortedRows).detach().appendTo(tbody);
    };

    /** This special comparator is used to turn the table's rows into its original sort order **/
    private _comparatorForSortReset = () => {
        return (rowA, rowB): number => {
            const rowARowNumber = Number($(rowA).attr(this._rowSortOrderAttrName));
            const rowBRowNumber = Number($(rowB).attr(this._rowSortOrderAttrName));
            return rowARowNumber < rowBRowNumber ? -1 : rowARowNumber > rowBRowNumber ? 1 : 0;
        };
    };
    /** End of Sorting feature **/

    /** Begin Linking Functions **/

    public getSortIconClass = (cellColumn): string[] => {
        const sortingColumnNumber = this.sortColumnNum;
        if (sortingColumnNumber !== cellColumn) {
            return ['fa', 'fa-sort', 'sort-default'];
        } else {
            if (this.isAscending) {
                return ['fa', 'fa-caret-down', 'sort-activated'];
            } else {
                return ['fa', 'fa-caret-up', 'sort-activated'];
            }
        }
    };

    makeCsv = (): void => {
        const el = this.$element.find('.table-wrapper').children('table');
        const csvString: string | boolean = Table2CSVService.export(el, { delivery: 'value' });
        // var bom = "\xEF\xBB\xBF"; //just for excel
        if (typeof csvString === 'string') {
            const bom2 = '\uFEFF'; //just for excel
            const blob = new Blob([bom2 + csvString], {
                type: 'text/csv;charset=utf-8;',
            });

            const downloadContainer = angular.element('<div data-tap-disabled="true"><a></a></div>');
            const downloadLink = angular.element(downloadContainer.children()[0]);
            downloadLink.attr('href', window.URL.createObjectURL(blob));
            downloadLink.attr('download', 'TableData.csv');
            downloadLink.attr('target', '_blank');

            $(document).find('body').append(downloadContainer);
            void this.$timeout(() => {
                downloadLink[0].click();
                downloadLink.remove();
            }, null);
        } else {
            this.growl.error('Error generating CSV; Please Try Again');
        }
    };

    public scroll = (): void => {
        if (this._fixedColumnsElem) {
            const scroll = this.$element.find('.table-fix-column').scrollLeft();
            this._fixedColumnsElem.css('transform', `translateX(${scroll}px)`);
        }
        if (this._fixedHeadersElem) {
            const scroll = this.$element.find('.table-fix-head').scrollTop();
            this._fixedHeadersElem.css('transform', `translateY(${scroll}px)`);
        }
        if (this._fixedHeadersElem && this._fixedColumnsElem) {
            const scrollX = this.$element.find('.table-fix-column').scrollLeft();
            const scrollY = this.$element.find('.table-fix-head').scrollTop();
            this.$captionEl.css('transform', `translate(${scrollX}px, ${scrollY}px)`);
        }
    };
    public makeFixedHeader = (): void => {
        if (!this.fixedHeaders) {
            this.$element.find('.table-wrapper').removeClass('table-fix-head').css('height', '');
            this._fixedHeadersElem.css('transform', '').css('will-change', '');
            this._fixedHeadersElem = null;
            window.localStorage.setItem('ve-table-header-' + this.instanceSpec.id, 'false');
            return;
        }
        this.$element
            .find('.table-wrapper')
            .addClass('table-fix-head')
            .css('height', window.innerHeight - 36 * 3);
        //heights for navbar, menu, toolbar
        this._fixedHeadersElem = this.$element.find('thead, caption');
        this._fixedHeadersElem.css('will-change', 'transform'); //browser optimization
        this.$element.find('.table-fix-head').on('scroll', this.scroll);
        window.localStorage.setItem('ve-table-header-' + this.instanceSpec.id, 'true');
    };

    public makeFixedColumn = (): void => {
        if (!this.fixedColumns) {
            this.$element.find('.table-wrapper').removeClass('table-fix-column').css('width', '');
            this._fixedColumnsElem.css('transform', '').css('will-change', '').removeClass('table-fixed-cell');
            this._fixedColumnsElem = null;
            window.localStorage.setItem('ve-table-column-' + this.instanceSpec.id, 'false');
            return;
        }
        this.$element
            .find('.table-wrapper')
            .addClass('table-fix-column')
            .css('width', window.innerWidth - 400);
        this._fixedColumnsElem = this._findColumnCells('thead', 'th', this.numFixedColumns);
        this._fixedColumnsElem = this._fixedColumnsElem.add(this._findColumnCells('tbody', 'td', this.numFixedColumns));
        this._fixedColumnsElem = this._fixedColumnsElem.add(this.$element.find('.table-fix-column caption'));
        this._fixedColumnsElem.css('will-change', 'transform'); //browser optimization
        this._fixedColumnsElem.addClass('table-fixed-cell');
        this.$element.find('.table-fix-column').on('scroll', this.scroll);
        window.localStorage.setItem('ve-table-column-' + this.instanceSpec.id, this.numFixedColumns.toString());
    };

    public updateFixedColumns = (): void => {
        this.fixedColumns = false;
        this.makeFixedColumn();
        this.fixedColumns = true;
        this.makeFixedColumn();
    };

    private _findColumnCells = (bodyTag: string, cellTag: string, n: number): JQuery<HTMLElement> => {
        const spanData: boolean[][] = []; //if spanData[curRow][curCol] is true that means that 'cell' should be "" due to merged cell
        let curRow = 0;
        let data = $();
        $(this.$element)
            .find('.table-fix-column table')
            .children(bodyTag)
            .children('tr')
            .each((index, element) => {
                let curCol = 0;
                $(element)
                    .children(cellTag)
                    .each((index, element) => {
                        while (spanData[curRow] && spanData[curRow][curCol]) {
                            curCol++;
                        }
                        if (curCol >= n) {
                            return;
                        }
                        data = data.add($(element));
                        const rowstring = $(element).attr('rowspan');
                        let rowspan = 0;
                        if (rowstring) {
                            rowspan = parseInt(rowstring);
                            if (rowspan > 1) {
                                for (let i = 1; i < rowspan; i++) {
                                    if (!spanData[curRow + i]) {
                                        spanData[curRow + i] = [];
                                    }
                                    spanData[curRow + i][curCol] = true;
                                }
                            }
                        }
                        const colstring = $(element).attr('colspan');
                        if (!colstring) {
                            curCol++;
                            return;
                        }
                        let colspan = parseInt(colstring);
                        while (colspan > 1) {
                            curCol++;
                            colspan--;
                            if (rowspan > 1) {
                                for (let j = 1; j < rowspan; j++) {
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

    private compileTable(): void {
        void this.$timeout(
            () => {
                const first = this.nextIndex;
                if (first > this.lastIndex) return;
                const now = this.trs.slice(first, first + 300);
                this.$compile(now)(this.$scope);
                this.nextIndex = first + 300;
                if (this.nextIndex < this.lastIndex) this.compileTable();
                else {
                    if (window.localStorage.getItem('ve-table-header-' + this.instanceSpec.id) == 'true') {
                        this.fixedHeaders = true;
                        this.makeFixedHeader();
                    }
                    const columnFix = window.localStorage.getItem('ve-table-column-' + this.instanceSpec.id);
                    if (columnFix != 'false' && columnFix != null && columnFix != 'null') {
                        this.fixedColumns = true;
                        this.numFixedColumns = Number.parseInt(columnFix);
                        this.makeFixedColumn();
                    }
                }
            },
            100,
            false
        );
    }
}

const PresentTableComponent: IPresentationComponentOptions = {
    selector: 'presentTable',
    template: `
    <div class="tableSearch ve-table-filter">
    <button class="btn btn-sm export-csv-button btn-default" ng-click="$ctrl.makeCsv()">Export CSV</button> 
    <button class="btn btn-sm filter-table-button btn-default" ng-click="$ctrl.showFilter = !$ctrl.showFilter">Filter table</button> 
    <label class="btn btn-sm btn-default table-button"><input type="checkbox" class="fixed-header-checkbox" ng-model="$ctrl.fixedHeaders" ng-change="$ctrl.makeFixedHeader()" /> Freeze Headers</label> 
    <label class="btn btn-sm btn-default table-button"><input type="checkbox" class="fixed-header-checkbox" ng-model="$ctrl.fixedColumns" ng-change="$ctrl.makeFixedColumn()" /> Freeze Columns</label> 
    <label class="btn btn-sm table-button column-input-label" ng-show="$ctrl.fixedColumns">Columns to Freeze <input type="text" ng-show="$ctrl.fixedColumns" size="3" class="column-input" ng-model="$ctrl.numFixedColumns" /></label> 
    <button class="btn btn-sm btn-default table-button" ng-show="$ctrl.fixedColumns" ng-click="$ctrl.updateFixedColumns()">Update</button> 
    <button class="btn btn-sm reset-sort-button btn-default reset-sort-fade" ng-show="$ctrl.showSortReset" ng-click="$ctrl.resetSort()">Reset Sort</button>
    <span class="ve-show-filter" ng-show="$ctrl.showFilter">
        <form style="display: inline" class="ve-filter-table-form"><input type="text" size="75" placeholder="Filter table" ng-model="$ctrl.searchTerm" ng-model-options="$ctrl.ngModelOptions" ng-change="$ctrl.fullTableFilter()"></form>
        <span class="ve-filter-status">Showing <strong>{{$ctrl.numFiltered}}</strong> of <strong>{{$ctrl.numTotal}}</strong> Rows: </span>
    </span>
</div>          
`,
    bindings: {
        peObject: '<',
        instanceSpec: '<',
        peNumber: '<',
    },
    controller: PresentTableController,
};

veComponents.component(PresentTableComponent.selector, PresentTableComponent);
