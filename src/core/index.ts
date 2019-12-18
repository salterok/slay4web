/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-12-13 17:55:24 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-12-18 16:09:29
 */

import { createState } from "../core/State/Manager";
import { GameMap } from "../core/GameMap";
import { generateLevel } from "../core/Map/mapGenerator";
import RandomProvider from "@develup/manageable-random";

export function initGame(seed?: number) {
    const state = createState(seed || RandomProvider.createInitialSeed());
    
    const grid = prepareMap(state);


    const HexDef = Object.getPrototypeOf(grid[0]);

    // this hack here because extendHex use Object.assign to extend prototype
    // so model getter becomes a regular field and all hexes share the same one
    Object.defineProperty(HexDef, "model", {
        configurable: false,
        enumerable: false,
        get() {
            return state.get(this);
        }
    });

    const map = new GameMap(grid as any, state);

    return {
        grid,
        state,
        map,
    };
}

function prepareMap(state: ReturnType<typeof createState>) {
    const baseSize = 30; // TODO: export to config
    
    // performance.mark("generateLevel:start");
    const grid = generateLevel(state.random, {
        // width: 20, 
        // height: 20,
        // baseSize,
        // holes: 8,


        width: 4, 
        height: 4,
        baseSize,
        holes: 0,

        maxHoleSize: 20,
        growFactor: 0.65,
    });
    // performance.mark("generateLevel:end");
    // performance.measure("generateLevel", "generateLevel:start", "generateLevel:end");


    return grid;
}
