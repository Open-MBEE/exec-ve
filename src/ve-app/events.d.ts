import { TreeBranch } from '@ve-types/tree';

export namespace veAppEvents {
    interface viewAddedData {
        vId: string;
        curSec: string;
        prevSibId?: string;
    }

    interface viewDeletedData {
        parentBranch: TreeBranch;
        prevBranch: TreeBranch;
        branch: TreeBranch;
    }
}
