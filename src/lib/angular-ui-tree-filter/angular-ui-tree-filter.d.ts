declare namespace angular {
    namespace uiTreeFilter {
        interface IFilterUiTree<T> {
            (collection: T, pattern: string, address?: string): T;
        }
    }
}
