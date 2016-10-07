/// <reference types="core-js" />
import { Stream } from 'xstream';
import { IsolateModule } from './isolateModule';
export interface CycleDOMEvent extends Event {
    propagationHasBeenStopped?: boolean;
    ownerTarget?: Element;
}
/**
 * Attaches an actual event listener to the DOM root element,
 * handles "destinations" (interested DOMSource output subjects), and bubbling.
 */
export declare class EventDelegator {
    private topElement;
    eventType: string;
    useCapture: boolean;
    isolateModule: IsolateModule;
    private destinations;
    private roof;
    private domListener;
    constructor(topElement: Element, eventType: string, useCapture: boolean, isolateModule: IsolateModule);
    bubble(rawEvent: Event): void;
    matchEventAgainstDestinations(el: Element, ev: CycleDOMEvent): void;
    capture(ev: Event): void;
    addDestination(subject: Stream<Event>, namespace: Array<string>, destinationId: number): void;
    createDestinationId(): number;
    removeDestinationId(destinationId: number): void;
    patchEvent(event: Event): CycleDOMEvent;
    mutateEventCurrentTarget(event: CycleDOMEvent, currentTargetElement: Element): void;
    updateTopElement(newTopElement: Element): void;
}
