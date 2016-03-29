/* CacheService Unit Tests: 
 * Includes: test putting element in cache, getting from cache, 
 * updating (merging) element that already exists CacheService:
 *  put:
 *  put in an element and get it back, save that reference, check that putting 
 *  in another element with the same key but different values 
 *	with merge = true updates the first reference
 *  exercise the function argument (see SiteService.getSites for example) 
    - check all data are in cache afterwards
 */
'use strict';
describe('CacheService', function() {
	beforeEach(module('mms', function($provide) {}));

	var CacheService;
	beforeEach(inject(function($injector) {
		CacheService = $injector.get('CacheService');    
    }));
    // afterEach(function() {
    //     $httpBackend.verifyNoOutstandingRequest();
    // });
    
	it('should put in an element and return it', function() {
		 CacheService.put("hello world", "I am the ghost", true);
		 expect(CacheService.get("hello world")).toEqual("I am the ghost");
	});
	it('should put in an element with the same key and different values w/ merge set to true', function() {
		 CacheService.put("hello world", "float with me", true);
		 expect(CacheService.get("hello world")).toEqual("float with me");
		 //console.log(CacheService.getCache());
	});
});