'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeImg', ['VizService','ElementService','URLService','growl', mmsTranscludeImg]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeImg
 *
 * @requires mms.VizService
 * @requires mms.ElementService
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
function mmsTranscludeImg(VizService, ElementService, URLService, growl) {

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

        scope.$watch('mmsElementId', function(newVal, oldVal) {
            if (!newVal || (newVal === oldVal && processed))
                return;
            processed = true;

            scope.projectId = scope.mmsProjectId;
            scope.refId = scope.mmsRefId ? scope.mmsRefId : 'master';
            scope.commitId = scope.mmsCommitId ? scope.mmsCommitId : 'latest';
            var reqOb = {elementId: scope.mmsElementId, projectId: scope.projectId, refId: scope.refId, commitId: scope.commitId, accept: 'image/svg'};
            element.addClass('isLoading');
            //TODO change when VizService is updated to use correct params
            VizService.getImageURL(reqOb)
            .then(function(data) {
                scope.svgImgUrl = data;
            //scope.svgImgUrl = URLService.getImageURL(reqOb);
            //reqOb.accept = 'image/png';
            //scope.pngImgUrl = URLService.getImageURL(reqOb);
            }, function(reason) {
                growl.error('Cf Image Error: ' + reason.message + ': ' + scope.mmsElementId);
            }).finally(function() {
                element.removeClass('isLoading');
            });
            var reqOb2 = {elementId: scope.mmsElementId, projectId: scope.projectId, refId: scope.refId, commitId: scope.commitId, accept: 'image/png'};
            VizService.getImageURL(reqOb2)
            .then(function(data) {
                scope.pngImgUrl = data;
            }, function(reason) {
                growl.error('Cf Image Error: ' + reason.message + ': ' + scope.mmsElementId);
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
        require: ['?^^mmsView'],
        link: mmsTranscludeImgLink
    };
}