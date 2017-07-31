'use strict';

angular.module('mms.directives')
.directive('mmsGroupDocs', ['ElementService', 'ViewService', 'growl', '$q', '$templateCache', '_', mmsGroupDocs]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsGroupDocs
 *
 * @requires mms.ElementService
 *
 * @restrict E
 *
 * @description
 *
 * @param {string} mmsGroupId The id of the group to show documents for
 * @param {string=master} mmsRefId Ref, defaults to master
 * @param {string} mmsProjectId Project Id, if not stated will get from surrounding view
 */
function mmsGroupDocs(ElementService, ViewService, growl, $q, $templateCache, _) {

    var mmsGroupDocsLink = function(scope, element, attrs, mmsViewCtrl) {

        var projectId = scope.mmsProjectId;
        var refId = scope.mmsRefId;
            
        if (mmsViewCtrl) {
            var viewVersion = mmsViewCtrl.getElementOrigin();
            if (!projectId) {
                projectId = viewVersion.projectId;
            }
            if (!refId) {
                refId = viewVersion.refId;
            }
        }
        scope.projectId = projectId;
        scope.refId = refId ? refId : 'master';
        ViewService.getProjectDocuments({
            projectId: scope.projectId,
            refId: scope.refId
        }, 2).then(function(documents) {
            var docs = [];
            for (var i = 0; i < documents.length; i++) {
                if (documents[i]._groupId == scope.mmsGroupId) {
                    docs.push(documents[i]);
                }
            }
            scope.docs = docs;
        });
    };


    return {
        restrict: 'E',
        template: $templateCache.get('mms/templates/mmsGroupDocs.html'),
        scope: {
            mmsRefId: '@',
            mmsProjectId: '@',
            mmsGroupId: '@'
        },
        require: '?^^mmsView',
        link: mmsGroupDocsLink
    };
}