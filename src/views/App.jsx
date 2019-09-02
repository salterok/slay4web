import * as React from "react";
import { GameHolder } from "./Game";
import UserActionContext from "./UserActionContext";
import { SidePanel } from "./SidePanel";
import { ActionListener } from "../ui/ActionListener";

const listener = new ActionListener();

export default function App() {

    return (
        <UserActionContext.Provider value={listener}>
            <GameHolder />
            <SidePanel />
        </UserActionContext.Provider>
    );
}
