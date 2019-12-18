/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-12-12 17:29:09 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-12-18 16:47:57
 */

declare var global: any;

(global as any).globalThis = global;


// import { Hex } from "./Hex";
import { initGame } from "./core";
import { Game } from "./Game";
import { ActionListener } from "./ui/ActionListener";


doit().catch(console.error);

async function doit() {
    const {
        grid,
        state,
        map,
    } = initGame(5);

    console.log(grid, map);

    const listener = new ActionListener();

    listener.reactStateChanged((type: string, data: {}) => {
        console.log("reactStateChanged:", type, data);
    });

    const pl: PlayerController = {
        postChanges(type: string, data: {}) {
            listener.post(type, data);
        },
        async *getActions(initial) {
            listener.isActive = true;
            try {
                while (initial.timeLeft > 0) {
                    const action = await listener.waitForAction();

                    const result = yield action;
                }
            }
            finally {
                listener.isActive = false;
            }
        }
    };
    const bot: PlayerController = {
        postChanges(type: string, data: {}) {
            
        },
        async *getActions(initial) {
            while (initial.timeLeft > 0) {
                yield new Promise<TurnAction>((res) => setTimeout(res, 40, { type: "ZZ", data: 1 }));
                // break;
                // yield { type: "some turn", data: initial.timeLeft, result: 1 };
            }
        }
    }
    
    const game = new Game(map, state, [pl, bot]);

    // // setInterval(async () => {
    // //     await game.turn();
    // // }, 400)


    console.log(state.random.getState());
    return;

    console.clear();
    while (true) {


        await Promise.all([
            game.turn(),
            new Promise((res, rej) => {
                listener.handle.emit("RESET_SELECTION", null);


                res();
            })
        ]);


    }

    // // listener.handle.emit("CLICK_ON_HEX", e.target.__wrapperInst.cell.coordinates());
    // // listener.handle.emit("RESET_SELECTION");

}


setInterval(() => {}, 1000);
