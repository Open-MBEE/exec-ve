import angular from 'angular'
import _ from 'lodash'

import { ComponentService } from '@ve-components/services'
import { ISpecTool, SpecService, SpecTool } from '@ve-components/spec-tools'
import { Commit } from '@ve-core/diff-merge'
import { ToolbarService } from '@ve-core/tool-bar'
import {
    ApiService,
    AuthService,
    ElementService,
    PermissionsService,
    ProjectService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client'
import { AutosaveService, EventService, UtilsService } from '@ve-utils/services'

import { veComponents } from '@ve-components'

import { VeComponentOptions } from '@ve-types/angular'

/**
 * @ngdoc component
 * @name veComponents.component:specHistory
 *
 * @requires veUtils/ElementService
 * @requires veUtils/ProjectService
 * @requires $templateCache
 * @requires $q
 * @requires _
 *
 * * Outputs a history window of the element whose id is specified. History includes
 * name of modifier and date of change. Also modified date links to spec output below.
 *
 * ### template (html)
 * ## Example for showing an element history
 *  <pre>
    <mms-history mms-element-id="{{id}}" mms-ref-id="{{refId}}"
                         mms-project-id="{{projectId}}"></mms-history>
    </pre>
 *
 * @param {string} mmsElementId The id of the element
 * @param {string} mmsProjectId The project id for the element
 * @param {string=master} mmsRefId Reference to use, defaults to master
 */
class SpecHistoryController extends SpecTool implements ISpecTool {
    // Locals
    gettingHistory: boolean
    refList: any[]
    baseCommit: Commit
    historyVer: string
    compareCommit: Commit
    disableRevert: boolean

    static $inject = [...SpecTool.$inject]

    constructor(
        $scope: angular.IScope,
        $element: JQuery<HTMLElement>,
        $q: angular.IQService,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        uRLSvc: URLService,
        authSvc: AuthService,
        elementSvc: ElementService,
        projectSvc: ProjectService,
        utilsSvc: UtilsService,
        apiSvc: ApiService,
        viewSvc: ViewService,
        permissionsSvc: PermissionsService,
        eventSvc: EventService,
        specSvc: SpecService,
        toolbarSvc: ToolbarService,
        private autosaveSvc: AutosaveService
    ) {
        super(
            $scope,
            $element,
            $q,
            growl,
            componentSvc,
            uRLSvc,
            authSvc,
            elementSvc,
            projectSvc,
            utilsSvc,
            apiSvc,
            viewSvc,
            permissionsSvc,
            eventSvc,
            specSvc,
            toolbarSvc
        )
        this.specType = _.kebabCase(SpecHistoryComponent.selector)
        this.specTitle = 'Element History'
    }
}

const SpecHistoryComponent: VeComponentOptions = {
    selector: 'specHistory',
    template: `
    <mms-history mms-element-id="{{$ctrl.element.id}}" mms-project-id="{{$ctrl.projectId}}" mms-ref-id="{{$ctrl.refId}}"></mms-history>
`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
    },
    controller: SpecHistoryController,
}

veComponents.component(SpecHistoryComponent.selector, SpecHistoryComponent)
