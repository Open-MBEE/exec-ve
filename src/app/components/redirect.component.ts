import * as angular from 'angular';
import { StateService } from '@uirouter/angularjs';
import { ProjectService } from 'src/mms/services/ProjectService.service';
import {ElementService} from "../../mms/services/ElementService.service";
import { RootScopeService } from 'src/mms/services/RootScopeService.service';
import {EventService} from "../../mms/services/EventService.service";
var mmsApp = angular.module('mmsApp');


/* Controllers */
    // /workspaces/master/sites/{siteid}                    {siteid}_cover      /projects/{projectid}/master/document/{siteid}_cover
    // /workspaces/master/sites/{siteid}/document/{docid}   {docid}             /projects/{projectid}/master/document/{docid}
    // /workspaces/master/sites/{siteid}/documents/{docid}  {docid}             /projects/{projectid}/master/documents/{docid}
    // /workspaces/master/sites/{siteid}/documents/{docid}/views/{viewid} 
    // (view id might be the same as doc id)	            {docid},{viewid}	/projects/{projectid of doc}/master/documents/{docid}/views/{viewid}
    // if {viewid} not found, go to doc
    // if {docid} not found but view is found, it might be under a different doc 
    // (see _relatedDocuments of element in search result)
    // /workspaces/master/sites/{siteid}/documents/{docid}/full	{docid}	/projects/{projectid}/master/documents/{docid}/full

let RedirectComponent: angular.ve.ComponentOptions = {
    selector: 'veRedirect',
    template: `
    <div id="ve-origin-select" class="row">
    <div class="account-wall-lg" ng-if="redirect_from_old">
            <div ng-if="!$ctrl.redirect_element && !$ctrl.redirect_noResults && !$ctrl.redirect_relatedDocs.length">
                <h2>This link is not valid</h2>
                <h4><i class="fa fa-spinner fa-spin" aria-hidden="true"></i> We are searching for your content</h4>
            </div>
            <!-- Content moved and results found -->
            <div ng-if="!$ctrl.redirect_noResults && $ctrl.redirect_element.link">
                <h2>This content has moved</h2>
                <h4>You will be redirected to the new location at 
                    <a style="text-decoration:underline;" ng-if="$ctrl.redirect_element.link" ui-sref="{{ $ctrl.redirect_element.link }}">
                    <!-- <i ng-class="{'fa fa-folder': redirect_element.type === 'group', 'fa fa-file': $last && redirect_element.type === 'doc'}"></i> -->
                    {{ $ctrl.redirect_element.name }}</a> in 10 seconds.
                </h4>
                <!-- <button class="btn btn-primary"><i class="fa fa-bookmark" aria-hidden="true" style="padding-right:10px;"></i>Bookmark New Link</button> -->
                <button style="margin-top:60px;" class="btn btn-primary" ng-click="$ctrl.resetSelectPage()">View Editor Home</button>
            </div>
            <!-- no content found -->
            <div ng-if="$ctrl.redirect_noResults">
                <h2>This link is not valid</h2>
                <h4>Related content not found for this link. If you believe your content was not moved or deleted, please navigate to it in View Editor and rebookmark.</h4>
                <button style="margin-top:60px;" class="btn btn-primary" ng-click="$ctrl.resetSelectPage()">View Editor Home</button>
            </div>
            <!-- views found in docs - allow user to select -->
            <div ng-if="$ctrl.redirect_relatedDocs.length">
                <h2>This link is not valid</h2>
                <h4>Here are documents related to the content you are looking for:</h4>
                <div ng-repeat="$ctrl.relatedDocument in $ctrl.redirect_relatedDocs" class="elem-documentation">
                    <a style="text-decoration:underline;" ng-repeat="relatedView in $ctrl.relatedDocument._parentViews" ui-sref="main.project.ref.document.view({documentId: $ctrl.relatedDocument.id, viewId: relatedView.id, projectId: $ctrl.relatedDocument._projectId, refId: $ctrl.relatedDocument._refId, search: undefined})" ng-click="userRelatedClick($event, $ctrl.relatedDocument, relatedView, $ctrl.elem)">
                        <i class="fa fa-file" aria-hidden="true"></i>
                        <mms-view-link mms-project-id="{{$ctrl.elem._projectId}}" mms-ref-id="{{$ctrl.elem._refId}}" mms-doc-id="{{$ctrl.relatedDocument.id}}" mms-element-id="{{$ctrl.relatedDocument.id}}"></mms-view-link> > <mms-view-link mms-project-id="{{$ctrl.elem._projectId}}" mms-ref-id="{{$ctrl.elem._refId}}" mms-doc-id="{{$ctrl.relatedDocument.id}}" mms-element-id="{{$ctrl.relatedView.id}}"></mms-view-link><br/>
                    </a>
                </div>
                <button style="margin-top:60px;" class="btn btn-primary" ng-click="$ctrl.resetSelectPage()">View Editor Home</button>
                <!-- <h4 style="margin-top:60px;"><a style="text-decoration:underline;" ng-click="resetSelectPage()">View Editor home</a></h4> -->
            </div>
    </div>
</div>
`,
    controller: class RedirectController implements angular.IComponentController {

        private subs

        public redirect_from_old: object;
        redirect_noResults: boolean = false;
        redirect_element: object = null;
        spin: boolean = false;
        elem: any;
        redirect_relatedDocs: any;
        projectList = [];
        reqOb = {};

        static $inject = ['$state', '$location', '$timeout', 'growl',
            'ProjectService', 'ElementService', 'RootScopeService', 'EventService']

        constructor(private $state: StateService, private $location: angular.ILocationService, 
                    private $timeout: angular.ITimeoutService, private growl: angular.growl.IGrowlService,
                    private projectSvc: ProjectService, private elementSvc: ElementService, 
                    private rootScopeSvc: RootScopeService, private eventSvc: EventService) {
        }
        
        $onInit() {
            this.eventSvc.$init(this);

            this.rootScopeSvc.veTitle('Redirecting... | View Editor'); //what to name this?

            this.redirect_from_old = this.rootScopeSvc.veRedirectFromOld();
            this.subs.push(this.eventSvc.$on(this.rootScopeSvc.constants.VEREDIRECTFROMOLD, (data) => {
                this.redirect_from_old = data;
            }));


            this.projectSvc.getProjects().then((projectObs) => {
                this.projectList = projectObs.map((a) => {return a.id;});
                this.reqOb = {projectId: this.projectList[0], refId: 'master'};
                this.oldUrlTest(this.rootScopeSvc.veCrushUrl());
            });

        }

        public resetSelectPage() {
            this.$state.go('main.login.select');
        };

        public buildQuery(idList, projectList) {
            var queryOb = { 'query': { 'bool':{ "filter": [] } } };
            //Fitler master ref
            queryOb.query.bool.filter.push({ 'terms' : { 'id' : idList } });
            //Fitler project id
            queryOb.query.bool.filter.push({ 'terms' : { '_projectId' : projectList } });
            //Fitler master ref
            queryOb.query.bool.filter.push({ 'term' : { '_inRefIds' : 'master' } });
            return queryOb;
        };

        public errorHandler(reason) {
            this.growl.error(reason.message);
            this.$state.go('main.login.select');
        };

        public oldUrlTest(location) {
            var segments = location.split('/');
            let successRedirectFnc = this.errorHandler;
            let searchTermList = []
            const noResultFnc = () => {
                // TODO - Search for document was unsucessful. Please select from the following or contact admin to verify that document exists.
                this.redirect_noResults = true;
            };

            if (segments.length === 5) {
                if (location.includes('sites')) { //Search for site
                    searchTermList.push(segments[4]+'_cover');
                    successRedirectFnc = (data) => {
                        if ( data.length > 0 ) {
                            this.redirect_element = {name: data[0].name,
                                type: 'group',
                                link: "main.project.ref.preview({projectId:'" +data[0]._projectId+ "',refId:'master',documentId:'" +data[0].id+ "'})"
                            };
                            const redirectFnc = () => {
                                this.$state.go('main.project.ref.preview', {projectId: data[0]._projectId, refId: 'master', documentId: data[0].id});
                            };
                            this.$timeout(redirectFnc, 10000);
                        } else {
                            noResultFnc();
                        }
                    };
                }
            } else if (segments.length === 7) { //Search for document
                if (location.includes('documents')) {
                    // ["", "workspaces", "master", "sites", "site__18_0_6_eda034b_1489006578377_52061_121780", "document", "_18_0_6_bec02f9_1489697812908_180368_252005"]
                    searchTermList.push(segments[6]);
                    successRedirectFnc = (data) => {
                        if ( data.length > 0 ) {
                            this.redirect_element = {name: data[0].name,
                                type: 'doc',
                                link: "main.project.ref.document({projectId:'" +data[0]._projectId+ "',refId:'master',documentId:'" +data[0].id+ "'})"
                            };
                            const redirectFnc = () => {
                                this.$state.go('main.project.ref.document', {projectId: data[0]._projectId, refId: 'master', documentId: data[0].id});
                            };
                            this.$timeout(redirectFnc, 10000);
                        } else {
                            noResultFnc();
                        }
                    };
                } else if (location.includes('document')) {
                    searchTermList.push(segments[6]);
                    successRedirectFnc = (data) => {
                        if ( data.length > 0 ) {
                            this.redirect_element = {name: data[0].name,
                                type: 'doc',
                                link: "main.project.ref.preview({projectId:'" +data[0]._projectId+ "',refId:'master',documentId:'" +data[0].id+ "'})"
                            };
                            const redirectFnc = () => {
                                this.$state.go('main.project.ref.preview', {projectId: data[0]._projectId, refId: 'master', documentId: data[0].id});
                            };
                            this.$timeout(redirectFnc, 10000);
                        } else {
                            noResultFnc();
                        }
                    };
                }
            } else if (segments.length === 9) { //Search for view
                if (location.includes('views')) {
                    // ["", "workspaces", "master", "sites", "site__18_0_6_eda034b_1489006578377_52061_121780", "documents", "_18_0_6_bec02f9_1489697812908_180368_252005", "views", "MMS_1474405796233_0887698d-1fc7-47ac-87ac-b0f6e7b69d35"]
                    if (segments[6] == segments[8]) {
                        searchTermList.push(segments[6]);
                        successRedirectFnc = (data) => {
                            if ( data.length > 0 ) {
                                this.redirect_element = {name: data[0].name,
                                    type: 'doc',
                                    link: "main.project.ref.document.view({projectId:'" +data[0]._projectId+ "',refId:'master',documentId:'" +data[0].id+ "',viewId:'" +data[0].id+ "'})"
                                };
                                const redirectFnc = () => {
                                    this.$state.go('main.project.ref.document.view', {projectId: data[0]._projectId, refId: 'master', documentId: data[0].id, viewId: data[0].id});
                                };
                                this.$timeout(redirectFnc, 10000);
                            } else {
                                noResultFnc();
                            }
                        };
                    } else {
                        searchTermList.push(segments[6]);
                        searchTermList.push(segments[8]);
                        successRedirectFnc = (data) => {
                            let redirectFnc;
                            if (data.length > 1) {
                                if ( data[0].id === segments[6] && data[1].id === segments[8] ) {
                                    //should check case if data[1] is segent[6] also
                                    this.redirect_element = {name: data[0].name,
                                        type: 'doc',
                                        link: "main.project.ref.document.view({projectId:'" +data[0]._projectId+ "',refId:'master',documentId:'" +data[0].id+ "',viewId:'" +data[1].id+ "'})"
                                    };
                                    redirectFnc = () => {
                                        this.$state.go('main.project.ref.document.view', {projectId: data[0]._projectId, refId: 'master', documentId: data[0].id, viewId: data[1].id});
                                    };
                                } else if ( data[0].id === segments[8] && data[1].id === segments[6] ) {
                                    //should check case if data[1] is segent[6] also
                                    this.redirect_element = {name: data[0].name,
                                        type: 'doc',
                                        link: "main.project.ref.document.view({projectId:'" +data[0]._projectId+ "',refId:'master',documentId:'" +data[1].id+ "',viewId:'" +data[0].id+ "'})"
                                    };
                                    redirectFnc = () => {
                                        this.$state.go('main.project.ref.document.view', {projectId: data[0]._projectId, refId: 'master', documentId: data[1].id, viewId: data[0].id});
                                    };
                                }
                                this.$timeout(redirectFnc, 10000);
                            } else if (data.length > 0) {
                                if ( data[0].id === segments[8] ) {
                                    this.elem = data[0];
                                    this.redirect_relatedDocs = data[0]._relatedDocuments;
                                } else if ( data[0].id === segments[6] ) {
                                    this.redirect_element = {name: data[0].name,
                                        type: 'doc',
                                        link: "main.project.ref.document({projectId:'" +data[0]._projectId+ "',refId:'master',documentId:'" +data[0].id+ "'})"
                                    };
                                    redirectFnc = () => {
                                        this.$state.go('main.project.ref.document', {projectId: data[0]._projectId, refId: 'master', documentId: data[0].id});
                                    };
                                    this.$timeout(redirectFnc, 10000);
                                }
                            } else {
                                noResultFnc();
                            }
                        };
                    }
                }
            } else if (segments.length === 8) { //Search for full doc
                if (location.includes('full')) {
                    searchTermList.push(segments[6]);
                    successRedirectFnc = (data) => {
                        if ( data.length > 0 ) {
                            this.redirect_element = {name: data[0].name,
                                type: 'doc',
                                link: "main.project.ref.document.full({projectId:'" +data[0]._projectId+ "',refId:'master',documentId:'" +data[0].id+ "'})"
                            };
                            const redirectFnc = () => {
                                this.$state.go('main.project.ref.document.full', {projectId: data[0]._projectId, refId: 'master', documentId: data[0].id});
                            };
                            this.$timeout(redirectFnc, 10000);
                        } else {
                            noResultFnc();
                        }
                    };
                }
            }
            // console.log(segments);
            var queryOb = this.buildQuery(searchTermList, this.projectList);
            this.elementSvc.search(this.reqOb, queryOb)
            .then(successRedirectFnc, this.errorHandler);
        };
    }
};

mmsApp.component(RedirectComponent.selector, RedirectComponent);