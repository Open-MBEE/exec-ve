import * as angular from 'angular';

import {StateService} from '@uirouter/angularjs'
import {ElementService} from "../../mms/services/ElementService.service";
import {ViewService} from "../../mms/services/ViewService.service";
import {UtilsService} from "../../mms/services/UtilsService.service";
import {EventService} from "../../mms/services/EventService.service";
import {TreeService} from "../../mms/services/TreeService.service";
import {EditService} from "../../mms/services/EditService.service";

var mmsApp = angular.module('mmsApp');



/**
 * @ngdoc service
 * @name AppUtilsService
 *
 * @description
 * Utilities
 */
export class AppUtilsService implements angular.Injectable<any> {
    private style: any;


    constructor(private $q: angular.IQService, private $uibModal: angular.ui.bootstrap.IModalService,
                private $timeout: angular.ITimeoutService, private $location: angular.ILocationService,
                private $window: angular.IWindowService, private growl: angular.growl.IGrowlService,
                private $filter: angular.IFilterService, private $state: StateService, private elementSvc: ElementService,
                private viewSvc: ViewService, private utilsSvc: UtilsService, private eventSvc: EventService, 
                private treeSvc: TreeService) {
        
    }

        public tableToCsv(tables: JQLite, isDoc: boolean) { //Export to CSV button Pop-up Generated Here
            var modalInstance = this.$uibModal.open({
                component: 'tableExportModal',
                resolve: {
                    type: () => {
                        return isDoc ? 'DOCUMENT' : 'VIEW';
                    }
                },
                backdrop: 'static',
                keyboard: false
            });

            var string: string = `
            <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
<script>
function doClick(id) {
var csvString = document.getElementById(id).value;
var blob = new Blob(["\\uFEFF" + csvString], { 
    type: "text/csv;charset=utf-8;" 
}); 

if (window.navigator.msSaveOrOpenBlob) { 
    navigator.msSaveBlob(blob,\'TableData.csv\'); 
} else { 

    var downloadContainer = $(\'<div data-tap-disabled="true"><a></a></div>\'); 
    var downloadLink = $(downloadContainer.children()[0]); 
    downloadLink.attr(\'href\', window.URL.createObjectURL(blob)); 
    downloadLink.attr(\'download\', \'TableData.csv\'); 
    downloadLink.attr(\'target\', \'_blank\'); 
 
    $(window.document).find(\'body\').append(downloadContainer); 
    /* this.$timeout(() => { */ 
        downloadLink[0].click(); 
        downloadLink.remove(); 
    /* }, null); */ 
} 
}
</script>
`

            modalInstance.result.then( (data) => {
                let choice = data.$value;
                if (choice === 'export') {
                    var tableCSV = [];
                    // Grab all tables and run export to csv fnc
                    tables.find("table").each((index: number, elt: HTMLElement) => {
                        var tableObj = {
                            caption: 'no caption',
                            val: angular.element(elt).table2CSV({delivery: 'value'})
                        };
                        if ((<HTMLTableElement>elt).caption) {
                            tableObj.caption = (<HTMLTableElement>elt).caption.innerHTML;
                        }
                        tableCSV.push(tableObj);
                    });
                    let exportPopup = (data) => {
                        var generator = window.open('', 'csv', 'height=600,width=800,scrollbars=1');
                        generator.document.write('<html><head><title>Tables to CSV</title>');
                        generator.document.write('</head><body >');
                        generator.document.write(data);
                        generator.document.write('</body></html>');
                        generator.document.close();
                        return true;
                    };
                    // generate text area content for popup
                    var genTextArea = '';
                    var num = 0;
                    angular.element(tableCSV).each((index, element) => {
                        genTextArea += '<h2>' + element.caption + '</h2><div><button class="btn btn-sm btn-primary" onclick="doClick(\'textArea' + num + '\')">Save CSV</button></div><textArea cols=100 rows=15 wrap="off" id="textArea' + num + '">';
                        genTextArea += element.val + '</textArea>';
                        num++;
                    });
                    genTextArea += string;
                    exportPopup(genTextArea);
                }
            });
        };

        /**
         * @ngdoc method
         * @name mmsApp.AppUtilsService#printModal
         * @methodOf mmsApp.AppUtilsService
         *
         * @description
         * Click handler for print and export buttons. Opens modal or print
         * confirmation and options to select from
         *
         * @param {JQLite} printElement current angular.element
         * @param {Object} viewOrDocOb current document or view object
         * @param {Object} refOb current branch/tag object
         * @param {Boolean} isDoc viewOrDocOb is view or doc
         * @param {Number} mode 1 = print, 2 = word, 3 = pdf
         * @returns {Promise} The promise returned from this.utilsSvc.exportHtmlAs - server response
         *
         */
        public printModal(printElement: JQLite, viewOrDocOb, refOb, isDoc, mode) {
            var deferred = this.$q.defer();
            var modalInstance = this.$uibModal.open({
            component: 'partials/mms/printConfirm.html',
            resolve: {
                print: () => {
                    return printElement;
                },
                viewOrDocOb: () => {
                    return viewOrDocOb;
                },
                isDoc: () => {
                    return isDoc;
                },
                mode: () => {
                    return mode;
                }
            },
            backdrop: 'static',
            keyboard: false
            });
            /* choice:
            ['ok', $scope.model.genTotf, $scope.model.htmlTotf, $scope.model.landscape, $scope.meta]
            [0] 'ok' - modal button to confirm print/export
            [1] Generate List of Tables and Figures option
            [2] HTML option checked - used to generate ToC from html
            [3] Landscape option
            [4] metadata:
                bottom, bottom-left, bottom-right, top, top-left, top-right
            [5] customization: CSS String || false
            */
            modalInstance.result.then((choice) => {
                if (choice[0] === 'ok') {
                    var result = this.printOrGenerate(viewOrDocOb, mode, isDoc, choice[1], choice[2]);
                    var customization = choice[5];
                    var css = customization ? customization : this.utilsSvc.getPrintCss(choice[2], choice[3], choice[4]);
                    result.toe = choice[2] ? '' : result.toe;
                    if (mode === 1) {
                        var popupWin = this.$window.open('about:blank', '_blank', 'width=800,height=600,scrollbars=1,status=1,toolbar=1,menubar=1');
                        popupWin.document.open();
                        popupWin.document.write('<html><head><title>' + viewOrDocOb.name + '</title><style type="text/css">' + css + '</style></head><body style="overflow: auto">' + result.cover + result.toc + result.tot + result.tof + result.toe + result.contents + '</body></html>');
                        popupWin.document.close();
                        this.$timeout(() => {
                            popupWin.print();
                        }, 1000, false);
                    } else {
                        result.tof = choice[1] ? result.tof + result.toe : '';
                        result.tot = choice[1] ? result.tot : '';
                        var htmlArr = ['<html><head><title>' + viewOrDocOb.name + '</title><style type="text/css">', css, '</style></head><body>', result.cover];
                        if (result.toc != '') htmlArr.push(result.toc);
                        if (result.tot != '') htmlArr.push(result.tot);
                        if (result.tof != '') htmlArr.push(result.tof);
                        htmlArr.push(result.contents, '</body></html>');
                        var htmlString = htmlArr.join('');
                        this.utilsSvc.exportHtmlAs(mode, {
                            htmlString: htmlString,
                            name: viewOrDocOb.name,
                            projectId: viewOrDocOb._projectId,
                            refId: viewOrDocOb._refId,
                            css: css
                        })
                            .then((result) => {
                                deferred.resolve(result);
                            }, (reason) => {
                                deferred.reject(reason);
                            });
                    }
                } else {
                    this.eventSvc.$broadcast('tree-full-document', {search: undefined});
                }
            });
            return deferred.promise;
        };


        /**
         * @ngdoc method
         * @name mmsApp.AppUtilsService#printOrGenerate
         * @methodOf mmsApp.AppUtilsService
         *
         * @description
         * Called by printModal to handle cleanup and building content needed for
         * print, PDF or word export.
         * Cleansup html i.e. removes no-print, ng-hide
         *
         * @param {Object} viewOrDocOb current document or view object
         * @param {Number} mode 1 = print, 2 = word, 3 = pdf
         * @param {Boolean} isDoc viewOrDocOb is view or doc
         * @param {Boolean} genTotf whether to gen table of figures and tables (option from the modal form)
         * @param {Boolean} htmlTotf include DocGen generated tables and rapid tables (option from the modal form)
         * @returns {Object} Returns object with content needed for print/word export/PDF generation
         * <pre>
         * {
         *      cover: cover page html,
         *      contents: main content html,
         *      toc: table of contents html,
         *      tof: table of figures html,
         *      tot: table of tables html,
         *      toe: table of equations html
         * }
         * </pre>
         */
        public printOrGenerate(viewOrDocOb, mode, isDoc, genTotf, htmlTotf) {
            var printContents = '';
            var printElementCopy = angular.element("#print-div");

            // Conversion of canvas to its dataUrl must be done before "clone", because "clone" doesn't preserve
            // canvas' content
            var mapping = this._storeTomsawyerDiagramAsImg(printElementCopy);
            printElementCopy = printElementCopy.clone();
            this._replaceMmsTsDiagramWithImg(printElementCopy, mapping);

            var hostname = this.$location.host();
            var port = this.$location.port();
            var protocol = this.$location.protocol();
            var absurl = this.$location.absUrl();
            var prefix = protocol + ':// hostname' + ((port == 80 || port == 443) ? '' : (':' + port));
            var mmsIndex = absurl.indexOf('index.html');
            var toc = this.utilsSvc.makeHtmlTOC(this.treeSvc.treeRows);

            // Conver to proper links for word/pdf
            this.utilsSvc.convertViewLinks(printElementCopy);

            // Get correct table/image numbering based on doc hierarchy
            var tableAndFigTOC = this.utilsSvc.makeTablesAndFiguresTOC(this.treeSvc.treeRows, printElementCopy, false, htmlTotf);
            var tof = tableAndFigTOC.figures;
            var tot = tableAndFigTOC.tables;
            var toe = tableAndFigTOC.equations;

            // Customize TOC based on user choice
            if (!isDoc) {
                toc = tof = tot = toe = '';
            }
            if (!genTotf) {
                tof = tot = toe = '';
            }
            angular.element(printElementCopy).find("a").attr('href', (index, old) => {
                if (!old)
                    return old;
                if (old.indexOf('/') === 0)
                    return prefix + old;
                if (old.indexOf('../../') === 0)
                    return prefix + old.substring(5);
                if (old.indexOf('../') === 0)
                    return prefix + '/alfresco' + old.substring(2);
                if (old.indexOf('mms.html') === 0)
                    return absurl.substring(0, mmsIndex) + old;
                return old;
            });

            // Remove comments, table features, and all elements with classes: mms-error, no-print, ng-hide
            printElementCopy.find('mms-transclude-com').remove();
            printElementCopy.find('style').remove(); //prevent user inserted styles from interfering
            printElementCopy.find('div.tableSearch').remove();
            //printElementCopy.find('.mms-error').html('error');
            printElementCopy.find('.no-print').remove();
            printElementCopy.find('.ng-hide').remove();

            // word doesn't support svg only png.
            if (mode === 2) {
                printElementCopy.find('.mms-svg').remove();
            } else {
                printElementCopy.find('.mms-png').remove();
            }
            // Remove all empty paragraphs
            printElementCopy.find('p:empty').remove();
            printElementCopy.find('p').each(() => {
                var $this = $(this);
                if ($this.html().replace(/\s|&nbsp;/g, '').length === 0) {
                    $this.remove();
                }
            });
            printElementCopy.find('[width]').not('img').not('.ve-fixed-width').removeAttr('width');
            printElementCopy.find('[style]').not('hr').each(() => {
                this.style.removeProperty('font-size');
                this.style.removeProperty('width');
                this.style.removeProperty('min-width');
                this.style.removeProperty('height');
                //remove frozen headers and column
                this.style.removeProperty('transform');
                this.style.removeProperty('will-change');
            });
            printElementCopy.find('.math').remove(); //this won't work in chrome for popups since chrome can't display mathml
            printElementCopy.find('script').remove();
            //printElementCopy.find('.MJX_Assistive_MathML').remove(); //pdf generation need mathml version

            // Get doc cover page by doc ID
            var coverHtml = '';
            if (isDoc) {
                let cover = printElementCopy.find("mms-view[mms-element-id='" + viewOrDocOb.id + "']");
                cover.remove();
                // Add class to style cover page
                cover.addClass('ve-cover-page');
                coverHtml = cover[0].outerHTML;
            }
            printContents = printElementCopy[0].outerHTML;

            return {cover: coverHtml, contents: printContents, toc: toc, tof: tof, tot: tot, toe: toe};
        };
        //TODO: Evaluate moving to Tree Service
        public handleChildViews(v, aggr, propId, projectId, refId, curItemFunc, childrenFunc, seen?): angular.IPromise<any> {
            var seenViews = seen;
            if (!seenViews)
                seenViews = {};
            var deferred = this.$q.defer();
            var curItem = curItemFunc(v, aggr, propId);
            seenViews[v.id] = v;
            var childIds = [];
            var childAggrs = [];
            var childPropIds = [];
            if (!v._childViews || v._childViews.length === 0 || aggr === 'none') {
                if (angular.isObject(curItem) && curItem.loading) {
                    curItem.loading = false;
                }
                deferred.resolve(curItem);
                return deferred.promise;
            }
            for (var i = 0; i < v._childViews.length; i++) {
                if (seenViews[v._childViews[i].id])
                    continue;
                childIds.push(v._childViews[i].id);
                childAggrs.push(v._childViews[i].aggregation);
                childPropIds.push(v._childViews[i].propertyId);
            }
            this.elementSvc.getElements({
                elementIds: childIds,
                projectId: projectId,
                refId: refId
            }, 2).then((childViews) => {
                var mapping = {};
                for (var i = 0; i < childViews.length; i++) {
                    mapping[childViews[i].id] = childViews[i];
                }
                var childPromises = [];
                var childNodes = [];
                var processedChildViews = [];
                for (i = 0; i < childIds.length; i++) {
                    var child = mapping[childIds[i]];
                    if (child && this.utilsSvc.isView(child)) { //what if not found??
                        childPromises.push(this.handleChildViews(child, childAggrs[i], childPropIds[i], projectId, refId, curItemFunc, childrenFunc, seenViews));
                        childNodes.push(curItemFunc(child, childAggrs[i], childPropIds[i]));
                        processedChildViews.push({
                            id: child.id,
                            aggregation: childAggrs[i],
                            propertyId: childPropIds[i]
                        });
                    }
                }
                v._childViews = processedChildViews;
                childrenFunc(curItem, childNodes);
                this.$q.all(childPromises).then((childNodes) => {
                    deferred.resolve(curItem);
                }, (reason) => {
                    deferred.reject(reason);
                });
            }, (reason) => {
                deferred.reject(reason);
            });
            return deferred.promise;
        };

        public refreshNumbering(tree, centerElement) {
            this.utilsSvc.makeTablesAndFiguresTOC(tree, centerElement, true, false);
        };

        /** Store all tomsawyer diagram(canvas) as an img element **/
        private _storeTomsawyerDiagramAsImg(originalDom) {
            var mapping = {};
            originalDom.find('mms-ts-diagram').each((index, element) => {
                var tsDom = $(element);
                var canvas = tsDom.find('canvas')[0];
                if (canvas) {
                    var imgElement = $('<img>');
                    imgElement.attr({'src': canvas.toDataURL(), 'width': '100%'});
                    mapping[index] = imgElement;
                }
            });
            return mapping;
        }

        /** Replace all mms-ts-diagram elements with their corresponding img elements **/
        private _replaceMmsTsDiagramWithImg(element, mapping) {
            element.find('mms-ts-diagram').each((index) => {
                var imgDom = mapping[index];
                $(this).replaceWith(imgDom);
            });
        }

}

AppUtilsService.$inject = ['$q', '$uibModal', '$timeout', '$location', '$window', 'growl',
    '$filter', '$state', 'ElementService','ViewService', 'UtilsService', 'EventService', 'TreeService', 'EditService']

    mmsApp.service('AppUtilsService',  AppUtilsService);

