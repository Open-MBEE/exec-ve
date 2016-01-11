'use strict';

angular.module('mms.directives')
.directive('mmsCkeditor', ['ElementService', 'ViewService', 'CacheService', '$modal', '$templateCache', '$window', '$timeout', 'growl', 'CKEDITOR','tinymce', mmsCkeditor]);

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
function mmsCkeditor(ElementService, ViewService, CacheService, $modal, $templateCache, $window, $timeout, growl, CKEDITOR, tinymce) { //depends on angular bootstrap
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

        var transcludeCtrl = function($scope, $modalInstance) {
            var autocompleteName;
            var autocompleteProperty;
            var autocompleteElementId;

            $scope.cacheElements = CacheService.getLatestElements(scope.mmsWs);
            $scope.autocompleteItems = [];

            $scope.cacheElements.forEach(function(cacheElement) {
                $scope.autocompleteItems.push({ 'sysmlid' : cacheElement.sysmlid, 'name' : cacheElement.name + ' - name' });
                $scope.autocompleteItems.push({ 'sysmlid' : cacheElement.sysmlid, 'name' : cacheElement.name + ' - documentation' });

                if (cacheElement.specialization && cacheElement.specialization.type === 'Property') {
                    $scope.autocompleteItems.push({ 'sysmlid' : cacheElement.sysmlid, 'name' : cacheElement.name + ' - value' });
                }
            });

            $scope.searchClass = "";
            $scope.proposeClass = "";
            var originalElements = $scope.mmsCfElements;
            $scope.filter = '';
            $scope.searchText = '';
            $scope.newE = {name: '', documentation: ''};
            $scope.searchSuccess = false;
            $scope.requestName = false;
            $scope.requestDocumentation = false;
            $scope.searchType = 'name';

            $scope.setSearchType = function(searchType) {
                $scope.searchType = searchType;
                angular.element('.btn-search-name').removeClass('active');
                angular.element('.btn-search-documentation').removeClass('active');
                angular.element('.btn-search-value').removeClass('active');
                angular.element('.btn-search-id').removeClass('active');
                angular.element('.btn-search-' + searchType).addClass('active');
            };
            $scope.choose = function(elementId, property, name) {
                var tag = '<mms-transclude-' + property + ' data-mms-eid="' + elementId + '">[cf:' + name + '.' + property + ']</mms-transclude-' + property + '> ';
                $modalInstance.close(tag);
            };
            $scope.cancel = function() {
                $modalInstance.dismiss();
            };
            $scope.search = function(searchText) {
                // var searchText = $scope.searchText; //TODO investigate why searchText isn't in $scope
                $scope.searchClass = "fa fa-spin fa-spinner";
                ElementService.search(searchText, [$scope.searchType], null, false, scope.mmsWs)
                .then(function(data) {
                    $scope.searchSuccess = true;
                    $scope.searchClass = "";

                    // change properties arr to 2-dim to display table
                    data.forEach(function(elem) {
                        if (elem.properties && elem.properties[0]) {
                            var properties = [];
                            for (var i = 0; i < elem.properties.length; i++) {
                                if (i % 3 === 0) {
                                    properties.push([]);
                                }
                                properties[properties.length-1].push(elem.properties[i]);
                            }
                            elem.properties = properties;
                        }
                    });

                    $scope.mmsCfElements = data;
                }, function(reason) {
                    growl.error("Search Error: " + reason.message);
                    $scope.searchClass = "";
                });
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
                    $scope.mmsCfElements = [data];
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
            $scope.showOriginalElements = function() {
                $scope.mmsCfElements = originalElements;
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
                controller: ['$scope', '$modalInstance', transcludeCtrl],
                size: 'sm'
            });

            $timeout(function() {
                angular.element('.autocomplete-modal-typeahead').focus();
            }, 0, false);

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
                controller: ['$scope', '$modalInstance', transcludeCtrl],
                size: 'lg'
            });
            instance.result.then(function(tag) {
                if (!tag) {
                    proposeCallback(ed);
                    return;
                }

                // if (fromAutocomplete) {
                //     ed.execCommand('delete');
                // }
                
                ed.insertHtml( tag );
                // ed.selection.collapse(false);
                // ed.insertContent(tag);
            }, function() {
                // ed.focus();
            });
        };

        var proposeCallback = function() {
            var instance = $modal.open({
                template: proposeModalTemplate,
                scope: scope,
                controller: ['$scope', '$modalInstance', transcludeCtrl],
                size: 'lg'
            });
            instance.result.then(function(tag) {
                return tag;
            });
        };

        var transcludeViewLinkCtrl = function($scope, $modalInstance) {
            $scope.searchClass = "";
            $scope.proposeClass = "";
            $scope.filter = '';
            $scope.searchText = '';
            $scope.mmsCfViewElements = [];
            $scope.choose = function(elementId, name) {
                var tag = '<mms-view-link data-mms-vid="' + elementId + '">[cf:' + name + '.vlink]</mms-view-link> ';
                $modalInstance.close(tag);
            };
            $scope.cancel = function() {
                $modalInstance.dismiss();
            };
            $scope.search = function(searchText) {
                //var searchText = $scope.searchText; //TODO investigate why searchText isn't in $scope
                //growl.info("Searching...");
                $scope.searchClass = "fa fa-spin fa-spinner";
                ElementService.search(searchText, ['name'], null, false, scope.mmsWs)
                .then(function(data) {
                    var views = [];
                    data.forEach(function(v) {
                        if (v.specialization && (v.specialization.type === 'View' || v.specialization.type === 'Product'))
                            views.push(v);
                    });
                    $scope.mmsCfViewElements = views;
                    $scope.searchClass = "";
                }, function(reason) {
                    growl.error("Search Error: " + reason.message);
                    $scope.searchClass = "";
                });
            };
        };

        var viewLinkCallback = function(ed) {
            var instance = $modal.open({
                template: viewLinkModalTemplate,
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
                // ed.selection.collapse(false);
                // ed.insertContent(tag);
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



        $timeout(function() {
          instance = CKEDITOR.replace(attrs.id, {
            customConfig: '/lib/ckeditor/config.js',
            extraPlugins: 'mathjax,autogrow,mmscf,mmscomment,',
            mmscf: {callbackModalFnc: transcludeCallback},
            mmscomment: {callbackModalFnc: commentCallback},
            mathJaxLib: 'http://cdn.mathjax.org/mathjax/2.2-latest/MathJax.js?config=TeX-AMS_HTML',
            autoGrow_minHeight: 200,
            autoGrow_maxHeight: 500,
            autoGrow_bottomSpace: 50,
            extraAllowedContent:'script[language|type|src]; mms-maturity-bar; tms-timely; seqr-timely; mms-d3-observation-profile-chart-io; mms-d3-parallel-axis-chart-io; mms-d3-radar-chart-io; mms-d3-horizontal-bar-chart-io; mms-site-docs; mms-workspace-docs; mms-diagram-block; mms-view-link(mceNonEditable); mms-transclude-doc(mceNonEditable); mms-transclude-name(mceNonEditable); mms-transclude-com(mceNonEditable); mms-transclude-val(mceNonEditable); mms-transclude-img(mceNonEditable); math; maction; maligngroup; malignmark; menclose;merror;mfenced;mfrac;mglyph;mi;mlabeledtr;mlongdiv;mmultiscripts;mn;mo;mover;mpadded;mphantom;mroot;mrow;ms;mscarries;mscarry;msgroup;mstack;msline;mspace;msqrt;msrow;mstyle;msub;msup;msubsup;mtable;mtd;mtext;mtr;munder;munderover',
          });
          CKEDITOR.plugins.addExternal('mmscf','/lib/ckeditor/plugins/mmscf/');
          CKEDITOR.plugins.addExternal('mmscomment','/lib/ckeditor/plugins/mmscomment/');
          instance.on( 'change', function( evt ) {
            // var data = instance.getSnapshot();
            // instance.loadSnapshot( data );
            update();
          });
          instance.on('undo', function(e) {
            var data = instance.getSnapshot();
            instance.loadSnapshot( data );
            update();
          });
          instance.on('redo', function(e) {
            var data = instance.getSnapshot();
            instance.loadSnapshot( data );
            update();
          });
          instance.on('blur', function(e) {
            instance.focusManager.blur();
          });
          // instance.on('key', function(e) {
          //   if (e.data.keyCode === 50 && e.data.domEvent.$.shiftKey) {
          //       autocompleteCallback(instance);
          //   }
          // });
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
