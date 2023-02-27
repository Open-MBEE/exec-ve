import { ElementObject } from '@ve-types/mms'
import { TreeBranch } from '@ve-types/tree'

export namespace veAppEvents {
    interface viewAddedData {
        vId: string
        curSec: string
        prevSibId?: string
    }

    interface viewSelectedData {
        rootOb: ElementObject
        focusId: string
        commitId: string
    }

    interface viewDeletedData {
        parentBranch: TreeBranch
        prevBranch: TreeBranch
        branch: TreeBranch
    }

    interface elementSelectedData {
        elementOb: ElementObject
        commitId: string
    }
}
