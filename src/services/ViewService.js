'use strict';

angular.module('mms')
.factory('ViewService', ['$q', '$http', 'URLService', 'ElementService', 'CommentService', ViewService]);

/**
 * @ngdoc service
 * @name mms.ViewService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * @requires mms.ElementService
 * @requires mms.CommentService
 * 
 * @description
 * A view and document cache and CRUD service. Maintains a cache of view/document 
 * id to view objects. These objects include view hierarchies, the display structure,
 * and keeps track of what elements are referenced in each view. 
 */
function ViewService($q, $http, URLService, ElementService, CommentService) {
    var views = {};
    var allowedElements = {};
    var displayedElements = {};
    var transcludedElements = {}; //view id to element objects from ElementService

    /**
     * @ngdoc method
     * @name mms.ViewService#getView
     * @methodOf mms.ViewService
     * 
     * @description
     * Gets a view object by id. If the view object is already in the cache,
     * resolve the existing reference, if not, request it from the repository, add 
     * it to the cache, and resolve the new object.
     * 
     * @param {string} id The id of the view to get.
     * @returns {Promise} The promise will be resolved with the view object, 
     *      multiple calls to this method with the same id would result in 
     *      references to the same object.
     */
    var getView = function(id) { 
        var deferred = $q.defer();
        if (views.hasOwnProperty(id))
            deferred.resolve(views[id]);
        else {
            $http.get(URLService.getRoot() + '/views/' + id)
            .success(function(data, status, headers, config) {
                if (data.views.length > 0) {
                    if (views.hasOwnProperty(id))
                        deferred.resolve(views[id]);
                    else {
                        views[id] = data.views[0];
                        deferred.resolve(views[id]);
                    }
                } else {
                    deferred.reject("Not Found");
                }
            }).error(function(data, status, headers, config) {
                if (status === 404)
                    deferred.reject("Not Found");
                else if (status === 500)
                    deferred.reject("Server Error");
                else if (status === 401 || status === 403)
                    deferred.reject("Unauthorized");
                else
                    deferred.reject("Failed");
            });
        }
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ViewService#getViews
     * @methodOf mms.ViewService
     * 
     * @description
     * Same as getView, but for multiple ids.
     * 
     * @param {Array.<string>} ids The ids of the views to get.
     * @returns {Promise} The promise will be resolved with an array of view objects, 
     *      multiple calls to this method with the same ids would result in an array of 
     *      references to the same objects.
     */
    var getViews = function(ids) {

    };

    /**
     * @ngdoc method
     * @name mms.ViewService#getDocument
     * @methodOf mms.ViewService
     * 
     * @description
     * Gets a document object by id. If the document object is already in the cache,
     * resolve the existing reference, if not, request it from the repository, add 
     * it to the cache, and resolve the new object.
     * 
     * @param {string} id The id of the document to get.
     * @returns {Promise} The promise will be resolved with the document object, 
     *      multiple calls to this method with the same id would result in 
     *      references to the same object.
     */
    var getDocument = function(id) {

    };

    /**
     * @ngdoc method
     * @name mms.ViewService#getViewDisplayedElements
     * @methodOf mms.ViewService
     * 
     * @description
     * Gets the element objects for elements displayed in this view. The references are 
     * the same as ones gotten from ElementService.
     * 
     * @param {string} id The id of the view.
     * @returns {Promise} The promise will be resolved with array of element objects. 
     */
    var getViewDisplayedElements = function(id) {

    };

    /**
     * @ngdoc method
     * @name mms.ViewService#getViewAllowedElements
     * @methodOf mms.ViewService
     * 
     * @description
     * Gets the element objects for elements allowed in this view. The references are 
     * the same as ones gotten from ElementService.
     * 
     * @param {string} id The id of the view.
     * @returns {Promise} The promise will be resolved with array of element objects. 
     */
    var getViewAllowedElements = function(id) {

    };

    /**
     * @ngdoc method
     * @name mms.ViewService#getViewAllowedElements
     * @methodOf mms.ViewService
     * 
     * @description
     * Gets the element objects for elements transcluded in this view. The references are 
     * the same as ones gotten from ElementService.
     * Isn't this really the same as displayedElements?
     * 
     * @param {string} id The id of the view.
     * @returns {Promise} The promise will be resolved with array of element objects. 
     */
    var getViewTranscludedElements = function(id) {

    };

    return {
        getView: getView,
        getViews: getViews,
        getDocument: getDocument,
        getViewDisplayedElements: getViewDisplayedElements,
        getViewAllowedElements: getViewAllowedElements
    };

}