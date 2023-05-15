import { UtilsService } from '@ve-utils/application/Utils.service';
import { CacheService } from '@ve-utils/core';
import { ElementService, URLService } from '@ve-utils/mms-api-client';

import { veUtils } from '@ve-utils';

export class PlotService {
    constructor(
        private $q,
        private $http,
        private uRLSvc: URLService,
        private utilsSvc: UtilsService,
        private cacheSvc: CacheService,
        private elementSvc: ElementService
    ) {}

    //make only a-zA-Z0-9_ because id or class does not support special characters(ie., ())
    public toValidId = (original) => {
        return original.replace(/[^a-zA-Z0-9_]/gi, '');
    };

    /**
     * @param {Object} clientConfig The size width, height and margin info from magicDraw
     * @param {Object} defaultPlotConfig The size width, height and margin from the plot directive
     */
    public plotConfig = (clientConfig, defaultPlotConfig) => {
        const plotConfig = defaultPlotConfig;
        if (clientConfig !== undefined) {
            if (clientConfig.size !== undefined) {
                if (clientConfig.size.width != undefined && !isNaN(clientConfig.size.width))
                    plotConfig.width = Number(clientConfig.size.width);
                if (clientConfig.size.height != undefined && !isNaN(clientConfig.size.height))
                    plotConfig.height = Number(clientConfig.size.height);
            }
            if (clientConfig.padding !== undefined) {
                if (clientConfig.padding.top != undefined && !isNaN(clientConfig.padding.top))
                    plotConfig.marginTop = Number(clientConfig.padding.top);
                if (clientConfig.padding.right != undefined && !isNaN(clientConfig.padding.right))
                    plotConfig.marginRight = Number(clientConfig.padding.right);
                if (clientConfig.padding.left != undefined && !isNaN(clientConfig.padding.left))
                    plotConfig.marginLeft = Number(clientConfig.padding.left);
                if (clientConfig.padding.bottom != undefined && !isNaN(clientConfig.padding.bottom))
                    plotConfig.marginBottom = Number(clientConfig.padding.bottom);
            }
        }
        return plotConfig;
    };

    public readValues2(plot, projectId, refId, commitId) {
        const deferred = this.$q.defer();

        const aMmsEid = {
            projectId: projectId,
            refId: refId,
            commitId: commitId,
        };
        const isHeader = plot.table.header !== undefined && plot.table.header.length > 0;

        if (isHeader) {
            const aheader = this._asyncReadTableHeader(aMmsEid, plot.table.header[0]);
            aheader.then((tableheader) => {
                const abody = this._asyncReadTableBody2(aMmsEid, plot.table.body, tableheader);
                abody.then((tablebody) => {
                    const r = {
                        tableheader: tableheader,
                        tablebody: tablebody,
                        isHeader: isHeader,
                    };
                    deferred.resolve(r);
                });
            });
        } else {
            const abody = this._asyncReadTableBody(aMmsEid, plot.table.body);
            abody.then((tablebody) => {
                const r = { tablebody: tablebody, isHeader: isHeader };
                deferred.resolve(r);
            });
        }
        return deferred.promise;
    } //end of readValues

    public readValues = (plot, projectId, refId, commitId) => {
        const deferred = this.$q.defer();

        const aMmsEid = {
            projectId: projectId,
            refId: refId,
            commitId: commitId,
        };
        const isHeader = plot.table.header !== undefined && plot.table.header.length > 0;

        if (isHeader) {
            const aheader = this._asyncReadTableHeader(aMmsEid, plot.table.header[0]);
            aheader.then((tableheader) => {
                const abody = this._asyncReadTableBody(aMmsEid, plot.table.body);
                abody.then((tablebody) => {
                    const r = {
                        tableheader: tableheader,
                        tablebody: tablebody,
                        isHeader: isHeader,
                    };
                    deferred.resolve(r);
                });
            });
        } else {
            const abody = this._asyncReadTableBody(aMmsEid, plot.table.body);
            abody.then((tablebody) => {
                const r = { tablebody: tablebody, isHeader: isHeader };
                deferred.resolve(r);
            });
        }
        return deferred.promise;
    }; //end of readValues

    private _asyncReadTableHeader = (aMmsEid, header) => {
        return this.$q((resolve) => {
            this._readRowValues(header, aMmsEid).then((tableheader) => {
                tableheader.values.shift(); //remove 1st element
                resolve(tableheader.values);
            });
        });
    };

    private _asyncReadTableBody = (aMmsEid, tablebody) => {
        return this.$q((resolve) => {
            const c3_data = [];
            const valuesO = [];

            tablebody.forEach((row) => {
                this._readRowValues(row, aMmsEid).then((yyvalue) => {
                    c3_data.push(yyvalue.values);
                    valuesO.push(yyvalue.valuesO);
                    if (c3_data.length === tablebody.length) {
                        const r = {
                            c3_data: c3_data,
                            valuesO: valuesO,
                        };
                        resolve(r);
                    }
                });
            });
        });
    };

    private _asyncReadTableBody2(aMmsEid, tablebody, tableheader) {
        return this.$q((resolve) => {
            const c3_data = [];
            const valuesO = [];

            //adding "rowheader" so length of header and rowvalues will be the same.
            const mtableheader = tableheader.slice(0);
            mtableheader.splice(0, 0, 'rowheader');
            tablebody.forEach((row) => {
                this._readRowValues2(row, aMmsEid, mtableheader).then((yyvalue) => {
                    c3_data.push(yyvalue.valuesx);
                    valuesO.push(yyvalue.valuesO);
                    if (valuesO.length === tablebody.length) {
                        const r = {
                            c3_data: c3_data,
                            valuesO: valuesO,
                        };
                        resolve(r);
                    }
                });
            });
        });
    }

    private static _getValue(datavalue) {
        if (datavalue && datavalue.type === 'LiteralString') {
            if (isNaN(datavalue.value)) return datavalue.value;
            else return Number(datavalue.value);
        } else if (datavalue && (datavalue.type === 'LiteralReal' || datavalue.type === 'LiteralInteger')) {
            return datavalue.value;
        }
    }

    private _readParagraphValue = (e, aMmsEid, index) => {
        return this.$q((resolve) => {
            if (e.content[0].sourceType == 'text') {
                //console.log("text");
                let tv = e.content[0].text.replace('<p>', '').replace('</p>', '').trim();
                if (!isNaN(tv)) tv = Number(tv);
                resolve({ index: index, value: tv, valueO: e });
            } else if (e.content[0].sourceType === 'reference') {
                aMmsEid.elementId = e.content[0].source;

                if (e.content[0].sourceProperty === 'name') {
                    //console.log("name");
                    this.elementSvc.getElement(aMmsEid, 1, false).then((refe) => {
                        //value = refe.name;
                        //valueO= refe;
                        let nameModified: number | string = refe.name;
                        if (!isNaN(Number(refe.name)))
                            //means its a number
                            nameModified = Number(refe.name);
                        resolve({
                            index: index,
                            value: nameModified,
                            valueO: refe,
                        });
                    });
                } else if (e.content[0].sourceProperty === 'documentation') {
                    //console.log("doc");
                    this.elementSvc.getElement(aMmsEid, 1, false).then((refe) => {
                        let docModified: number | string = refe.documentation
                            .replace('<p>', '')
                            .replace('</p>', '')
                            .trim();
                        //seems adding \n at the end when modified at vieweditor so if number goahead to conver to number
                        //i.e., "5\n" will be a number.
                        if (!isNaN(Number(docModified)))
                            //means it is a number
                            docModified = Number(docModified);
                        resolve({
                            index: index,
                            value: docModified,
                            valueO: refe,
                        });
                    });
                } else {
                    //sourceProperty === 'value'
                    //console.log('value');
                    this.elementSvc.getElement(aMmsEid, 1, false).then((refe) => {
                        const valueO = refe;
                        let value = '';
                        if (refe.type === 'Property' || refe.type === 'Port') {
                            if (refe.defaultValue) {
                                value = PlotService._getValue(refe.defaultValue); //default value
                            } else {
                                value = '';
                            }
                        }
                        if (refe.type === 'Slot') {
                            value = PlotService._getValue(refe.value[0]); //scope.element.value
                        }
                        /* not sure what to do
                                if (refe.type === 'Constraint' && refe.specification) {
                                    value = refe.specification;
                                }
                                if (refe.type === 'Expression') {
                                    value = refe.operand;
                                }
                                */
                        resolve({
                            index: index,
                            value: value,
                            valueO: valueO,
                        });
                    });
                } //end of else
            } //reference
        });
    };

    private _readRowValues = (row, aMmsEid) => {
        return this.$q((resolve) => {
            const values = [];
            const valuesO = [];
            let index = 0;
            row.forEach((e) => {
                if (e.content.length === 0) {
                    values[index] = null;
                    valuesO[index] = null;
                    index++;
                } else {
                    if (e.content[0].type == 'Paragraph') {
                        this._readParagraphValue(e, aMmsEid, index++).then((r) => {
                            values[r.index] = r.value;
                            valuesO[r.index] = r.valueO;
                            if (values.length === row.length) {
                                const result = {
                                    values: values,
                                    valuesO: valuesO,
                                };
                                resolve(result);
                            }
                        });
                    } // Paragraph
                } //end of else
            }); //for each row
        });
    }; //end of function
    private _readRowValues2(row, aMmsEid, mtableheader) {
        return this.$q((resolve) => {
            const valuesx = []; //named index instead of number index
            const valuesO = [];
            let index = 0;
            row.forEach((e) => {
                if (e.content.length === 0) {
                    valuesx[mtableheader[index]] = null;
                    valuesO[index] = null;
                    index++;
                } else {
                    if (e.content[0].type == 'Paragraph') {
                        this._readParagraphValue(e, aMmsEid, index++).then((r) => {
                            valuesx[mtableheader[r.index]] = r.value;
                            valuesO[r.index] = r.valueO;
                            if (valuesO.length === row.length) {
                                const result = {
                                    valuesx: valuesx,
                                    valuesO: valuesO,
                                };
                                resolve(result);
                            }
                        });
                    } // Paragraph
                } //end of else
            }); //for each row
        });
    } //end of function
}

PlotService.$inject = ['$q', '$http', 'URLService', 'UtilsService', 'CacheService', 'ElementService'];

veUtils.service('PlotService', PlotService);
