import { BarButton, IButtonBarButton } from '@ve-core/button-bar';

export interface ButtonWrapEvent {
    oldSize: number;
    newSize: number;
}

export class ButtonBarApi {
    public buttons: BarButton[] = [];
    public WRAP_EVENT: string;

    constructor(public id: string) {
        if (this.id === '') {
            this.id = 'unknown';
        }
        this.WRAP_EVENT = `${id}-wrap`;
    }
}
