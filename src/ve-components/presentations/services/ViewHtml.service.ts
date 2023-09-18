import { ApplicationService } from '@ve-utils/application';

import { veComponents } from '@ve-components';

import { ITableConfig } from '@ve-types/components/presentation';
import {
    PresentationInstanceObject,
    PresentImageObject,
    PresentListObject,
    PresentTableObject,
    PresentTextObject,
    TableEntryObject,
} from '@ve-types/mms';

export class ViewHtmlService {
    public tableConfig: ITableConfig = {
        sortByColumnFn: () => {
            /* Put Sorting Logic here */
        },
        showBindingForSortIcon: -1,
        filterDebounceRate: 200,
        filterTermColumnPrefixBinding: 'filterTermForColumn',
    };

    static $inject = ['ApplicationService'];

    constructor(private applicationSvc: ApplicationService) {}

    /**
     * @name veComponents.TableService#makeHtmlTable
     * make html table based on table spec object
     *
     * @param {object} table table content
     * @param {boolean} isFilterable table content
     * @param {boolean} isSortable table content
     * @returns {string} generated html string
     */
    public makeHtmlTable = (table: PresentTableObject, isFilterable?: boolean, isSortable?: boolean, pe?): string => {
        const result = ['<table class="table-bordered table-condensed ' + (table.style ? table.style : '') + '">'];
        if (table.colwidths && table.colwidths.length > 0) {
            result.push('<colgroup>');
            for (let i = 0; i < table.colwidths.length; i++) {
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
            result.push(
                '<caption>Table {{$ctrl.instanceSpec._veNumber}}. {{$ctrl.table.title || $ctrl.instanceSpec.name}}</caption>'
            );
        } else if (table.title) {
            result.push('<caption>' + table.title + '</caption>');
        } //same for caption to control stacking context
        result.push('</table>');
        return result.join('');
    };

    /** Include row and column number for table's header data object **/
    public generateRowColNumber(header: TableEntryObject[][]): void {
        header.forEach((row, rowIndex) => {
            let startCol = 0;
            let colCounter = 0;
            row.forEach((cell, cellIndex) => {
                // startCol is always 0 except when row > 0th and on cell === 0th && rowSpan of the previous row's first element is larger than 1
                // This is the only time when we need to offset the starting colNumber for cells under merged this.column(s)
                if (rowIndex !== 0 && cellIndex === 0 && Number(header[rowIndex - 1][0].rowspan) > 1) {
                    startCol = Number(header[rowIndex - 1][0].colspan);
                }
                const colSpan = Number(cell.colspan);
                cell.startRow = rowIndex;
                cell.endRow = cell.startRow + Number(cell.rowspan) - 1;
                cell.startCol = startCol + colCounter;
                cell.endCol = cell.startCol + colSpan - 1;
                colCounter += colSpan;
            });
            startCol = 0;
            colCounter = 0;
        });
    }

    /**
     * @name veComponents.TableService#makeTableBody
     * make html table body based on body spec object
     *
     * @param {object} body body content
     * @param {boolean} isHeader is header
     * @param {boolean} isFilterable is filterable
     * @param {boolean} isSortable is sortable
     * @returns {string} generated html string
     */
    public makeTableBody(
        body: TableEntryObject[][],
        isHeader: boolean,
        isFilterable?: boolean,
        isSortable?: boolean
    ): string {
        if (isHeader && (isFilterable || isSortable)) {
            this.generateRowColNumber(body);
        }
        const result = [];
        const dtag: string = isHeader ? 'th' : 'td';
        body.forEach((row) => {
            result.push('<tr>');
            row.forEach((cell) => {
                result.push(`<${dtag} colspan="${cell.colspan}" rowspan="${cell.rowspan}">`);
                cell.content.forEach((thing) => {
                    if (isFilterable || isSortable) {
                        result.push('<div ng-style="{display: \'inline\'}">');
                    } else {
                        result.push('<div>');
                    }
                    let thingString = this.makeHtml(thing);
                    if (thing.type === 'Paragraph') {
                        if ((isFilterable || isSortable) && thing.sourceType === 'text' && dtag === 'th') {
                            thingString = thingString.replace('<p>', '<p ng-style="{display: \'inline\'}">');
                        }
                    }
                    result.push(thingString);
                    result.push('</div>');
                    if (isHeader) {
                        if (isSortable && Number(cell.colspan) === 1) {
                            result.push(
                                `<span ng-click="$ctrl.sortByColumnFn($event, ${cell.startCol})" ng-class="$ctrl.getSortIconClass(${cell.startCol})"></span>`
                            );
                        }
                        if (isFilterable) {
                            result.push(
                                `<input class="no-print ve-plain-input filter-input" type="text" placeholder="Filter column" ng-show="$ctrl.showFilter" ng-model-options="$ctrl.ngModelOptions" ng-change="$ctrl.filterByColumn(${cell.startCol}, ${cell.endCol})" ng-model="$ctrl.filterTermForColumn.filter${cell.startCol}${cell.endCol}">`
                            );
                        }
                    }
                });
                result.push('</' + dtag + '>');
            });
            result.push('</tr>');
        });
        return result.join('');
    }

    /**
     * @name veUtils/UtilsService#makeHtmlList
     * make html list string based on list spec object
     *
     * @param {object} list list specification object
     * @returns {string} generated html string
     */
    public makeHtmlList = (list: PresentListObject): string => {
        const result: string[] = [];
        if (list.ordered) result.push('<ol>');
        else result.push('<ul>');
        list.list.forEach((item) => {
            result.push('<li>');
            item.forEach((thing) => {
                result.push('<div>');
                result.push(this.makeHtml(thing));
                result.push('</div>');
            });
            result.push('</li>');
        });
        if (list.ordered) result.push('</ol>');
        else result.push('</ul>');
        return result.join('');
    };

    /**
     * @name veUtils/UtilsService#makeHtmlPara
     * make html para string based on para spec object
     *
     * @param {object} para paragraph spec object
     * @returns {string} generated html string
     */
    public makeHtmlPara = (para: PresentTextObject): string => {
        if (para.sourceType === 'text') return para.text;
        let t = 'doc';
        let attr = '';
        if (para.sourceProperty === 'name') {
            t = 'name';
        }
        if (para.sourceProperty === 'value') {
            t = 'val';
        }
        if (para.nonEditable) {
            attr = ` non-editable="${para.nonEditable.toString()}"`;
        }
        return '<mms-cf mms-cf-type="' + t + '" mms-element-id="' + para.source + '"' + attr + '></mms-cf>';
    };

    public makeHtml = (thing: PresentationInstanceObject): string => {
        if (thing.type === 'Paragraph') {
            return this.makeHtmlPara(thing as PresentTextObject);
        } else if (thing.type === 'Table') {
            return this.makeHtmlTable(thing as PresentTableObject);
        } else if (thing.type === 'List') {
            return this.makeHtmlList(thing as PresentListObject);
        } else if (thing.type === 'Image') {
            return `<mms-cf mms-cf-type="img" mms-element-id="${(thing as PresentImageObject).id}"></mms-cf>`;
        }
    };
}

veComponents.service('ViewHtmlService', ViewHtmlService);
