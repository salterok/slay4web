/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-26 03:32:36 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-09-11 19:37:32
 */

import * as PIXI from "pixi.js";
import "honeycomb-grid";
import { Tile, GameHex } from "./core/Map/mapGenerator";
import { createState } from "./core/State/Manager";
import { GameMap } from "./core/GameMap";

enum Actions {
    MoveUnit = "moveUnit",
    PlaceBuilding = "placeBuilding",
};

const CANCELLED = Symbol("Cancelled");

async function* listenUntil(iterFactory: TurnContractFactory, timeLimit: number): AsyncIterableIterator<TurnAction> {
    const startTime = Date.now();
    let timePassed = 0;
    const iter = iterFactory({ timeLeft: timeLimit });

    let prevResult: TurnAction;

    do {
        timePassed = Date.now() - startTime;
        const step = await Promise.race([
            iter.next(prevResult),
            delay(timeLimit - timePassed).then(() => ({ done: true, value: CANCELLED })),
        ]);

        if (typeof step.value == "symbol") {
            return;
        }
        
        if (step.done) {
            return;
        }

        yield step.value;
        prevResult = step.value.result;
    }
    while (true);
}

function delay(delay: number) {
    if (delay <= 0) {
        return Promise.resolve();
    }
    if (delay === Infinity) {
        return new Promise(() => {});
    }
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    });
}

export class Game {
    players: { id: number; controller: PlayerController }[];
    
    constructor(public map: GameMap, private state: ReturnType<typeof createState>, players: PlayerController[]) {
        let colors = [0xec5c5c, 0xecba5c, 0xdbec5c, 0x7eec5c, 0x5cdeec, 0x5c94ec, 0x875cec, 0xd75cec, 0xec5c89];
        let preparedPlayers = this.players = players.map((player, index) => {
            return {
                id: index,
                color: colors.splice(0, 1),
                controller: player,
            };
        });

        Tile.prototype.getOwnerInfo = function () {
            return preparedPlayers.find(p => p.id === this.owner) || {};
        }

        this.map.placeZones(preparedPlayers.map(p => p.id));
    }

    

    async turn() {
        console.log("this.players", this.players)

        for (const player of this.players) {
            let selectedUnit = 0;
            let selectedBuilding = "";

            const session = this.state.beginSession();

            for await (const action of listenUntil(player.controller.getActions, 5000)) {
                // TODO: handle user/bot actions

                await delay(50);

                

                console.log("boom", action);

                switch (action.type) {
                    case "RESET_SELECTION":
                        selectedBuilding = "";
                        selectedUnit = 0;
                        player.controller.postChanges("updateCursor", null);
                        break;
                    case "CLICK_ON_HEX":
                        const tile = this.map.get(action.data);
                        
                        if (selectedUnit) {
                            if (tile.owner === player.id) {
                                
                            }
                            tile.placement = `m${selectedUnit}`;
                            selectedUnit = 0;
                            player.controller.postChanges("updateCursor", null);
                            session.checkpoint();
                        }
                        if (selectedBuilding) {
                            if (tile.owner === player.id) {
                                tile.placement = selectedBuilding;
                            }
                            selectedBuilding = "";
                            player.controller.postChanges("updateCursor", null);
                            session.checkpoint();
                        }

                        action.result = {some: 2};
                        break;
                    case "PLACE_UNIT":
                        break;
                    case "SELECT_UNIT":
                        break;
                    case "CREATE_BUILDING":
                        selectedBuilding = "fort";
                        selectedUnit = 0;
                        player.controller.postChanges("updateCursor", `fort`);
                        break;
                    case "CREATE_UNIT":
                        selectedBuilding = "";
                        if (selectedUnit < 4) {
                            selectedUnit++;
                            player.controller.postChanges("updateCursor", `m${selectedUnit}`);
                        }

                        break;
                    default:
                        console.warn("unknown action", action);
                }
            }

            session.reset();

            // session.applySession();
        }
    }
}

