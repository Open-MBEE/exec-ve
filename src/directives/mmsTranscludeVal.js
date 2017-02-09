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

    var mmsTranscludeValLink = function(scope, element, attrs, controllers) {
        var mmsViewCtrl = controllers[0];
        var mmsViewPresentationElemCtrl = controllers[1];
        var mmsCfDocCtrl = controllers[2];
        var mmsCfValCtrl = controllers[3];
        scope.recompileScope = null;
        var processed = false;
        scope.cfType = 'val';
        element.click(function(e) {
            if (scope.addFrame && !scope.nonEditable)
                scope.addFrame();

            if (mmsViewCtrl)
                mmsViewCtrl.transcludeClicked(scope.mmsElementId, scope.projectId, scope.refId, scope.commitId);
            if (scope.nonEditable) {
                growl.warning("Cross Reference is not editable.");
            }
            e.stopPropagation();
        
        });
        scope.addHtml = function(value) {
            value.value = "<p>" + value.value + "</p>";
        };
        var recompile = function() {
            if (scope.recompileScope)
                scope.recompileScope.$destroy();
            scope.isEditing = false;
            var toCompileList = [];
            var areStrings = false;
            var isExpression = false;

            for (var i = 0; i < scope.values.length; i++) {
                if (scope.values[i].type === 'LiteralString') {
                    areStrings = true;
                    var s = scope.values[i].value;
                    if (s.indexOf('<p>') === -1) {
                        s = s.replace('<', '&lt;');
                    }
                    toCompileList.push(s);
                } else if (scope.values[i].type === 'Expression') {
                    isExpression = true;
                    break;
                } else {
                    break;
                }
            } 
            element.empty();
            scope.recompileScope = scope.$new();
            if (scope.values.length === 0 || Object.keys(scope.values[0]).length < 2)
                element[0].innerHTML = '<span class="no-print">' + ((scope.commitId === 'latest') ? '(no value)' : '') + '</span>';
            else if (areStrings) {
                var toCompile = toCompileList.join(' ');
                if (toCompile === '' || emptyRegex.test(toCompile)) {
                    element[0].innerHTML = '<span class="no-print">' + ((scope.commitId === 'latest') ? '(no value)' : '') + '</span>';
                    return;
                }
                element[0].innerHTML = toCompile;
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, element[0]]);
                $compile(element.contents())(scope.recompileScope); 
            } else if (UtilsService.isRestrictedValue(scope.values)) {
                ElementService.getElement(scope.values[0].operand[1].element, false, scope.refId, scope.commitId, 2)
                .then(function(e) {
                    scope.isRestrictedVal = true;
                    element[0].innerHTML = "<span>" + e.name + "</span>";
                });
            } else if (isExpression) {
                $http.get(URLService.getElementURL(scope.mmsElementId, scope.refId, scope.commitId) + '&evaluate')
                .success(function(data,status,headers,config) {
                    element[0].innerHTML = data.elements[0].evaluationResult;
                }).error(function(data,status,headers,config){
                    //URLService.handleHttpStatus(data, status, headers, config, deferred);
                    //TODO: Needs case statement when .error is thrown
                });
            } else {
                element[0].innerHTML = valTemplate;
                //element.append(valTemplate);
                $compile(element.contents())(scope.recompileScope);
            }
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.element);
            }
        };

        var recompileEdit = function() {
            if (scope.recompileScope)
                scope.recompileScope.$destroy();
            var toCompileList = [];
            var areStrings = false;
            for (var i = 0; i < scope.editValues.length; i++) {
                if (scope.editValues[i].type === 'LiteralString') {
                    areStrings = true;
                    var s = scope.editValues[i].value;
                    if (s.indexOf('<p>') === -1) {
                        s = s.replace('<', '&lt;');
                    }
                    toCompileList.push(s);
                } else {
                    break;
                }
            } 
            element.empty();
            scope.recompileScope = scope.$new();
            if (scope.editValues.length === 0 || Object.keys(scope.editValues[0]).length < 2)
                element[0].innerHTML = '<span' + ((scope.commitId === 'latest') ? '' : ' class="placeholder"') + '>(no value)</span>';
            else if (areStrings) {
                var toCompile = toCompileList.join(' ');
                if (toCompile === '' || /^\s*$/.test(toCompile)) {
                    element[0].innerHTML = '<span' + ((scope.commitId === 'latest') ? '' : ' class="placeholder"') + '>(no value)</span>';
                    return;
                }
                element[0].innerHTML = '<div class="panel panel-info">'+toCompile+'</div>';
                $compile(element.contents())(scope.recompileScope); 
            } else if (UtilsService.isRestrictedValue(scope.editValues)) {
                ElementService.getElement(scope.editValues[0].operand[1].element, false, scope.refId, scope.commitId, 2)
                .then(function(e) {
                    element[0].innerHTML = e.name;
                });
            } else {
                element[0].innerHTML = editTemplate;
                //element.append(editTemplate);
                $compile(element.contents())(scope.recompileScope);
            }
        };

        var idwatch = scope.$watch('mmsElementId', function(newVal, oldVal) {
            if (!newVal)
                return;
            idwatch();
            if (UtilsService.hasCircularReference(scope, scope.mmsElementId, 'val')) {
                //$log.log("prevent circular dereference!");
                element.html('<span class="mms-error">Circular Reference!</span>');
                return;
            }
            element.html('(loading...)');
            element.addClass("isLoading");
            var refId = scope.mmsRefId;
            var commitId = scope.mmsVersion;
            if (mmsCfValCtrl) {
                var cfvVersion = mmsCfValCtrl.getWsAndVersion();
                if (!refId)
                    refId = cfvVersion.workspace;
                if (!commitId)
                    commitId = cfvVersion.commitId;
            }
            if (mmsCfDocCtrl) {
                var cfdVersion = mmsCfDocCtrl.getWsAndVersion();
                if (!refId)
                    refId = cfdVersion.workspace;
                if (!commitId)
                    commitId = cfdVersion.commitId;
            }
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getWsAndVersion();
                if (!refId)
                    refId = viewVersion.workspace;
                if (!commitId)
                    commitId = viewVersion.commitId;
            }
            scope.refId = refId ? refId : 'master';
            scope.commitId = commitId ? commitId : 'latest';
            ElementService.getElement(scope.mmsElementId, false, refId, commitId, 1)
            .then(function(data) {
                scope.element = data;
                if (scope.element.type === 'Property' || scope.element.type === 'Port') {
                    if (scope.element.defaultValue)
                        scope.values = [scope.element.defaultValue];
                    else
                        scope.values = [];
                }
                if (scope.element.type === 'Slot') {
                    scope.values = scope.element.value;
                }
                if (scope.element.type === 'Constraint' && scope.element.specification)
                    scope.values = [scope.element.specification];
                if (scope.element.type==='Expression') {
                    scope.values = scope.element.operand;
                }
                recompile();
                //scope.$watch('values', recompile, true);
                if (scope.commitId === 'latest') {
                    scope.$on('element.updated', function(event, eid, refId, type, continueEdit) {
                        if (eid === scope.mmsElementId && refId === scope.refId && (type === 'all' || type === 'value') && !continueEdit)
                            recompile();
                    });
                    //actions for stomp 
                    scope.$on("stomp.element", function(event, deltaSource, deltaWorkspaceId, deltaElementId, deltaModifier, elemName){
                        if(deltaWorkspaceId === scope.refId && deltaElementId === scope.mmsElementId){
                            if(scope.isEditing === false){
                                recompile();
                            }
                            if(scope.isEditing === true){
                                growl.warning("This value has been changed: " + elemName +
                                            " modified by: " + deltaModifier, {ttl: -1});
                            }
                        }
                    });
                }
            }, function(reason) {
                var status = ' not found';
                if (reason.status === 410)
                    status = ' deleted';
                element.html('<span class="mms-error">value cf ' + newVal + status + '</span>');
                //growl.error('Cf Val Error: ' + reason.message + ': ' + scope.mmsElementId);
            }).finally(function() {
                element.removeClass("isLoading");
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
            scope.isDirectChildOfPresentationElement = Utils.isDirectChildOfPresentationElementFunc(element, mmsViewCtrl);
            scope.view = mmsViewCtrl.getView();
            var type = "value";

            scope.save = function() {
                Utils.saveAction(scope, recompile, scope.bbApi, null, type, element);
            };

            scope.saveC = function() {
                Utils.saveAction(scope, recompile, scope.bbApi, null, type, element, true);
            };

            scope.cancel = function() {
                Utils.cancelAction(scope, recompile, scope.bbApi, type, element);
            };

            scope.addFrame = function() {
                if (scope.isRestrictedVal) {
                    var options = [];
                    scope.values[0].operand[2].operand.forEach(function(o) {
                        options.push(o.element);
                    });
                    ElementService.getElements(options, false, scope.refId, scope.commitId)
                    .then(function(elements) {
                        scope.options = elements;
                        Utils.addFrame(scope, mmsViewCtrl, element, frameTemplate);
                    });
                } else {
                    //The editor check occurs here; should get "not supported for now" from here

                    // check if data has been loaded for specified id
                    var id = scope.element.typeId;
                    if (scope.element.type === 'Slot')
                        id = scope.element.definingFeatureId;
                    if (!id || (scope.isEnumeration && scope.options)) {
                        Utils.addFrame(scope, mmsViewCtrl, element, frameTemplate);
                        return;
                    }
                    // otherwise get property spec 
                    Utils.getPropertySpec(scope.element,scope.refId,scope.commitId)
                    .then( function(value) {
                        scope.isEnumeration = value.isEnumeration;
                        scope.isSlot = value.isSlot;
                        scope.options = value.options;
                      //if ( !scope.isSlot || !scope.isEnumeration)
                        Utils.addFrame(scope, mmsViewCtrl, element, frameTemplate);
                    }, function(reason) {
                        Utils.addFrame(scope, mmsViewCtrl, element, frameTemplate);
                        growl.error('Failed to get property spec: ' + reason.message);
                    });
                }
            };

            scope.preview = function() {
                Utils.previewAction(scope, recompileEdit, recompile, type, element);
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
            mmsElementId: '@',
            mmsRefId: '@',
            mmsVersion: '@',
            nonEditable: '<'
        },
        require: ['?^^mmsView','?^^mmsViewPresentationElem', '?^^mmsTranscludeDoc', '?^^mmsTranscludeVal'],
        controller: ['$scope', mmsTranscludeCtrl],
        link: mmsTranscludeValLink
    };
}