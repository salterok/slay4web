import * as React from "react"
import UserActionContext from "./UserActionContext";

export function SidePanel(props) {
    const listener = React.useContext(UserActionContext);

    const handleUnitClick = React.useCallback((e) => {
        const actionType = e.target.dataset["action"];
        if (actionType) {
            listener.handle.emit(actionType);
        }
    }, []);

    const zoneInfo = props.zoneInfo || { gold: "-", income: "-" };

    return (
        <div className="gui-panel" onClick={handleUnitClick}>

            <div className="stats">

            </div>
            <div className="zone-info">
                <pre>
                    Gold: { zoneInfo.gold }
                    <br />
                    Income: { zoneInfo.income }
                </pre>
            </div>
            <div className="units">
                <button data-action="CREATE_UNIT">Unit</button>
                <button data-action="CREATE_BUILDING">Tower</button>

            </div>
            <div className="footer">
                <button data-action="END_TURN">End turn</button>
            </div>
            
        </div>
    );
}