import * as PIXI from "pixi.js";
import code from "text-loader!../hex.glsl";

function drawBorder(corners) {
    const graphics = new PIXI.Graphics();

    graphics.lineStyle(3, 0xf1ac0a);

    // graphics.fillAlpha(1);
    
    // landType[player].color
    // graphics.beginFill(0xf1ac0a, 0.8);

    // separate the first from the other corners
    const [firstCorner, ...otherCorners] = corners;

    // move the "pen" to the first corner
    graphics.moveTo(firstCorner.x, firstCorner.y);
    // draw lines to the other corners
    otherCorners.forEach(({ x, y }) => graphics.lineTo(x, y));
    // finish at the first corner
    graphics.lineTo(firstCorner.x, firstCorner.y);

    const center = {
        x: corners[0].x + (corners[0].x - corners[3].x) / 2,
        y: corners[0].y + (corners[0].y - corners[3].y) / 2,
    };

    console.log("RENDER BORDER", center, corners);

    const radius = 15;

    graphics.beginHole();
    graphics.drawCircle(center.x, center.y, radius);
    graphics.endHole();



    return graphics;
}

export function updateZoneSelection() {
    if (!data) {
        this.viewport.filters = [];
    }
    else {
        /**
         * @type {PIXI.Sprite}
         */
        let v = viewport;

        const g = drawBorder(data.border);
        

        const texture = PIXI.RenderTexture.create({ width: 1000, height: 1000 });

        console.log("RENDER BORDER", v.width, v.height, v.scale);
        
        
        texture.cacheAsBitmap = true;
        app.renderer.render(g, texture);

        // viewport.removeChildren();
        // viewport.addChild(g);

        globalThis.PIXI = PIXI;

        const vertices = [];

        data.border.forEach(p => vertices.push(p.x, p.y));

        var geometry = new PIXI.Geometry().addAttribute('aVertexPosition',
            vertices,
            2
        )
        // .addAttribute('aColor',  // the attribute name
        //               [1, 0, 0,  // r, g, b
        //                0, 1, 0,  // r, g, b
        //                0, 0, 1], // r, g, b
        //                3)        // the size of the attribute
        // .addAttribute('aUvs',  // the attribute name
        //               [0, 0,  // u, v
        //                1, 0,  // u, v
        //                1, 1], // u, v
        //                2)        // the size of the attribute
        

        var vertexSrc = `
        
            precision mediump float;
        
            attribute vec2 aVertexPosition;
            // attribute vec3 aColor;
            // attribute vec2 aUvs;
        
            // uniform mat3 translationMatrix;
            // uniform mat3 projectionMatrix;
        
            // varying vec2 vUvs;
            varying vec3 vColor;
        
            void main() {
        
                // vUvs = aUvs;
                vColor = vec3(1.0, 1.0, 1.0);
                // gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                gl_Position = vec4(aVertexPosition, 0.0, 1.0);
        
            }`;

            
            var fragmentSrc = `

                precision mediump float;

                varying vec3 vColor;
                // varying vec2 vUvs;

                void main() {

                    gl_FragColor = vec4(vColor, 0.0);
                }`;

            
            
        console.log(data.border)
        const shader = new PIXI.Filter(vertexSrc, fragmentSrc, { border: texture, points: data.border, len: data.border.length }); // this.cell.corners()
        var triangle = new PIXI.Mesh(geometry, shader);

        // viewport.removeChildren();
        // viewport.addChild(triangle);

        viewport.filters = [shader];
    }
}