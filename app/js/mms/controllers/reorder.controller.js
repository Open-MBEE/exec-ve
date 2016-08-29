'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('ReorderCtrl', ['$scope', '$rootScope', '$stateParams', 'document', 'time', 'ElementService', 'ViewService', 'MmsAppUtils', '$state', 'growl', '$q', '_',
function($scope, $rootScope, $stateParams, document, time, ElementService, ViewService, MmsAppUtils, $state, growl, $q, _) {
    $scope.doc = document;
    var ws = $stateParams.workspace;

    var viewIds2node = {};
    var origViews = {};
    viewIds2node[document.sysmlId] = {
        name: document.name,
        id: document.sysmlId,
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

    var seenViewIds = {};
    function handleSingleView(v, aggr) {
        var curNode = viewIds2node[v.sysmlId];
        if (!curNode) {
            curNode = {
                name: v.name,
                id: v.sysmlId,
                aggr: aggr,
                children: []
            };
            viewIds2node[v.sysmlId] = curNode;
        }
        origViews[v.sysmlId] = v;
        return curNode;
    }

    function handleChildren(curNode, childNodes) {
        var newChildNodes = [];
        childNodes.forEach(function(node) {
            if (seenViewIds[node.id]) {
                return;
            }
            seenViewIds[node.id] = node;
            newChildNodes.push(node);
        });
        curNode.children.push.apply(curNode.children, newChildNodes);
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
        if ($scope.tree.length > 1 || $scope.tree[0].id !== document.sysmlId) {
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
            if (((!orig.childViews || orig.childViews.length === 0) && childViews.length > 0) ||
                (orig.childViews && !angular.equals(orig.childViews, childViews))) {
                toSave.push({
                    sysmlId: id,
                    //name: orig.name,
                    read: orig.read,
                    modified: orig.modified,
                    childViews: childViews,
                    type: orig.type
                });
            }
        });
        ElementService.updateElements(toSave, ws)
        .then(function() {
            growl.success('Reorder Successful');
            $state.go('workspace.site.document', {}, {reload:true});
        }, function(reason) {
            if (reason.status === 409)
                growl.error("There's a conflict in the views you're trying to change!");
            else
                growl.error(reason.message);
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
            var goToId = curBranch.data.sysmlId;
            if (curBranch.type === 'section')
                goToId = curBranch.view;
            $state.go('workspace.site.document.view', {view: goToId});
        }
    };
}]);