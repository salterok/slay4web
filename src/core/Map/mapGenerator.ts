/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-07-20 03:09:02 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-09-30 16:43:28
 */

import * as Honeycomb from "honeycomb-grid";
import { rand, sample } from "../../utils";
import { groupHexes, buildFastNeighbors } from "./utils";

type InternalHex = Honeycomb.Hex<{marker: number}>;

const removedHexes = new Set<Honeycomb.Hex>();

export class Tile {
    owner = 0;
    placement = "";
    isCapital = false;

    constructor(public hex: GameHex) {
        
    }

    getOwnerInfo(): any { return {}; } // this will be substituted by actual implementation from Game.js
}

export type GameHex = Honeycomb.Hex<{ marker: number; model: Tile; }>;

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

export function generateLevel<T extends Honeycomb.Hex>(opts: GenLevelOpts) {
    const HexDef = Honeycomb.extendHex({
        size: opts.baseSize,           // default: 1
        orientation: "flat", // default: 'pointy'
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
