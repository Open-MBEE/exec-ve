'use strict';

angular.module('mms.directives')
.directive('mmsHistory', ['Utils','ElementService', 'ProjectService', '$templateCache', '$q', '$uibModal', '_', mmsHistory]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsHistory
 *
 * @requires mms.ElementService
 * @requires $compile
 * @requires $templateCache
 * @requires _
 *
 * @restrict E
 *
 * @description
 * Outputs a history window of the element whose id is specified. History includes
 * name of modifier and date of change. Also modified date links to spec output below.
 *
 * ### template (html)
 * ## Example for showing an element history
 *  <pre>
    <mms-history mms-eid="element_id" mms-version="2014-07-01T08:57:36.915-0700"></mms-history>
    </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 */
function mmsHistory(Utils, ElementService, ProjectService, $templateCache, $q, $uibModal, _) {
    var template = $templateCache.get('mms/templates/mmsHistory.html');

    var mmsHistoryLink = function(scope, element, attrs) {
        var ran = false;
        var lastid = null;
        scope.historyVer = 'latest';
        scope.compareCommit = {
            compareHistory: null,
            commitSelected: null,
            isopen: false
        };


        // base data
        scope.refList = [];
        scope.baseCommit = {
            refSelected: {id: 'master'},
            baseHistory: null,
            commitSelected: null,
            isopen: false
        };

        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsHistory#changeElement
         * @methodOf mms.directives.directive:mmsHistory
         *
         * @description
         * Change scope history when another element is selected
         */
        var changeElement = function(newVal, oldVal) {
            if (!newVal || (newVal == oldVal && ran))
                return;
            ran = true;
            lastid = newVal;
            // scope.disableCompare = true;
            scope.gettingHistory = true;
            var reqOb = {elementId: scope.mmsElementId, projectId: scope.mmsProjectId, refId: scope.mmsRefId};
            ElementService.getElementHistory(reqOb, 2)
            .then(function(data) {
                if (newVal !== lastid) 
                    return;
                scope.historyVer = 'latest';
                scope.compareCommit.compareHistory = data;
                scope.compareCommit.commitSelected = scope.compareCommit.compareHistory[0];

                getRefs();
                if (data.length > 1) {
                    // scope.disableCompare = false;
                    scope.baseCommit.baseHistory = data;
                    scope.baseCommit.commitSelected = scope.compareCommit.compareHistory[1];
                }
            }).finally(function() {
                scope.gettingHistory = false;
            });
        };

        var getRefs = function() {
            ProjectService.getRefs(scope.mmsProjectId)
            .then(function(data) {
                scope.refList = data;
                scope.baseCommit.refSelected = _.find(data, function(item) {
                    return item.id == scope.mmsRefId;
                });
                // scope.getElementHistoryByRef(scope.baseCommit.refSelected);
            });
        };

        scope.commitClicked = function(version) {
            scope.compareCommit.commitSelected = version;
            scope.historyVer = scope.compareCommit.commitSelected.id;
            scope.compareCommit.isopen = !scope.compareCommit.isopen;
        };

        scope.getElementHistoryByRef = function(ref) {
            if (ref) {
                // scope.gettingCompareHistory = true;
                scope.baseCommit.refSelected = ref;
                var reqOb = {elementId: scope.mmsElementId, projectId: scope.mmsProjectId, refId: ref.id};
                ElementService.getElementHistory(reqOb, 2)
                .then(function(data) {
                    scope.baseCommit.baseHistory = data;
                    if (data.length > 0) {
                        scope.baseCommit.commitSelected = scope.baseCommit.baseHistory[0];
                    }
                }).finally(function() {
                    // scope.gettingCompareHistory = false;
                    scope.baseCommit.isopen = !scope.baseCommit.isopen;
                });
            }
        };

        scope.baseCommitClicked = function(version) {
            scope.baseCommit.commitSelected = version;
            scope.baseCommit.isopen = !scope.baseCommit.isopen;
        };

        scope.changeElement = changeElement;
        scope.$watch('mmsElementId', changeElement);
        scope.$watch('mmsRefId', changeElement);


        scope.revert = function() {
            Utils.revertAction(scope, changeElement, element);
        };


        scope.changeBase = function () {
            var templateUrlStr = 'mms/templates/selectDiffVersion.html';
    
            var instance = $uibModal.open({
                templateUrl: templateUrlStr,
                scope: scope,
                controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
                    $scope.ok = function() {
                        $uibModalInstance.close('ok');
                    };
                    $scope.cancel = function() {
                        $uibModalInstance.dismiss();
                    };
                }]
            });
            instance.result.then(function(data) {
                  // TODO: do anything here?
            });
        };
        // var instance = $uibModal.open({
        //     templateUrl: 'partials/mms/revertConfirm.html',
        //     scope: scope,
        //     controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
        //         $scope.ok = function() {
        //             $uibModalInstance.close('ok');
        //         };
        //         $scope.cancel = function() {
        //             $uibModalInstance.dismiss();
        //         };
        //     }]
        // });
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsElementId: '@',
            mmsProjectId: '@',
            mmsRefId: '@'
        },
        link: mmsHistoryLink
    };
}
