'use strict';

angular.module('mms.directives')
.directive('mmsTinymce', ['ElementService', 'ViewService', 'CacheService', '$modal', '$templateCache', '$window', '$timeout', 'growl', 'tinymce','UtilsService','_', mmsTinymce]);

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
function mmsTinymce(ElementService, ViewService, CacheService, $modal, $templateCache, $window, $timeout, growl, tinymce, UtilsService, _) { //depends on angular bootstrap
    var generatedIds = 0;

    var mmsTinymceLink = function(scope, element, attrs, ngModelCtrl) {
        if (!attrs.id)
            attrs.$set('id', 'mmsTinymce' + generatedIds++);
        var instance = null;

        var autocompleteModalTemplate = $templateCache.get('mms/templates/mmsAutocompleteModal.html');
        var transcludeModalTemplate = $templateCache.get('mms/templates/mmsCfModal.html');
        var commentModalTemplate = $templateCache.get('mms/templates/mmsCommentModal.html');
        var chooseImageModalTemplate = $templateCache.get('mms/templates/mmsChooseImageModal.html');
        var viewLinkModalTemplate = $templateCache.get('mms/templates/mmsViewLinkModal.html');
        var proposeModalTemplate = $templateCache.get('mms/templates/mmsProposeModal.html');

        var transcludeCtrl = function($scope, $modalInstance, autocomplete) {
            var autocompleteName;
            var autocompleteProperty;
            var autocompleteElementId;
            if (autocomplete) {
              $scope.cacheElements = CacheService.getLatestElements(scope.mmsWs);
              $scope.autocompleteItems = [];
              $scope.cacheElements.forEach(function(cacheElement) {
                  //JSON.stringify(sampleObject);
                  //console.log("=====THIS IS THE CACHE ===="+ JSON.stringify(cacheElement));
                  $scope.autocompleteItems.push({ 'sysmlid' : cacheElement.sysmlid, 'name' : cacheElement.name + ' - name' });
                  $scope.autocompleteItems.push({ 'sysmlid' : cacheElement.sysmlid, 'name' : cacheElement.name + ' - documentation' });

                  if (cacheElement.specialization && cacheElement.specialization.type === 'Property') {
                      $scope.autocompleteItems.push({ 'sysmlid' : cacheElement.sysmlid, 'name' : cacheElement.name + ' - value' });
                  }
              });
            }
            $scope.title = 'INSERT A CROSS REFERENCE';
            $scope.description = 'Begin by searching for an element, then click a field to cross-reference.';
            $scope.newE = {name: '', documentation: ''};
            $scope.requestName = false;
            $scope.requestDocumentation = false;
            $scope.showProposeLink = true;
            $scope.choose = function(elem, property) {
                var tag = '<mms-transclude-' + property + ' data-mms-eid="' + elem.sysmlid + '">[cf:' + elem.name + '.' + property + ']</mms-transclude-' + property + '> ';
                $modalInstance.close(tag);
            };
            $scope.cancel = function() {
                $modalInstance.dismiss();
            };
            $scope.openProposeModal = function() {
                $modalInstance.close(false);
            };
            // Set search result options
            $scope.searchOptions= {};
            $scope.searchOptions.callback = $scope.choose;
            $scope.searchOptions.emptyDocTxt = 'This field is empty, but you can still click here to cross-reference a placeholder.';
            $scope.makeNew = function() {
                $scope.proposeClass = "fa fa-spin fa-spinner";
                ElementService.createElement({name: $scope.newE.name, documentation: $scope.newE.documentation, specialization: {type: 'Element'}}, scope.mmsWs, scope.mmsSite)
                .then(function(data) {
                    $scope.searchResults = [data];
                    $scope.proposeClass = "";
                }, function(reason) {
                    growl.error("Propose Error: " + reason.message);
                    $scope.proposeClass = "";
                });
            };
            $scope.makeNewAndChoose = function() {
                if (!$scope.newE.name) {
                    growl.error('Error: A name for your new element is required.');
                    return;
                } else if (!$scope.requestName && !$scope.requestDocumentation) {
                    growl.error('Error: Selection of a property to cross-reference is required.');
                    return;
                }

                $scope.proposeClass = "fa fa-spin fa-spinner";
                ElementService.createElement({name: $scope.newE.name, documentation: $scope.newE.documentation, specialization: {type: 'Element'}}, scope.mmsWs, scope.mmsSite)
                .then(function(data) {
                    if ($scope.requestName) {
                        $scope.choose(data.sysmlid, 'name', $scope.newE.name);
                    } else if ($scope.requestDocumentation) {
                        $scope.choose(data.sysmlid, 'doc', $scope.newE.name);
                    }
                    $scope.proposeClass = "";
                }, function(reason) {
                    growl.error("Propose Error: " + reason.message);
                    $scope.proposeClass = "";
                });
            };
            $scope.toggleRadio = function(field) {
                if (field === "name") {
                    $scope.requestName = true;
                    $scope.requestDocumentation = false;
                } else if (field === "documentation") {
                    $scope.requestName = false;
                    $scope.requestDocumentation = true;
                }
            };
            $scope.autocompleteOnSelect = function($item, $model, $label) {
                autocompleteElementId = $item.sysmlid;

                var lastIndexOfName = $item.name.lastIndexOf(" ");
                autocompleteName = $item.name.substring(0, lastIndexOfName);

                var property = $label.split(' ');
                property = property[property.length - 1];

                if (property === 'name') {
                    autocompleteProperty = 'name';
                } else if (property === 'documentation') {
                    autocompleteProperty = 'doc';
                } else if (property === 'value') {
                    autocompleteProperty = 'val';
                }
            };
            $scope.autocomplete = function(success) {
                if (success) {
                    var tag = '<mms-transclude-' + autocompleteProperty + ' data-mms-eid="' + autocompleteElementId + '">[cf:' + autocompleteName + '.' + autocompleteProperty + ']</mms-transclude-' + autocompleteProperty + '> ';
                    $modalInstance.close(tag);
                } else {
                    $modalInstance.close(false);
                }
            };
        };

        var autocompleteCallback = function(ed) {
            var instance = $modal.open({
                template: autocompleteModalTemplate,
                scope: scope,
                resolve: {autocomplete: true},
                controller: ['$scope', '$modalInstance', 'autocomplete', transcludeCtrl],
                size: 'sm'
            });

            instance.result.then(function(tag) {
                if (!tag) {
                    transcludeCallback(ed, true);
                } else {
                    ed.execCommand('delete');
                    ed.selection.collapse(false);
                    ed.insertContent(tag);
                }
            }, function() {
                ed.focus();
            });
        };

        var transcludeCallback = function(ed, fromAutocomplete) {
            var instance = $modal.open({
                template: transcludeModalTemplate,
                scope: scope,
                resolve: {autocomplete: false},
                controller: ['$scope', '$modalInstance', 'autocomplete', transcludeCtrl],
                size: 'lg'
            });
            instance.result.then(function(tag) {
                if (!tag) {
                    proposeCallback(ed);
                    return;
                }

                if (fromAutocomplete) {
                    ed.execCommand('delete');
                }

                ed.selection.collapse(false);
                ed.insertContent(tag);
            }, function() {
                ed.focus();
            });
        };

        var proposeCallback = function(ed) {
            var instance = $modal.open({
                template: proposeModalTemplate,
                scope: scope,
                controller: ['$scope', '$modalInstance', transcludeCtrl],
                size: 'lg'
            });
            instance.result.then(function(tag) {
                ed.selection.collapse(false);
                ed.insertContent(tag);
            });
        };

        var transcludeViewLinkCtrl = function($scope, $modalInstance) {
            $scope.title = 'INSERT VIEW LINK';
            $scope.description = 'Search for a view or content element, click on its name to insert link.';
            $scope.choose = function(elem) {
                var did = null;
                var vid = null;
                var peid = null;
                if (elem.relatedDocuments && elem.relatedDocuments.length > 0) {
                    did = elem.relatedDocuments[0].sysmlid;
                    if (elem.relatedDocuments[0].parentViews.length > 0)
                        vid = elem.relatedDocuments[0].parentViews[0].sysmlid;
                }
                if (elem.specialization.type === 'InstanceSpecification') {
                    if (ViewService.isSection(elem))
                        vid = elem.sysmlid;
                    else
                        peid = elem.sysmlid;
                } else 
                    vid = elem.sysmlid;
                var tag = '<mms-view-link';
                if (did) 
                    tag += ' data-mms-did="' + did + '"';
                if (vid) 
                    tag += ' data-mms-vid="' + vid + '"';
                if (peid) 
                    tag += ' data-mms-peid="' + peid + '"';
                tag += '>[cf:' + elem.name + '.vlink]</mms-view-link> ';
                $modalInstance.close(tag);
            };
            $scope.chooseDoc = function(doc, view, elem) {
                var did = doc.sysmlid;
                var vid = view.sysmlid;
                var peid = null;
                if (ViewService.isSection(elem))
                    vid = elem.sysmlid;
                else if (ViewService.isPresentationElement(elem))
                    peid = elem.sysmlid;
                var tag = '<mms-view-link';
                if (did) 
                    tag += ' data-mms-did="' + did + '"';
                if (vid) 
                    tag += ' data-mms-vid="' + vid + '"';
                if (peid) 
                    tag += ' data-mms-peid="' + peid + '"';
                tag += '>[cf:' + elem.name + '.vlink]</mms-view-link> ';
                $modalInstance.close(tag);
            };
            $scope.cancel = function() {
                $modalInstance.dismiss();
            };
            $scope.mainSearchFilter = function(data) {
                var views = [];
                data.forEach(function(v) {
                    if (v.specialization && (v.specialization.type === 'View' || v.specialization.type === 'Product' || 
                            (ViewService.isPresentationElement(v) && v.relatedDocuments))) {
                        if (v.properties)
                            delete v.properties;
                        views.push(v);
                    }
                });
                return views;
            };
            $scope.searchOptions= {};
            $scope.searchOptions.callback = $scope.choose;
            $scope.searchOptions.relatedCallback = $scope.chooseDoc;
            $scope.searchOptions.filterCallback = $scope.mainSearchFilter;
            $scope.searchOptions.itemsPerPage = 200;
        };

        var viewLinkCallback = function(ed) {
            var instance = $modal.open({
                template: transcludeModalTemplate,
                scope: scope,
                controller: ['$scope', '$modalInstance', transcludeViewLinkCtrl],
                size: 'lg'
            });
            instance.result.then(function(tag) {
                ed.selection.collapse(false);
                ed.insertContent(tag);
            });
        };

        var commentCtrl = function($scope, $modalInstance) {
            $scope.comment = {
                name: '', 
                documentation: '', 
                specialization: {
                    type: 'Comment'
                }
            };
            $scope.oking = false;
            $scope.ok = function() {
                if ($scope.oking) {
                    growl.info("Please wait...");
                    return;
                }
                $scope.oking = true;
                if (ViewService.getCurrentViewId())
                    $scope.comment.owner = ViewService.getCurrentViewId();
                ElementService.createElement($scope.comment, scope.mmsWs)
                .then(function(data) {
                    var tag = '<mms-transclude-com data-mms-eid="' + data.sysmlid + '">comment:' + data.creator + '</mms-transclude-com> ';
                    $modalInstance.close(tag);
                }, function(reason) {
                    growl.error("Comment Error: " + reason.message);
                }).finally(function() {
                    $scope.oking = false;
                });
            };
            $scope.cancel = function() {
                $modalInstance.dismiss();
            };
        };

        var commentCallback = function(ed) {
            var instance = $modal.open({
                template: commentModalTemplate,
                scope: scope,
                controller: ['$scope', '$modalInstance', commentCtrl]
            });
            instance.result.then(function(tag) {
                ed.selection.collapse(false);
                ed.insertContent(tag);
            });
        };

        var imageCtrl = function($scope, $modalInstance) {
            $scope.fileChanged = function(input) {
                var file = input.files[0];
                var reader = new $window.FileReader();
                reader.onload = function() {
                    var data = reader.result;
                    $scope.image.src = data;
                };
                reader.readAsDataURL(file);
            };
            $scope.image = {src: ''};
            $scope.ok = function() {
                $modalInstance.close($scope.image);
            };
            $scope.cancel = function() {
                $modalInstance.dismiss();
            };
        };

        var imageCallback = function(callback, value, meta) {
            angular.element('#mce-modal-block').css('z-index', 98);
            var tinymceModalId = $window.tinymce.activeEditor.windowManager.getWindows()[0]._id;
            angular.element('#' + tinymceModalId).css('z-index', 99);
            var instance = $modal.open({
                template: chooseImageModalTemplate,
                scope: scope,
                controller: ['$scope', '$modalInstance', imageCtrl]
            });
            instance.result.then(function(image) {
                callback(image.src);
            }, function() {
                callback('');
            });
        };

        var update = function() {
            ngModelCtrl.$setViewValue(element.val());
        };

        //fix <br> in pre blocks
        var fixNewLines = function(content) {
            var codeBlocks = content.match(/<pre.*?>[^]*?<\/pre>/mg);
            if(!codeBlocks) return content;
            for(var index=0; index < codeBlocks.length; index++) {
                content = content.replace(codeBlocks[index], codeBlocks[index].replace(/<br\s*\/?>/mgi, "\n"));
            }
            return content;
        };
        var resetCrossRef = function(type, typeString){
            angular.forEach(type, function(value, key){
                var transclusionObject = angular.element(value);
                var transclusionId= angular.element(value).attr('data-mms-eid');
                var transclusionKey = UtilsService.makeElementKey(transclusionId, 'master', 'latest', false);
                var inCache = CacheService.get(transclusionKey);
                if(inCache){
                    transclusionObject.html('[cf:' + inCache.name + typeString);
                }
                else{
                    ElementService.getElement(transclusionId, false, scope.mmsWs, 'latest', 2 ).then(function(data) {
                        transclusionObject.html('[cf:' + data.name + typeString);
                    }, function(reason) {
                        var error;
                        if (reason.status === 410)
                            error = 'deleted';
                        if (reason.status === 404)
                            error = 'not found';
                        transclusionObject.html('[cf:' + error + typeString);
                        });
                }
            });
        };
        var defaultToolbar = 'bold italic underline strikethrough | subscript superscript blockquote | formatselect | fontsizeselect | forecolor backcolor removeformat | alignleft aligncenter alignright | link unlink | charmap searchreplace | undo redo';
        var tableToolbar = ' table ';
        var listToolbar = ' bullist numlist outdent indent ';
        var codeToolbar = ' code ';
        var imageToolbar = ' image media ';
        var customToolbar = ' transclude comment vlink normalize';
        var allToolbar = defaultToolbar + ' | ' + listToolbar + ' | ' + tableToolbar + ' | ' + imageToolbar + ' | ' + codeToolbar + ' | ' + customToolbar;
        var thisToolbar = allToolbar;
        if (scope.mmsTinymceType === 'Equation')
            thisToolbar = codeToolbar;
        if (scope.mmsTinymceType === 'TableT')
            thisToolbar = defaultToolbar + ' | ' + tableToolbar + ' | ' + codeToolbar + ' | ' + customToolbar;
        if (scope.mmsTinymceType === 'ListT')
            thisToolbar = defaultToolbar + ' | ' + listToolbar + ' | ' + codeToolbar + ' | ' + customToolbar;
        if (scope.mmsTinymceType === 'Figure')
            thisToolbar = 'image media | code ';
        //if (scope.mmsTinymceType === 'ParagraphT' || scope.mmsTinymceType === 'Paragraph')
          //  thisToolbar = defaultToolbar + ' | ' + codeToolbar + ' | ' + customToolbar;
        var options = {
            plugins: 'autoresize charmap code fullscreen image link media nonbreaking paste table textcolor searchreplace noneditable',
            //toolbar: 'bold italic underline strikethrough | subscript superscript blockquote | formatselect | fontsizeselect | forecolor backcolor removeformat | alignleft aligncenter alignright | bullist numlist outdent indent | table | link unlink | image media | charmap searchreplace code | transclude comment vlink normalize | mvleft mvright | undo redo',
            relative_urls: false,
            remove_script_host: false,
            convert_urls: false,
            toolbar: thisToolbar,
            menubar: false,
            statusbar: true,
            nonbreaking_force_tab: true,
            selector: '#' + attrs.id,
            autoresize_max_height: $window.innerHeight*0.65,
            paste_retain_style_properties: 'color background-color font-size text-align',
            browser_spellcheck: true,
            invalid_elements: 'div,font',
            extended_valid_elements: 'script[language|type|src],mms-maturity-bar,tms-timely,seqr-timely,mms-d3-observation-profile-chart-io,mms-d3-parallel-axis-chart-io,mms-d3-radar-chart-io,mms-d3-grouped-horizontal-bar-chart-io,mms-site-docs,mms-workspace-docs,mms-diagram-block,mms-view-link[class:mceNonEditable],-mms-transclude-doc[class:mceNonEditable],-mms-transclude-name[class:mceNonEditable],-mms-transclude-com[class:mceNonEditable],-mms-transclude-val[class:mceNonEditable],-mms-transclude-img[class:mceNonEditable],math,maction,maligngroup,malignmark,menclose,merror,mfenced,mfrac,mglyph,mi,mlabeledtr,mlongdiv,mmultiscripts,mn,mo,mover,mpadded,mphantom,mroot,mrow,ms,mscarries,mscarry,msgroup,mstack,msline,mspace,msqrt,msrow,mstyle,msub,msup,msubsup,mtable,mtd,mtext,mtr,munder,munderover',
            custom_elements: 'mms-maturity-bar,tms-timely,seqr-timely,mms-d3-observation-profile-chart-io,mms-d3-parallel-axis-chart-io,mms-d3-radar-chart-io,mms-d3-grouped-horizontal-bar-chart-io,mms-site-docs,mms-workspace-docs,mms-diagram-block,~mms-view-link,~mms-transclude-doc,~mms-transclude-name,~mms-transclude-com,~mms-transclude-val,~mms-transclude-img,math,maction,maligngroup,malignmark,menclose,merror,mfenced,mfrac,mglyph,mi,mlabeledtr,mlongdiv,mmultiscripts,mn,mo,mover,mpadded,mphantom,mroot,mrow,ms,mscarries,mscarry,msgroup,mstack,msline,mspace,msqrt,msrow,mstyle,msub,msup,msubsup,mtable,mtd,mtext,mtr,munder,munderover',
            fix_list_elements: true,
            content_css: 'css/partials/mms.min.css',
            paste_data_images: true,
            //skin_url: 'lib/tinymce/skin/lightgray',
            file_picker_callback: imageCallback,
            file_picker_types: 'image',
            setup: function(ed) {
                ed.addButton('transclude', {
                    title: 'Cross Reference',
                    text: 'Cf',
                    onclick: function() {
                        transcludeCallback(ed, false);
                    }
                });
                ed.addButton('comment', {
                    title: 'Comment',
                    text: 'Comment',
                    onclick: function() {
                        commentCallback(ed);
                    }
                });
                ed.addButton('vlink', {
                    title: 'Insert View Link',
                    text: 'Cf View',
                    onclick: function() {
                        viewLinkCallback(ed);
                    }
                });/* Likely not necessary any more due to non-editable elements

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
*/
                ed.addButton('normalize', {
                    title: 'Update Cross References',
                    text: 'Update Cf',
                    onclick: function() {
                        var body = ed.getBody();
                        body = angular.element(body);
                        resetCrossRef(body.find('mms-transclude-name'), '.name]');
                        resetCrossRef(body.find('mms-transclude-doc'), '.doc]');
                        resetCrossRef(body.find('mms-transclude-val'), '.val]');
                        resetCrossRef(body.find('mms-view-link'), '.vlink]');
                        ed.save();
                        update();
                    }
                });
                
                ed.on('GetContent', function(e) {
                    e.content = fixNewLines(e.content);
                });
                ed.on('init', function(args) {
                    ngModelCtrl.$render();
                    ngModelCtrl.$setPristine();
                });
                ed.on('change', deb);
                var deb = _.debounce(function(e) { ed.save(); update();}, 1000);
                ed.on('undo', function(e) {
                    ed.save();
                    update();
                });
                ed.on('redo', function(e) {
                    ed.save();
                    update();
                });
                ed.on('blur', function(e) {
                    element.blur();
                });
                /*ed.on('keydown', function(e) {
                    if (e.keyCode === 9) { 
                        if (e.shiftKey) 
                            ed.execCommand('Outdent');
                        else 
                            ed.execCommand('Indent');
                        e.preventDefault();
                        return false;
                    }  
                });*/
                ed.on('keydown', function(e) {
                    if (e.shiftKey && e.keyCode === 50) {
                        autocompleteCallback(ed);
                    }
                });
                if (scope.mmsTinymceApi) {
                    scope.mmsTinymceApi.save = function() {
                        ed.save();
                        update();
                    };
                }
            }
        };

        $timeout(function() {
            tinymce.init(options);
            //tinymce.get(attrs.id).focus();
        }, 0, false);

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
            mmsEid: '@',
            mmsWs: '@',
            mmsSite: '@',
            mmsTinymceType: '@',
            mmsTinymceApi: '='
        },
        link: mmsTinymceLink
    };
}
