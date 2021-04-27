const sdk = require('cue-sdk');
const details = sdk.CorsairPerformProtocolHandshake();
const fastnoise = require('fastnoisejs')
const config = require("./config")
const noise = fastnoise.Create(Math.random() * 10000)

noise.SetNoiseType(fastnoise.Simplex)

var colors = config.colours
if (config.hsb) {
    colors = colors.map(c => RGBtoHSV(...c))
}


function RGBtoHSV(r, g, b) {
    if (arguments.length === 1) {
        g = r.g, b = r.b, r = r.r;
    }
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return [h,s,v];
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
    ];
}


// takes a percent from 0.0 - 1.0 and calculates the two nearest colors in the colors table so that they can be blended
// returns [color,color,percent]
function calculateNearestColors(percent) {
    var percentPerColor = 1/(colors.length-1)
    var left = Math.floor(percent / percentPerColor)
    var right = Math.ceil(percent / percentPerColor)
    var min = left * percentPerColor
    return [colors[left],colors[right],(percent - min) / percentPerColor]
}

// lifted from p5.js
function lerp(start,stop,amt) {
    
    return amt * (stop - start) + start;
}


function lerpColors(color1,color2,amt) {
    return [
        lerp(color1[0],color2[0],amt),
        lerp(color1[1],color2[1],amt),
        lerp(color1[2],color2[2],amt)
    ]
}

function getColorAt(percent) {
    percent = Math.abs(percent)
    if (percent > 1) {console.warn(percent,"> 1. fuck may hit the shit")}
    if (percent < 0) {console.warn(percent,"< 0. fuck may hit the shit")}
    var lerped = lerpColors(...calculateNearestColors(percent))
    return config.hsb ? HSVtoRGB(...lerped) : lerped
}



console.log(details)
const errCode = sdk.CorsairGetLastError();
console.log(errCode)
if (errCode !== 0) {
    console.error("Error code returned", sdk.CorsairErrorString[sdk.CorsairGetLastError()])
    process.exit()
    
}
var frame = 0

function doDevice(i) {
    // get light positions on device
    const positions = sdk.CorsairGetLedPositionsByDeviceIndex(i);
    console.log(positions)
    
    function raf() {
        // draw image to canvas
        var colors = []
        // for each led average the color of the area that it is placed ad
        frame += config.speed;
        for (var c of positions) {
            var nois = noise.GetNoise(c.left * config.zoom,c.top * config.zoom,frame)
            var color = getColorAt(nois)
            
            // push the color of the led to the buffer to be pushed to the keyboard
            colors.push({ledId: c.ledId,
                r: Math.floor(color[0]),
                g: Math.floor(color[1]),
                b: Math.floor(color[2]) 
            })
            
        }
        // flush the buffer to the keyboard
        sdk.CorsairSetLedsColorsBufferByDeviceIndex(i, colors);
        sdk.CorsairSetLedsColorsFlushBuffer();
        
        
    }
    // run at 30 fps
    setInterval(raf,33)
}
// get a list of devices
const n = sdk.CorsairGetDeviceCount();

// select the devices to be updated
for (let i = 0; i < n; ++i) {
    const info = sdk.CorsairGetDeviceInfo(i);
    console.log(info)
    if (info.capsMask & sdk.CorsairDeviceCaps.CDC_Lighting) {
        doDevice(i)
    }
}