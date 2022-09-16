import * as angular from "angular";
import _ from "lodash";

import {Commit, ExtUtilService, veExt} from "@ve-ext";
import {ISpecTool, SpecService, SpecTool, ToolbarService} from "@ve-ext/spec-tools";
import {
    AuthService,
    ElementService,
    PermissionsService,
    ProjectService,
    URLService,
    ViewService
} from "@ve-utils/mms-api-client";
import {EventService, UtilsService} from "@ve-utils/core-services";
import { CommitObject } from "@ve-utils/types/mms";
import {VeComponentOptions} from "@ve-types/view-editor";

/**
 * @ngdoc component
 * @name veExt.component:specHistory
 *
 * @requires veUtils/ElementService
 * @requires veUtils/ProjectService
 * @requires $templateCache
 * @requires $q
 * @requires _
 *
 *
 * @description
 * Outputs a history window of the element whose id is specified. History includes
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
    gettingHistory: boolean;
    refList: any[];
    baseCommit: Commit
    historyVer: string;
    compareCommit: Commit
    disableRevert: boolean;

    static $inject = [...SpecTool.$inject];

    constructor($scope: angular.IScope, $element: JQuery<HTMLElement>, $q: angular.IQService,
                growl: angular.growl.IGrowlService, extUtilSvc: ExtUtilService, uRLSvc: URLService,
                authSvc: AuthService, elementSvc: ElementService, projectSvc: ProjectService,
                utilsSvc: UtilsService, viewSvc: ViewService, permissionsSvc: PermissionsService,
                eventSvc: EventService, specSvc: SpecService, toolbarSvc: ToolbarService) {
        super($scope,$element,$q,growl,extUtilSvc,uRLSvc,authSvc,elementSvc,projectSvc,utilsSvc,viewSvc,permissionsSvc,eventSvc,specSvc,toolbarSvc)
        this.specType = _.kebabCase(SpecHistoryComponent.selector)
        this.specTitle = "Element History";
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
    controller: SpecHistoryController
}

veExt.component(SpecHistoryComponent.selector, SpecHistoryComponent)
