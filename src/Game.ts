/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-26 03:32:36 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-09-05 20:18:03
 */

import * as PIXI from "pixi.js";
import "honeycomb-grid";
import * as g from "honeycomb-grid";
import { GameMap, Tile, GameHex } from "./mapGenerator";
import { sample } from "./utils";
import { groupHexes } from "./Map/utils";
import { createState } from "./core/State/Manager";

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
    zones = new WeakMap<GameHex, Zone>();
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

        this.placeZones();
    }

    private placeZones() {
        const startingZoneCount = 3;
        const numPlayers = this.players.length;

        const zonesToReserve = numPlayers * startingZoneCount;

        const posiblePlaces = new Map<number, GameHex[]>(this.players.map((p, i) => ([i, [] ])))
        const choosedZones = new Map<number, Zone[]>(this.players.map((p, i) => ([i, [] ])))

        for (const hex of this.map) {
            hex.model.owner = sample(this.players).id;

            posiblePlaces.get(hex.model.owner).push(hex);
        }


        for (const player of this.players) {
            for (let i = 0; i < startingZoneCount; i++) {
                const places = posiblePlaces.get(player.id);
                const groups = groupHexes(this.map, places);

                groups.sort((g1, g2) => g2.length - g1.length);

                let choosedGroup = groups.find(g => g.length >= 2);

                // TODO: find the most distant starting zones for same player

                if (!choosedGroup) {
                    console.warn(`Can't find starting zone for player ${player.id} at itter ${i}`);
                }

                if (choosedGroup) {
                    posiblePlaces.set(player.id, places.filter(pl => !choosedGroup.includes(pl)));

                    // TODO: select better place for capital
                    // probably one thaat not far away from weighted center of zone but close to edge

                    const zone = new Zone(choosedGroup[0]);

                    choosedGroup.slice(1).forEach(hex => {
                        this.zones.set(hex, zone);
                        zone.addTile(hex)
                    });

                    choosedZones.get(player.id).push(zone);
                }
            }
        }
        
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
                        const cell = this.map.get(action.data);
                        
                        if (selectedUnit) {
                            if (cell.model.owner === player.id) {
                                
                            }
                            cell.model.placement = `m${selectedUnit}`;
                            selectedUnit = 0;
                            player.controller.postChanges("updateCursor", null);
                            session.checkpoint();
                        }
                        if (selectedBuilding) {
                            if (cell.model.owner === player.id) {
                                cell.model.placement = selectedBuilding;
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

class Zone {
    constructor(public capital: GameHex) {
        capital.model.isCapital = true;
    }

    get isControllable() {
        return true;
    }

    addTile(hex: any) {

    }
    
    removeTile(hex: any) {

    }
}