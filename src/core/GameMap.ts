import * as Honeycomb from "honeycomb-grid";
import { GameHex, Tile } from "./Map/mapGenerator";
import { createState } from "./State/Manager";
import { sample } from "../utils";
import { groupHexes } from "./Map/utils";

export class GameMap {
    public zoneMap = new Map<Tile, Zone>();

    constructor(public grid: Honeycomb.GridProto<GameHex>, public state: ReturnType<typeof createState>) {

    }

    public getZones() {
        return [...new Set(this.zoneMap.values())];
    }

    public getZonesAround(tile: Tile) {
        const zonesPerPlayer: Record<number, Zone[]> = {};
        const tiles = this.grid.neighborsOf(tile.hex).map(h => h.model);
        
        for (const nTile of tiles) {
            if (!zonesPerPlayer[nTile.owner]) {
                zonesPerPlayer[nTile.owner] = [];
            }
            const zone = this.zoneMap.get(nTile);
            if (zone && !zonesPerPlayer[nTile.owner].includes(zone)) {
                zonesPerPlayer[nTile.owner].push(zone);
            }
        }
        return zonesPerPlayer;
    }
    
    public get(item: Honeycomb.HexPlain): Tile {
        return this.grid.get(item).model;
    }

    public getZoneBorder(zone: Zone) {
        const tiles = new Set(zone.tiles);

        const hexes = this.grid.filter(hex => tiles.has(hex.model));

        return hexes[0].corners().map(c => c.add(hexes[0].toPoint()));
    }

    public getNeighborNoncontrollableTiles(tile: Tile, playerId: number) {
        return this.grid.neighborsOf(tile.hex).map(h => h.model).filter(tile => tile.owner === playerId && !this.zoneMap.has(tile));
    }

    public mergeZones(zones: Zone[]) {
        let selectedZone = zones[0];
        for (const zone of zones) { // TODO: extract as strategy to select main zone to merge others into
            if (selectedZone.tiles.length > zone.tiles.length) {
                selectedZone = zone;
            }
        }

        for (const zone of zones) {
            if (zone !== selectedZone) {
                for (const tile of zone.tiles) {
                    this.zoneMap.set(tile, selectedZone);
                    selectedZone.addTile(tile);
                }
            }
        }

        return selectedZone;
    }

    public splitZone(zone: Zone, at: Tile) {
        zone.removeTile(at);
        
        if (at.isCapital) {
            zone.capital = this.chooseCapital(zone.tiles);
            zone.gold = 0;
        }

        const groups = groupHexes(this.grid, zone.tiles.map(t => t.hex));
        groups.sort((g1, g2) => g2.length - g1.length);

        const keepZone = groups[0];

        for (const group of groups) {
            if (group !== keepZone) {
                const capital = this.chooseCapital(group.map(h => h.model));

                for (const tile of group) {
                    zone.removeTile(tile.model);
                }

                if (capital) {
                    const newZone = new Zone(capital);
                    for (const hex of group) {
                        newZone.addTile(hex.model);
                        this.zoneMap.set(hex.model, newZone);
                    }
                }
                else {
                    // tiles in this group become uncontrollable, can there be more that 1 tile in such case?
                }
            }
        }
    }

    private chooseCapital(tiles: Tile[]): Tile | null {
        return tiles[0];
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

                    const zone = new Zone(this.chooseCapital(chosenGroup.map(h => h.model)));

                    chosenGroup.forEach(hex => {
                        this.zoneMap.set(hex.model, zone);
                        zone.addTile(hex.model);
                    });

                    chosenZones.get(player).push(zone);
                }
            }
        }
        
    }


}

export class Zone {
    public tiles: Tile[] = [];
    public gold = 0;

    constructor(public capital: Tile) {
        capital.isCapital = true;
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
