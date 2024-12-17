//---

'use strict';

//---

console.clear();

//---

let stats = null;
let gui = null;

//---

let w = 0;
let h = 0;

let animationFrame = null;
let isTouchDevice = false;

const canvas = document.createElement( 'canvas' );
const context = canvas.getContext( '2d', { willReadFrequently: false, alpha: false } );

let imageData = null;
let imageDataWidth = 0;
let data = null;

let buffer = null;
let bufferBorder = 0;

const center = { x: w / 2, y: h / 2 };
const border = { left: 0, top: 1, right: w, bottom: h };

let pointer = { x: 0, y: 0 };
let pointerPos = { x: center.x, y: center.y };
let pointerDownButton = -1;
let pointerActive = false;

const pointerMoveTimeoutTime = 2500;

//---

const particlePropertiesAmount = 7;

let particleAmount = 75000;
let particleHolderLength = 0;
let particleHolder = null;
let particleSpeedFactor = 10;
let particlesRGBMax = 255;
let particlesRGBMin = 25;
let particleSpeedFactorSquare = particleSpeedFactor * particleSpeedFactor;

let deltaTime = 0.175; //0.075;

let waveFrequency = 0.005;
let waveAmplitude = 2;
let windStrength = 0.055;

//---

let clearPixelData = null;
let clearRowSize = 0;
let clearRow = null;

let bgColorR = 17;
let bgColorG = 17;
let bgColorB = 17;

//---

let sinTableLength = 0;
let sinTable = null;

//---

function init() {

    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

    //---

    if ( isTouchDevice === true ) {

        canvas.addEventListener( 'touchmove', cursorMoveHandler, false );
        canvas.addEventListener( 'touchend', cursorLeaveHandler, false );
        canvas.addEventListener( 'touchcancel ', cursorLeaveHandler, false );

    } else {

        canvas.addEventListener( 'pointermove', cursorMoveHandler, false );
        canvas.addEventListener( 'pointerdown', cursorDownHandler, false );
        canvas.addEventListener( 'pointerup', cursorUpHandler, false );
        canvas.addEventListener( 'pointerleave', cursorLeaveHandler, false );

    }

    //---

    setSinusTable();

    //---

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.setProperty( 'display', 'none' );

    document.body.appendChild( stats.domElement );

    //---

    document.body.appendChild( canvas );

    window.addEventListener( 'resize', onResize, false );

    restart();

}

function onResize( event ) {
    
    restart();

}

function restart() {

    const innerWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const innerHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    //---

    w = innerWidth;
    h = innerHeight;

    //---

    canvas.width = w;
    canvas.height = h;

    imageData = context.getImageData( 0, 0, w, h );
    imageDataWidth = imageData.width;
    data = imageData.data;

    buffer = new Uint8Array( w * h );
    buffer.fill( 0 );

    bufferBorder = h;

    //---

    center.x = w * 0.5;
    center.y = h * 0.5;
    
    pointerPos.x = center.x;
    pointerPos.y = center.y;
    pointer.x = center.x;
    pointer.y = center.y;
    
    border.right = w;
    border.bottom = h;

    //---

    setClearImageData();
    setParticles();

    //---
    
    if ( animationFrame != null ) {
    
        cancelAnimFrame( animationFrame );
    
    }
    
    render();

}

//---

function initGUI() {

    const updateParticleAmount = () => {

        particleAmount = guiSetting[ 'particle amount' ];

        setParticles();

    };

    const updateParticleSpeedFactor = () => {

        particleSpeedFactor = guiSetting[ 'particle speed factor' ];

        setParticles();

    };

    const updateParticleDelateTime = () => {

        deltaTime = guiSetting[ 'particle delta time' ];

        setParticles();

    };

    const updateParticleWaveFrequency = () => {

        waveFrequency = guiSetting[ 'particle wave frequency' ];

        setSinusTable();

    };

    const updateParticleWaveAmplitude = () => {

        waveAmplitude = guiSetting[ 'particle wave amplitude' ];

        setSinusTable();

    };

    const updateParticleWindStrength = () => {

        windStrength = guiSetting[ 'particle wind strength' ];

        setParticles();

    };

    const removeParticles = () => {

        buffer.fill( 0 );

    };

    const updateBackgroundColor = () => {

        bgColorR = Math.floor( guiSetting[ 'particle bg' ][ 0 ] );
        bgColorG = Math.floor( guiSetting[ 'particle bg' ][ 1 ] );
        bgColorB = Math.floor( guiSetting[ 'particle bg' ][ 2 ] );

        setClearImageData();

    };

    const updateBrightestParticleColor = () => {

        particlesRGBMax = guiSetting[ 'particle brightest' ];

        setParticles();

    };

    const updateDarkestParticleColor = () => {

        particlesRGBMin = guiSetting[ 'particle darkest' ];
        console.log( particlesRGBMin );

        setParticles();

    };

    const toggleStats = () => {

        const styleDisplay = getComputedStyle( stats.domElement ).getPropertyValue( 'display' ).trim();

        if ( styleDisplay === 'block' ) {

            stats.domElement.style.setProperty( 'display', 'none' );

        } else {

            stats.domElement.style.setProperty( 'display', 'block' );

        }

    };

    const linkTo = () => {

        window.open( 'https://x.com/niklaswebdev', '_parent' );

    };

    //---

    const guiSetting = {

        'particle amount': particleAmount,
        'particle speed factor': particleSpeedFactor,
        'particle delta time': deltaTime,
        'particle wave frequency': waveFrequency,
        'particle wave amplitude': waveAmplitude,
        'particle wind strength': windStrength,
        'particle clear': removeParticles,
        'particle bg': [ bgColorR, bgColorG, bgColorB ],
        'particle brightest': particlesRGBMax,
        'particle darkest': particlesRGBMin,
        'toggle stats': toggleStats,
        '@niklaswebdev': linkTo,

    };

    //---

    gui = new dat.GUI( { width: 320 } );
    gui.add( guiSetting, 'particle amount' ).min( 1000 ).max( 500000 ).step( 1 ).onChange( updateParticleAmount );
    gui.add( guiSetting, 'particle speed factor' ).min( 1 ).max( 100 ).step( 1 ).onChange( updateParticleSpeedFactor );
    gui.add( guiSetting, 'particle delta time' ).min( 0.05 ).max( 4.00 ).step( 0.001 ).onChange( updateParticleDelateTime );
    gui.add( guiSetting, 'particle wave frequency' ).min( 0 ).max( 1 ).step( 0.005 ).onChange( updateParticleWaveFrequency );
    gui.add( guiSetting, 'particle wave amplitude' ).min( 0 ).max( 10 ).step( 0.1 ).onChange( updateParticleWaveAmplitude );
    gui.add( guiSetting, 'particle wind strength' ).min( 0.005 ).max( 0.1 ).step( 0.005 ).onChange( updateParticleWindStrength );
    gui.add( guiSetting, 'particle clear' );
    gui.addColor( guiSetting, 'particle bg' ).onChange( updateBackgroundColor );
    gui.add( guiSetting, 'particle brightest' ).min( 0 ).max( 255 ).step( 1 ).onChange( updateBrightestParticleColor );
    gui.add( guiSetting, 'particle darkest' ).min( 0 ).max( 255 ).step( 1 ).onChange( updateDarkestParticleColor );
    gui.add( guiSetting, 'toggle stats' );
    gui.add( guiSetting, '@niklaswebdev' );
    gui.close();

}

//---

function setParticles() {

    particleHolderLength = particleAmount * particlePropertiesAmount;
    particleHolder = new Float32Array( particleHolderLength );

    for ( let i = 0, l = particleHolderLength; i < l; i += particlePropertiesAmount ) {
        
        const rgb = Math.floor( ( i / ( l - 1 ) ) * ( particlesRGBMax - particlesRGBMin ) ) + particlesRGBMin;
        const speed = ( rgb / 255 ) * particleSpeedFactor;
        const startTime = Math.random();

        const x = Math.round( Math.random() * w );
        const y = Math.round( Math.random() * ( h + particleSpeedFactorSquare ) ) - particleSpeedFactorSquare;
        const vy = speed;
        const r = rgb;
        const g = rgb;
        const b = rgb;

        particleHolder[ i     ] = x;
        particleHolder[ i + 1 ] = y;
        particleHolder[ i + 2 ] = vy;
        particleHolder[ i + 3 ] = r;
        particleHolder[ i + 4 ] = g;
        particleHolder[ i + 5 ] = b;
        particleHolder[ i + 6 ] = startTime;

    }

}

//---

function cursorDownHandler( event ) {

    pointerDownButton = event.button;

}

function cursorUpHandler( event ) {

    pointerDownButton = -1;

}

function cursorLeaveHandler( event ) {

    pointerPos.x = center.x;
    pointerPos.y = center.y;
    pointerDownButton = -1;
    pointerActive = false;

}

function cursorMoveHandler( event ) {

    pointerActive = true;
    pointerPos = getCursorPosition( canvas, event );

}

function getCursorPosition( element, event ) {

    const rect = element.getBoundingClientRect();
    const position = { x: 0, y: 0 };

    if ( event.type === 'mousemove' || event.type === 'pointermove' ) {

        position.x = event.pageX - rect.left; //event.clientX
        position.y = event.pageY - rect.top; //event.clientY

    } else if ( event.type === 'touchmove' ) {

        position.x = event.touches[ 0 ].pageX - rect.left;
        position.y = event.touches[ 0 ].pageY - rect.top;

    }

    return position;

}

//---

function setSinusTable() {

    sinTableLength = Math.ceil( ( 2 * Math.PI ) / waveFrequency );
    sinTable = new Float32Array( sinTableLength );

    for ( let i = 0; i < sinTableLength; i++ ) {

        const time = i * waveFrequency;

        sinTable[ i ] = Math.sin( time ) * waveAmplitude;

    }

}

//---

function setClearImageData() {

    clearPixelData = [ bgColorR, bgColorG, bgColorB, 255 ];
    clearRowSize = w * 4;
    clearRow = new Uint8ClampedArray( clearRowSize );

    for ( let i = 0; i < clearRowSize; i += 4 ) {

        clearRow.set( clearPixelData, i );

    }

}

function clearImageData() {

    for ( let y = 0; y < h; y++ ) {

        data.set( clearRow, y * clearRowSize );

    }

}

//---

function draw() {

    const left = border.left;
    const right = border.right;
    const top = border.top;
    const bottom = border.bottom;

    //---

    if ( pointerActive === true ) {

        pointer.x += ( pointerPos.x - pointer.x ) / 10;

    }    else {

        pointer.x += ( center.x - pointer.x ) / 100;

    }

    const distX = pointer.x - center.x;

    //---

    for ( let i = 0, l = particleHolderLength; i < l; i += particlePropertiesAmount ) {

        let x = particleHolder[ i     ];
        let y = particleHolder[ i + 1 ];

        const vy = particleHolder[ i + 2 ];
        const r = particleHolder[ i + 3 ];
        const g = particleHolder[ i + 4 ];
        const b = particleHolder[ i + 5 ];
        const startTime = particleHolder[ i + 6 ];

        //--

        const t = y / h;

        //---

        let vx = distX * windStrength * t;

        const time = startTime + t;

        const sinIndex = ( ( time * sinTableLength ) | 0 ) % sinTableLength;

        vx += sinTable[ sinIndex ] * t;

        x += vx * deltaTime;
        y += vy * deltaTime;

        //---

        if ( x > right ) {

            x = left;

        }

        if ( x < left ) {

            x = right;

        }

        if ( y > bottom ) {

            y = top - particleSpeedFactorSquare;

        }

        //---

        particleHolder[ i     ] = x;
        particleHolder[ i + 1 ] = y;

        //---

        if ( y <= top ) {

            continue;

        }

        //---

        if ( x > left && x < right && y > top && y < bottom ) {

            const xRounded = x | 0;
            const yRounded = y | 0;

            const yRoundedNext = yRounded + 1;

            //---

            const indexImageData = ( xRounded + yRounded * imageDataWidth ) * 4;

            //---

            data[ indexImageData     ] = r;
            data[ indexImageData + 1 ] = g;
            data[ indexImageData + 2 ] = b;
            data[ indexImageData + 3 ] = 255;

            //---

            if ( yRounded < bufferBorder - 1 ) {

                continue;

            }

            const indexBuffer = xRounded + yRounded * imageDataWidth;
            const indexBufferBottom = xRounded + yRoundedNext * imageDataWidth;
            const indexBufferLeftBottom = xRounded - 1 + yRoundedNext * imageDataWidth;
            const indexBufferRightBottom = xRounded + 1 + yRoundedNext * imageDataWidth;

            //---

            const setBottom = buffer[ indexBufferBottom ] === 1;
            const setLeft = xRounded === left ? true : buffer[ indexBufferLeftBottom ] === 1;
            const setRight = xRounded === right - 1 ? true : buffer[ indexBufferRightBottom ] === 1;

            if ( yRounded === h - 1 || ( setBottom === true && setLeft === true && setRight === true ) ) {

                buffer[ indexBuffer ] = 1;

                //---

                if ( yRounded < bufferBorder ) {

                    bufferBorder = yRounded;

                }

                //---

                y = top - particleSpeedFactorSquare;

            }

        }

    }

    //---

    for ( let i = 0, l = buffer.length; i < l; i++ ) {

        if ( buffer[ i ] === 1 ) {

            const pixelIndex = i * 4;

            data[ pixelIndex     ] = particlesRGBMax;
            data[ pixelIndex + 1 ] = particlesRGBMax;
            data[ pixelIndex + 2 ] = particlesRGBMax;
            data[ pixelIndex + 3 ] = 255;

        }

    }

}

//---

function render( timestamp ) {

    clearImageData();

    //---

    draw();

    //---

    context.putImageData( imageData, 0, 0 );

    //---

    stats.update();

    //---

    animationFrame = requestAnimFrame( render );

}

window.requestAnimFrame = ( () => {

    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.msRequestAnimationFrame;

} )();

window.cancelAnimFrame = ( () => {

    return  window.cancelAnimationFrame       ||
            window.mozCancelAnimationFrame;

} )();

//---

document.addEventListener( 'DOMContentLoaded', () => {

    init();
    initGUI();

} );

//---