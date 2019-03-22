/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-26 03:32:36 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-03-22 14:08:46
 */

import * as PIXI from "pixi.js";

const pl = {
    async *getActions(initial) {
        while (initial.timeLeft > 0) {
            initial = yield { type: "some turn", time: initial.timeLeft };
        }
    }
};

const CANCELLED = Symbol("Cancelled");
/**
 * @param {TurnContractFactory} itterFactory 
 * @param {number} timeLimit 
 * @returns {AsyncIterableIterator<TurnAction>}
 */
async function* listenUntil(itterFactory, timeLimit) {
    const startTime = Date.now();
    let timePassed = 0;
    const itter = itterFactory({ timeLeft: timeLimit });

    do {
        timePassed = Date.now() - startTime;
        const action = await Promise.race(
            itter.next({ timeLeft: timeLimit }),
            delay(timeLimit - timePassed).then(() => CANCELLED),
        );

        if (action === CANCELLED) {
            return;
        }

        yield action;
    }
    while (true);
}

function delay(delay) {
    if (delay <= 0) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    });
}

export class Game {

    /**
     * 
     * @param {Honeycomb.Grid<Honeycomb.Hex<{}>>} map 
     * @param {PlayerController[]} players 
     */
    constructor(map, players) {
        this.map = map;
        this.players = players;
    }

    turn() {


        for (const player of this.players) {

            for await (const action of listenUntil(player.getActions, Infinity)) {
                // TODO: handle user/bot actions
            }
        }
    }
}
