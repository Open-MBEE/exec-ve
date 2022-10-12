
import {CommitObject, ElementObject} from "@ve-types/mms";
import angular from "angular";
import {veCore} from "@ve-core";

export interface Commit {
    ref: { id: string, type?: "Branch" | "Tag", _projectId?: string },
    isOpen: boolean
    refIsOpen?: boolean
    history: CommitObject[]
    commitSelected: CommitObject | string
}

export class DiffMergeService {

    private revertData: {
        elementId: string
        baseCommit: object
        refId: string
        compareCommit: object
        projectId: string
        element: object
    }

    constructor(private $uibModal: angular.ui.bootstrap.IModalService) {
    }


    /**
     * @ngdoc method
     * @name DiffMergeService#revertAction
     * @methodOf veCore.ExtUtilsService
     * @description
     * called by transcludes and section, cancels edited element
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   edit - edit object
     *   elementSaving - boolean
     *   isEditing - boolean
     *   bbApi - button bar api - handles spinny
     * sets these in the scope:
     *   isEditing - false
     *
     * @param {angular.IComponentController} $ctrl of the transclude component or view section component
     * @param {JQLite} domElement dom of the directive, jquery wrapped
     */
    public revertAction(
        $ctrl: { mmsElementId: string, mmsProjectId: string, mmsRefId: string, baseCommit: Commit, compareCommit: Commit, element: ElementObject },
    domElement: JQLite
    ) {
        this.revertData = {
            elementId: $ctrl.mmsElementId,
            projectId: $ctrl.mmsProjectId,
            refId: $ctrl.mmsRefId,
            baseCommit: $ctrl.baseCommit,
            compareCommit: $ctrl.compareCommit,
            element: $ctrl.element,
        }
        const instance = this.$uibModal.open({
            size: 'lg',
            windowClass: 'revert-spec',
            component: 'revertConfirm',
            resolve: {
                getRevertData: () => {
                    return this.revertData
                },
            },
        })
        instance.result.then((data) => {
            // TODO: do anything here?
        })
    }
}

veCore.service("DiffMergeService", DiffMergeService)
