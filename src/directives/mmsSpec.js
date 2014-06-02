'use strict';

angular.module('mms.directives')
.directive('mmsSpec', ['ElementService', '$compile', '$templateCache', '$modal', mmsSpec]);

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
 */
function mmsSpec(ElementService, $compile, $templateCache, $modal) {
    var readTemplate = $templateCache.get('mms/templates/mmsSpec.html');
    var editTemplate = $templateCache.get('mms/templates/mmsSpecEdit.html');
    
    

    var mmsSpecLink = function(scope, element, attrs) {
        scope.$watch('mmsEid', function(newVal, oldVal) {
            if (!newVal) {
                element.empty();
                return;
            }
            ElementService.getElement(scope.mmsEid, false, scope.mmsWs, scope.mmsVersion)
            .then(function(data) {
                var template = null;
                scope.element = data;
                if (scope.mmsEditField === 'none' || !scope.element.editable) {
                    template = readTemplate;
                    element.empty();
                    element.append(template);
                    $compile(element.contents())(scope); 
                } else {
                    ElementService.getElementForEdit(scope.mmsEid, false, scope.mmsWs)
                    .then(function(data) {
                        scope.edit = data;
                        template = editTemplate;
                        if (scope.edit.specialization.type === 'Property' && 
                                angular.isArray(scope.edit.specialization.value)) {
                            scope.values = scope.edit.specialization.value;
                        }
                        element.empty();
                        element.append(template);
                        $compile(element.contents())(scope); 
                    });
                }
            });
        });

        var conflictCtrl = function($scope, $modalInstance) {
            $scope.ok = function() {
                $modalInstance.close('ok');
            };
            $scope.cancel = function() {
                $modalInstance.dismiss();
            };
        };

        scope.save = function() {
            ElementService.updateElement(scope.edit, scope.mmsWs)
            .then(function(data) {
                
            }, function(reason) {
                if (reason === 'Conflict') {
                    var instance = $modal.open({
                        template: $templateCache.get('mms/templates/saveConflict.html'),
                        controller: ['$scope', '$modalInstance', conflictCtrl],
                    });
                    instance.result.then(function() {
                        ElementService.getElementForEdit(scope.mmsEid, true, scope.mmsWs)
                        .then(function(data) {
                            //scope.edit.read = data.read;
                        }); 
                    });
                } else {

                }
            });
        };
    };

    return {
        restrict: 'E',
        //template: template,
        scope: {
            mmsEid: '@',
            mmsEditField: '@', //all or none or individual field
            mmsWs: '@',
            mmsVersion: '@',
            mmsCfElements: '=' //array of element objects
        },
        link: mmsSpecLink
    };
}