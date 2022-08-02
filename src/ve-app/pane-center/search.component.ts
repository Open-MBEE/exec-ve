import {VeComponentOptions, VeSearchOptions} from "@ve-types/view-editor";
import {veApp} from "@ve-app";
import {OrgObject, ProjectObject} from "@ve-types/mms";
import {ContentWindowService} from "@ve-app/pane-center/services/ContentWindow.service";
import {EventService, RootScopeService} from "@ve-utils/core-services";
import { StateService } from "@uirouter/angularjs";


class SearchController {

    projectOb: ProjectObject
    orgOb: OrgObject
    search: string
    field: string

    searchContentLoading: boolean = true;
    searchOptions: VeSearchOptions

    static $inject = ['$state', 'ContentWindowService', 'RootScopeService', 'EventService']

    constructor(private $state: StateService, private contentWindowSvc: ContentWindowService, private rootScopeSvc: RootScopeService, private eventSvc: EventService) {

    }

    $onInit() {
        this.searchContentLoading = false;

        this.contentWindowSvc.toggleLeftPane(true)

        this.searchOptions = {
            emptyDocTxt: 'This field is empty.',
            searchInput: this.search,
            searchField: this.field,
            getProperties: true,
            closeable: true,
            callback: (elementOb) => {
                let data = {
                    elementOb: elementOb,
                    commitId: 'latest',
                }
                this.eventSvc.$broadcast('element.selected', data)
                if (
                    typeof this.rootScopeSvc.rightPaneClosed() ===
                    'boolean' &&
                    this.rootScopeSvc.rightPaneClosed()
                )
                    this.eventSvc.$broadcast('right-pane.toggle', false)
            },
            relatedCallback: (doc, view, elem) => {
                //siteId, documentId, viewId) {
                this.$state.go('main.project.ref.document.view', {
                    projectId: doc._projectId,
                    documentId: doc.id,
                    viewId: view.id,
                    refId: doc._refId,
                    search: undefined,
                })
            },
        }
    }

}

let SearchComponent: VeComponentOptions = {
    selector: "search",
    template: `
    <div>   
    <ng-pane pane-id="center-view" pane-closed="false" pane-anchor="center" pane-no-toggle="true" parent-ctrl="$ctrl">
        <i class="pane-center-spinner fa fa-5x fa-spinner fa-spin" ng-show="$ctrl.searchContentLoading"></i>
        <div ng-hide="$ctrl.searchContentLoading" class="container-fluid">
            <mms-search mms-options="$ctrl.searchOptions" mms-project-id="{{$ctrl.projectOb.id}}" mms-ref-id="{{$ctrl.refOb.id}}"></mms-search>
        </div>
    </ng-pane>
</div>
`,
    bindings: {
        search: "<",
        field: "<",
        projectOb: "<",
        refOb: "<",
        documentOb: "<"
    },
    controller: SearchController
}

veApp.component(SearchComponent.selector,SearchComponent)