import { BirdState } from './BirdStates';

export const viewPortStates = {
    PROJECT: "PROJECT",
    SKILLS: "SKILLS",
    ABOUT: "ABOUT",
    HERO: "HERO",
    CONTACT: "CONTACT",
    DEFAULT: "DEFAULT"
}

class BirdStateManager {
    constructor() {
        this.currentState = BirdState.FLOCKING;
        this.subscribers = new Set();
        this.viewPortState = viewPortStates.DEFAULT
    }

    setState(newState) {
        this.currentState = newState;
        this.notifySubscribers();
    }

    subscribe(bird) {
        this.subscribers.add(bird);
        bird.state = this.currentState;
    }

    notifySubscribers() {
        this.subscribers.forEach(bird => {
            bird.state = this.currentState;
        });
    }
    returnSubscribers(){
        return this.subscribers;
    }
    clearSubscribers(){
        this.currentState = BirdState.FLOCKING
        this.subscribers.clear();
    }
    hasSubscribers(){
        return this.subscribers.size > 0;
    }
    
}

export const birdStateManager = new BirdStateManager();