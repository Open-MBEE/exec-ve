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
        'allowedElements', 'contents', 'relatedDocuments', 'childViews'];

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

    var cleanValueSpec = function(vs) {
        if (vs.hasOwnProperty('valueExpression'))
            delete vs.valueExpression;
        if (vs.operand) {
            for (var i = 0; i < vs.operand.length; i++)
                cleanValueSpec(vs.operand[i]);
        }
    };
    
    /**
     * @ngdoc method
     * @name mms.UtilsService#cleanElement
     * @methodOf mms.UtilsService
     * 
     * @description
     * Cleans 
     *
     * @param {Object} elem the element object to be cleaned 
     * @param {boolean} [forEdit=false] (optional) forEdit.  If true deletes nonEditKeys from elem.
     * @returns {Object} clean elem
     */
    var cleanElement = function(elem, forEdit) {
        // hack - should fix on MMS, if name is null should include name
        if (! elem.name) {
            elem.name = '';
        }
        var i = 0;
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
            if (elem.specialization.value) {
                for (i = 0; i < elem.specialization.value.length; i++)
                    cleanValueSpec(elem.specialization.value[i]);
            }
            if (elem.specialization.contents) {
                cleanValueSpec(elem.specialization.contents);
            }
            if (elem.specialization.instanceSpecificationSpecification) {
                cleanValueSpec(elem.specialization.instanceSpecificationSpecification);
            }
            if (elem.specialization.type === 'View') {
                //delete elem.specialization.displayedElements;
                //delete elem.specialization.allowedElements;
                if (elem.specialization.contents && elem.specialization.contains)
                    delete elem.specialization.contains;
                if (Array.isArray(elem.specialization.displayedElements)) {
                    elem.specialization.numElements = elem.specialization.displayedElements.length;
                    if (elem.specialization.numElements <= 5000)
                        delete elem.specialization.displayedElements;
                    else
                        elem.specialization.displayedElements = JSON.stringify(elem.specialization.displayedElements);
                }
                if (elem.specialization.allowedElements)
                    delete elem.specialization.allowedElements;
            }
            if (elem.specialization.hasOwnProperty('specialization')) {
                delete elem.specialization.specialization;
            }
            if (forEdit) {
                for (i = 0; i < nonEditKeys.length; i++) {
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
        res.update = !ob.update ? false : ob.update;
        res.ws = !ob.workspace ? 'master' : ob.workspace;
        res.ver = !ob.version ? 'latest' : ob.version;
        res.extended = !ob.extended ? false : true;
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
    /**
     * @ngdoc method
     * @name mms.UtilsService#mergeElement
     * @methodOf mms.UtilsService
     * 
     * @description
     * Make key for element for use in CacheService
     *
     * @param {object} source the element object to merge in 
     * @param {string} eid id of element
     * @param {string} [workspace=master] workspace
     * @param {boolean} [updateEdit=false] updateEdit
     * @param {string} property type of property, ie transclusion or not
     * @returns {void} nothing 
     */

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
    /**
     * @ngdoc method
     * @name mms.UtilsService#filterProperties
     * @methodOf mms.UtilsService
     * 
     * @description
     * given element object a and element object b,
     * returns new object with b data minus keys not in a 
     * (set notation A intersect B)
     *
     * @param {Object} a Element Object
     * @param {Object} b Element Object
     * @returns {Object} new object
     */
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
    /**
     * @ngdoc method
     * @name mms.UtilsService#hasConflict
     * @methodOf mms.UtilsService
     * 
     * @description		
     *  Checks if sever and cache version of the element are
     *  the same so that the user is aware that they are overriding 
     *  changes to the element that they have not seen in the cache element.
     *  Given edit object with only keys that were edited,
     * 'orig' object and 'server' object, should only return true 
     *	if key is in edit object and value in orig object is different 
     *  from value in server object. 
     *
     * @param {Object} elem An object that contains element id and any property changes to be saved.
     * @param {Object} orig version of elem object in cache.
     * @param {Object} server version of elem object from server.
     * @returns {Boolean} true if conflict, false if not
     */

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
        if (table.colwidths && table.colwidths.length > 0) {
            result.push('<colgroup>');
            for (var i = 0; i < table.colwidths.length; i++) {
                if (table.colwidths[i])
                    result.push('<col style="width: ' + table.colwidths[i] + '">');
                else {
                    result.push('<col>');
                }
            }
            result.push('</colgroup>');
        }
        if (table.header) {
            result.push('<thead>');
            result.push(makeTableBody(table.header, true));
            result.push('</thead>');
        }
        result.push('<tbody>');
        result.push(makeTableBody(table.body, false));
        result.push('</tbody>');
        result.push('</table>');
        return result.join('');

    };

    var makeTableBody = function(body, header) {
        var result = [], i, j, k, row, cell, thing;
        var dtag = (header ? 'th' : 'td');
        for (i = 0; i < body.length; i++) {
            result.push('<tr>');
            row = body[i];
            for (j = 0; j < row.length; j++) {
                cell = row[j];
                result.push('<' + dtag + ' colspan="' + cell.colspan + '" rowspan="' + cell.rowspan + '">');
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
                result.push('</' + dtag + '>');
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
        var attr = '';
        if (para.sourceProperty === 'name')
            t = 'name';
        if (para.sourceProperty === 'value')
            t = 'val';
        if (para.nonEditable) {
            attr = ' data-non-editable="' + para.nonEditable + '"';
        }
        return '<mms-transclude-' + t + ' data-mms-eid="' + para.source + '"' + attr + '></mms-transclude-' + t + '>';
    };

    var makeHtmlTOC = function (tree) {
        var result = '<div class="toc"><div class="header">Table of Contents</div>';

        var root_branch = tree[0].branch;

        root_branch.children.forEach(function (child) {
            result += makeHtmlTOCChild(child);
        });

        result += '</div>'; 

        return result;
    };

    var makeHtmlTOCChild = function(child) {
        if (child.type !== 'view' && child.type !== 'section')
            return '';
        var result = '<ul>';

        var anchor = '<a href=#' + child.data.sysmlid + '>';
        result += '  <li>' + anchor + child.section + ' ' + child.label + '</a></li>';

        child.children.forEach(function (child2) {
            result += makeHtmlTOCChild(child2);
        });

        result += '</ul>'; 

        return result;
    };

    var makeTablesAndFiguresTOC = function(tree, printElement, live, html) {
        var ob = {
            tables: '<div class="tot"><div class="header">List of Tables</div><ul>',
            figures: '<div class="tof"><div class="header">List of Figures</div><ul>',
            equations: '<div class="tof"><div class="header">List of Equations</div><ul>',
            tableCount: 0,
            figureCount: 0,
            equationCount: 0
        };
        if (html)
            return ob; //let server handle it for now
        var root_branch = tree[0].branch;
        root_branch.children.forEach(function (child) {
            makeTablesAndFiguresTOCChild(child, printElement, ob, live, false);
        });

        ob.tables += '</ul></div>';
        ob.figures += '</ul></div>';
        ob.equations += '</ul></div>';
        return ob;
    };

    var makeTablesAndFiguresTOCChild = function(child, printElement, ob, live, showRefName) {
        var sysmlid = child.data.sysmlid;
        var el = printElement.find('#' + sysmlid);
        var refs = printElement.find('mms-view-link[data-mms-peid="' + sysmlid + '"]');
        var cap = '';
        if (child.type === 'table') {
            ob.tableCount++;
            cap = ob.tableCount + '. ' + child.data.name;
            ob.tables += '<li><a href="#' + sysmlid + '">' + cap + '</a></li>';
            var cap1 = el.find('table > caption');
            cap1.html('Table ' + cap);//cap.html());
            if (cap1.length === 0) {
                el.find('table').prepend('<caption>Table ' + cap + '</caption>');
            }
            // Change cap value based on showRefName true/false
            if (showRefName) {
                cap = ob.tableCount + '. ' + child.data.name;
            } else cap = ob.tableCount;
            if (live)
                refs.find('a').html('Table ' + cap);
            else
                refs.html('<a href="#' + sysmlid + '">Table ' + cap + '</a>');
        }
        if (child.type === 'figure') {
            ob.figureCount++;
            cap = ob.figureCount + '. ' + child.data.name;
            ob.figures += '<li><a href="#' + sysmlid + '">' + cap + '</a></li>';
            var cap3 = el.find('figure > figcaption');
            cap3.html('Figure ' + cap);
            if (cap3.length === 0) {
                el.find('img').wrap('<figure></figure>').after('<figcaption>Figure ' + cap + '</figcaption>');
            }
            // Change cap value based on showRefName true/false
            if (showRefName) {
                cap = ob.figureCount + '. ' + child.data.name;
            } else cap = ob.figureCount;
            if (live)
                refs.find('a').html('Fig. ' + cap);
            else
                refs.html('<a href="#' + sysmlid + '">Fig. ' + cap + '</a>');
        }
        if (child.type === 'equation') {
            ob.equationCount++;
            cap = ob.equationCount + '. ' + child.data.name;
            ob.equations += '<li><a href="#' + sysmlid + '">' + cap + '</a></li>';
            var equationCap = '(' + ob.equationCount + ')';
            var cap2 = el.find('.mms-equation-caption');
            cap2.html(equationCap);
            if (cap2.length === 0) {
                el.find('mms-view-equation > mms-transclude-doc > p').last().append('<div class="mms-equation-caption pull-right">' + equationCap + '</div>');
            }
            // Change cap value based on showRefName true/false
            if (showRefName) {
                cap = ob.equationCount + '. ' + child.data.name;
            } else cap = ob.equationCount;
            if (live)
                refs.find('a').html('Eq. ' + equationCap);
            else
                refs.html('<a href="#' + sysmlid + '">Eq. ' + equationCap + '</a>');
        }
        child.children.forEach(function(child2) {
            makeTablesAndFiguresTOCChild(child2, printElement, ob, live, showRefName);
        });
    };

    var createMmsId = function() {
        var d = Date.now();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return 'MMS_' + Date.now() + '_' + uuid;
    };

    /*
    header = header slot on doc
    footer = footer slot on doc
    dnum = dnumber slot on doc
    tag = ve tag name if available
    displayTime = tag time or generation time as mm/dd/yy hh:mm am/pm
    */
    var getPrintCss = function(header, footer, dnum, tag, displayTime, landscape, meta) {
        var ret = "img {max-width: 100%; page-break-inside: avoid; page-break-before: auto; page-break-after: auto; display: block; margin-left: auto; margin-right: auto;}\n" + 
                " tr, td, th { page-break-inside: avoid; } thead {display: table-header-group;}\n" + 
                ".pull-right {float: right;}\n" + 
                ".view-title {margin-top: 10pt}\n" +
                ".chapter {page-break-before: always}\n" + 
                "table {width: 100%; border-collapse: collapse;}\n" + 
                "table, th, td {border: 1px solid black; padding: 4px;}\n" +
                "table[border='0'], table[border='0'] th, table[border='0'] td {border: 0px;}\n" +
                "table, th > p, td > p {margin: 0px; padding: 0px;}\n" +
                "table, th > div > p, td > div > p {margin: 0px; padding: 0px;}\n" +
                //"table p {word-break: break-all;}\n" + 
                "th {background-color: #f2f3f2;}\n" + 
                "h1 {font-size: 20px; padding: 0px; margin: 4px;}\n" +
                ".ng-hide {display: none;}\n" +
                "body {font-size: 9pt; font-family: 'Times New Roman', Times, serif; }\n" + 
                "caption, figcaption, .mms-equation-caption {text-align: center; font-weight: bold;}\n" +
                ".mms-equation-caption {float: right;}\n" +
                "mms-view-equation, mms-view-figure, mms-view-image {page-break-inside: avoid;}" + 
                ".toc { counter-reset: table-counter figure-counter;}\n" +
                ".toc, .tof, .tot {page-break-after:always;}\n" +
                ".toc a, .tof a, .tot a { text-decoration:none; color: #000; font-size:9pt; }\n" + 
                ".toc .header, .tof .header, .tot .header { margin-bottom: 4px; font-weight: bold; font-size:24px; }\n" + 
                ".toc ul, .tof ul, .tot ul {list-style-type:none; margin: 0; }\n" +
                ".tof ul, .tot ul {padding-left:0;}\n" +
                ".toc ul {padding-left:2em;}\n" +
                ".toc > ul {padding-left:0;}\n" +
                ".toc li > a[href]::after {content: leader('.') target-counter(attr(href), page);}\n" + 
                ".tot li > a[href]::after {content: leader('.') target-counter(attr(href), page);}\n" + 
                ".tof li > a[href]::after {content: leader('.') target-counter(attr(href), page);}\n" + 
                "figure { counter-increment: figure-counter; }\n" +
                "figcaption::before {content: \"Figure \" counter(figure-counter) \": \"; }\n" +
                "table { counter-increment: table-counter; }\n" +
                "caption::before {content: \"Table \" counter(table-counter) \": \"; }\n" +
                "@page {margin: 0.5in;}\n" + 
                "@page:first {@top {content: ''} @bottom {content: ''} @top-left {content: ''} @top-right {content: ''} @bottom-left {content: ''} @bottom-right {content: ''}}\n";
                //"@page big_table {  size: 8.5in 11in; margin: 0.75in; prince-shrink-to-fit:auto;}\n" +  //size: 11in 8.5in;
                //".big-table {page: big_table; max-width: 1100px; }\n";
        Object.keys(meta).forEach(function(key) {
            var content = '""';
            if (meta[key]) {
                if (meta[key] === 'counter(page)')
                    content = meta[key];
                else
                    content = '"' + meta[key] + '"';
                ret += '@page {@' + key + ' {font-size: 10px; content: ' + content + ';}}\n';
            }
        });
        //ret += "@page { @bottom-right { content: counter(page); }}\n";

        /*if (header && header !== '') {
            ret += '@page { @top { font-size: 10px; content: "' + header + '";}}\n';
        }
        if (footer && footer !== '') {
            ret += '@page { @bottom { font-size: 10px; content: "' + footer + '";}}\n';
        }
        ret += "@page { @bottom-right { content: counter(page); }}\n";
        if (tag && tag !== 'latest' && tag !== '') {
            ret += "@page { @top-right { font-size: 10px; content: '" + tag + "';}}\n";
        } else {
            ret += "@page { @top-right { font-size: 10px; content: '" + displayTime + "';}}\n";
        }*/
        if (landscape)
            ret += "@page {size: 11in 8.5in;}";
                //"@page{prince-shrink-to-fit:auto;size: A4 portrait;margin-left:8mm;margin-right:8mm;}";
        return ret;
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
        makeHtmlTOC: makeHtmlTOC,
        makeTablesAndFiguresTOC: makeTablesAndFiguresTOC,
        createMmsId: createMmsId,
        getPrintCss: getPrintCss
    };
}