import * as _ from 'lodash';
import {ExtUtilService, veExt} from "@ve-ext";
import {ISpecTool, SpecService, SpecTool, ToolbarService} from "@ve-ext/spec-tools";
import * as angular from "angular";
import {
    AuthService,
    ElementService,
    PermissionsService,
    ProjectService,
    URLService,
    ViewService
} from "@ve-utils/mms-api-client";
import { EventService, UtilsService} from "@ve-utils/core-services";
import {VeComponentOptions} from "@ve-types/view-editor";

/**
 * @ngdoc component
 * @name veExt.component:SpecRefListController
 *
 * @requires {angular.IScope} $scope
 * @requires {JQuery<HTMLElement>} $element
 * @requires {angular.IQService} $q
 * @requires {angular.growl.IGrowlService} growl
 * @requires {ExtUtilService} extUtilSvc
 * @requires {URLService} uRLSvc
 * @requires {AuthService} authSvc
 * @requires {ElementService} elementSvc
 * @requires {ProjectService} projectSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc
 * @requires {PermissionsService} permissionsSvc
 * @requires {EventService} eventSvc
 * @requires {SpecService} specSvc
 * @requires {ToolbarService} toolbarSvc
 *
 *
 * @description
 * Displays a list of branches/tags with details. Provides options for taking action on ref.
 * For the time being it only allows for running a doc merge job on current document.
 *
 * @param {RefObject[]} mmsBranches List of current project branches
 * @param {RefObject[]} mmsTags List of current project tags
 */
class SpecRefListController extends SpecTool implements ISpecTool {
    //Locals
    showMerge: boolean
    runCleared: boolean
    docEditable: boolean
    docName: string
    private isDoc: boolean;

    static $inject = SpecTool.$inject;

    constructor($scope: angular.IScope, $element: JQuery<HTMLElement>, $q: angular.IQService,
                growl: angular.growl.IGrowlService, extUtilSvc: ExtUtilService, uRLSvc: URLService,
                authSvc: AuthService, elementSvc: ElementService, projectSvc: ProjectService,
                utilsSvc: UtilsService, viewSvc: ViewService, permissionsSvc: PermissionsService,
                eventSvc: EventService, specSvc: SpecService, toolbarSvc: ToolbarService) {
        super($scope,$element,$q,growl,extUtilSvc,uRLSvc,authSvc,elementSvc,projectSvc,utilsSvc,viewSvc,permissionsSvc,eventSvc,specSvc,toolbarSvc)
        this.specType = _.kebabCase(SpecRefListComponent.selector)
        this.specTitle = "Branch/Tag List";
    }

    public config = () => {
        this.showMerge = this.uRLSvc.getMmsServer().indexOf('opencae.jpl.nasa.gov') == -1;
        this.runCleared = true;
        this.docEditable = false;
    }
    //Callback function for document change
    public initCallback = () => {
        this.docName = this.document.name;
        if (!this.utilsSvc.isDocument(this.element)) {
            this.isDoc = false;
            return;
        } else {
            this.isDoc = true;
        }

        this.docEditable = this.specApi.refType != 'Tag' && this.permissionsSvc.hasProjectIdBranchIdEditPermission(this.specApi.projectId, this.specApi.refId);
    }


    public docMergeAction = function (srcRef) {
        var templateUrlStr = 'partials/mms-directives/mergeConfirm.html';
        this.srcRefOb = srcRef;

        var instance = this.$uibModal.open({
            templateUrl: templateUrlStr,
            scope: this,
            component: 'mergeConfirmModal',
        });
        instance.result.then(function (data) {
            // TODO: do anything here?
        });
    };

}

let SpecRefListComponent: VeComponentOptions = {
    selector: 'specRefList',
    template: ``,
    bindings: {
        mmsBranches: '<',
        mmsTags: '<'
    },
    controller: SpecRefListController
};

veExt.component(SpecRefListComponent.selector, SpecRefListComponent);
