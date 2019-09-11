import * as Honeycomb from "honeycomb-grid";
import { Tile } from "../Map/mapGenerator";

const versionKey = Symbol("version");
const shadowPropsKey = Symbol("shadowProps");



function onPropChange<T extends { [name: string]: any }>(obj: T, propNames: (keyof T)[], fn: (propName: string, prev: unknown, next: unknown) => void) {
    const shadowProps: { [name:string]: any } = {};
    (obj as any)[shadowPropsKey] = shadowProps;
    const overrideProps: { [name: string]: PropertyDescriptor } = {};
    for (const propName of propNames as string[]) {
        shadowProps[propName] = obj[propName];
        overrideProps[propName] = {
            configurable: true,
            enumerable: false,
            get() {
                return shadowProps[propName];
            },
            set(value) {
                fn(propName, shadowProps[propName], shadowProps[propName] = value);
            },
        }
    }
    Object.defineProperties(obj, overrideProps);
}

interface Slot {
    version: number;
    data: Tile;
}

export function createState() {
    const data = new Map<Honeycomb.Hex, Slot>();

    function createSlot(hex: Honeycomb.Hex): Slot {
        function onPropsChange<T>(propName: string, prevValue: T, nextValue: T) {
            incVersion(hex);
        }

        const tile = new Tile();
        onPropChange(tile, Object.getOwnPropertyNames(tile) as any, onPropsChange);

        return {
            version: 0,
            data: tile,
        }
    }

    function incVersion(hex: Honeycomb.Hex): void {
        data.get(hex).version++;
    }

    function Session() {
        const sessionKey = Symbol("StateSession");
        let version = 0;
        console.log("NEW SESSION", sessionKey, data)

        for (const slot of data.values()) {
            slot[sessionKey] = [slot.data[shadowPropsKey]];
            slot.data[shadowPropsKey] = Object.assign({}, slot.data[shadowPropsKey]);
        }

        return {
            get(hex: Honeycomb.Hex): Tile {
                return (data.get(hex) || data.set(hex, createSlot(hex)).get(hex)).data;
            },
    
            versionOf(hex: Honeycomb.Hex) {
                return data.get(hex).version;
            },
    
            beginSession() {
                return Session();
            },

            checkpoint() {
                version++;
                for (const slot of data.values()) {
                    slot[sessionKey][version] = slot.data[shadowPropsKey];
                    slot.data[shadowPropsKey] = Object.assign({}, slot.data[shadowPropsKey]);
                    slot.version++;
                }
            },
    
            applySession() {
                for (const slot of data.values()) {
                    delete slot[sessionKey];
                }
            },

            reset() {
                for (const slot of data.values()) {
                    slot.data[shadowPropsKey] = slot[sessionKey][0];
                    delete slot[sessionKey];
                    slot.version++;
                }
            },
        }
    }

    return Session();
}