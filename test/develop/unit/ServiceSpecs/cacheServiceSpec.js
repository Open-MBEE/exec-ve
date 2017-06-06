'use strict';

describe('Service: CacheService', function () {
	
	var CacheServiceObj;
	var $rootScope, $scope;

	beforeEach(module('mms'));
	beforeEach(function() {
		inject(function ($injector) {
			CacheServiceObj = $injector.get('CacheService');
			$rootScope 		= $injector.get('$rootScope');
			$scope 			= $rootScope.$new();
		});
	});

	describe('Method: get: no need to test', function () {
	});

	describe('Method: put', function () { //getting a "not a function" error with this also
		it('should put an element in the cache', function () {
			var val;
			var key = 'key';
			var value = 'One ring to rule them all';
			CacheServiceObj.put(key, value).then(function(data) {
				val = data;
			}, function(reason) {
				val = reason.message;
			});
			expect(val).toEqual(value);
		});
	});

	describe('Method getLatestElements: no need to test', function () {
	});

	xdescribe('Method remove', function () {
		it('should remove element', function () {

		});
	});

	describe('Method exists', function () {
		it('should check if an element exists', function () {

		});
	});

	describe('Method makeKey: no need to test', function () {
	});

	describe('Method reset: no need to test', function () {
	});
});
