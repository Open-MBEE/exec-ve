import * as angular from 'angular';

export interface MmsObject extends Object {

}

export interface ElementObject extends MmsObject {
    id: string
    _projectId: string
    _refId: string
    _commitId?: string
    _modified?: Date
    type?: string
    defaultValue?: any
    documentation?: string
    name?: string
    [key: string]: any
}

export interface ExpressionObject extends ElementObject {
    specification?: ElementObject
    operand?: ExpressionObject[]
    value?: any
}


export interface ViewObject extends ElementObject {
    _relatedDocuments?: ViewObject[]
    _parentViews?: ViewObject[]
    _contents?: ExpressionObject
    _childViews?: ViewObject[]
}

export interface PresentationInstanceObject extends MmsObject {
    source?: string
    sourceProperty?: string
    sourceType?: string
    type: string
    nonEditable?: boolean
    text?: string
    excludeFromList?: boolean
    config?: any
    ptype?: string
    showIfEmpty?: boolean
    body?: any[]
}

// export interface PresentationObject extends ExpressionObject {
//     value: PresentationInstanceObject
// }

export interface DocumentObject extends ViewObject {
    _groupId?: string
}

export interface CommitObject extends MmsObject {
    deleted?: CommitChangeElement[],
    _creator? : string,
    added?: CommitChangeElement[],
    _docId?: string,
    _created?: Date,
    comment?: null,
    source?: null,
    id: string,
    updated?: CommitChangeElement[],
    _refId: string,
    _projectId: string
}

export interface CommitChangeElement extends MmsObject {
    _previousDocId: string,
    _docId: string,
    id: string,
    type: string

}

export interface OrgObject extends MmsObject {
    public: boolean,
    created: string,
    name: string,
    modified: string,
    id: string
}

export interface ProjectObject extends MmsObject {
    mounts?: string,
    schema?: string,
    _creator?: string,
    _docId?: string,
    _created?: string,
    _mounts?: ProjectObject[]
    name?: string,
    id: string,
    orgId?: string,
    _refId?: string
}

export interface RefObject extends MmsObject {
    parentRefId: string,
    deleted?: boolean,
    _docId?: string,
    _creator?: string,
    _created?: string,
    description?: string,
    name?: string,
    id: string,
    type: "Branch"| "Tag",
    _projectId: string,
    permission?: string,
    parentCommitId?: string
}

export interface PropertySpec {options?: ElementObject[], isEnumeration?: boolean, isSlot?: boolean}

interface RequestObject extends MmsObject {
    projectId: string
    refId: string
    orgId?: string
    commitId?: string
    extended?: boolean
    depth?: number
}

export interface ElementsRequest extends RequestObject {
    elementId: string | string[]
}

export interface ElementCreationRequest extends ElementsRequest {
    elements: ElementObject[]
}

export interface QueryObject extends MmsObject {
    params?: {
        [key: string]: string | object
    },
    recurse?: {
        [key: string]: string | object
    },
    from?: number,
    size?: number
}

export interface QueryParams extends MmsObject {
    showDeleted?: boolean,
}

export interface AuthResponse extends  angular.IHttpResponse<any> {
    token: string
}

export interface CheckAuthResponse {
    username: string
}

interface BasicResponse extends angular.IHttpResponse<any> {
    messages: any[]
    rejected: RejectedObject[]
}

interface RejectedObject {
    code: number,
    message: string
    object: ElementObject
}

export interface ElementsResponse extends BasicResponse {
    elements: ElementObject[]
    deleted?: any[]

}

export interface SearchResponse extends ElementsResponse {
    total: number
    rejectedTotal: number
}

export interface OrgsResponse extends BasicResponse {
    orgs: OrgObject[]
}
export interface ProjectsResponse extends BasicResponse {
    projects: ProjectObject[]
}

export interface RefsResponse extends BasicResponse {
    refs: RefObject[]
}

export interface CommitResponse extends BasicResponse {
    commits: CommitObject[]
}

export interface GroupsResponse extends BasicResponse {
    groups: ElementObject[]
}

