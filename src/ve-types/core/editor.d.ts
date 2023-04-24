import { VePromise } from '@ve-types/angular'

export interface EditingApi {
    save?(e?: JQuery.ClickEvent): VePromise<boolean>

    saveC?(e?: JQuery.ClickEvent): void

    cancel?(e?: JQuery.ClickEvent): VePromise<boolean>

    startEdit?(e?: JQuery.ClickEvent): void

    preview?(e?: JQuery.ClickEvent): void

    delete?(e?: JQuery.ClickEvent): void
}

export interface EditingToolbar {
    cancel(e?): void

    delete(e?): void

    preview(e?): void

    save(e?): void

    saveC(e?): void
}
