'use strict';

/* Controllers */

angular.module('mmsApp')
    .controller('ViewCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$timeout',
    '$element', 'hotkeys', 'MmsAppUtils', 'UxService', 'growl',
    'search', 'orgOb', 'projectOb', 'refOb', 'groupOb', 'documentOb', 'viewOb',
    function($scope, $rootScope, $state, $stateParams, $timeout, $element, hotkeys, MmsAppUtils, UxService, growl,
             search, orgOb, projectOb, refOb, groupOb, documentOb, viewOb) {

    function isPageLoading() {
        if ($element.find('.isLoading').length > 0) {
            growl.warning("Still loading!");
            return true;
        }
        return false;
    }

    $scope.vidLink = false; //whether to have go to document link
    if ($state.includes('project.ref.preview') && viewOb && viewOb.id.indexOf('_cover') < 0) {
        $scope.vidLink = true;
    }

    if (!$rootScope.veCommentsOn)
        $rootScope.veCommentsOn = false;
    if (!$rootScope.veElementsOn)
        $rootScope.veElementsOn = false;
    if (!$rootScope.ve_editmode)
        $rootScope.ve_editmode = false;

    $scope.search = search;
    $scope.viewOb = viewOb;
    $scope.projectOb = projectOb;
    $scope.refOb = refOb;

    $scope.buttons = [];
    $scope.viewApi = {
        init: function() {
            if ($rootScope.veCommentsOn) {
                $scope.viewApi.toggleShowComments();
            }
            if ($rootScope.veElementsOn) {
                $scope.viewApi.toggleShowElements();
            }
            if ($rootScope.ve_editmode) {
                $scope.viewApi.toggleShowEdits();
            }
        },
        elementTranscluded: function(elementOb, type) {
            if (type === 'Comment' && !$scope.comments.map.hasOwnProperty(elementOb.id)) {
                $scope.comments.map[elementOb.id] = elementOb;
                $scope.comments.count++;
                if (elementOb._modified > $scope.comments.lastCommented) {
                    $scope.comments.lastCommented = elementOb._modified;
                    $scope.comments.lastCommentedBy = elementOb._modifier;
                }
            }
        },
        elementClicked: function(elementOb) {
            $rootScope.$broadcast('elementSelected', elementOb, 'latest');
        }
    };
    $scope.comments = {
        count: 0,
        lastCommented: '',
        lastCommentedBy: '',
        map: {}
    };

    $scope.docLibLink = '';
    if (groupOb !== null) {
        $scope.docLibLink = groupOb._link;
    } else if (documentOb !== null && documentOb._groupId !== undefined && documentOb._groupId !== null) {
        $scope.docLibLink = '/share/page/repository#filter=path|/Sites/' + orgOb.id + '/documentLibrary/' +
        projectOb.id + '/' + documentOb._groupId;
    } else {
        $scope.docLibLink = '/share/page/repository#filter=path|/Sites/' + orgOb.id + '/documentLibrary/' +
        projectOb.id;
    }

    $scope.bbApi = {
        init: function() {
            if (viewOb && viewOb._editable && refOb.type === 'Branch') {
                $scope.bbApi.addButton(UxService.getButtonBarButton('show-edits'));
                $scope.bbApi.setToggleState('show-edits', $rootScope.ve_editmode);
                hotkeys.bindTo($scope)
                .add({
                    combo: 'alt+d',
                    description: 'toggle edit mode',
                    callback: function() {$scope.$broadcast('show-edits');}
                });
            }
            $scope.bbApi.addButton(UxService.getButtonBarButton('show-comments'));
            $scope.bbApi.setToggleState('show-comments', $rootScope.veCommentsOn);
            if ($state.includes('project.ref.preview') || $state.includes('project.ref.document')) {
                $scope.bbApi.addButton(UxService.getButtonBarButton('print'));
                if ($state.includes('project.ref.document'))
                    $scope.bbApi.addButton(UxService.getButtonBarButton('convert-pdf'));
                $scope.bbApi.addButton(UxService.getButtonBarButton('word'));
                $scope.bbApi.addButton(UxService.getButtonBarButton('tabletocsv'));
            }
            $scope.bbApi.addButton(UxService.getButtonBarButton('show-elements'));
            $scope.bbApi.setToggleState('show-elements', $rootScope.veElementsOn);
            hotkeys.bindTo($scope)
            .add({
                combo: 'alt+c',
                description: 'toggle show comments',
                callback: function() {$scope.$broadcast('show-comments');}
            }).add({
                combo: 'alt+e',
                description: 'toggle show elements',
                callback: function() {$scope.$broadcast('show-elements');}
            });

            if ($state.includes('project.ref.document')) {
                $scope.bbApi.addButton(UxService.getButtonBarButton('refresh-numbering'));
                $scope.bbApi.addButton(UxService.getButtonBarButton('center-previous'));
                $scope.bbApi.addButton(UxService.getButtonBarButton('center-next'));
                hotkeys.bindTo($scope)
                .add({
                    combo: 'alt+.',
                    description: 'next',
                    callback: function() {$scope.$broadcast('center-next');}
                }).add({
                    combo: 'alt+,',
                    description: 'previous',
                    callback: function() {$scope.$broadcast('center-previous');}
                });
                if ($rootScope.ve_treeApi && $rootScope.ve_treeApi.get_selected_branch) {
                    var selected_branch = $rootScope.ve_treeApi.get_selected_branch();
                    while (selected_branch && selected_branch.type !== 'view' && viewOb.type !== 'InstanceSpecification') {
                        selected_branch = $rootScope.ve_treeApi.get_parent_branch(selected_branch);
                    }
                    if (selected_branch)
                        $scope.sectionNumber = selected_branch.section;
                }
            }
        }
    };

    $scope.$on('show-comments', function() {
        $scope.viewApi.toggleShowComments();
        $scope.bbApi.toggleButtonState('show-comments');
        $rootScope.veCommentsOn = !$rootScope.veCommentsOn;
    });

    $scope.$on('show-elements', function() {
        $scope.viewApi.toggleShowElements();
        $scope.bbApi.toggleButtonState('show-elements');
        $rootScope.veElementsOn = !$rootScope.veElementsOn;
    });

    $scope.$on('show-edits', function() {
        if( ($rootScope.veElementsOn && $rootScope.ve_editmode) || (!$rootScope.veElementsOn && !$rootScope.ve_editmode) ){
            $scope.viewApi.toggleShowElements();
            $scope.bbApi.toggleButtonState('show-elements');
            $rootScope.veElementsOn = !$rootScope.veElementsOn;
        }
        $scope.viewApi.toggleShowEdits();
        $scope.bbApi.toggleButtonState('show-edits');
        $rootScope.ve_editmode = !$rootScope.ve_editmode;
    });

    $scope.$on('center-previous', function() {
        var prev = $rootScope.ve_treeApi.get_prev_branch($rootScope.ve_treeApi.get_selected_branch());
        if (!prev)
            return;
        while (prev.type !== 'view' && prev.type !== 'section') {
            prev = $rootScope.ve_treeApi.get_prev_branch(prev);
            if (!prev)
                return;
        }
        $scope.bbApi.toggleButtonSpinner('center-previous');
        $rootScope.ve_treeApi.select_branch(prev);
        $scope.bbApi.toggleButtonSpinner('center-previous');
    });

    $scope.$on('center-next', function() {
        var next = $rootScope.ve_treeApi.get_next_branch($rootScope.ve_treeApi.get_selected_branch());
        if (!next)
            return;
        while (next.type !== 'view' && next.type !== 'section') {
            next = $rootScope.ve_treeApi.get_next_branch(next);
            if (!next)
                return;
        }
        $scope.bbApi.toggleButtonSpinner('center-next');
        $rootScope.ve_treeApi.select_branch(next);
        $scope.bbApi.toggleButtonSpinner('center-next');
    });

    if (viewOb && $state.includes('project.ref')) {
        $timeout(function() {
            $rootScope.$broadcast('viewSelected', viewOb, 'latest');
        }, 1000);
    }

    $scope.searchOptions = {
        emptyDocTxt: 'This field is empty.',
        searchInput: search,
        getProperties: true,
        callback: function(elementOb) {
            $rootScope.$broadcast('elementSelected', elementOb, 'latest');
            if ($rootScope.ve_togglePane && $rootScope.ve_togglePane.closed)
                $rootScope.ve_togglePane.toggle();
        },
        relatedCallback: function (doc, view, elem) {//siteId, documentId, viewId) {
            $state.go('project.ref.document.view', {projectId: doc._projectId, documentId: doc.id, viewId: view.id, refId: doc._refId, search: undefined});
        }
    };

    $scope.$on('convert-pdf', function() {
        if (isPageLoading())
            return;
        MmsAppUtils.printModal(viewOb, refOb, false, 3);
    });

    $scope.$on('print', function() {
        if (isPageLoading())
            return;
        MmsAppUtils.printModal(viewOb, refOb, false, 1);
    });

    $scope.$on('word', function() {
        if (isPageLoading())
            return;
        MmsAppUtils.printModal(viewOb, refOb, false, 2);
    });

    $scope.$on('tabletocsv', function() {
        if (isPageLoading())
            return;
        MmsAppUtils.tableToCsv(false);
    });

    $scope.$on('refresh-numbering', function() {
        if (isPageLoading())
            return;
        var printElementCopy = angular.element("#print-div");
        MmsAppUtils.refreshNumbering($rootScope.ve_treeApi.get_rows(), printElementCopy);
    });

}]);