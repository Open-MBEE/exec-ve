'use strict';

xdescribe('CacheService', function () {
	beforeEach(module('mms'));

	var CacheServiceObj;
	var $rootScope;

	beforeEach(inject(function ($injector) {
		CacheServiceObj = $injector.get('CacheService');
		$rootScope 		= $injector.get('$rootScope');
		scope 			= $rootScope.$new();

		scope.element = {
			
		}
	}));

	describe('Method get', function () {
		CacheServiceObj.put('key', 'One ring to rule them all', true);
		it('should get an element', function () {
			expect(CacheServiceObj.get('key')).toEqual('One ring to rule them all');
		});
	});

	xdescribe('Method getLatestElements', function () {
		it('should get the latest elements', function () {
			CacheServiceObj.getLatestElements().then(function () {

			});
		});
	});

	xdescribe('Method put', function () {
		it('should put in an element', function () {

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
