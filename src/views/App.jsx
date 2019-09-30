import * as React from "react";
import { GameHolder } from "./Game";
import UserActionContext from "./UserActionContext";
import { SidePanel } from "./SidePanel";
import { ActionListener } from "../ui/ActionListener";

const listener = new ActionListener();

export default function App() {
    const [zoneInfo, changeZoneInfo] = React.useState(null);

    return (
        <UserActionContext.Provider value={listener}>
            <GameHolder onZoneChange={changeZoneInfo} />
            <SidePanel zoneInfo={zoneInfo} />
        </UserActionContext.Provider>
    );
}
