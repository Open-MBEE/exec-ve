'use strict';

angular.module('mms')
.factory('CommentService', ['$q', '$http', 'URLService', 'ElementService', CommentService]);

function CommentService($q, $http, URLService, ElementService) {
    
    var addComment = function(comment, elementId) {
        
    };
    
    var addComments = function(comments, elementId) {

    };

    var getComments = function(elementId) {

    };

    var updateComment = function(comment) {

    };

    return {
        addComment: addComment,
        addComments: addComments,
        getComments: getComments
        
    };

}