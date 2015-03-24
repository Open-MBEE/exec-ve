'use strict';

angular.module('mms')
.factory('ViewService', ['$q', '$http', 'URLService', 'ElementService', 'UtilsService', 'CacheService', '_', ViewService]);

/**
 * @ngdoc service
 * @name mms.ViewService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * @requires mms.ElementService
 * @requires mms.UtilsService
 * @requires mms.CacheService
 * @requires _
 * 
 * @description
 * Similar to the ElementService and proxies a lot of functions to it, this provides
 * CRUD for views and products/documents
 *
 * For View and Product json object schemas, see [here](https://ems.jpl.nasa.gov/alfresco/mms/raml/index.html)
 */
function ViewService($q, $http, URLService, ElementService, UtilsService, CacheService, _) {
    var currentViewId = '';
    var currentDocumentId = '';
    
    /**
     * @ngdoc method
     * @name mms.ViewService#getView
     * @methodOf mms.ViewService
     * 
     * @description
     * Gets a view object by id. 
     * 
     * @param {string} id The id of the view to get.
     * @param {boolean} [update=false] (optional) whether to always get the latest 
     *      from server, even if it's already in cache (this will update everywhere
     *      it's displayed, except for the editables)
     * @param {string} [workspace=master] (optional) workspace to use
     * @param {string} [version=latest] (optional) alfresco version number or timestamp
     * @returns {Promise} The promise will be resolved with the view object, 
     *      multiple calls to this method with the same id would result in 
     *      references to the same object.
     */
    var getView = function(id, update, workspace, version) { 
        return ElementService.getElement(id, update, workspace, version);
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
     * @param {boolean} [update=false] (optional) whether to always get the latest 
     *      from server, even if it's already in cache (this will update everywhere
     *      it's displayed, except for the editables)
     * @param {string} [workspace=master] (optional) workspace to use
     * @param {string} [version=latest] (optional) alfresco version number or timestamp
     * @returns {Promise} The promise will be resolved with an array of view objects, 
     *      multiple calls to this method with the same ids would result in an array of 
     *      references to the same objects.
     */
    var getViews = function(ids, update, workspace, version) {
        return ElementService.getElements(ids, update, workspace, version);
    };

    /**
     * @ngdoc method
     * @name mms.ViewService#getDocument
     * @methodOf mms.ViewService
     * 
     * @description
     * Gets a document object by id. 
     * 
     * @param {string} id The id of the document to get.
     * @param {boolean} [update=false] (optional) whether to always get the latest 
     *      from server, even if it's already in cache (this will update everywhere
     *      it's displayed, except for the editables)
     * @param {string} [workspace=master] (optional) workspace to use
     * @param {string} [version=latest] (optional) alfresco version number or timestamp
     * @returns {Promise} The promise will be resolved with the document object, 
     *      multiple calls to this method with the same id would result in 
     *      references to the same object.
     */
    var getDocument = function(id, update, workspace, version) {
        return ElementService.getElement(id, update, workspace, version);
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
     * @param {string} [workspace=master] (optional) workspace to use     
     * @returns {Promise} The promise will be resolved with the updated view
     */
    var updateView = function(view, workspace) {
        return ElementService.updateElement(view, workspace);
    };

    /**
     * @ngdoc method
     * @name mms.ViewService#updateDocument
     * @methodOf mms.ViewService
     * 
     * @description
     * Save document to alfresco and update the cache if successful, the document object
     * must have an id, and some updated properties. Use this to update a document's
     * view hierarchy
     * 
     * @param {Object} document An object that contains doc id and any changes to be saved.
     * @param {string} [workspace=master] (optional) workspace to use
     * @returns {Promise} The promise will be resolved with the updated doc
     */
    var updateDocument = function(document, workspace) {
        return ElementService.updateElement(document, workspace);
    };

    /**
     * @ngdoc method
     * @name mms.ViewService#getViewElements
     * @methodOf mms.ViewService
     * 
     * @description
     * Gets the element objects for elements allowed in this view. The references are 
     * the same as ones gotten from ElementService.
     * 
     * @param {string} id The id of the view.
     * @param {boolean} [update=false] (optional) whether to always get the latest 
     *      from server, even if it's already in cache (this will update everywhere
     *      it's displayed, except for the editables)
     * @param {string} [workspace=master] (optional) workspace to use
     * @param {string} [version=latest] (optional) alfresco version number or timestamp
     * @returns {Promise} The promise will be resolved with array of element objects. 
     */
    var getViewElements = function(id, update, workspace, version) {
        var n = normalize(update, workspace, version);
        var deferred = $q.defer();
        var url = URLService.getViewElementsURL(id, n.ws, n.ver);
        var cacheKey = ['views', n.ws, id, n.ver, 'elements'];
        if (CacheService.exists(cacheKey) && !n.update) 
            deferred.resolve(CacheService.get(cacheKey));
        else {
            ElementService.getGenericElements(url, 'elements', n.update, n.ws, n.ver).
            then(function(data) {
                deferred.resolve(CacheService.put(cacheKey, data, false));
            }, function(reason) {
                deferred.reject(reason);
            });
        }
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ViewService#getDocumentViews
     * @methodOf mms.ViewService
     * 
     * @description
     * Gets the view objects for a document. The references are 
     * the same as ones gotten from ElementService.
     * 
     * @param {string} id The id of the document.
     * @param {boolean} [update=false] (optional) whether to always get the latest 
     *      from server, even if it's already in cache (this will update everywhere
     *      it's displayed, except for the editables)
     * @param {string} [workspace=master] (optional) workspace to use
     * @param {string} [version=latest] (optional) alfresco version number or timestamp
     * @returns {Promise} The promise will be resolved with array of view objects. 
     */
    var getDocumentViews = function(id, update, workspace, version, simple) {
        var n = normalize(update, workspace, version);
        var s = !simple ? false : simple; 
        var deferred = $q.defer();
        var url = URLService.getDocumentViewsURL(id, n.ws, n.ver, s);
        var cacheKey = ['products', n.ws, id, n.ver, 'views'];
        if (CacheService.exists(cacheKey) && !n.update) 
            deferred.resolve(CacheService.get(cacheKey));
        else {
            ElementService.getGenericElements(url, 'views', n.update, n.ws, n.ver).
            then(function(data) {
                deferred.resolve(CacheService.put(cacheKey, data, false));
            }, function(reason) {
                deferred.reject(reason);
            });
        }
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ViewService#addViewToDocument
     * @methodOf mms.ViewService
     *
     * @description
     * This updates a document to include a new view, the new view must be a child
     * of an existing view in the document
     * 
     * @param {string} viewid Id of the view to add
     * @param {string} documentId Id of the document to add the view to
     * @param {string} parentViewId Id of the parent view, this view should 
     *      already be in the document
     * @param {string} [workspace=master] workspace to use
     * @returns {Promise} The promise would be resolved with updated document object
     */
    var addViewToDocument = function(viewId, documentId, parentViewId, workspace, viewOb) {
        var deferred = $q.defer();
        var ws = !workspace ? 'master' : workspace;
        var docViewsCacheKey = ['products', ws, documentId, 'latest', 'views'];
        getDocument(documentId, false, ws)
        .then(function(data) {  
            var clone = {};
            clone.sysmlid = data.sysmlid;
            //clone.read = data.read;
            clone.specialization = _.cloneDeep(data.specialization);
            delete clone.specialization.contains;
            for (var i = 0; i < clone.specialization.view2view.length; i++) {
                if (clone.specialization.view2view[i].id === parentViewId) {
                    clone.specialization.view2view[i].childrenViews.push(viewId);
                    break;
                }
            } 
            clone.specialization.view2view.push({id: viewId, childrenViews: []});
            updateDocument(clone, ws)
            .then(function(data2) {
                if (CacheService.exists(docViewsCacheKey) && viewOb)
                    CacheService.get(docViewsCacheKey).push(viewOb);
                deferred.resolve(data2);
            }, function(reason) {
                if (reason.status === 409) {
                    clone.read = reason.data.elements[0].read;
                    clone.modified = reason.data.elements[0].modified;
                    updateDocument(clone, ws)
                    .then(function(data3) {
                        if (CacheService.exists(docViewsCacheKey) && viewOb)
                            CacheService.get(docViewsCacheKey).push(viewOb);
                        deferred.resolve(data3);
                    }, function(reason2) {
                        deferred.reject(reason2);
                    });
                } else
                    deferred.reject(reason);
            });
        }, function(reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ViewService#addElementToView
     * @methodOf mms.ViewService
     *
     * @description
     * This updates a view to include a new element, the new element must be a child
     * of an existing element in the view
     * 
     * @param {string} documentId Id of the document to add the element to
     * @param {string} parentElementId Id of the parent element, this element should 
     *      already be in the document
     * @param {string} [workspace=master] workspace to use
     * @returns {Promise} The promise would be resolved with updated document object
     */
    var addElementToView = function(viewId, parentElementId, workspace, viewOb, elementOb) {

        var deferred = $q.defer();
        var ws = !workspace ? 'master' : workspace;
        var docViewsCacheKey = ['products', ws, viewId, 'latest', 'views'];
        getDocument(viewId, false, ws)
        .then(function(data) {  
            var clone = {};
            clone.sysmlid = data.sysmlid;
            //clone.read = data.read;
            clone.specialization = _.cloneDeep(data.specialization);
            delete clone.specialization.contains;
            if (clone.specialization.contents) {
                clone.specialization.contents.operand.push(elementOb);
            }
            // TODO add to parentElement also if needed 
            updateDocument(clone, ws)
            .then(function(data2) {
                if (CacheService.exists(docViewsCacheKey) && viewOb)
                    CacheService.get(docViewsCacheKey).push(viewOb);
                deferred.resolve(data2);
            }, function(reason) {
                if (reason.status === 409) {
                    clone.read = reason.data.elements[0].read;
                    clone.modified = reason.data.elements[0].modified;
                    updateDocument(clone, ws)
                    .then(function(data3) {
                        if (CacheService.exists(docViewsCacheKey) && viewOb)
                            CacheService.get(docViewsCacheKey).push(viewOb);
                        deferred.resolve(data3);
                    }, function(reason2) {
                        deferred.reject(reason2);
                    });
                } else
                    deferred.reject(reason);
            });
        }, function(reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    var addParagraph = function(view, workspace, addToView) {

        var deferred = $q.defer();

        // Create a Untitled Opaque Paragraph:
        var parElement = {
             "owner": view.sysmlid,
             "name": "Untitled Paragraph",
             "specialization": {
                  "type":"Element"
              }
        };

        ElementService.createElement(parElement, workspace).then(function(createdParElement) {

            var paragraph = {
                "sourceType": "reference",
                "source": createdParElement.sysmlid,
                "sourceProperty": "name",
                "type": "Paragraph"
            };

            var paragraphWrapper = {
                "owner": view.sysmlid,
                "specialization": {
                    "string":JSON.stringify(paragraph),
                    "type":"LiteralString"
                }
            };

            ElementService.createElement(paragraphWrapper, workspace).then(function(createdParagraphWrapper) {

                var instanceSpec = {
                    "owner": view.sysmlid,
                    "specialization": {
                      "type":"InstanceSpecification",
                      "classifier":["PE_Opaque_Paragraph"],
                      "instanceSpecificationSpecification":createdParagraphWrapper.sysmlid
                   }
                };

                ElementService.createElement(instanceSpec, workspace).then(function(createdInstanceSpec) {

                    deferred.resolve(createdInstanceSpec);

                    var instanceVal = {
                        "instance":createdInstanceSpec.sysmlid,
                        "type":"InstanceValue"
                    };

                    if (addToView) {
                        addElementToView(view.sysmlid, view.sysmlid, workspace, view, instanceVal);
                    }
                });

            });

        });

        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ViewService#createView
     * @methodOf mms.ViewService
     * 
     * @description
     * Create a new view, owner must be specified (parent view), id cannot be specified,
     * if name isn't specified, "Untitled" will be used, a default contains with 
     * paragraph of the view documentation will be used. If a document is specified, 
     * will also add the view to the document, in this case the parent view should 
     * already be in the document. The new view will be added as the last child of the 
     * parent view.
     * 
     * @param {string} ownerId Id of the parent view
     * @param {string} [name=Untitled] name for the view
     * @param {string} [documentId] optional document to add to
     * @param {string} [workspace=master] workspace to use 
     * @returns {Promise} The promise will be resolved with the new view. 
     */
    var createView = function(ownerId, name, documentId, workspace) {
        var deferred = $q.defer();
        var view = {
            specialization: {type: 'View', contains: []},
            owner: ownerId,
            name: !name ? 'Untitled View' : name,
            documentation: '',
        };
        ElementService.createElement(view, workspace)
        .then(function(data) {
            data.specialization.contains = [
                {
                    'type': 'Paragraph', 
                    'sourceType': 'reference', 
                    'source': data.sysmlid, 
                    'sourceProperty': 'documentation'
                }
            ];
            data.specialization.allowedElements = [data.sysmlid];
            data.specialization.displayedElements = [data.sysmlid];
            data.specialization.childrenViews = [];
            ElementService.updateElement(data, workspace)
            .then(function(data2) {
                if (documentId) {
                    addViewToDocument(data.sysmlid, documentId, ownerId, workspace, data2)
                    .then(function(data3) {
                        deferred.resolve(data2);
                    }, function(reason) {
                        deferred.reject(reason);
                    });
                } else
                    deferred.resolve(data2);
            }, function(reason) {
                deferred.reject(reason);
            });
        }, function(reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    var createDocument = function(name, site, workspace) {
        var deferred = $q.defer();
        var doc = {
            specialization: {type: "Product"},
            name: !name ? 'Untitled Document' : name,
            documentation: ''
        };
        ElementService.createElement(doc, workspace, site)
        .then(function(data) {
            data.specialization.contains = [
                {
                    'type': 'Paragraph',
                    'sourceType': 'reference',
                    'source': data.sysmlid,
                    'sourceProperty': 'documentation'
                }
            ];
            data.specialization.allowedElements = [data.sysmlid];
            data.specialization.displayedElements = [data.sysmlid];
            data.specialization.view2view = [
                {
                    id: data.sysmlid,
                    childrenViews: []
                }
            ];
            ElementService.updateElement(data, workspace)
            .then(function(data2) {
                var ws = !workspace ? 'master' : workspace;
                var cacheKey = ['sites', ws, 'latest', site, 'products'];
                if (CacheService.exists(cacheKey))
                    CacheService.get(cacheKey).push(data2);
                deferred.resolve(data2);
            }, function(reason) {
                deferred.reject(reason);
            });
        }, function(reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ViewService#getSiteDocuments
     * @methodOf mms.ViewService
     * 
     * @description
     * Gets all the documents in a site
     * 
     * @param {string} site Site name
     * @param {boolean} [update=false] Update latest
     * @param {string} [workspace=master] workspace to use 
     * @returns {Promise} The promise will be resolved with array of document objects 
     */
    var getSiteDocuments = function(site, update, workspace, version) {
        var n = normalize(update, workspace, version);
        var deferred = $q.defer();
        var url = URLService.getSiteProductsURL(site, n.ws, n.ver);
        var cacheKey = ['sites', n.ws, n.ver, site, 'products'];
        if (CacheService.exists(cacheKey) && !n.update) 
            deferred.resolve(CacheService.get(cacheKey));
        else {
            ElementService.getGenericElements(url, 'products', n.update, n.ws, n.ver).
            then(function(data) {              
                deferred.resolve(CacheService.put(cacheKey, data, false));
            }, function(reason) {
                deferred.reject(reason);
            });
        }
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ViewService#parseExprRefTree
     * @methodOf mms.ViewService
     * 
     * @description
     * Parses a InstanceValue node of the expression reference tree in the contents
     * of a View, and returns the corresponding presentation element json object.
     * 
     * @param {string} instanceVal
     * @returns {Promise} The promise will be resolved with a json object for the 
     *                    corresponding presentation element
     */
    var parseExprRefTree = function(instanceVal, workspace) {

        var instanceSpecId = instanceVal.instance;
        var deferred = $q.defer();

        // TODO do we need version?
        ElementService.getElement(instanceSpecId, false, workspace)
        .then(function(instanceSpec) {

            // InstanceSpecifcations can have instanceSpecificationSpecification 
            // for opaque presentation elements, or slots:

            // TODO eventually instanceSpecificationSpecification will most likely be 
            //      a embedded json object, but for now look it up:
            var instanceSpecSpecId = instanceSpec.specialization.instanceSpecificationSpecification;
            //var instanceSpecSpec = instanceSpec.specialization.instanceSpecificationSpecification;

            // TODO do we need version?
            ElementService.getElement(instanceSpecSpecId, false, workspace)
            .then(function(instanceSpecSpec) {

                // TODO will become instanceSpecSpec.type when its a embedded object
                var type = instanceSpecSpec.specialization.type;
                // If it is a Opaque List, Paragraph, Table, Image, List:
                if (type === 'LiteralString') {
                    var jsonString = instanceSpecSpec.specialization.string;  // TODO take out specialization
                    deferred.resolve(JSON.parse(jsonString)); 
                }
                // If it is a Opaque Section, or a Expression:
                else if (type === 'Expression') {
                    // If it is a Opaque Section then we want the instanceSpec:
                    if (isSection(instanceSpec)) {
                        deferred.resolve(instanceSpec);
                    }
                    // Will we ever have an Expression otherwise?
                    else {
                        deferred.resolve(instanceSpecSpec);
                    }
                }
            });

            // If it is a non-Opaque presentation element:
            if (instanceSpec.slots) {
                // TODO
            }        
        });

        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ViewService#isSection
     * @methodOf mms.ViewService
     * 
     * @description
     * Returns true if the passed InstanceSpecification is a Section
     * 
     * @param {Object} instanceSpec A InstanceSpecification json object
     * @returns {boolean} 
     */
    var isSection = function(instanceSpec) {
        return instanceSpec.specialization && instanceSpec.specialization.classifier && 
               instanceSpec.specialization.classifier.length > 0 &&
               instanceSpec.specialization.classifier[0].indexOf('Section') > -1;
    };

    //TODO remove
    var setCurrentViewId = function(id) {
        currentViewId = id;
    };

    var setCurrentDocumentId = function(id) {
        currentDocumentId = id;
    };

    var getCurrentViewId = function() {
        return currentViewId;
    };

    var getCurrentDocumentId = function() {
        return currentDocumentId;
    };

    var normalize = function(update, workspace, version) {
        return UtilsService.normalize({update: update, workspace: workspace, version: version});
    };

    return {
        getView: getView,
        getViews: getViews,
        getDocument: getDocument,
        updateView: updateView,
        updateDocument: updateDocument,
        getViewElements: getViewElements,
        createView: createView,
        createDocument: createDocument,
        addViewToDocument: addViewToDocument,
        getDocumentViews: getDocumentViews,
        getSiteDocuments: getSiteDocuments,
        setCurrentViewId: setCurrentViewId,
        setCurrentDocumentId: setCurrentDocumentId,
        getCurrentViewId: getCurrentViewId,
        getCurrentDocumentId: getCurrentDocumentId,
        parseExprRefTree: parseExprRefTree,
        isSection: isSection,
        addElementToView: addElementToView,
        addParagraph: addParagraph,
    };

}