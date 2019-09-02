
export type Listener = (type: string, data: any) => void;

export class ActionListener {
    isActive = false;
    private _listener: Listener;
    private _activeHandle: Promise<{ type: string, data: any }>;
    private _handles: { res: (value: { type: string, data: any }) => void, rej: (err: any) => void };
    private _emitter: { active: boolean; emit(type: string, data: any): void };

    constructor() {
        const that = this;
        this._emitter = {
            get active() {
                return that.isActive;
            },
    
            emit(type: string, data: any) {
                if (this.active) {
                    that._handles.res({ type, data });
                    that._handles = undefined;
                    that._activeHandle = undefined;
                }
            }
        }
    }

    get handle() {
        return this._emitter;
    }

    reactStateChanged(listener: Listener) {
        this._listener = listener;
    }

    waitForAction() {
        if (!this._activeHandle) {
            this._activeHandle = new Promise((res, rej) => {
                this._handles = { res, rej };
            });
        }

        return this._activeHandle;
    }
}
