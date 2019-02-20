/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-19 21:38:49 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-02-20 19:20:55
 */

import "./patcher";
import * as PIXI from "pixi.js";
import * as Viewport from "imports-loader?PIXI=pixi.js!pixi-viewport";
import * as Honeycomb from "honeycomb-grid";
import { Hex } from "./Hex";

const width = window.innerWidth;
const height = window.innerHeight;
const baseSize = 30;

const app = new PIXI.Application({
    width: width,
    height: height,
});
document.body.appendChild(app.view);

const loader = new PIXI.Loader();

loader
  .add("main", "/content/textures.json");


loader.load(setup);

function setup() {
    const textures = loader.resources["main"].textures;
    console.log("loaded", textures);

    const sprite = new PIXI.TilingSprite(textures.m1);

    sprite.mask = new PIXI.TilingSprite(textures["m1-mask"]);

    // sprite.tint = 0xff0000;

    sprite.interactive = true;
    sprite.buttonMode = true;

    // sprite.x = 20;
    // sprite.scale = 32;
    // sprite.width = baseSize * 5;
    // sprite.height = baseSize * ;
    sprite.cacheAsBitmap = true;
    viewport.addChild(sprite);
}

const background = new PIXI.Graphics();

background.beginFill(0x33A1DE);
background.drawRect(0, 0, width, height);

app.stage.addChild(background);

var viewport = new Viewport({
    screenWidth: width,
    screenHeight: height,
    worldWidth: 20 * baseSize + 1000,
    worldHeight: 20 * baseSize + 1000,

    interaction: app.renderer.plugins.interaction // the interaction module is important for wheel() to work properly when renderer.view is placed or scaled
});

viewport
    .drag()
    .pinch()
    .wheel()
    .decelerate();

// add the viewport to the stage
app.stage.addChild(viewport);

const HexDef = Honeycomb.extendHex({
    size: baseSize,           // default: 1
    orientation: "flat" // default: 'pointy'
});

const Grid = Honeycomb.defineGrid(HexDef);

const REMOVED = Symbol("REMOVED");
/**
 * 
 * @param {Honeycomb.Grid<Honeycomb.Hex<{}>>} grid 
 * @param {Honeycomb.PointLike} hex
 * @returns {Honeycomb.Hex<{}>}
 */
function markRemoved(grid, hex) {
    const index = grid.indexOf(hex);
    if (index !== -1) {
        grid[index][REMOVED] = true;
        return grid[index];
    }
}

function rand(max, min = 0) {
    return min + (max * Math.random()) | 0;
}

function sample(arr) {
    return arr[rand(arr.length)];
}

/**
 * Computes new hole size using binary partitioning based on growFactor
 * @param {number} maxLevel 
 * @param {number} growFactor 
 */
function computeGrowLevel(maxLevel, growFactor) {
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

function markAreas(grid) {
    let counter = new Map();
    grid.forEach(h => {
        const near = grid.neighborsOf(h);

        const set = new Set(near.map(n => n.marker));
        set.delete(undefined);
        if (set.size === 0) {
            const marker = counter.size + 1
            const marked = [];
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

/**
 * 
 * @param {{ width: number; height: number, maxHoleSize: number; growFactor: number; Grid: Honeycomb.GridFactory<Honeycomb.Hex<{}>>}} opts 
 */
function generateLevel(opts) {    
    let grid = opts.Grid.rectangle({ width: opts.width, height: opts.height });

    const startHoles = 5;
    const holes = [];
    const checked = new Set();
    for (let i = 0; i < startHoles; i++) {
        const hex = markRemoved(grid, { x: rand(opts.width), y: rand(opts.height) });
        holes.push(hex);
        checked.add(hex);
    }

    function growHole(hole, level) {
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

    grid = new opts.Grid([...grid.filter(hex => !hex[REMOVED])]);

    markAreas(grid);
    
    return grid;
}

const grid = generateLevel({
    Grid,
    width: 20, 
    height: 20,
    maxHoleSize: 80,
    growFactor: 0.9,
});

console.log(grid, Array.from(grid.values()));


// viewport.sortableChildren = true;

const renderItems = grid.map(cell => {
    const hex = new Hex(cell);

    hex.init();

    viewport.addChild(hex.view);
    return hex;
});

function animate() {
    renderItems.forEach(hex => hex.update());
    app.render();
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
