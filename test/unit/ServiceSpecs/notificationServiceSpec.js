'use strict';

/* jasmine specs for services go here */

describe('service', function() {
  beforeEach(module('myApp.services'));

  var displayError = function() { console.log('This should not be displayed') };


  describe('version', function() {
    it('should return current version', inject(function(version) {
      expect(version).toEqual('0.1');
    }));
  });
});


// NotificationService - done, 3 methods, [3 empty]
describe('NotificationService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the NotificationService and methods are valid', inject(function() {
		expect(NotificationService).toBeDefined();

		expect(NotificationService.getFollowing).not.toBe(null);
		expect(NotificationService.follow).not.toBe(null);
		expect(NotificationService.unfollow).not.toBe(null);
	}));

	it('getFollowing', inject(function() {

	}));

	it('follow', inject(function() {

	}));

	it('unfollow', inject(function() {

	}));
});