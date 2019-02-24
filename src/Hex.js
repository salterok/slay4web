/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-19 16:48:26 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-02-24 07:52:00
 */

import * as PIXI from "pixi.js";


export class Hex {
    constructor(cell, renderer) {
        const graphics = new PIXI.Graphics();
        graphics.interactive = true;
        this.view = graphics;
        this.cell = cell;
        this.renderer = renderer;
        this.state = {
            hover: false,
        };
        this.model = {
            placement: null,
            player: null,
        };

        // TODO: investigate best way to track if update needed
        this.needUpdate = true;
    }

    init() {
        // TODO: cleanup listeners
        this.view.addListener("mouseover", () => {
            this.state.hover = true;
        });
        this.view.addListener("mouseout", () => {
            this.state.hover = false;
        });
        // test code
        this.view.addListener("click", (e) => {
            this.model.placement = "m1";
        });
    }

    setModel(nextModel) {
        this.model = nextModel;
    }

    update() {
        const { hover } = this.state;
        const { player, placement } = this.model;
        const point = this.cell.toPoint();

        this.view.clear();

        if (hover) {
            this.view.lineStyle(2, 0x996633);
            // this.view.zIndex = 1;
        }
        else {
            this.view.lineStyle(1, 0x999999);
        }
        
        // landType[player].color
        this.view.beginFill(0x95db24);
        

        const corners = this.cell.corners().map(corner => corner.add(point));
        // separate the first from the other corners
        const [firstCorner, ...otherCorners] = corners;
    
        // move the "pen" to the first corner
        this.view.moveTo(firstCorner.x, firstCorner.y);
        // draw lines to the other corners
        otherCorners.forEach(({ x, y }) => this.view.lineTo(x, y));
        // finish at the first corner
        this.view.lineTo(firstCorner.x, firstCorner.y);

        const child = this.renderer(placement);
        if (child) {
            const center = this.cell.center();
            child.x = point.x + center.x;
            child.y = point.y + center.y;
            child.anchor.set(0.5);
            this.view.addChild(child);
        }

        if (this.cell.marker) {
            if (!this.text) {
                this.text = new PIXI.Text(this.cell.marker, { fontFamily : "Arial", fontSize: 24, fill : 0xff1010, align : "center" });
            }
            
            const center = this.cell.center();
            this.text.x = point.x + center.x;
            this.text.y = point.y + center.y;
            this.text.anchor.set(0.5);
            this.view.addChild(this.text);
        }
    }
    
}