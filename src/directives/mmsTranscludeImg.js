'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeImg', ['VizService', mmsTranscludeImg]);

function mmsTranscludeImg(VizService) {

    var mmsTranscludeImgLink = function(scope, element, attrs, mmsViewCtrl) {
        element.click(function(e) {
            if (mmsViewCtrl === null || mmsViewCtrl === undefined)
                return false;
            mmsViewCtrl.transcludeClicked(scope.eid);
            return false;
        });

        scope.$watch('eid', function(newVal, oldVal) {
            if (newVal === undefined || newVal === null || newVal === '')
                return;
            VizService.getImageUrl(scope.eid).then(function(data) {
                scope.imgUrl = data;
            });
        });
    };

    return {
        restrict: 'E',
        template: '<img src="{{imgUrl}}"/>',
        scope: {
            eid: '@',
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsTranscludeImgLink
    };
}