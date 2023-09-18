import { InsertPresentationData } from '@ve-components/insertions/components/insert-pe.component';
import { ViewService } from '@ve-utils/mms-api-client';

import { veComponents } from '@ve-components';

import { InsertResolveFn } from '@ve-types/components';
import { ElementObject, InstanceSpecObject, InstanceValueObject } from '@ve-types/mms';
import { VeModalService } from '@ve-types/view-editor';
import { EventService } from "@ve-utils/core";

export class PresentationService {
    private revertData: {
        elementId: string;
        baseCommit: object;
        refId: string;
        compareCommit: object;
        projectId: string;
        element: object;
    };

    static $inject = ['$timeout', '$uibModal', 'growl', 'ViewService', 'EventService'];

    constructor(
        private $timeout: angular.ITimeoutService,
        private $uibModal: VeModalService,
        private growl: angular.growl.IGrowlService,
        private viewSvc: ViewService,
        private eventSvc: EventService
    ) {}

    public checkForDuplicateInstances(operand: InstanceValueObject[]): InstanceValueObject[] {
        const seen: { [id: string]: boolean } = {},
            dups: InstanceValueObject[] = [],
            cleared: InstanceValueObject[] = [];
        let curr: string;
        operand.forEach((value, index) => {
            curr = value.instanceId;
            if (curr) {
                if (seen[curr]) {
                    dups.push(value);
                    operand.splice(index, 1);
                    return;
                }
                cleared.push(value);
                seen[curr] = true;
            }
        });
        operand.length = 0;
        operand.push(...cleared);
        return dups;
    }

    /**
     * @name PresentationService#addPresentationElement
     * Utility to add a new presentation element to view or section
     *
     * @param {Object} $ctrl controller
     * @param {string} type type of presentation element (Paragraph, Section)
     * @param {ElementObject} viewOrSectionOb the view or section (instance spec) object
     */
    public addPresentationElement($ctrl: { addPeIndex: number }, type: string, viewOrSectionOb: ElementObject): void {
        // $ctrl.viewOrSectionOb = viewOrSectionOb;
        // $ctrl.presentationElemType = type;
        const instance = this.$uibModal.open<InsertResolveFn<InsertPresentationData>, InstanceSpecObject>({
            component: 'insertElementModal',
            resolve: {
                getInsertData: (): InsertPresentationData => {
                    return {
                        insertType: 'pe',
                        type,
                        viewOrSectionOb,
                        addPeIndex: $ctrl.addPeIndex,
                        parentBranch: null,
                    };
                },
                getProjectId: () => {
                    return viewOrSectionOb._projectId;
                },
                getRefId: () => {
                    return viewOrSectionOb._refId;
                },
                getOrgId: () => {
                    return '';
                },
            },
        });
        instance.result.then(
            (data) => {
                //send event to tree
                this.eventSvc.$broadcast<ElementObject>('view.reordered', viewOrSectionOb);
                if (data.type !== 'InstanceSpecification' || this.viewSvc.isSection(data)) {
                    return; //do not open editor for existing pes added or if pe/owner is a section
                }
                void this.$timeout(
                    () => {
                        //auto open editor for newly added pe
                        $('#' + data.id)
                            .find('transclude-doc,transclude-com')
                            .trigger('click');
                    },
                    0,
                    false
                );
            },
            (reason) => {
                if (reason && reason.status !== 444) {
                    this.growl.warning(`Error adding PE: ${reason.message}`);
                } else {
                    this.growl.info('PE Insert Cancelled', {
                        ttl: 1000,
                    });
                }
            }
        );
    }
}

veComponents.service('PresentationService', PresentationService);
