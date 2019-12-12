/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-26 03:32:36 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-12-12 17:44:39
 */

import * as PIXI from "pixi.js";
import "honeycomb-grid";
import { Tile, GameHex } from "./core/Map/mapGenerator";
import { createState } from "./core/State/Manager";
import { GameMap, Zone } from "./core/GameMap";

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

    computeTurn() {
        for (const tile of this.map.tiles) {
            // TODO: spawn trees
        }
        // replace tombs with trees
        for (const tile of this.map.tiles) {
            if (tile.placement === "deadPlace") {
                tile.placement = "tree";
            }
        }

        for (const zone of this.map.getZones()) {
            zone.gold += zone.income - zone.expenses;
            if (zone.gold < 0) {
                zone.gold = 0;
                for (const tile of zone.tiles) {
                    if (tile.placement && tile.placement.startsWith("m")) {
                        tile.placement = "deadPlace";
                    }
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

            handleUserActions: {
                for await (const action of listenUntil(player.controller.getActions, Infinity)) {
                    // TODO: handle user/bot actions

                    await delay(50);

                    console.log("boom", action);

                    switch (action.type) {
                        case "END_TURN":
                            player.controller.postChanges("updateCursor", null);
                            player.controller.postChanges("updateZoneInfo", null);
                            break handleUserActions;
                        case "RESET_SELECTION":
                            selectedBuilding = "";
                            selectedUnit = 0;
                            player.controller.postChanges("updateCursor", null);
                            player.controller.postChanges("updateZoneInfo", null);
                            break;
                        case "CLICK_ON_HEX":
                            const tile = this.map.get(action.data);
                            const isMine = tile.owner === player.id;
    
                            const zone = this.map.zoneMap.get(tile);
                            if (zone && !selectedUnit && !selectedBuilding) {
                                if (zone.capital.owner === player.id) {
                                    player.controller.postChanges("updateZoneInfo", {
                                        gold: zone.gold,
                                        income: zone.income,
                                    });

                                    player.controller.postChanges("zoneSelected", {
                                        border: this.map.getZoneBorder(zone),
                                    });
                                }
                                else {
                                    player.controller.postChanges("updateZoneInfo", null);
                                    
                                }
                            }
                            
                            if (selectedUnit) {

                                function getStrength(tile: Tile): number {
                                    if (tile.placement && tile.placement.startsWith("m")) {
                                        const [, num] = tile.placement.match(/m(\d)/i);
                                        return +num;
                                    }
                                }

                                function moveTileToPlayer(map: GameMap, zonesAround: Record<number, Zone[]>, tile: Tile, targetPlayer: number) {
                                    const mineLandNearby = zonesAround[targetPlayer] || [];
                                    const enemyLandNearby = zonesAround[targetPlayer] || [];

                                    console.assert(mineLandNearby.length > 0, "There should be at least one land of attacker nearby", mineLandNearby, targetPlayer);
                                    let winnerZone = mineLandNearby[0];
                                    if (mineLandNearby.length > 1) {
                                        winnerZone = map.mergeZones(mineLandNearby);
                                    }
                                    else {
                                        mineLandNearby[0].addTile(tile);
                                    }

                                    if (enemyLandNearby.length > 0) {
                                        console.assert(enemyLandNearby.length === 1, "There should not be more than one zone around player tile in center", enemyLandNearby);
                                        map.splitZone(enemyLandNearby[0], tile);
                                    }
                                    
                                    winnerZone.addTile(tile);
                                    tile.owner = targetPlayer;
                                    const tiles = map.getNeighborNoncontrollableTiles(tile, targetPlayer);
                                    for (const tile of tiles) {
                                        winnerZone.addTile(tile);
                                        tile.owner = targetPlayer;
                                    }
                                }
                                
                                if (isMine) {
                                    if (tile.placement === "capital" || tile.placement === "fort") {
                                        break;        
                                    }

                                    if (tile.placement) {
                                        if (tile.placement.startsWith("m")) {
                                            const targetUnit = getStrength(tile) + selectedUnit;
                                            if (targetUnit <= 4) {
                                                tile.placement = `m${targetUnit}`;
                                            }
                                        }
                                    }
                                    else {
                                        tile.placement = `m${selectedUnit}`;
                                    }
                                    selectedUnit = 0;
                                    player.controller.postChanges("updateCursor", null);
                                }
                                else {
                                    const zonesAround = this.map.getZonesAround(tile);
                                    const mineLandNearby = zonesAround[player.id] || [];
                                    if (mineLandNearby.length > 0) {

                                        const defence = Math.max(getStrength(tile), ...this.map.grid.neighborsOf(tile.hex).filter(h => h.model.owner === tile.owner).map(h => getStrength(h.model)));

                                        if (defence < selectedUnit) {
                                            moveTileToPlayer(this.map, zonesAround, tile, player.id);
                                            
                                            tile.placement = `m${selectedUnit}`;
                                            selectedUnit = 0;
                                            player.controller.postChanges("updateCursor", null);
                                        }
                                    }
                                }
                                
                                
                                session.checkpoint();
                            }
                            if (selectedBuilding) {
                                if (isMine) {
                                    tile.placement = selectedBuilding;
                                    selectedBuilding = "";
                                    player.controller.postChanges("updateCursor", null);
                                    session.checkpoint();
                                }
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
            }

            // afterUserActions:;

            session.reset();

            // session.applySession();
        }


        this.computeTurn();
    }
}

