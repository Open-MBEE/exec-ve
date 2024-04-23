import { MmsObject } from '@ve-types/mms';
import { TreeBranch } from '@ve-types/tree';

export namespace veAppEvents {
    interface viewAddedData {
        vId: string;
        curSec: string;
        prevSibId?: string;
    }

    interface viewDeletedData<T extends MmsObject = MmsObject> {
        parentBranch: TreeBranch<T>;
        prevBranch: TreeBranch<T>;
        branch: TreeBranch<T>;
    }
}
