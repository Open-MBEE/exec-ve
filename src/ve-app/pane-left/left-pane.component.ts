import * as angular from 'angular';
import Rx from 'rx-lite';

import {StateService, Transition, TransitionService, UIRouterGlobals} from "@uirouter/angularjs";
import {
  EventService,
  RootScopeService, TreeApi,
  TreeService,
  UtilsService,
} from "@ve-utils/core-services";
import {
  ElementService,
  PermissionsService,
  ProjectService,
  ViewService
} from "@ve-utils/mms-api-client";
import {AppUtilsService} from "@ve-app/main/services";
import {IButtonBarButton, ButtonBarApi, ButtonBarService} from "@ve-utils/button-bar";
import {VeComponentOptions, VeModalService, VeModalSettings} from "@ve-types/view-editor";
import {ElementObject, ProjectObject, RefObject, ViewObject} from "@ve-types/mms";
import {ValueSpec} from "@ve-utils/utils";
import {TreeBranch} from "@ve-types/tree";
import {IPaneManagerService} from "@openmbee/pane-layout/lib/PaneManagerService";
import {IPane} from "@openmbee/pane-layout";


import {veApp} from "@ve-app";
import {AddItemData, AddItemResolveFn} from "@ve-app/main/modals/add-item-modal.component";
import {ConfirmDeleteModalResolveFn} from "@ve-app/main/modals/confirm-delete-modal.component";


class LeftPaneController implements angular.IComponentController {


  //Scope
  public subs: Rx.IDisposable[];

  private $pane: IPane
  private paneClosed: boolean

  private treeApi: TreeApi
  public treeData: TreeBranch[]

  public bbApi: ButtonBarApi
  public tbApi: ButtonBarApi
  public bars: string[]
  public buttons: IButtonBarButton[]
  public treeButtons: IButtonBarButton[]

  public treeOptions
  public tableList
  public figureList
  public equationList
  public treeViewModes
  public activeMenu
  public viewId2node: {[key: string]: TreeBranch} = {};
  public seenViewIds: {[key: string]: TreeBranch} = {};
  public initialSelection

  //Bindings
  private mmsDocument
  private mmsOrg
  private mmsProject
  private mmsRef
  private mmsGroups: ElementObject[]
  private docMeta

  //Local Variables
  public docEditable;
  public addItemData: AddItemData

  static $inject = ['$anchorScroll', '$q', '$filter', '$location',
    '$uibModal', '$scope', '$state', '$transitions', '$uiRouterGlobals', '$paneManager',
    '$timeout', 'growl', 'ElementService', 'UtilsService',
    'ViewService', 'ProjectService', 'AppUtilsService',
    'TreeService', 'PermissionsService',
    'RootScopeService', 'EventService', 'ButtonBarService'];

  constructor(private $anchorScroll: angular.IAnchorScrollService, private $q: angular.IQService,
              private $filter: angular.IFilterService, private $location: angular.ILocationService,
              private $uibModal: VeModalService, private $scope, private $state: StateService, private $transitions: TransitionService,
              private $uiRouterGlobals: UIRouterGlobals, private $paneManager: IPaneManagerService,
              private $timeout: angular.ITimeoutService, private growl: angular.growl.IGrowlService,
              private elementSvc: ElementService, private utilsSvc: UtilsService,
              private viewSvc: ViewService, private projectSvc: ProjectService, private appUtilsSvc: AppUtilsService,
              private treeSvc: TreeService, private permissionsSvc: PermissionsService,
              private rootScopeSvc: RootScopeService, private eventSvc: EventService, private buttonBarSvc: ButtonBarService) {


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




  }

  $onInit() {

    this.paneClosed = false;
    this.toggle('tree');
    this.eventSvc.$init(this);

    if (this.$state.includes('main.project.ref.document.full') && !this.rootScopeSvc.veFullDocMode()) {
      this.rootScopeSvc.veFullDocMode(true);
    }

    this.docEditable = this.mmsDocument && this.mmsRef && this.mmsRef.type === 'Branch' && this.utilsSvc.isView(this.mmsDocument) && this.permissionsSvc.hasBranchEditPermission(this.mmsRef);



    if (this.rootScopeSvc.treeShowPe() === null) {
      this.rootScopeSvc.treeShowPe(false);
    }

    this.treeApi = this.treeSvc.getApi();
    this.treeData = this.treeApi.treeData;

    this.bbApi = this.buttonBarSvc.initApi("tree-button-bar",this.bbInit,this);
    this.tbApi = this.buttonBarSvc.initApi("tree-tool-bar",this.tbInit,this);

    this.$transitions.onSuccess({}, (trans: Transition) => {
      this.bbApi.resetButtons();
      this.tbApi.resetButtons();
    });

    if (this.treeData.length > 0) {
      this.treeData.length = 0;
      this.treeApi.treeRows.length = 0;
    }

    //Init Pane Toggle Controls
    this.rootScopeSvc.leftPaneClosed(this.$pane.closed);

    this.subs.push(this.$pane.$toggled.subscribe(() => {
      this.rootScopeSvc.leftPaneClosed(this.$pane.closed);
    }));

    this.subs.push(this.eventSvc.$on('left-pane.toggle', (paneClosed) => {
      if (paneClosed === undefined) {
        this.$pane.toggle();
      } else if (paneClosed && !this.$pane.closed) {
        this.$pane.toggle();
      } else if (!paneClosed && this.$pane.closed) {
        this.$pane.toggle();
      }
    }));


    this.subs.push(this.eventSvc.$on('tree-expand', () => {
      this.treeApi.expandAll();
    }));

    this.subs.push(this.eventSvc.$on('tree-collapse', () => {
      this.treeApi.collapseAll();
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
      this.$state.go('main.project.ref.document.order', {search: undefined});
    }));

    this.subs.push(this.eventSvc.$on('tree-reorder-group', () => {
      this.$state.go('main.project.ref.groupReorder');
    }));

    this.subs.push(this.eventSvc.$on('tree-add-group', () => {
      this.addItem('Group');
    }));

    this.subs.push(this.eventSvc.$on('tree-show-pe', () => {
      //this.toggle('tree');
      this.rootScopeSvc.treeShowPe(true);
      this.setPeVisibility(this.viewId2node[this.mmsDocument.id]);
      this.treeApi.refresh();
    }));

    this.subs.push(this.eventSvc.$on('tree-show-views', () => {
      //this.toggle('tree');
      this.rootScopeSvc.treeShowPe(false);
      this.setPeVisibility(this.viewId2node[this.mmsDocument.id]);
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

    this.subs.push(this.eventSvc.$on('tree-refresh', () => {
      this.reloadData();
    }));

    if (this.$state.includes('main.project.ref') && !this.$state.includes('main.project.ref.document')) {
      this.treeData.push(...this.treeSvc.buildTreeHierarchy(this.mmsGroups, "id", "group", "_parentId",this, this.groupLevel2Func));
      this.viewSvc.getProjectDocuments({
        projectId: this.mmsProject.id,
        refId: this.mmsRef.id
      }, 2).then((documentObs) => {
        for (var i = 0; i < documentObs.length; i++) {
          if (!documentObs[i]._groupId || documentObs[i]._groupId == this.mmsProject.id) {
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
      if (!this.mmsDocument._childViews) {
        this.mmsDocument._childViews = [];
      }
      this.viewSvc.handleChildViews(this.mmsDocument, 'composite', undefined, this.mmsProject.id, this.mmsRef.id, this.viewId2node, this.handleSingleView, this.handleChildren)
          .then((node) => {
            var bulkGet: string[] = [];
            for (let i in this.viewId2node) {
              var view: ViewObject = this.viewId2node[i].data;
              if (view._contents && view._contents.operand) {
                for (var j = 0; j < view._contents.operand.length; j++) {
                  bulkGet.push(view._contents.operand[j].instanceId);
                }
              }
            }
            this.elementSvc.getElements({
              elementId: bulkGet,
              projectId: this.mmsProject.id,
              refId: this.mmsRef.id
            }, 0).finally(() => {
              for (var i in this.viewId2node) {
                this.addSectionElements(this.viewId2node[i].data, this.viewId2node[i], this.viewId2node[i], true);
              }
              this.treeApi.refresh();
            });
          }, (reason) => {
            console.log(reason);
          });
      this.treeData.push(this.viewId2node[this.mmsDocument.id]);
    }

    this.treeOptions = {
      types: this.treeSvc.getTreeTypes(),
      sectionNumbering: !!this.$state.includes('main.project.ref.document'),
      numberingDepth: 0,
      numberingSeparator: '.',
      expandLevel: this.$state.includes('main.project.ref.document') ? 3 : (this.$state.includes('main.project.ref') ? 0 : 1),
      search: '',
      onSelect: 'tree-click',
      onDblclick: 'tree-double-click',
      sort: !this.$state.includes('main.project.ref.document')
    };
    if (this.mmsDocument && this.docMeta) {
      this.treeOptions.numberingDepth = this.docMeta.numberingDepth;
      this.treeOptions.numberingSeparator = this.docMeta.numberingSeparator;
      this.treeOptions.startChapter = this.mmsDocument._startChapter;
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
      var branch = this.treeApi.getBranch(elementData);
      if (branch) {
        this.treeApi.removeSingleBranch(branch);
      }
      this.resetPeTreeList(branch.type);
    }));

    this.subs.push(this.eventSvc.$on('spec-reorder-saved', (data) => {
      var node: TreeBranch = this.viewId2node[data.id];
      var viewNode: TreeBranch = node;
      var newChildren: TreeBranch[] = [];
      for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i];
        if (child.type === 'view') {
          newChildren.push(child);
        }
      }
      node.children = newChildren;
      if (node.type === 'section') {
        viewNode = this.viewId2node[node.data.id];
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

  tbInit = (api: ButtonBarApi) => {
    if (this.$state.includes('main.project.ref.document')) {
      const viewModeButton = this.buttonBarSvc.getButtonBarButton("view-mode-dropdown");
      api.addButton(viewModeButton);
      api.select(viewModeButton, this.rootScopeSvc.treeShowPe() ? this.buttonBarSvc.getButtonBarButton('tree-show-pe') : this.buttonBarSvc.getButtonBarButton('tree-show-views'));
    }
  };

  bbInit = (api: ButtonBarApi) => {
    api.buttons.length = 0;
    api.addButton(this.buttonBarSvc.getButtonBarButton("tree-expand"));
    api.addButton(this.buttonBarSvc.getButtonBarButton("tree-collapse"));
    if (this.$state.includes('main.project.ref') && !this.$state.includes('main.project.ref.document')) {
      api.addButton(this.buttonBarSvc.getButtonBarButton("tree-reorder-group"));
      api.setPermission("tree-reorder-group", this.mmsProject && this.permissionsSvc.hasProjectEditPermission(this.mmsProject));
      api.addButton(this.buttonBarSvc.getButtonBarButton("tree-add-document-or-group"));
      api.addButton(this.buttonBarSvc.getButtonBarButton("tree-delete-document"));
      api.setPermission("tree-add-document-or-group", (this.mmsRef.type !== 'Tag') && this.permissionsSvc.hasBranchEditPermission(this.mmsRef));
      api.setPermission("tree-delete-document", (this.mmsRef.type !== 'Tag') && this.permissionsSvc.hasBranchEditPermission(this.mmsRef));
    } else if (this.$state.includes('main.project.ref.document')) {
      api.addButton(this.buttonBarSvc.getButtonBarButton("tree-reorder-view"));
      api.addButton(this.buttonBarSvc.getButtonBarButton("tree-full-document"));
      api.addButton(this.buttonBarSvc.getButtonBarButton("tree-add-view"));
      api.addButton(this.buttonBarSvc.getButtonBarButton("tree-delete-view"));
      api.setPermission("tree-add-view", this.docEditable);
      api.setPermission("tree-reorder-view", this.docEditable);
      api.setPermission("tree-delete-view", this.docEditable);
      if (this.rootScopeSvc.veFullDocMode()) {
        api.setToggleState('tree-full-document', true);
      }
    }
    api.addButton(this.buttonBarSvc.getButtonBarButton('tree-refresh'));

  };

  toggle = (id:string) => {
    //TODO: Make into an array with remove and add for toggling Views
    if (this.activeMenu)
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
      this.getPeTreeList(this.viewId2node[this.mmsDocument.id], 'table', this.tableList);
    }
    if (elemType == 'figure' || elemType == 'image' || elemType == 'all') {
      this.figureList.length = 0;
      this.getPeTreeList(this.viewId2node[this.mmsDocument.id], 'figure', this.figureList);
    }
    if (elemType == 'equation' || elemType == 'all') {
      this.equationList.length = 0;
      this.getPeTreeList(this.viewId2node[this.mmsDocument.id], 'equation', this.equationList);
    }
  }

  groupLevel2Func = (ctrl: { mmsProject: ProjectObject, mmsRef: RefObject, treeApi: TreeApi, viewSvc: ViewService }, groupOb: ElementObject, groupNode: TreeBranch) => {
    groupNode.loading = true;
    ctrl.viewSvc.getProjectDocuments({
      projectId: ctrl.mmsProject.id,
      refId: ctrl.mmsRef.id
    }, 2).then((documentObs: ViewObject[]) => {
      let docs: ViewObject[] = [];
      let docOb: ViewObject, i;
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
          type: ctrl.mmsRef.type === 'Branch' ? 'view' : 'snapshot',
          data: docOb,
          group: groupOb,
          children: []
        });
      }
      groupNode.loading = false;
      if (ctrl.treeApi.initialSelect) {
        ctrl.treeApi.initialSelect();
      }
    });
  };

  handleSingleView = (v, aggr) => {
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

  public handleChildren = (curNode: TreeBranch, childNodes: TreeBranch[]) => {
    let newChildNodes: TreeBranch[] = [];
    let node: TreeBranch;
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
    var contents:ValueSpec | null = null

    var addContentsSectionTreeNode = (operand: ElementObject[]) => {
      var bulkGet:string[] = [];
      var i = 0;
      for (i = 0; i < operand.length; i++) {
        bulkGet.push(operand[i].instanceId);
      }
      this.elementSvc.getElements({
        elementId: bulkGet,
        projectId: this.mmsProject.id,
        refId: this.mmsRef.id,
      }, 0).then((ignore) => {
        var instances: angular.IPromise<ElementObject>[] = [];
        for (var i = 0; i < operand.length; i++) {
          instances.push(this.elementSvc.getElement({
            projectId: this.mmsProject.id,
            refId: this.mmsRef.id,
            elementId: operand[i].instanceId,
          }, 0));
        }
        this.$q.all(instances).then((results) => {
          var k = results.length - 1;
          for (; k >= 0; k--) {
            var instance: ElementObject = results[k];
            var hide = !this.rootScopeSvc.treeShowPe();
            if (this.viewSvc.isSection(instance)) {
              var sectionTreeNode = {
                label: (instance.name) ? instance.name : viewNode.data.id,
                type: "section",
                viewId: viewNode.data.id,
                data: instance,
                children: []
              };
              this.viewId2node[instance.id] = sectionTreeNode;
              parentNode.children.unshift(sectionTreeNode);
              this.addSectionElements(instance, viewNode, sectionTreeNode, initial);
            } else if (this.viewSvc.getTreeType(instance) !== 'none') {
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
    if (this.$state.includes('main.project.ref') && !this.$state.includes('main.project.ref.document')) {
      if (branch.type === 'group') {
        this.$state.go('main.project.ref.preview', {
          documentId: 'site_' + branch.data.id + '_cover',
          search: undefined
        });
      } else if (branch.type === 'view' || branch.type === 'snapshot') {
        this.$state.go('main.project.ref.preview', {documentId: branch.data.id, search: undefined});
      }
    } else if (this.$state.includes('main.project.ref.document')) {
      var viewId = (branch.type !== 'view') ? branch.viewId : branch.data.id;
      // var sectionId = branch.type === 'section' ? branch.data.id : null;
      var hash = branch.data.id;
      if (this.rootScopeSvc.veFullDocMode()) {
        this.eventSvc.$broadcast('mms-tree-click', branch);
      } else if (branch.type === 'view' || branch.type === 'section') {
        this.$state.go('main.project.ref.document.view', {viewId: branch.data.id, search: undefined});
      } else {
        this.$state.go('main.project.ref.document.view', {viewId: viewId, search: undefined});
        this.$timeout(() => {
          this.$location.hash(hash);
          this.$anchorScroll();
        }, 1000, false);
      }
    }
  };

  treeDblclickHandler(branch) {
    if (this.$state.includes('main.project.ref') && !this.$state.includes('main.project.ref.document')) {
      if (branch.type === 'group')
        this.treeApi.expand_branch(branch);
      else if (branch.type === 'view' || branch.type === 'snapshot') {
        this.$state.go('main.project.ref.document', {documentId: branch.data.id, search: undefined});
      }
    } else if (this.$state.includes('main.project.ref.document')) {
      this.treeApi.expand_branch(branch);
    }
  };

  public fullDocMode = () => {
    if (this.rootScopeSvc.veFullDocMode()) {
      this.rootScopeSvc.veFullDocMode(false);
      this.bbApi.setToggleState("tree-full-document", false);
      var curBranch = this.treeApi.getSelectedBranch();
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
        this.$state.go('main.project.ref.document.view', {viewId: viewId, search: undefined});
      }
    } else {
      this.rootScopeSvc.veFullDocMode(true);
      this.bbApi.setToggleState("tree-full-document", true);
      this.$state.go('main.project.ref.document.full', {search: undefined});
    }
  };

  reloadData() {
    this.bbApi.toggleButtonSpinner('tree-refresh');
    this.$state.reload().then(() => {
      this.treeApi.refresh();
      let dispose = this.eventSvc.$on(TreeService.events.UPDATED, () => {
        this.tbApi.toggleButtonSpinner('tree-refresh');
        dispose.dispose()
      })
    });
  }

  addItem(itemType: string) {
    const deferred = this.$q.defer();
    this.addItemData = {
      itemType: itemType,
      newViewAggr: {type: 'shared'},
      parentBranch: null,
      branchType: ""
    }
    var branch = this.treeApi.getSelectedBranch();
    if (itemType === 'Document') {
      deferred.promise = this.addDocument(branch);
    } else if (itemType === 'Group') {
      deferred.promise = this.addGroup(branch);
    } else if (itemType === 'View') {
      deferred.promise = this.addView(branch);
    } else {
      deferred.reject("Add Item of Type " + itemType + " is not supported");
    }
    deferred.promise.then(() => {
      this.addItemModal()
    },(reason) => {
      this.growl.info(reason.message, { ttl: 2000 })
    })
    return deferred.promise
  }

  addItemModal() {
    const settings: VeModalSettings = {
      component: 'addItemModal',
      resolve: <AddItemResolveFn> {
        getAddData: () => {
          return this.addItemData;
        },
        getFilter: () => {
          return this.$filter;
        },
        getProjectId: () => {
          return this.mmsProject.id;
        },
        getRefId: () => {
          return this.mmsRef.id;
        },
        getOrgId: () => {
          return this.mmsOrg.id;
        },
        getSeenViewIds: () => {
          return this.seenViewIds;
        }
      }};
    let instance = this.$uibModal.open(settings);
    instance.result.then((result) => {

      let data = result.$value;
      if (!this.rootScopeSvc.veEditMode()) {
        this.$timeout(() => {
          $('.show-edits').click();
        }, 0, false);
      }
      let newbranch: TreeBranch = {
        label: data.name,
        type: this.addItemData.branchType,
        data: data,
        children: [],
        aggr: '',
      };
      var top = this.addItemData.itemType === 'Group';
      this.reloadData();
      this.treeApi.addBranch(this.addItemData.parentBranch, newbranch, top);

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

      if (this.addItemData.itemType === 'View') {
        this.viewId2node[data.id] = newbranch;
        this.seenViewIds[data.id] = newbranch;
        newbranch.aggr = this.addItemData.newViewAggr.type;
        var curNum = this.addItemData.parentBranch.children[this.addItemData.parentBranch.children.length - 1].data._veNumber;
        var prevBranch = this.treeApi.getPrevBranch(newbranch);
        while (prevBranch.type !== 'view') {
          prevBranch = this.treeApi.getPrevBranch(prevBranch);
        }
        this.viewSvc.handleChildViews(data, this.addItemData.newViewAggr.type, undefined, this.mmsProject.id, this.mmsRef.id, this.viewId2node, this.handleSingleView, this.handleChildren)
            .then((node) => {
              // handle full doc mode
              if (this.rootScopeSvc.veFullDocMode()) {
                addToFullDocView(node, curNum, newbranch.data.id);
              }
              this.addViewSectionsRecursivelyForNode(node);
            });
        if (!this.rootScopeSvc.veFullDocMode()) {
          this.$state.go('main.project.ref.document.view', {viewId: data.id, search: undefined});
        } else {
          if (prevBranch) {
            this.eventSvc.$broadcast('mms-new-view-added', {
              vId: data.id,
              curSec: curNum,
              prevSibId: prevBranch.data.id
            });
          } else {
            this.eventSvc.$broadcast('mms-new-view-added', {vId: data.id, curSec: curNum, prevSibId: this.addItemData.parentBranch.data.id});
          }
        }
      }
    });
  }

  addDocument(branch: TreeBranch) {
    if (!branch) {
      this.addItemData.parentBranch = null;
      branch = null;
    } else if (branch.type !== 'group') {
      return this.$q.reject({ message: "Select a group to add document under"});
    } else {
      this.addItemData.parentBranch = branch;
    }
    this.addItemData.branchType = 'view';
    return this.$q.resolve();
  }

  addGroup(branch: TreeBranch) {
    if (branch && branch.type === 'group') {
      this.addItemData.parentBranch = branch;
    }
    else if (branch && branch.type !== 'group') {
      return this.$q.reject({ message: "Select a group to add group under"});
    }
    else {
      this.addItemData.parentBranch = null;
      // Always create group at root level if the selected branch is not a group branch
      branch = null;
    }
    this.addItemData.branchType = 'group';
    return this.$q.resolve();
  }

  addView(branch: TreeBranch) {

    if (!branch) {
      return this.$q.reject({message: "Add View Error: Select parent view first"});
    } else if (branch.type === "section") {
      return this.$q.reject({ message: "Add View Error: Cannot add a child view to a section"});
    } else if (branch.aggr === 'none') {
      return this.$q.reject({ message: "Add View Error: Cannot add a child view to a non-owned and non-shared view."});
    }
    this.addItemData.parentBranch = branch;
    this.addItemData.branchType = 'view';
    return this.$q.resolve();
  }

  deleteItem(cb?) {
    var branch = this.treeApi.getSelectedBranch();
    if (!branch) {
      this.growl.warning("Select item to remove.");
      return;
    }
    var type = this.viewSvc.getElementType(branch.data);
    if (this.$state.includes('main.project.ref.document')) {
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
    if (this.$state.includes('main.project.ref') && !this.$state.includes('main.project.ref.document')) {
      if (branch.type !== 'view' && !this.utilsSvc.isDocument(branch.data) && (branch.type !== 'group' || branch.children.length > 0)) {
        this.growl.warning("Cannot remove group with contents. Empty contents and try again.");
        return;
      }
    }
    var instance = this.$uibModal.open({
      component: 'confirmDeleteModal',
      resolve: <ConfirmDeleteModalResolveFn> {
        getType: () => {
          let type = branch.type;
          if (this.utilsSvc.isDocument(branch.data)) {
            type = 'Document';
          }
          return type;
        },
        getName: () => {
          return branch.data.name;
        },
        finalize: () => { return () => {
          let deferred: angular.IDeferred<boolean> = this.$q.defer();
          let resolve = () => {
            deferred.resolve(true)
          }
          let reject = (reason) => {
            deferred.reject(reason);
          }
          if (branch.type === 'view') {
            var parentBranch = this.treeApi.getParent(branch);
            if (!this.$state.includes('main.project.ref.document')) {
              this.viewSvc.downgradeDocument(branch.data).then(resolve,reject)
            } else {
              this.viewSvc.removeViewFromParentView({
                projectId: parentBranch.data._projectId,
                refId: parentBranch.data._refId,
                parentViewId: parentBranch.data.id,
                viewId: branch.data.id
              }).then(resolve,reject)
            }
          } else if (branch.type === 'group') {
            this.viewSvc.removeGroup(branch.data).then(resolve,reject)
          } else {
            deferred.resolve(false);
          }
          return deferred.promise;
        }}
      }
    });
    instance.result.then((data) => {
      this.treeApi.removeBranch(branch);
      if (this.$state.includes('main.project.ref.document') && branch.type === 'view') {
        this.processDeletedViewBranch(branch);
      }

      if (this.rootScopeSvc.veFullDocMode()) {
        cb(branch);
      } else {
        this.treeApi.selectBranch();
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
  userClicksBranch(branch) {
    this.treeApi.userClicksBranch(branch);
  };

  userClicksPane() {
    this.treeApi.selectBranch();
  }

  searchInputChangeHandler() {
    if (this.treeOptions.search === '') {
      this.treeApi.collapseAll();
      this.treeApi.expandPathToSelectedBranch();
    } else {
      // expand all branches so that the filter works correctly
      this.treeApi.expandAll();
    }
  }

}

/* Controllers */
let LeftPaneComponent: VeComponentOptions = {
  selector: "leftPane",
  transclude: true,
  template: `
  <ng-pane pane-anchor="north" pane-size="78px" pane-no-toggle="true" pane-no-scroll="true" pane-closed="false" parent-ctrl="$ctrl">
    <div class="pane-left">
        <div class="pane-left-toolbar" role="toolbar">
            <button-bar button-api="$ctrl.bbApi"></button-bar>
        </div>
        <div class="tree-options">
            <button-bar button-api="$ctrl.tbApi"></button-bar>
            <input class="ve-plain-input" ng-model-options="{debounce: 1000}"
                ng-model="$ctrl.treeOptions.search" type="text" placeholder="{{$ctrl.filterInputPlaceholder}}"
                ng-change="$ctrl.searchInputChangeHandler();" style="flex:2">
        </div>
    </div>
</ng-pane>
<ng-pane pane-anchor="center" pane-no-toggle="true" pane-closed="false" parent-ctrl="$ctrl" >
    <div class="pane-left" style="display:table;">
        <tree options="$ctrl.treeOptions"></tree>

        <div data-ng-repeat="view in $ctrl.treeViewModes" ng-if="view.id == $ctrl.activeMenu">
            <h4 style="margin: 3px 0px 3px 10px;">List of {{view.title}}</h4>
            <ul class="nav nav-list nav-pills nav-stacked abn-tree">
                <li ng-repeat="row in view.branchList | filter:$ctrl.treeOptions.search track by $index"
                    class="abn-tree-row">
                    <div class="arrow" ng-click="userClicksBranch(row)"
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
    <div ng-click="$ctrl.userClicksPane()" style="height: 100%"></div>
    </div>
    
</ng-pane>
`,
  bindings: {
    mmsDocument: "<",
    mmsOrg: "<",
    mmsProject: "<",
    mmsRef: "<",
    mmsGroups: "<",
    docMeta: "<"
  },
  require: {
    $pane: '^ngPane'
  },
  controller: LeftPaneController
};

veApp.component(LeftPaneComponent.selector,LeftPaneComponent);
