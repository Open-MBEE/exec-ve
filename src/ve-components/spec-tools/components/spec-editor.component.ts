import _ from 'lodash'

import { ComponentService } from '@ve-components/services'
import { SpecService, SpecTool, ISpecTool } from '@ve-components/spec-tools'
import { ToolbarService } from '@ve-core/toolbar'
import { ApplicationService } from '@ve-utils/application'
import { AutosaveService, EventService } from '@ve-utils/core'
import {
    URLService,
    ElementService,
    AuthService,
    ViewService,
    PermissionsService,
    ProjectService,
    ApiService,
} from '@ve-utils/mms-api-client'

import { veComponents } from '@ve-components'

import { VeComponentOptions, VeQService } from '@ve-types/angular'

/**
 * @ngdoc directive
 * @name veComponents.component:mmsSpec
 *
 * @required veUtils/URLService
 * @requires veUtils/AuthService
 * @requires veUtils/ElementService
 * @requires veUtils/ViewService
 * @requires veUtils/PermissionsService
 * @requires $compile
 * @requires $templateCache
 * @requires growl
 * @requires _
 *
 * * Outputs a "spec window" of the element whose id is specified. Spec includes name,
 * documentation, and value if the element is a property. Also last modified time,
 * last user, element id. Editability is determined by a param and also element
 * editability. Documentation and string values can have html and can transclude other
 * element properties. Conflict can occur during save based on last server read time
 * and offers choice of force save, discard edit or simple merge. To control saving
 * or editor pass in an api object that will be populated with methods (see methods seciton):
 *
 * ## Example spec with full edit (given permission)
 * ### controller (js)
 *  <pre>
 angular.module('app', ['ve-components'])
 .controller('SpecCtrl', ['$scope', function($scope) {
        $this.api = {}; //empty object to be populated by the spec api
       public edit() {
            $this.api.setEditing(true);
        };
       public save() {
            $this.api.save()
            .then((e) => {
                //success
            }, (reason) => {
                //failed
            });
        };
    }]);
 </pre>
 * ### template (html)
 *  <pre>
 <div ng-controller="SpecCtrl">
 <button ng-click="edit()">Edit</button>
 <button ng-click="save()">Save</button>
 <spec mms-eid="element_id" mms-edit-field="all" spec-api="api"></spec>
 </div>
 </pre>
 * ## Example for showing an element spec at a certain time
 *  <pre>
 <spec mms-eid="element_id" mms-version="2014-07-01T08:57:36.915-0700"></spec>
 </pre>
 * ## Example for showing a current element with nothing editable
 *  <pre>
 <spec mms-eid="element_id" mms-edit-field="none"></spec>
 </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {Object=} specSvc An empty object that'll be populated with api methods
 * @param {Object=} mmsElement An element object, if this is provided, a read only
 *      element spec for it would be shown, this will not use mms services to get the element
 */

class SpecEditorController extends SpecTool implements ISpecTool {
    static $inject = [...SpecTool.$inject, 'AutosaveService']

    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        uRLSvc: URLService,
        authSvc: AuthService,
        elementSvc: ElementService,
        projectSvc: ProjectService,
        applicationSvc: ApplicationService,
        apiSvc: ApiService,
        viewSvc: ViewService,
        permissionsSvc: PermissionsService,
        eventSvc: EventService,
        specSvc: SpecService,
        toolbarSvc: ToolbarService,
        private autosaveSvc: AutosaveService
    ) {
        super(
            $q,
            $scope,
            $element,
            growl,
            componentSvc,
            uRLSvc,
            elementSvc,
            projectSvc,
            applicationSvc,
            apiSvc,
            viewSvc,
            permissionsSvc,
            eventSvc,
            specSvc,
            toolbarSvc
        )
        this.specType = _.kebabCase(SpecEditorComponent.selector)
        this.specTitle = 'Edit Element'
    }

    configToolbar = (): void => {
        if (this.autosaveSvc.openEdits() > 0) {
            this.tbApi.setIcon('spec-editor', 'fa-edit-asterisk')
            this.tbApi.setPermission('spec-editor-saveall', true)
        }
    }

    initCallback = (): void => {
        this.specSvc.setEditing(true)
        const editOb = this.specSvc.getEdits()
        if (editOb) {
            const key =
                editOb.id + '|' + editOb._projectId + '|' + editOb._refId
            this.specSvc.tracker.etrackerSelected = key
            this.autosaveSvc.addOrUpdate(key, editOb)
            this.specSvc.cleanUpSaveAll()
            this.elementSvc.isCacheOutdated(editOb).then(
                (data) => {
                    const server = data.server
                        ? data.server._modified
                        : new Date()
                    const cache = data.cache ? data.cache._modified : new Date()
                    if (data.status && server > cache)
                        this.growl.error(
                            'This element has been updated on the server. Please refresh the page to get the latest version.'
                        )
                },
                (reason) => {
                    this.growl.error(reason.message)
                }
            )
            this.edit = editOb
        }
    }
}

const SpecEditorComponent: VeComponentOptions = {
    selector: 'specEditor',
    template: `
<!-- HTML for edit mode -->
<div ng-if="!$ctrl.noEdit && $ctrl.specSvc.editing" class="editing">

    <h1 class="prop" ng-if="$ctrl.edit.name !== undefined"><input class="form-control ve-plain-input" type="text" ng-model="$ctrl.edit.name"></h1>
    <span class="elem-updated-wrapper">Last modified {{$ctrl.element._modified | date:'M/d/yy h:mm a'}} by <b ng-if="$ctrl.modifier.email != undefined">{{ $ctrl.modifier.email }}</b><b ng-if="$ctrl.modifier.email == undefined">{{ $ctrl.modifier }}</b></span>

    <transclude-val mms-element-id="{{$ctrl.element.id}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}" mms-commit-id="{{$ctrl.mmsCommitId}}" non-editable="false"></transclude-val>
            
        
    <h2 class="prop-title spec-view-doc-heading">Documentation</h2>
    <editor ng-model="$ctrl.edit.documentation" mms-editor-api="$ctrl.editorApi" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" autosave-key="{{$ctrl.element._projectId + $ctrl.element._refId + $ctrl.element.id}}"></editor>

    <h2 class="prop-title spec-view-type-heading">Metatypes</h2>
    <span class="elem-type-wrapper prop">
        <span class="elem-type">{{$ctrl.element.type}}</span>
        <div ng-repeat="type in $ctrl.element._appliedStereotypeIds" class="elem-type">
            <transclude-name mms-element-id="{{type}}" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" no-click="true"></transclude-name>
        </div>
    </span>
    <h2 class="prop-title">Location</h2>
    <span class="prop">{{$ctrl.qualifiedName}}</span>
    <h2 class="prop-title">ID</h2>
    <span class="prop id">{{$ctrl.element.id}}</span>
    <h2 class="prop-title">Branch/Tag</h2>
    <span class="prop">{{$ctrl.element._refId}}</span>
    <h2 class="prop-title">Project</h2>
    <span class="prop">{{$ctrl.element._projectId}}</span>
    <h2 class="prop-title">Formatted Modified Time</h2>
    <span class="prop">{{$ctrl.element._modified}}</span>
    <h2 class="prop-title">Commit</h2>
    <span class="prop">{{$ctrl.element._commitId}}</span>
</div>
    `,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsElement: '<?',
        noEdit: '@',
        mmsDisplayOldSpec: '<?',
    },
    controller: SpecEditorController,
}

veComponents.component(SpecEditorComponent.selector, SpecEditorComponent)
