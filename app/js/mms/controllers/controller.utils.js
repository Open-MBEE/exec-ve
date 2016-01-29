'use strict';

angular.module('mmsApp')
.factory('MmsAppUtils', ['$q','$state', '$modal','$timeout', '$location', '$window', '$templateCache','$rootScope','$compile','WorkspaceService','ConfigService','ElementService','ViewService', 'UtilsService', 'growl','_', MmsAppUtils]);

/**
 * @ngdoc service
 * @name mmsApp.MmsAppUtils
 * 
 * @description
 * Utilities
 */
function MmsAppUtils($q, $state, $modal, $timeout, $location, $window, $templateCache, $rootScope, $compile, WorkspaceService, ConfigService, ElementService, ViewService, UtilsService, growl, _) {

    var addElementCtrl = function($scope, $modalInstance, $filter) {

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
            } else if ($scope.presentationElemType === 'Figure') {
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
            ViewService.addElementToViewOrSection($scope.viewOrSection.sysmlid, $scope.viewOrSection.sysmlid, $scope.ws, instanceVal).
            then(function(data) {
                if ($scope.presentationElemType === "Section") {
                    // Broadcast message to TreeCtrl:
                    $rootScope.$broadcast('viewctrl.add.section', element, $scope.viewOrSection);
                }
                growl.success("Adding "+$scope.presentationElemType+"  Successful");
                $modalInstance.close(data);
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

            ViewService.createInstanceSpecification($scope.viewOrSection, $scope.ws, $scope.presentationElemType, $scope.site.sysmlid, $scope.newItem.name).
            then(function(data) {
                $rootScope.$broadcast('view.reorder.refresh');
                growl.success("Adding "+$scope.presentationElemType+"  Successful");
                $modalInstance.close(data);
            }, function(reason) {
                growl.error($scope.presentationElemType+" Add Error: " + reason.message);
            }).finally(function() {
                $scope.oking = false;
            }); 
        };

        $scope.cancel = function() {
            $modalInstance.dismiss();
        };

    };

    /**
     * @ngdoc method
     * @name mmsApp.MmsAppUtils#getPresentationElement
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

          var instance = $modal.open({
              templateUrl: templateUrlStr,
              scope: $scope,
              controller: ['$scope', '$modalInstance', '$filter', addElementCtrl]
          });
          instance.result.then(function(data) {
              // TODO: do anything here?
          });
        }
    };

    var popupPrintConfirm = function(ob, ws, time, isDoc, print) {
        var modalInstance = $modal.open({
            templateUrl: 'partials/mms/printConfirm.html',
            controller: function($scope, $modalInstance, type) {
                $scope.type = type;
                $scope.action = print ? 'print' : 'save';
                $scope.print = function() {
                    $modalInstance.close('print');
                };
                $scope.fulldoc = function() {
                    $modalInstance.close('fulldoc');
                };
                $scope.cancel = function() {
                    $modalInstance.dismiss();
                };
            },
            resolve: {
                type: function() { return isDoc ? 'DOCUMENT' : 'VIEW';}
            },
            backdrop: 'static',
            keyboard: false
        });
        modalInstance.result.then(function(choice) {
            if (choice === 'print')
                popupPrint(ob, ws, time, isDoc, print);
            else {
                $rootScope.mms_fullDocMode = true;
                $rootScope.mms_bbApi.setToggleState("tree.full.document", true);
                $state.go('workspace.site.document.full', {search: undefined}); 
            }
        });
    };

    var tableToCsv = function(ob, ws, time, isDoc) { //Export to CSV button Pop-up Generated Here
         var modalInstance = $modal.open({
            templateUrl: 'partials/mms/tableExport.html',
            controller: function($scope, $modalInstance, type) {
                $scope.type = type;
                $scope.export = function() {
                    $modalInstance.close('export');
                };
                // $scope.fulldoc = function() {
                //     $modalInstance.close('fulldoc');
                // };
                $scope.cancel = function() {
                    $modalInstance.dismiss();
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
            'var blob = new Blob([csvString], { ' +
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
    
    var popupPrint = function(ob, ws, time, isDoc, print) {
        var printContents = '';//$window.document.getElementById('print-div').outerHTML;
        var printElementCopy = angular.element('#print-div').clone();//angular.element(printContents);
        var hostname = $location.host();
        var port = $location.port();
        var protocol = $location.protocol();
        var absurl = $location.absUrl();
        var prefix = protocol + '://' + hostname + ((port == 80 || port == 443) ? '' : (':' + port));
        var mmsIndex = absurl.indexOf('mms.html');
        printElementCopy.find("a").attr('href', function(index, old) {
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
        printElementCopy.find('.error').html('error');
        var docView = printElementCopy.find("mms-view[mms-vid='" + ob.sysmlid + "']");
        if (isDoc)
            docView.remove();
        var templateString = $templateCache.get('partials/mms/docCover.html');
        var templateElement = angular.element(templateString);
        var tocContents = '';
        var cover = '';
        var newScope = $rootScope.$new();
        var useCover = false;
        printContents = printElementCopy[0].outerHTML;
        var openPopup = function() {
                if (useCover)
                    cover = templateElement[0].innerHTML;
                newScope.$destroy();
                var inst = '';
                if (!print)
                    inst = "<div>(Copy and paste into Word)</div>";
                var popupWin = $window.open('', '_blank', 'width=800,height=600,scrollbars=1');
                popupWin.document.open();
                popupWin.document.write('<html><head><link href="css/ve-mms.styles.min.css" rel="stylesheet" type="text/css"></head><body style="overflow: auto">' + inst + cover + tocContents + printContents + '</html>');
                popupWin.document.close();
                if (print) {
                    $timeout(function() {
                        popupWin.print();
                    }, 1000, false);
                }
        };
        if (isDoc) {
            tocContents = UtilsService.makeHtmlTOC($rootScope.mms_treeApi.get_rows());
            if ((ob.specialization.contents && ob.specialization.contents.length > 1) || 
                (ob.specialization.contains && ob.specialization.contains.length > 1) ||
                (ob.documentation && ob.documentation !== '')) { //use original doc view as cover
                cover = '<div style="page-break-after:always">' + docView[0].outerHTML + '</div>';
                $timeout(openPopup, 0, false);
                return;
            }
            ViewService.getDocMetadata(ob.sysmlid, ws, null, 2)
            .then(function(metadata) {
                useCover = true;
                newScope.meta = metadata;
                newScope.time = time === 'latest' ? new Date() : time;
                newScope.meta.title = ob.name;
                $compile(templateElement.contents())(newScope); 
            }).finally(function() {
                $timeout(openPopup, 0, false);
            });
        } else {
            $timeout(openPopup, 0, false);
        }
    };

    return {
        addPresentationElement: addPresentationElement,
        popupPrintConfirm: popupPrintConfirm,
        tableToCsv: tableToCsv
    };
}
    