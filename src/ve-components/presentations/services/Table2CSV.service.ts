import { veComponents } from '@ve-components';

export class Table2CSVService {
    public static export(el: JQuery, inputOptions: JQuery.table2CSV.inputOptions): string {
        const options = jQuery.extend(
            <JQuery.table2CSV.inputOptions>{
                separator: ',',
                header: [],
                delivery: 'popup', // popup, value
            },
            inputOptions
        );

        const csvData: string[] = [];
        // const el = this
        const row2CSV = (tmpRow: string[]): void => {
            const tmp = tmpRow.join(''); // to remove any blank rows
            if (tmpRow.length > 0 && tmp != '') {
                csvData[csvData.length] = tmpRow.join(options.separator);
            }
        };
        const formatData = (input: string): string => {
            // replace " with “
            const regexp = new RegExp(/["]/g);
            let output = input.replace(regexp, '“');
            //HTML
            // var regexp = new RegExp(/\<[^\<]+\>/g);
            // var output = output.replace(regexp, "");
            const i = output.search(/\S/); //index of first non whitespace char
            if (i > 0) {
                output = '_'.repeat(i) + $.trim(output);
            }
            output = $.trim(output);
            if (output == '') return '';
            if (output[0] == '+' || output[0] == '=' || output[0] == '-') {
                output = ' ' + output;
            }
            return `"${output}"`;
        };
        const popup = (data: string): string => {
            const generator = window.open('', 'csv', 'height=400,width=600');
            generator.document.write('<html lang="en"><head><title>CSV</title>');
            generator.document.write('</head><body >');
            generator.document.write('<textArea cols=70 rows=15 wrap="off" >');
            generator.document.write(data);
            generator.document.write('</textArea>');
            generator.document.write('</body></html>');
            generator.document.close();
            return 'ok';
        };
        const handleMatrix = (bodyTag: string, cellTag: string): void => {
            const spanData: { [row: number]: { [column: number]: unknown } } = {}; //if spanData[curRow][curCol] is true that means that 'cell' should be "" due to merged cell
            let curRow = 0;
            $(el)
                .children(bodyTag)
                .children('tr')
                .each((index, element) => {
                    tmpRow = [];
                    let curCol = 0;
                    $(element)
                        .children(cellTag)
                        .each((index, element) => {
                            while (spanData[curRow] && spanData[curRow][curCol]) {
                                tmpRow.push('""');
                                curCol++;
                            }
                            tmpRow.push(formatData($(element).text()));
                            const rowstring = $(element).attr('rowspan');
                            const rowspan = parseInt(rowstring);
                            if (rowspan && rowspan > 1) {
                                for (let i = 1; i < rowspan; i++) {
                                    if (!spanData[curRow + i]) {
                                        spanData[curRow + i] = {};
                                    }
                                    spanData[curRow + i][curCol] = true;
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
                                tmpRow.push('""');
                                colspan--;
                                if (rowspan > 1) {
                                    for (let i = 1; i < rowspan; i++) {
                                        spanData[curRow + i][curCol] = true;
                                    }
                                }
                            }
                            curCol++;
                        });
                    row2CSV(tmpRow);
                    curRow++;
                });
        };

        //header
        const numCols = options.header.length;
        let tmpRow: string[] = [];
        if (numCols > 0) {
            for (let i = 0; i < numCols; i++) {
                tmpRow[tmpRow.length] = formatData(options.header[i]);
            }
        } else {
            handleMatrix('thead', 'th');
        }
        // actual data
        handleMatrix('tbody', 'td');
        const mydata = csvData.join('\n');
        if (options.delivery == 'popup') {
            return popup(mydata);
        } else {
            return mydata;
        }
    }
}
veComponents.service('Table2CSVService', Table2CSVService);
