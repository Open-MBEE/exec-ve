'use strict';

// ProjectService - done, [empty]
describe('ProjectService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the ProjectService', inject(function() {
		expect(ProjectService).toBeDefined();
		expect(ProjectService()).toEqual({});
	}))
});