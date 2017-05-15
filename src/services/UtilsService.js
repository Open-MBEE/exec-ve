'use strict';

angular.module('mms')
.factory('UtilsService', ['$q', '$http', 'CacheService', 'URLService', '_', UtilsService]);

/**
 * @ngdoc service
 * @name mms.UtilsService
 * @requires _
 * 
 * @description
 * Utilities
 */
function UtilsService($q, $http, CacheService, URLService, _) {
    var VIEW_SID = '_17_0_1_232f03dc_1325612611695_581988_21583';
    var DOCUMENT_SID = '_17_0_2_3_87b0275_1371477871400_792964_43374';
    var nonEditKeys = ['contains', 'view2view', 'childrenViews', '_displayedElementIds',
        '_allowedElements', '_contents', '_relatedDocuments', '_childViews'];
    var CLASS_ELEMENT_TEMPLATE = {
        _appliedStereotypeIds: [],
        appliedStereotypeInstanceId: null,
        classifierBehaviorId: null,
        clientDependencyIds: [],
        collaborationUseIds: [],
        documentation: "",
        elementImportIds: [],
        generalizationIds: [],
        interfaceRealizationIds: [],
        isAbstract: false,
        isActive: false,
        isFinalSpecialization: false,
        isLeaf: false,
        mdExtensionsIds: [],
        name: "",
        nameExpression: null,
        ownedAttributeIds: [],
        ownedOperationIds: [],
        ownerId: null,
        packageImportIds: [],
        powertypeExtentIds: [],
        redefinedClassifierIds: [],
        representationId: null,
        substitutionIds: [],
        supplierDependencyIds: [],
        syncElementId: null,
        templateBindingIds: [],
        templateParameterId: null,
        type: "Class",
        useCaseIds: [],
        visibility: null
    };
    var INSTANCE_ELEMENT_TEMPLATE = {
        ownerId: null,
        name: '',
        documentation: '',
        type: "InstanceSpecification",
        classifierIds: [],
        specification: null,
        _appliedStereotypeIds: [],
        appliedStereotypeInstanceId: null,
        mdExtensionsIds: [],
        syncElementId: null,
        clientDependencyIds: [],
        supplierDependencyIds: [],
        nameExpression: null,
        visibility: "public",
        templateParameterId: null,
        deploymentIds: [],
        slotIds: [],
        stereotypedElementId: null
    };
    var hasCircularReference = function(scope, curId, curType) {
        var curscope = scope;
        while (curscope.$parent) {
            var parent = curscope.$parent;
            if (parent.mmsElementId === curId && parent.cfType === curType)
                return true;
            curscope = parent;
        }
        return false;
    };

    var cleanValueSpec = function(vs) {
        if (vs.hasOwnProperty('valueExpression'))
            delete vs.valueExpression;
        if (vs.operand) {
            for (var i = 0; i < vs.operand.length; i++) {
                cleanValueSpec(vs.operand[i]);
            }
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
        if (!elem.name) {
            elem.name = '';
        }
        var i = 0;
        if (elem.type === 'Property' || elem.type === 'Port') {
            if (!elem.defaultValue) {
                elem.defaultValue = null;
            }
        }
        if (elem.type === 'Slot') {
            if (!_.isArray(elem.value))
                elem.value = [];
        }
        if (elem.value) {
            for (i = 0; i < elem.value.length; i++) {
                cleanValueSpec(elem.value[i]);
            }
        }
        if (elem._contents) {
            cleanValueSpec(elem._contents);
        }
        if (elem.specification) {
            cleanValueSpec(elem.specification);
        }
        if (elem.type === 'Class') {
            if (elem._contents && elem.contains) {
                delete elem.contains;
            }
            if (Array.isArray(elem._displayedElementIds)) {
                elem._displayedElementIds = JSON.stringify(elem._displayedElementIds);
            }
            if (elem._allowedElements) {
                delete elem._allowedElements;
            }
        }
        if (elem.hasOwnProperty('specialization')) {
            delete elem.specialization;
        }
        if (forEdit) {
            for (i = 0; i < nonEditKeys.length; i++) {
                if (elem.hasOwnProperty(nonEditKeys[i])) {
                    delete elem[nonEditKeys[i]];
                }
            }
        }
        return elem;
    };

    var buildTreeHierarchy = function (array, id, type, parent, level2_Func) {
        var rootNodes = [];
        var data2Node = {};
        var i = 0;
        var data = null;
        // make first pass to create all nodes
        for (i = 0; i < array.length; i++) {
            data = array[i];
            data2Node[data[id]] = { 
                label : data.name || data._name, 
                type : type,
                data : data, 
                children : [] 
            };
        }
        // make second pass to associate data to parent nodes
        for (i = 0; i < array.length; i++) {
            data = array[i];
            // If theres an element in data2Node whose key matches the 'parent' value in the array element
            // add the array element to the children array of the matched data2Node element
            if (data[parent] && data2Node[data[parent]]) {//bad data!
                data2Node[data[parent]].children.push(data2Node[data[id]]);
            } else {
            // If theres not an element in data2Node whose key matches the 'parent' value in the array element
            // it's a "root node" and so it should be pushed to the root nodes array along with its children
                rootNodes.push(data2Node[data[id]]);
            }
        }

        //apply level2 function if available
        if (level2_Func) {
            for (i = 0; i < array.length; i++) {
                data = array[i];
                var level1_parentNode = data2Node[data[id]];
                level2_Func(data, level1_parentNode);
            }
        }

        var sortFunction = function(a, b) {
            if (a.children.length > 1) {
                a.children.sort(sortFunction);
            }
            if (b.children.length > 1) {
                b.children.sort(sortFunction);
            }
            if (a.label.toLowerCase() < b.label.toLowerCase()) {
                return -1;
            }
            if (a.label.toLowerCase() > b.label.toLowerCase()) {
                return 1;
            }
            return 0;
        };
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
    var normalize = function(reqOb) {
        reqOb.extended = !reqOb.extended ? false : true;
        reqOb.refId = !reqOb.refId ? 'master' : reqOb.refId;
        reqOb.commitId = !reqOb.commitId ? 'latest' : reqOb.commitId;
        return reqOb;
    };

    /**
     * @ngdoc method
     * @name mms.UtilsService#makeElementKey
     * @methodOf mms.UtilsService
     * 
     * @description
     * Make key for element for use in CacheService
     *
     * @param {string} elementOb element object
     * @param {boolean} [edited=false] element is to be edited
     * @returns {Array} key to be used in CacheService
     */
    var makeElementKey = function(elementOb, edit) {
        var refId = !elementOb._refId ? 'master' : elementOb._refId;
        var commitId = !elementOb._commitId ? 'latest' : elementOb._commitId;
        var key = ['element', elementOb._projectId, refId, elementOb.id, commitId];
        if (edit)
            key.push('edit');
        return key;
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
     * @param {boolean} [updateEdit=false] updateEdit
     * @returns {void} nothing 
     */
    var mergeElement = function(source, updateEdit) {
        //TODO remove calls to this, shoudl use ElementService.cacheElement
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
     * @param {Object} edit An object that contains element id and any property changes to be saved.
     * @param {Object} orig version of elem object in cache.
     * @param {Object} server version of elem object from server.
     * @returns {Boolean} true if conflict, false if not
     */
    var hasConflict = function(edit, orig, server) {
        for (var i in edit) {
            if (i === '_read' || i === '_modified' || i === '_modifier' || 
                    i === '_creator' || i === '_created' || '_commitId') {
                continue;
            }
            if (edit.hasOwnProperty(i) && orig.hasOwnProperty(i) && server.hasOwnProperty(i)) {
                if (!angular.equals(orig[i], server[i])) {
                    return true;
                }
            }
        }
        return false;
    };

    function isRestrictedValue(values) {
        if (values.length > 0 && values[0].type === 'Expression' &&
                values[0].operand.length === 3 && values[0].operand[0].value === 'RestrictedValue' &&
                values[0].operand[2].type === 'Expression' && values[0].operand[2].operand.length > 0 &&
                values[0].operand[1].type === 'ElementValue') {
            return true;
        }
        return false;
    }

    var makeHtmlTable = function(table) {
        var result = ['<table class="table table-bordered table-condensed">'];
        if (table.title) {
            result.push('<caption>' + table.title + '</caption>');
        }
        if (table.colwidths && table.colwidths.length > 0) {
            result.push('<colgroup>');
            for (var i = 0; i < table.colwidths.length; i++) {
                if (table.colwidths[i]) {
                    result.push('<col style="width: ' + table.colwidths[i] + '">');
                } else {
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
                        result.push('<mms-transclude-img mms-element-id="' + thing.id + '"></mms-transclude-img>');
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
                    result.push('<mms-transclude-img mms-element-id="' + thing.id + '"></mms-transclude-img>');
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
        if (para.sourceProperty === 'name') {
            t = 'name';
        }
        if (para.sourceProperty === 'value') {
            t = 'val';
        }
        if (para.nonEditable) {
            attr = ' data-non-editable="' + para.nonEditable + '"';
        }
        return '<mms-transclude-' + t + ' mms-eid="' + para.source + '"' + attr + '></mms-transclude-' + t + '>';
    };

    var makeHtmlTOC = function (tree) {
        var result = '<div class="toc"><div class="header">Table of Contents</div>';
        var root_branch = tree[0].branch;
        var i = 0;
        for (i = 0; i < root_branch.children.length; i++) {
            result += makeHtmlTOCChild(root_branch.children[i]);
        }
        result += '</div>'; 
        return result;
    };

    var makeHtmlTOCChild = function(child) {
        if (child.type !== 'view' && child.type !== 'section')
            return '';
        var result = '<ul>';
        var anchor = '<a href=#' + child.data.id + '>';
        result += '  <li>' + anchor + child.section + ' ' + child.label + '</a></li>';
        var i = 0;
        for (i = 0; i < child.children.length; i++) {
            result += makeHtmlTOCChild(child.children[i]);
        }
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
        if (html) {
            return ob; //let server handle it for now
        }
        var root_branch = tree[0].branch;
        var i = 0;
        for (i = 0; i < root_branch.children.length; i++) {
            makeTablesAndFiguresTOCChild(root_branch.children[i], printElement, ob, live, false);
        }
        ob.tables += '</ul></div>';
        ob.figures += '</ul></div>';
        ob.equations += '</ul></div>';
        return ob;
    };

    var makeTablesAndFiguresTOCChild = function(child, printElement, ob, live, showRefName) {
        var sysmlId = child.data.id;
        var el = printElement.find('#' + sysmlId);
        var refs = printElement.find('mms-view-link[data-mms-pe-id="' + sysmlId + '"]');
        var cap = '';
        if (child.type === 'table') {
            ob.tableCount++;
            cap = ob.tableCount + '. ' + child.data.name;
            ob.tables += '<li><a href="#' + sysmlId + '">' + cap + '</a></li>';
            var cap1 = el.find('table > caption');
            cap1.html('Table ' + cap);//cap.html());
            if (cap1.length === 0) {
                el.find('table').prepend('<caption>Table ' + cap + '</caption>');
            }
            // Change cap value based on showRefName true/false
            if (showRefName) {
                cap = ob.tableCount + '. ' + child.data.name;
            } else {
                cap = ob.tableCount;
            }
            if (live) {
                refs.find('a').html('Table ' + cap);
            } else {
                refs.html('<a href="#' + sysmlId + '">Table ' + cap + '</a>');
            }
        }
        if (child.type === 'figure') {
            ob.figureCount++;
            cap = ob.figureCount + '. ' + child.data.name;
            ob.figures += '<li><a href="#' + sysmlId + '">' + cap + '</a></li>';
            var cap3 = el.find('figure > figcaption');
            cap3.html('Figure ' + cap);
            if (cap3.length === 0) {
                el.find('img').wrap('<figure></figure>').after('<figcaption>Figure ' + cap + '</figcaption>');
            }
            // Change cap value based on showRefName true/false
            if (showRefName) {
                cap = ob.figureCount + '. ' + child.data.name;
            } else {
                cap = ob.figureCount;
            }
            if (live) {
                refs.find('a').html('Fig. ' + cap);
            } else {
                refs.html('<a href="#' + sysmlId + '">Fig. ' + cap + '</a>');
            }
        }
        if (child.type === 'equation') {
            ob.equationCount++;
            cap = ob.equationCount + '. ' + child.data.name;
            ob.equations += '<li><a href="#' + sysmlId + '">' + cap + '</a></li>';
            var equationCap = '(' + ob.equationCount + ')';
            var cap2 = el.find('.mms-equation-caption');
            cap2.html(equationCap);
            if (cap2.length === 0) {
                el.find('mms-view-equation > mms-transclude-doc > p').last().append('<span class="mms-equation-caption pull-right">' + equationCap + '</span>');
            }
            // Change cap value based on showRefName true/false
            if (showRefName) {
                cap = ob.equationCount + '. ' + child.data.name;
            } else {
                cap = ob.equationCount;
            }
            if (live) {
                refs.find('a').html('Eq. ' + equationCap);
            } else {
                refs.html('<a href="#' + sysmlId + '">Eq. ' + equationCap + '</a>');
            }
        }
        for (var i = 0; i < child.children.length; i++) {
            makeTablesAndFiguresTOCChild(child.children[i], printElement, ob, live, showRefName);
        }
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
                "table mms-transclude-doc p {margin: 0 0 5px;}\n" +
                //"table p {word-break: break-all;}\n" + 
                "th {background-color: #f2f3f2;}\n" + 
                "h1 {font-size: 20px; padding: 0px; margin: 4px;}\n" +
                ".ng-hide {display: none;}\n" +
                "body {font-size: 9pt; font-family: 'Times New Roman', Times, serif; }\n" + 
                "caption, figcaption, .mms-equation-caption {text-align: center; font-weight: bold;}\n" +
                ".mms-equation-caption {float: right;}\n" +
                "mms-view-equation, mms-view-figure, mms-view-image {page-break-inside: avoid;}" + 
                ".toc, .tof, .tot {page-break-after:always;}\n" +
                ".toc a, .tof a, .tot a { text-decoration:none; color: #000; font-size:9pt; }\n" + 
                ".toc .header, .tof .header, .tot .header { margin-bottom: 4px; font-weight: bold; font-size:24px; }\n" + 
                ".toc ul, .tof ul, .tot ul {list-style-type:none; margin: 0; }\n" +
                ".tof ul, .tot ul {padding-left:0;}\n" +
                ".toc ul {padding-left:4em;}\n" +
                ".toc > ul {padding-left:0;}\n" +
                ".toc li > a[href]::after {content: leader('.') target-counter(attr(href), page);}\n" + 
                ".tot li > a[href]::after {content: leader('.') target-counter(attr(href), page);}\n" + 
                ".tof li > a[href]::after {content: leader('.') target-counter(attr(href), page);}\n" + 
                "@page {margin: 0.5in;}\n" + 
                "@page:first {@top {content: ''} @bottom {content: ''} @top-left {content: ''} @top-right {content: ''} @bottom-left {content: ''} @bottom-right {content: ''}}\n";
                //"@page big_table {  size: 8.5in 11in; margin: 0.75in; prince-shrink-to-fit:auto;}\n" +  //size: 11in 8.5in;
                //".big-table {page: big_table; max-width: 1100px; }\n";
        Object.keys(meta).forEach(function(key) {
            var content = '""';
            if (meta[key]) {
                if (meta[key] === 'counter(page)') {
                    content = meta[key];
                } else {
                    content = '"' + meta[key] + '"';
                }
                ret += '@page {@' + key + ' {font-size: 10px; content: ' + content + ';}}\n';
            }
        });
        if (landscape) {
            ret += "@page {size: 11in 8.5in;}";
        }
        return ret;
    };

    var isView = function(e) {
        if (e._appliedStereotypeIds && (e._appliedStereotypeIds.indexOf(VIEW_SID) >= 0 || 
                e._appliedStereotypeIds.indexOf(DOCUMENT_SID) >= 0)) {
            return true;
        }
        return false;
    };

    var isDocument = function(e) {
        if (e._appliedStereotypeIds && e._appliedStereotypeIds.indexOf(DOCUMENT_SID) >= 0) {
            return true;
        }
        return false;
    };

    /**
     * @ngdoc method
     * @name mms.UtilsService#convertHtmlToPdf
     * @methodOf mms.UtilsService
     *
     * @description
     * Converts HTML to PDF
     *
     * @param {Object} doc The document object with Id and HTML payload that will be converted to PDF
     * @param {string} site The site name
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} Promise would be resolved with 'ok', the server will send an email to user when done
     */
    var convertHtmlToPdf = function(doc, projectId, refId){ //TODO fix
        var deferred = $q.defer();
        $http.post(URLService.getHtmlToPdfURL(doc.docId, projectId, refId), {'documents': [doc]})
        .success(function(data, status, headers, config){
            deferred.resolve('ok');
        }).error(function(data, status, headers, config){
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.UtilsService#createClassElement
     * @methodOf mms.UtilsService
     * 
     * @description
     * returns a class json object with all emf fields set to default, with
     * fields from passed in object substituted
     * 
     */
    var createClassElement = function(obj) {
        var o = JSON.parse(JSON.stringify(CLASS_ELEMENT_TEMPLATE));
        Object.assign(o, obj);
        return o;
    };

    var createInstanceElement = function(obj) {
        var o = JSON.parse(JSON.stringify(INSTANCE_ELEMENT_TEMPLATE));
        Object.assign(o, obj);
        return o;
    };
    return {
        VIEW_SID: VIEW_SID,
        DOCUMENT_SID: DOCUMENT_SID,
        createClassElement: createClassElement,
        createInstanceElement: createInstanceElement,
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
        getPrintCss: getPrintCss,
        isView: isView,
        isDocument: isDocument,
        convertHtmlToPdf: convertHtmlToPdf
    };
}