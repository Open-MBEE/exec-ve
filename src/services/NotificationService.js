'use strict';

angular.module('mms')
.factory('NotificationService', ['$q', '$http', 'URLService', NotificationService]);

/**
 * @ngdoc service
 * @name mms.NotificationService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * 
 * @description
 * This service handles following elements - user will get notification for things they 
 * follow that changed
 */
function NotificationService($q, $http, URLService) {

    /**
     * @ngdoc method
     * @name mms.NotificationService#getFollowing
     * @methodOf mms.NotificationService
     * 
     * @description
     * Gets the objects the current user is following
     * 
     * @returns {Promise} The promise will be resolved with an array of object ids
     */
    var getFollowing = function() {
        
    };

    /**
     * @ngdoc method
     * @name mms.NotificationService#follow
     * @methodOf mms.NotificationService
     * 
     * @description
     * Follow a new object
     *
     * @param {string} id Element or alfresco id to follow
     * @returns {Promise} The promise will be resolved with an array of object ids
     */
    var follow = function(id) {
        
    };

    /**
     * @ngdoc method
     * @name mms.NotificationService#unfollow
     * @methodOf mms.NotificationService
     * 
     * @description
     * Unfollow the provided object
     *
     * @param {string} id Element or alfresco id to unfollow
     * @returns {Promise} The promise will be resolved with an array of object ids
     */
    var unfollow = function(id) {
        
    };

    return {
        getFollowing: getFollowing,
        follow: follow,
        unfollow: unfollow
    };

}