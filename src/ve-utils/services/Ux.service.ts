import * as angular from 'angular'
import {IButtonBarButton} from '@ve-utils/button-bar'
import {EventService} from "@ve-utils/services"
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
    MetaTypes = [
        'tag',
        'connector',
        'dependency',
        'directedrelationship',
        'element',
        'property',
        'generalization',
        'package',
        'section',
        'group',
        'snapshot',
        'view',
        'branch',
        'table',
        'figure',
        'equation',
        'view-composite',
        'view-shared',
        'view-none',
    ]

    static $inject = ['EventService']
    constructor(private eventSvc: EventService) {}



    getTreeTypes = (): object => {
        var treeTypes = {}

        this.MetaTypes.forEach((type) => {
            treeTypes[type] = this.getTypeIcon(type) + ' fa-fw'
        })

        return treeTypes
    }

    getTypeIcon = (type: string): string => {
        var t = type
        if (!t) t = 'unknown'
        t = t.toLowerCase()
        switch (t) {
            case 'tag':
                return 'fa fa-tag'
            case 'connector':
                return 'fa fa-expand'
            case 'dependency':
                return 'fa fa-long-arrow-right'
            case 'directedrelationship':
                return 'fa fa-long-arrow-right'
            case 'element':
                return 'fa fa-square'
            case 'property':
                return 'fa fa-circle'
            case 'generalization':
                return 'fa fa-chevron-right'
            case 'package':
                return 'fa fa-folder'
            case 'section':
                return 'section-icon' //"fa-file-o";
            case 'group':
                return 'fa fa-folder'
            case 'snapshot':
                return 'fa fa-camera'
            case 'view':
                return 'fa fa-file'
            case 'view-composite':
                return 'fa fa-file'
            case 'view-shared':
                return 'fa fa-file-o'
            case 'view-none':
                return 'fa fa-file-o'
            case 'branch':
                return 'fa fa-tasks'
            case 'table':
                return 'fa fa-table'
            case 'figure':
                return 'fa fa-image'
            case 'equation':
                return 'fa fa-superscript'
            default:
                return 'fa fa-square'
        }
    }

    getChangeTypeName = (type: string): string => {
        type = type.toLowerCase()
        switch (type) {
            case 'added':
                return 'Addition'
            case 'updated':
                return 'Modification'
            case 'removed':
                return 'Removal'
        }
    }
}

veUtils.service('UxService', UxService)
