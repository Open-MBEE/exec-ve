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
                if (sourceNodeScope.element.isOpaque)
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
        var ran = false;
        scope.$watch('mmsVid', function(newVal, oldVal) {
            if (!newVal || newVal == oldVal && ran)
                return;
            ran = true;
            ViewService.getView(scope.mmsVid, false, scope.mmsWs, scope.mmsVersion)
            .then(function(data) {
                scope.view = data;
                scope.editable = scope.view.editable && scope.mmsVersion === 'latest';

                var contents = data.specialization.contents || data.specialization.instanceSpecificationSpecification;
                if (contents) {
                    ViewService.getElementReferenceTree(contents, scope.mmsWs, scope.mmsVersion)
                    .then(function(elementReferenceTree) {
                        scope.elementReferenceTree = elementReferenceTree;
                        scope.originalElementReferenceTree = _.cloneDeep(elementReferenceTree, function(value, key, object) {
                            if (key === 'instance' || key === 'instanceSpecification' || key === 'presentationElement' || key === 'instanceVal')
                                return value;
                            return undefined;
                        });
                    }, function(reason) {
                        scope.elementReferenceTree = [];
                        scope.originalElementReferenceTree = [];
                    });
                } else {
                    scope.elementReferenceTree = [];
                    scope.originalElementReferenceTree = [];
                }

            }, function(reason) {
                growl.error('View Error: ' + reason.message);
                scope.elementReferenceTree = [];
                scope.originalElementReferenceTree = [];
            });
        });

        scope.editing = false;
        scope.elementReferenceTree = [];
        scope.originalElementReferenceTree = [];

        scope.toggleEditing = function() {
            if (!scope.editable) 
                return false;
            scope.editing = !scope.editing;
            return true;
        };

        scope.save = function() {
            var promises = [];
            var updateSectionElementOrder = function(elementReference) {
                var sectionEdit = { 
                    sysmlid: elementReference.instance,
                    read: elementReference.instanceSpecification.read,
                    modified: elementReference.instanceSpecification.modified
                };
                sectionEdit.specialization = _.cloneDeep(elementReference.instanceSpecification.specialization);
                var operand = sectionEdit.specialization.instanceSpecificationSpecification.operand = [];
                var origOperand = elementReference.instanceSpecification.specialization.instanceSpecificationSpecification.operand;
                for (var i = 0; i < elementReference.sectionElements.length; i++) {
                    operand.push(elementReference.sectionElements[i].instanceVal);
                    if (elementReference.sectionElements[i].sectionElements.length > 0)
                        updateSectionElementOrder(elementReference.sectionElements[i]);
                }
                if (!angular.equals(operand, origOperand))
                    promises.push(ElementService.updateElement(sectionEdit, scope.mmsWs));
            };

            var deferred = $q.defer();
            if (!scope.editable || !scope.editing) {
                deferred.reject({type: 'error', message: "View isn't editable and can't be saved."});
                return deferred.promise;
            }
            if (scope.elementReferenceTree.length === 0) {
                deferred.reject({type: 'error', message: 'View contents were not initialized properly or is empty.'});
                return deferred.promise;
            }
            var viewEdit = { 
                sysmlid: scope.view.sysmlid,
                read: scope.view.read,
                modified: scope.view.modified
            };
            viewEdit.specialization = _.cloneDeep(scope.view.specialization);

            var contents = viewEdit.specialization.contents || viewEdit.specialization.instanceSpecificationSpecification;
            var origContents = scope.view.specialization.contents || scope.view.specialization.instanceSpecificationSpecification;
            // Update the View edit object on Save
            if (contents) {
                contents.operand = [];
                for (var i = 0; i < scope.elementReferenceTree.length; i++) {
                    contents.operand.push(scope.elementReferenceTree[i].instanceVal);
                }
            }
            if (viewEdit.specialization.view2view)
                delete viewEdit.specialization.view2view;
            if (contents && !angular.equals(contents.operand, origContents.operand))
                promises.push(ViewService.updateView(viewEdit, scope.mmsWs));
            for (var j = 0; j < scope.elementReferenceTree.length; j++) {
                if (scope.elementReferenceTree[j].sectionElements.length > 0)
                    updateSectionElementOrder(scope.elementReferenceTree[j]);
            }
            return $q.all(promises);
        };

        scope.revert = function() {
            scope.elementReferenceTree = _.cloneDeep(scope.originalElementReferenceTree, function(value, key, object) {
                if (key === 'instance' || key === 'instanceSpecification' || key === 'presentationElement' || key === 'instanceVal')
                   return value;
                return undefined;
            });
        };

        scope.refresh = function() {
            var contents = scope.view.specialization.contents || scope.view.specialization.instanceSpecificationSpecification;
            if (contents) {
                ViewService.getElementReferenceTree(contents, scope.mmsWs, scope.mmsVersion)
                .then(function(elementReferenceTree) {
                    scope.elementReferenceTree = elementReferenceTree;
                    scope.originalElementReferenceTree = _.cloneDeep(elementReferenceTree, function(value, key, object) {
                        if (key === 'instance' || key === 'instanceSpecification' || key === 'presentationElement' || key === 'instanceVal')
                            return value;
                        return undefined;
                    });
                }, function(reason) {
                    scope.elementReferenceTree = [];
                    scope.originalElementReferenceTree = [];
                });
            } else {
                scope.elementReferenceTree = [];
                scope.originalElementReferenceTree = [];
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