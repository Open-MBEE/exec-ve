'use strict';

angular.module('mms')
.factory('ViewService', ['$q', '$http', '$rootScope','URLService', 'ElementService', 'UtilsService', 'CacheService', '_', ViewService]);

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
function ViewService($q, $http, $rootScope, URLService, ElementService, UtilsService, CacheService, _) {
    var currentViewId = '';
    var currentDocumentId = '';

    // The type of opaque element to the sysmlid of the classifier:
    var typeToClassifierId = {
        Image: "_17_0_5_1_407019f_1430628206190_469511_11978",
        List: "_17_0_5_1_407019f_1430628190151_363897_11927",
        Paragraph: "_17_0_5_1_407019f_1430628197332_560980_11953",
        Table: "_17_0_5_1_407019f_1430628178633_708586_11903",
        Section: "_17_0_5_1_407019f_1430628211976_255218_12002",
        ListT: "_17_0_5_1_407019f_1431903739087_549326_12013",
        TableT: "_17_0_5_1_407019f_1431903724067_825986_11992",
        Figure: "_17_0_5_1_407019f_1431903748021_2367_12034",  //manual images + timely, etc
        Equation: "_17_0_5_1_407019f_1431905053808_352752_11992",
        ParagraphT: "_17_0_5_1_407019f_1431903758416_800749_12055",
        SectionT: "_18_0_2_407019f_1435683487667_494971_14412"
    };
    
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
     * @param {boolean} [simple=false] (optional) whether to get simple views
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
     * @param {Object} [viewOb=null] if present, adds to document views cache array
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
            if (clone.specialization.contains)
                delete clone.specialization.contains;
            if (clone.specialization.contents)
                delete clone.specialization.contents;
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
                /*if (reason.status === 409) {
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
                    deferred.reject(reason);*/
                deferred.reject(reason);
            });
        }, function(reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ViewService#addElementToViewOrSection
     * @methodOf mms.ViewService
     *
     * @description
     * This updates a view or section to include a new element, the new element must be a child
     * of an existing element in the view
     * 
     * @param {string} viewOrSectionId Id of the View or Section to add the element to
     * @param {string} parentElementId Id of the parent element, this element should 
     *      already be in the document
     * @param {string} [workspace=master] workspace to use
     * @param {Object} elementOb the element object to add (for element ref tree this should be an instanceValue)
     * @returns {Promise} The promise would be resolved with updated document object
     */
    var addElementToViewOrSection = function(viewOrSectionId, parentElementId, workspace, elementOb) {

        var deferred = $q.defer();
        var ws = !workspace ? 'master' : workspace;
        ElementService.getElement(viewOrSectionId, false, ws)
        .then(function(data) {  
            var clone = {};
            clone.sysmlid = data.sysmlid;
            //clone.read = data.read;
            clone.specialization = _.cloneDeep(data.specialization);

            var key;
            if (isSection(data)) {
                key = "instanceSpecificationSpecification";
            }
            else {
                if (clone.specialization.contains)
                    delete clone.specialization.contains;
                key = "contents";
            }

           if (!clone.specialization[key]) {
                clone.specialization[key] = {
                    operand: [],
                    type: "Expression"
                };
            }
            clone.specialization[key].operand.push(elementOb);

            // TODO add to parentElement also if needed 
            ElementService.updateElement(clone, ws)
            .then(function(data2) {
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
     * @name mms.ViewService#deleteElementFromViewOrSection
     * @methodOf mms.ViewService
     *
     * @description
     * This deletes the specified instanceVal from the contents of the View or Section
     * 
     * @param {string} viewOrSecId Id of the View or Section to delete the element from
     * @param {string} [workspace=master] workspace to use
     * @param {string} instanceVal to remove from the View or Section
     * @returns {Promise} The promise would be resolved with updated View or Section object
     */
    var deleteElementFromViewOrSection = function(viewOrSecId, workspace, instanceVal) {

        var deferred = $q.defer();

        if (instanceVal) {
            var ws = !workspace ? 'master' : workspace;
            ElementService.getElement(viewOrSecId, false, ws)
            .then(function(data) {  
                var clone = {};
                clone.sysmlid = data.sysmlid;
                //clone.read = data.read;
                clone.specialization = _.cloneDeep(data.specialization);

                var key;
                if (isSection(data)) {
                    key = "instanceSpecificationSpecification";
                }
                else {
                    if (clone.specialization.contains)
                        delete clone.specialization.contains;
                    key = "contents";
                }

                if (clone.specialization[key] && clone.specialization[key].operand) {
                    var operands = data.specialization[key].operand;
                    //var index = operands.indexOf(instanceVal);
                    //if (index >= 0)
                    //    operands.splice(index, 1); 
                    for (var i = 0; i < operands.length; i++) {
                        if (instanceVal.instance === operands[i].instance) {
                            clone.specialization[key].operand.splice(i,1);
                            break; 
                        }
                    }
                }
                
                // Note:  We decided we do not need to delete the instanceVal, just remove from
                //         contents.

                ElementService.updateElement(clone, ws)
                .then(function(data2) {
                    deferred.resolve(data2);
                }, function(reason) {
                    deferred.reject(reason);
                });
            }, function(reason) {
                deferred.reject(reason);
            });
        }
        return deferred.promise;
    };

    /**
     * Creates and adds a opaque presentation element to the passed view or section if addToView is true,
     * otherwise, just creates the opaque element but doesnt add it the
     * view or section
     *
     * @param {object} viewOrSection The View or Section to add to
     * @param {string} [workspace=master] workspace to use
     * @param {string} addToView true if wanting to add the element to the view
     * @param {string} elementType The type of element that is to be created, ie 'Paragraph'
     * @param {string} [site=null] (optional) site to post to
     * @param {string} [name=Untitled <elementType>] (optional) InstanceSpecification name to use
     * @returns {Promise} The promise would be resolved with updated View object if addToView is true
     *                    otherwise the created InstanceSpecification
    */
    var createAndAddElement = function(viewOrSection, workspace, addToView, elementType, site, name) {

        var deferred = $q.defer();
        var defaultName = "Untitled "+elementType;
        var instanceSpecName = name ? name : defaultName;

        addInstanceSpecification(viewOrSection, workspace, elementType, addToView, site, instanceSpecName).
        then(function(data) {
            deferred.resolve(data);
        }, function(reason) {
            deferred.reject(reason);
        });

        return deferred.promise;
    };

    /**
     * Adds a InstanceVal/InstanceSpecification to the contents of the View
     *
     * @param {object} viewOrSection The View or Section to add to
     * @param {string} [workspace=master] workspace to use
     * @param {string} type The type of element that is to be created, ie 'Paragraph'
     * @param {string} addToView true if wanting to add the element to the view
     * @param {string} [site=null] (optional) site to post to
     * @param {string} [name=Untitled <elementType>] (optional) InstanceSpecification name to use
     * @param {string} [json=null] (optional) Json blob for the presentation element
     * @returns {Promise} The promise would be resolved with updated View object if addToView is true
     *                    otherwise the created InstanceSpecification
    */
    var addInstanceSpecification = function(viewOrSection, workspace, type, addToView, site, name, json) {

        var deferred = $q.defer();
        var instanceSpecName = name ? name : "Untitled InstanceSpec";
        var presentationElem = {};
        var splitArray = viewOrSection.qualifiedId.split('/');
        var projectId = null;

        if (splitArray && splitArray.length > 2)
            projectId = splitArray[2];

        var processInstanceSpec = function(createdInstanceSpecUpdate) {

            if (addToView) {
                addInstanceVal(viewOrSection, workspace, createdInstanceSpecUpdate.sysmlid).then(function(updatedView) {
                    if (type === "Section") {
                        // Broadcast message to TreeCtrl:
                        $rootScope.$broadcast('viewctrl.add.section', createdInstanceSpecUpdate, viewOrSection);
                    }
                    deferred.resolve(updatedView);
                }, function(reason) {
                    deferred.reject(reason);
                });
            }
            else {
                deferred.resolve(createdInstanceSpecUpdate);
            }
        };

        var createPresentationElem = function(createdInstanceSpec) {

            // Have it reference the InstanceSpec so we dont need to create extra elements:
            var paragraph = {
                sourceType: "reference",
                source: createdInstanceSpec.sysmlid,
                sourceProperty: "documentation",
                type: "Paragraph"
            };

            var jsonBlob = {};
            if (type === "Paragraph") {
                jsonBlob = paragraph;
            }
            else if (type === "List") {
                jsonBlob = paragraph;
                jsonBlob.type = 'ListT';
            }
            else if (type === "Table") {
                jsonBlob = paragraph;
                jsonBlob.type = 'TableT';
            }
            else if (type === "Figure") {
                jsonBlob = paragraph;
                jsonBlob.type = 'Figure';
            }
            else if (type === "Section") {
                jsonBlob = {
                    operand:[],  
                    type:"Expression"
                };
            }
            else if (type === "Equation") {
                jsonBlob = paragraph;
                jsonBlob.type = 'Equation';
            }

            // Special case for Section.  Doesnt use json blobs.
            if (type === "Section") {
                presentationElem = jsonBlob;  
            }
            else {
                presentationElem = {
                    string:JSON.stringify(jsonBlob),
                    type:"LiteralString"
                };
            }
        };

        if (json) {
            presentationElem.string = JSON.stringify(json);
            presentationElem.type = "LiteralString";
        }
        var realType = type;
        if (type === 'Table')
            realType = 'TableT';
        if (type === 'List')
            realType = 'ListT';
        if (type === 'Paragraph')
            realType = 'ParagraphT';
        if (type === 'Section')
            realType = 'SectionT';
        var instanceSpec = {
            name:instanceSpecName,
            specialization: {
              type:"InstanceSpecification",
              classifier:[typeToClassifierId[realType]],
              instanceSpecificationSpecification: presentationElem
           }
        };

        if (projectId) {
            instanceSpec.owner = projectId;
        }

        ElementService.createElement(instanceSpec, workspace, site).then(function(createdInstanceSpec) {

            // Add in the presentation element:
            if (json) {
                processInstanceSpec(createdInstanceSpec);
            }
            else {
                createPresentationElem(createdInstanceSpec);
                createdInstanceSpec.specialization.instanceSpecificationSpecification = presentationElem;

                ElementService.updateElement(createdInstanceSpec, workspace).then(function(createdInstanceSpecUpdate) {
                    processInstanceSpec(createdInstanceSpecUpdate);
                }, function(reason) {
                    deferred.reject(reason);
                });

            }

        }, function(reason) {
            deferred.reject(reason);
        });

        return deferred.promise;
    };

    /**
     * Adds a InstanceValue to the contents of the View
     *
     * @param {object} viewOrSection The View or Section to add to
     * @param {string} [workspace=master] workspace to use
     * @param {string} instanceSpecId InstanceSpecification sysmlid.  This is the instance
     #                 for the InstanceValue.
     * @returns {Promise} The promise would be resolved with updated View object
    */
    var addInstanceVal = function(viewOrSection, workspace, instanceSpecId) {

        var instanceVal = {
            instance:instanceSpecId,
            type:"InstanceValue"
        };

        return addElementToViewOrSection(viewOrSection.sysmlid, viewOrSection.sysmlid, workspace, instanceVal);
    };

    /**
     * @ngdoc method
     * @name mms.ViewService#createView
     * @methodOf mms.ViewService
     * 
     * @description
     * Create a new view, owner must be specified (parent view), id cannot be specified,
     * if name isn't specified, "Untitled" will be used, a default contents with 
     * paragraph of the view documentation will be used. If a document is specified, 
     * will also add the view to the document, in this case the parent view should 
     * already be in the document. The new view will be added as the last child of the 
     * parent view.
     * 
     * @param {string} ownerId Id of the parent view
     * @param {string} [name=Untitled] name for the view
     * @param {string} [documentId] optional document to add to
     * @param {string} [workspace=master] workspace to use 
     * @param {string} [viewId] optional sysmlid to be used for the view
     * @param {string} [viewDoc] optional documentation to be used for the view
     * @param {string} [site] site to create under
     * @returns {Promise} The promise will be resolved with the new view. 
     */
    var createView = function(ownerId, name, documentId, workspace, viewId, viewDoc, site) {
        var deferred = $q.defer();
        var view = {
            specialization: {type: 'View'},
            owner: ownerId,
            name: !name ? 'Untitled View' : name,
            documentation: '',
        };
        if (viewId) view.sysmlid = viewId;
        if (viewDoc) view.documentation = viewDoc;

        ElementService.createElement(view, workspace, site)
        .then(function(data) {
            data.specialization.allowedElements = [data.sysmlid];
            data.specialization.displayedElements = [data.sysmlid];
            data.specialization.childrenViews = [];

            var jsonBlob = {
                'type': 'Paragraph', 
                'sourceType': 'reference', 
                'source': data.sysmlid, 
                'sourceProperty': 'documentation'
            };
            addInstanceSpecification(data, workspace, "Paragraph", true, null, "View Documentation", jsonBlob)
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

    /**
     * @ngdoc method
     * @name mms.ViewService#createDocument
     * @methodOf mms.ViewService
     * 
     * @description
     * Create a new document,
     * if name isn't specified, "Untitled" will be used, a default contents with 
     * paragraph of the view documentation will be used. 
     * 
     * @param {string} [name=Untitled] name for the Document
     * @param {string} [site] site name
     * @param {string} [workspace=master] workspace to use 
     * @returns {Promise} The promise will be resolved with the new view. 
     */
    var createDocument = function(name, site, workspace) {
        var deferred = $q.defer();
        var doc = {
            specialization: {type: "Product"},
            name: !name ? 'Untitled Document' : name,
            documentation: ''
        };
        ElementService.createElement(doc, workspace, site)
        .then(function(data) {
            data.specialization.allowedElements = [data.sysmlid];
            data.specialization.displayedElements = [data.sysmlid];
            data.specialization.view2view = [
                {
                    id: data.sysmlid,
                    childrenViews: []
                }
            ];

            var jsonBlob = {
                'type': 'Paragraph', 
                'sourceType': 'reference', 
                'source': data.sysmlid, 
                'sourceProperty': 'documentation'
            };
            addInstanceSpecification(data, workspace, "Paragraph", true, site, "View Documentation", jsonBlob)
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
     * @param {string} [version=latest] timestamp
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
     * @param {object} instanceVal instance value object
     * @param {string} [workspace=master] workspace
     * @param {string} [version=latest] timestamp
     * @returns {Promise} The promise will be resolved with a json object for the 
     *                    corresponding presentation element
     */
    var parseExprRefTree = function(instanceVal, workspace, version) {

        var instanceSpecId = instanceVal.instance;
        var deferred = $q.defer();

        // TODO do we need version?
        ElementService.getElement(instanceSpecId, false, workspace, version)
        .then(function(instanceSpec) {

            // InstanceSpecifcations can have instanceSpecificationSpecification 
            // for opaque presentation elements, or slots:

            var instanceSpecSpec = instanceSpec.specialization.instanceSpecificationSpecification;
            var type = instanceSpecSpec.type;

            // If it is a Opaque List, Paragraph, Table, Image, List:
            if (type === 'LiteralString') {
                var jsonString = instanceSpecSpec.string;
                deferred.resolve(JSON.parse(jsonString)); 
            }
            // If it is a Opaque Section, or a Expression:
            else if (type === 'Expression') {
                // If it is a Opaque Section then we want the instanceSpec:
                if (isSection(instanceSpec)) {
                    instanceSpec.type = "Section";
                    deferred.resolve(instanceSpec);
                }
                // Will we ever have an Expression otherwise?
                else {
                    deferred.resolve(instanceSpecSpec);
                }
            }

            // If it is a non-Opaque presentation element:
            if (instanceSpec.slots) {
                // TODO
            }        
        }, function(reason) {
            deferred.reject(reason);
        });

        return deferred.promise;
    };


    var getElementReferenceTree = function (contents, workspace, version) {

        var promises = [];
        angular.forEach(contents.operand, function(instanceVal) {
            promises.push( getElementReference(instanceVal, workspace, version) );
        });
        return $q.all(promises);
    };

    var getElementReference = function (instanceVal, workspace, version) {
        var deferred = $q.defer();

        var elementObject = {};

        elementObject.instance = instanceVal.instance;
        elementObject.instanceVal = instanceVal;
        elementObject.sectionElements = [];

        getInstanceSpecification(instanceVal, workspace, version).then(function(instanceSpecification) {

            elementObject.instanceSpecification = instanceSpecification;

            parseExprRefTree(instanceVal, workspace, version).then(function(presentationElement) {

                elementObject.presentationElement = presentationElement;

                if (presentationElement.type === 'Section') {
                    getElementReferenceTree(presentationElement.specialization.instanceSpecificationSpecification, workspace, version).then(function(sectionElementReferenceTree) {
                        elementObject.sectionElements = sectionElementReferenceTree;
                        deferred.resolve(elementObject);
                    });
                } else
                    deferred.resolve(elementObject);
            });

        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ViewService#getInstanceSpecification
     * @methodOf mms.ViewService
     * 
     * @description
     * Parses a InstanceValue node of the expression reference tree in the contents
     * of a View, and returns the corresponding instance specification
     * 
     * @param {object} instanceVal instance value object
     * @param {string} [workspace=master] workspace
     * @param {string} [version=latest] timestamp
     * @returns {Promise} The promise will be resolved with a json object for the 
     *                    corresponding presentation element
     */
    var getInstanceSpecification = function(instanceVal, workspace, version) {

        var instanceSpecId = instanceVal.instance;
        var deferred = $q.defer();

        ElementService.getElement(instanceSpecId, false, workspace, version)
        .then(function(instanceSpec) {
            deferred.resolve(instanceSpec);
        }, function(reason) {
            deferred.reject(reason);
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
     * @returns {boolean} whether it's a section
     */
    var isSection = function(instanceSpec) {
        return instanceSpec.specialization && instanceSpec.specialization.classifier && 
               instanceSpec.specialization.classifier.length > 0 &&
               (instanceSpec.specialization.classifier[0] === typeToClassifierId.Section ||
                instanceSpec.specialization.classifier[0] === typeToClassifierId.SectionT);
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
        addElementToViewOrSection: addElementToViewOrSection,
        createAndAddElement: createAndAddElement,
        addInstanceVal: addInstanceVal,
        deleteElementFromViewOrSection: deleteElementFromViewOrSection,
        addInstanceSpecification: addInstanceSpecification,
        typeToClassifierId: typeToClassifierId,
        getInstanceSpecification : getInstanceSpecification,
        getElementReferenceTree : getElementReferenceTree
    };

}