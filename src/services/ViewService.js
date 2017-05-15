'use strict';

angular.module('mms')
.factory('ViewService', ['$q', '$http', '$rootScope','URLService', 'ElementService', 'UtilsService', 'CacheService', ViewService]);

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
function ViewService($q, $http, $rootScope, URLService, ElementService, UtilsService, CacheService) {
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
     * @name mms.ViewService#downgradeDocument
     * @methodOf mms.ViewService
     * 
     * @description
     * Demote document to a view
     * 
     * @param {Object} elementOb A document object
     * @returns {Promise} The promise will be resolved with the downgraded view
     */
    var downgradeDocument = function(elementOb) { //TODO fix this to update the aplied stereotype instance
        var clone = JSON.parse(JSON.stringify(elementOb));
        clone._appliedStereotypeIds = ['_17_0_1_232f03dc_1325612611695_581988_21583'];
        return ElementService.updateElement(clone)
            .then(function(data) {
                var cacheKey = ['documents', elementOb._projectId, elementOb._refId];
                var index = -1;
                var found = false;
                var projectDocs = CacheService.get(cacheKey);
                if (projectDocs) {
                    for (var i = 0; i < projectDocs.length; i++) {
                        if (projectDocs[i].id === elementOb.id) {
                            index = i;
                            break;
                        }
                    }
                    if (index >= 0) {
                        projectDocs.splice(index, 1);
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
     * @param {object} reqOb see description at ElementService.getElement, where elementId is id of the view
     * @param {integer} weight the priority of the request
     * @param {boolean} [update=false] (optional) whether to always get the latest 
     *      from server, even if it's already in cache (this will update everywhere
     *      it's displayed, except for the editables)
     * @returns {Promise} The promise will be resolved with array of element objects. 
     */
    var getViewElements = function(reqOb, weight, update) {
        UtilsService.normalize(reqOb);
        var deferred = $q.defer();
        var key = 'viewElements' + reqOb.projectId + reqOb.refId + reqOb.elementId + reqOb.commitId;
        if (inProgress[key]) {
            return inProgress[key];
        }
        var requestCacheKey = ['elements', reqOb.projectId, reqOb.refId, reqOb.elementId, reqOb.commitId];
        var cached = CacheService.get(requestCacheKey);
        if (cached && !update) {
            deferred.resolve(cached);
            return deferred.promise;
        }
        inProgress[key] = deferred.promise;
        ElementService.getElement(reqOb, weight, update)
        .then(function(view) {
            var toGet = [];
            var results = [];
            if (view._displayedElementIds) {
                var displayed = JSON.parse(view._displayedElementIds);
                if (angular.isArray(displayed) && displayed.length > 0) {
                    toGet = displayed;
                }
            }
            reqOb.elementIds = toGet;
            ElementService.getElements(reqOb, weight, update)
            .then(function(data) {
                results = data;
            }, function(reason) {
            }).finally(function() {
                CacheService.put(requestCacheKey, results);
                deferred.resolve(results);
                delete inProgress[key];
            });
        }, function(reason) {
            deferred.reject(reason);
            delete inProgress[key];
        });
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
     * @param {object} reqOb see ElementService.getElement
     * @param {integer} [weight=1] the priority of the request
     * @param {boolean} [update=false] whether to always get the latest 
     *      from server
     * @returns {Promise} The promise will be resolved with array of view objects. 
     */
    var getDocumentViews = function(reqOb, weight, update) {
        UtilsService.normalize(reqOb);
        var deferred = $q.defer();
        var url = URLService.getDocumentViewsURL(reqOb);
        var cacheKey = ['views', reqOb.projectId, reqOb.refId, reqOb.elementId];
        if (CacheService.exists(cacheKey) && !update) {
            deferred.resolve(CacheService.get(cacheKey));
        } else {
            ElementService.getGenericElements(url, reqOb, 'views', weight, update).
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
     * @param {object} reqOb see Element.getElement for description, use parentViewId 
     *                  and viewId instead of elementId, add 'aggr' key
     * @returns {Promise} The promise would be resolved with updated parent view object
     */
    var addViewToParentView = function(reqOb) {
        UtilsService.normalize(reqOb);
        var deferred = $q.defer();
        ElementService.getElement({
            projectId: reqOb.projectId,
            refId: reqOb.refId,
            elementId: reqOb.parentViewId
        }, 2).then(function(data) {  
            var clone = {
                _projectId: data._projectId,
                _refId: data._refId,
                _modified: data._modified,
                _read: data._read,
                id: data.id
            };
            if (data._childViews) {
                clone._childViews = JSON.parse(JSON.stringify(data._childViews));
            } else {
                clone._childViews = [];
            }
            clone._childViews.push({id: reqOb.viewId, aggregation: reqOb.aggr});
            ElementService.updateElement(clone, true)
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
     * @name mms.ViewService#removeViewFromParentView
     * @methodOf mms.ViewService
     *
     * @description
     * This removes the specified view from the parent view
     * 
     * @param {object} reqOb see ElementService.getElement, use viewId and parentViewId
     * @returns {Promise} The promise would be resolved with updated parent View object
     */
    var removeViewFromParentView = function(reqOb) {
        UtilsService.normalize(reqOb);
        var deferred = $q.defer();
        ElementService.getElement({
            projectId: reqOb.projectId,
            refId: reqOb.refId,
            elementId: reqOb.parentViewId
        }, 2).then(function(data) {  
            if (data._childViews) {
                var clone = {
                    _projectId: data._projectId,
                    _refId: data._refId,
                    _modified: data._modified,
                    _read: data._read,
                    id: data.id,
                    _childViews: JSON.parse(JSON.stringify(data._childViews))
                };
                for (var i = 0; i < clone._childViews.length; i++) {
                    if (clone._childViews[i].id === reqOb.viewId) {
                        clone._childViews.splice(i,1);
                        break; 
                    }
                }
                ElementService.updateElement(clone, true)
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
     * @ngdoc method
     * @name mms.ViewService#addElementToViewOrSection
     * @methodOf mms.ViewService
     *
     * @description
     * This updates a view or section to include a new element, the new element must be a child
     * of an existing element in the view
     * 
     * @param {object} reqOb see ElementService.getElement for description, elementId is the view
     *                          or section instance element id
     * @param {object} elementOb the element object to add (this should be an instanceValue)
     * @returns {Promise} The promise would be resolved with updated view or section object
     */
    var addElementToViewOrSection = function(reqOb, elementOb) {
        UtilsService.normalize(reqOb);
        var deferred = $q.defer();
        ElementService.getElement(reqOb, 2)
        .then(function(data) {  
            var clone = {
                _projectId: data._projectId,
                _refId: data._refId,
                _modified: data._modified,
                _read: data._read,
                id: data.id,
            };
            var key = '_contents';
            if (isSection(data)) {
                key = "specification";
            }
            if (data[key]) {
                clone[key] = JSON.parse(JSON.stringify(data[key]));
            } else {
                clone[key] = {
                    operand: [],
                    type: "Expression",
                };
            }
            clone[key].operand.push(elementOb);
            ElementService.updateElement(clone)
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
     * @name mms.ViewService#removeElementFromViewOrSection
     * @methodOf mms.ViewService
     *
     * @description
     * This removes the specified instanceVal from the contents of the View or Section
     * 
     * @param {object} reqOb see ElementService.getElement for description
     * @param {object} instanceVal to remove from the View or Section
     * @returns {Promise} The promise would be resolved with updated View or Section object
     */
    var removeElementFromViewOrSection = function(reqOb, instanceVal) {
        UtilsService.normalize(reqOb);
        var deferred = $q.defer();

        if (instanceVal) {
            ElementService.getElement(reqOb, 2)
            .then(function(data) {  
                var clone = {
                    _projectId: data._projectId,
                    _refId: data._refId,
                    _modified: data._modified,
                    _read: data._read,
                    id: data.id,
                };
                var key = '_contents';
                if (isSection(data)) {
                    key = "specification";
                }
                if (data[key]) {
                    clone[key] = JSON.parse(JSON.stringify(data[key]));
                } else {
                    clone[key] = {
                        operand: [],
                        type: "Expression",
                    };
                }
                if (clone[key] && clone[key].operand) {
                    var operands = data[key].operand;
                    for (var i = 0; i < operands.length; i++) {
                        if (instanceVal.instanceId === operands[i].instanceId) {
                            clone[key].operand.splice(i,1);
                            break; 
                        }
                    }
                }
                ElementService.updateElement(clone)
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
     * Adds a InstanceVal/InstanceSpecification to the contents of the View
     *
     * @param {object} viewOrSection The View or Section element object to add to
     * @param {string} type The type of element that is to be created, ie 'Paragraph'
     * @param {string} [name=Untitled <elementType>] (optional) InstanceSpecification name to use
     * @param {number} addPeIndex the index of where to add view or section (instance spec) object
     * @returns {Promise} The promise would be resolved with updated View object if addToView is true
     *                    otherwise the created InstanceSpecification
    */
    var createInstanceSpecification = function(viewOrSectionOb, type, name) {
        var deferred = $q.defer();

        var newInstanceId = UtilsService.createMmsId();
        newInstanceId = '_hidden_' + newInstanceId + "_pei";

        var realType = TYPE_TO_CLASSIFIER_TYPE[type];
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
            id: newInstanceId,
            ownerId: 'view_instances_bin_' + viewOrSectionOb._projectId,
            name: name ? name : "Untitled " + type,
            documentation: '',
            type: "InstanceSpecification",
            classifierIds: [TYPE_TO_CLASSIFIER_ID[realType]],
            specification: {
                value: JSON.stringify(instanceSpecSpec),
                type: "LiteralString"
            },
            _appliedStereotypeIds: [],
        };
        instanceSpec = UtilsService.createInstanceElement(instanceSpec);
        if (type === 'Section') {
            instanceSpec.specification = {
                operand: [],  
                type: "Expression"
            };
        }
        var clone = {
            _projectId: viewOrSectionOb._projectId,
            id: viewOrSectionOb.id,
            _refId: viewOrSectionOb._refId,
        };
        var key = '_contents';
        if (isSection(viewOrSectionOb)) {
            key = "specification";
        }
        if (!viewOrSectionOb[key]) {
            clone[key] = {
                operand: [],
                type: "Expression"
            };
        } else {
            clone[key] = JSON.parse(JSON.stringify(viewOrSectionOb[key]));
        }
        clone[key].operand.push({instanceId: newInstanceId, type: "InstanceValue"});
        var toCreate = [instanceSpec, clone];
        var reqOb = {
            projectId: viewOrSectionOb._projectId,
            refId: viewOrSectionOb._refId,
            elements: toCreate,
        };
        ElementService.createElements(reqOb)
        .then(function(data) {
            for (var i = 0; i < data.length; i++) {
                var elem = data[i];
                if (elem.id === newInstanceId) {
                    if (type === "Section") {
                        $rootScope.$broadcast('viewctrl.add.section', elem, viewOrSectionOb);
                    }
                    deferred.resolve(elem);
                    return;
                }
            }
        }, function(reason) {
            deferred.reject(reason);
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
     * @param {object} ownerOb should contain _project and _ref, can be a parent view with _childViews
     * @param {object} viewOb can specify optional viewId, viewName, viewDoc to be used when
     *                          creating the new view, boolean isDoc indicate whether it's a document
     * @returns {Promise} The promise will be resolved with the new view. 
     */
    var createView = function(ownerOb, viewOb) {
        var deferred = $q.defer();

        var newViewId = viewOb.viewId ? viewOb.viewId : UtilsService.createMmsId();
        var newInstanceId = '_hidden_' + UtilsService.createMmsId() + '_pei';

        var view = {
            id: newViewId,
            type: 'Class',
            ownerId: ownerOb.id,
            _allowedElements: [],
            _displayedElementIds: [newViewId],
            _childViews: [],
            _contents: {
                operand: [{
                    instanceId: newInstanceId,
                    type:"InstanceValue",
                }],
                type: 'Expression'
            },
            name: viewOb.viewName ? viewOb.viewName : 'Untitled View',
            documentation: viewOb.viewDoc ? viewOb.viewDoc : '',
            _appliedStereotypeIds: [
                (viewOb.isDoc ? "_17_0_2_3_87b0275_1371477871400_792964_43374" : "_17_0_1_232f03dc_1325612611695_581988_21583")
            ],
            appliedStereotypeInstanceId: newViewId + '_asi'
        };
        view = UtilsService.createClassElement(view);
        var parentView = null;
        if (ownerOb && (ownerOb._childViews || UtilsService.isView(ownerOb))) {
            parentView = {
                _projectId: ownerOb._projectId,
                _refId: ownerOb._refId,
                id: ownerOb.id
            };
            if (!ownerOb._childViews) {
                parentView._childViews = [];
            } else {
                parentView._childViews = JSON.parse(JSON.stringify(ownerOb._childViews));
            }
            parentView._childViews.push({id: newViewId, aggregation: "composite"});
        }
        var instanceSpecDoc = '';
        var instanceSpecSpec = {
            'type': 'Paragraph', 
            'sourceType': 'reference', 
            'source': newInstanceId, 
            'sourceProperty': 'documentation'
        };
        var instanceSpec = {
            id: newInstanceId,
            ownerId: 'view_instances_bin_' + ownerOb._projectId,
            name: "View Documentation",
            documentation: instanceSpecDoc,
            type: "InstanceSpecification",
            classifierIds:[TYPE_TO_CLASSIFIER_ID.ParagraphT],
            specification: {
                value: JSON.stringify(instanceSpecSpec),
                type: "LiteralString"
            },
            _appliedStereotypeIds: [],
        };
        instanceSpec = UtilsService.createInstanceElement(instanceSpec);
        var asi = { //create applied stereotype instance
            id: newViewId + '_asi',
            ownerId: newViewId,
            documentation: '',
            name: '',
            type: 'InstanceSpecification',
            classifierIds: [(viewOb.isDoc ? "_17_0_2_3_87b0275_1371477871400_792964_43374" : "_17_0_1_232f03dc_1325612611695_581988_21583")],
            _appliedStereotypeIds: [],
            stereotypedElementId: newViewId
        };
        asi = UtilsService.createInstanceElement(asi);
        var toCreate = [instanceSpec, view, asi];
        if (parentView)
            toCreate.push(parentView);
        var reqOb = {
            projectId: ownerOb._projectId,
            refId: ownerOb._refId,
            elements: toCreate,
            returnChildViews: true
        };
        ElementService.createElements(reqOb)
        .then(function(data) {
            data.forEach(function(elem) {
                if (elem.id === newViewId) {
                    deferred.resolve(elem);
                }
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
     * @param {object} ownerOb see createView
     * @param {object} docOb see createView
     * @returns {Promise} The promise will be resolved with the new view. 
     */
    var createDocument = function(ownerOb, docOb) {
        var deferred = $q.defer();
        docOb.isDoc = true;
        createView(ownerOb, docOb)
            .then(function(data2) {
                var cacheKey = ['documents', ownerOb._projectId, ownerOb._refId];
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
    var getProjectDocuments = function(reqOb, weight, update) {
        UtilsService.normalize(reqOb);
        var deferred = $q.defer();
        var url = URLService.getProjectDocumentsURL(reqOb);
        var cacheKey = ['documents', reqOb.projectId, reqOb.refId];
        if (CacheService.exists(cacheKey) && !update) {
            deferred.resolve(CacheService.get(cacheKey));
        } else {
            ElementService.getGenericElements(url, reqOb, 'documents', weight, update).
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
     * @name mms.ViewService#getPresentationElementSpec
     * @methodOf mms.ViewService
     * 
     * @description
     * Parses an instanceSpec of the expression reference tree in the contents
     * of a View, and returns the corresponding presentation element json object.
     * 
     * @param {object} instanceSpec instance specification object
     * @returns {object} The json object for the corresponding presentation element
     */
    var getPresentationElementSpec = function(instanceSpec) {
        var instanceSpecSpec = instanceSpec.specification;
        if (!instanceSpecSpec) {
            return {status: 500, message: 'missing specification'};
        }
        var type = instanceSpecSpec.type;

        if (type === 'LiteralString') { // If it is a Opaque List, Paragraph, Table, Image, List:
            var jsonString = instanceSpecSpec.value;
            return JSON.parse(jsonString); 
        } else if (type === 'Expression') { // If it is a Opaque Section, or a Expression:
            // If it is a Opaque Section then we want the instanceSpec:
            if (isSection(instanceSpec)) {
                return instanceSpec;
            } else { //??
                return instanceSpecSpec;
            }
        }
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
            instanceId: id of the instance,
            instanceVal: instanceValue object,
            sectionElements: array of child tree nodes,
            instanceSpecification: instance specification object of the instance,
            presentationElement: json of the presentation element or a section instance spec with type = Section
        }
     * </pre>
     *
     * @param {object} reqOb see ElementService.getElement
     * @param {object} contents an expression object from a view or section
     * @param {int} weight the priority of the request
     * @returns {Promise} The promise will be resolved with array of tree node objects
     */
    var getElementReferenceTree = function(reqOb, contents, weight) {
        var promises = [];
        for (var i = 0; i < contents.operand.length; i++) {
            promises.push(getElementReference(reqOb, contents.operand[i], weight));
        }
        return $q.all(promises);
    };

    var getElementReference = function(reqOb, instanceVal, weight) {
        var deferred = $q.defer();

        var elementObject = {};

        elementObject.instanceId = instanceVal.instanceId;
        elementObject.instanceVal = instanceVal;
        elementObject.sectionElements = [];

        var req = JSON.parse(JSON.stringify(reqOb));
        req.elementId = instanceVal.instanceId;
        ElementService.getElement(req, weight)
        .then(function(instanceSpecification) {
            elementObject.instanceSpecification = instanceSpecification;
            if (instanceSpecification.classifierIds &&
                    instanceSpecification.classifierIds.length > 0 && 
                    opaqueClassifiers.indexOf(instanceSpecification.classifierIds[0]) >= 0) {
                elementObject.isOpaque = true;
            } else {
                elementObject.isOpaque = false;
            }
            var presentationElement = getPresentationElementSpec(instanceSpecification);
            elementObject.presentationElement = presentationElement;
            if (isSection(presentationElement)) {
                getElementReferenceTree(req, presentationElement.specification)
                .then(function(sectionElementReferenceTree) {
                    elementObject.sectionElements = sectionElementReferenceTree;
                    deferred.resolve(elementObject);
                }, function(reason) {
                    deferred.reject(reason);
                });
            } else
                deferred.resolve(elementObject);
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

    /**
     * @ngdoc method
     * @name mms.ViewService#getDocMetadata
     * @methodOf mms.ViewService
     * 
     * @description
     * gets Document properties from docgen's stereotypes
     *
     * @param {object} reqOb see ElementService.getElement
     * @param {integer} weight the priority of the request
     * @returns {Promise} The promise will be resolved with metadata object
     *                      with name value pairs corresponding to document stereotype
     */
    var getDocMetadata = function(reqOb, weight) {
        var deferred = $q.defer();
        var metadata = {};
        reqOb.depth = 2;
        //ElementService.search(docid, ['id'], null, null, null, null, ws, weight)
        ElementService.getOwnedElements(reqOb, weight)
        .then(function(data) {
            if (data.length === 0) {
                return;
            }
            for (var i = 0; i < data.length; i++) {
                var prop = data[i];
                var feature = prop.definingFeatureId ? prop.definingFeatureId : null;
                var value = prop.value ? prop.value : null;
                if (!feature || !docMetadataTypes[feature] || !value || value.length === 0) {
                    continue;
                }
                metadata[docMetadataTypes[feature].name] = docMetadataTypes[feature].process(value);
            }
        }, function(reason) {
        }).finally(function() {
            deferred.resolve(metadata);
        });
        return deferred.promise;
    };

    var isPresentationElement = function(e) {
        if (e.type === 'InstanceSpecification') {
            var classifierIdss = e.classifierIds;
            if (classifierIdss.length > 0 && classifierIdsIds.indexOf(classifierIdss[0]) >= 0) {
                return true;
            }
        }
        return false;
    };

    var reset = function() {
        inProgress = {};
    };
    
    return {
        getViewElements: getViewElements,
        createView: createView,
        createDocument: createDocument,
        downgradeDocument: downgradeDocument,
        addViewToParentView: addViewToParentView,
        getDocumentViews: getDocumentViews,
        getProjectDocuments: getProjectDocuments,
        getPresentationElementSpec: getPresentationElementSpec,
        isSection: isSection,
        isFigure: isFigure,
        isTable: isTable,
        isEquation: isEquation,
        getTreeType: getTreeType,
        isPresentationElement: isPresentationElement,
        addElementToViewOrSection: addElementToViewOrSection,
        removeElementFromViewOrSection: removeElementFromViewOrSection,
        removeViewFromParentView: removeViewFromParentView,
        createInstanceSpecification: createInstanceSpecification,
        TYPE_TO_CLASSIFIER_ID: TYPE_TO_CLASSIFIER_ID,
        getElementReferenceTree : getElementReferenceTree,
        getDocMetadata: getDocMetadata,
        reset: reset
    };

}