'use strict';

angular.module('mms.directives')
.directive('mmsCkeditor', ['CacheService', 'ElementService', 'UtilsService', 'ViewService', '$modal', '$templateCache', '$window', '$timeout', 'growl', 'CKEDITOR', '_', mmsCkeditor]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsCkeditor
 * @element textarea
 *
 * @requires mms.CacheService
 * @requires mms.ElementService
 * @requires mms.UtilsService
 * @requires mms.ViewService
 * @requires $modal
 * @requires $templateCache
 * @requires $window
 * @requires $timeout
 * @requires growl
 * @requires CKEDITOR
 * @requires _
 *
 * @restrict A
 *
 * @description
 * Make any textarea with an ngModel attached to be a CKEditor wysiwyg editor. This
 * requires the CKEditor library. Transclusion is supported. ngModel is required.
 * ### Example
 * <pre>
   <textarea mms-ckeditor ng-model="element.documentation"></textarea>
   </pre>
 *
 * @param {Array=} mmsCfElements Array of element objects as returned by ElementService
 *      that can be transcluded. Regardless, transclusion allows keyword searching 
 *      elements to transclude from alfresco
 */
function mmsCkeditor(CacheService, ElementService, UtilsService, ViewService, $modal, $templateCache, $window, $timeout, growl, CKEDITOR, _) { //depends on angular bootstrap
    var generatedIds = 0;

    var mmsCkeditorLink = function(scope, element, attrs, ngModelCtrl) {
        if (!attrs.id)
            attrs.$set('id', 'mmsCkEditor' + generatedIds++);
        var instance = null;
        var callUpdate = true;

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

            $scope.makeNewAndChoose = function() {
                if (!$scope.newE.name) {
                    growl.error('Error: A name for your new element is required.');
                    return;
                } else if (!$scope.requestName && !$scope.requestDocumentation) {
                    growl.error('Error: Selection of a property to cross-reference is required.');
                    return;
                }
                $scope.proposeClass = "fa fa-spin fa-spinner";
                var sysmlid = UtilsService.createMmsId();
                var currentView = ViewService.getCurrentView();
                var ids = UtilsService.getIdInfo(currentView, scope.mmsSite);
                var currentSiteId = ids.siteId;
                var ownerId = ids.holdingBinId;
                var toCreate = {
                    sysmlid: sysmlid,
                    name: $scope.newE.name, 
                    documentation: $scope.newE.documentation, 
                    specialization: {type: 'Element'},
                    appliedMetatypes: ['_9_0_62a020a_1105704885343_144138_7929'],
                    isMetatype: false
                };
                if (ownerId)
                    toCreate.owner = ownerId;
                ElementService.createElement(toCreate, scope.mmsWs, currentSiteId)
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

            instance.result.then(function(tag) {
                if (!tag) {
                    transcludeCallback(ed, true);
                } else {
                    ed.execCommand('undo');
                    // ed.selection.collapse(false);
                    ed.insertHtml( tag );
                }
            }, function() {
                var focusManager = new CKEDITOR.focusManager( ed );
                focusManager.focus();
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
                    ed.execCommand('undo');
                }                
                // ed.selection.collapse(false);
                ed.insertHtml( tag );
            }, function() {
                var focusManager = new CKEDITOR.focusManager( ed );
                focusManager.focus();
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
            var sysmlid = UtilsService.createMmsId();
            $scope.comment = {
                sysmlid: sysmlid,
                name: 'Comment ' + new Date().toISOString(), 
                documentation: '', 
                specialization: {
                    type: 'Comment'
                },
                appliedMetatypes: ["_9_0_62a020a_1105704885343_144138_7929"],
                isMetatype: false
            };
            $scope.oking = false;
            $scope.ok = function() {
                if ($scope.oking) {
                    growl.info("Please wait...");
                    return;
                }
                $scope.oking = true;
                if (ViewService.getCurrentView())
                    $scope.comment.owner = ViewService.getCurrentView().sysmlid;
                ElementService.createElement($scope.comment, scope.mmsWs, scope.mmsSite)
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
            var ckeditorModalId = $window.ckeditor.activeEditor.windowManager.getWindows()[0]._id;
            angular.element('#' + ckeditorModalId).css('z-index', 99);
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
            { name: 'document',    items : [ 'Source','-','DocProps' ] },
            { name: 'clipboard',   items : [ 'Undo','Redo' ] },
            { name: 'editing',     items : [ 'Find','Replace','-','SelectAll' ] },
            { name: 'tools',       items : [ 'Maximize', 'ShowBlocks' ] },
            // { name: 'forms',       items : [ 'Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField' ] },
            { name: 'basicstyles', items : [ 'Bold','Italic','Underline','Strike','Subscript','Superscript','-','RemoveFormat' ] },
            { name: 'paragraph',   items : [ 'Blockquote','-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock' ] },
            { name: 'links',       items : [ 'Link','Unlink' ] },
            { name: 'insert',      items : ['SpecialChar','Mathjax','eqneditor','PageBreak','HorizontalRule','pbckcode' ] },
            '/',
            { name: 'styles',      items : [ 'Format','FontSize','TextColor','BGColor' ] },
        ];
        var tableToolbar =  { name: 'table',  items: [ 'Table' ] };
        var listToolbar =   { name: 'list',   items: [ 'NumberedList','BulletedList','Outdent','Indent' ] };
        var imageToolbar =  { name: 'image',  items: [ 'base64image','Iframe' ] };
        var customToolbar = { name: 'custom', items : [ 'Mmscf','Mmscomment', 'Mmsvlink', 'mmsreset' ] };
        
        var thisToolbar = defaultToolbar.slice();
        thisToolbar.push(listToolbar);
        thisToolbar.push(tableToolbar);
        thisToolbar.push(imageToolbar);
        thisToolbar.push(customToolbar);
        if (scope.mmsEditorType === 'TableT') {
          thisToolbar = defaultToolbar.slice();
          thisToolbar.push(tableToolbar);
          thisToolbar.push(customToolbar);
        }
        if (scope.mmsEditorType === 'ListT') {
          thisToolbar = defaultToolbar.slice();
          thisToolbar.push(listToolbar);
          thisToolbar.push(customToolbar);
        }
        if (scope.mmsEditorType === 'Figure') {
          thisToolbar = [];
          thisToolbar.push(imageToolbar);
        }
        //if (scope.mmsEditorType === 'ParagraphT' || scope.mmsEditorType === 'Paragraph')
          //  thisToolbar = defaultToolbar + ' | ' + codeToolbar + ' | ' + customToolbar;

        var mmsResetCallback = {
          update: update,
          resetFnc: resetCrossRef
        };
        var update = function() {
          if (callUpdate) {
            // getData() returns CKEditor's HTML content.
            ngModelCtrl.$setViewValue(instance.getData());
          } else {
            callUpdate = true;
          }
        };
        $timeout(function() {
          $(element).val(ngModelCtrl.$modelValue);
          instance = CKEDITOR.replace(attrs.id, {
            // customConfig: '/lib/ckeditor/config.js',
            mmscf: {callbackModalFnc: transcludeCallback},
            mmscomment: {callbackModalFnc: commentCallback},
            mmsvlink: {callbackModalFnc: viewLinkCallback},
            mmsreset: {callback: mmsResetCallback},
            autoGrow_minHeight: 200,
            autoGrow_maxHeight: $window.innerHeight*0.65,
            autoGrow_bottomSpace: 50, 
            contentsCss: 'css/partials/mms.min.css',
            toolbar: thisToolbar,
          });
          // CKEDITOR.plugins.addExternal('mmscf','/lib/ckeditor/plugins/mmscf/');
          // CKEDITOR.plugins.addExternal('mmscomment','/lib/ckeditor/plugins/mmscomment/');
          // CKEDITOR.plugins.addExternal('autogrow','/lib/ckeditor/plugins/autogrow/');
          // CKEDITOR.plugins.addExternal('mathjax','/lib/ckeditor/plugins/mathjax/');
          
          
          instance.on( 'init', function(args) {
              ngModelCtrl.$setPristine();
          });
          var deb = _.debounce(function(e) {
              update();
          }, 1000);
          instance.on( 'change', deb);
          instance.on( 'afterCommandExec', deb);
          instance.on( 'resize', deb);
          instance.on( 'destroy', deb);
          instance.on( 'blur', function(e) {
            // deb();
            instance.focusManager.blur();
          });
          instance.on( 'key', function(e) {
            if (e.data.domEvent.getKeystroke() == CKEDITOR.SHIFT + 50) {
                // try {
                //     e.data.$.preventDefault();
                // } catch(err) {}
                autocompleteCallback(instance);
            }
          });
          if (scope.mmsTinymceApi) {
              scope.mmsTinymceApi.save = function() {
                  instance.save();
                  update();
              };
          }
        }, 0, false);
        
        ngModelCtrl.$render = function() {
            if (!instance)
                instance = CKEDITOR.instances[attrs.id];
            if (instance) {
                callUpdate = false;
                // var bookmarks = instance.getSelection().createBookmarks();
                var ranges = instance.getSelection().getRanges();

                instance.setData(ngModelCtrl.$viewValue || '');
                // instance.getSelection().selectBookmarks( bookmarks );
                instance.getSelection().selectRanges( ranges );
                // instance.undoManager.clear();
                // var doc = instance.document;
                // if (instance.dom.getStyle(doc, 'overflow-y', true) !== 'auto')
                //     instance.dom.setStyle(doc, 'overflow-y', 'auto');
                // var iframe = instance.getContainer().getElementsByTagName('iframe')[0];
                // if (instance.dom.getStyle(iframe, 'height', true) === '0px')
                //     instance.dom.setStyle(iframe, 'height', $window.innerHeight*0.65);
            }
        };
        
        scope.$on('$destroy', function() {
            if (!instance)
                instance = CKEDITOR.instances[attrs.id];
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
            mmsEditorType: '@',
            mmsEditorApi: '='
        },
        link: mmsCkeditorLink
    };
}
