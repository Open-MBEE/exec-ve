'use strict';

angular.module('mms.directives')
.directive('mmsViewLink', ['ElementService', 'UtilsService', 'ViewService', 'ApplicationService', '$compile', 'growl', mmsViewLink]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsViewLink
 *
 * @requires mms.ElementService
 * @requires $compile
 *
 * @restrict E
 *
 * @description
 * Given a view id and optional document id, creates a html link
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {string} mmsDocId Document context of view
 * @param {string} mmsPeId Document context of view
 */
function mmsViewLink(ElementService, UtilsService, ViewService, ApplicationService, $compile, growl) {

    var mmsViewLinkLink = function(scope, element, attrs, controllers) {
        var mmsCfCtrl = controllers[0];
        var mmsViewCtrl = controllers[1];
        var processed = false;
        scope.loading = true;
        scope.$watch('mmsElementId', function(newVal, oldVal) {
            if (!newVal || (newVal === oldVal && processed))
                return;
            processed = true;

            var projectId = scope.mmsProjectId;
            var refId = scope.mmsRefId;
            var commitId = scope.mmsCommitId;
            var docid = scope.mmsDocId;
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
            if (!projectId) {
                return;
            }
            scope.projectId = projectId;
            scope.refId = refId ? refId : 'master';
            scope.commitId = commitId ? commitId : 'latest';
            var id = scope.mmsElementId;
            id = id.replace(/[^\w\-]/gi, '');

            var reqOb = {elementId: id, projectId: projectId, refId: refId, commitId: commitId};
            ElementService.getElement(reqOb, 1)
            .then(function(data) {
                scope.element = data;
                scope.name = data.name;
                scope.type = 'Section ';
                scope.suffix = '';
                scope.hash = '#' + data.id;
                if (scope.mmsPeId && scope.mmsPeId !== '') {
                    var reqPEOb = {elementId: scope.mmsPeId, projectId: projectId, refId: refId, commitId: commitId};
                    ElementService.getElement(reqPEOb)
                    .then(function(pe) {
                        scope.hash = '#' + pe.id;
                        scope.element = pe;
                        scope.name = pe.name;
                        if (ViewService.isTable(pe)) {
                            scope.type = 'Table ';
                        } else if (ViewService.isFigure(pe)) {
                            scope.type = "Fig. ";
                        } else if (ViewService.isEquation(pe)) {
                            scope.type = "Eq. (";
                            scope.suffix = ')';
                        }
                        if (ApplicationService.getState().fullDoc) {
                            scope.href = "mms.html#/projects/" + scope.projectId + '/' + scope.refId + '/documents/' + scope.docid + "/full" + scope.hash;
                        } else {
                            scope.href = "mms.html#/projects/" + scope.projectId + '/' + scope.refId + '/documents/' + scope.docid + '/views/' + scope.vid + scope.hash;
                        }
                    });
                }
                if (UtilsService.isDocument(data)) {
                    docid = data.id;
                    scope.docid = docid;
                    scope.vid = data.id;
                } else if (UtilsService.isView(data) || data.type === 'InstanceSpecification') {
                    if (!docid || docid === '') {
                        docid = data.id;
                    }
                    scope.docid = docid;
                    scope.vid = data.id;
                } else {
                    element.html("<span class=\"mms-error\">view link doesn't refer to a view</span>");
                }
                scope.loading = false;
                if (ApplicationService.getState().fullDoc) {
                    scope.href = "mms.html#/projects/" + scope.projectId + '/' + scope.refId + '/documents/' + scope.docid + '/full' + scope.hash;
                } else {
                    scope.href = "mms.html#/projects/" + scope.projectId + '/' + scope.refId + '/documents/' + scope.docid + '/views/' + scope.vid;
                }
                scope.change = ApplicationService.getState().inDoc && (ApplicationService.getState().currentDoc == scope.docid);
            }, function(reason) {
                element.html('<span class="mms-error">view link not found</span>');
                scope.loading = false;
            });
        });
    };

    return {
        restrict: 'E',
        scope: {
            mmsElementId: '@',
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsCommitId: '@',
            mmsDocId: '@',
            mmsPeId: '@',
            linkText: '@?',
            linkClass: '@?',
            linkIconClass: '@?'
        },
        require: ['?^^mmsCf', '?^^mmsView'],
        template: '<a ng-if="!loading" ng-class="linkClass" ng-href="{{href}}"><i ng-class="linkIconClass" aria-hidden="true"></i><span ng-if="linkText">{{linkText}}</span><span ng-if="!linkText && change">{{type}}{{element._veNumber}}{{suffix}}</span><span ng-if="!linkText && !change">{{name || "Unnamed View"}}</span></a>',
        link: mmsViewLinkLink
    };
}