import {TreeApi} from "./Tree.service";
import {TreeBranch} from "../types/tree";

class LegacyTreeApiService extends TreeApi {
    /**
     * @ngdoc function
     * @name TreeApi#collapseBranch
     * @methodOf TreeApi
     *
     * @description
     * self explanatory
     *
     * @param {Object} branch branch to collapse
     */
    collapseBranch(branch: TreeBranch) {
        if (!branch)
            branch = this.selectedBranch;
        if (branch)
            branch.expanded = false;
        this.onTreeDataChange();
    };

    selectNextSibling(branch: TreeBranch) {
        var next = this.getNextSibling(branch);
        if (next)
            this.selectBranch(next);
    };

    selectPrevSibling(branch: TreeBranch) {
        var prev = this.getPrevSibling(branch);
        if (prev)
            this.selectBranch(prev);
    };

    /**
     * @ngdoc function
     * @name TreeApi#selectNextBranch
     * @methodOf TreeApi
     *
     * @description
     * self explanatory
     *
     * @param {Object} branch current branch
     */
    selectNextBranch(branch: TreeBranch) {
        var next = this.getNextBranch(branch);
        if (next)
            this.selectBranch(next);
    };

    /**
     * @ngdoc function
     * @name TreeApi#selectPrevBranch
     * @methodOf TreeApi
     *
     * @description
     * self explanatory
     *
     * @param {Object} branch current branch
     */
    selectPrevBranch(branch: TreeBranch) {
        var prev = this.getPrevBranch(branch);
        if (prev)
            this.selectBranch(prev);
    };

    sortBranch(b, sortFunction) {
        b.children.sort(sortFunction);
    };
}