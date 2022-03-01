import * as angular from 'angular';

var mmsApp = angular.module('mmsApp');


/* Controllers */
let LeftPaneComponent = {
  selector: "leftPane",
  template: `
  <fa-pane pane-anchor="north" pane-size="78px" pane-no-toggle="true" pane-no-scroll="true">
    <div class="pane-left">
        <div class="pane-left-toolbar" role="toolbar">
            <button-bar buttons="$ctrl.buttons" button-control="$ctrl.bbApi"></button-bar>
        </div>
        <div class="tree-options">
            <button-bar buttons="$ctrl.treeButtons" button-control="$ctrl.tbApi"></button-bar>
            <input class="ve-plain-input" ng-model-options="{debounce: 1000}"
                ng-model="$ctrl.treeOptions.search" type="text" placeholder="{{$ctrl.filterInputPlaceholder}}"
                ng-change="$ctrl.searchInputChangeHandler();" style="flex:2">
        </div>
    </div>
</fa-pane>
<fa-pane fa-pane pane-anchor="center" pane-no-toggle="true">
    <div class="pane-left" style="display:table;">
        <tree ng-show="'showTree'==(activeMenu)" tree-data="$ctrl.treeData" tree-control="$ctrl.treeControl"
                initial-selection="{{$ctrl.initialSelection}}" options="$ctrl.treeOptions"></tree>

        <div data-ng-repeat="view in ::treeViewModes" ng-show="view.id==(activeMenu)">
            <h4 style="margin: 3px 0px 3px 10px;">List of {{view.title}}</h4>
            <ul class="nav nav-list nav-pills nav-stacked abn-tree">
                <li ng-repeat="row in view.branchList | filter:$ctrl.treeOptions.search track by $index"
                    class="abn-tree-row">
                    <div class="arrow" ng-click="user_clicks_branch(row)"
                        ng-class="{'active-text': row.branch.selected}" id="tree-branch-{{view.id}}-{{row.data.id}}">
                        <a class="tree-item" style="padding-left: 20px; position:relative;">
                            <i ng-class="{'active-text': row.branch.selected}"
                            class="indented tree-icon fa {{view.icon}}"></i>
                            <!-- TODO active branch -->
                            <span class="indented tree-label" ng-class="{'active-text': row.branch.selected}">{{row.data._veNumber}} {{row.data.name}}</span>
                        </a>
                    </div>
                </li>
            </ul>
        </div>

    </div>
</fa-pane>
`,
  bindings: {
    documentOb: "<",
    orgOb: "<",
    projectOb: "<",
    refOb: "<",
    refObs: "<",
    groupObs: "<",
    docMeta: "<"
  },
  controller: class LeftPaneController {
    static $inject = ['$anchorScroll', '$q', '$filter', '$location', '$uibModal', '$scope', '$state', '$timeout', 'growl',
      'UxService', 'ElementService', 'UtilsService', 'ViewService', 'ProjectService', 'MmsAppUtils', 'ToolbarService',
      'TreeService', 'PermissionsService', 'RootScopeService', 'EventService'];

    //Injected Dependencies
    private $anchorScroll
    private $q
    private $filter
    private $location
    private $uibModal
    private $scope
    private $state
    private $timeout
    private growl
    private uxSvc
    private elementSvc
    private utilsSvc
    private viewSvc
    private projectSvc
    private MmsAppUtils
    private permissionsSvc
    private rootScopeSvc
    private tree
    private eventSvc
    private buttonBarSvc

    //Scope
    private subs
    private bars
    private $pane
    private treeApi

    public treeData
    public bbApi
    public tbApi
    public buttons
    public treeButtons
    public treeOptions
    // public filterInputPlaceholder
    public tableList
    public figureList
    public equationList
    public treeViewModes
    public activeMenu
    public viewId2node
    public seenViewIds
    // public itemType
    // public newViewAggr
    // public parentBranchData
    // public oking
    // public searchOptions
    // public removeObject
    public initialSelection

    //Bindings
    private documentOb
    private viewOb
    private orgOb
    private projectOb
    private refOb
    private refObs
    private groupObs
    private docMeta

    //Local Variables
    public docEditable;
    public addItemData
    // private newView: any;
    // private newGroup: { name: string };
    // private newDoc: any;
    // private createForm: boolean;
    // private resolvedBindings;

    constructor($anchorScroll, $q, $filter, $location, $uibModal, $scope, $state, $timeout, growl, UxService,
                ElementService, UtilsService, ViewService, ProjectService, MmsAppUtils, ToolbarService, TreeService,
                PermissionsService, RootScopeService, EventService) {

      this.$anchorScroll = $anchorScroll;
      this.$q = $q;
      this.$filter = $filter;
      this.$location = $location;
      this.$uibModal = $uibModal;
      //TODO: Replace $scope.$pane with re-implemented pane component
      this.$scope = $scope;
      this.$pane = this.$scope.$parent.$parent.$parent.$pane;
      this.$state = $state;
      this.$timeout = $timeout;
      this.growl = growl;
      this.uxSvc = UxService;
      this.elementSvc = ElementService;
      this.utilsSvc = UtilsService;
      this.viewSvc = ViewService;
      this.projectSvc = ProjectService;
      this.MmsAppUtils = MmsAppUtils;
      this.permissionsSvc = PermissionsService;

      this.tree = TreeService;
      this.eventSvc = EventService;
      this.rootScopeSvc = RootScopeService;
      //this.buttonBarSvc = ButtonBarService;



      this.buttons = [];
      this.treeButtons = [];





      this.tableList = [];
      this.figureList = [];
      this.equationList = [];
      this.treeViewModes = [{
        id: 'table',
        title: 'Tables',
        icon: 'fa-table',
        branchList: this.tableList
      }, {
        id: 'figure',
        title: 'Figures',
        icon: 'fa-image',
        branchList: this.figureList
      }, {
        id: 'equation',
        title: 'Equations',
        icon: 'fa-superscript',
        branchList: this.equationList
      }];

      this.toggle('showTree');


    }

    $onInit() {
      this.eventSvc.$init(this);

      if (this.$state.includes('project.ref.document.full')) {
        this.rootScopeSvc.veFullDocMode(true);
      }

      this.docEditable = this.documentOb && this.refOb && this.refOb.type === 'Branch' && this.utilsSvc.isView(this.documentOb) && this.permissionsSvc.hasBranchEditPermission(this.refOb);

      this.rootScopeSvc.leftPaneClosed(this.$pane.closed);

      if (this.rootScopeSvc.treeShowPe() === null) {
        this.rootScopeSvc.treeShowPe(false);
      }

      this.treeApi = this.tree.getApi();
      this.treeData = this.tree.treeData;

      //this.bbApi = this.buttonBarSvc.initApi("tree-button-bar",this.bbInit(),this);
      //this.tbApi = this.buttonBarSvc.initApi("tree-tool-bar",this.tbInit(),this);
      this.bbApi = {};
      this.tbApi = {};

      this.bbApi.init = this.bbInit();
      this.tbApi.init = this.tbInit();

      if (this.tree.treeData.length > 0) {
        this.tree.treeData.length = 0;
        this.tree.treeRows.length = 0;
      }

      this.subs.push(this.eventSvc.$on('tree-pane-toggle', (paneClosed) => {
        if (paneClosed === undefined) {
          this.$pane.toggle();
          this.rootScopeSvc.leftPaneClosed(this.$pane.closed);
        } else if (paneClosed && !this.$pane.closed) {
          this.$pane.toggle();
          this.rootScopeSvc.leftPaneClosed(this.$pane.closed);
        } else if (!paneClosed && this.$pane.closed) {
          this.$pane.toggle();
          this.rootScopeSvc.leftPaneClosed(this.$pane.closed);
        }
      }));

      this.subs.push(this.eventSvc.$on('tree-expand', () => {
        this.treeApi.expand_all();
      }));

      this.subs.push(this.eventSvc.$on('tree-collapse', () => {
        this.treeApi.collapse_all();
      }));

      this.subs.push(this.eventSvc.$on('tree-add-document', () => {
        this.addItem('Document');
      }));

      this.subs.push(this.eventSvc.$on('tree-delete-document', () => {
        this.deleteItem();
      }));

      this.subs.push(this.eventSvc.$on('tree-add-view', () => {
        this.addItem('View');
      }));

      this.subs.push(this.eventSvc.$on('tree-delete', () => {
        this.deleteItem();
      }));

      this.subs.push(this.eventSvc.$on('tree-delete-view', () => {
        this.deleteItem((deleteBranch) => {
          this.eventSvc.$broadcast('mms-full-doc-view-deleted', deleteBranch);
        });
      }));

      this.subs.push(this.eventSvc.$on('tree-reorder-view', () => {
        this.rootScopeSvc.veFullDocMode(false);
        this.bbApi.setToggleState("tree-full-document", false);
        this.$state.go('project.ref.document.order', {search: undefined});
      }));

      this.subs.push(this.eventSvc.$on('tree-reorder-group', () => {
        this.$state.go('project.ref.groupReorder');
      }));

      this.subs.push(this.eventSvc.$on('tree-add-group', () => {
        this.addItem('Group');
      }));

      this.subs.push(this.eventSvc.$on('tree-show-pe', () => {
        this.toggle('showTree');
        this.rootScopeSvc.treeShowPe(true);
        this.setPeVisibility(this.viewId2node[this.documentOb.id]);
        this.treeApi.refresh();
      }));

      this.subs.push(this.eventSvc.$on('tree-show-views', () => {
        this.toggle('showTree');
        this.rootScopeSvc.treeShowPe(false);
        this.setPeVisibility(this.viewId2node[this.documentOb.id]);
        this.treeApi.refresh();
      }));

      this.subs.push(this.eventSvc.$on('tree-show-tables', () => {
        this.toggle('table');
      }));
      this.subs.push(this.eventSvc.$on('tree-show-figures', () => {
        this.toggle('figure');
      }));
      this.subs.push(this.eventSvc.$on('tree-show-equations', () => {
        this.toggle('equation');
      }));

      this.subs.push(this.eventSvc.$on('tree-full-document', () => {
        this.fullDocMode();
      }));

      if (this.$state.includes('project.ref') && !this.$state.includes('project.ref.document')) {
        //TODO: Evaluate putting this directly into session service as opposed to handing down
        this.treeData.push(...this.utilsSvc.buildTreeHierarchy(this.groupObs, "id", "group", "_parentId", this.groupLevel2Func));
        this.viewSvc.getProjectDocuments({
          projectId: this.projectOb.id,
          refId: this.refOb.id
        }, 2).then((documentObs) => {
          for (var i = 0; i < documentObs.length; i++) {
            if (!documentObs[i]._groupId || documentObs[i]._groupId == this.projectOb.id) {
              this.treeData.push({
                label: documentObs[i].name,
                type: 'view',
                data: documentObs[i],
                children: []
              });
            }
          }
          if (this.treeApi.initialSelect) {
            this.treeApi.initialSelect();
          }
        });
      } else {
        if (!this.documentOb._childViews) {
          this.documentOb._childViews = [];
        }
        this.MmsAppUtils.handleChildViews(this.documentOb, 'composite', undefined, this.projectOb.id, this.refOb.id, this.handleSingleView, this.handleChildren)
            .then((node) => {
              var bulkGet = [];
              for (let i in this.viewId2node) {
                var view = this.viewId2node[i].data;
                if (view._contents && view._contents.operand) {
                  for (var j = 0; j < view._contents.operand.length; j++) {
                    bulkGet.push(view._contents.operand[j].instanceId);
                  }
                }
              }
              this.elementSvc.getElements({
                elementIds: bulkGet,
                projectId: this.projectOb.id,
                refId: this.refOb.id
              }, 0).finally(() => {
                for (var i in this.viewId2node) {
                  this.addSectionElements(this.viewId2node[i].data, this.viewId2node[i], this.viewId2node[i], true);
                }
                this.treeApi.refresh();
              });
            }, (reason) => {
              console.log(reason);
            });
        this.treeData.push(this.viewId2node[this.documentOb.id]);
      }

      this.treeOptions = {
        types: this.uxSvc.getTreeTypes(),
        sectionNumbering: !!this.$state.includes('project.ref.document'),
        numberingDepth: 0,
        numberingSeparator: '.',
        expandLevel: this.$state.includes('project.ref.document') ? 3 : (this.$state.includes('project.ref') ? 0 : 1),
        search: '',
        onSelect: 'tree-click',
        onDblclick: 'tree-double-click',
        sort: !this.$state.includes('project.ref.document')
      };
      if (this.documentOb && this.docMeta) {
        this.treeOptions.numberingDepth = this.docMeta.numberingDepth;
        this.treeOptions.numberingSeparator = this.docMeta.numberingSeparator;
        this.treeOptions.startChapter = this.documentOb._startChapter;
      }

      this.rootScopeSvc.treeOptions(this.treeOptions);

      this.subs.push(this.eventSvc.$on(this.treeOptions.onDblclick, (args) => {
        this.treeDblclickHandler(args.branch);
      }));

      this.subs.push(this.eventSvc.$on(this.treeOptions.onSelect, (args) => {
        this.treeClickHandler(args.branch);
      }));

      // Utils creates this event when deleting instances from the view
      this.subs.push(this.eventSvc.$on('viewctrl.delete.element', (elementData) => {
        var branch = this.treeApi.get_branch(elementData);
        if (branch) {
          this.treeApi.remove_single_branch(branch);
        }
        this.resetPeTreeList(branch.type);
      }));

      this.subs.push(this.eventSvc.$on('view.reorder.saved', (data) => {
        var node = this.viewId2node[data.id];
        var viewNode = node;
        var newChildren = [];
        for (var i = 0; i < node.children.length; i++) {
          var child = node.children[i];
          if (child.type === 'view') {
            newChildren.push(child);
          }
        }
        node.children = newChildren;
        if (node.type === 'section') {
          viewNode = this.viewId2node[node.view];
          if (!viewNode) {
            viewNode = node;
          }
        }
        this.addSectionElements(node.data, viewNode, node);
      }));

    }

    $onChanges(changes) {
      if (changes.$pane) {
        if (changes.$pane.currentValue.closed != this.rootScopeSvc.leftPaneClosed()) {
          this.rootScopeSvc.leftPaneClosed(changes.$pane.currentValue.closed);
        }

      }
    }

    $onDestroy() {
      this.buttonBarSvc.destroy(this.bars);
      this.eventSvc.destroy(this.subs);
    }

    tbInit() {
      if (this.$state.includes('project.ref.document')) {
        const viewModeButton = this.uxSvc.getButtonBarButton("view-mode-dropdown");
        this.tbApi.addButton(viewModeButton);
        this.tbApi.select(viewModeButton, this.rootScopeSvc.treeShowPe() ? this.uxSvc.getButtonBarButton('tree-show-pe') : this.uxSvc.getButtonBarButton('tree-show-views'));
      }
    };

    bbInit() {
      if (typeof this.bbApi.addButton === 'function') {
        this.bbApi.addButton(this.uxSvc.getButtonBarButton("tree-expand"));
        this.bbApi.addButton(this.uxSvc.getButtonBarButton("tree-collapse"));
        if (this.$state.includes('project.ref') && !this.$state.includes('project.ref.document')) {
          this.bbApi.addButton(this.uxSvc.getButtonBarButton("tree-reorder-group"));
          this.bbApi.setPermission("tree-reorder-group", this.projectOb && this.permissionsSvc.hasProjectEditPermission(this.projectOb));
          this.bbApi.addButton(this.uxSvc.getButtonBarButton("tree-add-document-or-group"));
          this.bbApi.addButton(this.uxSvc.getButtonBarButton("tree-delete-document"));
          this.bbApi.setPermission("tree-add-document-or-group", (this.refOb.type !== 'Tag') && this.permissionsSvc.hasBranchEditPermission(this.refOb));
          this.bbApi.setPermission("tree-delete-document", (this.refOb.type !== 'Tag') && this.permissionsSvc.hasBranchEditPermission(this.refOb));
        } else if (this.$state.includes('project.ref.document')) {
          this.bbApi.addButton(this.uxSvc.getButtonBarButton("tree-reorder-view"));
          this.bbApi.addButton(this.uxSvc.getButtonBarButton("tree-full-document"));
          this.bbApi.addButton(this.uxSvc.getButtonBarButton("tree-add-view"));
          this.bbApi.addButton(this.uxSvc.getButtonBarButton("tree-delete-view"));
          this.bbApi.setPermission("tree-add-view", this.docEditable);
          this.bbApi.setPermission("tree-reorder-view", this.docEditable);
          this.bbApi.setPermission("tree-delete-view", this.docEditable);
          if (this.rootScopeSvc.veFullDocMode()) {
            this.bbApi.setToggleState('tree-full-document', true);
          }
        }

      }

    };

    toggle(id) {
      this.activeMenu = id;
    };

    // Get a list of specific PE type from branch
    getPeTreeList(branch, type, list) {
      if (branch.type === type) {
        list.push(branch);
      }
      for (var i = 0; i < branch.children.length; i++) {
        this.getPeTreeList(branch.children[i], type, list);
      }
    }

    // Function to refresh table and figure list when new item added, deleted or reordered
    resetPeTreeList(elemType) {
      if (elemType == 'table' || elemType == 'all') {
        this.tableList.length = 0;
        this.getPeTreeList(this.viewId2node[this.documentOb.id], 'table', this.tableList);
      }
      if (elemType == 'figure' || elemType == 'image' || elemType == 'all') {
        this.figureList.length = 0;
        this.getPeTreeList(this.viewId2node[this.documentOb.id], 'figure', this.figureList);
      }
      if (elemType == 'equation' || elemType == 'all') {
        this.equationList.length = 0;
        this.getPeTreeList(this.viewId2node[this.documentOb.id], 'equation', this.equationList);
      }
    }

    groupLevel2Func(groupOb, groupNode) {
      groupNode.loading = true;
      this.viewSvc.getProjectDocuments({
        projectId: this.projectOb.id,
        refId: this.refOb.id
      }, 2).then((documentObs) => {
        let docs = [];
        let docOb, i;
        for (i = 0; i < documentObs.length; i++) {
          docOb = documentObs[i];
          if (docOb._groupId === groupOb.id) {
            docs.push(docOb);
          }
        }
        for (i = 0; i < docs.length; i++) {
          docOb = docs[i];
          groupNode.children.unshift({
            label: docOb.name,
            type: this.refOb.type === 'Branch' ? 'view' : 'snapshot',
            data: docOb,
            group: groupOb,
            children: []
          });
        }
        groupNode.loading = false;
        if (this.treeApi.initialSelect) {
          this.treeApi.initialSelect();
        }
      });
    };

    handleSingleView(v, aggr) {
      var curNode = this.viewId2node[v.id];
      if (!curNode) {
        curNode = {
          label: v.name,
          type: 'view',
          data: v,
          children: [],
          loading: true,
          aggr: aggr
        };
        this.viewId2node[v.id] = curNode;
      }
      return curNode;
    };

    handleChildren(curNode, childNodes) {
      let newChildNodes = [];
      let node;
      for (var i = 0; i < childNodes.length; i++) {
        node = childNodes[i];
        if (this.seenViewIds[node.data.id]) {
          this.growl.error("Warning: View " + node.data.name + " have multiple parents! Duplicates not shown.");
          continue;
        }
        this.seenViewIds[node.data.id] = node;
        newChildNodes.push(node);
      }
      curNode.children.push.apply(curNode.children, newChildNodes);
      curNode.loading = false;
      if (this.treeApi.refresh) {
        this.treeApi.refresh();
      }
    };

    processDeletedViewBranch(branch) {
      let id = branch.data.id;
      if (this.seenViewIds[id]) {
        delete this.seenViewIds[id];
      }
      if (this.viewId2node[id]) {
        delete this.viewId2node[id];
      }
      for (var i = 0; i < branch.children.length; i++) {
        this.processDeletedViewBranch(branch.children[i]);
      }
    };


    addSectionElements(element, viewNode, parentNode, initial?) {
      var contents = null;

      var addContentsSectionTreeNode = (operand) => {
        var bulkGet = [];
        var i = 0;
        for (i = 0; i < operand.length; i++) {
          bulkGet.push(operand[i].instanceId);
        }
        this.elementSvc.getElements({
          elementIds: bulkGet,
          projectId: this.projectOb.id,
          refId: this.refOb.id,
        }, 0).then((ignore) => {
          var instances = [];
          for (var i = 0; i < operand.length; i++) {
            instances.push(this.elementSvc.getElement({
              projectId: this.projectOb.id,
              refId: this.refOb.id,
              elementId: operand[i].instanceId,
            }, 0));
          }
          this.$q.all(instances).then((results) => {
            var k = results.length - 1;
            for (; k >= 0; k--) {
              var instance = results[k];
              var hide = !this.rootScopeSvc.treeShowPe();
              if (this.viewSvc.isSection(instance)) {
                var sectionTreeNode = {
                  label: instance.name,
                  type: "section",
                  viewId: viewNode.data.id,
                  data: instance,
                  children: []
                };
                this.viewId2node[instance.id] = sectionTreeNode;
                parentNode.children.unshift(sectionTreeNode);
                this.addSectionElements(instance, viewNode, sectionTreeNode, initial);
              } else if (this.viewSvc.getTreeType(instance)) {
                var otherTreeNode = {
                  label: instance.name,
                  type: this.viewSvc.getTreeType(instance),
                  viewId: viewNode.data.id,
                  data: instance,
                  hide: hide,
                  children: []
                };
                parentNode.children.unshift(otherTreeNode);
              }
            }
            this.treeApi.refresh();
            if (initial) {
              this.treeApi.initialSelect();
            }
            this.resetPeTreeList('all');
          }, (reason) => {
            //view is bad
          });
        }, (reason) => {
        });
      };

      if (element._contents) {
        contents = element._contents;
      } else if (this.viewSvc.isSection(element) && element.specification) {
        contents = element.specification; // For Sections, the contents expression is the specification
      } else {
        //bad?
      }
      if (contents && contents.operand) {
        addContentsSectionTreeNode(contents.operand);
      }
    }

    treeClickHandler(branch) {
      if (this.$state.includes('project.ref') && !this.$state.includes('project.ref.document')) {
        if (branch.type === 'group') {
          this.$state.go('project.ref.preview', {
            documentId: 'site_' + branch.data.id + '_cover',
            search: undefined
          });
        } else if (branch.type === 'view' || branch.type === 'snapshot') {
          this.$state.go('project.ref.preview', {documentId: branch.data.id, search: undefined});
        }
      } else if (this.$state.includes('project.ref.document')) {
        var viewId = (branch.type !== 'view') ? branch.viewId : branch.data.id;
        // var sectionId = branch.type === 'section' ? branch.data.id : null;
        var hash = branch.data.id;
        if (this.rootScopeSvc.veFullDocMode()) {
          this.eventSvc.$broadcast('mms-tree-click', branch);
        } else if (branch.type === 'view' || branch.type === 'section') {
          this.$state.go('project.ref.document.view', {viewId: branch.data.id, search: undefined});
        } else {
          this.$state.go('project.ref.document.view', {viewId: viewId, search: undefined});
          this.$timeout(() => {
            this.$location.hash(hash);
            this.$anchorScroll();
          }, 1000, false);
        }
      }
    };

    treeDblclickHandler(branch) {
      if (this.$state.includes('project.ref') && !this.$state.includes('project.ref.document')) {
        if (branch.type === 'group')
          this.treeApi.expand_branch(branch);
        else if (branch.type === 'view' || branch.type === 'snapshot') {
          this.$state.go('project.ref.document', {documentId: branch.data.id, search: undefined});
        }
      } else if (this.$state.includes('project.ref.document')) {
        this.treeApi.expand_branch(branch);
      }
    };

    fullDocMode() {
      if (this.rootScopeSvc.veFullDocMode()) {
        this.rootScopeSvc.veFullDocMode(false);
        this.bbApi.setToggleState("tree-full-document", false);
        var curBranch = this.treeApi.get_selected_branch();
        if (curBranch) {
          var viewId;
          if (curBranch.type !== 'view') {
            if (curBranch.type === 'section' && curBranch.data.type === 'InstanceSpecification') {
              viewId = curBranch.data.id;
            } else {
              viewId = curBranch.viewId;
            }
          } else {
            viewId = curBranch.data.id;
          }
          this.$state.go('project.ref.document.view', {viewId: viewId, search: undefined});
        }
      } else {
        this.rootScopeSvc.veFullDocMode(true);
        this.bbApi.setToggleState("tree-full-document", true);
        this.$state.go('project.ref.document.full', {search: undefined});
      }
    };

    addItem(itemType) {
      this.addItemData = {
        itemType: itemType,
        newViewAggr: {type: 'shared'},
        parentBranchData: {},
        branchType: ""
      }
      var branch = this.treeApi.get_selected_branch();
      if (itemType === 'Document') {
        this.addDocument(branch);
      } else if (itemType === 'Group') {
        this.addGroup(branch);
      } else if (itemType === 'View') {
        this.addView(branch);
      } else {
        this.growl.error("Add Item of Type " + itemType + " is not supported");
        return;
      }
      let instance = this.$uibModal.open({
        component: 'addItem',
        resolve: {
          getAddData: () => {
            return this.addItemData;
          },
          getFilter: () => {
            return this.$filter;
          },
          getProjectOb: () => {
            return this.projectOb;
          },
          getRefOb: () => {
            return this.refOb;
          },
          getOrgOb: () => {
            return this.orgOb;
          },
          getSeenViewIds: () => {
            return this.seenViewIds;
          }
      }});
      instance.result.then((result) => {

        let data = result.$value;
        if (!this.rootScopeSvc.veEditMode()) {
          this.$timeout(() => {
            $('.show-edits').click();
          }, 0, false);
        }
        let newbranch = {
          label: data.name,
          type: this.addItemData.branchType,
          data: data,
          children: [],
          aggr: null,
        };
        var top = itemType === 'Group';
        this.treeApi.add_branch(branch, newbranch, top);

        const addToFullDocView = (node, curSection, prevSysml) => {
          var lastChild = prevSysml;
          if (node.children) {
            var num = 1;
            for (var i = 0; i < node.children.length; i++) {
              var cNode = node.children[i];
              var data = {
                vId: cNode.data.id,
                curSec: curSection + '.' + num,
                prevSibId: lastChild
              };
              this.eventSvc.$broadcast('mms-new-view-added', data);
              lastChild = addToFullDocView(cNode, curSection + '.' + num, cNode.data.id);
              num = num + 1;
            }
          }
          return lastChild;
        };

        if (itemType === 'View') {
          this.viewId2node[data.id] = newbranch;
          this.seenViewIds[data.id] = newbranch;
          newbranch.aggr = this.addItemData.newViewAggr.type;
          var curNum = branch.children[branch.children.length - 1].section;
          var prevBranch = this.treeApi.get_prev_branch(newbranch);
          while (prevBranch.type !== 'view') {
            prevBranch = this.treeApi.get_prev_branch(prevBranch);
          }
          this.MmsAppUtils.handleChildViews(data, this.addItemData.newViewAggr.type, undefined, this.projectOb.id, this.refOb.id, this.handleSingleView, this.handleChildren)
              .then((node) => {
                // handle full doc mode
                if (this.rootScopeSvc.veFullDocMode()) {
                  addToFullDocView(node, curNum, newbranch.data.id);
                }
                this.addViewSectionsRecursivelyForNode(node);
              });
          if (!this.rootScopeSvc.veFullDocMode()) {
            this.$state.go('project.ref.document.view', {viewId: data.id, search: undefined});
          } else {
            if (prevBranch) {
              this.eventSvc.$broadcast('mms-new-view-added', {
                vId: data.id,
                curSec: curNum,
                prevSibId: prevBranch.data.id
              });
            } else {
              this.eventSvc.$broadcast('mms-new-view-added', {vId: data.id, curSec: curNum, prevSibId: branch.data.id});
            }
          }
        }
      });
    }

    addDocument(branch) {
      if (!branch) {
        this.addItemData.parentBranchData = {id: "holding_bin_" + this.projectOb.id};
      } else if (branch.type !== 'group') {
        this.growl.warning("Select a group to add document under");
        return;
      } else {
        this.addItemData.parentBranchData = branch.data;
      }
      this.addItemData.branchType = 'view';
    }

    addGroup(branch) {
      if (branch && branch.type === 'group') {
        this.addItemData.parentBranchData = branch.data;
      } else {
        this.addItemData.parentBranchData = {id: "holding_bin_" + this.projectOb.id};
        // Always create group at root level if the selected branch is not a group branch
        branch = null;
      }
      this.addItemData.branchType = 'group';
    }

    addView(branch) {

      if (!branch) {
        this.growl.warning("Add View Error: Select parent view first");
        return;
      } else if (branch.type === "section") {
        this.growl.warning("Add View Error: Cannot add a child view to a section");
        return;
      } else if (branch.aggr === 'none') {
        this.growl.warning("Add View Error: Cannot add a child view to a non-owned and non-shared view.");
        return;
      }
      this.addItemData.parentBranchData = branch.data;
      this.addItemData.branchType = 'view';
    }

    deleteItem(cb?) {
      var branch = this.treeApi.get_selected_branch();
      if (!branch) {
        this.growl.warning("Select item to remove.");
        return;
      }
      var type = this.viewSvc.getElementType(branch.data);
      if (this.$state.includes('project.ref.document')) {
        if (type == 'Document') {
          this.growl.warning("Cannot remove a document from this view. To remove this item, go to project home.");
          return;
        }
        if (branch.type !== 'view' || (!this.utilsSvc.isView(branch.data))) {
          this.growl.warning("Cannot remove non-view item. To remove this item, open it in the center pane.");
          return;
        }
      }

      // when in project.ref state, allow deletion for view/document/group
      if (this.$state.includes('project.ref') && !this.$state.includes('project.ref.document')) {
        if (branch.type !== 'view' && !this.utilsSvc.isDocument(branch.data) && (branch.type !== 'group' || branch.children.length > 0)) {
          this.growl.warning("Cannot remove group with contents. Empty contents and try again.");
          return;
        }
      }
      var instance = this.$uibModal.open({
        component: 'confirmDelete',
        resolve: {
          getType: () => {
            let type = branch.type;
            if (this.utilsSvc.isDocument(branch.data)) {
              type = 'Document';
            }
            return type;
          },
          getName: () => {
            return branch.name;
          },
          ok: () => {
            let promise = null;
            if (branch.type === 'view') {
              var parentBranch = this.treeApi.get_parent_branch(branch);
              if (!this.$state.includes('project.ref.document')) {
                promise = this.viewSvc.downgradeDocument(branch.data);
              } else {
                promise = this.viewSvc.removeViewFromParentView({
                  projectId: parentBranch.data._projectId,
                  refId: parentBranch.data._refId,
                  parentViewId: parentBranch.data.id,
                  viewId: branch.data.id
                });
              }
            } else if (branch.type === 'group') {
              promise = branch.removeGroup(branch.data);
            }
            if (promise) {
              promise.then(() => {
                return true;
              }, (reason) => {
                return reason;
              });
            }else {
              return false;
            }
          }
        }
      });
      instance.result.then((data) => {
        this.treeApi.remove_branch(branch);
        if (this.$state.includes('project.ref.document') && branch.type === 'view') {
          this.processDeletedViewBranch(branch);
        }
        if (this.rootScopeSvc.veFullDocMode()) {
          cb(branch);
        } else {
          this.treeApi.clear_selected_branch();
          this.$state.go('^', {search: undefined});
        }
      });
    };

    addViewSections(view) {
      var node = this.viewId2node[view.id];
      this.addSectionElements(view, node, node);
    }

    addViewSectionsRecursivelyForNode(node) {
      this.addViewSections(node.data);
      for (var i = 0; i < node.children.length; i++) {
        if (node.children[i].type === 'view') {
          this.addViewSectionsRecursivelyForNode(node.children[i]);
        }
      }
    }

    setPeVisibility(branch) {
      if (branch.type === 'figure' || branch.type === 'table' || branch.type === 'equation') {
        branch.hide = !this.rootScopeSvc.treeShowPe();
      }
      for (var i = 0; i < branch.children.length; i++) {
        this.setPeVisibility(branch.children[i]);
      }
    }

    //TODO refresh table and fig list when new item added, deleted or reordered
    user_clicks_branch(branch) {
      this.treeApi.user_clicks_branch(branch);
    };

    searchInputChangeHandler() {
      if (this.treeOptions.search === '') {
        this.treeApi.collapse_all();
        this.treeApi.expandPathToSelectedBranch();
      } else {
        // expand all branches so that the filter works correctly
        this.treeApi.expand_all();
      }
    }

  }
};

mmsApp.component(LeftPaneComponent.selector,LeftPaneComponent);
