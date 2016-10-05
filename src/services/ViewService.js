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
    var currentView = null;
    var VIEW_ELEMENTS_LIMIT = 2000;
    var inProgress = {}; //only used for view elements over limit

    // The type of opaque element to the sysmlId of the classifierIds:
    var TYPE_TO_CLASSIFIER_ID = {
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

    function getClassifierIds() {
        var re = [];
        Object.keys(TYPE_TO_CLASSIFIER_ID).forEach(function(key) {
            re.push(TYPE_TO_CLASSIFIER_ID[key]);
        });
        return re;
    }

    var TYPE_TO_CLASSIFIER_TYPE = {
        Table: 'TableT',
        Paragraph: 'ParagraphT',
        Section: 'SectionT',
        Comment: 'ParagraphT',
        List: 'ListT',
        Image: 'Figure',
        Equation: 'Equation'
    };

    var classifierIdsIds = getClassifierIds();
    var opaqueClassifiers = [TYPE_TO_CLASSIFIER_ID.Image, TYPE_TO_CLASSIFIER_ID.List, 
        TYPE_TO_CLASSIFIER_ID.Paragraph, TYPE_TO_CLASSIFIER_ID.Section, TYPE_TO_CLASSIFIER_ID.Table];
    
    var processString = function(values) {
        if (!values || values.length === 0 || values[0].type !== 'LiteralString')
            return '';
        return values[0].value;
    };
    var processStrings = function(values) {
        var res = [];
        if (!values || values.length === 0)
            return res;
        values.forEach(function(value) {
            if (value.type !== 'LiteralString' || !value.value)
                return;
            res.push(value.value);
        });
        return res;
    };
    var processPeople = function(values) {
        if (!values || values.length === 0)
            return [];
        var people = [];
        values.forEach(function(value) {
            if (value.type !== 'LiteralString' || !value.value)
                return;
            var p = value.value.split(',');
            if (p.length !== 5)
                return;
            people.push({
                firstname: p[0],
                lastname: p[1],
                title: p[2],
                orgname: p[3],
                orgnum: p[4]
            });
        });
        return people;
    };
    var processRevisions = function(values) {
        if (!values || values.length === 0)
            return [];
        var rev = [];
        values.forEach(function(value) {
            if (value.type !== 'LiteralString' || !value.value)
                return;
            var p = value.value.split('|');
            if (p.length !== 5)
                return;
            rev.push({
                revnum: p[0],
                date: p[1],
                firstname: p[2],
                lastname: p[3],
                remark: p[4]
            });
        });
        return rev;
    };
    var docMetadataTypes = {
        '_17_0_1_407019f_1326234342817_186479_2256': {
            name: 'header',
            process: processString
        },
        '_17_0_1_407019f_1326234349580_411867_2258': {
            name: 'footer',
            process: processString
        },
        '_17_0_2_3_f4a035d_1366647903710_685116_36989': {
            name: 'dnumber',
            process: processString
        },
        '_17_0_2_3_f4a035d_1366647903991_141146_36990': {
            name: 'version',
            process: processString
        },
        '_17_0_2_3_f4a035d_1366647903994_494629_36996': {
            name: 'titlelegal',
            process: processString
        },
        '_17_0_2_3_f4a035d_1366647903994_370992_36997': {
            name: 'footerlegal',
            process: processString
        },
        '_17_0_2_3_f4a035d_1366647903995_652492_37000': {
            name: 'authors',
            process: processPeople
        },
        '_17_0_2_3_f4a035d_1366647903996_970714_37001': {
            name: 'approvers',
            process: processPeople
        },
        '_17_0_2_3_f4a035d_1366647903996_463299_37002': {
            name: 'concurrences',
            process: processPeople
        },
        '_17_0_2_3_f4a035d_1366698987711_498852_36951': {
            name: 'revisions',
            process: processRevisions
        },
        '_17_0_2_3_f4a035d_1366696484320_980107_36953': {
            name: 'project',
            process: processString
        },
        '_17_0_2_3_f4a035d_1366647903995_864529_36998': {
            name: 'emails',
            process: processStrings
        },
        '_17_0_2_3_e9f034d_1375464775176_680884_29346': {
            name: 'instlogo',
            process: processString
        },
        '_17_0_2_3_e9f034d_1375464942934_241960_29357': {
            name: 'inst1',
            process: processString
        },
        '_17_0_2_3_e9f034d_1375464993159_319060_29362': {
            name: 'inst2',
            process: processString
        }
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
     * @param {int} weight the priority of the request
     * @returns {Promise} The promise will be resolved with the view object, 
     *      multiple calls to this method with the same id would result in 
     *      references to the same object.
     */
    var getView = function(id, update, workspace, version, weight, extended) { 
        return ElementService.getElement(id, update, workspace, version, weight, extended);
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
     * @param {int} weight the priority of the request
     * @returns {Promise} The promise will be resolved with an array of view objects, 
     *      multiple calls to this method with the same ids would result in an array of 
     *      references to the same objects.
     */
    var getViews = function(ids, update, workspace, version, weight, extended) {
        return ElementService.getElements(ids, update, workspace, version, weight, extended);
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
     * @param {int} weight the priority of the request
     * @returns {Promise} The promise will be resolved with the document object, 
     *      multiple calls to this method with the same id would result in 
     *      references to the same object.
     */
    var getDocument = function(id, update, workspace, version, weight, extended) {
        return ElementService.getElement(id, update, workspace, version, weight, extended);
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
     * @name mms.ViewService#downgradeDocument
     * @methodOf mms.ViewService
     * 
     * @description
     * Demote document to a view
     * 
     * @param {Object} document A document object
     * @param {string} [workspace=master] (optional) workspace to use
     * @param {string} [site] (optional) site id if present will remove doc from site docs list
     * @returns {Promise} The promise will be resolved with the downgraded view
     */
    var downgradeDocument = function(document, workspace, site) {
        var clone = {
            sysmlId: document.sysmlId,
            _appliedStereotypeIds: ['_17_0_1_232f03dc_1325612611695_581988_21583']
        };
        return ElementService.updateElement(clone, workspace).then(
            function(data) {
                if (site) {
                    var ws = workspace;
                    if (!workspace)
                        ws = 'master';
                    var cacheKey = ['sites', ws, 'latest', site, 'products'];
                    var index = -1;
                    var found = false;
                    var sitedocs = CacheService.get(cacheKey);
                    if (sitedocs) {
                        for (index = 0; index < sitedocs.length; index++) {
                            if (sitedocs[index].sysmlId === document.sysmlId)
                                break;
                        }
                        if (index >= 0)
                            sitedocs.splice(index, 1);
                    }
                }
                return data;
            }, function(reason) {
                return reason;
            });
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
     * @param {int} weight the priority of the request
     * @param {string} eidss displayedElements
     * @returns {Promise} The promise will be resolved with array of element objects. 
     */
    var getViewElements = function(id, update, workspace, version, weight, eidss, extended) {
        var n = normalize(update, workspace, version, extended);
        var deferred = $q.defer();
        var url = URLService.getViewElementsURL(id, n.ws, n.ver, n.extended);
        var cacheKey = ['views', n.ws, id, n.ver, 'elements'];
        if (CacheService.exists(cacheKey) && !n.update)
            deferred.resolve(CacheService.get(cacheKey));
        else {
            var key = id + n.ws + n.ver + n.extended;
            if (inProgress.hasOwnProperty(key))
                return inProgress[key];
            var eids = [];
            if (eidss)
                eids = JSON.parse(eidss);
            if (!eidss || eids.length <= 5000 || n.ver !== 'latest') {
                ElementService.getGenericElements(url, 'elements', n.update, n.ws, n.ver, weight).
                then(function(data) {
                    deferred.resolve(CacheService.put(cacheKey, data, false));
                }, function(reason) {
                    deferred.reject(reason);
                });
            } else { //if view elements too much, split into 2000 for each get
                inProgress[key] = deferred.promise;
                var promises = [];
                var i = 0;
                while (i < eids.length) {
                    var portion = eids.slice(i, i+VIEW_ELEMENTS_LIMIT);
                    promises.push(ElementService.getElements(portion, update, workspace, version, weight, extended));
                    i += VIEW_ELEMENTS_LIMIT;
                }
                $q.all(promises)
                .then(function(datas) {
                    var result = [];
                    for (var i = 0; i < datas.length; i++) {
                        result.push.apply(result, datas[i]);
                    }
                    deferred.resolve(CacheService.put(cacheKey, result, false));
                }, function(reason) {
                    deferred.reject(reason);
                }).finally(function() {
                    delete inProgress[key];
                });
            }
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
     * @param {int} weight the priority of the request
     * @returns {Promise} The promise will be resolved with array of view objects. 
     */
    var getDocumentViews = function(id, update, workspace, version, simple, weight, extended) {
        var n = normalize(update, workspace, version, extended);
        var s = !simple ? false : simple; 
        var deferred = $q.defer();
        var url = URLService.getDocumentViewsURL(id, n.ws, n.ver, s, n.extended);
        var cacheKey = ['products', n.ws, id, n.ver, 'views'];
        if (CacheService.exists(cacheKey) && !n.update) 
            deferred.resolve(CacheService.get(cacheKey));
        else {
            ElementService.getGenericElements(url, 'views', n.update, n.ws, n.ver, weight).
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
     * @name mms.ViewService#addViewToParentView
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
     * @param {string} aggr Aggregation can be COMPOSITE, NONE, or SHARED
     * @param {string} [workspace=master] workspace to use
     * @param {Object} [viewOb=null] if present, adds to document views cache array
     * @returns {Promise} The promise would be resolved with updated document object
     */
    var addViewToParentView = function(viewId, documentId, parentViewId, aggr, workspace, viewOb) {
        var deferred = $q.defer();
        var ws = !workspace ? 'master' : workspace;
        var docViewsCacheKey = ['products', ws, documentId, 'latest', 'views'];
        getView(parentViewId, false, ws, null, 2)
        .then(function(data) {  
            var clone = {
                sysmlId: data.sysmlId,
                _read: data._read,
                _modified: data._modified,
                childViews: [],
                type: data.type
            };
            if (data.childViews)
                clone.childViews = _.cloneDeep(data.childViews);
            clone.childViews.push({id: viewId, aggregation: aggr});
            updateView(clone, ws)
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
        ElementService.getElement(viewOrSectionId, false, ws, null, 2)
        .then(function(data) {  
            var clone = {
                sysmlId: data.sysmlId,
                _read: data._read,
                _modified: data._modified,
                type: data.type
            };
            var key;
            if (isSection(data)) {
                key = "specification";
            }
            else {
                key = "_contents";
            }
            clone[key] = _.cloneDeep(data[key]);
            if (!clone[key]) {
                clone[key] = {
                    operand: [],
                    type: "Expression",
                };
            }
            clone[key].operand.push(elementOb);

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
            ElementService.getElement(viewOrSecId, false, ws, null, 2)
            .then(function(data) {  
                var clone = {
                    sysmlId: data.sysmlId,
                    _read: data._read,
                    _modified: data._modified,
                    type: data.type
                };
                var key;
                if (isSection(data)) {
                    key = "specification";
                }
                else {
                    key = "_contents";
                }
                clone[key] = _.cloneDeep(data[key]);
                if (clone[key] && clone[key].operand) {
                    var operands = data[key].operand;
                    for (var i = 0; i < operands.length; i++) {
                        if (instanceVal.instanceId === operands[i].instanceId) {
                            clone[key].operand.splice(i,1);
                            break; 
                        }
                    }
                }
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
     * @ngdoc method
     * @name mms.ViewService#deleteViewFromParentView
     * @methodOf mms.ViewService
     *
     * @description
     * This deletes the specified view from the parent view
     * 
     * @param {string} viewId Id of the View to remove from parent
     * @param {string} parentViewId Id of the parent view
     * @param {string} [workspace=master] workspace to use
     * @returns {Promise} The promise would be resolved with updated parent View object
     */
    var deleteViewFromParentView = function(viewId, parentViewId, workspace) {
        var deferred = $q.defer();
        var ws = !workspace ? 'master' : workspace;
        ElementService.getElement(parentViewId, false, ws, null, 2)
        .then(function(data) {  
            if (data.childViews) {
                var clone = {
                    sysmlId: data.sysmlId,
                    _read: data._read,
                    _modified: data._modified,
                    childViews: [],
                    type: data.type
                };
                data.childViews.forEach(function(child) {
                    if (child.id !== viewId)
                        clone.childViews.push(child);
                });
                updateView(clone, ws)
                .then(function(data2) {
                    deferred.resolve(data2);
                }, function(reason) {
                    deferred.reject(reason);
                });
            } else {
                deferred.resolve(data);
            }
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
     * @param {string} [site=null] (optional) site to post to
     * @param {string} [name=Untitled <elementType>] (optional) InstanceSpecification name to use
     * @returns {Promise} The promise would be resolved with updated View object if addToView is true
     *                    otherwise the created InstanceSpecification
    */
    var createInstanceSpecification = function(viewOrSection, workspace, type, site, name) {
        var deferred = $q.defer();

        var newInstanceId = UtilsService.createMmsId();
        newInstanceId = '_hidden_' + newInstanceId + "_pei";

      ElementService.getIdInfo(viewOrSection, site, workspace, 'latest', 2)
      .then(function(ids) {
        var holdingBinId = ids.holdingBinId;
        var projectId = ids.projectId;
        var siteId = ids.siteId;
        var realType = TYPE_TO_CLASSIFIER_TYPE[type];
        if (!holdingBinId && siteId)
            holdingBinId = 'holding_bin_' + siteId + '_no_project';
        var jsonType = realType;
        if (type === 'Comment' || type === 'Paragraph')
            jsonType = type;
        var instanceSpecSpec = {
            'type': jsonType, 
            'sourceType': 'reference', 
            'source': newInstanceId, 
            'sourceProperty': 'documentation'
        };
        var instanceSpec = {
            sysmlId: newInstanceId,
            name: name ? name : "Untitled " + type,
            documentation: '',
            type: "InstanceSpecification",
            classifierIds: [TYPE_TO_CLASSIFIER_ID[realType]],
            specification: {
                value: JSON.stringify(instanceSpecSpec),
                type: "LiteralString"
            },
            _appliedStereotypeIds: [],
            isMetatype: false
        };
        if (type === 'Section')
            instanceSpec.specification = {
                operand: [],  
                type: "Expression"
            };
        if (holdingBinId)
            instanceSpec.ownerId = holdingBinId;

        var toCreate = [instanceSpec];
        ElementService.createElements(toCreate, workspace, siteId)
        .then(function(data) {
            data.forEach(function(elem) {
                if (elem.sysmlId === newInstanceId) {
                    var instanceVal = {
                        instanceId: newInstanceId,
                        type: "InstanceValue",
                        //valueExpression: null
                    };
                    addElementToViewOrSection(viewOrSection.sysmlId, viewOrSection.sysmlId, workspace, instanceVal)
                    .then(function(data3) {
                        if (type === "Section") {
                        // Broadcast message to TreeCtrl:
                           $rootScope.$broadcast('viewctrl.add.section', elem, viewOrSection);
                        }
                        deferred.resolve(elem);
                    }, function(reason) {
                        deferred.reject(reason);
                    });
                }
            });
        }, function(reason) {
            deferred.reject(reason);
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
     * if name isn't specified, "Untitled" will be used, a default contents with 
     * paragraph of the view documentation will be used. If a document is specified, 
     * will also add the view to the document, in this case the parent view should 
     * already be in the document. The new view will be added as the last child of the 
     * parent view.
     * 
     * @param {object} owner owner of the parent view
     * @param {string} [name=Untitled] name for the view
     * @param {string} [documentId] optional document to add to
     * @param {string} [workspace=master] workspace to use 
     * @param {string} [viewId] optional sysmlId to be used for the view
     * @param {string} [viewDoc] optional documentation to be used for the view
     * @param {string} [site] site to create under
     * @param {boolean} [isDoc] create Product
     * @returns {Promise} The promise will be resolved with the new view. 
     */
    var createView = function(owner, name, documentId, workspace, viewId, viewDoc, site, isDoc) {
        var deferred = $q.defer();
        var newViewId = viewId ? viewId : UtilsService.createMmsId();
        var newInstanceId = '_hidden_' + UtilsService.createMmsId() + '_pei';
      ElementService.getIdInfo(owner, site, workspace, 'latest', 2)
      .then(function(ids) {
        var holdingBinId = ids.holdingBinId;
        var projectId = ids.projectId;
        var siteId = ids.siteId;

        var view = {
            sysmlId: newViewId,
            type: 'Class',
            _allowedElements: [],
            _displayedElements: [newViewId],
            _childViews: [],
            _contents: {
                //valueExpression: null,
                operand: [{
                    instanceId: newInstanceId,
                    type:"InstanceValue",
                }],
                type: 'Expression'
            },
            name: !name ? 'Untitled View' : name,
            documentation: viewDoc ? viewDoc : '',
            _appliedStereotypeIds: [
                (isDoc ? "_17_0_2_3_87b0275_1371477871400_792964_43374" : "_17_0_1_232f03dc_1325612611695_581988_21583")
            ]
        };
        var parentView = null;
        if (owner) {
            view.ownerId = owner.sysmlId;
            parentView = {
                sysmlId: owner.sysmlId,
                _modified: owner._modified,
                _read: owner._read,
                childViews: [],
            };
                if (owner.type)
                    parentView.type = owner.type;
                if (owner.childViews)
                    parentView.childViews = _.cloneDeep(owner.childViews);
                parentView.childViews.push({id: newViewId, aggregation: "composite"});
        }

        var instanceSpecDoc = '<p>&nbsp;</p><p><mms-transclude-doc data-mms-eid="' + newViewId + '">[cf:' + view.name + '.doc]</mms-transclude-doc></p><p>&nbsp;</p>';
        var instanceSpecSpec = {
            'type': 'Paragraph', 
            'sourceType': 'reference', 
            'source': newInstanceId, 
            'sourceProperty': 'documentation'
        };
        var instanceSpec = {
            sysmlId: newInstanceId,
            name: "View Documentation",
            documentation: instanceSpecDoc,
            type:"InstanceSpecification",
            classifierIds:[TYPE_TO_CLASSIFIER_ID.ParagraphT],
            specification: {
                value: JSON.stringify(instanceSpecSpec),
                type: "LiteralString"
            },
            _appliedStereotypeIds: [],
            isMetatype: false
        };
        if (holdingBinId)
            instanceSpec.ownerId = holdingBinId;
        var asi = { //create applied stereotype instance
            sysmlId: newViewId + '_asi',
            ownerId: newViewId,
            documentation: '',
            name: '',
            type: 'InstanceSpecification',
            classifierIds: [(isDoc ? "_17_0_2_3_87b0275_1371477871400_792964_43374" : "_17_0_1_232f03dc_1325612611695_581988_21583")],
            _appliedStereotypeIds: [],
            isMetatype: false
        };
        var toCreate = [instanceSpec, view, asi];
        if (parentView)
            toCreate.push(parentView);
        ElementService.createElements(toCreate, workspace, siteId)
        .then(function(data) {
            data.forEach(function(elem) {
                if (elem.sysmlId === newViewId) {
                    /*if (documentId) {
                        addViewToParentView(newViewId, documentId, owner.sysmlId, 'COMPOSITE', workspace, elem)
                        .then(function(data3) {
                            deferred.resolve(elem);
                        }, function(reason) {
                            deferred.reject(reason);
                        });
                    } else {*/
                        deferred.resolve(elem);
                    //}
                }
            });
        }, function(reason) {
            deferred.reject(reason);
        });
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
        createView(null, name, null, workspace, null, null, site, true)
            .then(function(data2) {
                var ws = !workspace ? 'master' : workspace;
                var cacheKey = ['sites', ws, 'latest', site, 'products'];
                if (CacheService.exists(cacheKey))
                    CacheService.get(cacheKey).push(data2);
                deferred.resolve(data2);
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
     * @param {int} weight the priority of the request
     * @returns {Promise} The promise will be resolved with array of document objects 
     */
    var getSiteDocuments = function(site, update, workspace, version, weight, extended) {
        var n = normalize(update, workspace, version, extended);
        var deferred = $q.defer();
        var url = URLService.getSiteProductsURL(site, n.ws, n.ver, n.extended);
        var cacheKey = ['sites', n.ws, n.ver, site, 'products'];
        if (CacheService.exists(cacheKey) && !n.update) 
            deferred.resolve(CacheService.get(cacheKey));
        else {
            ElementService.getGenericElements(url, 'products', n.update, n.ws, n.ver, weight).
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
     * @param {int} weight the priority of the request
     * @returns {Promise} The promise will be resolved with a json object for the 
     *                    corresponding presentation element
     */
    var parseExprRefTree = function(instanceVal, workspace, version, weight) {

        var instanceSpecId = instanceVal.instanceId;
        var deferred = $q.defer();

        // TODO do we need version?
        ElementService.getElement(instanceSpecId, false, workspace, version, weight)
        .then(function(instanceSpec) {

            // InstanceSpecifcations can have specification 
            // for opaque presentation elements, or slots:

            var instanceSpecSpec = instanceSpec.specification;
            if (!instanceSpecSpec) {
                deferred.reject({status: 500, message: 'missing specification'});
                return;
            }
            var type = instanceSpecSpec.type;

            // If it is a Opaque List, Paragraph, Table, Image, List:
            if (type === 'LiteralString') {
                var jsonString = instanceSpecSpec.value;
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

    /**
     * @ngdoc method
     * @name mms.ViewService#getElementReferenceTree
     * @methodOf mms.ViewService
     * 
     * @description
     * gets the presentation element tree as an array of tree nodes
     * a tree node is this:
     * <pre>
        {
            instance: id of the instance,
            instanceVal: instanceValue object,
            sectionElements: array of child tree nodes,
            instanceSpecification: instance specification object of the instance,
            presentationElement: json of the presentation element or a section instance spec with type = Section
        }
     * </pre>
     * 
     * @param {object} contents an expression object from a view or section
     * @param {string} [workspace=master] workspace
     * @param {string} [version=latest] timestamp
     * @param {int} weight the priority of the request
     * @returns {Promise} The promise will be resolved with array of tree node objects
     */
    var getElementReferenceTree = function (contents, workspace, version, weight) {
        var promises = [];
        angular.forEach(contents.operand, function(instanceVal) {
            promises.push( getElementReference(instanceVal, workspace, version, weight) );
        });
        return $q.all(promises);
    };

    var getElementReference = function (instanceVal, workspace, version, weight) {
        var deferred = $q.defer();

        var elementObject = {};

        elementObject.instance = instanceVal.instanceId;
        elementObject.instanceVal = instanceVal;
        elementObject.sectionElements = [];

        getInstanceSpecification(instanceVal, workspace, version, weight)
        .then(function(instanceSpecification) {
            elementObject.instanceSpecification = instanceSpecification;
            if (instanceSpecification.classifierIds &&
                    instanceSpecification.classifierIds.length > 0 && 
                    opaqueClassifiers.indexOf(instanceSpecification.classifierIds[0]) >= 0)
                elementObject.isOpaque = true;
            else
                elementObject.isOpaque = false;
            parseExprRefTree(instanceVal, workspace, version, weight)
            .then(function(presentationElement) {
                elementObject.presentationElement = presentationElement;
                if (presentationElement.type === 'Section') {
                    getElementReferenceTree(presentationElement.specification, workspace, version)
                    .then(function(sectionElementReferenceTree) {
                        elementObject.sectionElements = sectionElementReferenceTree;
                        deferred.resolve(elementObject);
                    }, function(reason) {
                        deferred.reject(reason);
                    });
                } else
                    deferred.resolve(elementObject);
            }, function(reason) {
                deferred.reject(reason); //this should never happen
            });
        }, function(reason) {
            deferred.reject(reason);
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
     * @param {int} weight the priority of the request
     * @returns {Promise} The promise will be resolved with a json object for the 
     *                    corresponding presentation element
     */
    var getInstanceSpecification = function(instanceVal, workspace, version, weight) {

        var instanceSpecId = instanceVal.instanceId;
        var deferred = $q.defer();

        ElementService.getElement(instanceSpecId, false, workspace, version, weight)
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
        return instanceSpec.classifierIds && 
               instanceSpec.classifierIds.length > 0 &&
               (instanceSpec.classifierIds[0] === TYPE_TO_CLASSIFIER_ID.Section ||
                instanceSpec.classifierIds[0] === TYPE_TO_CLASSIFIER_ID.SectionT);
    };

    var isTable = function(instanceSpec) {
        return instanceSpec.classifierIds && 
               instanceSpec.classifierIds.length > 0 &&
               (instanceSpec.classifierIds[0] === TYPE_TO_CLASSIFIER_ID.Table ||
                instanceSpec.classifierIds[0] === TYPE_TO_CLASSIFIER_ID.TableT);
    };

    var isFigure = function(instanceSpec) {
        return instanceSpec.classifierIds && 
               instanceSpec.classifierIds.length > 0 &&
               (instanceSpec.classifierIds[0] === TYPE_TO_CLASSIFIER_ID.Figure ||
                instanceSpec.classifierIds[0] === TYPE_TO_CLASSIFIER_ID.Image);
    };

    var isEquation = function(instanceSpec) {
        return instanceSpec.classifierIds && 
               instanceSpec.classifierIds.length > 0 &&
               instanceSpec.classifierIds[0] === TYPE_TO_CLASSIFIER_ID.Equation;
    };

    var getTreeType = function(instanceSpec) {
        if (isSection(instanceSpec))
            return 'section';
        if (isTable(instanceSpec))
            return 'table';
        if (isFigure(instanceSpec))
            return 'figure';
        if (isEquation(instanceSpec))
            return 'equation';
        return null;
    };

    //TODO remove
    var setCurrentViewId = function(id) {
        currentViewId = id;
    };

    var setCurrentView = function(v) {
        currentView = v;
    };

    var setCurrentDocumentId = function(id) {
        currentDocumentId = id;
    };

    var getCurrentViewId = function() {
        return currentViewId;
    };

    var getCurrentView = function() {
        return currentView;
    };

    var getCurrentDocumentId = function() {
        return currentDocumentId;
    };

    var normalize = function(update, workspace, version, extended) {
        return UtilsService.normalize({update: update, workspace: workspace, version: version, extended: extended});
    };

    var getDocMetadata = function(docid, ws, version, weight) {
        var deferred = $q.defer();
        var metadata = {};
        //ElementService.search(docid, ['id'], null, null, null, null, ws, weight)
        ElementService.getOwnedElements(docid, false, ws, version, 2, weight)
        .then(function(data) {
            if (data.length === 0) {
                return;
            }
            data.forEach(function(prop) {
                var feature = prop.definingFeatureId ? prop.definingFeatureId : null;
                var value = prop.value ? prop.value : null;
                if (!feature || !docMetadataTypes[feature] || !value || value.length === 0)
                    return;
                metadata[docMetadataTypes[feature].name] = docMetadataTypes[feature].process(value);
            });
        }, function(reason) {
        }).finally(function() {
            deferred.resolve(metadata);
        });
        return deferred.promise;
    };

    var isPresentationElement = function(e) {
        if (e.type === 'InstanceSpecification') {
            var classifierIdss = e.classifierIds;
            if (classifierIdss.length > 0 && classifierIdsIds.indexOf(classifierIdss[0]) >= 0)
                return true;
        }
        return false;
    };

    var reset = function() {
        inProgress = {};
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
        downgradeDocument: downgradeDocument,
        addViewToParentView: addViewToParentView,
        getDocumentViews: getDocumentViews,
        getSiteDocuments: getSiteDocuments,
        setCurrentViewId: setCurrentViewId,
        setCurrentView: setCurrentView,
        setCurrentDocumentId: setCurrentDocumentId,
        getCurrentViewId: getCurrentViewId,
        getCurrentView: getCurrentView,
        getCurrentDocumentId: getCurrentDocumentId,
        parseExprRefTree: parseExprRefTree,
        isSection: isSection,
        isFigure: isFigure,
        isTable: isTable,
        isEquation: isEquation,
        getTreeType: getTreeType,
        isPresentationElement: isPresentationElement,
        addElementToViewOrSection: addElementToViewOrSection,
        //createAndAddElement: createAndAddElement,
        //addInstanceVal: addInstanceVal,
        deleteElementFromViewOrSection: deleteElementFromViewOrSection,
        deleteViewFromParentView: deleteViewFromParentView,
        createInstanceSpecification: createInstanceSpecification,
        TYPE_TO_CLASSIFIER_ID: TYPE_TO_CLASSIFIER_ID,
        getInstanceSpecification : getInstanceSpecification,
        getElementReferenceTree : getElementReferenceTree,
        getDocMetadata: getDocMetadata,

        reset: reset
    };

}