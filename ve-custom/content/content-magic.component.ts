import {VeComponentOptions} from "../../src/ve-utils/types/view-editor";
import {veExt} from "../../src/ve-extensions/ve-extensions.module";
import {ContentToolControllerImpl} from "../../src/ve-extensions/content-tools/content-tool.controller";
import {ContentToolController} from "../../src/ve-extensions/content-tools/content-tool";
import * as angular from "angular";
import {TransclusionService} from "../../src/ve-extensions/transclusions/Transclusion.service";
import {URLService} from "../../src/ve-utils/services/URL.provider";
import {AuthService} from "../../src/ve-utils/services/Authorization.service";
import {ElementService} from "../../src/ve-utils/services/Element.service";
import {UtilsService} from "../../src/ve-utils/services/Utils.service";
import {ViewService} from "../../src/ve-utils/services/View.service";
import {PermissionsService} from "../../src/ve-utils/services/Permissions.service";
import {EventService} from "../../src/ve-utils/services/Event.service";
import {SpecService} from "../../src/ve-extensions/content-tools/services/Spec.service";
import {ToolbarService} from "../../src/ve-extensions/content-tools/services/Toolbar.service";

import _ from "lodash";

class ContentMagicController extends ContentToolControllerImpl implements ContentToolController {
    static $inject = [...ContentToolControllerImpl.$inject];

    constructor($scope: angular.IScope, $element: JQuery<HTMLElement>,
                growl: angular.growl.IGrowlService, transclusionSvc: TransclusionService, uRLSvc: URLService,
                authSvc: AuthService, elementSvc: ElementService, utilsSvc: UtilsService,
                viewSvc: ViewService, permissionsSvc: PermissionsService,
                eventSvc: EventService, specSvc: SpecService, toolbarSvc: ToolbarService) {
        super($scope,$element,growl,transclusionSvc,uRLSvc,authSvc,elementSvc,utilsSvc,viewSvc,permissionsSvc,eventSvc,specSvc,toolbarSvc)
        this.contentType = _.kebabCase(ContentMagicComponent.selector)
        this.contentTitle = "Edit Element";
        this.contentKind = 'document'
    }
}

let ContentMagicComponent: VeComponentOptions = {
    selector: 'contentMagic',
    template: `
    <p>Hello World!!</p>
`, controller: ContentMagicController
}


export let component = ContentMagicComponent;
///veExt.component(ContentMagicComponent.selector,ContentMagicComponent)