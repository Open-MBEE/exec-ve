'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('ReorderCtrl', ['$scope', '$rootScope', '$stateParams', 'document', 'time', 'ElementService', 'ViewService', 'MmsAppUtils', '$state', 'growl', '$q', '_',
function($scope, $rootScope, $stateParams, document, time, ElementService, ViewService, MmsAppUtils, $state, growl, $q, _) {
    $scope.doc = document;
    var ws = $stateParams.workspace;

    var viewIds2node = {};
    var origViews = {};
    viewIds2node[document.sysmlid] = {
        name: document.name,
        id: document.sysmlid,
        aggr: 'COMPOSITE',
        children: []
    };

    var updateNumber = function(node, curSection, key) {
        node[key] = curSection;
        var num = 1;
        node.children.forEach(function(cnode) {
            updateNumber(cnode, curSection + '.' + num, key);
            num++;
        });
    };

    $scope.treeOptions = {
        dropped : function() {
            $scope.tree.forEach(function(root) {
                root.new = '';
                var num = 1;
                root.children.forEach(function(node) {
                    updateNumber(node, num + '', 'new');
                    num++;
                });
            });
        },
        accept: function(sourceNodeScope, destNodeScope, destIndex) {
            if (destNodeScope.$element.hasClass('root'))
                return false; //don't allow moving to outside doc
            if (destNodeScope.node.aggr == 'NONE')
                return false;
            return true;
        }
    };

    function handleSingleView(v, aggr) {
        var curNode = viewIds2node[v.sysmlid];
        if (!curNode) {
            curNode = {
                name: v.name,
                id: v.sysmlid,
                aggr: aggr,
                children: []
            };
            viewIds2node[v.sysmlid] = curNode;
        }
        origViews[v.sysmlid] = v;
        return curNode;
    }

    function handleChildren(curNode, childNodes) {
        curNode.children.push.apply(curNode.children, childNodes);
    }

    MmsAppUtils.handleChildViews(document, 'COMPOSITE', ws, time, handleSingleView, handleChildren)
    .then(function(docNode) {
        var num = 1;
        docNode.children.forEach(function(node) {
            updateNumber(node, num + '', 'old');
            updateNumber(node, num + '', 'new');
            num++;
        });
        $scope.tree = [docNode];
    });

    $scope.saveClass = "";
    var saving = false;
    $scope.save = function() {
        if (saving) {
            growl.info("please wait");
            return;
        }
        if ($scope.tree.length > 1 || $scope.tree[0].id !== document.sysmlid) {
            growl.error('Views cannot be re-ordered outside the context of the current document.');
            return;
        }
        saving = true;
        $scope.saveClass = "fa fa-spin fa-spinner";
        var toSave = [];
        angular.forEach(viewIds2node, function(node, id) {
            if (node.aggr == 'NONE') //cannot process views whose aggr is none since their children are not shown
                return;
            var childViews = [];
            for (var i = 0; i < node.children.length; i++) {
                childViews.push({
                    id: node.children[i].id, 
                    aggregation: node.children[i].aggr
                });
            }
            var orig = origViews[id];
            if (((!orig.specialization.childViews || orig.specialization.childViews.length === 0) && childViews.length > 0) ||
                (orig.specialization.childViews && !angular.equals(orig.specialization.childViews, childViews))) {
                toSave.push({
                    sysmlid: id,
                    //name: orig.name,
                    specialization: {
                        childViews: childViews,
                        type: orig.specialization.type
                    }
                });
            }
        });
        ElementService.updateElements(toSave, ws)
        .then(function() {
            growl.success('Reorder Successful');
            $state.go('workspace.site.document', {}, {reload:true});
        }, function(reason) {

        }).finally(function() {
            $scope.saveClass = "";
            saving = false;
        });
    };
    
    $scope.cancel = function() {
        var curBranch = $rootScope.mms_treeApi.get_selected_branch();
        if (!curBranch)
            $state.go('workspace.site.document', {}, {reload:true});
        else {
            var goToId = curBranch.data.sysmlid;
            if (curBranch.type === 'section')
                goToId = curBranch.view;
            $state.go('workspace.site.document.view', {view: goToId});
        }
    };
}]);