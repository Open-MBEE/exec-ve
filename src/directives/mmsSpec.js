'use strict';

angular.module('mms.directives')
.directive('mmsSpec', ['ElementService', '$compile', mmsSpec]);

function mmsSpec(ElementService, $compile) {
    var nameTemplate = '<div>Name: {{edit.name}} </div>';
    var nameEditTemplate = '<div>Name: <input class="form-control" type="text" ng-model="edit.name"></input></div>';
    
    var docTemplate = '<div>Documentation:</div><div ng-bind-html="edit.documentation"></div>';
    var docEditTemplate = '<div>Documentation:</div><div ng-model="edit.documentation" mms-froala transcludable-elements="transcludableElements"></div>';
    var docEditPlain = '<div>Documentation:</div><textarea ng-model="edit.documentation"></textarea>';
    
    var valueStringEdit = '<div>Value:</div><div ng-repeat="val in values" ng-model="val.value" mms-froala transcluable-elements="transcludableElements"></div>';
    var valueBooleanEdit = '<div>Value:</div><input ng-repeat="val in values" type="checkbox" ng-model="val.value"></input>';
    var valueNumberEdit = '<div>Value:</div><input ng-repeat="val in values" type="number" ng-model="val.value"></input>';
    
    var saveTemplate = '<div><button class="btn btn-primary btn-sm" ng-click="save()">Save</button></div>';
    var template = '';
    
    var mmsSpecLink = function(scope, element, attrs) {
        scope.$watch('eid', function(newVal, oldVal) {
            if (newVal === undefined || newVal === null || newVal === '')
                return;
            template = '';
            if (scope.editableField === 'all') 
                template = nameEditTemplate + docEditTemplate;
            else if (scope.editableField === 'name')
                template = nameEditTemplate + docTemplate;
            else if (scope.editableField === 'documentation')
                template = nameTemplate + docEditTemplate;
            else
                template = nameTemplate + docTemplate;
            //template = template + saveTemplate;
            ElementService.getElement(scope.eid).then(function(data) {
                scope.element = data;
                ElementService.getElementForEdit(scope.eid).then(function(data) {
                    scope.edit = data;
                    if (scope.edit.type === 'Property' && angular.isArray(scope.edit.value)) {
                        scope.values = [];
                        for (var i = 0; i < scope.edit.value.length; i++) {
                            scope.values.append({value: scope.edit.value[i]});
                        }
                        if (scope.edit.valueType === 'LiteralString')
                            template += valueStringEdit;
                        else if (scope.edit.valueType === 'LiteralBoolean')
                            template += valueBooleanEdit;
                        else if (scope.edit.valueType === 'LiteralInteger' || 
                                scope.edit.valueType === 'LiteralUnlimitedNatural' ||
                                scope.edit.valueType === 'LiteralReal')
                            template += valueNumberEdit;
                    }
                    template += saveTemplate;
                    element.empty();
                    var el = $compile(template)(scope);
                    element.append(el);
                });
            });
        });
        scope.save = function() {
            if (scope.edit.type === 'Property' && angular.isArray(scope.edit.value)) {
                var i = 0;
                for (i = 0; i < scope.values.length; i++) {
                    if (scope.edit.value.length < i+1) {
                        scope.edit.value.append(scope.values[i].value);
                    } else
                        scope.edit.value[i] = scope.values[i].value;
                }
                scope.edit.value.length = i;
            }
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