import { StateService } from '@uirouter/angularjs';
import { IComponentController } from 'angular';
import Rx from 'rx-lite';

import { right_default_toolbar, right_dynamic_toolbar } from '@ve-app/pane-right/right-buttons.config';
import { ExtensionService } from '@ve-components/services';
import { IToolBarButton, ToolbarApi, ToolbarService } from '@ve-core/toolbar';
import { RootScopeService } from '@ve-utils/application';
import { EditService, EventService } from '@ve-utils/core';
import { PermissionsService } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

import { VeComponentOptions } from '@ve-types/angular';
import { ElementObject, RefObject } from '@ve-types/mms';

class RightToolbarController implements IComponentController {
    static $inject = [
        'growl',
        '$state',
        'ExtensionService',
        'PermissionsService',
        'EditService',
        'EventService',
        'ToolbarService',
        'RootScopeService',
    ];

    //Injected Deps
    public subs: Rx.IDisposable[];

    //Bindings
    private mmsRef: RefObject;

    // Though we don't explicitly use it right now, we do need it to trigger updates when
    // entering/exiting certain states
    private mmsRoot: ElementObject;

    //Local
    public toolbarId: string;

    constructor(
        public growl: angular.growl.IGrowlService,
        public $state: StateService,
        public extensionSvc: ExtensionService,
        private permissionsSvc: PermissionsService,
        private autosaveSvc: EditService,
        private eventSvc: EventService,
        private toolbarSvc: ToolbarService,
        private rootScopeSvc: RootScopeService
    ) {
        this.toolbarId = 'right-toolbar';
    }

    $onInit(): void {
        this.eventSvc.$init(this);

        this.toolbarSvc.initApi(
            this.toolbarId,
            this.tbInit,
            this,
            right_default_toolbar,
            right_dynamic_toolbar,
            'spec-inspector'
        );
    }

    $onDestroy(): void {
        this.eventSvc.$destroy(this.subs);
        this.toolbarSvc.destroyApi(this.toolbarId);
    }

    tbInit = (tbApi: ToolbarApi): void => {
        for (const tool of this.extensionSvc.getExtensions('spec')) {
            const button = this.toolbarSvc.getToolbarButton(tool);
            tbApi.addButton(button);
            if (button.enabledFor) {
                button.active = false;
                for (const enableState of button.enabledFor) {
                    if (this.$state.includes(enableState)) {
                        button.active = true;
                        break;
                    }
                }
            }
            if (button.disabledFor) {
                for (const disableState of button.disabledFor) {
                    if (this.$state.includes(disableState)) {
                        button.active = false;
                        break;
                    }
                }
            }
            if (!button.permission) {
                button.permission =
                    this.mmsRef &&
                    this.mmsRef.type === 'Branch' &&
                    this.permissionsSvc.hasBranchEditPermission(this.mmsRef._projectId, this.mmsRef.id);
            }
        }
    };

    public paneToggle = (button: IToolBarButton): void => {
        let toggleDeactivateFlag = false;
        if (this.rootScopeSvc.rightPaneClosed() && this.rootScopeSvc.rightPaneToggleable()) {
            if (button.selected || this.rootScopeSvc.rightPaneClosed()) {
                if (button.selected && !this.rootScopeSvc.rightPaneClosed()) toggleDeactivateFlag = true;
                this.eventSvc.$broadcast('right-pane.toggle');
            }
        }
        if (toggleDeactivateFlag) {
            this.toolbarSvc.waitForApi(this.toolbarId).then(
                (api) => api.deactivate(button.id),
                (reason) => this.growl.error(ToolbarService.error(reason))
            );
        }
    };
}

/* Classes */
const RightToolbarComponent: VeComponentOptions = {
    selector: 'rightToolbar', //toolbar-component
    template: `<tool-bar toolbar-id="{{$ctrl.toolbarId}}" pane-toggle="$ctrl.paneToggle"/>`,
    bindings: {
        mmsRef: '<',
        mmsRoot: '<',
    },
    controller: RightToolbarController,
};
/* Controllers */

veApp.component(RightToolbarComponent.selector, RightToolbarComponent);
