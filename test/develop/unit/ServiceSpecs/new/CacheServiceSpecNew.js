'use strict';

describe('Service: CacheService', function () {
	beforeEach(module('mms'));

	var CacheServiceObj;
	var $rootScope, $scope;

	beforeEach(inject(function ($injector) {
		CacheServiceObj = $injector.get('CacheService');
		$rootScope 		= $injector.get('$rootScope');
		$scope 			= $rootScope.$new();
	}));

	xdescribe('Method: put', function () {
		it('should put in an element', function () {
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

	xdescribe('Method: get', function () {
		// var val;
		// it('should get an element', function () {
		// 	CacheServiceObj.put('key', 'One ring to rule them all', true).then(function(data) {
		// 		expect(CacheServiceObj.get('key')).toEqual(data);
		// 	}, function(reason) {
		// 		expect()
		// 	});
		// });
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
