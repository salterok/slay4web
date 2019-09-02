import * as React from "react"

import { Game } from "../Game";
import { prepareGameEnvironment } from "./envPrepare";
import UserActionContext from "./UserActionContext";

export class GameHolder extends React.Component {

    async componentDidMount() {
        const gameContainer = document.getElementById("game-container");


        const { app, changeCursor, grid } = await prepareGameEnvironment(gameContainer);

        gameContainer.appendChild(app.view);

        app.ticker.start();

        const listener = this.context;
    
        listener.reactStateChanged((type, data) => {
            switch (type) {
                case "updateCursor":
                    changeCursor(data);
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
    
                        initial = yield action;
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
