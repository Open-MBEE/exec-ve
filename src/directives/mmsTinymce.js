'use strict';

angular.module('mms.directives')
.directive('mmsTinymce', ['ElementService', 'ViewService', '$modal', '$templateCache', '$window', '$timeout', 'growl', 'tinymce', mmsTinymce]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTinymce
 * @element textarea
 *
 * @requires mms.ElementService
 * @requires mms.ViewService
 * @requires $modal
 * @requires $templateCache
 * @requires $window
 * @requires $timeout
 * @requires growl
 *
 * @restrict A
 *
 * @description
 * Make any textarea with an ngModel attached to be a tinymce wysiwyg editor. This
 * requires the tinymce library. Transclusion is supported. ngModel is required.
 * ### Example
 * <pre>
   <textarea mms-tinymce ng-model="element.documentation"></textarea>
   </pre>
 *
 * @param {Array=} mmsCfElements Array of element objects as returned by ElementService
 *      that can be transcluded. Regardless, transclusion allows keyword searching 
 *      elements to transclude from alfresco
 */
function mmsTinymce(ElementService, ViewService, $modal, $templateCache, $window, $timeout, growl, tinymce) { //depends on angular bootstrap
    var generatedIds = 0;

    var mmsTinymceLink = function(scope, element, attrs, ngModelCtrl) {
        if (!attrs.id)
            attrs.$set('id', 'mmsTinymce' + generatedIds++);
        var instance = null;

        var transcludeModalTemplate = $templateCache.get('mms/templates/mmsCfModal.html');
        var commentModalTemplate = $templateCache.get('mms/templates/mmsCommentModal.html');
        
        var transcludeCtrl = function($scope, $modalInstance) {
            $scope.searchClass = "";
            $scope.proposeClass = "";
            var originalElements = $scope.mmsCfElements;
            $scope.filter = '';
            $scope.searchText = '';
            $scope.choose = function(elementId, property, name) {
                var tag = '<mms-transclude-' + property + ' data-mms-eid="' + elementId + '">[cf:' + name + '.' + property + ']</mms-transclude-' + property + '> ';
                $modalInstance.close(tag);
            };
            $scope.cancel = function() {
                $modalInstance.dismiss();
            };
            $scope.search = function(searchText) {
                //var searchText = $scope.searchText; //TODO investigate why searchText isn't in $scope
                //growl.info("Searching...");
                $scope.searchClass = "fa fa-spin fa-spinner";
                ElementService.search(searchText)
                .then(function(data) {
                    $scope.mmsCfElements = data;
                    $scope.searchClass = "";
                }, function(reason) {
                    growl.error("Search Error: " + reason.message);
                    $scope.searchClass = "";
                });
            };
            $scope.makeNew = function(newName) {
                $scope.proposeClass = "fa fa-spin fa-spinner";
                ElementService.createElement({name: newName, documentation: '', specialization: {type: 'Element'}})
                .then(function(data) {
                    $scope.mmsCfElements = [data];
                    $scope.proposeClass = "";
                }, function(reason) {
                    growl.error("Propose Error: " + reason.message);
                    $scope.proposeClass = "";
                });
            };
            $scope.showOriginalElements = function() {
                $scope.mmsCfElements = originalElements;
            };
        };

        var commentCtrl = function($scope, $modalInstance) {
            $scope.comment = {
                name: '', 
                documentation: '', 
                specialization: {
                    type: 'Comment'
                }
            };
            $scope.ok = function() {
                if (ViewService.getCurrentViewId())
                    $scope.comment.owner = ViewService.getCurrentViewId();
                ElementService.createElement($scope.comment)
                .then(function(data) {
                    var tag = '<mms-transclude-com data-mms-eid="' + data.sysmlid + '">comment:' + data.creator + '</mms-transclude-com> ';
                    $modalInstance.close(tag);
                }, function(reason) {
                    growl.error("Comment Error: " + reason.message);
                });
            };
            $scope.cancel = function() {
                $modalInstance.dismiss();
            };
        };

        var transcludeCallback = function(ed) {
            var instance = $modal.open({
                template: transcludeModalTemplate,
                scope: scope,
                controller: ['$scope', '$modalInstance', transcludeCtrl],
                size: 'lg'
            });
            instance.result.then(function(tag) {
                ed.insertContent(tag);
            });
        };

        var commentCallback = function(ed) {
            var instance = $modal.open({
                template: commentModalTemplate,
                scope: scope,
                controller: ['$scope', '$modalInstance', commentCtrl],
            });
            instance.result.then(function(tag) {
                ed.insertContent(tag);
            });
        };

        var update = function() {
            ngModelCtrl.$setViewValue(element.val());
        };

        var options = {
            plugins: 'autoresize charmap code fullscreen image link media nonbreaking paste table textcolor',
            toolbar: 'bold italic underline strikethrough | subscript superscript blockquote | formatselect | fontsizeselect | forecolor backcolor removeformat | alignleft aligncenter alignright | bullist numlist outdent indent | table | link unlink | image media | charmap code | transclude comment | mvleft mvright | undo redo',
            menubar: false,
            statusbar: true,
            nonbreaking_force_tab: true,
            selector: '#' + attrs.id,
            autoresize_max_height: $window.innerHeight*0.65,
            paste_retain_style_properties: 'color background-color font-size text-align',
            browser_spellcheck: true,
            invalid_elements: 'br,div,font',
            extended_valid_elements: 'mms-diagram-block,-mms-transclude-doc,-mms-transclude-name,-mms-transclude-com,-mms-transclude-val,-mms-transclude-img',
            custom_elements: 'mms-diagram-block,~mms-transclude-doc,~mms-transclude-name,~mms-transclude-com,~mms-transclude-val,~mms-transclude-img',
            fix_list_elements: true,
            content_css: 'css/partials/mms.min.css',
            paste_data_images: true,
            skin_url: 'lib/tinymce/skin/lightgray',
            setup: function(ed) {
                ed.addButton('transclude', {
                    title: 'Cross Reference',
                    text: 'Cf',
                    onclick: function() {
                        transcludeCallback(ed);
                    }
                });
                ed.addButton('comment', {
                    title: 'Comment',
                    text: 'Comment',
                    onclick: function() {
                        commentCallback(ed);
                    }
                });
                ed.addButton('mvleft', {
                    title: 'Move Left of Cf',
                    text: '<-',
                    onclick: function() {
                        var node = ed.selection.getEnd();
                        if (node.nodeName.substr(0,3) === 'MMS') {
                            var space = ed.getDoc().createTextNode('#');
                            var parent = node.parentNode;
                            parent.insertBefore(space, node);
                            ed.selection.select(space);
                        }
                    }
                });
                ed.addButton('mvright', {
                    title: 'Move Right of Cf',
                    text: '->',
                    onclick: function() {
                        var node = ed.selection.getEnd();
                        if (node.nodeName.substr(0,3) === 'MMS') {
                            var space = ed.getDoc().createTextNode('#');
                            var parent = node.parentNode;
                            parent.insertBefore(space, node.nextSibling);
                            ed.selection.select(space);
                        }
                    }
                });
                ed.on('init', function(args) {
                    ngModelCtrl.$render();
                    ngModelCtrl.$setPristine();
                });
                ed.on('change', function(e) {
                    ed.save();
                    update();
                });
                ed.on('blur', function(e) {
                    element.blur();
                });
                ed.on('keydown', function(e) {
                    if (e.keyCode === 9) { 
                        if (e.shiftKey) 
                            ed.execCommand('Outdent');
                        else 
                            ed.execCommand('Indent');
                        e.preventDefault();
                        return false;
                    }  
                });
            }
        };

        $timeout(function() {
            tinymce.init(options);
        });

        ngModelCtrl.$render = function() {
            if (!instance)
                instance = tinymce.get(attrs.id);
            if (instance) {
                instance.setContent(ngModelCtrl.$viewValue || '');
                instance.undoManager.clear();
                var doc = instance.getDoc().documentElement;
                if (instance.dom.getStyle(doc, 'overflow-y', true) !== 'auto')
                    instance.dom.setStyle(doc, 'overflow-y', 'auto');
                var iframe = instance.getContainer().getElementsByTagName('iframe')[0];
                if (instance.dom.getStyle(iframe, 'height', true) === '0px')
                    instance.dom.setStyle(iframe, 'height', $window.innerHeight*0.65);
            }
        };

        scope.$on('$destroy', function() {
            if (!instance)
                instance = tinymce.get(attrs.id);
            if (instance) {
                instance.remove();
                instance = null;
            }
        });
    };

    return {
        priority: 10,
        restrict: 'A',
        require: 'ngModel',
        scope: {
            mmsCfElements: '=',
            mmsEid: '@'
        },
        link: mmsTinymceLink
    };
}
