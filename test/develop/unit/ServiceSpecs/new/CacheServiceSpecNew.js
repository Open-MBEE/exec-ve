'use strict';

xdescribe('Service: CacheService', function () {
	
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

	describe('Method: get', function () {
		it('should get an element', function () {
			var val;
			var key = 'key123';
			var inputVal = 'One ring to rule them all';
			CacheServiceObj.put(key, inputVal);
			CacheServiceObj.get(key).then(function(data) {
				val = data;
			}, function(reason) {
				val = reason.message;
			});
			expect(val).toEqual(inputVal);
			// CacheServiceObj.put(key, inputVal).then(function(data) {
			// 	val = CacheServiceObj.get(key);
			// }, function(reason) {
			// 	val = reason.message;
			// });
			// expect(val).toEqual(inputVal);
		});
	});

	describe('Method: put', function () {
		it('should put an element in the cache', function () {
			var val;
			var key = 'key';
			var value = 'One ring to rule them all';
			CacheServiceObj.put(key, value, true).then(function(data) {
				val = data;
			}, function(reason) {
				val = reason.message;
			});
			expect(val).toEqual(value);
		});
	});

	xdescribe('Method getLatestElements', function () {
		it('should get the latest elements', function () {
			CacheServiceObj.getLatestElements().then(function () {

			});
		});
	});



	xdescribe('Method remove', function () {
		it('should remove element', function () {

		});
	});

	xdescribe('Method exists', function () {
		it('should check if an element exists', function () {

		});
	});

	xdescribe('Method makeKey', function () {
		it('should make a key for an element', function () {

		});
	});

	xdescribe('Method reset', function () {
		it('should reset', function () {

		});
	});
});
