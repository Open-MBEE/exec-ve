'use strict';

// CommentService - done, [4 empty]
describe('CommentService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the CommentService', inject(function() {
		expect(CommentService).toBeDefined();

		expect(CommentService.addComment).not.toBe(null);
		expect(CommentService.getComments).not.toBe(null);
		expect(CommentService.updateComment).not.toBe(null);
		expect(CommentService.deleteComment).not.toBe(null);
	}));

	it('addComment', inject(function() {}));

	it('getComments', inject(function() {}));

	it('updateComment', inject(function() {}));

	it('deleteComment', inject(function() {}));
});