import * as React from "react"

import { Game } from "../Game";
import { prepareGameEnvironment } from "./envPrepare";
import UserActionContext from "./UserActionContext";
import { Hex } from "../Hex";

export class GameHolder extends React.Component {

    async componentDidMount() {
        const gameContainer = document.getElementById("game-container");



        const { app, viewport, changeCursor, grid, state, map } = await prepareGameEnvironment(gameContainer);

        gameContainer.appendChild(app.view);

        app.ticker.start();

        const listener = this.context;      

        viewport.on("click", (e) => {
            if (e.target.__wrapperInst instanceof Hex) {
                listener.handle.emit("CLICK_ON_HEX", e.target.__wrapperInst.cell.coordinates());
            }
            else {
                listener.handle.emit("RESET_SELECTION");
            }
        });

        listener.reactStateChanged((type, data) => {
            switch (type) {
                case "updateCursor":
                    changeCursor(data);
                    return;
                case "updateZoneInfo":
                    this.props.onZoneChange(data);
                    return;
                case "zoneSelected":
                    // updateZoneSelection();
                    return;
            }
        });
    
        const pl = {
            postChanges(type, data) {
                listener._listener(type, data);
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
        const bot = {
            postChanges(type, data) {
                
            },
            async *getActions(initial) {
                while (initial.timeLeft > 0) {
                    yield new Promise((res) => setTimeout(res, 40, { type: "ZZ"}));
                    break;
                    // initial = yield { type: "some turn", time: initial.timeLeft };
                }
            }
        }
        
        const game = new Game(map, state, [pl, bot, bot, bot, bot]);
    
        // setInterval(async () => {
        //     await game.turn();
        // }, 400)
    
        setTimeout(() => {
            console.clear();
            game.turn();
        }, 1500);

    }

    shouldComponentUpdate() {
        return false;
    }

    render() {
        return (
            <div id="game-container" className="game-container"></div>
        );
    }
}

GameHolder.contextType = UserActionContext;
