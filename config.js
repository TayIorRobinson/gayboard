const { all, cgaNights, flagNonBinary, flagTrans, flagBi, flagLesbian } = require("./presets")

module.exports = {
    // The 'gradient' of the colours. Adjust weighting by duplicating colours
    colours: flagNonBinary,
    // Custom colours can be defined like so
    /* 
    colours: [
        [35,35,35],
        [128, 0, 255],
        [255, 245, 0],
        [255, 255, 255],
    ],
    */
    // uses the HSV namespace instead of RGB
    hsv: false,
    // Speed of the transitions between colours
    speed:   0.1,
    // How large the individual colour blobs are
    zoom: 0.1,
    
}