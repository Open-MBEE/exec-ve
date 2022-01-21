'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeArt', ['ElementService','AuthService','URLService', mmsTranscludeArt]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeArt
 *
 * @requires mms.AuthService
 * @requires mms.ElementService
 * @requires mms.URLService
 * @requires growl
 *
 * @restrict E
 *
 * @description
 * Given an artifact id, puts in an img or link to artifact.
 *
 * @param {string} mmsElementId The id of the artifact
 * @param {string} mmsProjectId The project id
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 */
function mmsTranscludeArt(ElementService, AuthService, URLService) {

    var mmsTranscludeArtLink = function(scope, element, attrs, controllers) {
        // var mmsViewCtrl = controllers[0];
        var processed = false;

        scope.$watch('mmsElementId', function(newVal, oldVal) {
            if (!newVal || (newVal === oldVal && processed) || !scope.mmsProjectId) {
                return;
            }
            processed = true;
            scope.projectId = scope.mmsProjectId;
            scope.refId = scope.mmsRefId ? scope.mmsRefId : 'master';
            scope.commitId = scope.mmsCommitId ? scope.mmsCommitId : 'latest';
            scope.artExt = scope.mmsArtExt;
            var reqOb = {elementId: scope.mmsElementId, projectId: scope.projectId, refId: scope.refId, commitId: scope.commitId};

            element.addClass('isLoading');
            
            // Get the artifacts of the element
            ElementService.getElement(reqOb, 1, false)
            .then(function(data) {
                scope.element = data;
                var artifacts = data._artifact;
                if (artifacts !== undefined) {
                    var allExt = artifacts.map(a => a.extension);
                    var includeExt = allExt;
                    if (scope.artExt !== '' || scope.artExt !== undefined) {
                        includeExt = scope.artExt.split(',').filter(a => allExt.includes(a));
                    }
                    scope.artifacts = artifacts.filter(a => includeExt.includes(a.extension))
                        .map(a => {
                            return {
                                url: URLService.getArtifactURL(reqOb, a.extension),
                                image: (a.mimetype.indexOf('image') > -1),
                                ext: a.extension
                            };
                        });
                }
            }, function(reason) {
                console.log('Error getting artifacts for ' + scope.mmsElementId);
            }).finally(function() {
                element.removeClass('isLoading');
            });
        });
    };

    return {
        restrict: 'E',
        template: '<div ng-repeat="artifact in artifacts"><img ng-if="artifact.image" ng-src="{{artifact.url}}"></img><a ng-if="!artifact.image" ng-href="{{artifact.url}}">{{element.name}} - {{artifact.ext}}</a></div>',
        scope: {
            mmsElementId: '@',
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsCommitId: '@',
            mmsCfLabel: '@',
            mmsArtExt: '@'
        },
        require: ['?^^mmsView'],
        link: mmsTranscludeArtLink
    };
}