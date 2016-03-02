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
	
	describe('Method cleanElement ', function() {
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
			// :TODO what does this object look like? 
		}));
		it('for every value of elem.specialization.instanceSpecificationSpecification if there\'s a valueExpression in any of its children delete it', inject(function() {
			
		}));
		it('If elem.specialization.type is view and has both keys contents and contains delete contains', inject(function() {
			
		}));
		it('If elem.specialization.type is view and has a Array of (key) displayed elements whose length is less then 5000 delete it', inject(function() {
			
		}));
		it('If elem.specialization.type is view and has a Array of (key) displayed elements whose length is greater then 5000 contvert the array to JSON', inject(function() {
			
		}));
		it('should delete any nonEditable keys from the object', inject(function() {
			// ['contains', 'view2view', 'childrenViews', 'displayedElements','allowedElements', 'contents', 'relatedDocuments']
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
	// describe('Method mergeElement ', function() {
	// 	// put in cacheService element object and its edit object, modify edit
	// 	// object's name/doc/val, call mergeElement with updateEdit = true with 
	// 	//property argument = all/name/documentation/value and check edit object only has that specific property updated
	// 
	// 	it('it should update the element in the cache after editing', inject(function() {
	// 		var a = {creator: "gcgandhi", modified: "2015-07-27T16:32:42.272-0700",modifier: "dlam",
	// 		         created: "Mon May 18 14:38:12 PDT 2015", name: "vetest Cover Page", documentation: "",
    //                  owner: "holding_bin_vetest_PROJECT-21bbdceb-a188-45d9-a585-b30bba346175"};
	// 		var b = {creator: "dlam", modified: "2015-07-27T16:32:42.272-0700",modifier: "dlam",
	// 	 			 created: "Mon May 18 14:38:12 PDT 2015", name: "ve", documentation: "",
	// 	             owner: "holding_bin_vetest_PROJECT-21bbdceb-a188-45d9-a585-b30bba346175"};
	// 		//   var mergeElement = function(source, eid, workspace, updateEdit, property) {
	// 		CacheService.put('element|master|objectToEdit|latest', a, true);
	// 		UtilsService.mergeElement(b, 'objectToEdit', 'master',true, 'all');
	// 		var c = CacheService.get('element|master|objectToEdit|latest');
	// 		console.log("after :::::::::::" + c.name);
	// 		expect(a.name).toEqual('ve');
	// 		
	// 		//UtilsService.filterProperties(a, b);
	// 	}));
	// 	
	// });
	describe('Method hasConflict ', function() {
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
});