'use strict';

angular.module('mms.directives')
.directive('mmsViewList', ['$compile', '$templateCache', mmsViewList]);

function mmsViewList($compile, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsViewList.html');
    
    var mmsViewListCtrl = function ($scope, $rootScope) {
        $scope.deleteList = function(instanceVal) {
            $rootScope.$broadcast('element.delete', instanceVal);
        };
    };

    return {
        restrict: 'E',
        //template: template,
        scope: {
            list: '=mmsList',
            instanceVal: '=mmsInstanceVal'
        },
        controller: ['$scope', '$rootScope', mmsViewListCtrl],
        link: function(scope, element, attrs) {
            element.append(template);
            $compile(element.contents())(scope); 
            //var el = $compile(template)(scope);
            //element.append(el);
        }
    };
}