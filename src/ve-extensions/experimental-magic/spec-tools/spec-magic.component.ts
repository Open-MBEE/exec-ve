import angular from 'angular';
import _ from 'lodash';

import { ComponentService } from '@ve-components/services';
import { SpecTool, ISpecTool, SpecService } from '@ve-components/spec-tools';
import { ToolbarService } from '@ve-core/toolbar';
import { ApplicationService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import {
    ApiService,
    ElementService,
    PermissionsService,
    ProjectService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VeQService } from '@ve-types/angular';

class SpecMagicController extends SpecTool implements ISpecTool {
    static $inject = [...SpecTool.$inject];

    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        uRLSvc: URLService,
        elementSvc: ElementService,
        projectSvc: ProjectService,
        applicationSvc: ApplicationService,
        apiSvc: ApiService,
        viewSvc: ViewService,
        permissionsSvc: PermissionsService,
        eventSvc: EventService,
        specSvc: SpecService,
        toolbarSvc: ToolbarService
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
        );
        this.specType = _.kebabCase(SpecMagicComponent.selector);
        this.specTitle = 'Magic Element';
    }
}

const SpecMagicComponent: VeComponentOptions = {
    selector: 'specMagic',
    template: `
    <p>Hello World!!</p>
`,
    controller: SpecMagicController,
};

veComponents.component(SpecMagicComponent.selector, SpecMagicComponent);
