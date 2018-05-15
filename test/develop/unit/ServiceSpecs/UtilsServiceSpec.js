'use strict';

describe('UtilsService', function() {

    function checkToSeeIfEachCellHasTheRightMetaData(row, columnIndex, expectedStartCol,expectedEndCol, expectedStartRow, expectedEndRow) {
        expect(row[columnIndex].startCol).toEqual(expectedStartCol);
        expect(row[columnIndex].endCol).toEqual(expectedEndCol);
        expect(row[columnIndex].startRow).toEqual(expectedStartRow);
        expect(row[columnIndex].endRow).toEqual(expectedEndRow);
    }
    function getSortClickBinding(cellDom) {
        return cellDom.children('span').attr('ng-click');
    }
    function getFilterNgModelBinding(inputDom) {
        return inputDom.attr('ng-model');
    }
    function getHeaderCellFor(row) {
        return $(row).children('th');
    }
    function getBodyCellFor(row) {
        return $(row).children('td');
    }
    function getOutermostTableHeaderRows(tableDom) {
        var headerRows = tableDom.children('thead').children('tr');
        var row0Cells = getHeaderCellFor($(headerRows[0]));
        var row1Cells = getHeaderCellFor($(headerRows[1]));
        return {
            row0: {
                cell0: $(row0Cells[0]),
                cell12: $(row0Cells[1]),
                cell3: $(row0Cells[2])
            },
            row1: {
                cell1: $(row1Cells[0]),
                cell2: $(row1Cells[1])
            }
        };
    }
    function getInputDomFrom(cellDom) {
        return $(cellDom.find('input'));
    }
    function getInnerTableHeaderRows(tableDom) {
        return tableDom.children('thead').children('tr').map(function() {return $(this);});
    }
    function getTableBodyRows(tableDom) {
        return tableDom.children('tbody').children('tr').map(function() { return $(this)});
    }
    function getNestedTables(tableDom) {
        return tableDom.children('table').map(function() { return $(this); });
    }

    beforeAll(function() {
        jasmine.addMatchers(
            {
                toHaveSortClickBinding: function() {
                    return {
                        compare: function(actual, expected) {
                            var result = {};
                            result.pass = actual === expected;
                            result.message = actual + 'is not a correct ng-click binding';
                            return result;
                        }
                    };
                },
                toHaveFilterNgModelBinding: function() {
                    return {
                        compare: function (actual, expected) {
                            var result = {};
                            result.pass = actual === expected;
                            result.message = actual + 'is not a correct ng-model binding';
                            return result;
                        }
                    };
                }
            }
        );


        /**
         *      This is the table header. The second column is a parent of columnIndex 1 & 2
         *      The first and last column span two rows
         *      _________________
         *      |   |_______|   |
         *      |___|___|___|___|
         *
         * **/
        this.tableData = {
            "header": [
                [
                    {
                        "colspan": "1",
                        "rowspan": "2",
                        "content": [
                            {
                                "sourceType": "text",
                                "text": "<p>name</p>",
                                "type": "Paragraph"
                            }
                        ]
                    },
                    {
                        "colspan": "2",
                        "rowspan": "1",
                        "content": [
                            {
                                "sourceType": "text",
                                "text": "<p>merged header</p>",
                                "type": "Paragraph"
                            }
                        ]
                    },
                    {
                        "colspan": "1",
                        "rowspan": "2",
                        "content": [
                            {
                                "sourceType": "text",
                                "text": "<p>nested table</p>",
                                "type": "Paragraph"
                            }
                        ]
                    }
                ],
                [
                    {
                        "colspan": "1",
                        "rowspan": "1",
                        "content": [
                            {
                                "sourceType": "text",
                                "text": "<p>doc</p>",
                                "type": "Paragraph"
                            }
                        ]
                    },
                    {
                        "colspan": "1",
                        "rowspan": "1",
                        "content": [
                            {
                                "sourceType": "text",
                                "text": "<p>properties</p>",
                                "type": "Paragraph"
                            }
                        ]
                    }
                ]
            ],
            "style": "normal",
            "body": [
                [
                    {
                        "colspan": "1",
                        "rowspan": "1",
                        "content": [
                            {
                                "nonEditable": false,
                                "sourceType": "reference",
                                "sourceProperty": "name",
                                "source": "_18_5_1_407019f_1501622199354_603477_47069",
                                "type": "Paragraph"
                            }
                        ]
                    },
                    {
                        "colspan": "1",
                        "rowspan": "1",
                        "content": [
                            {
                                "nonEditable": false,
                                "sourceType": "reference",
                                "sourceProperty": "documentation",
                                "source": "_18_5_1_407019f_1501622199354_603477_47069",
                                "type": "Paragraph"
                            }
                        ]
                    },
                    {
                        "colspan": "1",
                        "rowspan": "1",
                        "content": [
                            {
                                "nonEditable": false,
                                "sourceType": "reference",
                                "sourceProperty": "name",
                                "source": "_18_5_1_407019f_1501622208726_884214_47115",
                                "type": "Paragraph"
                            },
                            {
                                "nonEditable": false,
                                "sourceType": "reference",
                                "sourceProperty": "name",
                                "source": "_18_5_1_407019f_1501632597511_631050_47133",
                                "type": "Paragraph"
                            }
                        ]
                    },
                    {
                        "colspan": "1",
                        "rowspan": "1",
                        "content": [
                            {
                                "header": [
                                    [
                                        {
                                            "colspan": "1",
                                            "rowspan": "1",
                                            "content": [
                                                {
                                                    "sourceType": "text",
                                                    "text": "<p>prop name</p>",
                                                    "type": "Paragraph"
                                                }
                                            ]
                                        },
                                        {
                                            "colspan": "1",
                                            "rowspan": "1",
                                            "content": [
                                                {
                                                    "sourceType": "text",
                                                    "text": "<p>prop val</p>",
                                                    "type": "Paragraph"
                                                }
                                            ]
                                        }
                                    ]
                                ],
                                "style": "normal",
                                "body": [
                                    [
                                        {
                                            "colspan": "1",
                                            "rowspan": "1",
                                            "content": [
                                                {
                                                    "nonEditable": false,
                                                    "sourceType": "reference",
                                                    "sourceProperty": "name",
                                                    "source": "_18_5_1_407019f_1501622208726_884214_47115",
                                                    "type": "Paragraph"
                                                }
                                            ]
                                        },
                                        {
                                            "colspan": "1",
                                            "rowspan": "1",
                                            "content": [
                                                {
                                                    "nonEditable": false,
                                                    "sourceType": "reference",
                                                    "sourceProperty": "value",
                                                    "source": "_18_5_1_407019f_1501622208726_884214_47115",
                                                    "type": "Paragraph"
                                                }
                                            ]
                                        }
                                    ],
                                    [
                                        {
                                            "colspan": "1",
                                            "rowspan": "1",
                                            "content": [
                                                {
                                                    "nonEditable": false,
                                                    "sourceType": "reference",
                                                    "sourceProperty": "name",
                                                    "source": "_18_5_1_407019f_1501632597511_631050_47133",
                                                    "type": "Paragraph"
                                                }
                                            ]
                                        },
                                        {
                                            "colspan": "1",
                                            "rowspan": "1",
                                            "content": [
                                                {
                                                    "nonEditable": false,
                                                    "sourceType": "reference",
                                                    "sourceProperty": "value",
                                                    "source": "_18_5_1_407019f_1501632597511_631050_47133",
                                                    "type": "Paragraph"
                                                }
                                            ]
                                        }
                                    ]
                                ],
                                "title": "props",
                                "type": "Table",
                                "showIfEmpty": false
                            }
                        ]
                    }
                ],
                [
                    {
                        "colspan": "1",
                        "rowspan": "1",
                        "content": [
                            {
                                "nonEditable": false,
                                "sourceType": "reference",
                                "sourceProperty": "name",
                                "source": "_18_5_2_407019f_1509565995142_216176_48126",
                                "type": "Paragraph"
                            }
                        ]
                    },
                    {
                        "colspan": "1",
                        "rowspan": "1",
                        "content": [
                            {
                                "nonEditable": false,
                                "sourceType": "reference",
                                "sourceProperty": "documentation",
                                "source": "_18_5_2_407019f_1509565995142_216176_48126",
                                "type": "Paragraph"
                            }
                        ]
                    },
                    {
                        "colspan": "1",
                        "rowspan": "1",
                        "content": []
                    },
                    {
                        "colspan": "1",
                        "rowspan": "1",
                        "content": [
                            {
                                "header": [
                                    [
                                        {
                                            "colspan": "1",
                                            "rowspan": "1",
                                            "content": [
                                                {
                                                    "sourceType": "text",
                                                    "text": "<p>prop name</p>",
                                                    "type": "Paragraph"
                                                }
                                            ]
                                        },
                                        {
                                            "colspan": "1",
                                            "rowspan": "1",
                                            "content": [
                                                {
                                                    "sourceType": "text",
                                                    "text": "<p>prop val</p>",
                                                    "type": "Paragraph"
                                                }
                                            ]
                                        }
                                    ]
                                ],
                                "style": "normal",
                                "body": [],
                                "title": "props",
                                "type": "Table",
                                "showIfEmpty": false
                            }
                        ]
                    }
                ]
            ],
            "title": "fancy table",
            "type": "Table",
            "showIfEmpty": false,
            "colwidths": [
                null,
                null,
                null,
                null
            ]
        };
    });

    beforeEach(module('mms'));
    beforeEach(function() {
        inject(function($injector) {
            this.UtilsService = $injector.get('UtilsService');
            this.$httpBackend = $injector.get('$httpBackend');
        });

        this.tableDom = $(this.UtilsService.makeHtmlTable(this.tableData, true, true));

    });

    it('can generate row and column number for the table header columns cells', function() {
        /**
         *      This is the table header. The second column is a parent of columnIndex 1 & 2
         *      The first and last column span two rows
         *      _________________
         *      |   |_______|   |
         *      |___|___|___|___|
         *
         * **/

        this.UtilsService._generateRowColNumber(this.tableData.header);

        // assert
        var row1 = this.tableData.header[0];
        var row2 = this.tableData.header[1];

        // Meta Data is : startCol, endCol, startRow, endRow
        checkToSeeIfEachCellHasTheRightMetaData(row1, 0, 0,0,0,1 );
        checkToSeeIfEachCellHasTheRightMetaData(row1, 1, 1,2,0,0 );
        checkToSeeIfEachCellHasTheRightMetaData(row1, 2, 3,3,0,1 );

        checkToSeeIfEachCellHasTheRightMetaData(row2, 0, 1,1,1,1 );
        checkToSeeIfEachCellHasTheRightMetaData(row2, 1, 2,2,1,1 );
    });

    it('only add sort click binding to the outermost table leaf header columns cells', function() {


        /** Outermost Table Header Rows. Make sure all the rows leaf cells have these bindings **/
        var tableHeaderRows = getOutermostTableHeaderRows(this.tableDom);

        var row0 = tableHeaderRows.row0;
        expect(getSortClickBinding(row0.cell0)).toHaveSortClickBinding('sortByColumnFn(0)');

        // Merged header should not have any of the following bindings
        expect(getSortClickBinding(row0.cell12)).toHaveSortClickBinding(undefined);

        expect(getSortClickBinding(row0.cell3)).toHaveSortClickBinding('sortByColumnFn(3)');

        var row1 = tableHeaderRows.row1;
        expect(getSortClickBinding(row1.cell1)).toHaveSortClickBinding('sortByColumnFn(1)');

        expect(getSortClickBinding(row1.cell2)).toHaveSortClickBinding('sortByColumnFn(2)');

        /** Outermost Table Body Rows. Make sure none of these rows' cells have no sort click binding **/
        var tableBodyRows = getTableBodyRows(this.tableDom);
        tableBodyRows.each(function(row) {
            getBodyCellFor(row).each(function(cell) {
                expect(getSortClickBinding($(cell))).toHaveSortClickBinding(undefined);
            });
        });

        /** Inner Table Header Rows. Make sure none of these rows' cells have sort click binding  **/
        var nestedTables = getNestedTables(this.tableDom);
        nestedTables.each(function(nestedTableDom) {
            getInnerTableHeaderRows(nestedTableDom).each(function(row) {
                getHeaderCellFor(row).each(function(cell) {
                    expect(getSortClickBinding($(cell))).toHaveSortClickBinding(undefined);
                });
            });
        });

        /** Inner Table Body Rows. Make sure none of these rows' cells have sort click binding  **/
        getTableBodyRows(nestedTables).each(function (row) {
            getBodyCellFor(row).each(function(cell) {
                expect(getSortClickBinding($(cell))).toHaveSortClickBinding(undefined);
            });
        });
    });

    it('only add ng-model binding (for filtering purpose) to the outermost table header rows cells both merged and unmerged', function() {
        /** Outermost Table Header Rows. Make sure all of these rows cells have this binding **/
        var tableHeaderRows = getOutermostTableHeaderRows(this.tableDom);

        var row0 = tableHeaderRows.row0;
        expect(getFilterNgModelBinding(getInputDomFrom(row0.cell0))).toHaveFilterNgModelBinding('filterTermForColumn00');

        // This merged header column cell filter on two column ( 1 & 2 )
        expect(getFilterNgModelBinding(getInputDomFrom(row0.cell12))).toHaveFilterNgModelBinding('filterTermForColumn12');

        expect(getFilterNgModelBinding(getInputDomFrom(row0.cell3))).toHaveFilterNgModelBinding('filterTermForColumn33');

        var row1 = tableHeaderRows.row1;
        expect(getFilterNgModelBinding(getInputDomFrom(row1.cell1))).toHaveFilterNgModelBinding('filterTermForColumn11');

        expect(getFilterNgModelBinding(getInputDomFrom(row1.cell2))).toHaveFilterNgModelBinding('filterTermForColumn22');

        /** Outermost Table Body Rows. Make sure none of these rows cells have this binding **/
        var tableBodyRows = getTableBodyRows(this.tableDom);
        tableBodyRows.each(function(row) {
            getBodyCellFor(row).each(function(cell) {
                var inputs = $($(cell).find('input'));
                if (inputs) {
                    expect(getFilterNgModelBinding(inputs)).toHaveFilterNgModelBinding(undefined);
                }
            });
        });

        /** Inner Table Header Rows. Make sure none of these rows cells have this binding **/
        var nestedTables = getNestedTables(this.tableDom);
        nestedTables.each(function(nestedTableDom) {
            getInnerTableHeaderRows(nestedTableDom).each(function(row) {
                getHeaderCellFor(row).each(function(cell) {
                    var inputs = $($(cell).find('input'));
                    if (inputs) {
                        expect(getFilterNgModelBinding(inputs)).toHaveFilterNgModelBinding(undefined);
                    }
                });
            });
        });
        /** Inner Table Body Rows. Make sure none of these rows cells have this binding **/
        getTableBodyRows(nestedTables).each(function (row) {
            getBodyCellFor(row).each(function(cell) {
                var inputs = $($(cell).find('input'));
                if (inputs) {
                    expect(getFilterNgModelBinding(inputs)).toHaveFilterNgModelBinding(undefined);
                }
            });
        })
    });

    it('exportHtmlAs can create a post request for word generation with the correct url and data', function() {
        var mockData = {
            projectId: 'project1',
            refId: 'master',
            name: '',
            htmlString: ''
        };
        var exportType = 2;
        var expectedUrl = '/alfresco/service/projects/' + mockData.projectId + '/refs/' + mockData.refId + '/convert';
        var expectedData = {
            "Content-Type": "text/html",
            "Accepts": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "body": "",
            "name": ""
        };
        this.UtilsService.exportHtmlAs(exportType, mockData);
        this.$httpBackend.expectPOST(expectedUrl, expectedData).respond(200, {});
        this.$httpBackend.flush();
    });

    it('exportHtmlAs can create a post request for pdf generation with the correct url and data', function() {
        var mockData = {
            projectId: 'project1',
            refId: 'master',
            name: '',
            htmlString: ''
        };
        var exportType = 3;
        var expectedUrl = '/alfresco/service/projects/' + mockData.projectId + '/refs/' + mockData.refId + '/convert';
        var expectedData = {
            "Content-Type": "text/html",
            "Accepts": "application/pdf",
            "body": "",
            "name": ""
        };
        this.UtilsService.exportHtmlAs(exportType, mockData);
        this.$httpBackend.expectPOST(expectedUrl, expectedData).respond(200, {});
        this.$httpBackend.flush();
    });

});