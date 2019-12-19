/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-07-25 08:31:18 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-12-19 19:00:44
 */

import * as Honeycomb from "honeycomb-grid";

const NeighborsMap = Symbol("NeighborsMap");

export function buildFastNeighbors(grid: Honeycomb.Grid) {
    const pointToHex = new Map<string, Honeycomb.Hex>();
    for (const hex of grid) {
        pointToHex.set(genKey(hex), hex);
    }

    (grid as any)[NeighborsMap] = pointToHex;
}

export function fastGet(grid: Honeycomb.Grid, point: Honeycomb.PointPlain) {
    const pointToHex = (grid as any)[NeighborsMap] as Map<string, Honeycomb.Hex>;
    return pointToHex.get(genKey(point));
}

function genKey(point: Honeycomb.PointPlain) {
    return point.x + "|" + point.y;
}

export function neighborsOf(grid: Honeycomb.Grid, hex: Honeycomb.Hex) {
    const pointToHex = (grid as any)[NeighborsMap] as Map<string, Honeycomb.Hex>;
    const isOdd = hex.x % 2 === 0;
    
    const neighbors: Honeycomb.PointPlain[] = [
        { x: hex.x + 1, y: hex.y + (isOdd ? 0 : 1) }, // right bottom
        { x: hex.x, y: hex.y + 1 }, // bottom
        { x: hex.x - 1, y: hex.y + (isOdd ? 0 : 1) }, // left bottom
        { x: hex.x - 1, y: hex.y - (isOdd ? 1 : 0) }, // left top
        { x: hex.x, y: hex.y - 1 }, // top
        { x: hex.x + 1, y: hex.y - (isOdd ? 1 : 0) }, // right top
    ];

    return neighbors.map(n => pointToHex.get(genKey(n))).filter(Boolean);
}

export function groupHexes<Grid extends Honeycomb.Grid, Hex extends Honeycomb.Hex>(grid: Grid, hexes: Hex[]) {
    let groups: Set<Hex>[] = [];
    const seen = new Set<Hex>();

    for (const h of hexes) {
        if (seen.has(h)) {
            continue;
        }

        seen.add(h);
        const near = neighborsOf(grid, h);

        if (false) {
            // to test for complience with original api
            const orig = grid.neighborsOf(h);

            console.assert(orig.length === near.length, "diff", { near: orig, ourBear: near, h });
            for (let i = 0; i < orig.length; i++) {
                console.assert(orig[i].equals(near[i]), "doesn't match", { n: orig[i], o: near[i] });
            }
        }

        const nearGroups = [...new Set(near.map(n => groups.find(g => g.has(n as Hex))))].filter(g => g);
        if (nearGroups.length === 0) {
            const group = new Set<Hex>();
            groups.push(group);
            group.add(h);
        }
        if (nearGroups.length === 1) {
            const group = Array.from(nearGroups)[0];
            group.add(h);
        }
        if (nearGroups.length > 1) {
            const sizes = nearGroups.map(g => g.size);
            const max = Math.max(...sizes);
            const group = nearGroups[sizes.indexOf(max)];
            group.add(h);

            const groupsToRemove = nearGroups.filter(g => g !== group);

            groups = groups.filter(g => !groupsToRemove.includes(g));

            for (const groupToRemove of groupsToRemove) {
                groups[groups.indexOf(group)] = new Set([...group, ...groupToRemove]);
            }
        }
    }

    return groups.map(g => Array.from(g.values()));
}