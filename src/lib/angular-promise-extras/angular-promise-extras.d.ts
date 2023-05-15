import { VePromise } from '@ve-types/angular';

declare module 'angular' {
    type PromiseState = 'pending' | 'fulfilled' | 'rejected';

    interface PromiseValue<T> {
        state: PromiseState;
        value?: T | undefined;
        reason?: unknown;
    }

    // tslint:disable-next-line interface-name
    interface IQService {
        // tslint:disable:max-line-length
        allSettled<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
            values: [
                T1 | VePromise<T1, T1>,
                T2 | VePromise<T2, T2>,
                T3 | VePromise<T3, T3>,
                T4 | VePromise<T4, T4>,
                T5 | VePromise<T5, T5>,
                T6 | VePromise<T6, T6>,
                T7 | VePromise<T7, T7>,
                T8 | VePromise<T8, T8>,
                T9 | VePromise<T9, T9>,
                T10 | VePromise<T10, T10>
            ]
        ): VePromise<
            [
                PromiseValue<T1>,
                PromiseValue<T2>,
                PromiseValue<T3>,
                PromiseValue<T4>,
                PromiseValue<T5>,
                PromiseValue<T6>,
                PromiseValue<T7>,
                PromiseValue<T8>,
                PromiseValue<T9>,
                PromiseValue<T10>
            ],
            [
                PromiseValue<T1>,
                PromiseValue<T2>,
                PromiseValue<T3>,
                PromiseValue<T4>,
                PromiseValue<T5>,
                PromiseValue<T6>,
                PromiseValue<T7>,
                PromiseValue<T8>,
                PromiseValue<T9>,
                PromiseValue<T10>
            ]
        >;
        allSettled<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
            values: [
                T1 | VePromise<T1, T1>,
                T2 | VePromise<T2, T2>,
                T3 | VePromise<T3, T3>,
                T4 | VePromise<T4, T4>,
                T5 | VePromise<T5, T5>,
                T6 | VePromise<T6, T6>,
                T7 | VePromise<T7, T7>,
                T8 | VePromise<T8, T8>,
                T9 | VePromise<T9, T9>
            ]
        ): VePromise<
            [
                PromiseValue<T1>,
                PromiseValue<T2>,
                PromiseValue<T3>,
                PromiseValue<T4>,
                PromiseValue<T5>,
                PromiseValue<T6>,
                PromiseValue<T7>,
                PromiseValue<T8>,
                PromiseValue<T9>
            ],
            [
                PromiseValue<T1>,
                PromiseValue<T2>,
                PromiseValue<T3>,
                PromiseValue<T4>,
                PromiseValue<T5>,
                PromiseValue<T6>,
                PromiseValue<T7>,
                PromiseValue<T8>,
                PromiseValue<T9>
            ]
        >;
        allSettled<T1, T2, T3, T4, T5, T6, T7, T8>(
            values: [
                T1 | VePromise<T1, T1>,
                T2 | VePromise<T2, T2>,
                T3 | VePromise<T3, T3>,
                T4 | VePromise<T4, T4>,
                T5 | VePromise<T5, T5>,
                T6 | VePromise<T6, T6>,
                T7 | VePromise<T7, T7>,
                T8 | VePromise<T8, T8>
            ]
        ): VePromise<
            [
                PromiseValue<T1>,
                PromiseValue<T2>,
                PromiseValue<T3>,
                PromiseValue<T4>,
                PromiseValue<T5>,
                PromiseValue<T6>,
                PromiseValue<T7>,
                PromiseValue<T8>
            ],
            [
                PromiseValue<T1>,
                PromiseValue<T2>,
                PromiseValue<T3>,
                PromiseValue<T4>,
                PromiseValue<T5>,
                PromiseValue<T6>,
                PromiseValue<T7>,
                PromiseValue<T8>
            ]
        >;
        allSettled<T1, T2, T3, T4, T5, T6, T7>(
            values: [
                T1 | VePromise<T1, T1>,
                T2 | VePromise<T2, T2>,
                T3 | VePromise<T3, T3>,
                T4 | VePromise<T4, T4>,
                T5 | VePromise<T5, T5>,
                T6 | VePromise<T6, T6>,
                T7 | VePromise<T7, T7>
            ]
        ): VePromise<
            [
                PromiseValue<T1>,
                PromiseValue<T2>,
                PromiseValue<T3>,
                PromiseValue<T4>,
                PromiseValue<T5>,
                PromiseValue<T6>,
                PromiseValue<T7>
            ],
            [
                PromiseValue<T1>,
                PromiseValue<T2>,
                PromiseValue<T3>,
                PromiseValue<T4>,
                PromiseValue<T5>,
                PromiseValue<T6>,
                PromiseValue<T7>
            ]
        >;
        allSettled<T1, T2, T3, T4, T5, T6>(
            values: [
                T1 | VePromise<T1, T1>,
                T2 | VePromise<T2, T2>,
                T3 | VePromise<T3, T3>,
                T4 | VePromise<T4, T4>,
                T5 | VePromise<T5, T5>,
                T6 | VePromise<T6, T6>
            ]
        ): VePromise<
            [
                PromiseValue<T1>,
                PromiseValue<T2>,
                PromiseValue<T3>,
                PromiseValue<T4>,
                PromiseValue<T5>,
                PromiseValue<T6>
            ],
            [PromiseValue<T1>, PromiseValue<T2>, PromiseValue<T3>, PromiseValue<T4>, PromiseValue<T5>, PromiseValue<T6>]
        >;
        allSettled<T1, T2, T3, T4, T5>(
            values: [
                T1 | VePromise<T1, T1>,
                T2 | VePromise<T2, T2>,
                T3 | VePromise<T3, T3>,
                T4 | VePromise<T4, T4>,
                T5 | VePromise<T5, T5>
            ]
        ): VePromise<
            [PromiseValue<T1>, PromiseValue<T2>, PromiseValue<T3>, PromiseValue<T4>, PromiseValue<T5>],
            [PromiseValue<T1>, PromiseValue<T2>, PromiseValue<T3>, PromiseValue<T4>, PromiseValue<T5>]
        >;
        allSettled<T1, T2, T3, T4>(
            values: [T1 | VePromise<T1, T1>, T2 | VePromise<T2, T2>, T3 | VePromise<T3, T3>, T4 | VePromise<T4, T4>]
        ): VePromise<
            [PromiseValue<T1>, PromiseValue<T2>, PromiseValue<T3>, PromiseValue<T4>],
            [PromiseValue<T1>, PromiseValue<T2>, PromiseValue<T3>, PromiseValue<T4>]
        >;
        allSettled<T1, T2, T3>(
            values: [T1 | VePromise<T1, T1>, T2 | VePromise<T2, T2>, T3 | VePromise<T3, T3>]
        ): VePromise<
            [PromiseValue<T1>, PromiseValue<T2>, PromiseValue<T3>],
            [PromiseValue<T1>, PromiseValue<T2>, PromiseValue<T3>]
        >;
        allSettled<T1, T2>(
            values: [T1 | VePromise<T1, T1>, T2 | VePromise<T2, T2>]
        ): VePromise<[PromiseValue<T1>, PromiseValue<T2>], [PromiseValue<T1>, PromiseValue<T2>]>;
        // tslint:enable:max-line-length

        allSettled<TAll>(
            promises: Array<TAll | VePromise<TAll, TAll>>
        ): VePromise<Array<PromiseValue<TAll>>, Array<PromiseValue<TAll>>>;

        allSettled<T>(promises: {
            [K in keyof T]: T[K] | VePromise<T[K]>;
        }): VePromise<{ [K in keyof T]: PromiseValue<T[K]> }>;

        isFulfilledState(promise: PromiseValue<unknown>): boolean;
        isRejectedState(promise: PromiseValue<unknown>): boolean;
    }
}
