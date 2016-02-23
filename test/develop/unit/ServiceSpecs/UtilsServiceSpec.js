'use strict';
// UtilsService: mergeElement, filterProperties, hasConflict
// cleanElement
// give element object with [encountered] bad stuff in them and check they're removed
// filterProperties
// given element object a and element object b, returns new object with b data minus keys not in a
// mergeElement
// put in cacheService element object and its edit object, modify edit object's name/doc/val, call mergeElement with updateEdit = true with property argument = all/name/documentation/value and check edit object only has that specific property updated
// hasConflict
// given edit object with only keys that were edited, 'orig' object and 'server' object, should only return true if key is in edit object and value in orig object is different from value in server object
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


describe('UtilsService', function() {
	beforeEach(module('mms'));
	
	var UtilsService, CacheService;

	beforeEach(inject(function($injector) {
		UtilsService = $injector.get('UtilsService');
		CacheService = $injector.get('CacheService');
	}));
	
	describe('Method cleanElement ', function() {
		// 
		// // (!viewElements.hasOwnProperty(ver) && * && *), success, !viewElements.hasOwnProperty(ver)
		// ViewService.getViewElements('12345', false, 'master', '01-01-2014').then(function(response) {
		// 	expect(response.length).toEqual(2);
		// 	expect(response[0]).toEqual({author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'01-01-2014'});
		// 	expect(response[1]).toEqual({author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'01-01-2014'});
		// }); $httpBackend.flush();
		// // viewElements['01-01-2014']['12345'] now exists
		it('should return a empty array when elem.specialization.value is not a array and specialization.type is a property', inject(function() {
			var dirtyElement = {author:'muschek', sysmlid:12345, name:'dirtyElement', owner:'otherElement', 
				specialization: {type:'Property', isDerived:false, isSlot:false, propertyType:'anotherElementID', 
				value: 'not an array'}};
			console.log('before value:' + dirtyElement.specialization.value);
			UtilsService.cleanElement(dirtyElement);
			expect(dirtyElement.specialization.value).toEqual([]);
			console.log('value:' + dirtyElement.specialization.value);
		}));
		// it('should return a empty array when elem.specialization.value is not a array and specialization.type is a property', inject(function() {
		// 
		// }));
		it('should remove all specialization\'s  from specialization.value[] when specialization.type is a property', inject(function() {
			// 		{"elements": [{
			// "specialization": {
			//     "propertyType": "_11_5EAPbeta_be00301_1147873226632_528960_2311",
			//     "isSlot": true,
			//     "isDerived": false,
			//     "value": [{
			//         "valueExpression": null,
			//         "string": "<p>The Spacecraft shall measure and telemeter Payload interface temperatures.<\/p>",
			//         "type": "LiteralString"
			//     }],"type": "Property"}
		    //     }]}
			var dirtyElement2 = {author:'muschek', sysmlid:12346, name:'dirtyElement2', owner:'otherElement', 
				specialization: {type:'Property', isDerived:false, isSlot:false, propertyType:'anotherElementID',
				value:[{type:'ValueWithSpec', specialization:{type:'Unknown'}}, 
				{type:'ValueWithSpec', specialization:{type:'Unknown'}}]}};
				UtilsService.cleanElement(dirtyElement2);
				expect(dirtyElement2.specialization.value[0].specialization).not.toBeDefined();
				expect(dirtyElement2.specialization.value[1].specialization).not.toBeDefined();
		}));
		it('for every value of elem.specialization.value if there\'s a valueExpression in any of its children delete it', inject(function() {
			// going to need Operands for each of its children.....in json string
			// I think these all can be bundled in one assertion
			var dirtyElement3 = {author:'muschek', sysmlid:12346, name:'dirtyElement2', owner:'otherElement', 
				specialization: {type:'Property', isDerived:false, isSlot:false, propertyType:'anotherElementID',
				value:[{valueExpression:'valueExpression', type:'ValueWithSpec', specialization:{type:'Unknown'}}]}};
				UtilsService.cleanElement(dirtyElement3);
				expect(dirtyElement3.specialization.value[0].valueExpression).not.toBeDefined();
		}));
		it('for every value of elem.specialization.contents if there\'s a valueExpression in any of its children delete it', inject(function() {
			
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
			var a = {specialization:{specialization:{hello:'world'}}}
			var b = {specialization:{specialization:{hello:'world', foo:'bar'}}}
			//console.log("This is b before"+ JSON.stringify(b.specialization.specialization));
			var result = UtilsService.filterProperties(a, b);
			//console.log("This is result after"+ JSON.stringify(result));
			expect(result.specialization.specialization.foo).toBeUndefined();
			expect(result.specialization.specialization.hello).toEqual('world');
			//result should equal just foo.....
			// this is used to merge in only the keys that are new!
		}));
		
	});
	describe('Method mergeElement ', function() {
		// put in cacheService element object and its edit object, modify edit
		// object's name/doc/val, call mergeElement with updateEdit = true with 
		//property argument = all/name/documentation/value and check edit object only has that specific property updated
		// hasConflict

		it('it should return a new object with b data minus keys not in a for elements a and b', inject(function() {
			CacheService.put("hello world", "I am the ghost", true);
		}));
		
	});
});