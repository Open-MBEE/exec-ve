import { ElementObject } from '@ve-types/mms'

export namespace veAppEvents {
    interface viewAddedData {
        vId: string
        curSec: string
        prevSibId: string
    }

    interface viewSelectedData {
        elementOb: ElementObject
        commitId: string
    }
}
