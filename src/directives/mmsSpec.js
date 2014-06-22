'use strict';

angular.module('mms.directives')
.directive('mmsSpec', ['ElementService', '$compile', '$templateCache', '$modal', 'growl', mmsSpec]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsSpec
 *
 * @requires mms.ElementService
 * @requires $compile
 *
 * @restrict E
 *
 * @description
 * Outputs a "spec window" of the element whose id is specified. Spec includes name,
 * documentation, and value if the element is a property. Also last modified time, 
 * last user, element id. Fields are editable and will be saved to server on clicking 
 * save button. Documentation and string values can have html and can transclude other
 * element properties.  
 *
 * @param {string} mmsEid The id of the element
 * @param {string} mmsWs Workspace to use, defaults to master
 * @param {string} mmsVersion Version can be alfresco version number or timestamp, default is latest
 * @param {string} mmsEditField One of ["all", "none", "name", "doc", or "val" if property]
 * @param {Array=} mmsCfElements Array of element objects as returned by ElementService
 *      that can be transcluded into documentation or string values. Regardless, transclusion
 *      allows keyword searching elements to transclude from alfresco
 * @param {Object=} mmsElement An element object, if this is provided, a read only 
 *      element spec for it would be shown, this will not use mms services to get the element
 */
function mmsSpec(ElementService, $compile, $templateCache, $modal, growl) {
    //var readTemplate = $templateCache.get('mms/templates/mmsSpec.html');
    //var editTemplate = $templateCache.get('mms/templates/mmsSpecEdit.html');
    var template = $templateCache.get('mms/templates/mmsSpec.html');

    var mmsSpecLink = function(scope, element, attrs) {
        scope.editing = false;
        scope.editable = true;
        if (scope.mmsElement) {
            scope.element = scope.mmsElement;
            if (scope.element.specialization.type === 'Property')
                scope.values = scope.element.specialization.value;
            scope.editable = false;
            //element.empty();
            //element.append(readTemplate);
            //$compile(element.contents())(scope);
            return;
        }
        scope.$watch('mmsEid', function(newVal, oldVal) {
            if (!newVal) {
                //element.empty();
                return;
            }
            ElementService.getElement(scope.mmsEid, false, scope.mmsWs, scope.mmsVersion)
            .then(function(data) {
                //element.empty();
                //var template = null;
                scope.element = data;
                scope.editing = false;
                if (scope.element.specialization.type === 'Property')
                    scope.values = scope.element.specialization.value;
                if (scope.mmsEditField === 'none' || 
                        !scope.element.editable || 
                        (scope.mmsVersion !== 'latest' && scope.mmsVersion)) {
                    scope.editable = false;
                    //template = readTemplate;
                    
                    //element.append(template);
                    //$compile(element.contents())(scope); 
                } else {
                    ElementService.getElementForEdit(scope.mmsEid, false, scope.mmsWs)
                    .then(function(data) {
                        scope.edit = data;
                        scope.editable = true;
                        //template = editTemplate;
                        if (scope.edit.specialization.type === 'Property' && 
                                angular.isArray(scope.edit.specialization.value)) {
                            scope.editValues = scope.edit.specialization.value;
                        }
                        //element.append(template);
                        //$compile(element.contents())(scope); 
                    });
                }
            }, function(reason) {
                growl.error("Getting Element Error: " + reason.message);
            });
        });

        var conflictCtrl = function($scope, $modalInstance) {
            $scope.ok = function() {
                $modalInstance.close('ok');
            };
            $scope.cancel = function() {
                $modalInstance.dismiss();
            };
            $scope.force = function() {
                $modalInstance.close('force');
            };
            $scope.merge = function() {
                $modalInstance.close('merge');
            };
        };

        scope.save = function() {
            ElementService.updateElement(scope.edit, scope.mmsWs)
            .then(function(data) {
                growl.success("Save successful");
                scope.editing = false;
            }, function(reason) {
                if (reason.status === 409) {
                    scope.latest = reason.data.elements[0];
                    var instance = $modal.open({
                        template: $templateCache.get('mms/templates/saveConflict.html'),
                        controller: ['$scope', '$modalInstance', conflictCtrl],
                        scope: scope,
                        size: 'lg'
                    });
                    instance.result.then(function(choice) {
                        if (choice === 'ok') {
                            ElementService.getElementForEdit(scope.mmsEid, true, scope.mmsWs)
                            .then(function(data) {
                                growl.info("Element Updated to Latest");
                            }, function(reason) {
                                growl.error("Element Update Error: " + reason.message);
                            }); 
                        } else if (choice === 'merge') { 
                            ElementService.getElement(scope.mmsEid, true, scope.mmsWs)
                            .then(function(data) {
                                var currentEdit = scope.edit;
                                if (data.name !== currentEdit.name)
                                    currentEdit.name = data.name + ' MERGE ' + currentEdit.name;
                                if (data.documentation !== currentEdit.documentation)
                                    currentEdit.documentation = data.documentation + '<p>MERGE</p>' + currentEdit.documentation;
                                currentEdit.read = data.read;
                                growl.info("Element name and doc merged");
                            }, function(reason2) {
                                growl.error("Merge error: " + reason2.message);
                            });
                        } else if (choice === 'force') {
                            scope.edit.read = scope.latest.read;
                            scope.save();
                        }
                    });
                } else {
                    growl.error("Save Error: Status " + reason.status);
                }
            });
        };

        scope.hasHtml = function(s) {
            if (s.indexOf('<p>') === -1)
                return false;
            return true;
        };

        scope.addValueTypes = {string: 'LiteralString', boolean: 'LiteralBoolean', integer: 'LiteralInteger', real: 'LiteralReal'};
        scope.addValue = function(type) {
            if (type === 'LiteralBoolean')
                scope.editValues.push({type: type, boolean: false});
            else if (type === 'LiteralInteger')
                scope.editValues.push({type: type, integer: 0});
            else if (type === 'LiteralString')
                scope.editValues.push({type: type, string: ''});
            else if (type === 'LiteralReal')
                scope.editValues.push({type: type, double: 0.0});
        };
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsEid: '@',
            mmsEditField: '@', //all or none or individual field
            mmsWs: '@',
            mmsVersion: '@',
            mmsCfElements: '=', //array of element objects
            mmsElement: '='
        },
        link: mmsSpecLink
    };
}