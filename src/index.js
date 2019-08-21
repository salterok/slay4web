/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-19 21:38:49 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-08-21 15:12:31
 */

import "./patcher";
import * as PIXI from "pixi.js";
import * as Viewport from "imports-loader?PIXI=pixi.js!pixi-viewport";
import * as Honeycomb from "honeycomb-grid";
import { Hex } from "./Hex";
import { generateLevel } from "./mapGenerator";

import { Game } from "./Game";


const gameContainer = document.getElementById("game-container");

const width = gameContainer.clientWidth;
const height = gameContainer.clientHeight;
const baseSize = 30;

const app = new PIXI.Application({
    width: width,
    height: height,
});

gameContainer.appendChild(app.view);

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
            case "capital":
                return new PIXI.Sprite(capital);
        }
        // TODO: return NO_TEXTURE
        return null;
    };

    function setupCursors() {

        const cursor = new PIXI.Sprite();
        cursor.anchor = {x: 0.35, y: 0.25}; // position specific to where the actual cursor point is
        app.stage.addChild(cursor);

        cursor.texture = m1;

        const interaction = app.renderer.plugins.interaction;

        interaction.on("pointerover", () => {
            cursor.visible = true;
        });
        interaction.on("pointerout", () => {
            cursor.visible = false;
        });
        interaction.on("pointermove", (event) => {
            cursor.position = event.data.global;
        });

        let i = 0;
        setInterval(() => {
            cursor.texture = [m1, m2, m3, m4][i++ % 4];
        }, 2000)
        app.cursor = "default";

        // console.log(dataUrl)
    }

    setupCursors();

    const grid = prepareMap();

    class ActionListener {
        

        constructor() {
            this.isActive = false;
            const that = this;
            this._emitter = {
                get active() {
                    return that.isActive;
                },

                emit(type, data) {
                    if (this.active) {
                        that._handles.res({ type, data });
                        that._handles = undefined;
                        that._activeHandle = undefined;
                    }
                }
            }
        }

        get handle() {
            return this._emitter;
        }

        waitForAction() {
            if (!this._activeHandle) {
                this._activeHandle = new Promise((res, rej) => {
                    this._handles = { res, rej };
                });
            }

            return this._activeHandle;
        }
    }

    const listener = new ActionListener();

    document.querySelector(".units").addEventListener("click", (e) => {
        listener.handle.emit(e.target.dataset["action"]);
    });

    const pl = {
        async *getActions(initial) {
            listener.isActive = true;
            try {
                while (initial.timeLeft > 0) {
                    const action = await listener.waitForAction();

                    initial = yield action;
                }
            }
            finally {
                listener.isActive = false;
            }
        }
    };
    const bot = {
        async *getActions(initial) {
            while (initial.timeLeft > 0) {
                return yield new Promise((res) => setTimeout(res, 40));
                // initial = yield { type: "some turn", time: initial.timeLeft };
            }
        }
    }
    
    const game = new Game(grid, [pl, bot, bot, bot, bot]);

    // setInterval(async () => {
    //     await game.turn();
    // }, 400)

    game.turn();

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

// viewport.sortableChildren = true;


