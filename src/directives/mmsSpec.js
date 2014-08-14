'use strict';

angular.module('mms.directives')
.directive('mmsSpec', ['ElementService', '$compile', '$templateCache', '$modal', '$q', 'growl', '_', mmsSpec]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsSpec
 *
 * @requires mms.ElementService
 * @requires $compile
 * @requires $templateCache
 * @requires $modal
 * @requires growl
 *
 * @restrict E
 *
 * @description
 * Outputs a "spec window" of the element whose id is specified. Spec includes name,
 * documentation, and value if the element is a property. Also last modified time, 
 * last user, element id. Fields are editable and will be saved to server on clicking 
 * save button. Documentation and string values can have html and can transclude other
 * element properties. Conflict can occur during save based on last server read time
 * and offers choice of force save, discard edit or simple merge
 * ## Example spec with full edit (given permission)
 *  <pre>
    <mms-spec mms-eid="element_id" mms-edit-field="all"></mms-spec>
    </pre>
 * ## Example for showing an element spec at a certain time
 *  <pre>
    <mms-spec mms-eid="element_id" mms-version="2014-07-01T08:57:36.915-0700"></mms-spec>
    </pre>
 * ## Example for showing a current element with nothing editable
 *  <pre>
    <mms-spec mms-eid="element_id" mms-edit-field="none"></mms-spec>
    </pre>
 *
 * @param {string} mmsEid The id of the element
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 * @param {string=all} mmsEditField "all" or "none"
 * @param {Array=} mmsCfElements Array of element objects as returned by ElementService
 *      that can be transcluded into documentation or string values. Regardless, transclusion
 *      allows keyword searching elements to transclude from alfresco
 * @param {Object=} mmsElement An element object, if this is provided, a read only 
 *      element spec for it would be shown, this will not use mms services to get the element
 */
function mmsSpec(ElementService, $compile, $templateCache, $modal, $q, growl, _) {
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
        var changeElement = function(newVal, oldVal) {
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
                    scope.edit = null;
                    //scope.$emit('elementEditability', scope.editable);
                    //template = readTemplate;
                    
                    //element.append(template);
                    //$compile(element.contents())(scope); 
                } else {
                    ElementService.getElementForEdit(scope.mmsEid, false, scope.mmsWs)
                    .then(function(data) {
                        scope.edit = data;
                        scope.editable = true;
                        //template = editTemplate;
                        //scope.$emit('elementEditability', scope.editable);
                        if (scope.edit.specialization.type === 'Property' && angular.isArray(scope.edit.specialization.value)) {
                            scope.editValues = scope.edit.specialization.value;
                        }
                        //element.append(template);
                        //$compile(element.contents())(scope); 
                    });
                }
            }, function(reason) {
                //growl.error("Getting Element Error: " + reason.message);
            });
        };

        scope.$watch('mmsEid', changeElement);

        scope.revert = function() {
            scope.edit.name = scope.element.name;
            scope.edit.documentation = scope.element.documentation;
            if (scope.edit.specialization.type === 'Property' && angular.isArray(scope.edit.specialization.value)) {
                scope.edit.specialization.value = _.cloneDeep(scope.element.specialization.value);
                scope.editValues = scope.edit.specialization.value;
            }
        };
        
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
            var deferred = $q.defer();
            if (!scope.editable || !scope.editing) {
                deferred.reject({type: 'error', message: "Element isn't editable and can't be saved."});
                return deferred.promise;
            }
            ElementService.updateElement(scope.edit, scope.mmsWs)
            .then(function(data) {
                deferred.resolve(data);
                //growl.success("Save successful");
                //scope.editing = false;
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
                                //growl.info("Element Updated to Latest");
                                deferred.reject({type: 'info', message: 'Element Updated to Latest'});
                            }, function(reason) {
                                //growl.error("Element Update Error: " + reason.message);
                                deferred.reject({type: 'error', message: 'Element Update Error: ' + reason.message});
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
                                //growl.info("Element name and doc merged");
                                deferred.reject({type: 'info', message: 'Element name and doc merged'});
                            }, function(reason2) {
                                //growl.error("Merge error: " + reason2.message);
                                deferred.reject({type: 'error', message: 'Merge error: ' + reason2.message});
                            });
                        } else if (choice === 'force') {
                            scope.edit.read = scope.latest.read;
                            scope.save().then(function(resolved) {
                                deferred.resolve(resolved);
                            }, function(error) {
                                deferred.reject(error);
                            });
                        }
                    });
                } else {
                    deferred.reject({type: 'error', message: reason.message});
                    //growl.error("Save Error: Status " + reason.status);
                }
            });
            return deferred.promise;
        };

        scope.hasHtml = function(s) {
            if (s.indexOf('<p>') === -1)
                return false;
            return true;
        };

        scope.hasEdits = function() {
            if (scope.edit === null)
                return false;
            if (scope.edit.name !== scope.element.name)
                return true;
            if (scope.edit.documentation !== scope.element.documentation)
                return true;
            if (scope.edit.specialization.type === 'Property' && 
                !_.isEqual(scope.edit.specialization.value, scope.element.specialization.value))
                return true;
            return false;
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
        scope.addValueType = 'LiteralString';

        if (angular.isObject(scope.mmsSpecApi)) {
            var api = scope.mmsSpecApi;
            api.toggleEditing = function() {
                if (!scope.editing) {
                    if (scope.editable)
                        scope.editing = true;
                    else
                        return false;
                } else {
                    scope.editing = false;
                }
                return true;
            };
            api.setEditing = function(mode) {
                if (mode) {
                    if (scope.editable)
                        scope.editing = true;
                    else
                        return false;
                } else
                    scope.editing = false;
                return true;
            };
            api.getEditing = function() {
                return scope.editing;
            };
            api.save = scope.save;
            api.revertEdits = scope.revert;
            api.changeElement = scope.changeElement;
            api.hasEdits = scope.hasEdits;
        }
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
            mmsElement: '=',
            mmsSpecApi: '='
        },
        link: mmsSpecLink
    };
}