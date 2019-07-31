/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-19 16:48:26 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-07-31 04:49:41
 */

import * as PIXI from "pixi.js";

const TypeField = Symbol();
const BuildingField = Symbol();

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

        this.needUpdate = true;
        this.lastModelVersion = -1;
    }

    init() {
        // TODO: cleanup listeners
        this.view.addListener("mouseover", () => {
            this.state.hover = true;
            this.needUpdate = true;
            // console.log("mouseover", this.cell.toPoint())
        });
        this.view.addListener("mouseout", () => {
            this.state.hover = false;
            this.needUpdate = true;
            // console.log("mouseout", this.cell.toPoint())
        });
        // test code
        this.view.addListener("click", (e) => {
            const p = /m(\d)/i.exec(this.cell.model.placement) || ["m0", "0"];
            this.cell.model.placement = p[1] >= 4 ? "m1" : "m" + ++p[1];
        });
    }

    update() {
        const { model } = this.cell;
        const modelVersion = model.getVersion();
        // TODO: maybe we need forced updates in some cases in the future
        if (!this.needUpdate && this.lastModelVersion === modelVersion) {
            return;
        }
        this.lastModelVersion = modelVersion;
        this.needUpdate = false;

        const { hover } = this.state;
        const { owner, placement, isCapital } = model;
        const point = this.cell.toPoint();

        this.view.clear();

        if (hover) {
            this.view.lineStyle(2, 0x996633);
            // this.view.zIndex = 1;
        }
        else {
            this.view.lineStyle(1, 0x999999);
        }


        const ownerInfo = model.getOwnerInfo();
        
        // landType[player].color
        this.view.beginFill(ownerInfo.color);
        

        const corners = this.cell.corners().map(corner => corner.add(point));
        // separate the first from the other corners
        const [firstCorner, ...otherCorners] = corners;
    
        // move the "pen" to the first corner
        this.view.moveTo(firstCorner.x, firstCorner.y);
        // draw lines to the other corners
        otherCorners.forEach(({ x, y }) => this.view.lineTo(x, y));
        // finish at the first corner
        this.view.lineTo(firstCorner.x, firstCorner.y);

        const building = isCapital ? "capital" : undefined;

        let child = this.view.getChildByName("building");
        if (!child || child[BuildingField] !== building) {
            if (child) {
                this.view.removeChild(child);
            }
            child = this.renderer(building);
            if (child) {
                child.name = "building";
                child[BuildingField] = building;

                const center = this.cell.center();
                child.x = point.x + center.x;
                child.y = point.y + center.y;
                child.anchor.set(0.5);
                this.view.addChild(child);
            }
        }

        child = this.view.getChildByName("placement");
        if (!child || child[TypeField] !== placement) {
            if (child) {
                this.view.removeChild(child);
            }
            child = this.renderer(placement);
            if (child) {
                child.name = "placement";
                child[TypeField] = placement;

                const center = this.cell.center();
                child.x = point.x + center.x;
                child.y = point.y + center.y;
                child.anchor.set(0.5);
                this.view.addChild(child);
            }
        }

        if (this.__debugFn) {
            const str = this.__debugFn(this);

            if (!this._debugText) {
                this._debugText = new PIXI.Text(str, { fontFamily : "Arial", fontSize: 24, fill : 0xff1010, align : "center" });
            }
            
            const center = this.cell.center();
            this._debugText.x = point.x + center.x;
            this._debugText.y = point.y + center.y;
            this._debugText.anchor.set(0.5);
            this.view.addChild(this._debugText);
        }
    }
    
}