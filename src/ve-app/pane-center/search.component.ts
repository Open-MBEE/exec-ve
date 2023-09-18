import { StateService } from '@uirouter/angularjs';

import { ContentWindowService } from '@ve-app/pane-center/services/ContentWindow.service';
import { veCoreEvents } from '@ve-core/events';
import { RootScopeService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';

import { veApp } from '@ve-app';

import { VeComponentOptions } from '@ve-types/angular';
import { ElementObject, ParamsObject } from '@ve-types/mms';
import { VeSearchOptions } from '@ve-types/view-editor';

class SearchController {
    params: ParamsObject;

    searchContentLoading: boolean = true;
    searchOptions: VeSearchOptions;

    static $inject = ['$state', 'ContentWindowService', 'RootScopeService', 'EventService'];

    constructor(
        private $state: StateService,
        private contentWindowSvc: ContentWindowService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService
    ) {}

    $onInit(): void {
        this.searchContentLoading = false;

        this.contentWindowSvc.toggleLeftPane(true);
        this.rootScopeSvc.veHideLeft(true);

        this.searchOptions = {
            emptyDocTxt: 'This field is empty.',
            searchInput: this.params.keywords ? this.params.keywords : '',
            searchField: this.params.field ? this.params.field : 'name',
            getProperties: true,
            closeable: true,
            callback: (elementOb: ElementObject): void => {
                const data = {
                    elementId: elementOb.id,
                    projectId: elementOb._projectId,
                    refId: elementOb._refId,
                    commitId: 'latest',
                };
                this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('element.selected', data);
                if (typeof this.rootScopeSvc.rightPaneClosed() === 'boolean' && this.rootScopeSvc.rightPaneClosed())
                    this.eventSvc.$broadcast('right-pane.toggle', false);
            },
            relatedCallback: (doc, view, elem): void => {
                //siteId, documentId, viewId) {
                void this.$state.go('main.project.ref.view.present', {
                    projectId: doc._projectId,
                    documentId: doc.id,
                    viewId: view.id,
                    refId: doc._refId,
                    keywords: undefined,
                });
            },
        };
    }
}

const SearchComponent: VeComponentOptions = {
    selector: 'search',
    template: `
    <div>   
    <ng-pane pane-id="center-view" pane-closed="false" pane-anchor="center" pane-no-toggle="true" parent-ctrl="$ctrl">
        <i class="pane-center-spinner fa fa-5x fa-spinner fa-spin" ng-show="$ctrl.searchContentLoading"></i>
        <div ng-hide="$ctrl.searchContentLoading" class="container-fluid">
            <mms-search mms-options="$ctrl.searchOptions" mms-project-id="{{$ctrl.params.projectId}}" mms-ref-id="{{$ctrl.params.refId}}"></mms-search>
        </div>
    </ng-pane>
</div>
`,
    bindings: {
        params: '<',
        keywords: '<',
        field: '<',
    },
    controller: SearchController,
};

veApp.component(SearchComponent.selector, SearchComponent);
