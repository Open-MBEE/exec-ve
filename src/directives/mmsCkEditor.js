'use strict';

angular.module('mms.directives')
.directive('mmsCkeditor', ['ElementService', 'ViewService', 'CacheService', '$modal', '$templateCache', '$window', '$timeout', 'growl', 'CKEDITOR','UtilsService', mmsCkeditor]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsCkeditor
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
 * Make any textarea with an ngModel attached to be a ckeditor wysiwyg editor. This
 * requires the ckeditor library. Transclusion is supported. ngModel is required.
 * ### Example
 * <pre> //TODO update 
   <textarea mms-tinymce ng-model="element.documentation"></textarea>
   </pre>
 *
 * @param {Array=} mmsCfElements Array of element objects as returned by ElementService
 *      that can be transcluded. Regardless, transclusion allows keyword searching 
 *      elements to transclude from alfresco
 */
function mmsCkeditor(ElementService, ViewService, CacheService, $modal, $templateCache, $window, $timeout, growl, CKEDITOR, UtilsService) { //depends on angular bootstrap
    var generatedIds = 0;

    var mmsCkeditorLink = function(scope, element, attrs, ngModelCtrl) {
        if (!attrs.id)
            attrs.$set('id', 'mmsCkEditor' + generatedIds++);
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
                        $scope.choose(data, 'name');
                    } else if ($scope.requestDocumentation) {
                        $scope.choose(data, 'doc');
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

            $timeout(function() {
                angular.element('.autocomplete-modal-typeahead').focus();
            }, 0, false);

//TODO update editor function
            instance.result.then(function(tag) {
                if (!tag) {
                    transcludeCallback(ed, true);
                } else {
                    ed.execCommand('delete');
                    // ed.selection.collapse(false);
                    ed.insertHtml( tag );
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
                    ed.execCommand('delete'); //focusmgr.remove?
                }
                
                // ed.selection.collapse(false);
                ed.insertHtml( tag );
            }, function() {
                var focusManager = new CKEDITOR.focusManager( ed );
                focusManager.focus();
                // ed.focus();
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
                // ed.selection.collapse(false);
                ed.insertHtml( tag );
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
                // ed.selection.collapse(false);
                ed.insertHtml( tag );                
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
                // ed.selection.collapse(false);
                ed.insertHtml( tag );
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
          // getData() returns CKEditor's HTML content.
          ngModelCtrl.$setViewValue(instance.getData());
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
        
        var defaultToolbar = [
            { name: 'document',    items : [ 'Source','-','DocProps','Preview','Print','-','Templates' ] },
            { name: 'clipboard',   items : [ 'Cut','Copy','Paste','PasteText','PasteFromWord','-','Undo','Redo' ] },
            { name: 'editing',     items : [ 'Find','Replace','-','SelectAll','-','SpellChecker', 'Scayt' ] },
            { name: 'forms',       items : [ 'Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField' ] },
            '/',
            { name: 'basicstyles', items : [ 'Bold','Italic','Underline','Strike','Subscript','Superscript','-','RemoveFormat' ] },
            { name: 'paragraph',   items : [ 'Blockquote','CreateDiv','-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock','-','BidiLtr','BidiRtl' ] },
            { name: 'links',       items : [ 'Link','Unlink','Anchor' ] },
            { name: 'tools',       items : [ 'Maximize', 'ShowBlocks' ] },
            { name: 'insert',      items : ['SpecialChar','Mathjax','PageBreak','HorizontalRule' ] },
            '/',
            { name: 'styles',      items : [ 'Styles','Format','Font','FontSize' ] },
            { name: 'colors',      items : [ 'TextColor','BGColor' ] },
            // { name: 'custom',      items : [ 'Mmscf','Mmscomment', 'Mmsvlink' ] },
        ];
        var tableToolbar =  { name: 'table',  items: [ 'Table' ]};
        var listToolbar =   { name: 'list',   items: [ 'NumberedList','BulletedList','Outdent','Indent' ]};
        // var codeToolbar = ' code ';
        var imageToolbar =  { name: 'image',  items: [ 'Image','base64image','Smiley','Flash','IFrame'  ]};
        var customToolbar = { name: 'custom', items : [ 'Mmscf','Mmscomment', 'Mmsvlink' ] };
        var allToolbar = defaultToolbar.slice();
        allToolbar.push(listToolbar);
        allToolbar.push(tableToolbar);
        allToolbar.push(imageToolbar);
        // allToolbar.push(codeToolbar);
        allToolbar.push(customToolbar);
        var thisToolbar = allToolbar;
        // if (scope.mmsTinymceType === 'Equation')
            // thisToolbar = codeToolbar;
        if (scope.mmsTinymceType === 'TableT') {
          thisToolbar = defaultToolbar.slice();
          thisToolbar.push(tableToolbar);
          thisToolbar.push(customToolbar);
        }
        if (scope.mmsTinymceType === 'ListT') {
          thisToolbar = defaultToolbar.slice();
          thisToolbar.push(listToolbar);
          thisToolbar.push(customToolbar);
        }
        if (scope.mmsTinymceType === 'Figure') {
          thisToolbar = [];
          thisToolbar.push(imageToolbar);
        }
        //if (scope.mmsTinymceType === 'ParagraphT' || scope.mmsTinymceType === 'Paragraph')
          //  thisToolbar = defaultToolbar + ' | ' + codeToolbar + ' | ' + customToolbar;

        var options = {
            plugins: 'autoresize charmap code fullscreen image link media nonbreaking paste table textcolor searchreplace noneditable',
            toolbar: thisToolbar,
           
            nonbreaking_force_tab: true,
            paste_data_images: true,
            //skin_url: 'lib/tinymce/skin/lightgray',
            file_picker_callback: imageCallback,
            file_picker_types: 'image',
        };
        
        $timeout(function() {
          instance = CKEDITOR.replace(attrs.id, {
            // customConfig: '/lib/ckeditor/config.js',
            extraPlugins: 'autogrow,mathjax,base64image,mmscf,mmscomment,mmsvlink',
            mmscf: {callbackModalFnc: transcludeCallback},
            mmscomment: {callbackModalFnc: commentCallback},
            mmsvlink: {callbackModalFnc: viewLinkCallback},
            mathJaxLib: 'http://cdn.mathjax.org/mathjax/2.2-latest/MathJax.js?config=TeX-AMS_HTML',
            autoGrow_minHeight: 200,
            autoGrow_maxHeight: $window.innerHeight*0.65,
            autoGrow_bottomSpace: 50,
            extraAllowedContent:'script[language|type|src]; mms-maturity-bar; tms-timely; seqr-timely; mms-d3-observation-profile-chart-io; mms-d3-parallel-axis-chart-io; mms-d3-radar-chart-io; mms-d3-horizontal-bar-chart-io; mms-site-docs; mms-workspace-docs; mms-diagram-block; mms-view-link(mceNonEditable); mms-transclude-doc(mceNonEditable); mms-transclude-name(mceNonEditable); mms-transclude-com(mceNonEditable); mms-transclude-val(mceNonEditable); mms-transclude-img(mceNonEditable); math; maction; maligngroup; malignmark; menclose;merror;mfenced;mfrac;mglyph;mi;mlabeledtr;mlongdiv;mmultiscripts;mn;mo;mover;mpadded;mphantom;mroot;mrow;ms;mscarries;mscarry;msgroup;mstack;msline;mspace;msqrt;msrow;mstyle;msub;msup;msubsup;mtable;mtd;mtext;mtr;munder;munderover',
            pasteFromWordRemoveFontStyles: false,
            disableNativeSpellChecker: false,
            disallowedContent: 'div,font',
            contentsCss: 'css/partials/mms.min.css',
            toolbar: thisToolbar
          });
          // CKEDITOR.plugins.addExternal('mmscf','/lib/ckeditor/plugins/mmscf/');
          // CKEDITOR.plugins.addExternal('mmscomment','/lib/ckeditor/plugins/mmscomment/');
          // CKEDITOR.plugins.addExternal('autogrow','/lib/ckeditor/plugins/autogrow/');
          // CKEDITOR.plugins.addExternal('mathjax','/lib/ckeditor/plugins/mathjax/');
          
          // instance.on('getData', function(e) {
          //     e.content = fixNewLines(e.content);
          // });
          instance.on( 'change', function(e) {
            update();
          });
          // instance.on('undo', function(e) {
          //   var data = instance.getSnapshot();
          //   instance.loadSnapshot( data );
          //   update();
          // });
          // instance.on('redo', function(e) {
          //   var data = instance.getSnapshot();
          //   instance.loadSnapshot( data );
          //   update();
          // });
          instance.on('blur', function(e) {
            instance.focusManager.blur();
          });
          
          instance.on('key', function(e) {
            if (e.data.domEvent.getKeystroke() == CKEDITOR.SHIFT + 50) {
                autocompleteCallback(instance);
            }
          });
        }, 0, false);
        
        scope.$on('$destroy', function() {
            if (instance) {
                instance.destroy();
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
        link: mmsCkeditorLink
    };
}
