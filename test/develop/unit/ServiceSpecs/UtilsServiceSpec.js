'use strict';
/*UtilsService Unit Tests:
 * Includes: MergeElement, filterProperties, hasConflict
 *
 *
 */
describe('UtilsService', function() {
    beforeEach(module('mms'));

    var UtilsService, CacheService;

    beforeEach(inject(function($injector) {
        UtilsService = $injector.get('UtilsService');
        CacheService = $injector.get('CacheService');
    }));

    /*
      1. hasCircularReference cannot be tested
      2. cleanValueSpec is tested inherently by cleanElement method
      3.
     */

    describe('Method cleanElement ', function() {
        // This test also tests the cleanValueSpec function as well
        it('should return a empty array when elem.specialization.value is not a array and specialization.type is a property', inject(function() {
            var dirtyElement = {author:'muschek', sysmlid:12345, name:'dirtyElement', owner:'otherElement',
                specialization: {type:'Property', isDerived:false, isSlot:false, propertyType:'anotherElementID',
                value: 'not an array'}};
            UtilsService.cleanElement(dirtyElement);
            expect(dirtyElement.specialization.value).toEqual([]);
        }));

        it('should remove all specialization\'s  from specialization.value[] when specialization.type is a property', inject(function() {
            var dirtyElement2 = {author:'muschek', sysmlid:12346, name:'dirtyElement2', owner:'otherElement',
                specialization: {type:'Property', isDerived:false, isSlot:false, propertyType:'anotherElementID',
                value:[{type:'ValueWithSpec', specialization:{type:'Unknown'}},
                {type:'ValueWithSpec', specialization:{type:'Unknown'}}]}};
                UtilsService.cleanElement(dirtyElement2);
                expect(dirtyElement2.specialization.value[0].specialization).not.toBeDefined();
                expect(dirtyElement2.specialization.value[1].specialization).not.toBeDefined();
        }));

        it('for every value of elem.specialization.value if there\'s a valueExpression in any of its children delete it', inject(function() {
            var dirtyElement3 = {author:'muschek', sysmlid:12346, name:'dirtyElement2', owner:'otherElement',
                specialization: {type:'Property', isDerived:false, isSlot:false, propertyType:'anotherElementID',
                value:[{valueExpression:'valueExpression', type:'ValueWithSpec', specialization:{type:'Unknown'}}]}};
                UtilsService.cleanElement(dirtyElement3);
                expect(dirtyElement3.specialization.value[0].valueExpression).not.toBeDefined();
        }));

        it('for every value of elem.specialization.contents if there\'s a valueExpression in any of its children delete it', inject(function() {
            // Test will provide an element with valueExpression with an ID and an operand with a valueExpression ID.
            //  cleanElement will remove both the contents valueExpression and the nested operand valueExpression.
            var dirtyElement4  = { name: "dirtyElement4", owner: "otherElement", sysmlid: 38742, documentation: "",
                author: "muschek", specialization: {contents: {valueExpression: "Super_duper_awesomesauce_value_expression_hya!", operand: [{
                    valueExpression: "Super_duper_awesomesauce_operand_value_expression_hya!"}], type: "Expression"}}};
            UtilsService.cleanElement(dirtyElement4);
            expect(dirtyElement4.specialization.contents.valueExpression).toBeUndefined();
        }));

        it('for every value of elem.specialization.instanceSpecificationSpecification if there\'s a valueExpression in any of its children delete it', inject(function() {
            // Test will check if the instanceSpecificationSpecification has a valueExpression, if so, remove it
            var dirtyViewDocument =    { name: "View Documentation", sysmlid: "Farfignuggen",
                documentation: "Merpity Merp merp", owner: "Some_weird_silly_id_should_be_here",
                appliedMetatypes: ["Not_your_applied_metatype"], specialization: {
                instanceSpecificationSpecification: {valueExpression: "Oh No There is a value expression here!",
                    type: "LiteralString"}, type: "InstanceSpecification"}, isMetatype: false};
            UtilsService.cleanElement(dirtyViewDocument);
            expect(dirtyViewDocument.specialization.instanceSpecificationSpecification.valueExpression).toBeUndefined();
        }));

        it('If elem.specialization.type is view and has both keys contents and contains delete contains', inject(function() {
            var elDirtayElemente =
                {sysmlid: "3301", specialization: {"displayedElements": ["301","302", "303"],
                    allowedElements: ["301","302", "303"], childrenViews: ["304"], contains: [{"type": "Paragraph",
                        sourceType: "reference", source: "301", sourceProperty: "documentation"}]},
                    contents: {valueExpression: null, operand: [{valueExpression: null, type: "InstanceValue",
                        instance: "_18_0_5_407019f_1468188892956_831936_14503"}], type: "Expression"}};
            UtilsService.cleanElement(elDirtayElemente);
            expect(elDirtayElemente.specialization.contents).toBeUndefined();

        }));

        it('If elem.specialization.type is view and has a Array of (key) displayed elements whose length is less then 5000 delete it', inject(function() {
            // Test will load a json object that has less than 5000 elements and verify that it has more than 1 but
            //  less than 5000 elements. Then it will clean the element and check that the displayedElements were
            //  removed from the element.
            $.getJSON('base/test/mock-data/lessthan5000elements.json', function (data) {
                expect(data.specialization.displayedElements.length).toBeGreaterThan(1);
                expect(data.specialization.displayedElements.length).toBeLessThan(5000);
                UtilsService.cleanElement(data);
                expect(data.specialization.displayedElements).toBeUndefined();
            });
        }));

        it('If elem.specialization.type is view and has a Array of (key) displayed elements whose length is greater then 5000 convert the array to JSON', inject(function() {
            $.getJSON('base/test/mock-data/morethan5000elements.json', function (data) {
                expect(data.specialization.displayedElements.length).toBeGreaterThan(5000);
                UtilsService.cleanElement(data);
                expect(data.specialization.displayedElements).not.toBeUndefined();
            });
        }));

        it('should delete any nonEditable keys from the object', inject(function() {
            // ['contains', 'view2view', 'childrenViews', 'displayedElements','allowedElements', 'contents', 'relatedDocuments']
            $.getJSON('base/test/mock-data/utilsservice-noneditblekeys.json', function (data) {
                // Verify that all the data is in the json first. This JSON is technically malformed but serves the
                //  purpose for testing.
                expect(data.specialization.displayedElements).toBeDefined();
                expect(data.specialization.view2view).toBeDefined();
                expect(data.specialization.childrenViews).toBeDefined();
                expect(data.specialization.contains).toBeDefined();
                expect(data.specialization.allowedElements).toBeDefined();
                expect(data.specialization.contents).toBeDefined();
                expect(data.relatedDocuments).toBeDefined();

                // Have to pass in true to enable forEdit that removes any noneditable keys
                UtilsService.cleanElement(data,true);

                // Verify that all of the non editable keys have been removed from the JSON
                expect(data.specialization.displayedElements).toBeUndefined();
                expect(data.specialization.view2view).toBeUndefined();
                expect(data.specialization.childrenViews).toBeUndefined();
                expect(data.specialization.contains).toBeUndefined();
                expect(data.specialization.allowedElements).toBeUndefined();
                expect(data.specialization.contents).toBeUndefined();
                expect(data.relatedDocuments).toBeUndefined();
            });
        }));
    });

    describe('Method filterProperties ', function() {
        //given element object a and element object b, returns new object with b data minus keys not in a
        it('it should return a new object with b data minus keys not in a for elements a and b', inject(function() {
            //used to updateElements checking a object in the cache (that has been updated) with the same object from the server.... B - A
            var a = {specialization:{specialization:{hello:'world'}}};
            var b = {specialization:{specialization:{hello:'world', foo:'bar'}}};
            //console.log("This is b before"+ JSON.stringify(b.specialization.specialization));
            var result = UtilsService.filterProperties(a, b);
            //console.log("This is result after"+ JSON.stringify(result));
            expect(result.specialization.specialization.foo).toBeUndefined();
            expect(result.specialization.specialization.hello).toEqual('world');
            //result should equal just foo.....
            // this is used to merge in only the keys that are new!
        }));
    });

    xdescribe('Method buildTreeHierarchy', function () {
        // $scope.my_data = UtilsService.buildTreeHierarchy(filter_sites(sites), "sysmlid", "site", "parent", siteInitFunc);
        // $scope.my_data = UtilsService.buildTreeHierarchy(workspaces, "id", "workspace", "parent", workspaceLevel2Func);

    });

    xdescribe('Method normalize', function () {});

    xdescribe('Method makeElementKey', function () {});

    describe('Method mergeElement ', function() {
        // put in cacheService element object and its edit object, modify edit
        // object's name/doc/val, call mergeElement with updateEdit = true with
        //property argument = all/name/documentation/value and check edit object only has that specific property updated

        it('it should update the element in the cache after editing', inject(function() {
            var a = {creator: "gcgandhi", modified: "2015-07-27T16:32:42.272-0700",modifier: "dlam",
                created: "Mon May 18 14:38:12 PDT 2015", name: "vetest Cover Page", documentation: "",
                owner: "holding_bin_vetest_PROJECT-21bbdceb-a188-45d9-a585-b30bba346175"};
            var b = {creator: "dlam", modified: "2015-07-27T16:32:42.272-0700",modifier: "dlam",
                created: "Mon May 18 14:38:12 PDT 2015", name: "ve", documentation: "",
                owner: "holding_bin_vetest_PROJECT-21bbdceb-a188-45d9-a585-b30bba346175"};
            //   var mergeElement = function(source, eid, workspace, updateEdit, property) {
            CacheService.put('element|master|objectToEdit|latest', a, true);
            UtilsService.mergeElement(b, 'objectToEdit', 'master',true, 'all');
            var c = CacheService.get('element|master|objectToEdit|latest');
            console.log("after :::::::::::" + c.name);
            expect(a.name).toEqual('ve');

            //UtilsService.filterProperties(a, b);
        }));

    });

    /*
    xdescribe('Method hasConflict ', function() {
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
        it('should return false because there\s no conflict', inject(function() {
            var orig = { name: "VE", documentation: "a"};
            var server = { name: "VE", documentation: "a"};
            var edit = { name: "EMS", documentation: "b"};
            var hasConflict = UtilsService.hasConflict(edit, orig, server);
            expect(hasConflict).toBe(false);
        }));
        it('should return true because there\s conflict', inject(function() {
            var orig = { name: "VE", documentation: "a"};
            var server = { name: "MBSE", documentation: "a"};
            var edit = { name: "EMS", documentation: "b"};
            var hasConflict = UtilsService.hasConflict(edit, orig, server);
            expect(hasConflict).toBe(true);
        }));
        it('should return true because there\s conflict in the specialization object', inject(function() {
            var orig = { name: "VE", documentation: "a", specialization:
            {type:'Property',value: 'cache'}};
            var server = { name: "VE", documentation: "a", specialization:
            {type:'Property',value: 'server'}};
            var edit = { name: "VE", documentation: "a", specialization:
            {type:'Property',value: 'edit'}};
            var hasConflict = UtilsService.hasConflict(edit, orig, server);
            expect(hasConflict).toBe(true);
        }));
    });

    xdescribe('Function isRestrictedValue', function () {});

    xdescribe('Method makeHtmlTable', function () {});

    xdescribe('Method makeTableBody', function () {});

    xdescribe('Method makeHtmlList', function () {});

    xdescribe('Method makeHtmlPara', function () {});

    xdescribe('Method makeHtmlTOC', function () {});

    xdescribe('Method makeHtmlTOCChild', function () {});

    xdescribe('Method makeTablesAndFiguresTOC', function () {});

    xdescribe('Method makeTablesAndFiguresTOCChild', function () {});

    xdescribe('Method createMmsId', function () {});

    xdescribe('Method getIdInfo', function () {});

    xdescribe('Method getPrintCss', function () {});
    */
});

