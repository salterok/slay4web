import * as Honeycomb from "honeycomb-grid";
import { Tile, GameHex } from "../Map/mapGenerator";
import RandomProvider from "@develup/manageable-random";

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

export function createState(seed: number) {
    const data = new Map<GameHex, Slot>();

    const random = new RandomProvider(seed);

    function createSlot(hex: GameHex): Slot {
        function onPropsChange<T>(propName: string, prevValue: T, nextValue: T) {
            incVersion(hex);
        }

        const tile = new Tile(hex);
        onPropChange(tile, Object.getOwnPropertyNames(tile) as any, onPropsChange);

        return {
            version: 0,
            data: tile,
        }
    }

    function incVersion(hex: GameHex): void {
        data.get(hex).version++;
    }

    function Session() {
        const sessionKey = Symbol("StateSession");
        let version = 0;
        console.log("NEW SESSION", sessionKey, data)

        for (const slot of data.values()) {
            (slot as any)[sessionKey] = [(slot.data as any)[shadowPropsKey]];
            (slot.data as any)[shadowPropsKey] = Object.assign({}, (slot.data as any)[shadowPropsKey]);
        }

        return {
            random,
            get(hex: GameHex): Tile {
                return (data.get(hex) || data.set(hex, createSlot(hex)).get(hex)).data;
            },
    
            versionOf(hex: GameHex) {
                return data.get(hex).version;
            },
    
            beginSession() {
                return Session();
            },

            checkpoint() {
                version++;
                for (const slot of data.values()) {
                    (slot as any)[sessionKey][version] = (slot.data as any)[shadowPropsKey];
                    (slot.data as any)[shadowPropsKey] = Object.assign({}, (slot.data as any)[shadowPropsKey]);
                    slot.version++;
                }
            },
    
            applySession() {
                for (const slot of data.values()) {
                    delete (slot as any)[sessionKey];
                }
            },

            reset() {
                for (const slot of data.values()) {
                    (slot.data as any)[shadowPropsKey] = (slot as any)[sessionKey][0];
                    delete (slot as any)[sessionKey];
                    slot.version++;
                }
            },
        }
    }

    return Session();
}