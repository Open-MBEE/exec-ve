import { MmsObject } from '@ve-types/mms';

export interface OrgObject extends MmsObject {
    public: boolean;
    created: string;
    name: string;
    modified: string;
    id: string;
}

export interface ProjectObject extends MmsObject {
    _refId?: string;
    schema?: string;
    _creator?: string;
    _docId?: string;
    _created?: string;
    name?: string;
    id: string;
    orgId?: string;
}

export interface MountObject extends ProjectObject {
    _mounts: MountObject[];
    _refId: string;
    _projectId: string;
}

export interface RefObject extends MmsObject {
    parentRefId?: string;
    deleted?: boolean;
    _docId?: string;
    _creator?: string;
    _created?: string;
    description?: string;
    name?: string;
    id: string;
    type: string;
    _projectId: string;
    permission?: string;
    parentCommitId?: string;
    timestamp?: Date;
}
