/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-26 03:32:36 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-07-09 19:59:04
 */

import * as PIXI from "pixi.js";
import "honeycomb-grid";
import { Point, Hex,  } from "honeycomb-grid";
import * as g from "honeycomb-grid";
// import g2 from "honeycomb-grid";



const hex2 = g.extendHex({ mambo: "siisi9s9", goza: () => 2 });

g.defineGrid(hex2);

var a3 = hex2(1, 2);



var a1 = g.Hex({ x: 1, y: 2, o: ""});
var a2 = g.Hex(1, 2, { o: "" });


var a4 = hex2(a2);
a4.o;
a4.mambo;

hex2(1,2, {  })

g.Hex().add({ x: 1, y: 2 })
type z = g.CubePlain;

var a: Point = g.Point();

a.add({ x: 1, y: 2, });

var b = g.Hex({ y: 2, x: 3});
g.Hex([3]);
b.toCartesian({ q: 1, r: 2 })


enum Actions {
    MoveUnit = "moveUnit",
    PlaceBuilding = "placeBuilding",
};

const CANCELLED = Symbol("Cancelled");
/**
 * @param {TurnContractFactory} iterFactory 
 * @param {number} timeLimit 
 * @returns {AsyncIterableIterator<TurnAction>}
 */
async function* listenUntil(iterFactory: TurnContractFactory, timeLimit: number) {
    const startTime = Date.now();
    let timePassed = 0;
    const iter = iterFactory({ timeLeft: timeLimit });

    do {
        timePassed = Date.now() - startTime;
        const action = await Promise.race([
            iter.next({ timeLeft: timeLimit }),
            delay(timeLimit - timePassed).then(() => CANCELLED),
        ]);

        if (action === CANCELLED) {
            return;
        }

        yield action;
    }
    while (true);
}

function delay(delay: number) {
    if (delay <= 0) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    });
}

export class Game {
    
    constructor(public map: GameMap, public players: PlayerController[]) {
    }

    async turn() {


        for (const player of this.players) {

            for await (const action of listenUntil(player.getActions, Infinity)) {
                // TODO: handle user/bot actions
            }
        }
    }
}

class Zone {
    constructor(public capital: any) {
    }

    addTile(hex: any) {

    }
    
    removeTile(hex: any) {

    }
}