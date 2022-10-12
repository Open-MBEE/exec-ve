import * as angular from "angular";

import {ExtensionService, ComponentService} from "@ve-components/services"
import {ViewObject} from "@ve-types/mms";
import {SchemaService} from "@ve-utils/model-schema";
import {EventService, MathJaxService, UtilsService} from "@ve-utils/services";
import {ButtonBarService} from "@ve-core/button-bar";
import {ITransclusion, Transclusion} from "@ve-components/transclusions";
import {AuthService, ElementService, ViewService} from "@ve-utils/mms-api-client";
import {VeComponentOptions} from "@ve-types/view-editor";
import {handleChange} from "@ve-utils/utils";

import {veComponents} from "@ve-components";

/**
 * @ngdoc directive
 * @name veComponents.component:mmsGroupDocs
 *
 * @requires veUtils/ElementService
 *
 *
 * @description
 *
 * @param {string} mmsGroupId The id of the group to show documents for
 * @param {string=master} mmsRefId Ref, defaults to master
 * @param {string} mmsProjectId Project Id, if not stated will get from surrounding view
 */
class TranscludeGroupDocsController extends Transclusion implements ITransclusion {

    template = `<table class="table table-condensed">
    <tr><th>Document(s)</th><!--<th>Last Modified</th><th>Last Modified By</th><th>Created</th>--></tr>
    <tr ng-repeat="doc in $ctrl.docs | orderBy: 'name'">
        <td><view-link mms-document-id="{{doc.id}}" mms-element-id="{{doc.id}}" mms-project-id="{{$ctrl.projectId}}" mms-ref-id="{{$ctrl.refId}}"></view-link></td>
    </tr>
</table>
`

    mmsGroupId: string;

    documents: ViewObject[];
    docs: ViewObject[];

    static $inject = [...Transclusion.$inject, 'ViewService'];

    constructor(
        $q: angular.IQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        elementSvc: ElementService,
        utilsSvc: UtilsService,
        schemaSvc: SchemaService,
        authSvc: AuthService,
        eventSvc: EventService,
        mathJaxSvc: MathJaxService,
        extensionSvc: ExtensionService,
        buttonBarSvc: ButtonBarService,
        private viewSvc: ViewService
    ) {
        super($q,$scope,$compile,$element,growl,componentSvc,elementSvc,utilsSvc,schemaSvc,authSvc,eventSvc,
            mathJaxSvc, extensionSvc, buttonBarSvc)
        this.cfType = 'groupDocs'
        this.cfTitle = ''
        this.cfKind = 'Table'
        this.checkCircular = false;
    }

    $postLink() {
        this.changeAction(this.mmsGroupId,'',false);
    }

    protected config = () => {
        this.mmsGroupId = this.mmsElementId;
    }

    protected watch = (onChangesObj: angular.IOnChangesObject) => {
        if (onChangesObj.mmsGroupId) {
            this.mmsElementId = this.mmsGroupId;
        }
        handleChange(onChangesObj, 'mmsGroupId', this.changeAction);
    }

    public getContent = () => {
        const deferred: angular.IDeferred<string> = this.$q.defer();
        this.mmsGroupId = this.mmsElementId;
        this.viewSvc.getProjectDocuments({
            projectId: this.projectId,
            refId: this.refId
        }, 2).then((documents) => {
            this.documents = documents;
            this.update();
            deferred.resolve(this.template)
        },(reason) => {
            deferred.reject(reason);
        });
        return deferred.promise;
    }

    public update = () => {
        var docs: ViewObject[] = [];
        var groupId = this.mmsGroupId === '' ? undefined : this.mmsGroupId;
        for (let i = 0; i < this.documents.length; i++) {
            if ( (groupId === undefined || groupId === this.projectId) && !this.documents[i]._groupId ) {
                docs.push(this.documents[i]);
            } else if (this.documents[i]._groupId == this.mmsGroupId) {
                docs.push(this.documents[i]);
            }
        }
        this.docs = docs;
    }

};

export let TranscludeGroupDocsComponent: VeComponentOptions = {
        selector: 'transcludeGroupDocs',
        template: `<div></div>`,
        bindings: {
            mmsGroupId: '@',
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsCommitId: '@',
            mmsWatchId: '@',
            noClick: '@',
            nonEditable: '<',
            clickHandler: '&?',
            mmsCfLabel: '@'
        },
        require: {
            mmsCfCrl: '?^^mmsCf',
            mmsViewCtrl: '?^^view'
        },
        controller: TranscludeGroupDocsController
}

veComponents.component(TranscludeGroupDocsComponent.selector,TranscludeGroupDocsComponent)
