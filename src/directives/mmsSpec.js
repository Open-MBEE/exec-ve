'use strict';

angular.module('mms')
.directive('mmsSpec', ['ElementService', mmsSpec]);

function mmsSpec(ElementService) {

    var template = '<div> Name: <input type="text" ng-model="edit.name"></input> <br/>' + 
                'Documentation: <div ng-model="edit.documentation" mms-froala></div><br/> ' + 
                '<button ng-click="save()">Save</button> </div> ';
    return {
        restrict: 'E',
        template: template,
        scope: {
            eid: '@'
        },
        //controller: ['$scope', controller]
        link: function(scope, element, attrs) {
            scope.$watch('eid', function(newVal, oldVal) {
                if (newVal === undefined || newVal === null || newVal === '')
                    return;
                ElementService.getElement(scope.eid).then(function(data) {
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