import {EventService} from "@ve-utils/services";

export class BaseEvent {
    static $inject = ["EventService"];

    constructor(protected eventSvc: EventService) {
    }
}
