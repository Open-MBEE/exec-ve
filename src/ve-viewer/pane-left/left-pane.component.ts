import { IPane } from '@openmbee/pane-layout';
import { IPaneManagerService } from '@openmbee/pane-layout/lib/PaneManagerService';
import { StateService, TransitionService, UIRouterGlobals } from '@uirouter/angularjs';

import { TreeService } from '@ve-components/trees';
import { BarButton, ButtonBarApi, ButtonBarService, IButtonBarButton } from '@ve-core/button-bar';
import { veCoreEvents } from '@ve-core/events';
import { ConfirmDeleteModalResolveFn } from '@ve-core/modals';
import { RootScopeService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import {
    ApiService,
    DocumentMetadata,
    ElementService,
    PermissionService,
    ProjectService,
    ViewService,
} from '@ve-utils/mms-api-client';
import { SchemaService } from '@ve-utils/model-schema';
import { veViewer } from '@ve-viewer';
import { veViewerEvents } from 've-viewer/events';

import { left_default_buttons } from './left-buttons.config';

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular';
import {
    ElementObject,
    ElementsRequest,
    ElementsResponse,
    ParamsObject,
    ProjectObject,
    RefObject,
    RefsResponse,
    ViewObject,
} from '@ve-types/mms';
import { TreeApi, TreeBranch } from '@ve-types/tree';
import { VeModalService } from '@ve-types/view-editor';

interface ILeftPaneControllerBindings {
    mmsProject: ProjectObject;
    mmsRef: RefObject;
    mmsRoot: ElementObject;
}

class LeftPaneController implements angular.IComponentController {
    //Scope
    public subs: Rx.IDisposable[];

    private $pane: IPane;

    public bbApi: ButtonBarApi;
    public bbSize: string;
    public bars: string[];
    private headerSize: string = '83px';
    protected squishSize: number = 250;
    private buttons: IButtonBarButton[];

    //Bindings
    private bindings: ILeftPaneControllerBindings;
    private mmsProject: ProjectObject;
    private mmsRef: RefObject;
    private mmsRoot: ElementObject;
    private mmsDocMeta: DocumentMetadata;

    //Tree Api
    private treeApi: TreeApi;

    //Local Variables
    toolbarId: string = 'left-toolbar';
    barId: string = 'tree-button-bar';

    treeOptionsEl: JQuery<HTMLElement>;
    treeOptionsSize: number = 0;
    treeOptionsPx: string = '1px';

    schema = 'cameo';
    filterInputPlaceholder = 'Filter';
    filterShow: boolean = false;
    filterToggleEvent = 'tree-filter';
    treeFilter = '';

    static $inject = [
        '$q',
        '$compile',
        '$element',
        '$anchorScroll',
        '$filter',
        '$location',
        '$uibModal',
        '$scope',
        '$state',
        '$transitions',
        '$uiRouterGlobals',
        '$paneManager',
        '$timeout',
        'growl',
        'ElementService',
        'ApiService',
        'SchemaService',
        'ViewService',
        'ProjectService',
        'TreeService',
        'PermissionService',
        'RootScopeService',
        'EventService',
        'ButtonBarService',
    ];

    constructor(
        private $q: VeQService,
        private $compile: angular.ICompileService,
        private $element: JQuery<HTMLElement>,
        private $anchorScroll: angular.IAnchorScrollService,
        private $filter: angular.IFilterService,
        private $location: angular.ILocationService,
        private $uibModal: VeModalService,
        private $scope: angular.IScope,
        private $state: StateService,
        private $transitions: TransitionService,
        private $uiRouterGlobals: UIRouterGlobals,
        private $paneManager: IPaneManagerService,
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private apiSvc: ApiService,
        private schemaSvc: SchemaService,
        private viewSvc: ViewService,
        private projectSvc: ProjectService,
        private treeSvc: TreeService,
        private permissionSvc: PermissionService,
        private rootScopeSvc: RootScopeService,
        public eventSvc: EventService,
        private buttonBarSvc: ButtonBarService
    ) {}

    $onInit(): void {
        //Init/Reset Tree Updated Subject
        this.eventSvc.resolve<boolean>(TreeService.events.UPDATED, false);

        this.eventSvc.$init(this);

        this.bbSize = '83px';

        //Init Pane Toggle Controls
        this.rootScopeSvc.leftPaneClosed(this.$pane.closed);

        this.subs.push(
            this.$paneManager.$onToggled.subscribe((e) => {
                if (e.pane === this.$pane.id) {
                    this.rootScopeSvc.leftPaneClosed(e.closed);
                }
            })
        );

        this.subs.push(
            this.eventSvc.binding(this.rootScopeSvc.constants.LEFTPANECLOSED, (paneClosed) => {
                if (paneClosed !== this.$pane.closed) {
                    this.$pane.toggle();
                }
            })
        );

        // Start listening to change events
        this.subs.push(
            this.eventSvc.$on<veCoreEvents.elementSelectedData>('view.selected', this.changeData),
            this.eventSvc.$on<veViewerEvents.viewDeletedData<ViewObject>>('view.deleted', (data) => {
                let goto = '^.currentState';
                let documentId = this.treeApi.rootId;
                let viewId: string;
                if (this.$state.includes('**.portal.**')) {
                    if (data.parentBranch) {
                        documentId = data.parentBranch.data.id;
                    } else {
                        goto = 'main.project.ref.portal';
                        documentId = null;
                    }
                } else if (this.$state.includes('**.present.**')) {
                    if (data.prevBranch) {
                        viewId = data.prevBranch.viewId ? data.prevBranch.viewId : data.prevBranch.data.id;
                    } else if (data.parentBranch) {
                        viewId = data.parentBranch.viewId ? data.parentBranch.viewId : data.parentBranch.data.id;
                    }
                }
                void this.$state.go(goto, {
                    documentId,
                    viewId,
                    search: undefined,
                });
            }),
            this.eventSvc.$on<ElementObject>('view.reordered', (viewOrSection) => {
                this.treeSvc.getBranch<ViewObject>(viewOrSection).then(
                    (b) => {
                        const old = b.children;
                        const newChildren: TreeBranch<ViewObject>[] = [];
                        let viewBranch = b;
                        for (const c of old) {
                            if (c.type === 'view') {
                                newChildren.push(c);
                            }
                        }
                        if (b.type === 'section') {
                            viewBranch = this.treeSvc.viewId2node[b.viewId];
                            if (!viewBranch) {
                                viewBranch = b;
                            }
                        }
                        b.children = newChildren;
                        void this.treeSvc.addSectionElements(viewOrSection, viewBranch, b, false);
                    },
                    () => {
                        //Do Nothing
                    }
                );
            })
        );

        this.buttonBarSvc.registerButtons(left_default_buttons);
        this.bbInit();

        this.eventSvc.resolve<boolean>(this.filterToggleEvent, this.filterShow);

        this.subs.push(
            this.eventSvc.$on<veCoreEvents.buttonClicked>(this.barId, (data) => {
                switch (data.clicked) {
                    case 'tree-reorder-view': {
                        void this.$state.go('main.project.ref.view.reorder', {
                            search: undefined,
                        });
                        break;
                    }
                    case 'tree-reorder-group': {
                        void this.$state.go('main.project.ref.groupReorder');
                        break;
                    }
                    case 'tree-full-document': {
                        this.fullDocMode(data.button);
                        break;
                    }
                    case 'tree-refresh': {
                        this.reloadData(data.button);
                        break;
                    }
                    case 'tree-delete': {
                        this.deleteItem();
                        break;
                    }
                    case 'tree-show-pe': {
                        break;
                    }
                    case 'tree-filter': {
                        this.filterShow = !this.filterShow;
                        this.eventSvc.resolve<boolean>(this.filterToggleEvent, this.filterShow);
                    }
                }
            })
        );
    }

    $postLink(): void {
        this.treeOptionsEl = $('#tree-options');
    }

    $doCheck(): void {
        if (this.treeOptionsEl && this.treeOptionsSize != this.treeOptionsEl.height()) {
            this.treeOptionsSize = this.treeOptionsEl.height();
            this.treeOptionsPx = this.treeOptionsSize.toFixed(0) + 'px';
        }
    }

    $onDestroy(): void {
        this.eventSvc.$destroy(this.subs);
    }

    bbInit = (): void => {
        this.buttons = [];

        this.buttons.push(this.buttonBarSvc.getButtonDefinition('tree-expand'));
        this.buttons.push(this.buttonBarSvc.getButtonDefinition('tree-collapse'));
        /*api.addButton(this.buttonBarSvc.getButtonBarButton('tree-add'))
        api.setPermission('tree-add', this.treeSvc.treeApi.refType !== 'Tag' && this.treeSvc.treeEditable)
        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-delete'))
        api.setPermission('tree-delete', this.treeSvc.treeApi.refType !== 'Tag' && this.treeSvc.treeEditable)
        api.setPermission(
            'tree-add.group',
            this.permissionSvc.hasProjectEditPermission(this.treeSvc.treeApi.projectId)
        )
        api.setPermission('tree-add.document', this.treeSvc.treeApi.refType !== 'Tag' && this.treeSvc.treeEditable)

        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-reorder-group'))
        api.setPermission(
            'tree-reorder-group',
            this.permissionSvc.hasProjectEditPermission(this.treeSvc.treeApi.projectId)
        )
        api.setPermission('tree-add.view', this.treeSvc.treeApi.refType !== 'Tag' && this.treeSvc.treeEditable)

        api.addButton(this.buttonBarSvc.getButtonBarButton('tree-reorder-view'))*/
        const fullTree = this.buttonBarSvc.getButtonDefinition('tree-full-document');
        fullTree.toggleEvent = this.rootScopeSvc.constants.VEFULLDOCMODE;
        this.buttons.push(fullTree);
        this.buttons.push(this.buttonBarSvc.getButtonDefinition('tree-show-pe'));
        this.buttons.push(this.buttonBarSvc.getButtonDefinition('tree-refresh'));
        const filterTree = this.buttonBarSvc.getButtonDefinition('tree-filter');
        filterTree.toggleEvent = this.filterToggleEvent;
        this.buttons.push(filterTree);
        // api.checkActive((state: string) => {
        //     return this.$state.includes(state);
        // });
    };

    bbCallback(state: string): boolean {
        return this.$state.includes(state);
    }

    changeData = (data: veCoreEvents.elementSelectedData): void => {
        //If the transitioning state detects a refresh, it will let us know to regenerate the tree
        if (data.refresh) this.treeSvc.processedRoot = '';
        const rootId = !data.rootId && data.elementId.endsWith('_cover') ? data.projectId + '_pm' : data.rootId;
        const elementId = data.elementId;
        const refId = data.refId;
        const projectId = data.projectId;
        const commitId = data.commitId ? data.commitId : null;
        if ((rootId && this.treeSvc.processedRoot !== rootId && rootId != '') || !this.treeApi) {
            new this.$q<string, RefsResponse>((resolve, reject) => {
                if (this.$state.includes('**.admin.**')) {
                    resolve(null);
                } else if (
                    !this.treeApi ||
                    !this.treeApi.refType ||
                    refId != this.treeApi.refId ||
                    projectId != this.treeApi.projectId
                ) {
                    this.projectSvc.getRef(refId, projectId).then((ref) => {
                        resolve(ref.type);
                    }, reject);
                } else {
                    resolve(this.treeApi.refType);
                }
            }).then(
                (refType) => {
                    this.treeApi = {
                        rootId,
                        elementId,
                        projectId,
                        refType,
                        refId,
                        commitId,
                    };

                    this.treeApi.onSelect = this.treeClickCallback;
                    this.treeApi.onDblClick = this.treeDblClickCallback;

                    this.treeSvc.treeApi = this.treeApi;
                    this.treeSvc.treeEditable = this.$state.includes('**.admin.**')
                        ? false
                        : this.permissionSvc.hasBranchEditPermission(this.mmsProject.id, this.mmsRef.id);

                    this.treeApi.sectionNumbering = this.$state.includes('**.present.**');
                    this.treeApi.expandLevel = this.$state.includes('**.present.**')
                        ? 3
                        : this.$state.includes('**.portal.**') || this.$state.includes('**.admin.**')
                        ? 0
                        : 1;
                    this.treeApi.sort = !this.$state.includes('**.present.**');

                    new this.$q<ElementObject, ElementsResponse<ElementObject>>((resolve, reject) => {
                        if (this.$state.includes('**.present.**')) {
                            if (this.mmsDocMeta) {
                                this.treeApi.numberingDepth = this.mmsDocMeta.numberingDepth;
                                this.treeApi.numberingSeparator = this.mmsDocMeta.numberingSeparator;
                                this.treeApi.startChapter = 1;
                            } else {
                                this.treeApi.numberingDepth = 0;
                                this.treeApi.numberingSeparator = '.';
                                this.treeApi.startChapter = 1;
                            }
                            const reqOb: ElementsRequest<string> = {
                                elementId: this.treeApi.rootId,
                                refId: this.treeApi.refId,
                                projectId: this.treeApi.projectId,
                            };
                            this.elementSvc.getElement<ViewObject>(reqOb).then(resolve, reject);
                        } else {
                            resolve(null);
                        }
                    }).then(
                        (root) => {
                            this.treeApi.elementId = elementId;
                            this.treeSvc.changeRoots(root).catch((reason) => {
                                this.growl.error(TreeService.treeError(reason));
                            });
                        },
                        (reason) => {
                            this.growl.error(reason.message);
                        }
                    );
                },
                (reason) => {
                    this.growl.error(reason.message);
                }
            );
        } else {
            this.treeApi.elementId = elementId;
            this.treeSvc.changeElement().catch((reason) => {
                this.growl.error(TreeService.treeError(reason));
            });
        }
    };

    treeClickCallback = (branch: TreeBranch<ElementObject>): void => {
        if (this.$state.includes('**.portal.**')) {
            if (branch.type === 'group') {
                void this.$state.go('main.project.ref.portal.preview', {
                    preview: 'site_' + branch.data.id + '_cover',
                    search: undefined,
                });
            } else if (branch.type === 'view' || branch.type === 'snapshot') {
                void this.$state.go('main.project.ref.portal.preview', {
                    preview: branch.data.id,
                    search: undefined,
                });
            }
        } else if (this.$state.includes('**.present.**')) {
            let viewId = '';

            // If clicked on a PE send the element.selected event for Tool Pane
            if (!(branch.type === 'view' || branch.type === 'section')) {
                viewId = branch.viewId;
                const data: veCoreEvents.elementSelectedData = {
                    elementId: branch.data.id,
                    projectId: branch.data._projectId,
                    refId: branch.data._refId,
                    commitId: 'latest',
                };
                this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('element.selected', data);
            } else {
                viewId = branch.data.id;
            }

            void this.$state.go(
                'main.project.ref.view.present.' + (this.$uiRouterGlobals.params as ParamsObject).display,
                {
                    viewId,
                    search: undefined,
                }
            );
        }
    };

    treeDblClickCallback = (branch: TreeBranch): void => {
        if (this.$state.includes('**.portal.**')) {
            if (branch.type === 'view' || branch.type === 'snapshot') {
                void this.$state.go(
                    'main.project.ref.view.present.' + (this.$uiRouterGlobals.params as ParamsObject).display,
                    {
                        documentId: branch.data.id,
                        search: undefined,
                    }
                );
            }
        } else if (this.$state.includes('**.present.**')) {
            this.treeSvc.expandBranch(branch).catch((reason) => {
                this.growl.error(TreeService.treeError(reason));
            });
        }
    };

    filterInputChangeHandler = (): void => {
        this.eventSvc.$broadcast<string>(TreeService.events.FILTER, this.treeFilter);
    };

    public fullDocMode = (button: BarButton): void => {
        let display = '';
        button.handleToggle(this.rootScopeSvc.veFullDocMode(!this.rootScopeSvc.veFullDocMode()));
        if (this.rootScopeSvc.veFullDocMode()) {
            display = 'document';
        } else {
            display = 'slideshow';
        }
        void this.$state.go('main.project.ref.view.present.' + display, {
            search: undefined,
            display,
        });
    };

    reloadData = (button: BarButton): void => {
        this.treeSvc.processedRoot = '';
        const data: veCoreEvents.elementSelectedData = {
            rootId: this.treeApi.rootId,
            elementId: this.treeApi.elementId,
            projectId: this.treeApi.projectId,
            refId: this.treeApi.refId,
            refType: this.treeApi.refType,
            commitId: 'latest',
        };
        this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('view.selected', data);
        const finished = this.eventSvc.$on('tree.ready', () => {
            button.handleSpin(false);
            finished.dispose();
        });
    };

    deleteItem = (): void => {
        const branch = this.treeSvc.getSelectedBranch();
        if (!branch) {
            this.growl.warning('Select item to remove.');
            return;
        }
        this.treeSvc.getPrevBranch(branch).then(
            (prevBranch) => {
                const type = this.viewSvc.getElementType(branch.data as ElementObject);
                if (this.$state.includes('**.present.**')) {
                    if (type == 'Document') {
                        this.growl.warning(
                            'Cannot remove a document from this view. To remove this item, go to project home.'
                        );
                        return;
                    }
                    if (branch.type !== 'view' || !this.apiSvc.isView(branch.data as ElementObject)) {
                        this.growl.warning(
                            'Cannot remove non-view item. To remove this item, open it in the center pane.'
                        );
                        return;
                    }
                } else {
                    if (
                        branch.type !== 'view' &&
                        !this.apiSvc.isDocument(branch.data as ElementObject) &&
                        (branch.type !== 'group' || branch.children.length > 0)
                    ) {
                        this.growl.warning('Cannot remove group with contents. Empty contents and try again.');
                        return;
                    }
                }
                const instance = this.$uibModal.open<ConfirmDeleteModalResolveFn, void>({
                    component: 'confirmDeleteModal',
                    resolve: {
                        getType: () => {
                            let type = branch.type;
                            if (this.apiSvc.isDocument(branch.data as ElementObject)) {
                                type = 'Document';
                            }
                            return type;
                        },
                        getName: () => {
                            return branch.data.name;
                        },
                        finalize: () => {
                            return (): VePromise<void, RefsResponse> => {
                                return new this.$q<void, RefsResponse>((resolve, reject) => {
                                    if (branch.type === 'view') {
                                        this.treeSvc
                                            .getParent(branch)
                                            .then((parentBranch: TreeBranch<ElementObject>) => {
                                                if (!this.$state.includes('**.present.**')) {
                                                    this.viewSvc
                                                        .downgradeDocument(branch.data as ElementObject)
                                                        .then(resolve, reject);
                                                } else {
                                                    this.viewSvc
                                                        .removeViewFromParentView({
                                                            projectId: parentBranch.data._projectId,
                                                            refId: parentBranch.data._refId,
                                                            parentViewId: parentBranch.data.id,
                                                            viewId: branch.data.id,
                                                        })
                                                        .then(resolve, reject);
                                                }
                                            }, reject);
                                    } else if (branch.type === 'group') {
                                        this.viewSvc.removeGroup(branch.data as ElementObject).then(resolve, reject);
                                    } else {
                                        resolve();
                                    }
                                });
                            };
                        },
                    },
                });
                instance.result.then(
                    () => {
                        this.treeSvc.removeBranch(branch).then(
                            () => {
                                this.treeSvc.getParent(branch).then(
                                    (parentBranch) => {
                                        const data = {
                                            parentBranch,
                                            prevBranch,
                                            branch,
                                        };
                                        this.eventSvc.$broadcast<veViewerEvents.viewDeletedData>('view.deleted', data);
                                        if (this.$state.includes('**.present.**') && branch.type === 'view') {
                                            this.treeSvc.processDeletedViewBranch(branch);
                                        }
                                        let selectBranch: TreeBranch = null;
                                        if (prevBranch) {
                                            selectBranch = prevBranch;
                                        } else if (parentBranch) {
                                            selectBranch = parentBranch;
                                        }
                                        this.treeSvc.selectBranch(selectBranch).then(
                                            () => {
                                                this.eventSvc.$broadcast(TreeService.events.RELOAD);
                                            },
                                            (reason) => {
                                                this.growl.error(TreeService.treeError(reason));
                                            }
                                        );
                                    },
                                    (reason) => {
                                        this.growl.error(TreeService.treeError(reason));
                                    }
                                );
                            },

                            (reason) => {
                                this.growl.error(TreeService.treeError(reason));
                            }
                        );
                    },
                    (reason) => {
                        this.growl.error(reason.message);
                    }
                );
            },
            (reason) => {
                this.growl.error(reason.message);
            }
        );
    };
}

/* Controllers */
const LeftPaneComponent: VeComponentOptions = {
    selector: 'leftPane',
    transclude: true,
    template: `
    <div class="pane-left">
    <ng-pane pane-id="left-top" 
            pane-anchor="north" 
            pane-size="{{ $ctrl.treeOptionsPx }}" 
            pane-no-toggle="true" 
            pane-no-scroll="true" 
            pane-closed="false" 
            parent-ctrl="$ctrl">
        <div class="tree-options" id="tree-options">
            <div class="tree-option-buttons" role="toolbar">
                <button-bar bar-id="{{$ctrl.barId}}" menu="true">
                    <bar-button ng-repeat="button in $ctrl.buttons"
                        activation-cb="$ctrl.$state.includes(state)"
                        button-id="{{button.buttonId}}"
                        icon="{{button.icon}}"
                        placement="{{button.placement}}"
                        selectable="button.selectable"
                        spinnable="button.spinnable"
                        tooltip="{{button.tooltip}}"
                        toggleable="button.toggleable"
                        toggled-tooltip="{{button.toggledTooltip}}"
                        caret="button.caret"
                        dropdown-ids="button.dropdownIds"
                        api="{{button.api ? buton.api : ''}}"
                        action="button.action"
                        class-name="{{button.className ? button.className : ''}}"
                        label="button.label"
                        enabled-for="button.enabledFor"
                        disabled-for="button.disabledFor"
                    ></bar-button>
                </button-bar>
            </div>
            <div class="tree-filter" uib-collapse="!$ctrl.filterShow">
                <input class="ve-plain-input" ng-model-options="{debounce: 1000}" 
                    ng-model="$ctrl.treeFilter" type="text" placeholder="{{$ctrl.filterInputPlaceholder}}"
                    ng-change="$ctrl.filterInputChangeHandler();" style="flex:2">
                </input>
            </div>
        </div>
    </ng-pane>
    <ng-pane pane-anchor="center" pane-no-toggle="true" pane-closed="false" parent-ctrl="$ctrl" >
        <mms-trees toolbar-id="{{$ctrl.toolbarId}}" button-id="{{$ctrl.buttonId}}"></mms-trees>
    </ng-pane>
</div>
  
  
`,
    bindings: {
        mmsProject: '<',
        mmsRef: '<',
        mmsRoot: '<',
        mmsDocMeta: '<',
    },
    require: {
        $pane: '^ngPane',
    },
    controller: LeftPaneController,
};

veViewer.component(LeftPaneComponent.selector, LeftPaneComponent);
