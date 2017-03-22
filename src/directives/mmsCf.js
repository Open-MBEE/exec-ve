'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeName', ['ElementService', 'UxService', '$compile', 'growl', '$templateCache', 'Utils', mmsTranscludeName]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeName
 *
 * @requires mms.ElementService
 * @requires mms.UxService
 * @requires mms.Utils
 * @requires $compile
 * @requires $templateCache
 * @requires growl
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's name binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and name change,
 * and on click
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 */
function mmsTranscludeName(ElementService, UxService, $compile, growl, $templateCache, Utils) {

    var mmsTranscludeNameCtrl = function ($scope) {
        //INFO this was this.getWsAndVersion
        this.getElementOrigin = function() {
            return {
                projectId: $scope.projectId,
                refId: $scope.refId,
                commitId: $scope.commitId
            };
        };
    };

    var mmsTranscludeNameLink = function(scope, domElement, attrs, controllers) {
        var mmsCfCtrl = controllers[0];
        var mmsViewCtrl = controllers[1];

        var idwatch = scope.$watch('mmsElementId', function(newVal, oldVal) {
            if (!newVal) {
                return;
            }
            idwatch();
            var projectId = scope.mmsProjectId;
            var refId = scope.mmsRefId;
            var commitId = scope.mmsCommitId;
            if (mmsCfCtrl) {
                var cfVersion = mmsCfCtrl.getElementOrigin();
                if (!projectId)
                    projectId = cfVersion.projectId;
                if (!refId)
                    refId = cfVersion.refId;
                if (!commitId)
                    commitId = cfVersion.commitId;
            }
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getElementOrigin();
                if (!projectId)
                    projectId = viewVersion.projectId;
                if (!refId)
                    refId = viewVersion.refId;
                if (!commitId)
                    commitId = viewVersion.commitId;
            }
            scope.projectId = projectId;
            scope.refId = refId ? refId : 'master';
            scope.commitId = commitId ? commitId : 'latest';
        });

        if (scope.mmsCfType) {
            domElement[0].innerHTML = '<mms-transclude-'+scope.mmsCfType+' mms-eid="mmsElementId" mms-project-id="projectId" mms-ref-id="refId" mms-commit-id="commitId" non-editable="nonEditable"></<mms-transclude-'+scope.mmsCfType+'>';
            $compile(domElement.contents())(scope);
        }

    };

    return {
        restrict: 'E',
        scope: {
            mmsElementId: '@',
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsCommitId: '@',
            mmsCfType: '@',
            nonEditable: '<',
        },
        require: ['?^^mmsCf', '?^^mmsView'],
        controller: ['$scope', mmsTranscludeNameCtrl],
        link: mmsTranscludeNameLink
    };
}