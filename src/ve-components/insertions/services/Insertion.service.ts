import _ from 'lodash';

import { EditorService } from '@ve-core/editor';
import { RootScopeService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { ElementService } from '@ve-utils/mms-api-client';
import { Class } from '@ve-utils/utils';

import { veComponents } from '@ve-components';

import { VePromise, VeQService } from '@ve-types/angular';
import { ElementObject } from '@ve-types/mms';

export class InsertionService {
    static $inject = ['$q', '$timeout', 'growl', 'ElementService', 'EditorService', 'RootScopeService', 'EventService'];

    constructor(
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private editorSvc: EditorService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService
    ) {}

    public successUpdates = (elemType: string, id: string): void => {
        this.eventSvc.$broadcast('content-reorder.refresh');
        this.eventSvc.$broadcast('content-reorder-saved', { id: id });
        this.growl.success('Adding ' + elemType + ' Successful');
        // Show comments when creating a comment PE
        if (elemType === 'Comment' && !this.rootScopeSvc.veCommentsOn()) {
            void this.$timeout(
                () => {
                    $('.show-comments').trigger('click');
                },
                0,
                false
            );
        }
    };

    public createAction = (createItem: ElementObject, noPublish: boolean): VePromise<ElementObject> => {
        if (!createItem.name) {
            this.growl.error('Error: A name for your new element is required.');
            return this.$q.reject({ status: 422 });
        }
        const editKey = this.elementSvc.getEditElementKey(createItem);

        const toCreate: ElementObject = new Class(createItem);

        let promise: VePromise<ElementObject>;
        if (!noPublish) {
            promise = this.elementSvc.createElement({
                elements: [toCreate],
                refId: toCreate._refId,
                projectId: toCreate._projectId,
            });
        } else {
            promise = this.$q.resolve(
                this.elementSvc.cacheElement(
                    {
                        refId: toCreate._refId,
                        projectId: toCreate._projectId,
                    },
                    _.cloneDeep(toCreate)
                )
            );
        }

        promise.finally(() => {
            this.editorSvc.cleanUpEdit(editKey);
        });

        return promise;
    };

    public cancelAction = (cancelledItem: ElementObject): void => {
        this.editorSvc.cleanUpEdit(this.elementSvc.getEditElementKey(cancelledItem));
    };
}

veComponents.service('InsertionService', InsertionService);
