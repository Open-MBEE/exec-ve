import angular from 'angular'
import _ from 'lodash'

import { ITransclusion } from '@ve-components/transclusions'
import { CacheService, URLService } from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import { ApplicationService } from '@ve-utils/services'
import { Class } from '@ve-utils/utils'

import { veUtils } from '@ve-utils'

import { ElementObject, ElementsRequest } from '@ve-types/mms'
import { TreeBranch } from '@ve-types/tree'

/**
 * @ngdoc service
 * @name veUtils/UtilsService
 * @requires $q
 * @requires $http
 * @requires CacheService
 * @requires URLService
 * @requires ApplicationService
 * @requires _
 *
 * @description
 * Utilities
 */
export class UtilsService {
    private editKeys = [
        'name',
        'documentation',
        'defaultValue',
        'value',
        'specification',
        'id',
        '_projectId',
        '_refId',
        'type',
    ]
    public PROJECT_URL_PREFIX = 'index.html#/projects/'

    private schema = 'cameo'

    static $inject = [
        '$q',
        '$http',
        'growl',
        'CacheService',
        'URLService',
        'ApplicationService',
        'SchemaService',
    ]

    constructor(
        private $q: angular.IQService,
        private $http: angular.IHttpService,
        private growl: angular.growl.IGrowlService,
        private cacheSvc: CacheService,
        private uRLSvc: URLService,
        private applicationSvc: ApplicationService,
        private schemaSvc: SchemaService
    ) {}

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#cleanValueSpec
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Cleans value specification
     *
     * @param {Object} vs value spec object
     * @returns {void} nothing
     */
    cleanValueSpec(vs: ElementObject) {
        if (vs.hasOwnProperty('valueExpression')) delete vs.valueExpression
        if (vs.operand) {
            for (let i = 0; i < vs.operand.length; i++) {
                this.cleanValueSpec(vs.operand[i])
            }
        }
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#cleanElement
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Cleans
     *
     * @param {ElementObject} elem the element object to be cleaned
     * @param {boolean} [forEdit=false] (optional) forEdit.
     * @returns {ElementObject} clean elem
     */
    public cleanElement(elem: ElementObject, forEdit?: boolean): ElementObject {
        const i = 0
        if (elem.type === 'Property' || elem.type === 'Port') {
            if (!elem.defaultValue) {
                elem.defaultValue = null
            }
        }
        if (elem.type === 'Slot') {
            if (!_.isArray(elem.value)) elem.value = []
        }
        if (elem.value) {
            for (let i = 0; i < elem.value.length; i++) {
                this.cleanValueSpec(elem.value[i])
            }
        }
        if (elem._contents) {
            this.cleanValueSpec(elem._contents)
        }
        if (elem.specification) {
            this.cleanValueSpec(elem.specification)
        }
        if (elem.type === 'Class') {
            if (elem._contents && elem.contains) {
                delete elem.contains
            }
            if (Array.isArray(elem._displayedElementIds)) {
                elem._displayedElementIds = JSON.stringify(
                    elem._displayedElementIds
                )
            }
            if (elem._allowedElementIds) {
                delete elem._allowedElementIds
            }
        }

        if (elem.hasOwnProperty('specialization')) {
            delete elem.specialization
        }
        if (forEdit) {
            //only keep editable or needed keys in edit object instead of everything
            const keys = Object.keys(elem)
            for (const keyIndex in keys) {
                if (this.editKeys.indexOf(keys[keyIndex]) >= 0) {
                    continue
                }
                delete elem[keys[keyIndex]]
            }
        }
        return elem
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#normalize
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Normalize common arguments
     *
     * @param {Object} ob Object with update, workspace, version keys
     * @returns {Object} object with update, ws, ver keys based on the input.
     *      default values: {update: false, ws: 'master', ver: 'latest'}
     */
    public normalize(reqOb) {
        reqOb.extended = !reqOb.extended ? false : true
        reqOb.refId = !reqOb.refId ? 'master' : reqOb.refId
        reqOb.commitId = !reqOb.commitId ? 'latest' : reqOb.commitId
        return reqOb
    }

    /**
     * @name veUtils/UtilsService#makeElementRequestObject
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Make a single element request object out of an ElementObject
     *
     * @param {ElementObject} elementOb
     * @returns {ElementsRequest}
     */
    public makeElementRequestObject(elementOb: ElementObject): ElementsRequest {
        return {
            elementId: elementOb.id,
            projectId: elementOb._projectId,
            refId: elementOb._refId,
            commitId: elementOb._commitId,
        }
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#makeElementKey
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Make key for element for use in CacheService
     *
     * @param {ElementsRequest} refOb request object
     * @param {boolean} [edit=false] element is to be edited
     * @returns {Array} key to be used in CacheService
     */
    public makeElementKey(refOb: ElementsRequest, edit?): string[] {
        const elementId = Array.isArray(refOb.elementId)
            ? refOb.elementId[0]
            : refOb.elementId
        const refId = !refOb.refId ? 'master' : refOb.refId
        const commitId = !refOb.commitId ? 'latest' : refOb.commitId
        const key = ['element', refOb.projectId, refId, elementId, commitId]
        if (edit) key.push('edit')
        return key
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#makeArtifactKey
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Make key for element for use in CacheService
     *
     * @param {string} elementOb element object
     * @param {boolean} [edited=false] element is to be edited
     * @returns {Array} key to be used in CacheService
     */
    public makeArtifactKey(elementOb, edit) {
        const refId = !elementOb._refId ? 'master' : elementOb._refId
        const commitId = !elementOb._commitId ? 'latest' : elementOb._commitId
        const key = [
            'artifact',
            elementOb._projectId,
            refId,
            elementOb.id,
            commitId,
        ]
        if (edit) key.push('edit')
        return key
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#mergeElement
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Make key for element for use in CacheService
     *
     * @param {object} source the element object to merge in
     * @param {boolean} [updateEdit=false] updateEdit
     * @returns {void} nothing
     */
    public mergeElement(source, updateEdit) {
        //TODO remove calls to this, should use this.elementSvc.cacheElement
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#filterProperties
     * @methodOf veUtils/UtilsService
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
    public filterProperties(a, b) {
        const res = {}
        for (const key in a) {
            if (a.hasOwnProperty(key) && b.hasOwnProperty(key)) {
                res[key] = b[key]
            }
        }
        return res
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#hasConflict
     * @methodOf veUtils/UtilsService
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
    public hasConflict(edit, orig, server) {
        for (const i in edit) {
            if (
                i === '_read' ||
                i === '_modified' ||
                i === '_modifier' ||
                i === '_creator' ||
                i === '_created' ||
                i === '_commitId'
            ) {
                continue
            }
            if (
                edit.hasOwnProperty(i) &&
                orig.hasOwnProperty(i) &&
                server.hasOwnProperty(i)
            ) {
                if (!angular.equals(orig[i], server[i])) {
                    return true
                }
            }
        }
        return false
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#isRestrictedValue
     * @methodOf veUtils/UtilsService
     *
     * @description
     * deprecated
     *
     * @param {string} table table content
     * @returns {boolean} boolean
     */
    public isRestrictedValue(values) {
        if (
            values.length > 0 &&
            values[0].type === 'Expression' &&
            values[0].operand.length === 3 &&
            values[0].operand[0].value === 'RestrictedValue' &&
            values[0].operand[2].type === 'Expression' &&
            values[0].operand[2].operand.length > 0 &&
            values[0].operand[1].type === 'ElementValue'
        ) {
            return true
        }
        return false
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#makeHtmlTOCChild
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Generates table of contents for the document/views.
     *
     * @param {TreeBranch} rootBranch the root element (document or view) of the main tree
     * @returns {string} toc string
     */
    public makeHtmlTOC(rootBranch: TreeBranch) {
        let result =
            '<div class="toc"><h1 class="header">Table of Contents</h1>'
        result += this.makeHtmlTOCChild(rootBranch, true)
        result += '</div>'
        return result
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#makeHtmlTOCChild
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Generates table of contents for the document/views.
     *
     * @param {string} branch the branch to be referenced in the table of content
     * @param {boolean} skip skip adding li for this branch
     * @returns {string} toc string
     */
    public makeHtmlTOCChild(branch: TreeBranch, skip?) {
        let result = ''
        let child
        if (!skip) {
            const anchor = '<a href=#' + branch.data.id + '>'
            result +=
                '  <li>' +
                anchor +
                branch.data._veNumber +
                ' ' +
                branch.data.name +
                '</a>'
        }
        let ulAdded = false
        for (let i = 0; i < branch.children.length; i++) {
            child = branch.children[i]
            if (child.type !== 'view' && child.type !== 'section') {
                continue
            }
            if (!ulAdded) {
                result += '<ul>'
                ulAdded = true
            }
            result += this.makeHtmlTOCChild(child)
        }
        if (ulAdded) {
            result += '</ul>'
        }
        if (!skip) {
            result += '</li>'
        }
        return result
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#makeTablesAndFiguresTOC
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Generates a list of tables, figures, and equations. Default uses presentation elements.
     * `html` param provides option to use html content to generate list. It also appends the
     * captions to the figures and tables.
     *
     * @param {TreeBranch} rootBranch the root of the document/view to be printed (what is on the left pane)
     * @param {string} printElement contents to be printed (what is displayed in the center pane)
     * @param {boolean} live true only if a specific sorting is required
     * @param {boolean} html whether to generated list of tables and figures using html content, outside of the corresponding PE or not
     * @returns {object} results
     */
    public makeTablesAndFiguresTOC(
        rootBranch: TreeBranch,
        printElement: JQuery<HTMLElement>,
        live: boolean,
        html: boolean
    ) {
        let ob = {
            tables: '',
            figures: '',
            equations: '',
            tableCount: 0,
            figureCount: 0,
            equationCount: 0,
        }

        // If both "Generate List of Tables and Figures" && "Use HTML for List of Tables and Figures " options are checked...
        if (html) {
            ob = this.generateTOCHtmlOption(ob, rootBranch, printElement)
            // return obHTML;
        } else {
            for (let i = 0; i < rootBranch.children.length; i++) {
                this.makeTablesAndFiguresTOCChild(
                    rootBranch.children[i],
                    printElement,
                    ob,
                    live,
                    false
                )
            }
        }
        ob.tables = ob.tables.length
            ? '<div class="tot"><h1 class="header">List of Tables</h1><ul>' +
              ob.tables +
              '</ul></div>'
            : ''
        ob.figures = ob.figures.length
            ? '<div class="tof"><h1 class="header">List of Figures</h1><ul>' +
              ob.figures +
              '</ul></div>'
            : ''
        ob.equations = ob.equations.length
            ? '<div class="tof"><h1 class="header">List of Equations</h1><ul>' +
              ob.equations +
              '</ul></div>'
            : ''
        return ob
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#makeTablesAndFiguresTOCChild
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Generates a list of tables, figures, and equations of the none root node of he tree (containment tree on the left pane). It also appends the captions to the figures and tables.
     *
     * @param {string} child presentation element
     * @param {string} printElement contents to be printed (what is displayed in the center pane)
     * @param {string} ob an object that stores the html list of tables, figures, and equations as well as the counts of those
     * @param {boolean} live true when user would like to preview numbering in the app
     * @param {boolean} showRefName the tree hierarchy of the document or view (what is displayed in the left pane)
     * @returns {void} nothing
     */
    public makeTablesAndFiguresTOCChild(
        child,
        printElement,
        ob,
        live,
        showRefName
    ) {
        const pe = child.data
        const sysmlId = pe.id
        const veNumber = pe._veNumber
        let prefix = ''
        const el = printElement.find('#' + sysmlId)
        const refs = printElement.find(
            'view-link[mms-pe-id="' +
                sysmlId +
                '"], view-link[data-mms-pe-id="' +
                sysmlId +
                '"]'
        )
        let cap = ''
        let name = ''
        if (child.type === 'table') {
            ob.tableCount++
            prefix = 'Table ' + veNumber + '. '
            const capTbl = el.find('table > caption')
            name = capTbl.text()
            if (
                name !== '' &&
                name.indexOf('Table') === 0 &&
                name.split('. ').length > 0
            ) {
                name = name.substring(name.indexOf(prefix) + prefix.length)
            } else if (name === '') {
                name = pe.name
            }
            cap = veNumber + '. ' + name
            ob.tables += '<li><a href="#' + sysmlId + '">' + cap + '</a></li>'
            capTbl.html('Table ' + cap)
            // If caption does not exist, add to html
            if (capTbl.length === 0) {
                el.find('table').prepend('<caption>Table ' + cap + '</caption>')
            }
            // Change cap value based on showRefName true/false
            if (!showRefName) {
                cap = veNumber
            }
            if (!live) {
                refs.find('a').attr('href', '#' + sysmlId)
            }
            refs.filter('[suppress-numbering!="true"]')
                .filter(':not([link-text])')
                .find('a')
                .html('Table ' + cap)
        }
        if (child.type === 'figure') {
            ob.figureCount++
            prefix = 'Figure ' + veNumber + '. '
            const capFig = el.find('figure > figcaption')
            name = capFig.text()
            if (
                name !== '' &&
                name.indexOf('Figure') === 0 &&
                name.split('. ').length > 0
            ) {
                name = name.substring(name.indexOf(prefix) + prefix.length)
            } else if (name === '') {
                name = pe.name
            }
            cap = veNumber + '. ' + name
            ob.figures += '<li><a href="#' + sysmlId + '">' + cap + '</a></li>'
            capFig.html('Figure ' + cap)
            // If caption does not exist, add to html
            if (capFig.length === 0) {
                el.find('img')
                    .wrap('<figure></figure>')
                    .after('<figcaption>Figure ' + cap + '</figcaption>')
            }
            // Change cap value based on showRefName true/false
            if (!showRefName) {
                cap = veNumber
            }
            if (!live) {
                refs.find('a').attr('href', '#' + sysmlId)
            }
            refs.filter('[suppress-numbering!="true"]')
                .filter(':not([link-text])')
                .find('a')
                .html('Fig. ' + cap)
        }
        if (child.type === 'equation') {
            ob.equationCount++
            cap = veNumber + '. ' + pe.name
            ob.equations +=
                '<li><a href="#' + sysmlId + '">' + cap + '</a></li>'
            const equationCap = '(' + veNumber + ')'
            const capEq = el.find('.caption-type-equation')
            capEq.html(equationCap)
            // If caption does not exist, add to html
            if (capEq.length === 0) {
                el.find('present-equation > transclude > transclude-doc > p')
                    .last()
                    .append(
                        '<span class="caption-type-equation pull-right">' +
                            equationCap +
                            '</span>'
                    )
            }
            if (!live) {
                refs.find('a').attr('href', '#' + sysmlId)
            }
            refs.filter('[suppress-numbering!="true"]')
                .filter(':not([link-text])')
                .find('a')
                .html('Eq. ' + equationCap)
        }
        for (let i = 0; i < child.children.length; i++) {
            this.makeTablesAndFiguresTOCChild(
                child.children[i],
                printElement,
                ob,
                live,
                showRefName
            )
        }
    }

    public addLiveNumbering(pe, el, type) {
        const veNumber = pe._veNumber
        if (!veNumber) {
            return
        }
        let prefix = ''
        let name = ''
        let cap = ''
        if (type === 'table') {
            prefix = 'Table ' + veNumber + '. '
            const capTbl = el.find('table > caption')
            name = capTbl.text()
            if (
                name !== '' &&
                name.indexOf('Table') === 0 &&
                name.split('. ').length > 0
            ) {
                name = name.substring(name.indexOf(prefix) + prefix.length)
            } else if (name === '') {
                name = pe.name
            }
            cap = veNumber + '. ' + name
            capTbl.html('Table ' + cap)
            // If caption does not exist, add to html
            if (capTbl.length === 0) {
                el.find('table').prepend('<caption>Table ' + cap + '</caption>')
            }
        }
        if (type === 'figure') {
            prefix = 'Figure ' + veNumber + '. '
            const capFig = el.find('figure > figcaption')
            name = capFig.text()
            if (
                name !== '' &&
                name.indexOf('Figure') === 0 &&
                name.split('. ').length > 0
            ) {
                name = name.substring(name.indexOf(prefix) + prefix.length)
            } else if (name === '') {
                name = pe.name
            }
            cap = veNumber + '. ' + name
            capFig.html('Figure ' + cap)
            // If caption does not exist, add to html
            if (capFig.length === 0) {
                el.find('img')
                    .wrap('<figure></figure>')
                    .after('<figcaption>Figure ' + cap + '</figcaption>')
            }
        }
        if (type === 'equation') {
            const equationCap = '(' + veNumber + ')'
            const capEq = el.find('.caption-type-equation')
            capEq.html(equationCap)
            // If caption does not exist, add to html
            if (capEq.length === 0) {
                el.find('mms-view-equation > mms-cf > transclude-doc > p')
                    .last()
                    .append(
                        '<span class="caption-type-equation pull-right">' +
                            equationCap +
                            '</span>'
                    )
            }
        }
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#this.generateAnchorId
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Generates a unique ID to be used in TOC anchor tags (e.g. <a name='tbl_xxxxx...x'>, <a href='#tbl_xxxxx...x'>)
     *
     * @param {string} prefix "tbl_" when creating an id for a table, "fig_" when creating an id for a figuer
     * @returns {string} unique ID wit prefix, tbl_ or fig_
     */
    public generateAnchorId(prefix) {
        return prefix + this.applicationSvc.createUniqueId()
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#generateTOCHtmlOption
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Generates a list of tables, figures, and equations. It also appends the captions to the figures and tables.
     *
     * @param {string} ob an object that stores the html list of tables, figures, and equations as well as the counts of those
     * @param {string} tree the tree hierarchy of the document or view (what is displayed in the left pane)
     * @param {string} printElement contents to be printed (what is displayed in the center pane)
     * @returns {string} populates the object fed to the function (the first argument) and return
     */
    public generateTOCHtmlOption(ob, tree, printElement) {
        // Grab all existing tables and figures inside the center pane, and assign them to tables and figures
        const tables = printElement.find('table'),
            figures = printElement.find('figure')
        // equations = printElement.find('.math-tex');
        let anchorId = '',
            thisCap = '',
            tblCap,
            tbl,
            fig,
            j

        ob.tableCount = tables.length
        ob.figureCount = figures.length

        // Tables
        for (j = 0; j < tables.length; j++) {
            tbl = $(tables[j])
            tblCap = $('caption', tbl)

            // Set the link from the List of Tables to the actual tables
            anchorId = this.generateAnchorId('tbl_')
            tbl.attr('id', anchorId)

            // Append li to the List of Tables
            thisCap =
                tblCap && tblCap.text() !== ''
                    ? j + 1 + '. ' + tblCap.text()
                    : j + 1 + '. '
            ob.tables +=
                '<li><a href="#' + anchorId + '">' + thisCap + '</a></li>'

            // If no caption exists, add empty caption for numbering
            if (tblCap.length === 0) {
                tbl.prepend('<caption> </caption>')
            }
        }

        // Figures
        for (j = 0; j < figures.length; j++) {
            fig = $(figures[j])
            const figcap = $('figcaption', fig)

            // Set the link from the List of Tables to the actual tables
            anchorId = this.generateAnchorId('fig_')
            fig.attr('id', anchorId)

            // Append li to the List of Figures
            thisCap =
                figcap && figcap.text() !== ''
                    ? j + 1 + '. ' + figcap.text()
                    : j + 1
            ob.figures +=
                '<li><a href="#' + anchorId + '">' + thisCap + '</a></li>'

            // If no caption exists, add empty caption for numbering
            if (figcap.length === 0) {
                fig.append('<figcaption>&nbsp;</figcaption>')
            }
        }

        // We will not add List of Equations for now
        // for ( j = 0; j < equations.length; j++) {
        //     // Grab all equations from the center pane
        //     eq = $(equations[j]);
        //
        //     // Set the link from the List of Tables to the actual tables
        //     anchorId = this.generateAnchorId('eq_');
        //     eq.attr('id', anchorId);
        //
        //     // Append li to the List of Equations
        //     ob.equations += '<li><a href="#' + anchorId + '">' + j + '. </a></li>';
        //     public if(noCaption){ // If user did not add the caption, add a mock caption
        //         eq.append('<caption>&nbsp;</caption>');
        //     }
        // }
        return ob
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#createMmsId
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Generate unique SysML element ID
     *
     * @returns {string} unique SysML element ID
     */
    public createMmsId() {
        let d = Date.now()
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
            /[xy]/g,
            (c) => {
                const r = (d + Math.random() * 16) % 16 | 0
                d = Math.floor(d / 16)
                return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
            }
        )
        return 'MMS_' + Date.now() + '_' + uuid
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#convertViewLinks
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Link the element to the document/view in VE (add an anchor tag)
     *
     * @param {string} printElement the content of the view/document currently selected on the center pane
     * @returns {void} nothing
     */
    public convertViewLinks(printElement) {
        printElement.find('view-link').each((index) => {
            const $this = $(this)
            let elementId =
                $this.attr('mms-element-id') ||
                $this.attr('data-mms-element-id')
            if (!elementId) {
                return
            }
            elementId = elementId.replace(/[^\w\-]/gi, '')
            const isElementInDoc = printElement.find('#' + elementId)
            if (isElementInDoc.length) {
                $this.find('a').attr('href', '#' + elementId)
            }
        })
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#getPrintCss
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Typeset HTML to PDF (resource: https://www.princexml.com/)
     *
     * @param {string} htmlFlag user input taken from the printConfirm modal: whether to include docGen generated tables and rapid tables, outside of the corresponding PE or not(<-- this comment needs to be approved by Shakeh)
     * @param {string} landscape user input taken from the printConfirm modal
     * @param {string} meta metadata about document/view {
                    'top-left': 'loading...', top: 'loading...', 'top-right': 'loading...',
                    'bottom-left': 'loading...', bottom: 'loading...', 'bottom-right': 'loading...'
                };
     * @returns {string} document/view content string to be passed to the server for conversion
     */
    public getPrintCss(htmlFlag, landscape, meta): string {
        let ret =
            '/*------------------------------------------------------------------\n' +
            'Custom CSS Table of Contents\n' +
            '1. Images\n' +
            '2. Tables\n' +
            '3. Typography\n' +
            '   3.1 Diff\n' +
            '   3.2 Errors\n' +
            '4. Figure Captions\n' +
            '5. Table of Contents\n' +
            '6. Page Layout\n' +
            '7. Headers and Footers\n' +
            '8. Signature Box\n' +
            '9. Bookmark Level\n' +
            '------------------------------------------------------------------*/\n' +
            '\n' +
            '/*------------------------------------------------------------------\n' +
            '1. Images\n' +
            '------------------------------------------------------------------*/\n' +
            'img {max-width: 100%; page-break-inside: avoid; page-break-before: auto; page-break-after: auto; margin-left: auto; margin-right: auto;}\n' +
            'img.image-center {display: block;}\n' +
            'figure img {display: block;}\n' +
            '.pull-right {float: right;}\n' +
            '\n' +
            '/*------------------------------------------------------------------\n' +
            '2. Tables\n' +
            '------------------------------------------------------------------*/\n' +
            ' tr, td, th { page-break-inside: avoid; } thead {display: table-header-group;}\n' +
            'table {width: 100%; border-collapse: collapse;}\n' +
            'table, th, td {border: 1px solid black; padding: 4px; font-size: 10pt;}\n' +
            "table[border='0'], table[border='0'] th, table[border='0'] td {border: 0px;}\n" +
            'table, th > p, td > p {margin: 0px; padding: 0px;}\n' +
            'table, th > div > p, td > div > p {margin: 0px; padding: 0px;}\n' +
            'table transclude-doc p {margin: 0 0 5px;}\n' +
            'th {background-color: #f2f3f2;}\n' +
            //"table p {word-break: break-all;}\n" +
            '\n' +
            '/*------------------------------------------------------------------\n' +
            '3. Typography\n' +
            '------------------------------------------------------------------*/\n' +
            "h1, h2, h3, h4, h5, h6 {font-family: 'Arial', sans-serif; margin: 10px 0; page-break-inside: avoid; page-break-after: avoid;}\n" +
            //"h1 {font-size: 18pt;} h2 {font-size: 16pt;} h3 {font-size: 14pt;} h4 {font-size: 13pt;} h5 {font-size: 12pt;} h6 {font-size: 11pt;}\n" +
            '.h1 {font-size: 18pt;} .h2 {font-size: 14pt;} .h3 {font-size: 12pt;} .h4 {font-size: 10pt;} .h5, .h6, .h7, .h8, .h9 {font-size: 9pt;}\n' +
            '.ng-hide {display: none;}\n' +
            '.chapter h1.view-title {font-size: 20pt; }\n' +
            "body {font-size: 10pt; font-family: 'Times New Roman', Times, serif; }\n" +
            '\n' +
            '/*------------------------------------------------------------------\n' +
            '   3.1 Diff\n' +
            '------------------------------------------------------------------*/\n' +
            'ins, .ins {color: black; background: #dafde0;}\n' +
            'del, .del{color: black;background: #ffe3e3;text-decoration: line-through;}\n' +
            '.match,.textdiff span {color: gray;}\n' +
            '.patcher-replaceIn, .patcher-attribute-replace-in, .patcher-insert, .patcher-text-insertion {background-color: #dafde0;}\n' +
            '.patcher-replaceIn, .patcher-attribute-replace-in, .patcher-insert {border: 2px dashed #abffb9;}\n' +
            '.patcher-replaceOut, .patcher-delete, .patcher-attribute-replace-out, .patcher-text-deletion {background-color: #ffe3e3; text-decoration: line-through;}\n' +
            '.patcher-replaceOut, .patcher-delete, .patcher-attribute-replace-out {border: 2px dashed #ffb6b6;}\n' +
            '.patcher-text-insertion, .patcher-text-deletion {display: inline !important;}\n' +
            '[class*="patcher-"]:not(td):not(tr) {display: inline-block;}\n' +
            '\n' +
            '/*------------------------------------------------------------------\n' +
            '   3.2 Errors\n' +
            '------------------------------------------------------------------*/\n' +
            '.ve-error {background: repeating-linear-gradient(45deg,#fff,#fff 10px,#fff2e4 10px,#fff2e4 20px);}\n' +
            '\n' +
            '/*------------------------------------------------------------------\n' +
            '4. Figure Captions\n' +
            '------------------------------------------------------------------*/\n' +
            'caption, figcaption, .caption-type-equation {text-align: center; font-weight: bold;}\n' +
            'table, figure {margin-bottom: 10px;}\n' +
            '.caption-type-equation {float: right;}\n' +
            'mms-view-equation, mms-view-figure, mms-view-image {page-break-inside: avoid;}\n' +
            '\n' +
            '/*------------------------------------------------------------------\n' +
            '5. Table of Contents\n' +
            '------------------------------------------------------------------*/\n' +
            '.toc, .tof, .tot {page-break-after:always;}\n' +
            '.toc {page-break-before: always;}\n' +
            '.toc a, .tof a, .tot a { text-decoration:none; color: #000; font-size:9pt; }\n' +
            '.toc .header, .tof .header, .tot .header { margin-bottom: 4px; font-weight: bold; font-size:24px; }\n' +
            '.toc ul, .tof ul, .tot ul {list-style-type:none; margin: 0; }\n' +
            '.tof ul, .tot ul {padding-left:0;}\n' +
            '.toc ul {padding-left:4em;}\n' +
            '.toc > ul {padding-left:0;}\n' +
            ".toc li > a[href]::after {content: leader('.') target-counter(attr(href), page);}\n" +
            ".tot li > a[href]::after {content: leader('.') target-counter(attr(href), page);}\n" +
            ".tof li > a[href]::after {content: leader('.') target-counter(attr(href), page);}\n" +
            '\n' +
            '/*------------------------------------------------------------------\n' +
            '6. Page Layout\n' +
            '------------------------------------------------------------------*/\n' +
            '@page {margin: 0.5in;}\n' +
            '@page landscape {size: 11in 8.5in;}\n' +
            '.landscape {page: landscape;}\n' +
            '.chapter {page-break-before: always}\n' +
            'p, div {widows: 2; orphans: 2;}\n' +
            '\n' +
            '/*------------------------------------------------------------------\n' +
            '7. Headers and Footers\n' +
            '------------------------------------------------------------------*/\n' +
            "@page:first {@top {content: ''} @bottom {content: ''} @top-left {content: ''} @top-right {content: ''} @bottom-left {content: ''} @bottom-right {content: ''}}\n" +
            '\n' +
            '/*------------------------------------------------------------------\n' +
            '8. Signature Box\n' +
            '------------------------------------------------------------------*/\n' +
            '.signature-box td.signature-name-styling {width: 60%;}\n' +
            '.signature-box td.signature-space-styling {width: 1%;}\n' +
            '.signature-box td.signature-date-styling {width: 39%;}\n' +
            '\n' +
            '/*------------------------------------------------------------------\n' +
            '9. Bookmark Level\n' +
            '------------------------------------------------------------------*/\n'
        for (let i = 1; i < 10; i++) {
            ret += '.h' + i + ' {bookmark-level: ' + i + ';}\n'
        }
        if (htmlFlag) {
            ret +=
                '.toc { counter-reset: table-counter figure-counter;}\n' +
                'figure { counter-increment: figure-counter; }\n' +
                'figcaption::before {content: "Figure " counter(figure-counter) ". "; }\n' +
                'table { counter-increment: table-counter; }\n' +
                'caption::before {content: "Table " counter(table-counter) ". "; }\n'
        }
        Object.keys(meta).forEach((key) => {
            if (meta[key]) {
                let content
                if (meta[key] === 'this.counter(page)') {
                    content = meta[key]
                } else {
                    content = '"' + meta[key] + '"'
                }
                ret +=
                    '@page {@' +
                    key +
                    ' {font-size: 9px; content: ' +
                    content +
                    ';}}\n'
            }
        })
        if (landscape) {
            ret += '@page {size: 11in 8.5in;}'
        }
        return ret
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#isView
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Evaluates if an given element is a view or not
     *
     * @param {Object} e element
     * @returns {boolean} boolean
     */
    public isView(e) {
        if (e._appliedStereotypeIds) {
            if (
                e._appliedStereotypeIds.indexOf(
                    this.schemaSvc.get('VIEW_SID', this.schema)
                ) >= 0 ||
                e._appliedStereotypeIds.indexOf(
                    this.schemaSvc.get('DOCUMENT_SID', this.schema)
                ) >= 0
            ) {
                return true
            }
            const otherViewSids = this.schemaSvc.get(
                'OTHER_VIEW_SID',
                this.schema
            )
            for (const otherViewSid of otherViewSids) {
                if (e._appliedStereotypeIds.indexOf(otherViewSid) >= 0) {
                    return true
                }
            }
        }
        return false
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#isDocument
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Evaluates if an given element is a document or not
     *
     * @param {Object} e element
     * @returns {boolean} boolean
     */
    public isDocument(e) {
        return (
            e._appliedStereotypeIds &&
            e._appliedStereotypeIds.indexOf(
                this.schemaSvc.get('DOCUMENT_SID', this.schema)
            ) >= 0
        )
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#isRequirement
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Evaluates if an given element is a requirement from list given above: this.REQUIREMENT_SID
     *
     * @param {Object} e element
     * @returns {boolean} boolean
     */
    public isRequirement(e) {
        if (e._appliedStereotypeIds) {
            const reqSids = this.schemaSvc.get('REQUIREMENT_SID', this.schema)
            for (const reqSid of reqSids) {
                if (e._appliedStereotypeIds.indexOf(reqSid) >= 0) {
                    return true
                }
            }
        }
        return false
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#exportHtmlAs
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Converts HTML to PDF
     *
     * @param {string} exportType The export type (3 for pdf | 2 for word)
     * @param {Object} data contains htmlString, name, projectId, refId
     * @returns {Promise} Promise would be resolved with 'ok', the server will send an email to user when done
     */
    public exportHtmlAs(exportType, data) {
        let accept
        switch (exportType) {
            case 2:
                accept =
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                break
            case 3:
                accept = 'application/pdf'
                break
            default:
                accept = 'application/pdf'
        }
        const deferred = this.$q.defer()
        this.$http
            .post(this.uRLSvc.getExportHtmlUrl(data.projectId, data.refId), {
                'Content-Type': 'text/html',
                Accepts: accept,
                body: data.htmlString,
                name: data.name,
                css: data.css,
            })
            .then(
                () => {
                    deferred.resolve('ok')
                },
                (error) => {
                    this.uRLSvc.handleHttpStatus(
                        error.data,
                        error.status,
                        error.headers,
                        error.config,
                        deferred
                    )
                }
            )
        return deferred.promise
    }

    public copyToClipboard(target: JQuery<HTMLElement>, $event) {
        $event.stopPropagation()
        const range = window.document.createRange()
        range.selectNodeContents(target[0].childNodes[0])
        window.getSelection().removeAllRanges()
        window.getSelection().addRange(range)
        try {
            window.document.execCommand('copy')
            this.growl.info('Copied to clipboard!', { ttl: 2000 })
        } catch (err) {}
        window.getSelection().removeAllRanges()
    }

    public getElementTypeClass(element: ElementObject, elementType: string) {
        let elementTypeClass = ''
        if (element.type === 'InstanceSpecification') {
            elementTypeClass = 'pe-type-' + _.kebabCase(elementType)
        } else {
            elementTypeClass = 'item-type-' + _.kebabCase(elementType)
        }
        return elementTypeClass
    }
}

veUtils.service('UtilsService', UtilsService)