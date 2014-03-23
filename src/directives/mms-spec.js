'use strict';

angular.module('mms')
.directive('mmsSpec', ['ElementService', mmsSpec]);

function mmsSpec(ElementService) {

    return {
        restrict: 'E',
        template: ' <div> Name: <input type="text" ng-model="edit.name"></input> <br/> Documentation: <textarea ng-model="edit.documentation"></textarea><br/> <button ng-click="save()">Save</button> </div> ',
        scope: {
            id: '@'
        },
        //controller: ['$scope', controller]
        link: function(scope, element, attr) {
            scope.$watch('id', function(newVal, oldVal) {
                if (newVal === undefined || newVal === null || newVal === '')
                    return;
                ElementService.getElement(scope.id).then(function(data) {
                    scope.element = data;
                    scope.edit = {id: scope.element.id, 
                        name: scope.element.name,
                        documentation: scope.element.documentation};
                });
            });
            scope.save = function() {
                ElementService.updateElement(scope.edit).then(function(){});
            };
        }
    };
}