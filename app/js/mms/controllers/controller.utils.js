'use strict';

angular.module('mmsApp')
.factory('MmsAppUtils', ['$q','$modal','$timeout', '$templateCache','$rootScope','$compile','WorkspaceService','ConfigService','ElementService','ViewService', 'UtilsService', 'growl','_', MmsAppUtils]);

/**
 * @ngdoc service
 * @name mmsApp.MmsAppUtils
 * 
 * @description
 * Utilities
 */
function MmsAppUtils($q, $modal, $timeout, $templateCache, $rootScope, $compile, WorkspaceService, ConfigService, ElementService, ViewService, UtilsService, growl, _) {

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

    return {
        addPresentationElement: addPresentationElement
    };
}
    