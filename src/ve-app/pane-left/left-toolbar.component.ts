import { StateService } from '@uirouter/angularjs';
import { IComponentController } from 'angular';
import Rx from 'rx-lite';

import { ExtensionService } from '@ve-components/services';
import { IToolBarButton, ToolbarApi, ToolbarService } from '@ve-core/toolbar';
import { RootScopeService } from '@ve-utils/application';
import { EditService, EventService } from '@ve-utils/core';
import { PermissionsService } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

import { left_default_toolbar, left_dynamic_toolbar } from './left-buttons.config';

import { VeComponentOptions } from '@ve-types/angular';
import { ElementObject, RefObject } from '@ve-types/mms';

/* Classes */
const LeftToolbarComponent: VeComponentOptions = {
    selector: 'leftToolbar', //toolbar-component
    template: `<tool-bar toolbar-id="{{$ctrl.toolbarId}}" anchor="'left'" pane-toggle="$ctrl.paneToggle"/>`,
    bindings: {
        mmsRef: '<',
        mmsRoot: '<',
    },
    controller: class ToolbarController implements IComponentController {
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
            this.toolbarId = 'left-toolbar';
        }

        $onInit(): void {
            this.eventSvc.$init(this);
            let initialState: string;
            if (this.mmsRoot) {
                initialState = this.$state.includes('**.portal.**') ? 'tree-of-documents' : 'tree-of-contents';
            }
            this.toolbarSvc.initApi(
                this.toolbarId,
                this.tbInit,
                this,
                left_default_toolbar,
                left_dynamic_toolbar,
                initialState
            );
        }

        $onDestroy(): void {
            this.eventSvc.$destroy(this.subs);
            this.toolbarSvc.destroyApi(this.toolbarId);
        }

        tbInit = (tbApi: ToolbarApi): void => {
            if (this.mmsRoot) {
                const trees = this.extensionSvc.getExtensions('treeOf');
                for (const tree of trees) {
                    const button = this.toolbarSvc.getToolbarButton(tree);
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
                }
            }
        };

        paneToggle = (button: IToolBarButton): void => {
            let toggleDeactivateFlag = false;
            if (this.rootScopeSvc.leftPaneClosed()) {
                if (button.selected || this.rootScopeSvc.leftPaneClosed()) {
                    if (button.selected && !this.rootScopeSvc.leftPaneClosed()) toggleDeactivateFlag = true;
                    this.eventSvc.$broadcast('left-pane.toggle');
                }
            }
            if (toggleDeactivateFlag) {
                this.toolbarSvc.waitForApi(this.toolbarId).then(
                    (api) => api.deactivate(button.id),
                    (reason) => this.growl.error(ToolbarService.error(reason))
                );
            }
        };
    },
};
/* Controllers */

veApp.component(LeftToolbarComponent.selector, LeftToolbarComponent);
