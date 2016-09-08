'use strict';

angular.module('mmsApp')
.factory('MmsAppUtils', ['$q','$state', '$uibModal','$timeout', '$location', '$window', '$templateCache','$rootScope','$compile', '$filter', 'WorkspaceService','ConfigService','ElementService','ViewService', 'UtilsService', 'growl','_', MmsAppUtils]);

/**
 * @ngdoc service
 * @name mmsApp.MmsAppUtils
 * 
 * @description
 * Utilities
 */
function MmsAppUtils($q, $state, $uibModal, $timeout, $location, $window, $templateCache, $rootScope, $compile, $filter, WorkspaceService, ConfigService, ElementService, ViewService, UtilsService, growl, _) {

    var addElementCtrl = function($scope, $uibModalInstance, $filter) {

        $scope.oking = false;
        $scope.newItem = {};
        $scope.newItem.name = "";

        // Search for InstanceSpecs.  We are searching for InstanceSpecs b/c we only want to
        // create a InstanceValue to point to that InstanceSpec when cross-referencing.
        $scope.searchFilter = function(data) {
            var validClassifierIds = [];
            if ($scope.presentationElemType === 'Table') {
                validClassifierIds.push(ViewService.TYPE_TO_CLASSIFIER_ID.TableT);
            } else if ($scope.presentationElemType === 'List') {
                validClassifierIds.push(ViewService.TYPE_TO_CLASSIFIER_ID.ListT);
            } else if ($scope.presentationElemType === 'Image') {
                validClassifierIds.push(ViewService.TYPE_TO_CLASSIFIER_ID.Figure);
            } else if ($scope.presentationElemType === 'Paragraph') {
                validClassifierIds.push(ViewService.TYPE_TO_CLASSIFIER_ID.ParagraphT);
            } else if ($scope.presentationElemType === 'Section') {
                validClassifierIds.push(ViewService.TYPE_TO_CLASSIFIER_ID.SectionT);
            } else {
                validClassifierIds.push(ViewService.TYPE_TO_CLASSIFIER_ID[$scope.presentationElemType]);
            }
            // Filter out anything that is not a InstanceSpecification or not of the correct type:
            for (var i = 0; i < data.length; i++) {
                if (data[i].specialization.type != 'InstanceSpecification') {
                    data.splice(i, 1);
                    i--;
                }
                else if (validClassifierIds.indexOf(data[i].specialization.classifier[0]) < 0) {
                    data.splice(i, 1);
                    i--;
                } else {
                    if (data[i].properties)
                        delete data[i].properties;
                }
            }
            return data;
        };
        
        // Adds a InstanceValue to the view given the sysmlid of the InstanceSpecification
        $scope.addElement = function(element) {

            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;  
            var instanceVal = {
                instance: element.sysmlid,
                type: "InstanceValue",
                valueExpression: null
            };
            ViewService.addElementToViewOrSection($scope.viewOrSection.sysmlid, $scope.viewOrSection.sysmlid, $scope.ws, instanceVal, $scope.addPeIndex).
            then(function(data) {
                // Broadcast message to TreeCtrl:
                $rootScope.$broadcast('viewctrl.add.element', element, $scope.presentationElemType.toLowerCase(), $scope.viewOrSection);
                growl.success("Adding "+$scope.presentationElemType+"  Successful");
                $uibModalInstance.close(data);
            }, function(reason) {
                growl.error($scope.presentationElemType+" Add Error: " + reason.message);
            }).finally(function() {
                $scope.oking = false;
            });            
        };

        $scope.searchOptions= {};
        $scope.searchOptions.callback = $scope.addElement;
        $scope.searchOptions.filterCallback = $scope.searchFilter;
        $scope.searchOptions.itemsPerPage = 200;
        
        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;

            ViewService.createInstanceSpecification($scope.viewOrSection, $scope.ws, $scope.presentationElemType, null, $scope.newItem.name, $scope.addPeIndex).
            then(function(data) {
                var elemType = $scope.presentationElemType.toLowerCase();
                $rootScope.$broadcast('viewctrl.add.element', data, elemType, $scope.viewOrSection);
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
    var addPresentationElement = function($scope, type, viewOrSection) {
        var id = viewOrSection.sysmlid;
        ElementService.isCacheOutdated(id, $scope.ws)
        .then(function(status) {
            if (status.status) {
                if (viewOrSection.specialization.instanceSpecificationSpecification && !angular.equals(viewOrSection.specialization.instanceSpecificationSpecification, status.server.specialization.instanceSpecificationSpecification)) {
                    growl.error('The view section contents is outdated, refresh the page first!');
                    return;
                } else if (viewOrSection.specialization.contents && !angular.equals(viewOrSection.specialization.contents, status.server.specialization.contents)) {
                    growl.error('The view contents is outdated, refresh the page first!');
                    return;
                }
            } 
            realAddElement();

        }, function(reason) {
            growl.error('Checking if view contents is up to date failed: ' + reason.message);
            realAddElement();
        });

        function realAddElement() {
          $scope.createForm = true;
          $scope.viewOrSection = viewOrSection;
          $scope.presentationElemType = type;
          $scope.newItem = {};
          $scope.newItem.name = "";
          var templateUrlStr = 'partials/mms/add-item.html';

          var instance = $uibModal.open({
              templateUrl: templateUrlStr,
              scope: $scope,
              controller: ['$scope', '$uibModalInstance', '$filter', addElementCtrl]
          });
          instance.result.then(function(data) {
              // TODO: do anything here?
          });
        }
    };

    var tableToCsv = function(ob, ws, time, isDoc) { //Export to CSV button Pop-up Generated Here
         var modalInstance = $uibModal.open({
            templateUrl: 'partials/mms/tableExport.html',
            controller: function($scope, $uibModalInstance, type) {
                $scope.type = type;
                $scope.export = function() {
                    $uibModalInstance.close('export');
                };
                // $scope.fulldoc = function() {
                //     $uibModalInstance.close('fulldoc');
                // };
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
        ws = workspace
        time = timestamp
        tag = tag object
        isDoc = if ob is view or doc
        mode: 1 = browser print, 2 = word, 3 = pdf
    */
    var printModal = function(ob, ws, site, time, tag, isDoc, mode) {
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
                    ViewService.getDocMetadata(ob.sysmlid, ws, null, 2)
                    .then(function(metadata) {
                        $scope.meta.top = metadata.header ? metadata.header : '';
                        $scope.meta.bottom = metadata.footer ? metadata.footer : '';
                        $scope.meta['top-left'] = metadata.dnumber ? metadata.dnumber : '';
                        $scope.meta['top-right'] = metadata.version ? metadata.version : '';
                        if (tag && tag.name !== 'latest')
                            $scope.meta['top-right'] = $scope.meta['top-right'] + ' ' + tag.name;
                        var displayTime = time;
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
                $scope.unsaved = ($rootScope.veEdits && !_.isEmpty($rootScope.veEdits));
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
                printOrGenerate(ob, ws, time, tag, isDoc, choice[1], choice[2], choice[3], mode, choice[4])
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
                    } else {
                        var doc = {
                            docId: ob.sysmlid,
                            header: result.header,
                            footer: result.footer,
                            html: result.contents,
                            cover: result.cover,
                            time: time,
                            displayTime: result.displayTime,
                            toc: result.toc,
                            tof: result.tof + result.toe,
                            tot: result.tot,
                            dnum: result.dnum,
                            workspace: ws,
                            customCss: css,
                            version: result.version,
                            name: ob.sysmlid + '_' + time + '_' + new Date().getTime(),
                            disabledCoverPage: isDoc ? false : true
                        };
                        if (!choice[2]) {
                            doc.tof = '<div style="display:none;"></div>';
                            doc.tot = '<div style="display:none;"></div>';
                        } else if (choice[3]) { //let server scrape html for now
                            doc.tof = '';
                            doc.tot = '';
                        }
                        if (time == 'latest')
                            doc.tagId = time;
                        else if (tag)
                            doc.tagId = tag.name;
                        ConfigService.convertHtmlToPdf(doc, site.sysmlid, ws)
                        .then(function(reuslt) {
                            deferred.resolve(result);
                        }, function(reason){
                            deferred.reject(reason);
                        });
                    }
                });
            } else {
                $rootScope.mms_fullDocMode = true;
                $rootScope.mms_bbApi.setToggleState('tree-full-document', true);
                $state.go('workspace.site.document.full', {search: undefined});
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
    var printOrGenerate = function(ob, ws, time, tag, isDoc, genCover, genTotf, htmlTotf, mode, landscape) {
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
        var toc = UtilsService.makeHtmlTOC($rootScope.mms_treeApi.get_rows());
        var tableAndFigTOC = UtilsService.makeTablesAndFiguresTOC($rootScope.mms_treeApi.get_rows(), printElementCopy, false, htmlTotf);
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
            cover = printElementCopy.find("mms-view[mms-vid='" + ob.sysmlid + "']");
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
        if (tag)
            tagname = tag.name;
        if (!isDoc) {
            deferred.resolve({cover: cover, contents: printContents, header: header, footer: footer, displayTime: displayTime, dnum: dnum, version: version, toc: toc, tag: tagname, tof: tof, tot: tot, toe: toe});
            return deferred.promise;
        }
        ViewService.getDocMetadata(ob.sysmlid, ws, null, 2)
        .then(function(metadata) {
            //useCover = true;
            newScope.meta = metadata;
            newScope.tag = tag;
            newScope.time = time === 'latest' ? new Date() : time;
            displayTime = $filter('date')(newScope.time, 'M/d/yy h:mm a');
            newScope.meta.title = ob.name;
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

    var handleChildViews = function(v, aggr, ws, time, curItemFunc, childrenFunc, seen) {
        var seenViews = seen;
        if (!seenViews)
            seenViews = {};
        var deferred = $q.defer();
        var curItem = curItemFunc(v, aggr);
        seenViews[v.sysmlid] = v;
        var childIds = [];
        var childAggrs = [];
        if (!v.specialization.childViews || v.specialization.childViews.length === 0 || aggr === 'NONE') {
            deferred.resolve(curItem);
            return deferred.promise;
        }
        for (var i = 0; i < v.specialization.childViews.length; i++) {
            if (seenViews[v.specialization.childViews[i].id])
                continue;
            childIds.push(v.specialization.childViews[i].id);
            childAggrs.push(v.specialization.childViews[i].aggregation);
        }
        ElementService.getElements(childIds, false, ws, time, 2)
        .then(function(childViews) {
            var mapping = {};
            for (var i = 0; i < childViews.length; i++) {
                mapping[childViews[i].sysmlid] = childViews[i];
            }
            var childPromises = [];
            for (i = 0; i < childIds.length; i++) {
                var child = mapping[childIds[i]];
                if (child) //what if not found??
                    childPromises.push(handleChildViews(child, childAggrs[i], ws, time, curItemFunc, childrenFunc, seenViews));
            }
            $q.all(childPromises).then(function(childNodes) {
                childrenFunc(curItem, childNodes);
                //curNode.children.push.apply(curNode.children, childNodes);
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
    