/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-26 03:32:36 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-07-22 05:56:21
 */

import * as PIXI from "pixi.js";
import "honeycomb-grid";
import { Point, Hex,  } from "honeycomb-grid";
import * as g from "honeycomb-grid";
import { GameMap, Tile } from "./mapGenerator";

enum Actions {
    MoveUnit = "moveUnit",
    PlaceBuilding = "placeBuilding",
};

const CANCELLED = Symbol("Cancelled");
/**
 * @param {TurnContractFactory} iterFactory 
 * @param {number} timeLimit 
 * @returns {AsyncIterableIterator<TurnAction>}
 */
async function* listenUntil(iterFactory: TurnContractFactory, timeLimit: number) {
    const startTime = Date.now();
    let timePassed = 0;
    const iter = iterFactory({ timeLeft: timeLimit });

    do {
        timePassed = Date.now() - startTime;
        const action = await Promise.race([
            iter.next({ timeLeft: timeLimit }),
            delay(timeLimit - timePassed).then(() => CANCELLED),
        ]);

        if (action === CANCELLED) {
            return;
        }

        yield action;
    }
    while (true);
}

function delay(delay: number) {
    if (delay <= 0) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    });
}

export class Game {
    zones = new WeakMap<Tile, Zone>();
    players: { id: number; controller: PlayerController }[];
    
    constructor(public map: GameMap, players: PlayerController[]) {
        this.players = players.map((player, index) => {
            return {
                id: index,
                controller: player,
            };
        });

        this.placeZones();
    }

    private placeZones() {
        

        for (const hex of this.map) {
            hex.model.owner = this.players[0].id;
        }

        
    }

    async turn() {


        for (const player of this.players) {

            for await (const action of listenUntil(player.controller.getActions, Infinity)) {
                // TODO: handle user/bot actions
            }
        }
    }
}

class Zone {
    constructor(public capital: Hex) {
    }

    get isControllable() {
        return true;
    }

    addTile(hex: any) {

    }
    
    removeTile(hex: any) {

    }
}