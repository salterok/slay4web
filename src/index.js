import * as PIXI from "pixi.js";
import * as Viewport from "imports-loader?PIXI=pixi.js!pixi-viewport";
import * as Honeycomb from "honeycomb-grid";
import { Hex } from "./Hex";

const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
});
document.body.appendChild(app.view);

var viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerWidth,
    worldWidth: 20 * 30 + 1000,
    worldHeight: 20 * 30 + 1000,

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
    size: 90,           // default: 1
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
