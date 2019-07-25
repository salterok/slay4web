/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-19 21:38:49 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-07-25 07:48:40
 */

import "./patcher";
import * as PIXI from "pixi.js";
import * as Viewport from "imports-loader?PIXI=pixi.js!pixi-viewport";
import * as Honeycomb from "honeycomb-grid";
import { Hex } from "./Hex";
import { generateLevel } from "./mapGenerator";

import { Game } from "./Game";

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

function prepareSprite(textures, name) {
    const texture = PIXI.RenderTexture.create({ width: 18, height: 28 });

    const sprite = new PIXI.TilingSprite(textures[name]);
    sprite.mask = new PIXI.TilingSprite(textures[name + "-mask"]);

    app.renderer.render(sprite, texture);
    
    texture.cacheAsBitmap = true;
    
    return texture;
}

function setup() {
    const textures = loader.resources["main"].textures;
    console.log("loaded", textures);

    const m1 = prepareSprite(textures, "m1");
    const m2 = prepareSprite(textures, "m2");
    const m3 = prepareSprite(textures, "m3");
    const m4 = prepareSprite(textures, "m4");

    const ownCapital = prepareSprite(textures, "ownCapital");
    const capital = prepareSprite(textures, "capital");
    const fort = prepareSprite(textures, "fort");
    const tree = prepareSprite(textures, "tree");
    const deadPlace = prepareSprite(textures, "deadPlace");

    const cellContentRenderer = (type) => {
        switch (type) {
            case "m1":
                return new PIXI.Sprite(m1);
            case "m2":
                return new PIXI.Sprite(m2);
            case "m3":
                return new PIXI.Sprite(m3);
            case "m4":
                return new PIXI.Sprite(m4);
        }
        // TODO: return NO_TEXTURE
        return null;
    };

    const grid = prepareMap();

    const pl = {
        async *getActions(initial) {
            while (initial.timeLeft > 0) {
                initial = yield { type: "some turn", time: initial.timeLeft };
            }
        }
    };
    
    const game = new Game(grid, [pl]);

    Hex.prototype.__debugFn = (inst) => {
        return inst.cell.model.owner;
    }

    const renderItems = grid.map(cell => {
        const hex = new Hex(cell, cellContentRenderer);
    
        hex.init();
    
        viewport.addChild(hex.view);
        return hex;
    });
    
    function animate() {
        renderItems.forEach(hex => hex.update());
        // app.render();
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
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

function prepareMap() {
    
    performance.mark("generateLevel:start");
    const grid = generateLevel({
        width: 20, 
        height: 20,
        baseSize,
        holes: 8,
        maxHoleSize: 20,
        growFactor: 0.65,
    });
    performance.mark("generateLevel:end");
    performance.measure("generateLevel", "generateLevel:start", "generateLevel:end");
    
    console.log(grid, Array.from(grid.values()));


    return grid;
}




globalThis.Grid = Grid;
globalThis.Honeycomb = Honeycomb;


// viewport.sortableChildren = true;


