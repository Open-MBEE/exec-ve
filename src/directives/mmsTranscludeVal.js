'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeVal', ['ElementService', 'UtilsService', 'UxService', 'Utils', 'URLService', '$http', '_', '$compile', '$templateCache', 'growl', 'MathJax', mmsTranscludeVal]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeVal
 *
 * @requires mms.ElementService
 * @requires mms.UtilsService
 * @requires mms.URLService
 * @requires mms.UxService
 * @requires mms.Utils
 * @requires $compile
 * @requires $http
 * @requires $templateCache
 * @requires growl
 * @requires _
 * @requires MathJax
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's value binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and val change,
 * and on click. The element should be a Property. Nested transclusions within 
 * string values will also be registered.
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 */
function mmsTranscludeVal(ElementService, UtilsService, UxService, Utils, URLService, $http, _, $compile, $templateCache, growl, MathJax) {
    var valTemplate = $templateCache.get('mms/templates/mmsTranscludeVal.html');
    var frameTemplate = $templateCache.get('mms/templates/mmsTranscludeValFrame.html');
    var editTemplate = $templateCache.get('mms/templates/mmsTranscludeValEdit.html');
    var emptyRegex = /^\s*$/;

    var mmsTranscludeCtrl = function ($scope, $rootScope) {

        $scope.bbApi = {};
        $scope.buttons = [];
        $scope.buttonsInit = false;

        $scope.bbApi.init = function() {
            if (!$scope.buttonsInit) {
                $scope.buttonsInit = true;
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-preview", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-save", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-saveC", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-cancel", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-delete", $scope));
                $scope.bbApi.setPermission("presentation-element-delete", $scope.isDirectChildOfPresentationElement);
            }     
        };

        //INFO this was this.getWsAndVersion
        this.getElementOrigin = function() {
            return {
                projectId: $scope.projectId,
                refId: $scope.refId,
                commitId: $scope.commitId
            };
        };
    };

    var mmsTranscludeValLink = function(scope, domElement, attrs, controllers) {
        var mmsViewCtrl = controllers[0];
        var mmsViewPresentationElemCtrl = controllers[1];
        var mmsCfDocCtrl = controllers[2];
        var mmsCfValCtrl = controllers[3];
        scope.recompileScope = null;
        var processed = false;
        scope.cfType = 'val';
        domElement.click(function(e) {
            if (scope.startEdit && !scope.nonEditable) {
                scope.startEdit();
            }
            if (mmsViewCtrl) {
                mmsViewCtrl.transcludeClicked(scope.element);
            }
            if (scope.nonEditable) {
                growl.warning("Cross Reference is not editable.");
            }
            e.stopPropagation();
        });

        scope.addHtml = function(value) {
            value.value = "<p>" + value.value + "</p>";
        };

        var recompile = function(preview) {
            if (scope.recompileScope) {
                scope.recompileScope.$destroy();
            }
            var toCompileList = [];
            var areStrings = false;
            var isExpression = false;
            var values = scope.values;
            if (preview) {
                values = scope.editValues;
            } else {
                scope.isEditing = false;
            }
            for (var i = 0; i < values.length; i++) {
                if (values[i].type === 'LiteralString') {
                    areStrings = true;
                    var s = values[i].value;
                    if (s.indexOf('<p>') === -1) {
                        s = s.replace('<', '&lt;');
                    }
                    toCompileList.push(s);
                } else if (values[i].type === 'Expression') {
                    isExpression = true;
                    break;
                } else {
                    break;
                }
            } 
            domElement.empty();
            scope.recompileScope = scope.$new();
            if (values.length === 0 || Object.keys(values[0]).length < 2) {
                domElement[0].innerHTML = '<span class="no-print">' + ((scope.commitId === 'latest') ? '(no value)' : '') + '</span>';
            } else if (areStrings) {
                var toCompile = toCompileList.join(' ');
                if (toCompile === '' || emptyRegex.test(toCompile)) {
                    domElement[0].innerHTML = '<span class="no-print">' + ((scope.commitId === 'latest') ? '(no value)' : '') + '</span>';
                    return;
                }
                if (preview) {
                    domElement[0].innerHTML = '<div class="panel panel-info">'+toCompile+'</div>';
                } else {
                    domElement[0].innerHTML = toCompile;
                }
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, domElement[0]]);
                $compile(domElement.contents())(scope.recompileScope);
            } else if (UtilsService.isRestrictedValue(values)) {
                var reqOb = {elementId: values[0].operand[1].elementId, projectId: scope.projectId, refId: scope.refId, commitId: scope.commitId};
                ElementService.getElement(reqOb, 2)
                .then(function(e) {
                    scope.isRestrictedVal = true;
                    domElement[0].innerHTML = "<span>" + e.name + "</span>";
                });
            //TODO check if this is needed or working
            // } else if (isExpression) {
            //     var reqOb = {elementId: scope.mmsElementId, projectId: scope.projectId, refId: scope.refId, commitId: scope.commitId};
            //     $http.get(URLService.getElementURL(reqOb) + '&evaluate')
            //     .success(function(data,status,headers,config) {
            //         element[0].innerHTML = data.elements[0].evaluationResult;
            //     }).error(function(data,status,headers,config){
            //         //URLService.handleHttpStatus(data, status, headers, config, deferred);
            //         //TODO: Needs case statement when .error is thrown
            //     });
            } else {
                if (preview) {
                    domElement[0].innerHTML = editTemplate;
                } else {
                    domElement[0].innerHTML = valTemplate;
                }
                $compile(domElement.contents())(scope.recompileScope);
            }
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.element);
            }
        };

        var idwatch = scope.$watch('mmsElementId', function(newVal, oldVal) {
            if (!newVal)
                return;
            idwatch();
            if (UtilsService.hasCircularReference(scope, scope.mmsElementId, 'val')) {
                domElement.html('<span class="mms-error">Circular Reference!</span>');
                return;
            }
            domElement.html('(loading...)');
            domElement.addClass("isLoading");

            var projectId = scope.mmsProjectId;
            var refId = scope.mmsRefId;
            var commitId = scope.mmsCommitId;
            if (mmsCfValCtrl) {
                var cfvVersion = mmsCfValCtrl.getElementOrigin();
                if (!projectId)
                    projectId = cfvVersion.projectId;
                if (!refId)
                    refId = cfvVersion.refId;
                if (!commitId)
                    commitId = cfvVersion.commitId;
            }
            if (mmsCfDocCtrl) {
                var cfdVersion = mmsCfDocCtrl.getElementOrigin();
                if (!projectId)
                    projectId = mmsCfDocCtrl.projectId;
                if (!refId)
                    refId = mmsCfDocCtrl.refId;
                if (!commitId)
                    commitId = mmsCfDocCtrl.commitId;
            }
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getElementOrigin();
                if (!projectId)
                    projectId = viewVersion.projectId;
                if (!refId)
                    refId = viewVersion.refId;
                if (!commitId)
                    commitId = viewVersion.commitId;
            }
            scope.projectId = projectId;
            scope.refId = refId ? refId : 'master';
            scope.commitId = commitId ? commitId : 'latest';
            var reqOb = {elementId: scope.mmsElementId, projectId: scope.projectId, refId: scope.refId, commitId: scope.commitId};
            ElementService.getElement(reqOb, 1)
            .then(function(data) {
                scope.element = data;
                if (scope.element.type === 'Property' || scope.element.type === 'Port') {
                    if (scope.element.defaultValue) {
                        scope.values = [scope.element.defaultValue];
                    } else {
                        scope.values = [];
                    }
                }
                if (scope.element.type === 'Slot') {
                    scope.values = scope.element.value;
                }
                if (scope.element.type === 'Constraint' && scope.element.specification) {
                    scope.values = [scope.element.specification];
                }
                if (scope.element.type === 'Expression') {
                    scope.values = scope.element.operand;
                }
                recompile();
                if (scope.commitId === 'latest') {
                    scope.$on('element.updated', function (event, elementOb, continueEdit, stompUpdate) {
                        if (elementOb.id === scope.element.id && elementOb._projectId === scope.element._projectId &&
                            elementOb._refId === scope.element._refId && !continueEdit) {
                            //actions for stomp
                            if(stompUpdate && scope.isEditing === true) {
                                growl.warning("This value has been changed: " + elementOb.name +
                                    " modified by: " + elementOb._modifier, {ttl: -1});
                            } else {
                                recompile();
                            }
                        }
                    });
                }
            }, function(reason) {
                var status = ' not found';
                if (reason.status === 410)
                    status = ' deleted';
                domElement.html('<span class="mms-error">value cf ' + newVal + status + '</span>');
            }).finally(function() {
                domElement.removeClass("isLoading");
            });
        });

        scope.hasHtml = function(s) {
            return Utils.hasHtml(s);
        };

        scope.addValueTypes = {string: 'LiteralString', boolean: 'LiteralBoolean', integer: 'LiteralInteger', real: 'LiteralReal'};
        scope.addValue = function(type) {
            if (type === 'LiteralBoolean')
                scope.editValues.push({type: type, value: false});
            else if (type === 'LiteralInteger')
                scope.editValues.push({type: type, value: 0});
            else if (type === 'LiteralString')
                scope.editValues.push({type: type, value: ''});
            else if (type === 'LiteralReal')
                scope.editValues.push({type: type, value: 0.0});
        };
        scope.addValueType = 'LiteralString';
        
        scope.addEnumerationValue = function() {
          scope.editValues.push({type: "InstanceValue", instanceId: scope.options[0]});
        };

        scope.removeVal = function(i) {
            scope.editValues.splice(i, 1);
        };

        if (mmsViewCtrl) {
            scope.isEditing = false;
            scope.elementSaving = false;
            scope.isDirectChildOfPresentationElement = Utils.isDirectChildOfPresentationElementFunc(domElement, mmsViewCtrl);
            scope.view = mmsViewCtrl.getView();
            var type = "value";

            scope.save = function() {
                Utils.saveAction(scope, domElement, false);
            };

            scope.saveC = function() {
                Utils.saveAction(scope, domElement, true);
            };

            scope.cancel = function() {
                Utils.cancelAction(scope, recompile, domElement);
            };

            scope.startEdit = function() {
                if (scope.isRestrictedVal) {
                    var options = [];
                    scope.values[0].operand[2].operand.forEach(function(o) {
                        options.push(o.element);
                    });
                    var reqOb = {elementIds: options, projectId: scope.projectId, refId: scope.refId};

                    ElementService.getElements(reqOb)
                    .then(function(elements) {
                        scope.options = elements;
                        Utils.startEdit(scope, mmsViewCtrl, domElement, frameTemplate, false);
                    });
                } else {
                    var id = scope.element.typeId;
                    if (scope.element.type === 'Slot')
                        id = scope.element.definingFeatureId;
                    if (!id || (scope.isEnumeration && scope.options)) {
                        Utils.startEdit(scope, mmsViewCtrl, domElement, frameTemplate, false);
                        return;
                    }
                    Utils.getPropertySpec(scope.element)
                    .then( function(value) {
                        scope.isEnumeration = value.isEnumeration;
                        scope.isSlot = value.isSlot;
                        scope.options = value.options;
                        Utils.startEdit(scope, mmsViewCtrl, domElement, frameTemplate, false);
                    }, function(reason) {
                        Utils.startEdit(scope, mmsViewCtrl, domElement, frameTemplate, false);
                        growl.error('Failed to get property spec: ' + reason.message);
                    });
                }
            };

            scope.preview = function() {
                Utils.previewAction(scope, recompile, domElement);
            };
        }

        if (mmsViewPresentationElemCtrl) {
            scope.delete = function() {
                Utils.deleteAction(scope,scope.bbApi,mmsViewPresentationElemCtrl.getParentSection());
            };
            scope.instanceSpec = mmsViewPresentationElemCtrl.getInstanceSpec();
            scope.instanceVal = mmsViewPresentationElemCtrl.getInstanceVal();
            scope.presentationElem = mmsViewPresentationElemCtrl.getPresentationElement();
        }
    };

    return {
        restrict: 'E',
        //template: template,
        scope: {
            mmsElementId: '@mmsEid',
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsCommitId: '@',
            nonEditable: '<'
        },
        require: ['?^^mmsView','?^^mmsViewPresentationElem', '?^^mmsTranscludeDoc', '?^^mmsTranscludeVal'],
        controller: ['$scope', mmsTranscludeCtrl],
        link: mmsTranscludeValLink
    };
}