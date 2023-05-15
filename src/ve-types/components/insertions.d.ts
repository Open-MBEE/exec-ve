import { ElementObject } from '@ve-types/mms';
import { VeModalResolve, VeModalResolveFn } from '@ve-types/view-editor';

export interface InsertResolveFn<T extends InsertData> extends VeModalResolveFn {
    getInsertData(): T;

    getProjectId(): string;

    getRefId(): string;

    getOrgId(): string;
}

export interface InsertResolve<T extends InsertData> extends VeModalResolve {
    getInsertData: T;
    getProjectId: string;
    getRefId: string;
    getOrgId: string;
}

export interface InsertData {
    type: string;
    insertType: string;
    noPublish?: boolean;
    isNew?: boolean;
    parentTitle?: string;
    selected?: ElementObject;
}

export interface InsertApi<T, U> {
    resolve(data: T): void;

    reject(reason: U): void;
}
