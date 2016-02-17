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
	
	describe('Method cleanElement ', function() {
		// 
		// // (!viewElements.hasOwnProperty(ver) && * && *), success, !viewElements.hasOwnProperty(ver)
		// ViewService.getViewElements('12345', false, 'master', '01-01-2014').then(function(response) {
		// 	expect(response.length).toEqual(2);
		// 	expect(response[0]).toEqual({author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'01-01-2014'});
		// 	expect(response[1]).toEqual({author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'01-01-2014'});
		// }); $httpBackend.flush();
		// // viewElements['01-01-2014']['12345'] now exists

	})
});