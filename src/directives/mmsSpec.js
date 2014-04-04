'use strict';

angular.module('mms')
.directive('mmsSpec', ['ElementService', '$compile', mmsSpec]);

function mmsSpec(ElementService, $compile) {
    var nameTemplate = '<div>Name: {{edit.name}} </div>';
    var nameEditTemplate = '<div>Name: <input type="text" ng-model="edit.name"></input></div>';
    var docTemplate = '<div>Documentation:</div><div ng-bind-html="edit.documentation"></div>';
    var docEditTemplate = '<div>Documentation:</div><div ng-model="edit.documentation" mms-froala transcludable-elements="transcludableElements"></div>';
    var saveTemplate = '<div><button ng-click="save()">Save</button></div>';
    var template = '';
    
    var mmsSpecLink = function(scope, element, attrs) {
        scope.$watch('eid', function(newVal, oldVal) {
            if (newVal === undefined || newVal === null || newVal === '')
                return;
            if (scope.editableField === 'all') 
                template = nameEditTemplate + docEditTemplate;
            else if (scope.editableField === 'name')
                template = nameEditTemplate + docTemplate;
            else if (scope.editableField === 'documentation')
                template = nameTemplate + docEditTemplate;
            else
                template = nameTemplate + docTemplate;
            template = template + saveTemplate;
            ElementService.getElement(scope.eid).then(function(data) {
                scope.element = data;
                ElementService.getElementForEdit(scope.eid).then(function(data) {
                    scope.edit = data;
                    element.empty();
                    var el = $compile(template)(scope);
                    element.append(el);
                });
            });
        });
        scope.save = function() {
            ElementService.updateElement(scope.edit).then(function(){});
        };
    };

    return {
        restrict: 'E',
        //template: template,
        scope: {
            eid: '@',
            editableField: '@', //all or individual field
            transcludableElements: '=' //array of element objects
        },
        link: mmsSpecLink
    };
}