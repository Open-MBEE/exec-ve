'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeImg', ['VizService', mmsTranscludeImg]);

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
 * @param {string} eid The id of the image to transclude
 */
function mmsTranscludeImg(VizService) {

    var mmsTranscludeImgLink = function(scope, element, attrs, mmsViewCtrl) {
        element.click(function(e) {
            if (!mmsViewCtrl)
                return false;
            mmsViewCtrl.transcludeClicked(scope.mmsEid);
            return false;
        });

        scope.$watch('mmsEid', function(newVal, oldVal) {
            if (!newVal)
                return;
            var ws = scope.mmsWs;
            var version = scope.mmsVersion;
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getWsAndVersion();
                if (!ws)
                    ws = viewVersion.workspace;
                if (!version)
                    version = viewVersion.version;
            }
            VizService.getImageUrl(scope.mmsEid, false, ws, version)
            .then(function(data) {
                scope.imgUrl = data;
            });
        });
    };

    return {
        restrict: 'E',
        template: '<img src="{{imgUrl}}"/>',
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