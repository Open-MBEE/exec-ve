import { ElementsRequest } from '@ve-types/mms'
import { TreeBranch } from '@ve-types/tree'

export namespace veAppEvents {
    interface viewAddedData {
        vId: string
        curSec: string
        prevSibId?: string
    }

    interface viewDeletedData {
        parentBranch: TreeBranch
        prevBranch: TreeBranch
        branch: TreeBranch
    }

    interface elementSelectedData extends ElementsRequest<string> {
        rootId?: string
        refType?: string
        displayOldSpec?: boolean
    }

    interface elementUpdatedData extends elementSelectedData {
        continueEdit?: boolean
    }
}
