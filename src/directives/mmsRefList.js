'use strict';

angular.module('mms.directives')
.directive('mmsRefList', ['$templateCache', '$http', 'growl', '_', '$q', '$uibModal',
        'UtilsService', 'ElementService', 'URLService', 'PermissionsService', mmsRefList]);
/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsRefList
 *
 * @requires $templateCache
 * @requires $http
 * @requires $location
 * @requires _
 *
 * @restrict E
 *
 * @description
 * Displays a list of branches/tags with details. Provides options for taking action on ref.
 * For the time being it only allows for running a doc merge job on current document.
 *
 * @param {string=master} mmsProjectId Current project
 * @param {string=master} mmsRefId Current branch
 * @param {string=null} mmsDocId the id of the current document
 */
function mmsRefList($templateCache, $http, growl, _ , $q, $uibModal,
    UtilsService, ElementService, URLService, PermissionsService) {

    var template = $templateCache.get('mms/templates/mmsRefList.html');

    var mmsRefListLink = function (scope, element, attrs) {
        var ran;
        scope.showMerge = URLService.getMmsServer().indexOf('opencae.jpl.nasa.gov') == -1;
        scope.runCleared = true;
        scope.docEditable = false;
        scope.currentRefOb = _.find(scope.mmsBranches, { 'id': scope.mmsRefId });
        if (scope.currentRefOb == undefined){
            scope.currentRefOb = _.find(scope.mmsTags, { 'id': scope.mmsRefId });
        }

        //Callback function for document change
        var changeDocument = function (newVal, oldVal) {
            if (!newVal || (newVal == oldVal && ran))
                return;
            ran = true;
            var reqOb = {elementId: scope.mmsDocId, projectId: scope.mmsProjectId, refId: scope.mmsRefId};
            ElementService.getElement(reqOb, 2, false)
            .then(function (document) {
                if (!UtilsService.isDocument(document)) {
                    scope.isDoc = false;
                    return;
                } else {
                    scope.isDoc = true;
                }
                scope.doc = document;
                scope.docName = document.name;
                scope.docEditable = scope.mmsRefType != 'Tag' && PermissionsService.hasProjectIdBranchIdEditPermission(scope.mmsProjectId, scope.mmsRefId);
            });
        };

        // watch for the document to change
        scope.$watch('mmsDocId', changeDocument);


        scope.docMergeAction = function (srcRef) {
            var templateUrlStr = 'mms/templates/mergeConfirm.html';
            scope.srcRefOb = srcRef;

            var instance = $uibModal.open({
                templateUrl: templateUrlStr,
                scope: scope,
                controller: ['$scope', '$uibModalInstance', '$filter', mergeDocCtrl]
            });
            instance.result.then(function(data) {
                // TODO: do anything here?
            });
        };

        var mergeDocCtrl = function($scope, $uibModalInstance, $filter) {
            $scope.oking = false;
            $scope.commitMessage = '';
            $scope.createForm = true;

            $scope.ok = function() {
                if ($scope.oking) {
                    growl.info("Please wait...");
                    return;
                }
                $scope.oking = false;
                // $scope.createJobandRun($scope.srcRefOb.id, $scope.commitMessage)
                // .then(function(data) {
                //     growl.success("Creating job to merge documents... please see the jobs pane for status updates");
                //     $uibModalInstance.close(data);
                // }, function(reason) {
                //     growl.error("Could not merge document: " + reason.message);
                // }).finally(function() {
                //     $scope.oking = false;
                // });
            };

            $scope.cancel = function() {
                $uibModalInstance.dismiss();
            };
        };


    };
    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsRefType: '@',
            mmsDocId:'@',
            mmsBranches: '<',
            mmsTags: '<'
        },
        link: mmsRefListLink
    };
}
