'use strict';

angular.module('mms')
.factory('UtilsService', ['_', UtilsService]);

/**
 * @ngdoc service
 * @name mms.UtilsService
 * @requires _
 * 
 * @description
 * Utilities
 */
function UtilsService(_) {
    var nonEditKeys = ['contains', 'view2view', 'childrenViews', 'displayedElements',
        'allowedElements'];

    var hasCircularReference = function(scope, curId, curType) {
        var curscope = scope;
        while (curscope.$parent) {
            var parent = curscope.$parent;
            if (parent.mmsEid === curId && parent.cfType === curType)
                return true;
            curscope = parent;
        }
        return false;
    };

    var cleanElement = function(elem, forEdit) {
        // hack - should fix on MMS, if name is null should include name
        if (! elem.name) {
            elem.name = '';
        }
        if (elem.hasOwnProperty('specialization')) {
            if (elem.specialization.type === 'Property') {
                var spec = elem.specialization;
                if (!_.isArray(spec.value))
                    spec.value = [];
                spec.value.forEach(function(val) {
                    if (val.hasOwnProperty('specialization'))
                        delete val.specialization;
                });
            }
            if (elem.specialization.type === 'View') {
                //delete elem.specialization.displayedElements;
                //delete elem.specialization.allowedElements;
            }
            if (elem.specialization.hasOwnProperty('specialization')) {
                delete elem.specialization.specialization;
            }
            if (forEdit) {
                for (var i = 0; i < nonEditKeys.length; i++) {
                    if (elem.specialization.hasOwnProperty(nonEditKeys[i])) {
                        delete elem.specialization[nonEditKeys[i]];
                    }
                }
            }
        }
        return elem;
    };

    var buildTreeHierarchy = function (array, id, type, parent, level2_Func) {
        var rootNodes = [];
        var data2Node = {};

        // make first pass to create all nodes
        array.forEach(function(data) {
            data2Node[data[id]] = 
            { 
                label : data.name, 
                type : type,
                data : data, 
                children : [] 
            };
        });

        // make second pass to associate data to parent nodes
        array.forEach(function(data) {
            if (data[parent] && data2Node[data[parent]]) //bad data!
                data2Node[data[parent]].children.push(data2Node[data[id]]);
            else
                rootNodes.push(data2Node[data[id]]);
        });

        // apply level 2 objects to tree
        if (level2_Func) {
            array.forEach(function(data) {
                var level1_parentNode = data2Node[data[id]];
                level2_Func(data[id], level1_parentNode);
            });
        }

        var sortFunction = function(a, b) {
            if (a.children.length > 1) a.children.sort(sortFunction);
            if (b.children.length > 1) b.children.sort(sortFunction);
            if(a.label.toLowerCase() < b.label.toLowerCase()) return -1;
            if(a.label.toLowerCase() > b.label.toLowerCase()) return 1;
            return 0;
        };

        // sort root notes
        rootNodes.sort(sortFunction);

        return rootNodes;
    };

    /**
     * @ngdoc method
     * @name mms.UtilsService#normalize
     * @methodOf mms.UtilsService
     * 
     * @description
     * Normalize common arguments
     *
     * @param {Object} ob Object with update, workspace, version keys
     * @returns {Object} object with update, ws, ver keys based on the input.
     *      default values: {update: false, ws: 'master', ver: 'latest'}
     */
    var normalize = function(ob) {
        var res = {};
        res.update = !ob.update? false : ob.update;
        res.ws = !ob.workspace ? 'master' : ob.workspace;
        res.ver = !ob.version ? 'latest' : ob.version;
        return res;
    };

    /**
     * @ngdoc method
     * @name mms.UtilsService#makeElementKey
     * @methodOf mms.UtilsService
     * 
     * @description
     * Make key for element for use in CacheService
     *
     * @param {string} id id of element
     * @param {string} [workspace=master] workspace
     * @param {string} [version=latest] version or timestamp
     * @param {boolean} [edited=false] element is to be edited
     * @returns {Array} key to be used in CacheService
     */
    var makeElementKey = function(id, workspace, version, edited) {
        var ws = !workspace ? 'master' : workspace;
        var ver = !version ? 'latest' : version;
        if (edited)
            return ['elements', ws, id, ver, 'edit'];
        else
            return ['elements', ws, id, ver];
    };

    var makeHtmlTable = function(table) {
        var result = '<table class="table table-bordered table-condensed">';
        if (table.title)
            result += '<caption>' + table.title + '</caption>';
        if (table.header) {
            result += '<thead>';
            result += makeTableBody(table.header);
            result += '</thead>';
        }
        result += '<tbody>';
        result += makeTableBody(table.body);
        result += '</tbody>';
        result += '</table>';
        return result;

    };

    var makeTableBody = function(body) {
        var result = '';
        body.forEach(function(row) {
            result += '<tr>';
            row.forEach(function(cell) {
                result += '<td colspan="' + cell.colspan + '" rowspan="' + cell.rowspan + '">';
                cell.content.forEach(function(thing) {
                    result += '<div>';
                    if (thing.type === 'Paragraph') {
                        result += makeHtmlPara(thing);
                    } else if (thing.type === 'Table') {
                        result += makeHtmlTable(thing);
                    } else if (thing.type === 'List') {
                        result += makeHtmlList(thing);
                    } else if (thing.type === 'Image') {
                        result += '<mms-transclude-img mms-eid="' + thing.sysmlid + '"></mms-transclude-img>';
                    }
                    result += '</div>';
                });
                result += '</td>';
            });
            result += '</tr>';
        });
        return result;
    };

    var makeHtmlList = function(list) {
        var result = '';
        if (list.ordered)
            result += '<ol>';
        else
            result += '<ul>';
        list.list.forEach(function(item) {
            result += '<li>';
            item.forEach(function(thing) {
                result += '<div>';
                if (thing.type === 'Paragraph') {
                    result += makeHtmlPara(thing);
                } else if (thing.type === 'Table') {
                    result += makeHtmlTable(thing);
                } else if (thing.type === 'List') {
                    result += makeHtmlList(thing);
                } else if (thing.type === 'Image') {
                    result += '<mms-transclude-img mms-eid="' + thing.sysmlid + '"></mms-transclude-img>';
                }
                result += '</div>';
            });
            result += '</li>';
        });
        if (list.ordered)
            result += '</ol>';
        else
            result += '</ul>';
        return result;
    };

    var makeHtmlPara = function(para) {
        if (para.sourceType === 'text')
            return para.text;
        var t = 'doc';
        if (para.sourceProperty === 'name')
            t = 'name';
        if (para.sourceProperty === 'value')
            t = 'val';
        return '<mms-transclude-' + t + ' data-mms-eid="' + para.source + '"></mms-transclude-' + t + '>';
    };

    return {
        hasCircularReference: hasCircularReference,
        cleanElement: cleanElement,
        normalize: normalize,
        makeElementKey: makeElementKey,
        buildTreeHierarchy: buildTreeHierarchy,
        makeHtmlTable : makeHtmlTable,
        makeHtmlPara: makeHtmlPara,
        makeHtmlList: makeHtmlList
    };
}