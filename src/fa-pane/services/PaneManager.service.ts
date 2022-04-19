import {faPaneModule} from "../fa-pane.main";

export class PaneManagerService {
    private counter = 0
    private panes = {}

    constructor() {
    }
    get(paneId) {
        return this.panes[paneId];
    }
    set(paneId, pane) {
        return this.panes[paneId] = pane;
    }
    remove(paneId) {
        return delete this.panes[paneId];
    }
    newId(pane) {
        this.counter++
        let id = this.counter.toString()
        this.set(id,pane);
        return id;
    }
}

faPaneModule.service("PaneManagerService", PaneManagerService);
