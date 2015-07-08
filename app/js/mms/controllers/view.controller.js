'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('ViewCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$timeout', '$modal', '$window', 'viewElements', 'ElementService', 'ViewService', 'ConfigService', 'time', 'growl', 'workspace', 'site', 'document', 'view', 'tag', 'snapshot', 'UxService', 'hotkeys',
function($scope, $rootScope, $state, $stateParams, $timeout, $modal, $window, viewElements, ElementService, ViewService, ConfigService, time, growl, workspace, site, document, view, tag, snapshot, UxService, hotkeys) {
    
    /*$scope.$on('$viewContentLoaded', 
        function(event) {
            $rootScope.mms_viewContentLoading = false; 
        }
    );*/

    if ($state.includes('workspace') && !$state.includes('workspace.sites')) {
        $rootScope.mms_showSiteDocLink = true;
    } else {
        $rootScope.mms_showSiteDocLink = false;
    }

    // show the tag descriptions if document is null 
    $rootScope.mms_showTagDescriptionFix = false;
    if ($state.includes('workspace') && !$state.includes('workspace.sites')) {
        // if document is null, and there is a tag, then save the tag to be used for
        // the tag cover page
        if (document === null && time !== 'latest' && tag !== null) {
            $rootScope.mms_showTagDescriptionFix = true;
            $rootScope.mms_showSiteDocLink = false;
            $scope.tag = tag;
        }
    }

    $scope.showFilter = false;
    if ($state.current.name === 'workspace.site')
        $scope.showFilter = true;
    
    $scope.vidLink = false;
    if ($state.includes('workspace.site.documentpreview')) {
        $scope.vidLink = true;
    }

    $scope.tagId = undefined;
    if (tag.timestamp !== 'latest')
        $scope.tagId = tag.id;

    if (!$rootScope.veCommentsOn)
        $rootScope.veCommentsOn = false;
    if (!$rootScope.veElementsOn)
        $rootScope.veElementsOn = false;
    if (!$rootScope.mms_ShowEdits)
        $rootScope.mms_ShowEdits = false;

    var ws = $stateParams.workspace;

    $scope.view = view;
    $scope.viewElements = viewElements;
    $scope.site = site;
    var elementSaving = false;
    $scope.bbApi = {};
    $scope.buttons = [];

    $scope.bbApi.init = function() {

        if (view && view.editable && time === 'latest') {
            $scope.bbApi.addButton(UxService.getButtonBarButton('show.edits'));
            $scope.bbApi.setToggleState('show.edits', $rootScope.mms_ShowEdits);

            if ($scope.view.specialization.contents) {
                $scope.bbApi.addButton(UxService.getButtonBarButton('view.add.dropdown'));
            }
        }
        $scope.bbApi.addButton(UxService.getButtonBarButton('show.comments'));
        $scope.bbApi.setToggleState('show.comments', $rootScope.veCommentsOn);
        $scope.bbApi.addButton(UxService.getButtonBarButton('show.elements'));
        $scope.bbApi.setToggleState('show.elements', $rootScope.veElementsOn);
        hotkeys.bindTo($scope)
        .add({
            combo: 'alt+c',
            description: 'toggle show comments',
            callback: function() {$scope.$broadcast('show.comments');}
        }).add({
            combo: 'alt+e',
            description: 'toggle show elements',
            callback: function() {$scope.$broadcast('show.elements');}
        });
        // TODO: This code is duplicated in the FullDocCtrl
        // **WARNING** IF YOU CHANGE THIS CODE, NEED TO UPDATE IN FULL DOC CTRL TOO

        if ($state.includes('workspace.site.document') || $state.includes('workspace.site.documentpreview')) {
            if (snapshot !== null) {
                var pdfUrl = getPDFUrl();
                if (pdfUrl !== null && pdfUrl !== undefined) {
                    $scope.bbApi.addButton(UxService.getButtonBarButton('download.pdf'));                
                } else {
                    $scope.bbApi.addButton(UxService.getButtonBarButton('generate.pdf'));

                    var pdfStatus = getPDFStatus();
                    if (pdfStatus === 'Generating...')
                        $scope.bbApi.toggleButtonSpinner('generate.pdf');
                    else if (pdfStatus !== null)
                        $scope.bbApi.setTooltip('generate.pdf', pdfStatus);
                }

                var zipUrl = getZipUrl();
                if (zipUrl !== null && zipUrl !== undefined) {
                    $scope.bbApi.addButton(UxService.getButtonBarButton('download.zip'));                
                } else {
                    $scope.bbApi.addButton(UxService.getButtonBarButton('generate.zip'));

                    var zipStatus = getZipStatus();
                    if (zipStatus === 'Generating...')
                        $scope.bbApi.toggleButtonSpinner('generate.zip');
                    else if (zipStatus !== null)
                        $scope.bbApi.setTooltip('generate.zip', zipStatus);
                }
            }
            if ($state.includes('workspace.site.document')) {
                $scope.bbApi.addButton(UxService.getButtonBarButton('center.previous'));
                $scope.bbApi.addButton(UxService.getButtonBarButton('center.next'));
                hotkeys.bindTo($scope)
                .add({
                    combo: 'alt+.',
                    description: 'next',
                    callback: function() {$scope.$broadcast('center.next');}
                }).add({
                    combo: 'alt+,',
                    description: 'previous',
                    callback: function() {$scope.$broadcast('center.previous');}
                });
                $scope.sectionNumber = $rootScope.mms_treeApi.get_selected_branch().section;
            }
        }
    };

    // TODO: This code is duplicated in the FullDocCtrl
    // **WARNING** IF YOU CHANGE THIS CODE, NEED TO UPDATE IN FULL DOC CTRL TOO
    var getPDFStatus = function(){
        if(!snapshot) return null;
        var formats = snapshot.formats;
        if(!formats || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='pdf') {
                var status = formats[i].status;
                if(status == 'Generating') status = 'Generating...';
                else if(status == 'Error') status = 'Regenerate PDF';
                return status;
            }
        }
        return null;
    };

    var getPDFUrl = function(){
        if(!snapshot) return null;
        var formats = snapshot.formats;
        if(!formats || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='pdf'){
                return formats[i].url;
            }
        }
        return null;
    };

    var getZipStatus = function(){
        if(!snapshot) return null;
        var formats = snapshot.formats;
        if(!formats || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='html') {
                var status = formats[i].status;
                if(status == 'Generating') status = 'Generating...';
                else if(status == 'Error') status = 'Regenerate Zip';
                return status;
            }
        }
        return null;
    };

    var getZipUrl = function(){
        if(angular.isUndefined(snapshot)) return null;
        if(snapshot===null) return null;
        
        var formats = snapshot.formats;
        if(formats===undefined || formats===null || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='html'){
                return formats[i].url;  
            } 
        }
        return null;
    };

    $scope.$on('generate.pdf', function() {
        if (getPDFStatus() === 'Generating...')
            return;
        $scope.bbApi.toggleButtonSpinner('generate.pdf');
        $scope.bbApi.toggleButtonSpinner('generate.zip');

        snapshot.formats.push({"type":"pdf",  "status":"Generating"});
        snapshot.formats.push({"type":"html", "status":"Generating"});
        snapshot.ws = ws;
        snapshot.site = site.sysmlid;
        snapshot.time = time;
        
        ConfigService.createSnapshotArtifact(snapshot, site.sysmlid, workspace).then(
            function(result){
                growl.info('Generating artifacts...Please wait for a completion email and reload the page.');
            },
            function(reason){
                growl.error('Failed to generate artifacts: ' + reason.message);
            }
        );
    });

    $scope.$on('generate.zip', function() {
        $rootScope.$broadcast('generate.pdf');        
    });

    $scope.$on('download.pdf', function() {
        $window.open(getPDFUrl());

    });

    $scope.$on('download.zip', function() {
        $window.open(getZipUrl());
    });
 
    var handleError = function(reason) {
        if (reason.type === 'info')
            growl.info(reason.message);
        else if (reason.type === 'warning')
            growl.warning(reason.message);
        else if (reason.type === 'error')
            growl.error(reason.message);
    };

    var addElementCtrl = function($scope, $modalInstance, $filter, ViewService) {

        $scope.oking = false;
        $scope.newItem = {};
        $scope.newItem.name = "";

        $scope.searching = false;
        $scope.viewOrSection = $scope.section ? $scope.section : view;

        // Search for InstanceSpecs.  We are searching for InstanceSpecs b/c we only want to
        // create a InstanceValue to point to that InstanceSpec when cross-referencing.
        $scope.search = function(searchText) {
            //var searchText = $scope.searchText; //TODO investigate why searchText isn't in $scope
            //growl.info("Searching...");
            $scope.searching = true;

            ElementService.search(searchText, ['name'], null, false, ws)
            .then(function(data) {
                var validClassifierIds = [];
                if ($scope.presentationElemType === 'Table') {
                    //validClassifierIds.push(ViewService.typeToClassifierId.Table);
                    validClassifierIds.push(ViewService.typeToClassifierId.TableT);
                } else if ($scope.presentationElemType === 'List') {
                    //validClassifierIds.push(ViewService.typeToClassifierId.List);
                    validClassifierIds.push(ViewService.typeToClassifierId.ListT);
                } else if ($scope.presentationElemType === 'Figure') {
                    //validClassifierIds.push(ViewService.typeToClassifierId.Image);
                    validClassifierIds.push(ViewService.typeToClassifierId.Figure);
                } else if ($scope.presentationElemType === 'Paragraph') {
                    //validClassifierIds.push(ViewService.typeToClassifierId.Paragraph);
                    validClassifierIds.push(ViewService.typeToClassifierId.ParagraphT);
                } else if ($scope.presentationElemType === 'Section') {
                    validClassifierIds.push(ViewService.typeToClassifierId.SectionT);
                } else {
                    validClassifierIds.push(ViewService.typeToClassifierId[$scope.presentationElemType]);
                }
                // Filter out anything that is not a InstanceSpecification or not of the correct type:
                for (var i = 0; i < data.length; i++) {
                    if (data[i].specialization.type != 'InstanceSpecification') {
                        data.splice(i, 1);
                        i--;
                    }
                    else if (validClassifierIds.indexOf(data[i].specialization.classifier[0]) < 0) {
                        data.splice(i, 1);
                        i--;
                    }
                }

                $scope.mmsCfElements = data;
                $scope.searching = false;
            }, function(reason) {
                growl.error("Search Error: " + reason.message);
                $scope.searching = false;
            });
        };

        // Adds a InstanceValue to the view given the sysmlid of the InstanceSpecification
        $scope.addElement = function(element) {

            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;  

            ViewService.addInstanceVal($scope.viewOrSection, workspace, element.sysmlid).
            then(function(data) {
                if ($scope.presentationElemType === "Section") {
                    // Broadcast message to TreeCtrl:
                    $rootScope.$broadcast('viewctrl.add.section', element, $scope.viewOrSection);
                }
                growl.success("Adding "+$scope.presentationElemType+"  Successful");
                $modalInstance.close(data);
            }, function(reason) {
                growl.error($scope.presentationElemType+" Add Error: " + reason.message);
            }).finally(function() {
                $scope.oking = false;
            });            
        };

        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;

            ViewService.createAndAddElement($scope.viewOrSection, workspace, true, $scope.presentationElemType, site.sysmlid, $scope.newItem.name).
            then(function(data) {
                $rootScope.$broadcast('view.reorder.refresh');
                growl.success("Adding "+$scope.presentationElemType+"  Successful");
                $modalInstance.close(data);
            }, function(reason) {
                growl.error($scope.presentationElemType+" Add Error: " + reason.message);
            }).finally(function() {
                $scope.oking = false;
            }); 
        };

        $scope.cancel = function() {
            $modalInstance.dismiss();
        };

    };

    var addElement = function(type, section) {

        $scope.section = section;
        $scope.presentationElemType = type;
        $scope.newItem = {};
        $scope.newItem.name = "";
        var templateUrlStr = 'partials/mms/add-item.html';

        var instance = $modal.open({
            templateUrl: templateUrlStr,
            scope: $scope,
            controller: ['$scope', '$modalInstance', '$filter', 'ViewService', addElementCtrl]
        });
        instance.result.then(function(data) {
            // TODO: do anything here?
        });
    };

    $scope.$on('view.add.paragraph', function() {
        addElement('Paragraph');
    });

    $scope.$on('view.add.list', function() {
        addElement('List');
    });

    $scope.$on('view.add.table', function() {
        addElement('Table');
    });

    $scope.$on('view.add.section', function() {
        addElement('Section');
    });

    $scope.$on('view.add.image', function() {
        addElement('Figure');
    });

    $scope.$on('view.add.equation', function() {
        addElement('Equation');
    });

    $scope.$on('section.add.paragraph', function(event, section) {
        addElement('Paragraph', section);
    });

    $scope.$on('section.add.list', function(event, section) {
        addElement('List', section);
    });

    $scope.$on('section.add.table', function(event, section) {
        addElement('Table', section);
    });

    $scope.$on('section.add.equation', function(event, section) {
        addElement('Equation', section);
    });

    $scope.$on('section.add.section', function(event, section) {
        addElement('Section', section);
    });

    $scope.$on('section.add.image', function(event, section) {
        addElement('Figure', section);
    });

    $scope.$on('show.comments', function() {
        $scope.viewApi.toggleShowComments();
        $scope.bbApi.toggleButtonState('show.comments');
        $rootScope.veCommentsOn = !$rootScope.veCommentsOn;
    });

    $scope.$on('show.elements', function() {
        $scope.viewApi.toggleShowElements();
        $scope.bbApi.toggleButtonState('show.elements');
        $rootScope.veElementsOn = !$rootScope.veElementsOn;
    });

    $scope.$on('show.edits', function() {
        $scope.viewApi.toggleShowEdits();
        $scope.bbApi.toggleButtonState('show.edits');
        $rootScope.mms_ShowEdits = !$rootScope.mms_ShowEdits;
        if ($scope.filterApi.setEditing)
            $scope.filterApi.setEditing($rootScope.mms_ShowEdits);
    });

    $scope.$on('center.previous', function() {
        var prev = $rootScope.mms_treeApi.get_prev_branch($rootScope.mms_treeApi.get_selected_branch());
        if (!prev)
            return;
        $scope.bbApi.toggleButtonSpinner('center.previous');
        $rootScope.mms_treeApi.select_branch(prev);
        if (prev.type === 'section')
            $scope.bbApi.toggleButtonSpinner('center.previous');
    });

    $scope.$on('center.next', function() {
        var next = $rootScope.mms_treeApi.get_next_branch($rootScope.mms_treeApi.get_selected_branch());
        if (!next)
            return;
        $scope.bbApi.toggleButtonSpinner('center.next');
        $rootScope.mms_treeApi.select_branch(next);
        if (next.type === 'section')
            $scope.bbApi.toggleButtonSpinner('center.next');
    });

    if (view) {
        ViewService.setCurrentViewId(view.sysmlid);
        $rootScope.veCurrentView = view.sysmlid;
        $scope.vid = view.sysmlid;
    } else {
        $rootScope.veCurrentView = '';
        $scope.vid = '';        
    }
    $scope.ws = ws;
    $scope.version = time;
    $scope.editing = false;

    if ($state.current.name === 'workspace' && !tag.id) {
        $rootScope.$broadcast('elementSelected', ws, 'workspace');
    } else if ($state.current.name === 'workspace' && tag.id) {
        $rootScope.$broadcast('elementSelected', tag.id, 'tag');
    }
    if (view && $state.current.name !== 'workspace') {
        $timeout(function() {
            $rootScope.$broadcast('viewSelected', $scope.vid, viewElements);
        }, 225);
    }

    $scope.filterApi = {}; //for site doc filter
    $scope.viewApi = {};
    $scope.specApi = {};
    $scope.comments = {};
    $scope.numComments = 0;
    $scope.lastCommented = "";
    $scope.lastCommentedBy = "";
    $scope.tscClicked = function(elementId) {
        $rootScope.$broadcast('elementSelected', elementId, 'element');
    };
    $scope.elementTranscluded = function(element, type) {
        if (type === 'Comment' && !$scope.comments.hasOwnProperty(element.sysmlid)) {
            $scope.comments[element.sysmlid] = element;
            $scope.numComments++;
            if (element.modified > $scope.lastCommented) {
                $scope.lastCommented = element.modified;
                $scope.lastCommentedBy = element.modifier;
            }
        }
    };
    $scope.viewApi.init = function() {
        if ($rootScope.veCommentsOn) {
            $scope.viewApi.toggleShowComments();
        }
        if ($rootScope.veElementsOn) {
            $scope.viewApi.toggleShowElements();
        }
        if ($rootScope.mms_ShowEdits) {
            $scope.viewApi.toggleShowEdits();
        }
    };
}]);