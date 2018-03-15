'use strict';

angular.module('mmsApp')
.factory('MmsAppUtils', ['$q', '$uibModal','$timeout', '$location', '$window', '$templateCache',
    '$rootScope','$compile', '$filter', '$state', 'ElementService','ViewService', 'UtilsService', '_', MmsAppUtils]);

/**
 * @ngdoc service
 * @name mmsApp.MmsAppUtils
 *
 * @description
 * Utilities
 */
function MmsAppUtils($q, $uibModal, $timeout, $location, $window, $templateCache,
    $rootScope, $compile, $filter, $state, ElementService, ViewService, UtilsService, _) {

    var tableToCsv = function(isDoc) { //Export to CSV button Pop-up Generated Here
         var modalInstance = $uibModal.open({
            templateUrl: 'partials/mms/tableExport.html',
            controller: ["$scope", "$uibModalInstance", "type", function($scope, $uibModalInstance, type) {
                $scope.type = type;
                $scope.export = function() {
                    $uibModalInstance.close('export');
                };
                $scope.cancel = function() {
                    $uibModalInstance.dismiss();
                };
            }],
            resolve: {
                type: function() { return isDoc ? 'DOCUMENT' : 'VIEW';}
            },
            backdrop: 'static',
            keyboard: false
        });

        var string = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>' +
            '<script>';
            string += 'function doClick(id) { ' +
            'var csvString = document.getElementById(id).value;' +
            'var blob = new Blob(["\\uFEFF" + csvString], { ' +
            '    type: "text/csv;charset=utf-8;" ' +
            '}); ' +
            '' +
            'if (window.navigator.msSaveOrOpenBlob) { ' +
            '    navigator.msSaveBlob(blob,\'TableData.csv\'); ' +
            '} else { ' +
            '' +
            '    var downloadContainer = $(\'<div data-tap-disabled="true"><a></a></div>\'); ' +
            '    var downloadLink = $(downloadContainer.children()[0]); ' +
            '    downloadLink.attr(\'href\', window.URL.createObjectURL(blob)); ' +
            '    downloadLink.attr(\'download\', \'TableData.csv\'); ' +
            '    downloadLink.attr(\'target\', \'_blank\'); ' +
            ' ' +
            '    $(window.document).find(\'body\').append(downloadContainer); ' +
            '    /* $timeout(function () { */ ' +
            '        downloadLink[0].click(); ' +
            '        downloadLink.remove(); ' +
            '    /* }, null); */ ' +
            '} ' +
            '} ';
        string += '</script>';

        modalInstance.result.then(function(choice) {
            if (choice === 'export') {
               var tableCSV = [];
               // Grab all tables and run export to csv fnc
                angular.element('#print-div').find("table").each(function(elt){
                    var tableObj = {};
                    if (this.caption) {
                        tableObj.caption = this.caption.innerHTML;
                    } else {
                        tableObj.caption = 'no caption';
                    }
                    tableObj.val = angular.element(this).table2CSV({delivery:'value'});
                    tableCSV.push(tableObj);
                });
                var exportPopup = function(data) {
                    var generator = window.open('', 'csv', 'height=600,width=800,scrollbars=1');
                    generator.document.write('<html><head><title>Tables to CSV</title>');
                    generator.document.write('</head><body >');
                    generator.document.write(data);
                    generator.document.write('</body></html>');
                    generator.document.close();
                    return true;
                };
                // generate text area content for popup
                var genTextArea ='';
                var num = 0;
                angular.element(tableCSV).each(function(){
                    genTextArea += '<h2>'+ this.caption +'</h2><div><button class="btn btn-sm btn-primary" onclick="doClick(\'textArea'+num+'\')">Save CSV</button></div><textArea cols=100 rows=15 wrap="off" id="textArea'+num+'">';
                    genTextArea += this.val + '</textArea>';
                    num++;
                });
                genTextArea += string;
                exportPopup(genTextArea);
            }
        });
    };

    /**
     * @ngdoc method
     * @name mmsApp.MmsAppUtils#printModal
     * @methodOf mmsApp.MmsAppUtils
     *
     * @description
     * Click handler for print and export buttons. Opens modal or print 
     * confirmation and options to select from
     *
     * @param {Object} viewOrDocOb current document or view object
     * @param {Object} refOb current branch/tag object
     * @param {Boolean} isDoc viewOrDocOb is view or doc
     * @param {Number} mode 1 = print, 2 = word, 3 = pdf
     * @returns {Promise} The promise returned from UtilsService.exportHtmlAs - server response
     *
     */
    var printModal = function(viewOrDocOb, refOb, isDoc, mode) {
        var deferred = $q.defer();
        var modalInstance = $uibModal.open({
            templateUrl: 'partials/mms/printConfirm.html',
            controller: ["$scope", "$uibModalInstance", function($scope, $uibModalInstance) {
                $scope.type = isDoc ? 'DOCUMENT' : 'VIEW';
                $scope.action = mode === 1 ? 'print' : mode === 3 ? 'generate pdf' : 'generate word';
                $scope.label = mode === 3 ? 'pdf' : mode === 2 ? 'word' : '';
                $scope.mode = mode;
                $scope.meta = {
                    'top-left': 'loading...', top: 'loading...', 'top-right': 'loading...',
                    'bottom-left': 'loading...', bottom: 'loading...', 'bottom-right': 'loading...'
                };
                if (isDoc) {
                    ViewService.getDocMetadata({
                        elementId: viewOrDocOb.id,
                        projectId: viewOrDocOb._projectId,
                        refId: viewOrDocOb._refId
                    }, 2).then(function(metadata) {
                        $scope.meta.top = metadata.header ? metadata.header : '';
                        $scope.meta.bottom = metadata.footer ? metadata.footer : '';
                        $scope.meta['top-left'] = metadata.dnumber ? metadata.dnumber : '';
                        $scope.meta['top-right'] = metadata.version ? metadata.version : '';
                        if (refOb && refOb.type === 'Tag') {
                            $scope.meta['top-right'] = $scope.meta['top-right'] + ' ' + refOb.name;
                        }
                        var displayTime = refOb.type === 'Tag' ? refOb._timestamp : 'latest';
                        if (displayTime === 'latest') {
                            displayTime = new Date();
                            displayTime = $filter('date')(displayTime, 'M/d/yy h:mm a');
                        }
                        $scope.meta['top-right'] = $scope.meta['top-right'] + ' ' + displayTime;
                        $scope.meta['bottom-left'] = '';
                        $scope.meta['bottom-right'] = 'counter(page)';
                    }, function(reason) {
                        $scope.meta['top-left'] = $scope.meta.top = $scope.meta['top-right'] = $scope.meta['bottom-left'] = $scope.meta.bottom = '';
                        $scope.meta['bottom-right'] = 'counter(page)';
                    });
                }
                $scope.unsaved = ($rootScope.ve_edits && !_.isEmpty($rootScope.ve_edits));
                $scope.docOption = (!isDoc && (mode === 3 || mode === 2));
                $scope.model = {genCover: false, genTotf: false, landscape: false, htmlTotf: false};
                $scope.print = function() {
                    $uibModalInstance.close(['ok', $scope.model.genCover, $scope.model.genTotf, $scope.model.htmlTotf, $scope.model.landscape, $scope.meta]);
                };
                $scope.fulldoc = function() {
                    $uibModalInstance.close(['fulldoc']);
                };
                $scope.cancel = function() {
                    $uibModalInstance.dismiss();
                };
            }],
            backdrop: 'static',
            keyboard: false
        });
        /* choice:
        ['ok', $scope.model.genCover, $scope.model.genTotf, $scope.model.htmlTotf, $scope.model.landscape, $scope.meta]
        [0] 'ok' - modal button to confirm print/export
        [1] Generate cover page option
        [2] Generate List of Tables and Figures option
        [3] HTML option checked - used to generate ToC from html
        [4] Landscape option
        [5] metadata:
            bottom, bottom-left, bottom-right, top, top-left, top-right
        */
        modalInstance.result.then(function(choice) {
            if (choice[0] === 'ok') {
                printOrGenerate(viewOrDocOb, refOb, isDoc, choice[1], choice[2], choice[3], mode, choice[4])
                .then(function(result) {
                    var css = UtilsService.getPrintCss(result.header, result.footer, result.dnum, result.tag, result.displayTime, choice[3], choice[4], choice[5]);
                    result.toe = choice[3] ? '' : result.toe;
                    if (mode === 1) {
                        var popupWin = $window.open('about:blank', '_blank', 'width=800,height=600,scrollbars=1,status=1,toolbar=1,menubar=1');
                        popupWin.document.open();
                        popupWin.document.write('<html><head><style>' + css + '</style></head><body style="overflow: auto">' + result.cover + result.toc + result.tot + result.tof + result.toe + result.contents + '</body></html>');
                        popupWin.document.close();
                        $timeout(function() {
                            popupWin.print();
                        }, 1000, false);

                    } else {
                      result.tof = choice[2] ? result.tof + result.toe : '<div style="display:none;"></div>';
                      result.tot = choice[2] ? result.tot : '<div style="display:none;"></div>';
                      var name = viewOrDocOb.name + new Date().getTime();
                      var htmlString = ['<html><head><title>', name, '</title><style>', css, '</style></head><body style="overflow: auto">', result.cover, result.toc, result.tot, result.tof, result.contents, '</body></html>' ].join('');
                      UtilsService.exportHtmlAs(mode, {htmlString: htmlString, name: name, projectId: viewOrDocOb._projectId, refId: viewOrDocOb._refId})
                        .then(function(reuslt) {
                            deferred.resolve(result);
                        }, function(reason){
                            deferred.reject(reason);
                        });
                    }
                });
            } else {
                $rootScope.ve_fullDocMode = true;
                $rootScope.ve_bbApi.setToggleState('tree-full-document', true);
                $state.go('project.ref.document.full', {search: undefined});
            }
        });
        return deferred.promise;
    };


    /**
     * @ngdoc method
     * @name mmsApp.MmsAppUtils#printOrGenerate
     * @methodOf mmsApp.MmsAppUtils
     *
     * @description
     * Called by printModal to handle cleanup and building content needed for 
     * print, PDF or word export.
     * Cleansup html i.e. removes mms errors, no-print, ng-hide
     *
     * @param {Object} viewOrDocOb current document or view object
     * @param {Object} refOb current branch/tag object
     * @param {Boolean} isDoc viewOrDocOb is view or doc
     * @param {Boolean} genCover generate default cover page (option from the modal form)
     * @param {Boolean} genTotf whether to gen table of figures and tables (option from the modal form)
     * @param {Boolean} htmlTotf include DocGen generated tables and rapid tables (option from the modal form)
     * @param {Number} mode 1 = print, 2 = word, 3 = pdf
     * @param {Boolean} landscape PDF in lanscape vie (option from the modal form)
     * @returns {Promise} The promise returns object with content needed for print/word export/PDf generation
     * <pre>
     * {
     *      cover: cover page html
     *      contents: main content html
     *      header: header string or ''
     *      footer: footer string or ''
     *      displayTime: human readable time
     *      dnum: document d number
     *      version: version string from doc tag
     *      toc: toc html
     *      tag: tagname or ''
     * }
     * </pre>
     */
    var printOrGenerate = function(viewOrDocOb, refOb, isDoc, genCover, genTotf, htmlTotf, mode, landscape) {
        var deferred = $q.defer();
        var printContents = '';
        var printElementCopy = angular.element("#print-div");
        printElementCopy.find('table').addClass(function() {
            if ($(this).find('table').length > 0 || $(this).find('img').length > 0) {
                return 'big-table';
            }
            return '';
        });
        printElementCopy = printElementCopy.clone();
        var hostname = $location.host();
        var port = $location.port();
        var protocol = $location.protocol();
        var absurl = $location.absUrl();
        var prefix = protocol + '://' + hostname + ((port == 80 || port == 443) ? '' : (':' + port));
        var mmsIndex = absurl.indexOf('mms.html');
        var toc = UtilsService.makeHtmlTOC($rootScope.ve_treeApi.get_rows());
        var tableAndFigTOC = {figures: '', tables: '', equations: ''};
        UtilsService.convertViewLinks(printElementCopy);
        if (genTotf) {
            tableAndFigTOC = UtilsService.makeTablesAndFiguresTOC($rootScope.ve_treeApi.get_rows(), printElementCopy, false, htmlTotf);
        }
        var tof = tableAndFigTOC.figures;
        var tot = tableAndFigTOC.tables;
        var toe = tableAndFigTOC.equations;
        if (!isDoc) {
            toc = tof = tot = toe = '';
        }
        angular.element(printElementCopy).find("a").attr('href', function(index, old) {
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

        var comments = printElementCopy.find('mms-transclude-com');
        comments.remove();
        printElementCopy.find('div.tableSearch').remove();
        printElementCopy.find('.mms-error').html('error');
        printElementCopy.find('.no-print').remove();
        printElementCopy.find('.ng-hide').remove();
        printElementCopy.find('.mms-png').remove();
        printElementCopy.find('p:empty').remove();
        printElementCopy.find('p').each(function() {
            var $this = $(this);
            if ($this.html().replace(/\s|&nbsp;/g, '').length === 0) {
                $this.remove();
            }
        });
        printElementCopy.find('[width]').not('img').removeAttr('width');
        printElementCopy.find('[style]').each(function() {
            this.style.removeProperty('font-size');
            this.style.removeProperty('width');
            this.style.removeProperty('min-width');
        });
        printElementCopy.find('.math').remove(); //this won't work in chrome for popups since chrome can't display mathml
        printElementCopy.find('script').remove();
        //printElementCopy.find('.MJX_Assistive_MathML').remove(); //pdf generation need mathml version
        var coverTemplateString = $templateCache.get('partials/mms/docCover.html');
        var coverTemplateElement = angular.element(coverTemplateString);
        var cover = '';
        if (!genCover && isDoc) {
            cover = printElementCopy.find("mms-view[mms-element-id='" + viewOrDocOb.id + "']");
            cover.remove();
            cover = cover[0].outerHTML;
        }
        var newScope = $rootScope.$new();
        //var useCover = false;
        printContents = printElementCopy[0].outerHTML;
        var header = '';
        var footer = '';
        var displayTime = '';
        var dnum = '';
        var version = '';
        var tagname = '';
        if (refOb)
            tagname = refOb.name;
        if (!isDoc) {
            deferred.resolve({cover: cover, contents: printContents, header: header, footer: footer, displayTime: displayTime, dnum: dnum, version: version, toc: toc, tag: tagname, tof: tof, tot: tot, toe: toe});
            return deferred.promise;
        }
        ViewService.getDocMetadata({
            elementId: viewOrDocOb.id,
            projectId: viewOrDocOb._projectId,
            refId: viewOrDocOb._refId
        }, 2).then(function(metadata) {
            //useCover = true;
            newScope.meta = metadata;
            newScope.tag = refOb;
            newScope.time = refOb.type != 'Tag' ? new Date() : refOb._timestamp;
            displayTime = $filter('date')(newScope.time, 'M/d/yy h:mm a');
            newScope.meta.title = viewOrDocOb.name;
            header = metadata.header ? metadata.header : header;
            footer = metadata.footer ? metadata.footer : footer;
            if (metadata.dnumber)
                dnum = metadata.dnumber;
            if (metadata.version)
                version = metadata.version;
            $compile(coverTemplateElement.contents())(newScope);
        }).finally(function() {
            $timeout(function() {
                if (genCover) {
                    cover = coverTemplateElement[0].innerHTML;
                }
                deferred.resolve({cover: cover, contents: printContents, header: header, footer: footer, displayTime: displayTime, dnum: dnum, version: version, toc: toc, tag: tagname, tof: tof, tot: tot, toe: toe});
            }, 0, false);
        });
        return deferred.promise;
    };

    var handleChildViews = function(v, aggr, projectId, refId, curItemFunc, childrenFunc, seen) {
        var seenViews = seen;
        if (!seenViews)
            seenViews = {};
        var deferred = $q.defer();
        var curItem = curItemFunc(v, aggr);
        seenViews[v.id] = v;
        var childIds = [];
        var childAggrs = [];
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
        }
        ElementService.getElements({
            elementIds: childIds,
            projectId: projectId,
            refId: refId
        }, 2).then(function(childViews) {
            var mapping = {};
            for (var i = 0; i < childViews.length; i++) {
                mapping[childViews[i].id] = childViews[i];
            }
            var childPromises = [];
            var childNodes = [];
            var processedChildViews = [];
            for (i = 0; i < childIds.length; i++) {
                var child = mapping[childIds[i]];
                if (child && UtilsService.isView(child)) { //what if not found??
                    childPromises.push(handleChildViews(child, childAggrs[i], projectId, refId, curItemFunc, childrenFunc, seenViews));
                    childNodes.push(curItemFunc(child, childAggrs[i]));
                    processedChildViews.push({id: child.id, aggregation: childAggrs[i]});
                }
            }
            v._childViews = processedChildViews;
            childrenFunc(curItem, childNodes);
            $q.all(childPromises).then(function(childNodes) {
                deferred.resolve(curItem);
            }, function(reason) {
                deferred.reject(reason);
            });
        }, function(reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    var refreshNumbering = function(tree, centerElement) {
        UtilsService.makeTablesAndFiguresTOC(tree, centerElement, true, false);
    };

    return {
        printModal: printModal,
        tableToCsv: tableToCsv,
        handleChildViews: handleChildViews,
        refreshNumbering: refreshNumbering
    };
}

