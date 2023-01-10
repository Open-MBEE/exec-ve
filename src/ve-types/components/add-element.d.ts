import { VeModalResolve, VeModalResolveFn } from '@ve-types/view-editor'

export interface AddElementResolveFn<T extends AddElementData>
    extends VeModalResolveFn {
    getAddData(): T

    getProjectId(): string

    getRefId(): string

    getOrgId(): string
}

export interface AddElementResolve<T extends AddElementData>
    extends VeModalResolve {
    getAddData: T
    getProjectId: string
    getRefId: string
    getOrgId: string
}

export interface AddElementData {
    type: string
    addType: string
    noPublish?: boolean
    parentTitle?: string
}

export interface AddElementApi<T, U> {
    resolve(data: T): void

    reject(reason: U): void
}
