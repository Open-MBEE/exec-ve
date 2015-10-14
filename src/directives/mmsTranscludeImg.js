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
 * @param {string} mmsEid The id of the image to show
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsTranscludeImg(VizService, growl) {

    var mmsTranscludeImgLink = function(scope, element, attrs, mmsViewCtrl) {
        var processed = false;
        element.click(function(e) {
            if (!mmsViewCtrl)
                return false;
            mmsViewCtrl.transcludeClicked(scope.mmsEid);
            return false;
        });

        scope.$watch('mmsEid', function(newVal, oldVal) {
            if (!newVal || (newVal === oldVal && processed))
                return;
            processed = true;
            var ws = scope.mmsWs;
            var version = scope.mmsVersion;
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getWsAndVersion();
                if (!ws)
                    ws = viewVersion.workspace;
                if (!version)
                    version = viewVersion.version;
            }
            VizService.getImageURL(scope.mmsEid, false, ws, version)
            .then(function(data) {
                scope.imgUrl = data;
            }, function(reason) {
                // growl.error('Cf Image Error: ' + reason.message + ': ' + scope.mmsEid);
            });
        });
    };

    return {
        restrict: 'E',
        template: '<img ng-src="{{imgUrl}}"></img>',
        scope: {
            mmsEid: '@',
            mmsVersion: '@',
            mmsWs: '@'
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsTranscludeImgLink
    };
}