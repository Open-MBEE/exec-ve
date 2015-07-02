'use strict';

angular.module('mms.directives')
.directive('mmsViewReorder', ['ElementService', 'ViewService', '$templateCache', 'growl', '$q', '_', mmsViewReorder]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsViewReorder
 *
 * @requires mms.ViewService
 * @requires $templateCache
 *
 * @restrict E
 *
 * @description
 * Visualize and edit the structure of a view 
 *
 * @param {string} mmsVid The id of the view
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsViewReorder(ElementService, ViewService, $templateCache, growl, $q, _) {
    var template = $templateCache.get('mms/templates/mmsViewReorder.html');

    var mmsViewReorderCtrl = function($scope, ViewService) {
        this.getEditing = function() {
            return $scope.editing;
        };
        $scope.treeOptions = {
            accept: function(sourceNodeScope, destNodeScope, destIndex) {
                var auto = [ViewService.typeToClassifierId.Image, ViewService.typeToClassifierId.Paragraph,
                ViewService.typeToClassifierId.List, ViewService.typeToClassifierId.Table, ViewService.typeToClassifierId.Section];

                if (auto.indexOf(sourceNodeScope.element.instanceSpecification.specialization.classifier[0]) >= 0)
                    return false;
                if (destNodeScope.$element.hasClass('root'))
                    return true;
                if (destNodeScope.element.presentationElement.type === 'Section')
                    return true;
                return false;
            }
        };
    };

    var mmsViewReorderLink = function(scope, element, attrs) {
        scope.$watch('mmsVid', function(newVal, oldVal) {
            if (!newVal)
                return;
            
            ViewService.getView(scope.mmsVid, false, scope.mmsWs, scope.mmsVersion)
            .then(function(data) {
                scope.view = data;
                scope.lastModified = data.lastModified;
                scope.author = data.author;
                scope.edit = { sysmlid: data.sysmlid };
                scope.edit.specialization = _.cloneDeep(scope.view.specialization);

                scope.editable = scope.view.editable && scope.mmsVersion === 'latest';

                if (data.specialization.contents) {
                    ViewService.getElementReferenceTree(data.specialization.contents, scope.mmsWs, scope.mmsVersion).then(function(elementReferenceTree) {
                        scope.elementReferenceTree = elementReferenceTree;
                        scope.originalElementReferenceTree = _.cloneDeep(elementReferenceTree);
                    });
                }

            }, function(reason) {
                growl.error('View Error: ' + reason.message);
            });
        });

        scope.editing = false;
        scope.elementReferenceTree = {};

        scope.toggleEditing = function() {
            if (!scope.editable) 
                return false;
            scope.editing = !scope.editing;
            return true;
        };

        scope.save = function() {
            var deferred = $q.defer();
            if (!scope.editable || !scope.editing) {
                deferred.reject({type: 'error', message: "View isn't editable and can't be saved."});
                return deferred.promise;
            }

            // Update the View edit object on Save
            if (scope.edit.specialization.contents) {
                scope.edit.specialization.contents.operand = [];
                for (var i = 0; i < scope.elementReferenceTree.length; i++) {
                    scope.edit.specialization.contents.operand.push(scope.elementReferenceTree[i].instanceVal);
                }
            }

            ViewService.updateView(scope.edit, scope.mmsWs)
            .then(function(data) {
                angular.forEach(scope.elementReferenceTree, function(elementReference) {
                    updateSectionElementOrder(elementReference);
                });

                deferred.resolve(data);

            }, function(reason) {
                deferred.reject(reason);
            });

            var updateSectionElementOrder = function(elementReference) {
                var sectionEdit = { sysmlid: elementReference.instance };
                sectionEdit.specialization = _.cloneDeep(elementReference.instanceSpecification.specialization);
                sectionEdit.specialization.instanceSpecificationSpecification.operand = [];
                
                var sectionElements = elementReference.sectionElements;
                angular.forEach(sectionElements, function(sectionElement) {
                    sectionEdit.specialization.instanceSpecificationSpecification.operand.push(sectionElement.instanceVal);
    
                    if (sectionElement.sectionElements.length > 0)
                         updateSectionElementOrder(sectionElement);
                });

                ElementService.updateElement(sectionEdit, scope.mssWs)
                .then(function(data) {
                }, function(reason) {
                });

            };



            return deferred.promise;
        };

        scope.revert = function() {
            scope.elementReferenceTree = _.clone(scope.originalElementReferenceTree);
        };

        scope.refresh = function() {
            if (scope.view.specialization.contents) {
                ViewService.getElementReferenceTree(scope.view.specialization.contents, scope.mmsWs, scope.mmsVersion).then(function(elementReferenceTree) {
                    scope.elementReferenceTree = elementReferenceTree;
                    scope.originalElementReferenceTree = _.cloneDeep(elementReferenceTree);
                });
            }            
        };

        if (angular.isObject(scope.mmsViewReorderApi)) {
            var api = scope.mmsViewReorderApi;
            api.toggleEditing = scope.toggleEditing;
            api.save = scope.save;
            api.refresh = scope.refresh;
            api.setEditing = function(mode) {
                if (!scope.editable && mode)
                    return false;
                scope.editing = mode;
            };
            api.revertEdits = scope.revert;
        }
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsVid: '@',
            mmsWs: '@',
            mmsVersion: '@',
            mmsOrder: '=',
            mmsViewReorderApi: '='
        },
        controller: ['$scope', 'ViewService', mmsViewReorderCtrl],
        link: mmsViewReorderLink
    };
}