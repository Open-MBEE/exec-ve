'use strict';

describe('Service: CacheService', function () {
	
	var CacheServiceObj;
	var mockUtilsService;
	var $rootScope, $scope;

	beforeEach(module('mms'));
	beforeEach(function() {
		inject(function ($injector) {
			CacheServiceObj 	= $injector.get('CacheService');
			$rootScope 			= $injector.get('$rootScope');
			mockUtilsService	= $injector.get('UtilsService');
			$scope 				= $rootScope.$new();
		});
	});

	describe('Method: get: no need to test', function () {
	});

	describe('Method: put', function () { 
		it('should put an element in the cache', function () {
			var val;
			var value = {
				projectId: 'heyaproject',
				elementId: 'heyanelement',
				refId: 'master',
				commitId: 'latest'
			};
			var key = mockUtilsService.makeElementKey(value);
			var val = CacheServiceObj.put(key, value);
			expect(val).toEqual(value);
		});
	});

	describe('Method getLatestElements: no need to test', function () {
	});

	describe('Method remove', function () {
		it('should remove element from the cache', function () {
			var value = {
				projectId: 'heyaproject',
				elementId: 'heyanelement',
				refId: 'master',
				commitId: 'latest'
			};
			var key = mockUtilsService.makeElementKey(value);
			var val = CacheServiceObj.put(key, value);
			// spyOn(CacheServiceObj, "put").and.callFake(function(key, value) {
			// 	return value;
			// });
			var result = CacheServiceObj.remove(key);
			expect(result).toEqual(value);
		});
	});

	describe('Method exists', function () {
		it('should check if an element value exists for a key', function () {
			var value = {
				projectId: 'heyaproject',
				elementId: 'heyanelement',
				refId: 'master',
				commitId: 'latest'
			};
			var key = mockUtilsService.makeElementKey(value);
			var val = CacheServiceObj.put(key, value);
			var result = CacheServiceObj.exists(key);
			expect(result).toEqual(true);
		});
	});

	describe('Method makeKey: no need to test', function () {
	});

	describe('Method reset: no need to test', function () {
	});
});
