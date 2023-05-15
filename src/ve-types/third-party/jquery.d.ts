export {};

declare global {
    interface JQuery {
        isOnScreen(x?: number, y?: number): boolean;

        table2CSV(inputOptions: table2CSV.inputOptions): string;
    }

    namespace JQuery {
        namespace table2CSV {
            interface inputOptions {
                delivery: string;
                separator?: string;
                header?: string[];
            }
        }
    }
}
