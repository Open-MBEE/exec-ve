import { VeComponentOptions } from '@ve-types/angular';

export interface IPresentationComponentOptions extends VeComponentOptions {
    selector: string;
    style?: string[];
    bindings: {
        peObject: string;
        instanceSpec: string;
        peNumber: string;
        mmsProjectId?: '@';
        mmsRefId?: '@';
        mmsCommitId?: '@';
        [key: string]: string;
    };
    required?: {
        mmsViewPresentationElemCtrl: string;
        mmsViewCtrl: string;
        [key: string]: string;
    };
}

export interface ITableConfig {
    sortByColumnFn(sortCol?: number): void;

    showBindingForSortIcon: number;
    filterDebounceRate: number;
    filterTermColumnPrefixBinding: string;
}
