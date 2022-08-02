import {VeComponentOptions} from "@ve-types/view-editor";
import {veExt} from "@ve-ext";
import {SpecTool, ISpecTool, SpecService, ToolbarService} from "@ve-ext/spec-tools";
import * as angular from "angular";
import {ExtUtilService} from "@ve-ext";
import {
    AuthService,
    ElementService,
    PermissionsService,
    URLService,
    ViewService
} from "@ve-utils/mms-api-client"
import {
    EventService,
    UtilsService
} from "@ve-utils/core-services";

import _ from "lodash";

class SpecMagicController extends SpecTool implements ISpecTool {
    static $inject = [...SpecTool.$inject];

    constructor($scope: angular.IScope, $element: JQuery<HTMLElement>,
                growl: angular.growl.IGrowlService, extUtilSvc: ExtUtilService, uRLSvc: URLService,
                authSvc: AuthService, elementSvc: ElementService, utilsSvc: UtilsService,
                viewSvc: ViewService, permissionsSvc: PermissionsService,
                eventSvc: EventService, specSvc: SpecService, toolbarSvc: ToolbarService) {
        super($scope,$element,growl,extUtilSvc,uRLSvc,authSvc,elementSvc,utilsSvc,viewSvc,permissionsSvc,eventSvc,specSvc,toolbarSvc)
        this.specType = _.kebabCase(SpecMagicComponent.selector)
        this.specTitle = "Magic Element";
        this.specKind = 'global'
    }
}

let SpecMagicComponent: VeComponentOptions = {
    selector: 'specMagic',
    template: `
    <p>Hello World!!</p>
`, controller: SpecMagicController
}


veExt.component(SpecMagicComponent.selector,SpecMagicComponent)