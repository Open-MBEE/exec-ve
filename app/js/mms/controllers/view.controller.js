'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('ViewCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$timeout', '$modal', '$window', 'viewElements', 'MmsAppUtils', 'ElementService', 'ViewService', 'ConfigService', 'time', 'search', 'growl', 'workspace', 'site', 'document', 'view', 'tag', 'snapshot', 'UxService', 'hotkeys',
function($scope, $rootScope, $state, $stateParams, $timeout, $modal, $window, viewElements, MmsAppUtils, ElementService, ViewService, ConfigService, time, search, growl, workspace, site, document, view, tag, snapshot, UxService, hotkeys) {
    
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
    $scope.search = search;
    $scope.ws = ws;
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
            hotkeys.bindTo($scope)
            .add({
                combo: 'alt+d',
                description: 'toggle edit mode',
                callback: function() {$scope.$broadcast('show.edits');}
            });
        }
        $scope.bbApi.addButton(UxService.getButtonBarButton('show.comments'));
        $scope.bbApi.setToggleState('show.comments', $rootScope.veCommentsOn);
        if (view && view.editable && time === 'latest') {
            if ($scope.view.specialization.contents || $scope.view.specialization.type === 'InstanceSpecification') {
                $scope.bbApi.addButton(UxService.getButtonBarButton('view.add.dropdown'));
            } else {
                var fakeDropdown = {
                    id: 'view.add.dropdown.fake', 
                    icon: 'fa-plus', 
                    selected: true, 
                    active: true, 
                    permission: true, 
                    tooltip: 'Add New Element Disabled', 
                    spinner: false, 
                    togglable: false, 
                    action: function() {
                        growl.warning("This view hasn't been converted to support adding new elements.");
                    }
                };
                $scope.bbApi.addButton(fakeDropdown);
            }
        }
        if ($state.includes('workspace.site.document')) {
            $scope.bbApi.addButton(UxService.getButtonBarButton('print'));
            $scope.bbApi.addButton(UxService.getButtonBarButton('convert.pdf'));
            $scope.bbApi.addButton(UxService.getButtonBarButton('word'));
            $scope.bbApi.addButton(UxService.getButtonBarButton('tabletocsv'));
        }
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
      
        if ($state.includes('workspace.site.document') || $state.includes('workspace.site.documentpreview')) {
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
                if ($rootScope.mms_treeApi && $rootScope.mms_treeApi.get_selected_branch) {
                    var selected_branch = $rootScope.mms_treeApi.get_selected_branch();
                    while (selected_branch && selected_branch.type !== 'view' && view.specialization.type !== 'InstanceSpecification') {
                        selected_branch = $rootScope.mms_treeApi.get_parent_branch(selected_branch);
                    }
                    if (selected_branch)
                        $scope.sectionNumber = selected_branch.section;
                }
            }
        }
    };

    $scope.$on('convert.pdf', function() {
        MmsAppUtils.popupPrintConfirm(view, $scope.ws, time, false, false);
    });

    $scope.$on('view.add.paragraph', function() {
        MmsAppUtils.addPresentationElement($scope, 'Paragraph', view);
    });

    $scope.$on('view.add.list', function() {
        MmsAppUtils.addPresentationElement($scope, 'List', view);
    });

    $scope.$on('view.add.table', function() {
        MmsAppUtils.addPresentationElement($scope, 'Table', view);
    });

    $scope.$on('view.add.section', function() {
        MmsAppUtils.addPresentationElement($scope, 'Section', view);
    });

    $scope.$on('view.add.comment', function() {
        MmsAppUtils.addPresentationElement($scope, 'Comment', view);
    });

    $scope.$on('view.add.image', function() {
        MmsAppUtils.addPresentationElement($scope, 'Figure', view);
    });
/*
    $scope.$on('view.add.equation', function() {
        addElement('Equation');
    });
*/
    $scope.$on('section.add.paragraph', function(event, section) {
        MmsAppUtils.addPresentationElement($scope, 'Paragraph', section);
    });

    $scope.$on('section.add.list', function(event, section) {
        MmsAppUtils.addPresentationElement($scope, 'List', section);
    });

    $scope.$on('section.add.table', function(event, section) {
        MmsAppUtils.addPresentationElement($scope, 'Table', section);
    });
/*
    $scope.$on('section.add.equation', function(event, section) {
        addElement('Equation', section);
    });
*/
    $scope.$on('section.add.section', function(event, section) {
        MmsAppUtils.addPresentationElement($scope, 'Section', section);
    });

    $scope.$on('section.add.comment', function(event, section) {
        MmsAppUtils.addPresentationElement($scope, 'Comment', section);
    });

    $scope.$on('section.add.image', function(event, section) {
        MmsAppUtils.addPresentationElement($scope, 'Figure', section);
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
        //since view can also be a "fake" view like section instance spec only set view if it's a real view,
        //otherwise other code can create things under instance specs that can't be owned by instance spec
        if (view.specialization.contains || view.specialization.contents) {
            ViewService.setCurrentView(view); 
        } else if (document && document.specialization.contains || document.specialization.contents) {
            ViewService.setCurrentView(document);
        }
        $scope.vid = view.sysmlid;
    } else {
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
        }, 1000);
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
    $scope.searchOptions= {};
    $scope.searchOptions.callback = function(elem) {
        $scope.tscClicked(elem.sysmlid);
        if ($rootScope.mms_togglePane && $rootScope.mms_togglePane.closed)
            $rootScope.mms_togglePane.toggle();
    };
    $scope.searchOptions.emptyDocTxt = 'This field is empty.';
    $scope.searchOptions.searchInput = $stateParams.search;
    $scope.searchOptions.searchResult = $scope.search;
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
        if ($rootScope.mms_ShowEdits && time === 'latest') {
            $scope.viewApi.toggleShowEdits();
        }
    };

    $scope.searchGoToDocument = function (doc, view, elem) {//siteId, documentId, viewId) {
        $state.go('workspace.site.document.view', {site: doc.siteCharacterizationId, document: doc.sysmlid, view: view.sysmlid, tag: undefined, search: undefined});
    };
    $scope.searchOptions.relatedCallback = $scope.searchGoToDocument;

    $scope.$on('print', function() {
        MmsAppUtils.popupPrintConfirm(view, $scope.ws, time, false, true);
    });
    $scope.$on('word', function() {
        MmsAppUtils.popupPrintConfirm(view, $scope.ws, time, false, false);
    });
    $scope.$on('tabletocsv', function() {
        MmsAppUtils.tableToCsv(view, $scope.ws, time, false);
    });
    
}]);