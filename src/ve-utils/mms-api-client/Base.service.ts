import { VePromise } from '@ve-types/angular';
import { BasicResponse, MmsObject } from '@ve-types/mms';

export abstract class BaseApiService {
    protected inProgress: {
        [key: string]: VePromise<MmsObject | MmsObject[], BasicResponse<MmsObject>>;
    } = {};

    protected _isInProgress = (key: string): boolean => {
        return Object.prototype.hasOwnProperty.call(this.inProgress, key) as boolean;
    };

    protected _getInProgress<T extends MmsObject, U = BasicResponse<T>>(key: string): VePromise<T | T[], U> {
        if (this._isInProgress(key)) return this.inProgress[key] as unknown as VePromise<T | T[], U>;
        else return;
    }

    protected _addInProgress<T extends MmsObject, U = BasicResponse<T>>(
        key: string,
        promise: VePromise<T | T[], U>
    ): void {
        this.inProgress[key] = promise as unknown as VePromise<MmsObject | MmsObject[], BasicResponse<MmsObject>>;
    }

    protected _removeInProgress = (key: string): void => {
        delete this.inProgress[key];
    };

    public reset(): void {
        this.inProgress = {};
    }
}
