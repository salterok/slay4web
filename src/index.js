/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-19 21:38:49 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-02-20 10:50:00
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
const grid = Grid.rectangle({ width: 20, height: 20 });


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
