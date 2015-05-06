'use strict';

angular.module('mms')
.factory('CommentService', ['$q', '$http', 'URLService', 'ElementService', CommentService]);

/**
 * @ngdoc service
 * @name mms.CommentService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * @requires mms.ElementService
 * 
 * @description
 * TBD, this service is a stub, do not use
 */
function CommentService($q, $http, URLService, ElementService) {
    
    /**
     * @ngdoc method
     * @name mms.CommentService#addComment
     * @methodOf mms.CommentService
     * 
     * @description
     * Adds a new comment to an object
     * 
     * @param {string} id The id of the object (element or alfresco).
     * @param {string} comment The comment, can contain html
     * @returns {Promise} The promise will be resolved with the new comment object
     */
    var addComment = function(id, comment) {
        
    };

    /**
     * @ngdoc method
     * @name mms.CommentService#getComments
     * @methodOf mms.CommentService
     * 
     * @description
     * Gets the comments for an object, in reverse chronological time
     * 
     * @param {string} id The id of the object.
     * @returns {Promise} The promise will be resolved with an array of comment
     *      objects
     */
    var getComments = function(id) {

    };

    /**
     * @ngdoc method
     * @name mms.CommentService#updateComment
     * @methodOf mms.CommentService
     * 
     * @description
     * Update a comment
     * 
     * @param {Object} comment A comment object with the id and body
     * @returns {Promise} The promise will be resolved with the updated comment object
     */
    var updateComment = function(comment) {

    };

    /**
     * @ngdoc method
     * @name mms.CommentService#deleteComment
     * @methodOf mms.CommentService
     * 
     * @description
     * Delete a comment 
     * 
     * @param {string} commentId The id of the comment.
     * @returns {Promise} The promise will be resolved with the value 'true'
     */
    var deleteComment = function(commentId) {

    };

    return {
        addComment: addComment,
        getComments: getComments,
        updateComment: updateComment,
        deleteComment: deleteComment
    };

}