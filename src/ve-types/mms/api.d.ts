import {
    CommitObject,
    ElementObject,
    GroupObject,
    DataObject,
    MmsObject,
    OrgObject,
    ProjectObject,
    RefObject,
    UserObject,
} from '@ve-types/mms';
import { VeRole } from '@ve-types/mms/permissions';

export interface UserObject extends MmsObject {
    username: string;
    id?: string;
    created?: Date;
    modified?: Date;
    email?: string;
    firstName?: string;
    lastName?: string;
    admin?: boolean;
    enabled?: boolean;
    fullName?: string;
}

export interface UserGroupObject extends MmsObject {
    name: string;
    type: string;
    users?: string[];
}

export interface CommitObject extends DataObject {
    deleted?: CommitChangeElement[];
    _creator?: string;
    added?: CommitChangeElement[];
    _docId?: string;
    _created?: string;
    comment?: null;
    source?: null;
    updated?: CommitChangeElement[];
    _refId: string;
    _projectId: string;
}

export interface CommitChangeElement extends DataObject {
    _previousDocId: string;
    _docId: string;
    type: string;
}

export interface RequestObject extends MmsObject {
    projectId: string;
    refId: string;
    orgId?: string;
    commitId?: string;
    depth?: number;
}

export interface ShortUrlRequest extends RequestObject {
    orgId: string;
    viewId?: string;
    documentId: string;
}

export interface ElementsRequest<T> extends RequestObject {
    elementId: T;
}

export interface UsersRequest extends RequestObject {
    username: string;
}

export interface CreationRequest<T extends MmsObject> {
    elements: T[];
}

export interface ElementCreationRequest<T extends ElementObject> extends RequestObject {
    elements: T[];
}

export interface ViewsRequest extends RequestObject {
    returnChildViews?: boolean;
    parentViewId?: string;
    aggr?: string;
}

export interface ViewCreationRequest extends ViewsRequest {
    viewId: string;
    viewDoc?: string;
    viewName?: string;
}

export interface ArtifactsRequest<T> extends ElementsRequest<T> {
    artifactExtension: string;
}

export interface AuthRequest {
    username: string;
    password: string;
}

export interface ArtifactObject {
    extension: string;
    checksum: string;
    locationType: string;
    location: string;
    mimetype: string;
}

export interface ParamsObject {
    projectId?: string;
    refId?: string;
    viewId?: string;
    documentId?: string;
    shortUrl?: string;
    keywords?: string;
    field?: string;
    fromLogin?: boolean;
    '#'?: string;
    display?: string;
    preview?: string;
    modify?: string;
    next?: string;
    [param: string]: string;
}

/**
 * eg. To query the ownedElements of an object recursively
 * {
 *  "params": {
 *      "id": "<element_id>"
 *  },
 *  "recurse": {
 *      "id": "ownerId"
 *  }
 *
 * }
 */
export interface QueryObject extends MmsObject {
    id?: string;
    params?: {
        [key: string]: string | object;
    };
    recurse?: {
        [key: string]: string | object;
    };
    from?: number;
    size?: number;
}

export interface QueryParams extends MmsObject {
    showDeleted?: boolean;
    [key: string]: string | boolean | number;
}

export interface AuthResponse {
    token: string;
}

export interface VersionResponse {
    mmsVersion: string;
}

export interface CheckAuthResponse {
    username: string;
}

interface BasicResponse<T extends MmsObject> {
    messages: string[];
    rejected: RejectedObject<T>[];
}

interface BasicRequest {
    source: string;
}

interface GenericResponse<T extends MmsObject> extends BasicResponse<T> {
    [p: string]: T[];
}

interface RejectedObject<T extends MmsObject> {
    code: number;
    message: string;
    object: T;
}

export interface ElementsResponse<T extends ElementObject> extends BasicResponse<T> {
    elements: T[];
    deleted?: T[];
}

export interface ElementsUpdateRequest<T extends ElementObject> extends BasicRequest {
    elements: T[];
}

export type PermissionUpdateAction = 'MODIFY' | 'REPLACE' | 'REMOVE';

export type PermissionUpdateResult = 'ADD' | 'REMOVE';

export interface PermissionLookupResponse extends BasicResponse<PermissionLookupObject> {
    lookups: PermissionLookupObject[];
    allPassed?: boolean;
}

export interface PermissionUpdateRequest {
    inherit?: boolean;
    public?: boolean;
    users?: {
        permissions: PermissionUpdateRecord[];
        action: PermissionUpdateAction;
    };
    groups?: {
        permissions: PermissionUpdateRecord[];
        action: PermissionUpdateAction;
    };
}

export interface PermissionUpdateRecord {
    name: string;
    role?: VeRole['ANY'];
    inherited?: boolean;
}

export interface PermissionUpdateResponse {
    users: {
        permissionUpdates: PermissionUpdateResultRecord[];
    };
    groups: {
        permissionUpdates: PermissionUpdateResultRecord[];
    };
}

export interface PermissionUpdateResultRecord extends PermissionUpdateRecord {
    action: PermissionUpdateResult;
    role: VeRole['ANY'];
    orgId: string;
    orgName: string;
    projectId?: string;
    projectName?: string;
    branchId?: string;
    inherited: boolean;
}

export interface PermissionResponse extends BasicResponse<PermissionResponse> {
    inherit: boolean;
    public: boolean;
    users: {
        permissions: PermissionRecord[];
    };
    groups: {
        permissions: PermissionRecord[];
    };
}

export interface PermissionRecord {
    name: string;
    role: VeRole['ANY'];
    inherited: boolean;
    inheritedRole?: VeRole['ANY'];
}

export interface PermissionMap {
    users: { [username: string]: PermissionRecord };
    groups: { [groupname: string]: PermissionRecord };
}

export interface PermissionLookupObject {
    type: string;
    orgId?: string;
    projectId?: string;
    refId?: string;
    groupName?: string;
    privilege?: string;
    allowAnonIfPublic?: boolean;
    hasPrivilege?: boolean;
}

export interface SearchResponse<T> extends ElementsResponse<T> {
    total: number;
    rejectedTotal: number;
}

export interface OrgsResponse extends BasicResponse<OrgObject> {
    orgs: OrgObject[];
}

export interface OrgsUpdateRequest extends BasicRequest {
    orgs: OrgObject[];
}

export interface ProjectsResponse extends BasicResponse<ProjectObject> {
    projects: ProjectObject[];
}

export interface RefsResponse extends BasicResponse<RefObject> {
    refs: RefObject[];
}

export interface RefsUpdateRequest {
    refs: RefObject[];
    source: string;
}

export interface CommitResponse extends BasicResponse<CommitObject> {
    commits: CommitObject[];
}

export interface GroupsResponse extends BasicResponse<ElementObject> {
    groups: GroupObject[];
}

export interface UsersResponse extends BasicResponse<UserObject> {
    users: UserObject[];
}
