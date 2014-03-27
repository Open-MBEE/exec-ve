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
 *
 * Current View object:
 * ```
 *      {
 *          "id": view id (element id),
 *          "childrenViews": [viewIds],     //canonical hierarchy
 *          "displayedElements": [elementIds],
 *          "allowedElements": [elementIds],
 *          "contains": [
 *              {
 *                  "type": "Paragraph" | "Table" | "List",
 *                  
 *                  //if type is Paragraph//
 *                  "sourceType": "reference" | "text",
 *                  //if sourceType is reference
 *                  "source": element id,
 *                  "sourceProperty": "documentation" | "name" | "value"
 *                  //if sourceType is text
 *                  "text": text string can have html
 *
 *                  //if type is Table//
 *                  "title": title of table as string,
 *                  "body": [               //array of rows
 *                       [{                 //array of cells
 *                          "content": [    //each cell can have multiple items
 *                              {"type": "Paragraph" | "Table" | "List" ...}
 *                          ],
 *                          "colspan": integer,
 *                          "rolspan": integer
 *                       }]
 *                  ],
 *                  "header": same as body,
 *
 *                  //if type is List//
 *                  "list": [               //array of list items
 *                      [{                  //each list item can have multiple things
 *                          "type": "Paragraph" | "Table" | "List" ...
 *                      }]
 *                  ],
 *                  "ordered": true | false
 *              }
 *          ]
 *      }
 * ```
 *
 * Current Document object:
 * ```
 *      {
 *          "id": document id (element and view id),
 *          "noSections": [viewIds],
 *          "view2view": [
 *              {
 *                  "id": document or view id,
 *                  "childrenViews": [viewIds]
 *              }
 *          ]
 *      }
 * ```
 */
function ViewService($q, $http, URLService, ElementService, CommentService) {
    var views = {};
    var allowedElements = {};
    var displayedElements = {};
    var transcludedElements = {}; 
    var comments = {};
    var documents = {};

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
            $http.get(URLService.getViewURL(id))
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
     * @name mms.ViewService#updateView
     * @methodOf mms.ViewService
     * 
     * @description
     * Save view to alfresco and update the cache if successful, the view object
     * must have an id, and some updated properties. Use this to update view structure
     * or view to element reference caches.
     * 
     * @param {Object} view An object that contains view id and any changes to be saved.
     * @returns {Promise} The promise will be resolved with the updated cache view reference if 
     *      update is successful.
     */
    var updateView = function(view) {

    };

    /**
     * @ngdoc method
     * @name mms.ViewService#updateDocument
     * @methodOf mms.ViewService
     * 
     * @description
     * Save document to alfresco and update the cache if successful, the document object
     * must have an id, and some updated properties. Use this to update a document's
     * view hierarchy or nosections
     * 
     * @param {Object} document An object that contains doc id and any changes to be saved.
     * @returns {Promise} The promise will be resolved with the updated cache doc reference if 
     *      update is successful.
     */
    var updateDocument = function(document) {

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

    /**
     * @ngdoc method
     * @name mms.ViewService#getViewComments
     * @methodOf mms.ViewService
     * 
     * @description
     * Gets the comemnts for the view, in reverse chronological time
     * 
     * @param {string} id The id of the view.
     * @returns {Promise} The promise will be resolved with array of comment objects. 
     */
    var getViewComments = function(id) {

    };

    /**
     * @ngdoc method
     * @name mms.ViewService#addViewComments
     * @methodOf mms.ViewService
     * 
     * @description
     * Add a comment to a view
     * 
     * @param {string} id The id of the view.
     * @param {string} comment The comment to add, can contain html
     * @returns {Promise} The promise will be resolved the new comment object. 
     */
    var addViewComment = function(id, comment) {

    };

    /**
     * @ngdoc method
     * @name mms.ViewService#deleteViewComment
     * @methodOf mms.ViewService
     * 
     * @description
     * Add a comment to a view
     * 
     * @param {string} id The id of the view.
     * @param {string} commentId The id of comment to delete
     * @returns {Promise} The promise will be resolved true. 
     */
    var deleteViewComment = function(id, commentId) {

    };

    /**
     * @ngdoc method
     * @name mms.ViewService#updateViewElements
     * @methodOf mms.ViewService
     * 
     * @description
     * Do a bulk save of all edited elements in a view to server, this does not save any
     * view structure changes
     * 
     * @param {string} id The id of the view.
     * @returns {Promise} The promise will be resolved with saved element objects. 
     */
    var updateViewElements = function(id) {

    };

    return {
        getView: getView,
        getViews: getViews,
        getDocument: getDocument,
        updateView: updateView,
        updateDocument: updateDocument,
        getViewDisplayedElements: getViewDisplayedElements,
        getViewAllowedElements: getViewAllowedElements,
        getViewComments: getViewComments,
        addViewComment: addViewComment,
        deleteViewComment: deleteViewComment,
        updateViewElements: updateViewElements
    };

}