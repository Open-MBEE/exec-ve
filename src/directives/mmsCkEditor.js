'use strict';

angular.module('mms.directives')
.directive('mmsCkeditor', ['CacheService', 'ElementService', 'UtilsService', 'ViewService', 'URLService', '$uibModal', '$templateCache', '$window', '$timeout', 'growl', 'CKEDITOR', '_', mmsCkeditor]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsCkeditor
 * @element textarea
 *
 * @requires mms.CacheService
 * @requires mms.ElementService
 * @requires mms.UtilsService
 * @requires mms.ViewService
 * @requires $uibModal
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
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 */
function mmsCkeditor(CacheService, ElementService, UtilsService, ViewService, URLService, $uibModal, $templateCache, $window, $timeout, growl, CKEDITOR, _) { //depends on angular bootstrap
    var generatedIds = 0;

    var mmsCkeditorLink = function(scope, element, attrs, ngModelCtrl) {
        if (!attrs.id) {
            attrs.$set('id', 'mmsCkEditor' + generatedIds++);
        }

        var instance = null;
        var autocompleteModalTemplate = $templateCache.get('mms/templates/mmsAutocompleteModal.html');
        var transcludeModalTemplate = $templateCache.get('mms/templates/mmsCfModal.html');
        var commentModalTemplate = $templateCache.get('mms/templates/mmsCommentModal.html');

        // Controller for inserting cross reference
        // Defines scope variables for html template and how to handle user click
        // Also defines options for search interfaces -- see mmsSearch.js for more info
        var transcludeCtrl = function($scope, $uibModalInstance, autocomplete) {
            var autocompleteName;
            var autocompleteProperty;
            var autocompleteElementId;
            if (autocomplete) {
                $scope.cacheElements = CacheService.getLatestElements(scope.mmsProjectId, scope.mmsRefId);
                $scope.autocompleteItems = [];
                $scope.cacheElements.forEach(function(cacheElement) {
                    $scope.autocompleteItems.push({ 'id' : cacheElement.id, 'name' : cacheElement.name , 'type': ' - name' });
                    $scope.autocompleteItems.push({ 'id' : cacheElement.id, 'name' : cacheElement.name , 'type': ' - documentation' });
                    if (cacheElement.type === 'Property') {
                        $scope.autocompleteItems.push({ 'id' : cacheElement.id, 'name' : cacheElement.name , 'type': ' - value' });
                    }
                });
            }

            $scope.title = 'Insert a cross reference';
            $scope.description = 'Begin by searching for an element, then click a field to cross-reference.';
            $scope.newE = {name: '', documentation: ''};
            $scope.requestName = false;
            $scope.requestDocumentation = false;
            $scope.showProposeLink = true;
            $scope.nonEditableCheckbox = false;
            $scope.showEditableOp = true;
            $scope.choose = function(elem, property) {
                var tag = '<mms-cf mms-cf-type="' + property + '" mms-element-id="' + elem.id + '" non-editable="' + $scope.nonEditableCheckbox + '">[cf:' + elem.name + '.' + property + ']</mms-cf>';
                $uibModalInstance.close(tag);
            };
            $scope.cancel = function() {
                $uibModalInstance.dismiss();
            };

             // Set search result options
            $scope.searchOptions= {};
            $scope.searchOptions.getProperties = true;
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
                var id = UtilsService.createMmsId();
                var toCreate = {
                    id: id,
                    ownerId: "holding_bin_" + scope.mmsProjectId,
                    name: $scope.newE.name,
                    documentation: $scope.newE.documentation,
                    type: 'Class',
                    _appliedStereotypeIds: []
                };
                toCreate = UtilsService.createClassElement(toCreate);
                var reqOb = {element: toCreate, projectId: scope.mmsProjectId, refId: scope.mmsRefId};

                ElementService.createElement(reqOb)
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
                autocompleteElementId = $item.id;
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
                    var tag = '<mms-cf mms-cf-type="' + autocompleteProperty + '" mms-element-id="' + autocompleteElementId + '">[cf:' + autocompleteName + '.' + autocompleteProperty + ']</mms-cf>';
                    $uibModalInstance.close(tag);
                } else {
                    $uibModalInstance.close(false);
                }
            };
        };

        var autocompleteCallback = function(ed) {
            var instance = $uibModal.open({
                template: autocompleteModalTemplate,
                windowClass: 've-dropdown-short-modal',
                scope: scope,
                resolve: {autocomplete: true},
                controller: ['$scope', '$uibModalInstance', 'autocomplete', transcludeCtrl],
                size: 'sm'
            });

            instance.result.then(function(tag) {
                if (!tag) {
                    transcludeCallback(ed, true);
                } else {
                    ed.insertHtml( tag );
                }
            }, function() {
                var focusManager = new CKEDITOR.focusManager( ed );
                focusManager.focus();
            });
        };

        var transcludeCallback = function(ed, fromAutocomplete) {
            var instance = $uibModal.open({
                template: transcludeModalTemplate,
                scope: scope,
                resolve: {autocomplete: false},
                controller: ['$scope', '$uibModalInstance', 'autocomplete', transcludeCtrl],
                size: 'lg'
            });
            instance.result.then(function(tag) {
                if (fromAutocomplete) {
                    ed.execCommand('undo');
                }
                ed.insertHtml( tag );
            }, function() {
                var focusManager = new CKEDITOR.focusManager( ed );
                focusManager.focus();
            });
        };

        // Controller for inserting view link
        // Defines scope variables for html template and how to handle user click
        // If user selects name or doc, link will be to first related doc
        // Also defines options for search interfaces -- see mmsSearch.js for more info
        var transcludeViewLinkCtrl = function($scope, $uibModalInstance, ApplicationService) {
            $scope.title = 'Insert view link';

            $scope.description = 'Search for a view or content element, click on its name to insert link.';

            // Function to construct view link
            var createViewLink = function (elem, did, vid, peid) {
                var tag = '<mms-view-link';
                if (did) {
                    tag += ' mms-doc-id="' + did + '"';
                }
                if (vid) {
                    tag += ' mms-element-id="' + vid + '"';
                }
                if (peid) {
                    tag += ' mms-pe-id="' + peid + '"';
                }
                tag += '>[cf:' + elem.name + '.vlink]</mms-view-link> ';
                return tag;
            };

            $scope.choose = function(elem) {
                var did = null;
                var vid = null;
                var peid = null;
                var currentDoc = ApplicationService.getState().currentDoc;
                if (elem._relatedDocuments && elem._relatedDocuments.length > 0) {
                    var cur = _.find(elem._relatedDocuments, {id: currentDoc});
                    if (cur) {
                        did = currentDoc;
                        if (cur._parentViews.length > 0) {
                            vid = cur._parentViews[0].id;
                        }
                    } else {
                        did = elem._relatedDocuments[0].id;
                        if (elem._relatedDocuments[0]._parentViews.length > 0) {
                            vid = elem._relatedDocuments[0]._parentViews[0].id;
                        }
                    }
                }
                if (elem.type === 'InstanceSpecification') {
                    if (ViewService.isSection(elem)) {
                        vid = elem.id;
                    } else {
                        peid = elem.id;
                    }
                } else {
                    vid = elem.id;
                }
                var tag = createViewLink(elem, did, vid, peid);
                $uibModalInstance.close(tag);
            };
            $scope.chooseDoc = function(doc, view, elem) {
                var did = doc.id;
                var vid = view.id;
                var peid = null;
                if (ViewService.isSection(elem)) {
                    vid = elem.id;
                } else if (ViewService.isPresentationElement(elem)) {
                    peid = elem.id;
                }
                var tag = createViewLink(elem, did, vid, peid);
                $uibModalInstance.close(tag);
            };
            $scope.cancel = function() {
                $uibModalInstance.dismiss();
            };

            var mainSearchFilter = function() {
                var stereoQuery = {};
                stereoQuery.terms = {"_appliedStereotypeIds": [UtilsService.VIEW_SID, UtilsService.DOCUMENT_SID].concat(UtilsService.OTHER_VIEW_SID)};

                var classifierList = [];
                var allClassifierIds = ViewService.TYPE_TO_CLASSIFIER_ID;
                for (var k in allClassifierIds) {
                    if (allClassifierIds.hasOwnProperty(k)) {
                        classifierList.push(allClassifierIds[k]);
                    }
                }
                var classifierIdQuery = {};
                classifierIdQuery.terms = {"classifierIds": classifierList};
                return {
                    "bool": {
                        "should": [
                            stereoQuery,
                            classifierIdQuery
                        ]
                    }
                };
            };

            $scope.searchOptions = {
                callback: $scope.choose,
                relatedCallback: $scope.chooseDoc,
                filterQueryList: [mainSearchFilter],
                itemsPerPage: 200
            };
        };

        var viewLinkCallback = function(ed) {
            var instance = $uibModal.open({
                template: transcludeModalTemplate,
                scope: scope,
                controller: ['$scope', '$uibModalInstance', 'ApplicationService', transcludeViewLinkCtrl],
                size: 'lg'
            });
            instance.result.then(function(tag) {
                ed.insertHtml( tag );
            });
        };

        var commentCtrl = function($scope, $uibModalInstance) {
            var id = UtilsService.createMmsId();
            $scope.comment = UtilsService.createClassElement({
                id: id,
                name: 'Comment ' + new Date().toISOString(),
                documentation: '',
                type: 'Class',
                ownerId: "holding_bin_" + scope.mmsProjectId,
                _appliedStereotypeIds: []
            });
            $scope.oking = false;
            $scope.ok = function() {
                if ($scope.oking) {
                    growl.info("Please wait...");
                    return;
                }
                $scope.oking = true;
                var reqOb = {element: $scope.comment, projectId: scope.mmsProjectId, refId: scope.mmsRefId};
                ElementService.createElement(reqOb)
                .then(function(data) {
                    var tag = '<mms-cf mms-cf-type="com" mms-element-id="' + data.id + '">comment:' + data._creator + '</mms-cf>';
                    $uibModalInstance.close(tag);
                }, function(reason) {
                    growl.error("Comment Error: " + reason.message);
                }).finally(function() {
                    $scope.oking = false;
                });
            };
            $scope.cancel = function() {
                $uibModalInstance.dismiss();
            };
        };

        var commentCallback = function(ed) {
            var instance = $uibModal.open({
                template: commentModalTemplate,
                scope: scope,
                controller: ['$scope', '$uibModalInstance', commentCtrl]
            });
            instance.result.then(function(tag) {
                ed.insertHtml( tag );
            });
        };

        var resetCrossRef = function(type, typeString) {
            angular.forEach(type, function(value, key) {
                var transclusionObject = angular.element(value);
                var transclusionId = transclusionObject.attr('mms-element-id');
                var transclusionKey = UtilsService.makeElementKey({id: transclusionId, _projectId: scope.mmsProjectId, _refId: scope.mmsRefId});
                var inCache = CacheService.get(transclusionKey);
                if (inCache) {
                    transclusionObject.html('[cf:' + inCache.name + typeString);
                } else {
                    //TODO create Utils function to handle request objects
                    var reqOb = {elementId: transclusionId, projectId: scope.mmsProjectId, refId: scope.mmsRefId};
                    ElementService.getElement(reqOb, 2)
                    .then(function(data) {
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

        var mmsResetCallback = function(ed) {
            var body = ed.document.getBody();
            resetCrossRef(body.find("mms-cf[mms-cf-type='name']").$, '.name]');
            resetCrossRef(body.find("mms-cf[mms-cf-type='doc']").$, '.doc]');
            resetCrossRef(body.find("mms-cf[mms-cf-type='val']").$, '.val]');
            resetCrossRef(body.find('mms-view-link').$, '.vlink]');
            update();
        };

        var update = function() {
            // getData() returns CKEditor's processed/clean HTML content.
            if (angular.isDefined(instance) && instance !== null)
                ngModelCtrl.$setViewValue(instance.getData());
        };
        
        // Formatting editor toolbar
        var defaultToolbar = [
            { name: 'clipboard',   items : [ 'Undo','Redo' ] },
            { name: 'editing',     items : [ 'Find','Replace' ] },
            { name: 'basicstyles', items : [ 'Bold','Italic','Underline','Strike','-','Subscript','Superscript','Blockquote','-','RemoveFormat' ] },
            { name: 'paragraph',   items : [ 'JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock' ] },
            { name: 'links',       items : [ 'Link','Unlink','-','CodeSnippet' ] },
            { name: 'insert',      items : [ 'PageBreak','HorizontalRule' ] },
            { name: 'document',    items : [ 'Maximize', 'Source' ] },
            '/',
            { name: 'styles',      items : [ 'Format','FontSize','TextColor','BGColor' ] },
        ];
        var justifyToolbar =  { name: 'paragraph',   items : [ 'JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock' ] };
        var listToolbar =     { name: 'list',     items: [ 'NumberedList','BulletedList','Outdent','Indent' ] };
        var tableToolbar =    { name: 'table',    items: [ 'Table' ] };
        var imageToolbar =    { name: 'image',    items: [ 'Image','Iframe' ] };
        var equationToolbar = { name: 'equation', items: [ 'Mathjax','SpecialChar' ]};
        // var customToolbar =   { name: 'custom',   items: [ 'Mmscf','mmsreset','Mmscomment','Mmsvlink','Mmssignature' ] };
        var customToolbar =   { name: 'custom',   items: [ 'MMSInsertMenu', 'Mmssignature'] };
        var sourceToolbar =   { name: 'source',   items: [ 'Maximize','Source' ] };

        //Set toolbar based on editor type
        var thisToolbar = defaultToolbar.slice();
        thisToolbar.push(listToolbar);
        thisToolbar.push(tableToolbar);
        thisToolbar.push(imageToolbar);
        thisToolbar.push(equationToolbar);
        thisToolbar.push(customToolbar);
        if (scope.mmsEditorType === 'TableT') {
          thisToolbar = defaultToolbar.slice();
          thisToolbar.push(tableToolbar);
          thisToolbar.push(equationToolbar);
          thisToolbar.push(customToolbar);
        }
        if (scope.mmsEditorType === 'ListT') {
          thisToolbar = defaultToolbar.slice();
          thisToolbar.push(listToolbar);
          thisToolbar.push(equationToolbar);
          thisToolbar.push(customToolbar);
        }
        if (scope.mmsEditorType === 'Figure' || scope.mmsEditorType === 'ImageT') {
          thisToolbar = [sourceToolbar, justifyToolbar, imageToolbar];
        }
        if (scope.mmsEditorType === 'Equation') {
            thisToolbar = [sourceToolbar, justifyToolbar, equationToolbar];
        }

        $timeout(function() {
            // Initialize ckeditor and set event handlers
            $(element).val(ngModelCtrl.$modelValue);
            instance = CKEDITOR.replace(attrs.id, {
                // customConfig: '/lib/ckeditor/config.js',
                mmscf: {callbackModalFnc: transcludeCallback},
                mmscomment: {callbackModalFnc: commentCallback},
                mmsvlink: {callbackModalFnc: viewLinkCallback},
                mmsreset: {callback: mmsResetCallback},
                contentsCss: CKEDITOR.basePath+'contents.css',
                toolbar: thisToolbar,
                height: $window.innerHeight*0.55,
            });

            // Enable Autosave plugin only when provided with unique identifier (autosaveKey)
            if ( attrs.autosaveKey ) {
                // Configuration for autosave plugin
                instance.config.autosave = {
                    SaveKey: attrs.autosaveKey,
                    delay: 5,
                    NotOlderThen: 10080, // 7 days in minutes
                    enableAutosave: true
                };
            } else {
                instance.config.autosave = {enableAutosave: false};
            }

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
                instance.focusManager.blur();
            });
            instance.on( 'key', function(e) {
                if (e.data.keyCode == (CKEDITOR.CTRL + 192)) { //little tilde
                    autocompleteCallback(instance);
                } else { 
                    deb(e); 
                }
            }, null, null, 31); //priority is after indent list plugin's event handler
            if (scope.mmsEditorApi) {
                scope.mmsEditorApi.save = function() {
                    update();
                };
            }
            instance.on('fileUploadRequest', function(evt) {
                var fileLoader = evt.data.fileLoader;
                var formData = new FormData();
                var xhr = fileLoader.xhr;

                xhr.open( 'POST', URLService.getPutArtifactsURL({projectId: scope.mmsProjectId, refId: scope.mmsRefId}), true );
                formData.append('id', UtilsService.createMmsId().replace('MMS', 'VE'));
                formData.append('file', fileLoader.file, fileLoader.fileName );
                if (fileLoader.fileName) {
                    formData.append('name', fileLoader.fileName);
                }
                fileLoader.xhr.send( formData );

                // Prevented the default behavior.
                evt.stop();
            });
            instance.on( 'fileUploadResponse', function( evt ) {
                // Prevent the default response handler.
                evt.stop();
            
                // Get XHR and response.
                var data = evt.data;
                var xhr = data.fileLoader.xhr;
                var response = JSON.parse(xhr.response);
            
                if ( !response.artifacts || response.artifacts.length == 0) {
                    // An error occurred during upload.
                    //data.message = response[ 1 ];
                    evt.cancel();
                } else {
                    data.url = '/alfresco' + response.artifacts[0].location;
                }
            } );
        }, 0, false);
        
        ngModelCtrl.$render = function() { //commenting out to see if it helps with cursors jumping problem without adverse effects
        //side effect is will not sync if editing in both right pane and center pane at the same time
            // if (!instance) {
            //     instance = CKEDITOR.instances[attrs.id];
            // } else {
            //     var ranges = instance.getSelection().getRanges();
            //     instance.setData(ngModelCtrl.$viewValue || '');
            //     instance.getSelection().selectRanges( ranges );
            // }
        };
        
        scope.$on('$destroy', function() {
            if (!instance) {
                instance = CKEDITOR.instances[attrs.id];
            } else {
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
            mmsProjectId: '@',
            mmsRefId: '@',
            autosaveKey: '@',
            mmsEditorType: '@',
            mmsEditorApi: '<?'
        },
        link: mmsCkeditorLink
    };
}
