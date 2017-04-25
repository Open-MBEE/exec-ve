'use strict';
/*UtilsService Unit Tests:
 * Includes: MergeElement, filterProperties, hasConflict
 *
 *
 */
describe('UtilsService', function () {
    beforeEach(module('mms'));
    var UtilsService, CacheService;
    jasmine.getFixtures().fixturesPath     = 'base/test/mock-data';
    jasmine.getJSONFixtures().fixturesPath = 'base/test/mock-data';

    beforeEach(inject(function ($injector) {
        UtilsService = $injector.get('UtilsService');
        CacheService = $injector.get('CacheService');
    }));

    /*
     1. hasCircularReference cannot be tested
     2. cleanValueSpec is tested inherently by cleanElement method
     3. makeElementKey is tested through mergeElement function
     */

    describe('Method cleanElement ', function () {
        // This test also tests the cleanValueSpec function as well
        it('cleanElement() should return a empty array when elem.specialization.value is not a array and specialization.type is a property', inject(function () {
            var dirtyElement = {
                _creator: 'muschek', sysmlId: 12345, name: 'dirtyElement', ownerId: 'otherElement',
             
                    type : 'Property', isDerived: false, typeId: 'anotherElementID',
                    defaultValue: 'not an array'
                
            };
            UtilsService.cleanElement(dirtyElement);
            expect(dirtyElement.defaultValue).toEqual(null);
        }));

        it('cleanElement() should remove all specialization\'s  from specialization.value[] when specialization.type is a property', inject(function () {
            var dirtyElement2 = {
                _creator        : 'muschek', sysmlId: 12346, name: 'dirtyElement2', ownerId: 'otherElement',
                    type : 'Property', isDerived: false, typeId: 'anotherElementID',
                    value: [{type: 'ValueWithSpec', specialization: {type: 'Unknown'}},
                        {type: 'ValueWithSpec', specialization: {type: 'Unknown'}}]
            };
            UtilsService.cleanElement(dirtyElement2);
            expect(dirtyElement2.specialization.value[0].specialization).not.toBeDefined();
            expect(dirtyElement2.specialization.value[1].specialization).not.toBeDefined();
        }));

        it('cleanElement() for every value of elem.specialization.value if there\'s a valueExpression in any of its children delete it', inject(function () {
            var dirtyElement3 = {
                _creator: 'muschek', 
                sysmlId: 12346, 
                name: 'dirtyElement2', 
                ownerId: 'otherElement',
                type : 'Property', 
                isDerived: false,
                typeId: 'anotherElementID',
                defaultValue: [{
                        valueExpression: 'valueExpression',
                        type           : 'LiteralString'      
                }]
            };
            UtilsService.cleanElement(dirtyElement3);
            expect(dirtyElement3.defaultValue.valueExpression).not.toBeDefined();
        }));

        it('cleanElement() for every value of elem.specialization.contents if there\'s a valueExpression in any of its children delete it', inject(function () {
            // Test will provide an element with valueExpression with an ID and an operand with a valueExpression ID.
            //  cleanElement will remove both the contents valueExpression and the nested operand valueExpression.
            var dirtyElement4 = {
                name  : "dirtyElement4", 
                ownerId : "otherElement", 
                sysmlId: 38742, 
                documentation: "",
                _creator: "muschek", 
                _contents: {
                    valueExpression: "Super_duper_awesomesauce_value_expression_hya!", 
                    operand: [{
                        valueExpression: "Super_duper_awesomesauce_operand_value_expression_hya!"
                    }], 
                    type       : "Expression"
                }
            };
            UtilsService.cleanElement(dirtyElement4);
            expect(dirtyElement4._contents.valueExpression).toBeUndefined();
        }));

        it('cleanElement() for every value of elem.specialization.instanceSpecificationSpecification if there\'s a valueExpression in any of its children delete it', inject(function () {
            // Test will check if the instanceSpecificationSpecification has a valueExpression, if so, remove it
            var dirtyViewDocument = {
                name            : "View Documentation", 
                sysmlId: "Farfignuggen",
                documentation   : "Merpity Merp merp", 
                ownerId: "Some_weird_silly_id_should_be_here",
                _appliedStereotypeIds: ["Not_your_applied_metatype"], 
                specification: {
                        valueExpression: "Oh No There is a value expression here!",
                        type           : "LiteralString"
                }, 
                type: "InstanceSpecification"
            };
            UtilsService.cleanElement(dirtyViewDocument);
            expect(dirtyViewDocument.specification.valueExpression).toBeUndefined();
        }));

        it('cleanElement() If elem.specialization.type is view and has both keys contents and contains delete contains', inject(function () {
            var elDirtayElemente =
                {
                    sysmlId : "3301",
                    "_displayedElements": ["301", "302", "303"],
                    _allowedElements    : ["301", "302", "303"], 
                    _contains: [{
                        "type"    : "Paragraph",
                        sourceType: "reference", source: "301", sourceProperty: "documentation"
                    }],
                    _contents: {
                        valueExpression: null, 
                        operand: [{
                            valueExpression: null, 
                            type: "InstanceValue",
                            instanceId: "_18_0_5_407019f_1468188892956_831936_14503"
                        }], 
                        type: "Expression"
                    }
                };
            UtilsService.cleanElement(elDirtayElemente);
            expect(elDirtayElemente._contains).toBeUndefined();

        }));

        it('cleanElement() If elem.specialization.type is view and has a Array of (key) displayed elements whose length is less then 5000 delete it', inject(function () {
            // Test will load a json object that has less than 5000 elements and verify that it has more than 1 but
            //  less than 5000 elements. Then it will clean the element and check that the displayedElements were
            //  removed from the element.
            var data = getJSONFixture('UtilsService/lessthan5000elements.json');
            // $.getJSON('base/test/mock-data/UtilsService/lessthan5000elements.json', function (data) {
            expect(data._displayedElements.length).toBeGreaterThan(1);
            expect(data._displayedElements.length).toBeLessThan(5000);
            UtilsService.cleanElement(data);
            expect(data._displayedElements).toBeUndefined();
            // });
        }));

        it('cleanElement() If elem.specialization.type is view and has a Array of (key) displayed elements whose length is greater then 5000 convert the array to JSON', inject(function () {
            var data = getJSONFixture('UtilsService/morethan5000elements.json');
            // $.getJSON('base/test/mock-data/UtilsService/morethan5000elements.json', function (data) {
            expect(data._displayedElements.length).toBeGreaterThan(5000);
            UtilsService.cleanElement(data);
            expect(data._displayedElements).not.toBeUndefined();
            // });
        }));

        it('cleanElement() should delete any nonEditable keys from the object', inject(function () {
            // ['contains', 'view2view', 'childrenViews', 'displayedElements','allowedElements', 'contents', 'relatedDocuments']
            var data = getJSONFixture('UtilsService/utilsservice-noneditablekeys.json');
            // Verify that all the data is in the json first. This JSON is technically malformed but serves the
            //  purpose for testing.
            expect(data._displayedElements).toBeDefined();
            expect(data._view2view).toBeDefined();
            expect(data._contains).toBeDefined();
            expect(data._allowedElements).toBeDefined();
            expect(data._contents).toBeDefined();
            expect(data._relatedDocuments).toBeDefined();

            // Have to pass in true to enable forEdit that removes any noneditable keys
            UtilsService.cleanElement(data, true);

            // Verify that all of the non editable keys have been removed from the JSON
            expect(data._displayedElements).toBeUndefined();
            expect(data._view2view).toBeUndefined();
            expect(data._contains).toBeUndefined();
            expect(data._allowedElements).toBeUndefined();
            expect(data._contents).toBeUndefined();
        }));
    });

    describe('Method filterProperties ', function () {
        //given element object a and element object b, returns new object with b data minus keys not in a
        it('filterProperties() it should return a new object with b data minus keys not in a for elements a and b', inject(function () {
            //used to updateElements checking a object in the cache (that has been updated) with the same object from the server.... B - A
            var a      = {hello: 'world'};
            var b      = {hello: 'world', foo: 'bar'};
            var result = UtilsService.filterProperties(a, b);
            expect(result.hello).toEqual('world');
            //result should equal just foo.....
            // this is used to merge in only the keys that are new!
        }));
    });

    describe('Method buildTreeHierarchy', function () {
        // Test will generate a mock tree hierarchy based on a list of elements given
        it('buildTreeHierarchy() it should create a tree hierarchy json based on ', inject(function () {
            // Create 2 objects
            var obj1         = {
                name              : "CharacterizationTest",
                sysmlId           : "site__18_0_5_83a025f_1456506201488_656065_12275",
                isCharacterization: true
            };
            var obj2         = {
                name              : "nri-characterization",
                sysmlId           : "nri-characterization",
                isCharacterization: false
            };
            var childObject1 = {
                name              : "sub-nri-characterization",
                sysmlId           : "sub-nri-characterization",
                parent            : "nri-characterization",
                isCharacterization: false
            };

            // Add the objects into an array because the buildTreeHierarchy expects an array of nodes
            var siteData = [obj1, obj2, childObject1];

            // This will generate a nested JSON structure based on sysmlid and parent configuration.
            var myData = UtilsService.buildTreeHierarchy(siteData, 'sysmlId', 'site', 'parent', null);
            // Check the output to make sure it's correct, if needed

            var data = getJSONFixture('UtilsService/buildTreeHierarchy.json');
            expect(myData).toEqual(data);
        }));
    });

    describe('Method mergeElement ', function () {
        // put in cacheService element object and its edit object, modify edit
        // object's name/doc/val, call mergeElement with updateEdit = true with
        //property argument = all/name/documentation/value and check edit object only has that specific property updated
        it('mergeElement() it should update the element in the cache after editing', inject(function () {
            var a = {
                _creator: "gcgandhi", _modified: "2015-07-27T16:32:42.272-0700", _modifier: "dlam",
                _created: "Mon May 18 14:38:12 PDT 2015", name: "vetest Cover Page", documentation: "",
                ownerId  : "holding_bin_vetest_PROJECT-21bbdceb-a188-45d9-a585-b30bba346175"
            };
            var b = {
                _creator: "dlam", _modified: "2015-07-27T16:52:42.272-0700", _modifier: "dlam",
                _created: "Mon May 18 14:38:12 PDT 2015", name: "ve", documentation: "Some Docs",
                ownerId  : "holding_bin_vetest_PROJECT-21bbdceb-a188-45d9-a585-b30bba346175"
            };
            //   var mergeElement = function(source, eid, workspace, updateEdit, property) {
            // CacheService.put('element|master|objectToEdit|latest', a, true);
            CacheService.put('elements|master|objectToEdit|latest', a, true);
            UtilsService.mergeElement(b, 'objectToEdit', 'master', true, 'all');

            var c = CacheService.get('elements|master|objectToEdit|latest');
            // console.log("after :::::::::::" + c.name);

            expect(a.name).toEqual('ve');
        }));
    });

    describe('Method normalize', function () {
        it('normalize() should normalize common arguments on an object with all null values', inject(function () {
            var someSillyNullRiddenObject = {update: null, workspace: null, ver: null};
            var compareObject             = JSON.stringify({update: false, ws: 'master', ver: 'latest', extended: false});
            var res                       = JSON.stringify(UtilsService.normalize(someSillyNullRiddenObject));

            expect(res).toMatch(compareObject);
        }));

        it('normalize() should normalize common arguments on an object with some null values', inject(function () {
            var someSillyPartialNullRiddenObject = {update: null, workspace: "not-master", version: null};
            var wrongObject                      = JSON.stringify({update: false, ws: 'master', ver: 'not-latest'});
            var correctObject                    = JSON.stringify({update: false, ws: 'not-master', ver: 'latest', extended: false});
            var res                              = JSON.stringify(UtilsService.normalize(someSillyPartialNullRiddenObject));

            expect(res).toMatch(correctObject);
            expect(res).not.toMatch(wrongObject);
        }));

        it('normalize() should NOT normalize common arguments on an object with all given values', inject(function () {
            var someSillyObject = {update: true, workspace: "not-master", version: "not-latest"};
            var wrongObject     = JSON.stringify({update: false, ws: null, ver: 'latest'});
            var correctObject   = JSON.stringify({update: true, ws: 'not-master', ver: 'not-latest', extended: false});
            var res             = JSON.stringify(UtilsService.normalize(someSillyObject));

            expect(res).toEqual(correctObject);
            expect(res).not.toEqual(wrongObject);
        }));
    });

    describe('Method hasConflict ', function () {
        // hasConflict
        // given edit object with only keys that were edited,
        // 'orig' object and 'server' object, should only return true
        // if key is in edit object and value in orig object is different from value in server object
        // ex hasConflict( {name: 'blah'}
        // ,
        // {name: 'first', doc: 'a' }
        // ,
        // {name: 'first', doc: 'b'}
        // ) should be false and hasConflict(
        // {name: 'blah'}
        // ,
        // {name: 'first', doc: 'a'}
        // ,
        // {name: 'second', doc: 'a'}
        // ) should be true
        it('hasConflict() should return false because there\s no conflict', inject(function () {
            var orig        = {name: "VE", documentation: "a"};
            var server      = {name: "VE", documentation: "a"};
            var edit        = {name: "EMS", documentation: "b"};
            var hasConflict = UtilsService.hasConflict(edit, orig, server);
            expect(hasConflict).toBe(false);
        }));
        it('hasConflict() should return true because there\s conflict', inject(function () {
            var orig        = {name: "VE", documentation: "a"};
            var server      = {name: "MBSE", documentation: "a"};
            var edit        = {name: "EMS", documentation: "b"};
            var hasConflict = UtilsService.hasConflict(edit, orig, server);
            expect(hasConflict).toBe(true);
        }));
        it('hasConflict() should return true because there\s conflict in the specialization object', inject(function () {
            var orig        = {
                name: "VE", documentation: "a",  type: 'Property', defaultValue: {type: "LiteralString", value:'cache'}
            };
            var server      = {
                name: "VE", documentation: "a", type: 'Property', defaultValue: {type: "LiteralString", value: 'server'}
            };
            var edit        = {
                name: "VE", documentation: "a", type: 'Property', defaultValue: {type: "LiteralString", value: 'edit'}
            };
            var hasConflict = UtilsService.hasConflict(edit, orig, server);
            expect(hasConflict).toBe(true);
        }));
    });

    describe('Function isRestrictedValue', function () {
        var jsonObject1 = getJSONFixture('UtilsService/isRestrictedValue.json')[0];
        var jsonObject2 = getJSONFixture('UtilsService/isRestrictedValue.json')[1];
        var restrictedVal;

        it('isRestrictedValue() should check that the values of the element is restricted', inject(function () {
            // Pass in the value as a part of an array because that is how it is when it is nested within an element
            restrictedVal = UtilsService.isRestrictedValue([jsonObject1]);
            expect(restrictedVal).toBeTruthy();
        }));

        it('isRestrictedValue() should check that the values of the element is NOT restricted', inject(function () {
            restrictedVal = UtilsService.isRestrictedValue([jsonObject2]);
            expect(UtilsService.isRestrictedValue(jsonObject2)).toBeFalsy();
        }));
    });

    describe('Method makeHtmlTable', function () {
        // makeHtmlTable is a method for generating HTML tables based on rapid tables that are modeled in MagicDraw
        var rapidTable;
        var baseline       = jasmine.getFixtures().read('UtilsService/html/baselineMakeHtmlTable.html');
        var rapidTableJson = getJSONFixture('UtilsService/makeHtmlTable.json');

        it('makeHtmlTable() should generate a html table from the json that represents a rapid from MagicDraw', inject(function () {
            // Retrieve the JSON data that the function will use to generate the table
            rapidTable = (UtilsService.makeHtmlTable(rapidTableJson));
            // Check that it was generated
            expect(rapidTable).toBeDefined();
        }));
        // Load the baseline html file
        it('makeHtmlTable() should have a match with the baseline from the generated html table', inject(function () {
            expect(baseline).toMatch(rapidTable);
        }));
    });

    describe('Method makeHtmlList', function () {
        var unorderedHtmlList     = getJSONFixture('UtilsService/makeHtmlList_Unordered.json');
        var unorderedBaselineHtml = jasmine.getFixtures().read('UtilsService/html/baselineMakeHtmlList_Unordered.html');
        var orderedHtmlList       = getJSONFixture('UtilsService/makeHtmlList_Ordered.json');
        var orderedBaselineHtml   = jasmine.getFixtures().read('UtilsService/html/baselineMakeHtmlList_Ordered.html');

        it('makeHtmlList() should create an UNORDERED html list based on the provided json data', inject(function () {
            unorderedHtmlList = (UtilsService.makeHtmlList(unorderedHtmlList));
            expect(unorderedHtmlList).toBeDefined();
            expect(unorderedHtmlList).toMatch(unorderedBaselineHtml);
        }));

        it('makeHtmlList() should create an ORDERED html list based on the provided json data', inject(function () {
            orderedHtmlList = (UtilsService.makeHtmlList(orderedHtmlList));
            expect(orderedHtmlList).toBeDefined();
            expect(orderedHtmlList).toMatch(orderedBaselineHtml);
        }));

        it('should check that makeHtmlPara was used while generating the HTML list', inject(function () {
            expect(orderedHtmlList).toContain("mms-transclude-name");
            expect(unorderedHtmlList).toContain("mms-transclude-name");
        }));
    });

    describe('Method createMmsId', function () {
        // This method is a little funky to test because it uses a randomly generated MmsId
        it('should create a randomly generated MMS ID', inject(function () {
            var randomId = UtilsService.createMmsId();
            expect(randomId).toBeDefined();
            expect(randomId).toMatch(/MMS_[0-9]+_[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+/g);
        }));
    });


    /*
     xdescribe('Method makeHtmlTOC', function () {
     //TODO: Not sure on how to replicate the data needed to test this function
     it("should generate a HTML Table of Contents", function () {
     });
     });

     xdescribe('Method makeTablesAndFiguresTOC', function () {
     //TODO: Not sure on how to replicate the data needed to test this function
     it("should generate a HTML Tables and Figures TOC", function () {
     });
     });

     xdescribe('Method makeTablesAndFiguresTOCChild', function () {
     //TODO: Not sure on how to replicate the data needed to test this function
     it("should generate a HTML Tables and Figures TOC CHILD", function () {
     });
     });
     */
});

