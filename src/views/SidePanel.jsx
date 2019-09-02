import * as React from "react"
import UserActionContext from "./UserActionContext";

export function SidePanel() {
    const listener = React.useContext(UserActionContext);

    const handleUnitClick = React.useCallback((e) => {
        listener.handle.emit(e.target.dataset["action"]);
    }, []);

    return (
        <div className="gui-panel">
            <div className="units" onClick={handleUnitClick}>
                <button data-action="CREATE_UNIT">Unit</button>
                <button data-action="CREATE_BUILDING">Tower</button>
            </div>
        </div>
    );
}