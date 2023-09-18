import _ from 'lodash';

import { ApiService, DocumentMetadata, URLService } from '@ve-utils/mms-api-client';

import { veUtils } from '@ve-utils';

import { VePromise, VeQService } from '@ve-types/angular';
import { ElementObject, ViewObject } from '@ve-types/mms';
import { TreeBranch } from '@ve-types/tree';

export interface TOCHtmlObject {
    equations: string;
    tables: string;
    figures: string;
    tableCount: number;
    equationCount: number;
    figureCount: number;
}

/**
 * @ngdoc service
 * @name veUtils/UtilsService
 * @requires $q
 * @requires $http
 * @requires URLService
 * @requires ApiService
 * * Utilities
 */
export class UtilsService {
    static $inject = ['$q', '$http', 'URLService', 'ApiService'];

    constructor(
        private $q: VeQService,
        private $http: angular.IHttpService,
        private uRLSvc: URLService,
        private apiSvc: ApiService
    ) {}

    /**
     * @name veUtils/UtilsService#makeHtmlTOCChild
     * Generates table of contents for the document/views.
     *
     * @param {TreeBranch} rootBranch the root element (document or view) of the main tree
     * @returns {string} toc string
     */
    public makeHtmlTOC = (rootBranch: TreeBranch): string => {
        let result = '<div class="toc"><h1 class="header">Table of Contents</h1>';
        result += this.makeHtmlTOCChild(rootBranch, true);
        result += '</div>';
        return result;
    };

    /**
     * @name veUtils/UtilsService#makeHtmlTOCChild
     * Generates table of contents for the document/views.
     * @param {TreeBranch} branch
     * @param skip
     * @return {string}
     */
    public makeHtmlTOCChild = (branch: TreeBranch, skip?): string => {
        let result = '';
        if (!skip) {
            const anchor: string = '<a href=#' + branch.data.id + '>';
            result += `  <li>${anchor}${branch.data._veNumber} ${branch.data.name}</a>`;
        }
        let ulAdded = false;
        for (const child of branch.children) {
            if (child.type !== 'view' && child.type !== 'section') {
                continue;
            }
            if (!ulAdded) {
                result += '<ul>';
                ulAdded = true;
            }
            result += this.makeHtmlTOCChild(child);
        }
        if (ulAdded) {
            result += '</ul>';
        }
        if (!skip) {
            result += '</li>';
        }
        return result;
    };

    /**
     * @name veUtils/UtilsService#makeTablesAndFiguresTOC
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
    ): TOCHtmlObject {
        let ob = {
            tables: '',
            figures: '',
            equations: '',
            tableCount: 0,
            figureCount: 0,
            equationCount: 0,
        };

        // If both "Generate List of Tables and Figures" && "Use HTML for List of Tables and Figures " options are checked...
        if (html) {
            ob = this.generateTOCHtmlOption(ob, rootBranch, printElement);
            // return obHTML;
        } else {
            for (let i = 0; i < rootBranch.children.length; i++) {
                this.makeTablesAndFiguresTOCChild(rootBranch.children[i], printElement, ob, live, false);
            }
        }
        ob.tables = ob.tables.length
            ? '<div class="tot"><h1 class="header">List of Tables</h1><ul>' + ob.tables + '</ul></div>'
            : '';
        ob.figures = ob.figures.length
            ? '<div class="tof"><h1 class="header">List of Figures</h1><ul>' + ob.figures + '</ul></div>'
            : '';
        ob.equations = ob.equations.length
            ? '<div class="tof"><h1 class="header">List of Equations</h1><ul>' + ob.equations + '</ul></div>'
            : '';
        return ob;
    }

    /**
     * @name veUtils/UtilsService#makeTablesAndFiguresTOCChild
     * Generates a list of tables, figures, and equations of the none root node of he tree (containment tree on the left pane). It also appends the captions to the figures and tables.
     *
     * @param {TreeBranch} child presentation element
     * @param {JQuery<HTMLElement>} printElement contents to be printed (what is displayed in the center pane)
     * @param {TOCHtmlObject} ob an object that stores the html list of tables, figures, and equations as well as the counts of those
     * @param {boolean} live true when user would like to preview numbering in the app
     * @param {boolean} showRefName the tree hierarchy of the document or view (what is displayed in the left pane)
     * @returns {void} nothing
     */
    public makeTablesAndFiguresTOCChild(
        child: TreeBranch,
        printElement: JQuery<HTMLElement>,
        ob: TOCHtmlObject,
        live: boolean,
        showRefName: boolean
    ): void {
        const pe = child.data;
        const sysmlId = pe.id;
        const veNumber = pe._veNumber;
        let prefix = '';
        const el = printElement.find('#' + sysmlId);
        const refs = printElement.find(
            'mms-view-link[mms-pe-id="' + sysmlId + '"], mms-view-link[data-mms-pe-id="' + sysmlId + '"]'
        );
        let cap = '';
        let name = '';
        if (child.type === 'table') {
            ob.tableCount++;
            prefix = 'Table ' + veNumber + '. ';
            const capTbl = el.find('table > caption');
            name = capTbl.text();
            if (name !== '' && name.indexOf('Table') === 0 && name.split('. ').length > 0) {
                name = name.substring(name.indexOf(prefix) + prefix.length);
            } else if (name === '') {
                name = pe.name;
            }
            cap = veNumber + '. ' + name;
            ob.tables += '<li><a href="#' + sysmlId + '">' + cap + '</a></li>';
            capTbl.html('Table ' + cap);
            // If caption does not exist, add to html
            if (capTbl.length === 0) {
                el.find('table').prepend('<caption>Table ' + cap + '</caption>');
            }
            // Change cap value based on showRefName true/false
            if (!showRefName) {
                cap = veNumber;
            }
            if (!live) {
                refs.find('a').attr('href', '#' + sysmlId);
            }
            refs.filter('[suppress-numbering!="true"]')
                .filter(':not([link-text])')
                .find('a')
                .html('Table ' + cap);
        }
        if (child.type === 'figure') {
            ob.figureCount++;
            prefix = 'Figure ' + veNumber + '. ';
            const capFig = el.find('figure > figcaption');
            name = capFig.text().trim();
            if (name !== '' && name.indexOf('Figure') === 0 && name.split('. ').length > 0) {
                name = name.substring(name.indexOf(prefix) + prefix.length);
            } else if (name === '') {
                name = pe.name;
            }
            cap = veNumber + '. ' + name;
            ob.figures += '<li><a href="#' + sysmlId + '">' + cap + '</a></li>';
            capFig.html('Figure ' + cap);
            // If caption does not exist, add to html
            if (capFig.length === 0) {
                el.find('img')
                    .wrap('<figure></figure>')
                    .after('<figcaption>Figure ' + cap + '</figcaption>');
            }
            // Change cap value based on showRefName true/false
            if (!showRefName) {
                cap = veNumber;
            }
            if (!live) {
                refs.find('a').attr('href', '#' + sysmlId);
            }
            refs.filter('[suppress-numbering!="true"]')
                .filter(':not([link-text])')
                .find('a')
                .html('Fig. ' + cap);
        }
        if (child.type === 'equation') {
            ob.equationCount++;
            cap = veNumber + '. ' + pe.name;
            ob.equations += '<li><a href="#' + sysmlId + '">' + cap + '</a></li>';
            const equationCap = '(' + veNumber + ')';
            const capEq = el.find('.caption-type-equation');
            capEq.html(equationCap);
            // If caption does not exist, add to html
            if (capEq.length === 0) {
                el.find('present-equation > transclude > transclude-doc > p')
                    .last()
                    .append('<span class="caption-type-equation pull-right">' + equationCap + '</span>');
            }
            if (!live) {
                refs.find('a').attr('href', '#' + sysmlId);
            }
            refs.filter('[suppress-numbering!="true"]')
                .filter(':not([link-text])')
                .find('a')
                .html('Eq. ' + equationCap);
        }
        for (let i = 0; i < child.children.length; i++) {
            this.makeTablesAndFiguresTOCChild(child.children[i], printElement, ob, live, showRefName);
        }
    }

    public addLiveNumbering(pe: ViewObject, el: JQuery<HTMLElement>, type: string): void {
        const veNumber = pe._veNumber;
        if (!veNumber) {
            return;
        }
        let prefix = '';
        let name = '';
        let cap = '';
        if (type === 'table') {
            prefix = 'Table ' + veNumber + '. ';
            const capTbl = el.find('table > caption');
            name = capTbl.text();
            if (name !== '' && name.indexOf('Table') === 0 && name.split('. ').length > 0) {
                name = name.substring(name.indexOf(prefix) + prefix.length);
            } else if (name === '') {
                name = pe.name;
            }
            cap = veNumber + '. ' + name;
            capTbl.html('Table ' + cap);
            // If caption does not exist, add to html
            if (capTbl.length === 0) {
                el.find('table').prepend('<caption>Table ' + cap + '</caption>');
            }
        }
        if (type === 'figure') {
            prefix = 'Figure ' + veNumber + '. ';
            const capFig = el.find('figure > figcaption');
            name = capFig.text().trim();
            if (name !== '' && name.indexOf('Figure') === 0 && name.split('. ').length > 0) {
                name = name.substring(name.indexOf(prefix) + prefix.length);
            } else if (name === '') {
                name = pe.name;
            }
            cap = veNumber + '. ' + name;
            capFig.html('Figure ' + cap);
            // If caption does not exist, add to html
            if (capFig.length === 0) {
                el.find('img')
                    .wrap('<figure></figure>')
                    .after('<figcaption>Figure ' + cap + '</figcaption>');
            }
        }
        if (type === 'equation') {
            const equationCap = '(' + veNumber + ')';
            const capEq = el.find('.caption-type-equation');
            capEq.html(equationCap);
            // If caption does not exist, add to html
            if (capEq.length === 0) {
                el.find('present-equation > mms-cf > transclude-doc > p')
                    .last()
                    .append('<span class="caption-type-equation pull-right">' + equationCap + '</span>');
            }
        }
    }

    /**
     * @name veUtils/UtilsService#this.generateAnchorId
     * Generates a unique ID to be used in TOC anchor tags (e.g. <a name='tbl_xxxxx...x'>, <a href='#tbl_xxxxx...x'>)
     *
     * @param {string} prefix "tbl_" when creating an id for a table, "fig_" when creating an id for a figuer
     * @returns {string} unique ID wit prefix, tbl_ or fig_
     */
    public generateAnchorId = (prefix: string): string => {
        return `${prefix}${this.apiSvc.createUniqueId()}`;
    };

    /**
     * @name veUtils/UtilsService#generateTOCHtmlOption
     * Generates a list of tables, figures, and equations. It also appends the captions to the figures and tables.
     *
     * @param {string} ob an object that stores the html list of tables, figures, and equations as well as the counts of those
     * @param {string} treeBranch the tree hierarchy of the document or view (what is displayed in the left pane)
     * @param {string} printElement contents to be printed (what is displayed in the center pane)
     * @returns {string} populates the object fed to the function (the first argument) and return
     */
    public generateTOCHtmlOption(
        ob: TOCHtmlObject,
        treeBranch: TreeBranch,
        printElement: JQuery<HTMLElement>
    ): TOCHtmlObject {
        // Grab all existing tables and figures inside the center pane, and assign them to tables and figures
        const tables = printElement.find('table'),
            figures = printElement.find('figure');
        // equations = printElement.find('.math-tex');
        let anchorId = '',
            thisCap = '',
            tblCap: JQuery<HTMLElement>,
            tbl: JQuery<HTMLTableElement>,
            fig: JQuery<HTMLElement>;

        ob.tableCount = tables.length;
        ob.figureCount = figures.length;

        // Tables
        for (let j = 0; j < tables.length; j++) {
            tbl = $(tables[j]);
            tblCap = $('caption', tbl);

            // Set the link from the List of Tables to the actual tables
            anchorId = this.generateAnchorId('tbl_');
            tbl.attr('id', anchorId);

            // Append li to the List of Tables
            thisCap = tblCap && tblCap.text() !== '' ? `${j + 1}. ${tblCap.text()}` : `${j + 1}. `;
            ob.tables += '<li><a href="#' + anchorId + '">' + thisCap + '</a></li>';

            // If no caption exists, add empty caption for numbering
            if (tblCap.length === 0) {
                tbl.prepend('<caption> </caption>');
            }
        }

        // Figures
        for (let j = 0; j < figures.length; j++) {
            fig = $(figures[j]);
            const figcap = $('figcaption', fig);

            // Set the link from the List of Tables to the actual tables
            anchorId = this.generateAnchorId('fig_');
            fig.attr('id', anchorId);

            // Append li to the List of Figures
            thisCap = figcap && figcap.text() !== '' ? `${j + 1}. ${figcap.text()}` : `${j + 1}`;
            ob.figures += '<li><a href="#' + anchorId + '">' + thisCap + '</a></li>';

            // If no caption exists, add empty caption for numbering
            if (figcap.length === 0) {
                fig.append('<figcaption>&nbsp;</figcaption>');
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
        return ob;
    }

    /**
     * @name veUtils/UtilsService#convertViewLinks
     * Link the element to the document/view in VE (add an anchor tag)
     *
     * @param {string} printElement the content of the view/document currently selected on the center pane
     * @returns {void} nothing
     */
    public convertViewLinks(printElement: JQuery<HTMLElement>): void {
        printElement.find('mms-view-link').each((index, el) => {
            const $this = $(el);
            let elementId = $this.attr('mms-element-id') || $this.attr('data-mms-element-id');
            if (!elementId) {
                return;
            }
            elementId = elementId.replace(/[^\w\-]/gi, '');
            const isElementInDoc = printElement.find('#' + elementId);
            if (isElementInDoc.length) {
                $this.find('a').attr('href', '#' + elementId);
            }
        });
    }

    /**
     * @name veUtils/UtilsService#getPrintCss
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
    public getPrintCss = (htmlFlag: boolean, landscape: boolean, meta: DocumentMetadata): string => {
        let ret = `
        /*------------------------------------------------------------------
Custom CSS Table of Contents
1. Images
2. Tables
3. Typography
   3.1 Diff
   3.2 Errors
4. Figure Captions
5. Table of Contents
6. Page Layout
7. Headers and Footers
8. Signature Box
9. Bookmark Level
------------------------------------------------------------------*/

/*------------------------------------------------------------------
1. Images
------------------------------------------------------------------*/
img {max-width: 100%; page-break-inside: avoid; page-break-before: auto; page-break-after: auto; margin-left: auto; margin-right: auto;}
img.image-center {display: block;}
figure img {display: block;}
.pull-right {float: right;}

/*------------------------------------------------------------------
2. Tables
------------------------------------------------------------------*/
 tr, td, th { page-break-inside: avoid; } thead {display: table-header-group;}
table {width: 100%; border-collapse: collapse;}
table, th, td {border: 1px solid black; padding: 4px; font-size: 10pt;}
table[border='0'], table[border='0'] th, table[border='0'] td {border: 0px;}
table, th > p, td > p {margin: 0px; padding: 0px;}
table, th > div > p, td > div > p {margin: 0px; padding: 0px;}
table transclude-doc p {margin: 0 0 5px;}
th {background-color: #f2f3f2;}

/*------------------------------------------------------------------
3. Typography
------------------------------------------------------------------*/
h1, h2, h3, h4, h5, h6 {font-family: 'Arial', sans-serif; margin: 10px 0; page-break-inside: avoid; page-break-after: avoid;}
.h1 {font-size: 18pt;} .h2 {font-size: 14pt;} .h3 {font-size: 12pt;} .h4 {font-size: 10pt;} .h5, .h6, .h7, .h8, .h9 {font-size: 9pt;}
.ng-hide {display: none;}
.chapter h1.view-title {font-size: 20pt; }
body {font-size: 10pt; font-family: 'Times New Roman', Times, serif; }

/*------------------------------------------------------------------
   3.1 Diff
------------------------------------------------------------------*/
ins, .ins {color: black; background: #dafde0;}
del, .del{color: black;background: #ffe3e3;text-decoration: line-through;}
.match,.textdiff span {color: gray;}
.patcher-replace-in, .patcher-attribute-replace-in, .patcher-insert, .patcher-text-insertion {background-color: #dafde0;}
.patcher-replace-in, .patcher-attribute-replace-in, .patcher-insert {border: 2px dashed #abffb9;}
.patcher-replace-out, .patcher-delete, .patcher-attribute-replace-out, .patcher-text-deletion {background-color: #ffe3e3; text-decoration: line-through;}
.patcher-replace-out, .patcher-delete, .patcher-attribute-replace-out {border: 2px dashed #ffb6b6;}
.patcher-text-insertion, .patcher-text-deletion {display: inline !important;}
[class*="patcher-"]:not(td):not(tr) {display: inline-block;}

/*------------------------------------------------------------------
   3.2 Errors
------------------------------------------------------------------*/
.ve-error {background: repeating-linear-gradient(45deg,#fff,#fff 10px,#fff2e4 10px,#fff2e4 20px);}

/*------------------------------------------------------------------
4. Figure Captions
------------------------------------------------------------------*/
caption, figcaption, .caption-type-equation {text-align: center; font-weight: bold;}
table, figure {margin-bottom: 10px;}
.caption-type-equation {float: right;}
mms-view-equation, mms-view-figure, mms-view-image {page-break-inside: avoid;}

/*------------------------------------------------------------------
5. Table of Contents
------------------------------------------------------------------*/
.toc, .tof, .tot {page-break-after:always;}
.toc {page-break-before: always;}
.toc a, .tof a, .tot a { text-decoration:none; color: #000; font-size:9pt; }
.toc .header, .tof .header, .tot .header { margin-bottom: 4px; font-weight: bold; font-size:24px; }
.toc ul, .tof ul, .tot ul {list-style-type:none; margin: 0; }
.tof ul, .tot ul {padding-left:0;}
.toc ul {padding-left:4em;}
.toc > ul {padding-left:0;}
.toc li > a[href]::after {content: leader('.') target-counter(attr(href), page);}
.tot li > a[href]::after {content: leader('.') target-counter(attr(href), page);}
.tof li > a[href]::after {content: leader('.') target-counter(attr(href), page);}

/*------------------------------------------------------------------
6. Page Layout
------------------------------------------------------------------*/
@page {margin: 0.5in;}
@page landscape {size: 11in 8.5in;}
.landscape {page: landscape;}
.chapter {page-break-before: always}
p, div {widows: 2; orphans: 2;}

/*------------------------------------------------------------------
7. Headers and Footers
------------------------------------------------------------------*/
@page:first {@top {content: ''} @bottom {content: ''} @top-left {content: ''} @top-right {content: ''} @bottom-left {content: ''} @bottom-right {content: ''}}

`;
        for (let i = 1; i < 10; i++) {
            ret += `.bm-level-${i} {bookmark-level: ${i};}
`;
        }
        if (htmlFlag) {
            ret += `
            .toc { counter-reset: table-counter figure-counter;}
figure { counter-increment: figure-counter; }
figcaption::before {content: "Figure " counter(figure-counter) ". "; }
table { counter-increment: table-counter; }
caption::before {content: "Table " counter(table-counter) ". "; }
`;
        }
        if (meta) {
            Object.keys(meta).forEach((key) => {
                if (meta[key]) {
                    let content: string;
                    if (meta[key] === 'counter(page)') {
                        content = meta[key] as string;
                    } else {
                        content = `"${(meta[key] as string | number).toString()}"`;
                    }
                    ret += `@page {@${key} {font-size: 9px; content: ${content};}}
`;
                }
            });
        }
        if (landscape) {
            ret += '@page {size: 11in 8.5in;}';
        }
        return ret;
    };

    /**
     * @name veUtils/UtilsService#exportHtmlAs
     * Converts HTML to PDF
     *
     * @param {number} exportType The export type (3 for pdf | 2 for word)
     * @param {Object} data contains htmlString, name, projectId, refId
     * @returns {Promise} Promise would be resolved with 'ok', the server will send an email to user when done
     */
    public exportHtmlAs(
        exportType: number,
        data: {
            htmlString: string;
            name: string;
            projectId: string;
            refId: string;
            css: string;
        }
    ): VePromise<string, string> {
        let accept: string;
        switch (exportType) {
            case 2:
                accept = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
            case 3:
                accept = 'application/pdf';
                break;
            default:
                accept = 'application/pdf';
        }
        const deferred = this.$q.defer<string>();
        this.$http
            .post(
                this.uRLSvc.getExportHtmlUrl(),
                {
                    html: data.htmlString,
                    css: data.css,
                    format: exportType == 2 ? 'docx' : 'pdf',
                },
                {
                    responseType: 'blob',
                }
            )
            .then(
                (data2) => {
                    const blob = new Blob([data2.data as BlobPart], { type: accept });
                    const a = window.document.createElement('a');
                    const url = window.URL.createObjectURL(blob);
                    a.href = url;
                    a.download = data.name + (exportType == 2 ? '.docx' : '.pdf');
                    a.click();
                    window.URL.revokeObjectURL(url);
                    deferred.resolve('ok');
                },
                (error: angular.IHttpResponse<string>) => {
                    deferred.reject(this.uRLSvc.handleHttpStatus(error));
                }
            );
        return deferred.promise;
    }

    public getElementTypeClass = (element: ElementObject, elementType: string): string => {
        let elementTypeClass = '';
        if (element.type === 'InstanceSpecification') {
            elementTypeClass = 'pe-type-' + _.kebabCase(elementType);
        } else {
            elementTypeClass = 'item-type-' + _.kebabCase(elementType);
        }
        return elementTypeClass;
    };
}

veUtils.service('UtilsService', UtilsService);
