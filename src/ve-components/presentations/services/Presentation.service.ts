import angular from 'angular'

import { AddElementResolveFn } from '@ve-app/main/modals/add-item-modal.component'
import { AddPresentationData } from '@ve-components/add-elements/components/add-pe.component'
import { ViewService } from '@ve-utils/mms-api-client'
import { InstanceSpec } from '@ve-utils/utils'

import { veComponents } from '@ve-components'

import {
    ElementObject,
    InstanceSpecObject,
    InstanceValueObject,
    ValueObject,
} from '@ve-types/mms'
import { VeModalService } from '@ve-types/view-editor'

export class PresentationService {
    private revertData: {
        elementId: string
        baseCommit: object
        refId: string
        compareCommit: object
        projectId: string
        element: object
    }

    static $inject = ['$timeout', '$uibModal', 'growl', 'ViewService']

    constructor(
        private $timeout: angular.ITimeoutService,
        private $uibModal: VeModalService,
        private growl: angular.growl.IGrowlService,
        private viewSvc: ViewService
    ) {}

    public checkForDuplicateInstances(
        operand: InstanceValueObject[]
    ): InstanceValueObject[] {
        const seen: { [id: string]: boolean } = {},
            dups: InstanceValueObject[] = [],
            cleared: InstanceValueObject[] = []
        let curr: string
        operand.forEach((value, index) => {
            curr = value.instanceId
            if (curr) {
                if (seen[curr]) {
                    dups.push(value)
                    operand.splice(index, 1)
                    return
                }
                cleared.push(value)
                seen[curr] = true
            }
        })
        operand.length = 0
        operand.push(...cleared)
        return dups
    }

    /**
     * @name PresentationService#addPresentationElement
     * Utility to add a new presentation element to view or section
     *
     * @param {Object} $ctrl controller
     * @param {string} type type of presentation element (Paragraph, Section)
     * @param {ElementObject} viewOrSectionOb the view or section (instance spec) object
     */
    public addPresentationElement(
        $ctrl: { addPeIndex: number },
        type: string,
        viewOrSectionOb: ElementObject
    ): void {
        // $ctrl.viewOrSectionOb = viewOrSectionOb;
        // $ctrl.presentationElemType = type;
        const instance = this.$uibModal.open<
            AddElementResolveFn<AddPresentationData>,
            InstanceSpecObject
        >({
            component: 'addElementModal',
            resolve: {
                getAddData: (): AddPresentationData => {
                    return {
                        addType: 'pe',
                        type,
                        viewOrSectionOb,
                        addPeIndex: $ctrl.addPeIndex,
                        parentBranch: null,
                    }
                },
                getProjectId: () => {
                    return viewOrSectionOb._projectId
                },
                getRefId: () => {
                    return viewOrSectionOb._refId
                },
                getOrgId: () => {
                    return ''
                },
            },
        })
        instance.result.then(
            (data) => {
                if (
                    data.type !== 'InstanceSpecification' ||
                    this.viewSvc.isSection(data)
                ) {
                    return //do not open editor for existing pes added or if pe/owner is a section
                }
                this.$timeout(
                    () => {
                        //auto open editor for newly added pe
                        $('#' + data.id)
                            .find('transclude-doc,transclude-com')
                            .click()
                    },
                    0,
                    false
                )
            },
            (reason) => {
                this.growl.warning(`Error adding PE: ${reason.message}`)
            }
        )
    }
}

veComponents.service('PresentationService', PresentationService)
