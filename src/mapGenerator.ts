/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-07-20 03:09:02 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-07-31 04:45:43
 */

import * as Honeycomb from "honeycomb-grid";
import { rand, sample } from "./utils";
import { groupHexes, buildFastNeighbors } from "./Map/utils";

type InternalHex = Honeycomb.Hex<{marker: number}>;

const removedHexes = new Set<Honeycomb.Hex>();

const versionKey = Symbol("version");
export class Tile {
    [versionKey] = 0;

    owner = 0;
    placement = "";
    isCapital = false;

    getOwnerInfo(): any { return {}; } // this will be sustituted by actual implementation from Game.js

    getVersion() {
        return this[versionKey];
    }
}


function onPropChange<T extends { [name: string]: any }>(obj: T, propNames: (keyof T)[], fn: (propName: string, prev: unknown, next: unknown) => void) {
    const shadowPropsKey = Symbol("shadowProps");
    const shadowProps: { [name:string]: any } = {};
    (obj as any)[shadowPropsKey] = shadowProps;
    const overrideProps: { [name: string]: PropertyDescriptor } = {};
    for (const propName of propNames as string[]) {
        shadowProps[propName] = obj[propName];
        overrideProps[propName] = {
            configurable: true,
            enumerable: false,
            get() {
                return shadowProps[propName];
            },
            set(value) {
                fn(propName, shadowProps[propName], shadowProps[propName] = value);
            },
        }
    }
    Object.defineProperties(obj, overrideProps);
}

export type GameHex = Honeycomb.Hex<{ marker: number; model: Tile; }>;
export type GameMap = Honeycomb.GridProto<GameHex>;

function markRemoved(grid: Honeycomb.Grid, hex: Honeycomb.HexPlain) {
    const index = grid.indexOf(hex as InternalHex);
    if (index !== -1) {
        removedHexes.add(grid[index]);
        return grid[index];
    }
}

/**
 * Computes new hole size using binary partitioning based on growFactor
 * @param {number} maxLevel 
 * @param {number} growFactor 
 */
function computeGrowLevel(maxLevel: number, growFactor: number) {
    let min = 1;
    let max = maxLevel;
    while(max - min > 0) {
        let curr = min + (max - min) / 2 | 0;
        if (Math.random() < growFactor) {
            min = curr;
        }
        else {
            max = curr;
        }
    }
    return min;
}

function markAreas(grid: Honeycomb.Grid<InternalHex>) {
    let counter = new Map<number, InternalHex[]>();
    grid.forEach(h => {
        // if (h.marker) {
        //     return;
        // }
        const near = grid.neighborsOf(h);

        const set = new Set(near.map(n => n.marker));
        set.delete(undefined);
        if (set.size === 0) {
            const marker = counter.size + 1
            const marked: InternalHex[] = [];
            counter.set(marker, marked);
            h.marker = marker;
            near.forEach(n => n.marker = marker);

            marked.push(h, ...near);
        }
        if (set.size === 1) {
            const marker = Array.from(set)[0];
            h.marker = marker;
            near.forEach(n => n.marker = marker);

            counter.get(marker).push(h, ...near);
        }
        if (set.size > 1) {
            const groups = Array.from(set.values());

            const sizes = groups.map(g => counter.get(g).length);
            const max = Math.max(...sizes);
            const marker = groups[sizes.indexOf(max)];
            h.marker = marker;
            counter.get(marker).push(h);
            for (const group of groups.filter(g => g !== marker)) {
                const array = counter.get(group);
                counter.set(group, []);
                array.forEach(h => h.marker = marker);
                counter.get(marker).push(...array);
            }
        }
    });
}

interface GenLevelOpts {
    width: number;
    height: number;
    baseSize: number;
    holes?: number;
    maxHoleSize?: number;
    growFactor?: number;
}

const data = new WeakMap<Honeycomb.Hex, Tile>();

function makeTile() {
    const tile = new Tile();
    onPropChange(tile, ["owner", "placement"], () => {
        tile[versionKey]++;
    });

    return tile;
}

export function generateLevel<T extends Honeycomb.Hex>(opts: GenLevelOpts) {
    const HexDef = Honeycomb.extendHex({
        size: opts.baseSize,           // default: 1
        orientation: "flat", // default: 'pointy'

        // get model() {
        //     return data.get(this) || data.set(this, makeTile()).get(this);
        // }
    });

    // this hack here because extendHex use Object.assign to extend prototype
    // so model getter becomes a regular field and all hexes share the same one
    Object.defineProperty(Object.getPrototypeOf(HexDef()), "model", {
        configurable: false,
        enumerable: false,
        get() {
            return data.get(this) || data.set(this, makeTile()).get(this);
        }
    });

    const Grid = Honeycomb.defineGrid(HexDef);

    let grid = Grid.rectangle({ width: opts.width, height: opts.height });

    const holes = [];
    const checked = new Set();
    for (let i = 0; i < opts.holes; i++) {
        const hex = markRemoved(grid, { x: rand(opts.width), y: rand(opts.height) });
        holes.push(hex);
        checked.add(hex);
    }

    function growHole(hole: Honeycomb.Hex, level: number) {
        if (level === 0) {
            return;
        }
        const toChoose = grid.neighborsOf(hole).filter(hex => !checked.has(hex));

        const item = sample(toChoose);
        if (item) {
            checked.add(item);
            markRemoved(grid, item);

            growHole(item, level - 1);
        }
    }

    for (const hole of holes) {
        if (opts.maxHoleSize) {
            const level = computeGrowLevel(opts.maxHoleSize, opts.growFactor);
            console.log(opts.maxHoleSize, opts.growFactor, level)
            growHole(hole, level);
        }
    }

    grid = Grid([...grid.filter(hex => !removedHexes.has(hex))]);

    // for testing purpose
    globalThis.Grid = Honeycomb.Grid;
    globalThis.Honeycomb = Honeycomb;

    buildFastNeighbors(grid);

    // TODO: check if all hexes makes one cluster
    // groupHexes(grid, grid);
    
    return grid;
}
