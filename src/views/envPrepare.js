
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import { Hex } from "../Hex";
import { pick } from "../utils";
import { generateLevel } from "../core/Map/mapGenerator";
import { createState } from "../core/State/Manager";
import code from "text-loader!../hex.glsl";
import { GameMap } from "../core/GameMap";

export function prepareGameEnvironment(gameContainer) {
    const width = gameContainer.clientWidth;
    const height = gameContainer.clientHeight;
    const baseSize = 30;
    const app = new PIXI.Application({
        width: width,
        height: height,
    });
    app.ticker.stop();

    app.loader.add("main", "/content/textures.json");

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

    
    
    const shader = new PIXI.Filter("", code, { corners: [] }); // this.cell.corners()
    app.stage.filters = [shader];

    viewport
        .drag()
        .pinch()
        .wheel()
        .decelerate();

    const grid = prepareMap();

    return new Promise((res, rej) => {
        app.loader.load(() => {
            const textures = setup(app);

            Hex.prototype.__debugFn = (inst) => {
                return inst.cell.model.owner;
            }
            
            const cellContentRenderer = (type) => {
                let texture = textures[type];
                if (!texture) {
                    // TODO: consider NO_TEXTURE or throw
                    return null;
                    
                }
                return new PIXI.Sprite(texture);
            };

            const state = createState();
        
            const renderItems = grid.map(cell => {
                const hex = new Hex(state, cell, cellContentRenderer);
            
                hex.init();
            
                viewport.addChild(hex.view);
                return hex;
            });

            app.ticker.add(deltaTime => {
                renderItems.forEach(hex => hex.update());
            });
        
            // add the viewport to the stage
            app.stage.addChild(viewport);

            const changeCursor = setupCursors(app, pick(textures, "m1", "m2", "m3", "m4", "fort"));

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

            const map = new GameMap(grid, state);
    
            return res({
                app,
                viewport,
                grid,
                state,
                map,
                changeCursor,
            });
        });
    });
}



function setup(app) {
    const textures = app.loader.resources["main"].textures;

    const m1 = prepareSprite(app, textures, "m1");
    const m2 = prepareSprite(app, textures, "m2");
    const m3 = prepareSprite(app, textures, "m3");
    const m4 = prepareSprite(app, textures, "m4");

    const ownCapital = prepareSprite(app, textures, "ownCapital");
    const capital = prepareSprite(app, textures, "capital");
    const fort = prepareSprite(app, textures, "fort");
    const tree = prepareSprite(app, textures, "tree");
    const deadPlace = prepareSprite(app, textures, "deadPlace");

    return {
        m1,
        m2,
        m3,
        m4,
        ownCapital,
        capital,
        fort,
        tree,
        deadPlace,
    };
}

function prepareSprite(app, textures, name) {
    const texture = PIXI.RenderTexture.create({ width: 18, height: 28 });

    const sprite = new PIXI.TilingSprite(textures[name]);
    sprite.mask = new PIXI.TilingSprite(textures[name + "-mask"]);
    
    app.renderer.render(sprite, texture);
    
    texture.cacheAsBitmap = true;
    
    return texture;
}

function setupCursors(app, cursorTypes) {
    const cursor = new PIXI.Sprite();
    cursor.anchor = {x: 0.5, y: 0.5};
    app.stage.addChild(cursor);

    const interaction = app.renderer.plugins.interaction;
    interaction.on("pointermove", (event) => {
        cursor.position = event.data.global;
    });

    function changeCursor(type) {
        const nextCursor = cursorTypes[type];
        if (nextCursor) {
            app.view.style.cursor = "none";
            cursor.texture = nextCursor;
            cursor.visible = true;
        }
        else {
            app.view.style.cursor = "inherit";
            cursor.visible = false;
        }
    }
    return changeCursor;
}

function prepareMap() {
    const baseSize = 30; // TODO: export to config
    
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
