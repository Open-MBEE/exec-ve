import {veExt} from "@ve-ext";
import * as angular from "angular";
import {ElementObject} from "@ve-types/mms";
import {ViewService} from "@ve-utils/mms-api-client";
import {VeModalService} from "@ve-types/view-editor";
import {AddItemResolveFn} from "@ve-app/main/modals/add-item-modal.component";

export class PresentationService {

    //locals
    private addItemData

    private revertData: { elementId: string; baseCommit: object; refId: string; compareCommit: object;
        projectId: string; element: object };

    static $inject = ['$timeout', '$uibModal', 'ViewService'];

    constructor(private $timeout: angular.ITimeoutService, private $uibModal: VeModalService, private viewSvc: ViewService) {
    }

    public checkForDuplicateInstances(operand) {
        var seen = {}, dups = [], curr;
        for (var i = 0; i < operand.length; i++) {
            curr = operand[i].instanceId;
            if (curr) {
                if (seen[curr]) {
                    dups.push(operand[i]);
                    operand.splice(i, 1);
                    i--;
                    continue;
                }
                seen[curr] = true;
            } else {
                //instanceId is invalid?
            }
        }
        return dups;
    };

    /**
     * @ngdoc method
     * @name PresentationService#addPresentationElement
     * @methodOf veCore.Utils
     *
     * @description
     * Utility to add a new presentation element to view or section
     *
     * @param {Object} $ctrl controller
     * @param {string} type type of presentation element (Paragraph, Section)
     * @param {ElementObject} viewOrSectionOb the view or section (instance spec) object
     */
    public addPresentationElement($ctrl: angular.IComponentController, type: string, viewOrSectionOb: ElementObject) {
        // $ctrl.viewOrSectionOb = viewOrSectionOb;
        // $ctrl.presentationElemType = type;
        this.addItemData = {
            addType: 'pe',
            itemType: type,
            viewOrSectionOb: viewOrSectionOb,
            addPeIndex: $ctrl.addPeIndex
        }
        let instance = this.$uibModal.open({
            component: 'addItemModal',
            resolve: <AddItemResolveFn> {
                getAddData: () => {
                    return this.addItemData;
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
            }});
        instance.result.then((data) => {
            if (data.type !== 'InstanceSpecification' || this.viewSvc.isSection(data)) {
                return; //do not open editor for existing pes added or if pe/owner is a section
            }
            this.$timeout(() => { //auto open editor for newly added pe
                $('#' + data.id).find('transclude-doc,transclude-com').click();
            }, 0, false);
        });
    };
}

veExt.service('PresentationService', PresentationService)
