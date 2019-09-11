import * as Honeycomb from "honeycomb-grid";
import { GameHex, Tile } from "./Map/mapGenerator";
import { createState } from "./State/Manager";
import { sample } from "../utils";
import { groupHexes } from "./Map/utils";

export class GameMap {
    public zones = new Map<Tile, Zone>();

    constructor(public grid: Honeycomb.GridProto<GameHex>, public state: ReturnType<typeof createState>) {

    }

    public get(hex: Honeycomb.HexPlain) {
        return this.grid.get(hex).model;
    }

    public placeZones(players: number[]) {
        const startingZoneCount = 3;
        const numPlayers = players.length;

        const zonesToReserve = numPlayers * startingZoneCount;

        const possiblePlaces = new Map<number, GameHex[]>(players.map((p, i) => ([i, [] ])))
        const chosenZones = new Map<number, Zone[]>(players.map((p, i) => ([i, [] ])))

        for (const hex of this.grid) {
            hex.model.owner = sample(players);

            possiblePlaces.get(hex.model.owner).push(hex);
        }


        for (const player of players) {
            for (let i = 0; i < startingZoneCount; i++) {
                const places = possiblePlaces.get(player);
                const groups = groupHexes(this.grid, places);

                groups.sort((g1, g2) => g2.length - g1.length);

                let chosenGroup = groups.find(g => g.length >= 2);

                // TODO: find the most distant starting zones for same player

                if (!chosenGroup) {
                    console.warn(`Can't find starting zone for player ${player} at iter ${i}`);
                }

                if (chosenGroup) {
                    possiblePlaces.set(player, places.filter(pl => !chosenGroup.includes(pl)));

                    // TODO: select better place for capital
                    // probably one that not far away from weighted center of zone but close to edge

                    const zone = new Zone(chosenGroup[0]);

                    chosenGroup.slice(1).forEach(hex => {
                        this.zones.set(hex.model, zone);
                        zone.addTile(hex.model);
                    });

                    chosenZones.get(player).push(zone);
                }
            }
        }
        
    }


}


class Zone {
    public tiles: Tile[] = [];
    public gold = 0;

    constructor(public capital: GameHex) {
        capital.model.isCapital = true;
    }

    get income(): number {
        return this.tiles.reduce((sum, tile) => tile.placement === "tree" ? 0 : 1, 0);
    }

    get expenses(): number {
        return this.tiles.reduce((sum, tile) => tile.placement === "tree" ? 0 : 1, 0);
    }

    addTile(tile: Tile) {
        this.tiles.push(tile);
    }
    
    removeTile(tile: Tile) {
        this.tiles = this.tiles.filter(t => t !== tile);
    }
}
