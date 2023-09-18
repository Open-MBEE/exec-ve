import _ from 'lodash';

import { RevertConfirmResolveFn } from '@ve-components/diffs';
import { ApiService, ElementService } from '@ve-utils/mms-api-client';

import { veComponents } from '@ve-components';

import { VePromise, VeQService } from '@ve-types/angular';
import { CommitObject, ElementObject, ElementsRequest, RefObject } from '@ve-types/mms';
import { VeModalService } from '@ve-types/view-editor';

export interface Commit {
    ref: RefObject;
    isOpen: boolean;
    refIsOpen?: boolean;
    history: CommitObject[];
    commitSelected: CommitObject | string;
}

export interface CompareData {
    baseCommit: Commit;
    compareCommit: Commit;
    element: ElementObject;
}

export interface DiffResponse {
    status?: 'new' | 'deleted' | 'changed';
    diff?: DiffDetail;
}

export interface DiffDetail {
    name: boolean;
    documentation: boolean;
    value: boolean;
    [key: string]: boolean;
}

export class DiffMergeService {
    static $inject = ['$q', 'growl', '$uibModal', 'ApiService', 'ElementService'];
    constructor(
        private $q: VeQService,
        private growl: angular.growl.IGrowlService,
        private $uibModal: VeModalService,
        private apiSvc: ApiService,
        private elementSvc: ElementService
    ) {}

    /**
     * @name DiffMergeService#revertAction     * called by transcludes and section, cancels edited element
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
    public revertAction(reqOb: ElementsRequest<string>, revertData: CompareData, domElement: JQLite): void {
        const instance = this.$uibModal.open<RevertConfirmResolveFn, void>({
            size: 'lg',
            windowClass: 'revert-spec',
            component: 'revertConfirm',
            resolve: {
                reqOb: () => {
                    return reqOb;
                },
                revertData: () => {
                    return revertData;
                },
            },
        });
        instance.result.then(
            () => {
                this.growl.success('Element reverted');
            },
            () => {
                this.growl.error('Revert Cancelled');
            }
        );
    }

    public checkDiff(sourceOb: ElementObject): VePromise<DiffResponse> {
        const deferred = this.$q.defer<DiffResponse>();
        const diff: DiffDetail = {
            name: false,
            documentation: false,
            value: false,
        };
        let response: DiffResponse;
        this.elementSvc.getElement<ElementObject>(this.apiSvc.makeElementRequestObject(sourceOb), 1, true, true).then(
            (targetOb) => {
                if (!targetOb) {
                    response.status = 'new';
                    deferred.resolve(response);
                }
                if (sourceOb.name !== targetOb.name) {
                    diff.name = true;
                }
                if (sourceOb.documentation !== targetOb.documentation) {
                    diff.documentation = true;
                }
                if (
                    (sourceOb.type === 'Property' || sourceOb.type === 'Port') &&
                    !_.isEqual(sourceOb.defaultValue, targetOb.defaultValue)
                ) {
                    diff.value = true;
                } else if (sourceOb.type === 'Slot' && !_.isEqual(sourceOb.value, targetOb.value)) {
                    diff.value = true;
                } else if (
                    sourceOb.type === 'Constraint' &&
                    !_.isEqual(sourceOb.specification, targetOb.specification)
                ) {
                    diff.value = true;
                }
                let changed = false;
                Object.keys(diff).forEach((value) => {
                    changed = changed || diff[value];
                });
                if (changed) {
                    response = {
                        status: 'changed',
                        diff,
                    };
                }
                deferred.resolve(response);
            },
            (reason) => {
                if (reason.status === 410) {
                    response.status = 'deleted';
                    deferred.resolve(response);
                } else {
                    this.growl.error(`Diff Check not completed - ${reason.message}`);
                    deferred.reject(null);
                }
            }
        );
        return deferred.promise;
    }
}

veComponents.service('DiffMergeService', DiffMergeService);
