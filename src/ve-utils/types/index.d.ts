import * as angular from 'angular';

declare module 'angular' {
    export namespace mms {

        export interface ElementObject extends Object {
            id : string
            _projectId: string
            _refId: string
            _commitId?: string
            _modified?: Date
            type?: string
            value?: any
            defaultValue?: any
            specification?: any
            name?: string
            [key: string]: any
        }

        export interface ViewObject extends ElementObject {
            _contents?: any
        }

        export interface ElementsRequest extends Object {
            elementId: string | string[]
            projectId: string
            refId: string
            orgId?: string
            commitId?: string
            extended?: boolean
        }

        interface AuthResponse extends  angular.IHttpResponse<any> {
            token: string
        }
        interface BasicResponse extends angular.IHttpResponse<any> {
            messages: any[]
            rejected: any[]
        }

        interface ElementsResponse extends BasicResponse {
            elements: angular.mms.ElementObject[]
            deleted?: any[]

        }
        interface ProjectsResponse extends BasicResponse {
            projects: any[]
        }
        interface CommitResponse extends BasicResponse {
            commits: any[]
        }
    }

    export namespace ve {
        interface ComponentOptions extends angular.IComponentOptions {
            selector: string;
        }
    }
}