import { MmsObject } from '@ve-types/mms';

export interface AdminObject extends MmsObject {
    id: string
    name?: string
}

export interface OrgObject extends AdminObject {
    public: boolean;
    created: string;
    name: string;
    modified: string;
    id: string;
}

export interface ProjectObject extends AdminObject {
    _refId?: string;
    schema?: string;
    _creator?: string;
    _docId?: string;
    _created?: string;
    orgId?: string;
}

export interface MountObject extends ProjectObject {
    _mounts: MountObject[];
    _refId: string;
    _projectId: string;
}

export interface RefObject extends AdminObject {
    parentRefId?: string;
    deleted?: boolean;
    _docId?: string;
    _creator?: string;
    _created?: string;
    description?: string;
    type: string;
    _projectId: string;
    permission?: string;
    parentCommitId?: string;
    timestamp?: Date;
}
