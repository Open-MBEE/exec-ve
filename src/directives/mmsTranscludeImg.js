'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeImg', ['AuthService','ElementService','URLService','growl', mmsTranscludeImg]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeImg
 *
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
function mmsTranscludeImg(AuthService, ElementService, URLService, growl) {

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
                var includeExt = [
                    'svg', 'png'
                ];
                var artifacts = data._artifacts;
                if (artifacts !== undefined) {
                    scope.artifacts = artifacts.filter(a => includeExt.includes(a.extension))
                        .map(a => {
                            return {
                                url: URLService.getArtifactURL(reqOb, a.extension),
                                image: (a.mimetype.indexOf('image') > -1),
                                ext: a.extension
                            };
                        });
                    scope.svg = scope.artifacts.filter(a => a.ext === 'svg');
                    scope.png = scope.artifacts.filter(a => a.ext === 'png');
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
        template: '<img class="mms-svg" ng-src="{{svg[0].url}}"></img><img class="mms-png" ng-src="{{png[0].url}}"></img>',
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