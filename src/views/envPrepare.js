
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import { Hex } from "../Hex";
import { pick } from "../utils";
import { initGame } from "../core";

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

    background.beginFill(0xDDDDDD);
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
        // .clamp({ direction: "all" })
        .decelerate();

    return new Promise((res, rej) => {
        app.loader.load(() => {
            const textures = setup(app);

            const {
                grid,
                state,
                map,
            } = initGame(5);

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
