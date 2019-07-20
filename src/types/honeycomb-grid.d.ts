
declare module "honeycomb-grid" {

    type WithOptional<T, Props extends keyof T> = Omit<T, Props> & {
        [k in Props]?: T[k];
    };

    namespace HoneycombGrid {

        enum Orientation {
            Flat = "flat",
            Pointy = "pointy",
        }

        enum CompassDirection {
            E = "east",
            SE = "southeast",
            S = "south",
            SW = "southwest",
            W = "west",
            NW = "northwest",
            N = "north",
            NE = "northeast",
        }

        interface PointFactory {
            (): Point;
            (v: number): Point;
            (x: number, y: number): Point;
            (coords: [number?, number?]): Point;   
            (coords: Partial<PointPlain>): Point;
        }

        interface PointPlain {
            x: number;
            y: number;
        }

        interface Point extends PointPlain {
            add: (point: PointPlain) => this;
            subtract: (point: PointPlain) => this;
            multiply: (point: PointPlain) => this;
            divide: (point: PointPlain) => this;
        }

        interface CubePlain {
            q: number;
            r: number;
            s: number;
        }

        interface HexPlain {
            x: number;
            y: number;
        }

        interface HexProto {
            orientation: Orientation;
            origin: PointPlain;
            size: number;
            offset: number;

            cartesian: () => HexPlain;
            toCartesian: (cube: WithOptional<CubePlain, "s">) => HexPlain;
            toCube: (hex: HexPlain) => CubePlain;
            set: (params: Partial<this>) => this;
            coordinates: () => HexPlain;
            cube: () => CubePlain;
            cubeToCartesian: (cube: WithOptional<CubePlain, "s">) => HexPlain;
            cartesianToCube: (hex: HexPlain) => CubePlain;
            isPointy: () => boolean;
            isFlat: () => boolean;
            oppositeCornerDistance: () => number;
            oppositeSideDistance: () => number;
            width: () => number;
            height: () => number;
            corners: () => PointPlain[];
            toPoint: () => PointPlain;
            add: (point: HexPlain | PointPlain) => this;
            subtract: (point: HexPlain | PointPlain) => this;
            equals: (point: HexPlain | PointPlain) => boolean;
            distance: (hex: HexPlain) => number;
            round: () => this;
            lerp: (hex: HexPlain, t: number) => this;
            nudge: () => this;
            toString: () => string;
            thirdCoordinate: (firstCoordinate: number, secondCoordinate: number) => number;
        }

        type Hex<T = {}> = T & HexPlain & CubePlain & HexProto;

        interface HexFactory<T> {
            <N extends {}>(hex: Hex<N>): Hex<T & N>;

            (): Hex<T>;
            (v: number): Hex<T>;
            <N extends {}>(x: number, y: number, props?: N): Hex<T & N>;
            (coords: Partial<HexPlain>): Hex<T>;
            <N extends {}>(coords: HexPlain & N): Hex<T & N>;
            (coords: CubePlain): Hex<T>;

            (coords: [number?, number?]): Hex<T>;   
        }

        interface GridProto<T> extends Array<HexPlain> {
            get(hex: HexPlain): Hex<T>;
            set(hex: HexPlain, props: Hex<T>): this;
            hexesBetween(firstHex: HexPlain, lastHex: HexPlain): Hex<T>[];
            hexesInRange(...args: any[]): Hex<T>[];
            neighborsOf(hex: HexPlain, directions?: (CompassDirection | number)[] | CompassDirection | number | "all", diagonal?: boolean): Hex<T>[];
        }

        type Grid<T> = {};

        interface GridFactory<T> {
            Hex: HexFactory<T>;
            isValidHex(hex: any): boolean;
            pointToHex(point: PointPlain): HexPlain;

            parallelogram(options: { width?: number, height?: number, start?: HexPlain, direction?: number, onCreate?: (hex: Hex<T>) => void }): Grid<T>;
            triangle(options: { size?: number, start?: HexPlain, direction?: number, onCreate?: (hex: Hex<T>) => void }): Grid<T>;
            hexagon(options: { radius?: number, center?: HexPlain, direction?: number, onCreate?: (hex: Hex<T>) => void }): Grid<T>;
            rectangle(options: { width?: number, height?: number, start?: HexPlain, direction?: CompassDirection | number, onCreate?: (hex: Hex<T>) => void }): Grid<T>;

            (...hexes: Hex[]): Grid<T>;
            (hexes: Hex[]): Grid<T>;
            (grid: Grid<T>): Grid<T>;
        }

        var Hex: HexFactory<{}>;
        var Grid: GridFactory<{}>;
        var Point: PointFactory;



        function defineGrid<T>(hexFactory: HexFactory<T>): GridFactory<T>;

        function extendHex<T extends {}>(props?: T): HexFactory<T>;

    }

    // class HoneycombGrid {}

    // var a: typeof HoneycombGrid;
    // export = a;

    
    // export default HoneycombGrid;
    export = HoneycombGrid;
}
