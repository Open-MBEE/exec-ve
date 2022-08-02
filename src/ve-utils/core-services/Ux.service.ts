import * as angular from 'angular'
import {IButtonBarButton} from '@ve-utils/button-bar'
import {EventService} from "@ve-utils/core-services"
import {VeEditorApi} from '@ve-core/editor'
import {veUtils} from "@ve-utils";

/**
 * @ngdoc service
 * @name veUtils/UxService
 *
 * @requires EventService
 * @requires RootScopeService
 *
 * @description
 * Ux Service
 */
export class UxService {


    static $inject = ['EventService']
    constructor(private eventSvc: EventService) {}




}

veUtils.service('UxService', UxService)
