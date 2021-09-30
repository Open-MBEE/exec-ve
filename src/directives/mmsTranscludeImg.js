'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeImg', ['ArtifactService','AuthService','ElementService','URLService','growl', mmsTranscludeImg]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeImg
 *
 * @requires mms.ArtifactService
 * @requires mms.AuthService
 * @requires mms.ElementService
 * @requires mms.URLService
 * @requires growl
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
function mmsTranscludeImg(ArtifactService, AuthService, ElementService, URLService, growl) {

    var mmsTranscludeImgLink = function(scope, element, attrs, controllers) {
        var mmsViewCtrl = controllers[0];
        var processed = false;
        element.click(function(e) {
            if (!mmsViewCtrl)
                return false;
            //TODO get element somehow
            mmsViewCtrl.transcludeClicked(scope.element);
            return false;
        });

        var changeElement = function(newVal, oldVal) {
            if (!newVal || (newVal === oldVal && processed) || !scope.mmsProjectId) {
                return;
            }
            processed = true;
            scope.projectId = scope.mmsProjectId;
            scope.refId = scope.mmsRefId ? scope.mmsRefId : 'master';
            scope.commitId = scope.mmsCommitId ? scope.mmsCommitId : 'latest';
            var reqOb = {elementId: scope.mmsElementId, projectId: scope.projectId, refId: scope.refId, commitId: scope.commitId};
            element.addClass('isLoading');
            ElementService.getElement(reqOb, 1, false)
            .then(function(data) {
                scope.element = data;
                scope.img = {};
                var artifactOb = {
                    elementId: data.id,
                    projectId: data._projectId,
                    refId: data._refId,
                    commitId: scope.commitId === 'latest' ? 'latest' : data._commitId
                };
                var allowedExtensions = [
                    'svg', 'png'
                ];
                var artifacts = data._artifacts;
                if (artifacts !== undefined) {
                    for (var i = 0; i < allowedExtensions.length; i++) {
                        const artifactExtension = allowedExtensions[i];
                        var extExists = (obj) => {
                            return obj.extension === artifactExtension;
                        };
                        if (artifacts.filter(extExists).length > 0) {
                            scope.img[artifactExtension] = URLService.getArtifactURL(artifactOb,artifactExtension);
                        }
                    }
                }

            }, function(reason) {
                console.log('Cf Artifacts Error: ' + reason.message + ': ' + scope.mmsElementId);
            }).finally(function() {
                element.removeClass('isLoading');
            });
        };

        scope.$watch('mmsElementId', changeElement);
        scope.$watch('mmsRefId', changeElement);
        scope.$watch('mmsCommitId', changeElement);
    };

    return {
        restrict: 'E',
        template: '<img class="mms-svg" ng-src="{{img.svg}}"></img><img class="mms-png" ng-src="{{img.png}}"></img>',
        scope: {
            mmsElementId: '@',
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsCommitId: '@',
            mmsCfLabel: '@'
        },
        require: ['?^^mmsView'],
        link: mmsTranscludeImgLink
    };
}