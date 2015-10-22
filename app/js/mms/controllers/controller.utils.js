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

        $scope.searching = false;

        // Search for InstanceSpecs.  We are searching for InstanceSpecs b/c we only want to
        // create a InstanceValue to point to that InstanceSpec when cross-referencing.
        $scope.search = function(searchText) {
            //var searchText = $scope.searchText; //TODO investigate why searchText isn't in $scope
            //growl.info("Searching...");
            $scope.searching = true;

            ElementService.search(searchText, ['name'], null, false, $scope.ws)
            .then(function(data) {
                var validClassifierIds = [];
                if ($scope.presentationElemType === 'Table') {
                    //validClassifierIds.push(ViewService.typeToClassifierId.Table);
                    validClassifierIds.push(ViewService.typeToClassifierId.TableT);
                } else if ($scope.presentationElemType === 'List') {
                    //validClassifierIds.push(ViewService.typeToClassifierId.List);
                    validClassifierIds.push(ViewService.typeToClassifierId.ListT);
                } else if ($scope.presentationElemType === 'Figure') {
                    //validClassifierIds.push(ViewService.typeToClassifierId.Image);
                    validClassifierIds.push(ViewService.typeToClassifierId.Figure);
                } else if ($scope.presentationElemType === 'Paragraph') {
                    //validClassifierIds.push(ViewService.typeToClassifierId.Paragraph);
                    validClassifierIds.push(ViewService.typeToClassifierId.ParagraphT);
                } else if ($scope.presentationElemType === 'Section') {
                    validClassifierIds.push(ViewService.typeToClassifierId.SectionT);
                } else {
                    validClassifierIds.push(ViewService.typeToClassifierId[$scope.presentationElemType]);
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
                    }
                }

                $scope.mmsCfElements = data;
                $scope.searching = false;
            }, function(reason) {
                growl.error("Search Error: " + reason.message);
                $scope.searching = false;
            });
        };

        // Adds a InstanceValue to the view given the sysmlid of the InstanceSpecification
        $scope.addElement = function(element) {

            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;  

            ViewService.addInstanceVal($scope.viewOrSection, $scope.ws, element.sysmlid).
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

        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;

            ViewService.createAndAddElement($scope.viewOrSection, $scope.ws, true, $scope.presentationElemType, $scope.site.sysmlid, $scope.newItem.name).
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

    var popupPrintConfirm = function(ob, ws, time, isDoc) {
        var modalInstance = $modal.open({
            templateUrl: 'partials/mms/printConfirm.html',
            controller: function($scope, $modalInstance, type) {
                $scope.type = type;
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
                popupPrint(ob, ws, time, isDoc);
            else {
                $rootScope.mms_fullDocMode = true;
                $rootScope.mms_bbApi.setToggleState("tree.full.document", true);
                $state.go('workspace.site.document.full'); 
            }
        });
    };

    var popupPrint = function(ob, ws, time, isDoc) {
        var printContents = $window.document.getElementById('print-div').outerHTML;
        var printElementCopy = angular.element(printContents);
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
        printElementCopy.find('mms-transclude-com').remove();
        var docView = printElementCopy.find("mms-view[mms-vid='" + ob.sysmlid + "']");
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
                var popupWin = $window.open('', '_blank', 'width=800,height=600,scrollbars=1');
                popupWin.document.open();
                popupWin.document.write('<html><head><link href="css/ve-mms.styles.min.css" rel="stylesheet" type="text/css"></head><body style="overflow: auto">' + cover + tocContents + printContents + '</html>');
                popupWin.document.close();
                popupWin.print();
        };
        if (isDoc) {
            docView.remove();
            tocContents = UtilsService.makeHtmlTOC($rootScope.mms_treeApi.get_rows());
            if ((ob.specialization.contents && ob.specialization.contents.length > 1) || 
                (ob.specialization.contains && ob.specialization.contains.length > 1) ||
                (ob.documentation && ob.documentation !== '')) { //use original doc view as cover
                cover = '<div style="page-break-after:always">' + docView[0].outerHTML + '</div>';
                $timeout(openPopup, 0, false);
                return;
            }
            ViewService.getDocMetadata(ob.sysmlid, ws)
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
        popupPrintConfirm: popupPrintConfirm
    };
}
    