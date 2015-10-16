'use strict';

angular.module('mms')
.factory('UtilsService', ['CacheService', '_', UtilsService]);

/**
 * @ngdoc service
 * @name mms.UtilsService
 * @requires _
 * 
 * @description
 * Utilities
 */
function UtilsService(CacheService, _) {
    var nonEditKeys = ['contains', 'view2view', 'childrenViews', 'displayedElements',
        'allowedElements', 'contents'];

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
                if (elem.specialization.contents && elem.specialization.contains)
                    delete elem.specialization.contains;
                if (elem.specialization.displayedElements)
                    delete elem.specialization.displayedElements;
                if (elem.specialization.allowedElements)
                    delete elem.specialization.allowedElements;
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
            // If theres an element in data2Node whose key matches the 'parent' value in the array element
            // add the array element to the children array of the matched data2Node element
            if (data[parent] && data2Node[data[parent]]) //bad data!
                data2Node[data[parent]].children.push(data2Node[data[id]]);
            // If theres not an element in data2Node whose key matches the 'parent' value in the array element
            // it's a "root node" and so it should be pushed to the root nodes array along with its children
            else
                rootNodes.push(data2Node[data[id]]);
        });
        
        // Recursive function which sets the level of all nodes passed
        var determineLevelOfNodes = function(nodes, initialLevel)
        {
	        nodes.forEach(function(node)
	        {
		        node.level = initialLevel;
		        if(node.children && node.children.length > 0)
		        {
			        determineLevelOfNodes(node.children, initialLevel + 1);
		        }
	        });
        };
        
        determineLevelOfNodes(rootNodes, 1);

        // Get documents and apply them to the tree structure
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

    var mergeElement = function(source, eid, workspace, updateEdit, property) {
        var ws = workspace ? workspace : 'master';
        var key = makeElementKey(eid, ws, 'latest', false);
        var keyEdit = makeElementKey(eid, ws, 'latest', true);
        var clean = cleanElement(source);
        CacheService.put(key, clean, true);
        var edit = CacheService.get(keyEdit);
        if (updateEdit && edit) {
            edit.read = clean.read;
            edit.modified = clean.modified;
            if (property === 'all')
                CacheService.put(keyEdit, clean, true);
            else if (property === 'name')
                edit.name = clean.name;
            else if (property === 'documentation')
                edit.documentation = clean.documentation;
            else if (property === 'value') {
                _.merge(edit.specialization, clean.specialization, function(a,b,id) {
                    if ((id === 'contents' || id === 'contains') && a)
                        return a; //handle contains and contents updates manually at higher level
                    if (angular.isArray(a) && angular.isArray(b) && b.length < a.length) {
                        return b; 
                    }
                    return undefined;
                });
            }
            cleanElement(edit, true);
        }
    };

    var filterProperties = function(a, b) {
        var res = {};
        for (var key in a) {
            if (a.hasOwnProperty(key) && b.hasOwnProperty(key)) {
                if (key === 'specialization')
                    res.specialization = filterProperties(a.specialization, b.specialization);
                else
                    res[key] = b[key];
            }
        }
        return res;
    };

    var hasConflict = function(edit, orig, server) {
        for (var i in edit) {
            if (i === 'read' || i === 'modified' || i === 'modifier' || 
                    i === 'creator' || i === 'created')
                continue;
            if (edit.hasOwnProperty(i) && orig.hasOwnProperty(i) && server.hasOwnProperty(i)) {
                if (i === 'specialization') {
                    if (hasConflict(edit[i], orig[i], server[i]))
                        return true;
                } else {
                    if (!angular.equals(orig[i], server[i]))
                        return true;
                }
            }
        }
        return false;
    };

    function isRestrictedValue(values) {
        if (values.length > 0 && values[0].type === 'Expression' &&
            values[0].operand.length === 3 && values[0].operand[0].string === 'RestrictedValue' &&
            values[0].operand[2].type === 'Expression' && values[0].operand[2].operand.length > 0 &&
            values[0].operand[1].type === 'ElementValue')
                    return true;
        return false;
    }

    var makeHtmlTable = function(table) {
        var result = ['<table class="table table-bordered table-condensed">'];
        if (table.title)
            result.push('<caption>' + table.title + '</caption>');
        if (table.header) {
            result.push('<thead>');
            result.push(makeTableBody(table.header));
            result.push('</thead>');
        }
        result.push('<tbody>');
        result.push(makeTableBody(table.body));
        result.push('</tbody>');
        result.push('</table>');
        return result.join('');

    };

    var makeTableBody = function(body) {
        var result = [], i, j, k, row, cell, thing;
        for (i = 0; i < body.length; i++) {
            result.push('<tr>');
            row = body[i];
            for (j = 0; j < row.length; j++) {
                cell = row[j];
                result.push('<td colspan="' + cell.colspan + '" rowspan="' + cell.rowspan + '">');
                for (k = 0; k < cell.content.length; k++) {
                    thing = cell.content[k];
                    result.push('<div>');
                    if (thing.type === 'Paragraph') {
                        result.push(makeHtmlPara(thing));
                    } else if (thing.type === 'Table') {
                        result.push(makeHtmlTable(thing));
                    } else if (thing.type === 'List') {
                        result.push(makeHtmlList(thing));
                    } else if (thing.type === 'Image') {
                        result.push('<mms-transclude-img mms-eid="' + thing.sysmlid + '"></mms-transclude-img>');
                    }
                    result.push('</div>');
                }
                result.push('</td>');
            }
            result.push('</tr>');
        }
        return result.join('');
    };

    var makeHtmlList = function(list) {
        var result = [], i, j, item, thing;
        if (list.ordered)
            result.push('<ol>');
        else
            result.push('<ul>');
        for (i = 0; i < list.list.length; i++) {
            item = list.list[i];
            result.push('<li>');
            for (j = 0; j < item.length; j++) {
                thing = item[j];
                result.push('<div>');
                if (thing.type === 'Paragraph') {
                    result.push(makeHtmlPara(thing));
                } else if (thing.type === 'Table') {
                    result.push(makeHtmlTable(thing));
                } else if (thing.type === 'List') {
                    result.push(makeHtmlList(thing));
                } else if (thing.type === 'Image') {
                    result.push('<mms-transclude-img mms-eid="' + thing.sysmlid + '"></mms-transclude-img>');
                }
                result.push('</div>');
            }
            result.push('</li>');
        }
        if (list.ordered)
            result.push('</ol>');
        else
            result.push('</ul>');
        return result.join('');
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

    var makeHtmlTOC = function (tree) {
        var result = '<div style="page-break-after:always">';

        var root_branch = tree[0].branch;

        result += '<ul style="list-style-type:none">';

        var anchor = '<a href=#' + root_branch.data.sysmlid + '>';
        result += '  <li>' + anchor + root_branch.section + ' ' + root_branch.label + '</a></li>';

        root_branch.children.forEach(function (child) {
            result += makeHtmlTOCChild(child);
        });

        result += '</ul>'; 
        result += '</div>'; 

        return result;
    };

    var makeHtmlTOCChild = function(child) {

        var result = '<ul style="list-style-type:none">';

        var anchor = '<a href=#' + child.data.sysmlid + '>';
        result += '  <li>' + anchor + child.section + ' ' + child.label + '</a></li>';

        child.children.forEach(function (child2) {
            result += makeHtmlTOCChild(child2);
        });

        result += '</ul>'; 

        return result;
    };

    return {
        hasCircularReference: hasCircularReference,
        cleanElement: cleanElement,
        normalize: normalize,
        makeElementKey: makeElementKey,
        buildTreeHierarchy: buildTreeHierarchy,
        filterProperties: filterProperties,
        mergeElement: mergeElement,
        hasConflict: hasConflict,
        isRestrictedValue: isRestrictedValue,
        makeHtmlTable : makeHtmlTable,
        makeHtmlPara: makeHtmlPara,
        makeHtmlList: makeHtmlList,
        makeHtmlTOC: makeHtmlTOC
    };
}