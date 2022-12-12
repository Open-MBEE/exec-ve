export interface EditingApi {
    save?(e?): VePromise<boolean>

    saveC?(e?): void

    cancel?(e?): VePromise<boolean>

    startEdit?(e?): void

    preview?(e?): void

    delete?(e?): void
}

export interface EditingToolbar {
    cancel(e?): void

    delete(e?): void

    preview(e?): void

    save(e?): void

    saveC(e?): void

    startEdit(e?): void
}
