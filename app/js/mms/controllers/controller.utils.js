'use strict';

angular.module('mmsApp')
.factory('MmsAppUtils', ['$q', '$uibModal','$timeout', '$location', '$window', '$templateCache',
    '$rootScope','$compile', '$filter', '$state', 'ElementService','ViewService', 'UtilsService', 'growl','_', MmsAppUtils]);

/**
 * @ngdoc service
 * @name mmsApp.MmsAppUtils
 * 
 * @description
 * Utilities
 */
function MmsAppUtils($q, $uibModal, $timeout, $location, $window, $templateCache, 
    $rootScope, $compile, $filter, $state, ElementService, ViewService, UtilsService, growl, _) {

    var addPeCtrl = function($scope, $uibModalInstance, $filter) {

        $scope.oking = false;
        $scope.newPe = {name:''};
        $scope.createForm = true;

        var addPECallback = function(elementOb) {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            var instanceVal = {
                instanceId: elementOb.id,
                type: "InstanceValue"
            };
            ViewService.addElementToViewOrSection($scope.viewOrSectionOb, instanceVal)
                .then(function(data) {
                    // Broadcast message to TreeCtrl:
                    $rootScope.$broadcast('viewctrl.add.element', elementOb, $scope.presentationElemType.toLowerCase(), $scope.viewOrSectionOb);
                    growl.success("Adding "+$scope.presentationElemType+"  Successful");
                    $uibModalInstance.close(data);
                }, function(reason) {
                    growl.error($scope.presentationElemType+" Add Error: " + reason.message);
                }).finally(function() {
                $scope.oking = false;
            });
        };

        var peFilterQuery = function () {
            var classIdOb = {};
            if ($scope.presentationElemType === 'Table') {
                classIdOb.classifierIds = ViewService.TYPE_TO_CLASSIFIER_ID.TableT;
            } else if ($scope.presentationElemType === 'List') {
                classIdOb.classifierIds  = ViewService.TYPE_TO_CLASSIFIER_ID.ListT;
            } else if ($scope.presentationElemType === 'Image') {
                classIdOb.classifierIds = ViewService.TYPE_TO_CLASSIFIER_ID.Figure;
            } else if ($scope.presentationElemType === 'Paragraph') {
                classIdOb.classifierIds = ViewService.TYPE_TO_CLASSIFIER_ID.ParagraphT;
            } else if ($scope.presentationElemType === 'Section') {
                classIdOb.classifierIds = ViewService.TYPE_TO_CLASSIFIER_ID.SectionT;
            } else {
                classIdOb.classifierIds = ViewService.TYPE_TO_CLASSIFIER_ID[$scope.presentationElemType];
            }
            var obj = {};
            obj.term = classIdOb;
            return obj;
        };

        $scope.searchOptions = {
            callback: addPECallback,
            itemsPerPage: 200,
            filterQueryList: [peFilterQuery]
        };

        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;

            ViewService.createInstanceSpecification($scope.viewOrSectionOb, $scope.presentationElemType, $scope.newPe.name)
            .then(function(data) {
                var elemType = $scope.presentationElemType.toLowerCase();
                $rootScope.$broadcast('viewctrl.add.element', data, elemType, $scope.viewOrSectionOb);
                $rootScope.$broadcast('view-reorder.refresh');
                growl.success("Adding "+$scope.presentationElemType+"  Successful");
                $uibModalInstance.close(data);
            }, function(reason) {
                growl.error($scope.presentationElemType+" Add Error: " + reason.message);
            }).finally(function() {
                $scope.oking = false;
            }); 
        };

        $scope.cancel = function() {
            $uibModalInstance.dismiss();
        };
    };

    /**
     * @ngdoc method
     * @name mmsApp.MmsAppUtils#addPresentationElement
     * @methodOf mmsApp.MmsAppUtils
     *
     * @description
     * Utility to add a new presentation element to view or section
     *
     * @param {Object} $scope controller scope, expects $scope.ws (string) and $scope.site (object) to be there
     * @param {string} type type of presentation element (Paragraph, Section)
     * @param {Object} viewOrSection the view or section (instance spec) object
     */
    var addPresentationElement = function($scope, type, viewOrSectionOb) {
        $scope.viewOrSectionOb = viewOrSectionOb;
        $scope.presentationElemType = type;
        var templateUrlStr = 'partials/mms/add-pe.html';

        var instance = $uibModal.open({
            templateUrl: templateUrlStr,
            scope: $scope,
            controller: ['$scope', '$uibModalInstance', '$filter', addPeCtrl]
        });
        instance.result.then(function(data) {
              // TODO: do anything here?
        });
    };

    var tableToCsv = function(isDoc) { //Export to CSV button Pop-up Generated Here
         var modalInstance = $uibModal.open({
            templateUrl: 'partials/mms/tableExport.html',
            controller: function($scope, $uibModalInstance, type) {
                $scope.type = type;
                $scope.export = function() {
                    $uibModalInstance.close('export');
                };
                $scope.cancel = function() {
                    $uibModalInstance.dismiss();
                };
            },
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
                    } else 
                      tableObj.caption = 'no caption';
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

    /*
        ob = document or view object
        refOb = reference object
        refOb = reference object
        isDoc = if ob is view or doc
        mode: 1 = browser print, 2 = word, 3 = pdf
    */
    var printModal = function(viewOrDocOb, refOb, isDoc, mode) {
        var deferred = $q.defer();
        var modalInstance = $uibModal.open({
            templateUrl: 'partials/mms/printConfirm.html',
            controller: function($scope, $uibModalInstance) {
                $scope.type = isDoc ? 'DOCUMENT' : 'VIEW';
                $scope.action = 'print';
                $scope.genpdf = false;
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
                        if (refOb && refOb.type === 'Tag')
                            $scope.meta['top-right'] = $scope.meta['top-right'] + ' ' + refOb.name;
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
                if (mode === 2)
                    $scope.action = 'save';
                if (mode === 3) {
                    $scope.action = 'generate pdf';
                    $scope.genpdf = true;
                }
                $scope.docOption = (!isDoc && mode === 3);
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
            },
            backdrop: 'static',
            keyboard: false
        });
        modalInstance.result.then(function(choice) {
            if (choice[0] === 'ok') {
                printOrGenerate(viewOrDocOb, refOb, isDoc, choice[1], choice[2], choice[3], mode, choice[4])
                .then(function(result) {
                    var css = UtilsService.getPrintCss(result.header, result.footer, result.dnum, result.tag, result.displayTime, choice[4], choice[5]);
                    var cover = result.cover;
                    var toc = result.toc;
                    var tof = result.tof;
                    var tot = result.tot;
                    var toe = result.toe;
                    var contents = result.contents;
                    if (mode === 1 || mode === 2) {
                        var inst = '';
                        if (mode === 2) {
                            inst = "<div>(Copy and paste into Word)</div>";
                        }
                        var popupWin = $window.open('about:blank', '_blank', 'width=800,height=600,scrollbars=1,status=1,toolbar=1,menubar=1');
                        popupWin.document.open();
                        popupWin.document.write('<html><head><style>' + css + '</style></head><body style="overflow: auto">' + inst + cover + toc + tot + tof + toe + contents + '</body></html>');
                        popupWin.document.close();
                        if (mode === 1) {
                            $timeout(function() {
                                popupWin.print();
                            }, 1000, false);
                        }
                    } else {//TODO server changes for doc object
                        var doc = {
                            docId: viewOrDocOb.id,
                            header: result.header,
                            footer: result.footer,
                            html: result.contents,
                            cover: result.cover,
                            time: result.displayTime,
                            displayTime: result.displayTime,
                            toc: result.toc,
                            tof: result.tof + result.toe,
                            tot: result.tot,
                            dnum: result.dnum,
                            workspace: refOb.id,
                            customCss: css,
                            version: result.version,
                            name: viewOrDocOb.id + '_' + refOb.id + '_' + new Date().getTime(),
                            disabledCoverPage: isDoc ? false : true
                        };
                        if (!choice[2]) {
                            doc.tof = '<div style="display:none;"></div>';
                            doc.tot = '<div style="display:none;"></div>';
                        } else if (choice[3]) { //let server scrape html for now
                            doc.tof = '';
                            doc.tot = '';
                        }
                        //TODO this might need to be updated
                        if (refOb.type != 'Tag')
                            doc.tagId = 'Latest';
                        else
                            doc.tagId = refOb.name;
                        UtilsService.convertHtmlToPdf(doc, viewOrDocOb._projectId, viewOrDocOb._refId)
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
        }, function() {
            deferred.reject();
        });
        return deferred.promise;
    };

    /*
        ob = document or view object
        ws = workspace id
        time = timestamp or latest
        tag = tag object
        isDoc = ob is view or doc
        genCover = generate default cover page
        genTotf = whether to gen table of figures and tables
        mode: 1 = print, 2 = word, 3 = pdf
        returns promise that resolves with
        {
            cover: cover page html
            contents: main content html
            header: header string or ''
            footer: footer string or ''
            displayTime: human readable time
            dnum: document d number
            version: version string from doc tag
            toc: toc html
            tag: tagname or ''
        }
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
        var tableAndFigTOC = UtilsService.makeTablesAndFiguresTOC($rootScope.ve_treeApi.get_rows(), printElementCopy, false, htmlTotf);
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
        if (mode === 2)
            printElementCopy.find('.mms-svg').remove();
        else
            printElementCopy.find('.mms-png').remove();
        printElementCopy.find('p:empty').remove();
        printElementCopy.find('p').each(function() {
            var $this = $(this);
            if ($this.html().replace(/\s|&nbsp;/g, '').length === 0)
                $this.remove();
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
            for (i = 0; i < childIds.length; i++) {
                var child = mapping[childIds[i]];
                if (child) { //what if not found??
                    childPromises.push(handleChildViews(child, childAggrs[i], projectId, refId, curItemFunc, childrenFunc, seenViews));
                    childNodes.push(curItemFunc(child, childAggrs[i]));
                }
            }
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
        addPresentationElement: addPresentationElement,
        printModal: printModal,
        tableToCsv: tableToCsv,
        handleChildViews: handleChildViews,
        refreshNumbering: refreshNumbering
    };
}
    