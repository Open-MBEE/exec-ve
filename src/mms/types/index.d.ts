import * as angular from 'angular';
import {ElementObject} from "../../lib/elementOb";

declare module 'angular' {
    export namespace mms {
        interface BasicResponse extends angular.IHttpResponse<any> {
            messages: Array<any>
            rejected: Array<any>
        }

        interface ElementsResponse extends BasicResponse {
            elements: Array<ElementObject>
            deleted?: Array<any>

        }
        interface ProjectsResponse extends BasicResponse {
            projects: Array<any>
        }
        interface CommitResponse extends BasicResponse {
            commits: Array<any>
        }
    }
}