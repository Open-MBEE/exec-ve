import {ApplicationService} from "@ve-utils/core-services";

import {veExt} from "@ve-ext";
import { PresentationInstanceObject } from "@ve-types/mms";

export interface TableConfig {
    sortByColumnFn: Function,
    showBindingForSortIcon: number,
    filterDebounceRate: number,
    filterTermColumnPrefixBinding: string
}

export interface TableCell {
    endCol: number;
    startCol: number;

}

export class ViewHtmlService {

    public tableConfig: TableConfig = {
        sortByColumnFn: () => {},
        showBindingForSortIcon: -1,
        filterDebounceRate: 200,
        filterTermColumnPrefixBinding: 'filterTermForColumn'
    };

    static $inject = ['ApplicationService'];

    constructor(private applicationSvc : ApplicationService) {}

    /**
     * @ngdoc method
     * @name veExt.TableService#makeHtmlTable
     * @methodOf veExt.TableService
     *
     * @description
     * make html table based on table spec object
     *
     * @param {object} table table content
     * @param {boolean} isFilterable table content
     * @param {boolean} isSortable table content
     * @returns {string} generated html string
     */
    public makeHtmlTable(table, isFilterable?, isSortable?, pe?) {
        var result = ['<table class="table-bordered table-condensed ' + (table.style ? table.style : '') + '">'];
        if (table.colwidths && table.colwidths.length > 0) {
            result.push('<colgroup>');
            for (var i = 0; i < table.colwidths.length; i++) {
                if (table.colwidths[i]) {
                    result.push('<col style="width: ' + table.colwidths[i] + '">');
                } else {
                    result.push('<col>');
                }
            }
            result.push('</colgroup>');
        }
        result.push('<tbody>'); //put tbody before thead to control stacking context so if freeze header/columns are both used headers cover cells (?)
        //https://stackoverflow.com/questions/45676848/stacking-context-on-table-elementhead-and-body
        result.push(this.makeTableBody(table.body, false));
        result.push('</tbody>');
        if (table.header && table.header.length) {
            // only add styling to the filterable or sortable header
            if (isFilterable || isSortable) {
                result.push('<thead class="doc-table-header" >');
            } else {
                result.push('<thead>');
            }

            result.push(this.makeTableBody(table.header, true, isFilterable, isSortable));
            result.push('</thead>');
        }
        if (this.applicationSvc.getState().inDoc && !table.excludeFromList) {
            result.push('<caption>Table {{$ctrl.peNumber}}. {{$ctrl.table.title || $ctrl.element.name}}</caption>');
        } else if (table.title) {
            result.push('<caption>' + table.title + '</caption>');
        } //same for caption to control stacking context
        result.push('</table>');
        return result.join('');
    };

    /** Include row and column number for table's header data object **/
    public generateRowColNumber(header) {
        header.forEach(function (row, rowIndex) {
            var startCol = 0;
            var colCounter = 0;
            row.forEach(function (cell, cellIndex) {
                // startCol is always 0 except when row > 0th and on cell === 0th && rowSpan of the previous row's first element is larger than 1
                // This is the only time when we need to offset the starting colNumber for cells under merged this.column(s)
                if (rowIndex !== 0 && cellIndex === 0 && Number(header[rowIndex - 1][0].rowspan) > 1) {
                    startCol = Number(header[rowIndex - 1][0].colspan);
                }
                var colSpan = Number(cell.colspan);
                cell.startRow = rowIndex;
                cell.endRow = cell.startRow + Number(cell.rowspan) - 1;
                cell.startCol = startCol + colCounter;
                cell.endCol = cell.startCol + colSpan - 1;
                colCounter += colSpan;
            });
            startCol = 0;
            colCounter = 0;
        });
    };

    /**
     * @ngdoc method
     * @name veExt.TableService#makeTableBody
     * @methodOf veExt.TableService
     *
     * @description
     * make html table body based on body spec object
     *
     * @param {object} body body content
     * @param {boolean} isHeader is header
     * @param {boolean} isFilterable is filterable
     * @param {boolean} isSortable is sortable
     * @returns {string} generated html string
     */
    public makeTableBody(body, isHeader, isFilterable?, isSortable?) {
        if (isHeader && (isFilterable || isSortable)) {
            this.generateRowColNumber(body);
        }
        var result = [], i, j, k, row, cell, thing;
        var dtag = (isHeader ? 'th' : 'td');
        for (i = 0; i < body.length; i++) {
            result.push('<tr>');
            row = body[i];
            for (j = 0; j < row.length; j++) {
                cell = row[j];
                result.push('<' + dtag + ' colspan="' + cell.colspan + '" rowspan="' + cell.rowspan + '">');
                for (k = 0; k < cell.content.length; k++) {
                    thing = cell.content[k];
                    if (isFilterable || isSortable) {
                        result.push('<div ng-style="{display: \'inline\'}">');
                    } else {
                        result.push('<div>');
                    }

                    if (thing.type === 'Paragraph') {
                        var para = this.makeHtmlPara(thing);
                        // add special styling for header's title
                        if ((isFilterable || isSortable) && thing.sourceType === 'text') {
                            para = para.replace('<p>', '<p ng-style="{display: \'inline\'}">');
                        }
                        result.push(para);
                    } else if (thing.type === 'Table') {
                        result.push(this.makeHtmlTable(thing));
                    } else if (thing.type === 'List') {
                        result.push(this.makeHtmlList(thing));
                    } else if (thing.type === 'Image') {
                        //todo use mmsCf
                        result.push('<mms-cf mms-cf-type="img" mms-element-id="' + thing.id + '"></mms-cf>');
                    }
                    result.push('</div>');
                    if (isHeader) {
                        if (isSortable && Number(cell.colspan) === 1) {
                            result.push('<span' + ' ng-click=\"$ctrl.tableConfig.sortByColumnFn(' + cell.startCol + ')\" ng-class=\"' + 'getSortIconClass(' + cell.startCol + ')' + '\"></span>');
                        }
                        if (isFilterable) {
                            result.push('<input class="no-print ve-plain-input filter-input" type="text" placeholder="Filter column"' + ' ng-show="showFilter" ng-model-options=\"{debounce: ' + this.tableConfig.filterDebounceRate + '}\"' + ' ng-model=\"' + this.tableConfig.filterTermColumnPrefixBinding + cell.startCol + cell.endCol + '\">');
                        }
                    }
                }
                result.push('</' + dtag + '>');
            }
            result.push('</tr>');
        }
        return result.join('');
    };

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#makeHtmlList
     * @methodOf veUtils/UtilsService
     *
     * @description
     * make html list string based on list spec object
     *
     * @param {object} list list specification object
     * @returns {string} generated html string
     */
    public makeHtmlList(list) {
        var result = [], i, j, item, thing;
        if (list.ordered)
            result.push('<ol>');
        else
            result.push('<ul>');
        for (i = 0; i < list.list.length; i++) {
            item = list.list[i];
            result.push('<li>');
            for (j = 0; j < item.length; j++) {
                thing = item[j];
                result.push('<div>');
                if (thing.type === 'Paragraph') {
                    result.push(this.makeHtmlPara(thing));
                } else if (thing.type === 'Table') {
                    result.push(this.makeHtmlTable(thing));
                } else if (thing.type === 'List') {
                    result.push(this.makeHtmlList(thing));
                } else if (thing.type === 'Image') {
                    result.push('<mms-cf mms-cf-type="img" mms-element-id="' + thing.id + '"></mms-cf>');
                }
                result.push('</div>');
            }
            result.push('</li>');
        }
        if (list.ordered)
            result.push('</ol>');
        else
            result.push('</ul>');
        return result.join('');
    };

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#makeHtmlPara
     * @methodOf veUtils/UtilsService
     *
     * @description
     * make html para string based on para spec object
     *
     * @param {object} para paragraph spec object
     * @returns {string} generated html string
     */
    public makeHtmlPara(para: PresentationInstanceObject): string {
        if (para.sourceType === 'text')
            return para.text;
        var t = 'doc';
        var attr = '';
        if (para.sourceProperty === 'name') {
            t = 'name';
        }
        if (para.sourceProperty === 'value') {
            t = 'val';
        }
        if (para.nonEditable) {
            attr = ' non-editable="' + para.nonEditable + '"';
        }
        //TODO update these to match mmsCF
        return '<transclusion mms-cf-type="' + t + '" mms-element-id="' + para.source + '"' + attr + '></transclusion>';
    };
}

veExt.service('ViewHtmlService', ViewHtmlService);