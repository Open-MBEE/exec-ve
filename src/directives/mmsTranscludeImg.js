'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeImg', ['VizService', 'growl', mmsTranscludeImg]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeImg
 *
 * @requires mms.VizService
 *
 * @restrict E
 *
 * @description
 * Given an image id, puts in an img tag for the image url. 
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 */
function mmsTranscludeImg(VizService, growl) {

    var mmsTranscludeImgLink = function(scope, element, attrs, controllers) {
        var mmsViewCtrl = controllers[0];
        var mmsCfDocCtrl = controllers[1];
        var mmsCfValCtrl = controllers[2];
        var processed = false;
        element.click(function(e) {
            if (!mmsViewCtrl)
                return false;
            //TODO get element somehow
            mmsViewCtrl.transcludeClicked(scope.element);
            return false;
        });

        scope.$watch('mmsElementId', function(newVal, oldVal) {
            if (!newVal || (newVal === oldVal && processed))
                return;

            processed = true;

            var projectId = scope.mmsProjectId;
            var refId = scope.mmsRefId;
            var commitId = scope.mmsCommitId;
            if (mmsCfValCtrl) {
                var cfvVersion = mmsCfValCtrl.getElementOrigin();
                if (!projectId)
                    projectId = cfvVersion.projectId;
                if (!refId)
                    refId = cfvVersion.refId;
                if (!commitId)
                    commitId = cfvVersion.commitId;
            }
            if (mmsCfDocCtrl) {
                var cfdVersion = mmsCfDocCtrl.getElementOrigin();
                if (!projectId)
                    projectId = mmsCfDocCtrl.projectId;
                if (!refId)
                    refId = mmsCfDocCtrl.refId;
                if (!commitId)
                    commitId = mmsCfDocCtrl.commitId;
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
            var reqOb = {elementId: scope.mmsElementId, projectId: scope.projectId, refId: scope.refId, commitId: scope.commitId};
            element.addClass('isLoading');
            //TODO change when VizService is updated to use correct params
            VizService.getImageURL(reqOb, 'svg')
            .then(function(data) {
                scope.svgImgUrl = data;
            }, function(reason) {
                growl.error('Cf Image Error: ' + reason.message + ': ' + scope.mmsElementId);
            }).finally(function() {
                element.removeClass('isLoading');
            });
            VizService.getImageURL(scope.mmsElementId, 'png', false, ws, version)
            .then(function(data) {
                scope.pngImgUrl = data;
            }, function(reason) {
                //growl.error('Cf Image Error: ' + reason.message + ': ' + scope.mmsElementId);
            });
            ElementService.getElement(reqOb, 1, false)
            .then(function(data) {
                scope.element = data;
            });
        });
    };

    return {
        restrict: 'E',
        template: '<img class="mms-svg" ng-src="{{svgImgUrl}}"></img><img class="mms-png" ng-src="{{pngImgUrl}}"></img>',
        scope: {
            mmsElementId: '@',
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsCommitId: '@'
        },
        require: ['?^^mmsView', '?^^mmsTranscludeDoc', '?^^mmsTranscludeVal'],
        link: mmsTranscludeImgLink
    };
}