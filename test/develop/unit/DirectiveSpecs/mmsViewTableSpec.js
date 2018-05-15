'use strict';

describe('Directive: mmsViewTable', function() {

    /**
     * Figure1:
     *
     *      This is the table header. The second column is a parent of columnIndex 1 & 2
     *      The first and last column span two rows.
     *      Legend: {
     *          f0 is filter input box for column index = 0
     *          f1 is filter input box for a merged column index = 1 and index = 2
     *          f2 is filter input box for column index = 3
     *          f3 is filter input box for column index = 1
     *          f4 is filter input box for column index = 2
     *      }
     *      _________________
     *      |f0 |___f1__| f2|
     *      |___|_f3_|f4|___|
     *
     * **/

    /**
     * Figure2:
     *
     *      This is the table body.
     * __________________________________________________________
     * |ggg|ad            |value1,value2| props                  |
     * |   |              |             | prop name |  prop val  |
     * |   |              |             | value 1   | 234111070  |
     * |   |              |             | value 2   | (no value) |
     * |___|______________|_____________|___________|____________|
     * |aaa|adfew dfvdfdsf|             | props                  |
     * |   |              |             | prop name |  prop val  |
     * |___|______________|_____________|___________|____________|
     *
     */

    function applyFilter(filterInputDom, filterTerm) {
        scope.$apply(function() {
            filterInputDom.val(filterTerm).change();
        });
        $timeout.flush();
    }

    function replaceDom(trs) {
        /** First row **/
        trs.first().children('td:nth-child(1)').find('mms-cf').replaceWith('<mms-cf mms-cf-type="name"><span>ggg</span></mms-cf>');
        trs.first().children('td:nth-child(2)').find('mms-cf').replaceWith('<mms-cf mms-cf-type="doc"><p><span class="no-print">ad</span></p></mms-cf>');
        trs.first().children('td:nth-child(3)').find('mms-cf').first().replaceWith('<mms-cf mms-cf-type="name"><span>value1</span></mms-cf>');
        // child one again coz the earlier replace mms-cf with sth else
        trs.first().children('td:nth-child(3)').find('mms-cf:nth-child(1)').replaceWith('<mms-cf mms-cf-type="name"><span>value2</span></mms-cf>');
        //
        var innerTableBody = trs.first().children('td:nth-child(4)').find('tbody');
        var innerTableRows = innerTableBody.children('tr');
        innerTableRows.first().children('td:nth-child(1)').find('mms-cf').replaceWith('<mms-cf mms-cf-type="name"><span>value1</span></mms-cf>');
        innerTableRows.first().children('td:nth-child(2)').find('mms-cf').replaceWith('<mms-cf mms-cf-type="val"><span>234111070</span></mms-cf>');
        $(innerTableRows[1]).children('td:nth-child(1)').find('mms-cf').replaceWith('<mms-cf mms-cf-type="name"><span>value2</span></mms-cf>');
        $(innerTableRows[1]).children('td:nth-child(2)').find('mms-cf').replaceWith('<mms-cf mms-cf-type="val"><span class="no-print">(no value)</span></mms-cf>');

        /** Second row **/
        $(trs[1]).children('td:nth-child(1)').find('mms-cf').replaceWith('<mms-cf mms-cf-type="name"><span>aaa</span></mms-cf>');
        $(trs[1]).children('td:nth-child(2)').find('mms-cf').replaceWith('<mms-cf mms-cf-type="doc"><span>adfew dfvdfdsf</span></mms-cf>');
    }

    var scope,
        element;
    var $rootScope,
        $compile;
    var $timeout;
    var self;

    beforeEach(module('mms'));
    beforeEach(module('mms.directives'));
    beforeEach(function() {
        inject(function ($injector) {
            $rootScope = $injector.get('$rootScope');
            $compile = $injector.get('$compile');
            $timeout = $injector.get('$timeout');
            scope = $rootScope.$new();
        });
        
        
        /** Load mmsViewTable directive **/
        scope.presentationElem = {
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
        element = angular.element('<mms-view-table data-mms-table="presentationElem"></mms-view-table>');
        $compile(element)(scope);
        scope.$digest();


        /** Store commonly used variables **/
        var table = element.children('table');
        this.mmsViewTableController = element.controller('mmsViewTable');
        this.tHeader = table.children('thead');
        this.tbody = table.children('tbody');
        this.trs = this.tbody.children('tr');
        self = this;

        /** Modify mmsViewTable's html content to mock nested directives **/
        replaceDom(this.trs);
    });

    it('store rows order as an attribute so that it can reset the sort order', function() {
        this.trs.each(function(index) {
            expect(Number($(this).attr(self.mmsViewTableController._rowSortOrderAttrName))).toEqual(index);
        });
    });

    it('can do column-wise sort and can reset sort order', function() {
        /** Before the sort, 'ggg' is on rowIndex = 0 and 'aaa' is on rowIndex = 1 **/
        expect($(this.trs[0]).children('td').first().text()).toEqual('ggg');
        expect($(this.trs[1]).children('td').first().text()).toEqual('aaa');

        /** Click sort on the first column and assert that the two rows switch places **/
        this.tHeader.children('tr').first().children('th').children('span').click();
        this.trs = this.tbody.children('tr');
        expect($(this.trs[0]).children('td').first().text()).toEqual('aaa');
        expect($(this.trs[1]).children('td').first().text()).toEqual('ggg');

        /** Restore sort order **/
        var resortButton = element.find('.reset-sort-button');
        resortButton.click();
        this.trs = this.tbody.children('tr');
        this.trs.each(function(index) {
            expect(Number($(this).attr(self.mmsViewTableController._rowSortOrderAttrName))).toEqual(index);
        });
    });

    it('can do Full Table Filter ', function() {
        /** Filter by 'g' **/
        var fullTableFilterInput = element.find('form').children('input').first();
        applyFilter(fullTableFilterInput, 'g');
        this.trs = this.tbody.children('tr');

        /** This row has 'g' as its content **/
        expect($(this.trs[0]).css('display')).not.toEqual('none');
        expect($(this.trs[0]).children('td').first().text()).toEqual('ggg');

        /** This row doesn't have 'g' as its content. Therefore, it is hidden **/
        expect($(this.trs[1]).css('display')).toEqual('none');
        expect($(this.trs[1]).children('td').first().text()).toEqual('aaa');
    });

    it('can do column(s)-Wise filter', function() {
        /** Refer to Figure1 to set the layout of the filter inputs for this table **/

        /** Filter the column index = 0 by 'g' **/
        var column0FilterInput = this.tHeader.find('input').first();
        applyFilter(column0FilterInput, 'g');
        this.trs = this.tbody.children('tr');

        /** This row has 'g' as its content **/
        expect($(this.trs[0]).css('display')).not.toEqual('none');
        expect($(this.trs[0]).children('td').first().text()).toEqual('ggg');

        /** This row doesn't have 'g' as its content. Therefore, it is hidden **/
        expect($(this.trs[1]).css('display')).toEqual('none');
        expect($(this.trs[1]).children('td').first().text()).toEqual('aaa');



        /** Clear this filter term so that both rows show up again **/
        applyFilter(column0FilterInput, '');
        expect($(this.trs[0]).css('display')).not.toEqual('none');
        expect($(this.trs[0]).children('td').first().text()).toEqual('ggg');

        expect($(this.trs[1]).css('display')).not.toEqual('none');
        expect($(this.trs[1]).children('td').first().text()).toEqual('aaa');



        /** Now filter column index = 1 by 'ad'. Both these rows' cells has 'adf' on the column that is filtered by **/
        var column1FilterInput = $(this.tHeader.find('input')[3]);
        applyFilter(column1FilterInput, 'ad');
        expect($(this.trs[0]).css('display')).not.toEqual('none');
        expect($(this.trs[0]).children('td').first().text()).toEqual('ggg');

        /** This row's cell also has 'ad' as its content. Therefore, it is also shown **/
        expect($(this.trs[1]).css('display')).not.toEqual('none');
        expect($(this.trs[1]).children('td').first().text()).toEqual('aaa');



        /** Apply 'g' on column index = 0 and 'ad' on column index = 1. Expect the first row to show up because
         *  it has both 'g' for column index = 0 and 'ad' for column index = 1 **/
        applyFilter(column1FilterInput, ''); // reset result first
        applyFilter(column0FilterInput, 'g');
        applyFilter(column1FilterInput, 'ad');
        this.trs = this.tbody.children('tr');

        /** This row has both 'g' and 'adf' on both columns that are filtered by **/
        expect($(this.trs[0]).css('display')).not.toEqual('none');
        expect($(this.trs[0]).children('td').first().text()).toEqual('ggg');

        /** This row only has 'adf' on column index = 1, but doesn't have 'g' on column index = 0. Therefore, display = none **/
        expect($(this.trs[1]).css('display')).toEqual('none');
        expect($(this.trs[1]).children('td').first().text()).toEqual('aaa');


        /** Do a Full Table filter and make sure that all the Column(s)-Wise filter input boxes are cleared **/
        var fullTableFilterInput = element.find('form').children('input').first();
        applyFilter(fullTableFilterInput, 'g');
        var columnWiseFilterInputs = this.tHeader.find('input');
        columnWiseFilterInputs.each(function() {
            expect($(this).val()).toEqual('');
        });

        /** Do a Column-wise filter and make sure that the Full Table Filter input box is cleared **/
        applyFilter(column0FilterInput, 'g');
        expect(fullTableFilterInput.val()).toEqual('');
    });

    it('use the numerical sort when all cells value is a valid number', function() {
        var tableData = {
            header: [
                [
                    {
                        "colspan": "1",
                        "rowspan": "1",
                        "content": [
                            {
                                "sourceType": "text",
                                "text": "Column1",
                                "type": "Paragraph"
                            }
                        ]
                    }
                ]
            ],
            body: [
                [
                    {
                        "colspan": "1",
                        "rowspan": "1",
                        "content": [
                            {
                                "sourceType": "text",
                                "text": "20",
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
                                "text": "3",
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
                                "text": "-1",
                                "type": "Paragraph"
                            }
                        ]
                    }
                ]

            ]
        };
        var element = angular.element('<mms-view-table data-mms-table="tableData"></mms-view-table>');
        var scope = $rootScope.$new();
        scope.tableData = tableData;
        $compile(element)(scope);
        scope.$digest();

        var table = element.children('table');
        var tbody = table.children('tbody');
        var trs = tbody.children('tr');

        // all cells' value is a valid number
        expect(self.mmsViewTableController.__areAllCellValidNumber(trs.toArray(), 0)).toBeTruthy();

        expect($(trs[0]).children('td').first().text()).toEqual('20');
        expect($(trs[1]).children('td').first().text()).toEqual('3');
        expect($(trs[2]).children('td').first().text()).toEqual('-1');

        table.find('span[ng-click]').click();
        trs = tbody.children('tr');

        expect($(trs[0]).children('td').first().text()).toEqual('-1');
        expect($(trs[1]).children('td').first().text()).toEqual('3');
        expect($(trs[2]).children('td').first().text()).toEqual('20');
    });

    it('do not use the numerical sort when one or more cells value is not a valid number', function() {
        var tableData = {
            header: [
                [
                    {
                        "colspan": "1",
                        "rowspan": "1",
                        "content": [
                            {
                                "sourceType": "text",
                                "text": "Column1",
                                "type": "Paragraph"
                            }
                        ]
                    }
                ]
            ],
            body: [
                [
                    {
                        "colspan": "1",
                        "rowspan": "1",
                        "content": [
                            {
                                "sourceType": "text",
                                "text": "3",
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
                                "text": "20",
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
                                "text": "a",
                                "type": "Paragraph"
                            }
                        ]
                    }
                ]

            ]
        };
        var element = angular.element('<mms-view-table data-mms-table="tableData"></mms-view-table>');
        var scope = $rootScope.$new();
        scope.tableData = tableData;
        $compile(element)(scope);
        scope.$digest();

        var table = element.children('table');
        var tbody = table.children('tbody');
        var trs = tbody.children('tr');

        // the last cell's value("a") is not a valid number, so use alphabetical sorting
        expect(self.mmsViewTableController.__areAllCellValidNumber(trs.toArray(), 0)).toBeFalsy();

        expect($(trs[0]).children('td').first().text()).toEqual('3');
        expect($(trs[1]).children('td').first().text()).toEqual('20');
        expect($(trs[2]).children('td').first().text()).toEqual('a');

        table.find('span[ng-click]').click();
        trs = tbody.children('tr');

        expect($(trs[0]).children('td').first().text()).toEqual('20');
        expect($(trs[1]).children('td').first().text()).toEqual('3');
        expect($(trs[2]).children('td').first().text()).toEqual('a');
    });
});
