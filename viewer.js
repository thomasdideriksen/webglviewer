'use strict';

//
// Top level namespace
//
var IM = {};

//
// Animator
//
IM.Animator = function() {
    this._animations = {};
}

IM.Animator.prototype = {

    constructor: IM.Animator,

    start: function(name, to, duration, easing, easingParam0) {
        var animation = {
            from: this.get(name),
            to: to,
            duration: duration,
            t0: Date.now(),
            easing: easing || 'EaseOutQuart',
            easingParam0: easingParam0
        };
        this._animations[name] = animation;
    },

    set: function(name, value) {
        this.start(name, value, 0);
    },

    finished: function() {
        for (var key in this._animations) {
            if (!this._animations[key].finished) {
                return false;
            }
        }
        return true;
    },

    getDestination: function(name) {
        var animation = this._animations[name];
        if (!animation) {
            return 0;
        }
        return animation.to;
    },

    get: function(name) {
        var animation = this._animations[name];
        if (!animation) {
            return 0;
        }
        var dt = Date.now() - animation.t0;
        var t = Math.min(1.0, dt / animation.duration);
        if (t < 1.0) {
            switch (animation.easing) {
                case 'EaseOutQuart':
                    t = t - 1.0;
                    t = -(t * t * t * t - 1.0);
                    break;
                case 'EaseOutOvershoot':
                    var s = animation.easingParam0 || 1.70158;
                    t = t - 1.0;
                    t = t * t * ((s + 1.0) * t + s) + 1.0;
                    break;
            }
            return animation.from + t * (animation.to - animation.from);
        } else {
            animation.finished = true;
            return animation.to;
        }
    },
}

//
// 3x3 Matrix namespace
//
IM.Mat3 = {};

IM.Mat3.makeIdentity = function() {
    return new Float32Array([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1]);
}

IM.Mat3.makeTranslation = function(tx, ty) {
    return new Float32Array([
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        tx,  ty,  1.0]);
}

IM.Mat3.makeScale = function(sx, sy) {
    return new Float32Array([
        sx,  0.0, 0.0,
        0.0, sy,  0.0,
        0.0, 0.0, 1.0]);
}

IM.Mat3.makeRotation = function(rad) {
    var sin = Math.sin(rad);
    var cos = Math.cos(rad);
    return new Float32Array([
        cos, -sin, 0.0,
        sin,  cos, 0.0,
        0.0,  0.0, 1.0]);
}

IM.Mat3.multiplyTwo = function(a, b) {
    var res = new Float32Array(9);

    res[0] = a[0] * b[0] + a[3] * b[1] + a[6] * b[2];
    res[3] = a[0] * b[3] + a[3] * b[4] + a[6] * b[5];
    res[6] = a[0] * b[6] + a[3] * b[7] + a[6] * b[8];

    res[1] = a[1] * b[0] + a[4] * b[1] + a[7] * b[2];
    res[4] = a[1] * b[3] + a[4] * b[4] + a[7] * b[5];
    res[7] = a[1] * b[6] + a[4] * b[7] + a[7] * b[8];

    res[2] = a[2] * b[0] + a[5] * b[1] + a[8] * b[2];
    res[5] = a[2] * b[3] + a[5] * b[4] + a[8] * b[5];
    res[8] = a[2] * b[6] + a[5] * b[7] + a[8] * b[8];

    return res;
}

IM.Mat3.transformPoint = function(m, x, y) {
    var res = new Float32Array(2);

    res[0] = m[0] * x + m[3] * y + m[6];
    res[1] = m[1] * x + m[4] * y + m[7];

    return res;
}

IM.Mat3.multiply = function() {
    if (arguments.length < 2) {
        throw 'Matrix multiply function needs two or more parameters';
    }
    var res = IM.Mat3.multiplyTwo(arguments[0], arguments[1]);
    for (var i = 2; i < arguments.length; i++) {
        res = IM.Mat3.multiplyTwo(res, arguments[i]);
    }
    return res;
}

IM.Mat3.transpose = function(a) {
    var res = new Float32Array(9);

    res[0] = a[0];
    res[1] = a[3];
    res[2] = a[6];

    res[3] = a[1];
    res[4] = a[4];
    res[5] = a[7];

    res[6] = a[2];
    res[7] = a[5];
    res[8] = a[8];

    return res;
}

IM.Mat3.determinant = function(a) {
    // http://www.cg.info.hiroshima-cu.ac.jp/~miyazaki/knowledge/teche23.html

    return a[0] * a[4] * a[8] +
           a[1] * a[5] * a[6] +
           a[2] * a[3] * a[7] -
           a[0] * a[5] * a[7] -
           a[2] * a[4] * a[6] -
           a[1] * a[3] * a[8];
}

IM.Mat3.invert = function(a) {
    // http://www.cg.info.hiroshima-cu.ac.jp/~miyazaki/knowledge/teche23.html

    var d = IM.Mat3.determinant(a);
    if (d == 0.0) {
        throw 'Matrix is not invertible';
    }

    var s = 1.0 / d;
    var res = new Float32Array(9);

    res[0] = s * (a[4] * a[8] - a[7] * a[5]);
    res[3] = s * (a[6] * a[5] - a[3] * a[8]);
    res[6] = s * (a[3] * a[7] - a[6] * a[4]);

    res[1] = s * (a[7] * a[2] - a[1] * a[8]);
    res[4] = s * (a[0] * a[8] - a[6] * a[2]);
    res[7] = s * (a[6] * a[1] - a[0] * a[7]);

    res[2] = s * (a[1] * a[5] - a[4] * a[2]);
    res[5] = s * (a[3] * a[2] - a[0] * a[5]);
    res[8] = s * (a[0] * a[4] - a[3] * a[1]);

    return res;
}

IM.Mat3.toString = function(m) {
    var str = '';
    str += '[' + m[0] + ', ' + m[3] + ', ' + m[6] + ']\n';
    str += '[' + m[1] + ', ' + m[4] + ', ' + m[7] + ']\n';
    str += '[' + m[2] + ', ' + m[5] + ', ' + m[8] + ']\n';
    return str
}

//
// Helpers namespace
//
IM.Helpers = {};

//
// XHR GET single
//
IM.Helpers.XHRGet = function(url) {
    return new Promise(function(resolve, reject) {
        var request = new XMLHttpRequest();
        request.addEventListener('load', function() {
            resolve(request.responseText);
        });
        request.addEventListener('error', function() {
            reject('Failed to get: ' + url)
        });
        request.open('GET', url);
        request.send();
    });
}

//
// GL namespace
//
IM.GL = {};

//
// GL Program
//
IM.GL.Program = function(gl, vertexShaderCode, fragmentShaderCode) {
    this._uniforms = {};
    this._attributes = {};
    this._gl = gl;
    this._vertexShader = this._createShader(vertexShaderCode, gl.VERTEX_SHADER);
    this._fragmentShader = this._createShader(fragmentShaderCode, gl.FRAGMENT_SHADER);
    this._program = gl.createProgram();
    gl.attachShader(this._program, this._vertexShader);
    gl.attachShader(this._program, this._fragmentShader);
    gl.linkProgram(this._program);
    if (!gl.getProgramParameter(this._program, gl.LINK_STATUS)) {
        throw gl.getProgramInfoLog(this._program);
    }
}

IM.GL.Program.prototype = {

    constructor: IM.GL.Program,

    _createShader: function(code, type) {
        var gl = this._gl;
        var shader = gl.createShader(type);
        gl.shaderSource(shader, code);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw gl.getShaderInfoLog(shader);
        }
        return shader;
    },

    _findUniform: function(name) {
        if (!(name in this._uniforms)) {
            this._uniforms[name] = this._gl.getUniformLocation(this._program, name);
            if (!this._uniforms[name]) {
                throw 'Invalid uniform: ' + name;
            }
        }
        return this._uniforms[name];
    },

    _findAttribute: function(name) {
        if (!(name in this._attributes)) {
            this._attributes[name] = this._gl.getAttribLocation(this._program, name);
            if (!this._attributes[name] < 0) {
                throw 'Invalid attribute: ' + name;
            }
        }
        return this._attributes[name];
    },

    inUse: function() {
        return (this._gl.getParameter(this._gl.CURRENT_PROGRAM) == this._program);
    },

    use: function() {
        if (!this.inUse()) {
            this._gl.useProgram(this._program);
        }
    },

    getAttributeLocation: function(name) {
        return this._findAttribute(name);
    },

    setUniform1f: function(name, value) {
        this._gl.uniform1f(this._findUniform(name), value);
    },

    setUniform2f: function(name, x, y) {
        this._gl.uniform2f(this._findUniform(name), x, y);
    },

    setUniform1i: function(name, value) {
        this._gl.uniform1i(this._findUniform(name), value);
    },

    setUniformMatrix3fv: function(name, value) {
        this._gl.uniformMatrix3fv(this._findUniform(name), false, value);
    },
}

//
// Make a quad with texture coordinates
//
IM.GL.makeQuad = function(x, y, w, h, texW, texH) {
    return [x, y, 0, 0,               // 0-2
            x, y + h, 0, texH,        // |/
            x + w, y, texW, 0,        // 1
            x, y + h, 0, texH,        //   2
            x + w, y + h, texW, texH, //  /|
            x + w, y, texW, 0];       // 0-1
},

//
// Viewer
//
IM.Viewer = function() {}

IM.Viewer.prototype = {

    constructor: IM.Viewer,

    initialize: async function(config) {

        if (this._initialized) {
            throw 'Viewer object is alrady initialized';
        }

        // Create canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.position = 'absolute';

        // Get WebGL context
        this._gl = this._canvas.getContext('webgl2', { antialias: true, alpha: false, depth: false, stencil: false });
        if (!this._gl) {
            throw 'Failed to get WebGL2 context';
        }

        // Set config
        this._setConfig(config);

        // Add canvas to DOM
        this._config.domContainer.appendChild(this._canvas);

        // Basic WebGL configuration
        var gl = this._gl;
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.STENCIL_TEST);
        gl.disable(gl.CULL_FACE);
        gl.clearColor(this._config.clearColor[0], this._config.clearColor[1], this._config.clearColor[2], 1);

        // Create animator
        this._animator = new IM.Animator();

        // Initialize various state
        this._baseMatrix = IM.Mat3.makeIdentity();
        this._resetState();

        // Register mouse/touch/pointer events handlers
        this._registerPointerEventHandlers();

        // Handle window resize
        var context = this;
        window.addEventListener('resize', function() { context._resize(); });
        this._resize();

        // Load shaders and create GL program
        var vertexShader = IM.Helpers.XHRGet(this._config.vertexShaderUrl);
        var fragmentShader = IM.Helpers.XHRGet(this._config.fragmentShaderUrl);
        this._program = new IM.GL.Program(this._gl, await vertexShader, await fragmentShader);
        this._initialized = true;
    },

    _setConfig: function(config) {

        // Set default config
        this._config = {
            tileSize: 1024,
            vertexShaderUrl: 'viewerVertexShader.glsl',
            fragmentShaderUrl: 'viewerFragmentShader.glsl',
            clearColor: [0.1, 0.1, 0.1],
        }

        // Override defaults with user supplied values
        for (var key in config) {
            this._config[key] = config[key];
        }

        //
        // Sanity checks, etc.
        //

        // Check that we have a DOM container object
        if (!this._config.domContainer) {
            throw '[Viewer configuration] "domContainer" must be specified';
        }

        // Check and fix tile size
        var log2 = Math.log(this._config.tileSize) / Math.log(2);
        var tileSize = Math.pow(2, Math.floor(log2));
        tileSize = Math.max(128, Math.min(tileSize, this._gl.getParameter(this._gl.MAX_TEXTURE_SIZE)));
        if (this._config.tileSize != tileSize) {
            console.warn('[Viewer configuration] Changed "tileSize" from ' + this._config.tileSize + ' to ' + tileSize + ' to improve performance');
            this._config.tileSize = tileSize;
        }
    },

    _resetState: function() {
        // Initialize matrices
        this._transformMatrix = IM.Mat3.makeIdentity();

        // Initialize transformation state
        this._currentScale = 1.0;
        this._currentPosX = 0.0;
        this._currentPosY = 0.0;
        this._currentRotation = 0.0;
        this._intendedRotation = 0.0;

        // Initialize animated values
        this._animator.set('Alpha', 0);
        this._animator.set('Scale', this._currentScale);
        this._animator.set('ScaleCenterX', 0);
        this._animator.set('ScaleCenterY', 0);
        this._animator.set('PosX', this._currentPosX);
        this._animator.set('PosY', this._currentPosY);
        this._animator.set('Rotation', this._currentRotation);
        this._animator.set('RotationCenterX', 0);
        this._animator.set('RotationCenterY', 0);
    },

    _registerPointerEventHandlers: function() {

        var context = this;

        // Mouse event helper function
        var terminateMouseEvent = function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Get position relative to DOM target
        var getPositionFromEvent =  function(e) {
            var clientX = (e.clientX !== undefined) ? e.clientX : e.touches[0].clientX;
            var clientY = (e.clientY !== undefined) ? e.clientY : e.touches[0].clientY;
            var x = clientX - context._canvas.offsetLeft;
            var y = clientY - context._canvas.offsetTop;
            var ratio = context._getDpiRatio();
            return new Float32Array([x * ratio, y * ratio]);
        }

        var getImagePositionFromEvent = function(e) {
            var ptScreen = getPositionFromEvent(e);
            var matrix = context._makeTransformMatrix();
            var matrixInv = IM.Mat3.invert(matrix);
            return IM.Mat3.transformPoint(matrixInv, ptScreen[0], ptScreen[1]);
        }

        // Handle mouse wheel events
        this._canvas.addEventListener('wheel', function(e) {
            var duration = 750;
            var scale = context._animator.get('Scale');
            var factor = (e.deltaY < 0) ? 2.0 : 0.5;
            context._animator.start('Scale', scale * factor, duration);

            var ptImage = getImagePositionFromEvent(e);
            context._animator.set('ScaleCenterX', ptImage[0]);
            context._animator.set('ScaleCenterY', ptImage[1]);

            context._snapIntoView(duration); // Note: Maybe this doesn't belong here
            context._invalidate();

            return terminateMouseEvent(e);
        });

        var pointerStart = function(e, clientX, clientY) {
            context._dragStart = getPositionFromEvent(e);
            context._dragStartPos = [
                context._animator.get('PosX'),
                context._animator.get('PosY')];
            context._animator.set('PosX', context._dragStartPos[0])
            context._animator.set('PosY', context._dragStartPos[1])
            context._invalidate();
            return terminateMouseEvent(e);
        }

        var pointerEnd = function(e) {
            context._dragStart = undefined;
            
            if (moves.length >= 2) {
                
                // Compute delay modifier (aka. we scale the magnitude of the effect depending on time since last move-event)
                var dt = Date.now() - lastMoveTime;
                var timeThreshold = 150;
                dt = Math.min(dt, timeThreshold) / timeThreshold;
                dt = 1 - dt;
                dt = dt * dt * dt * dt;
                
                // Get direction vector
                var dx = moves[0][0] - moves[moves.length - 1][0];
                var dy = moves[0][1] - moves[moves.length - 1][1];
                
                // Normalize direction vector
                var dist = Math.sqrt(dx * dx + dy * dy);
                dx /= dist;
                dy /= dist
                
                // Scale direction vector
                var scale = Math.min(dist, 100) * dt * 4;
                dx *= scale
                dy *= scale
                
                // Compute animation duration
                var duration = Math.max(Math.min(scale * 4, 800), 200)
                
                // Start animation
                var newPosX = context._animator.get('PosX') - dx;
                var newPosY = context._animator.get('PosY') - dy;
                context._animator.start('PosX', newPosX, duration);
                context._animator.start('PosY', newPosY, duration);
                
                // Do boundary collision detection and 'bounce' back if necessary
                var matrix = context._makeTransformMatrix({
                    scale: context._animator.getDestination('Scale'),
                    rotation: context._animator.getDestination('Rotation'),
                    posX: context._animator.getDestination('PosX'),
                    posY: context._animator.getDestination('PosY')});
                
                var rect = context._getImageRect(matrix);
                var x0 = rect.bounds.x0
                var x1 = rect.bounds.x1
                var y0 = rect.bounds.y0
                var y1 = rect.bounds.y1
                
                var width = context._canvas.width
                var height = context._canvas.height
                var overshootScale = 0.05
                var fitX = rect.width < width
                var fitY = rect.height < height
                
                var clampedNewPosX, overshootAmountX
                var clampedNewPosY, overshootAmountY
                
                if ((fitX && x0 < 0) || (!fitX && x0 > 0)) {
                    clampedNewPosX = newPosX - x0
                    overshootAmountX = Math.abs(x0) * overshootScale
                }
                
                if ((fitX && x1 > width) || (!fitX && x1 < width)) {
                    clampedNewPosX = newPosX - (x1 - width)
                    overshootAmountX = Math.abs(x1 - width) * overshootScale
                }
                
                if ((fitY && y0 < 0) || (!fitY && y0 > 0)) {
                    clampedNewPosY = newPosY - y0
                    overshootAmountY = Math.abs(y0) * overshootScale
                }
                
                if ((fitY && y1 > height) || (!fitY && y1 < height)) {
                    clampedNewPosY = newPosY - (y1 - height)
                    overshootAmountY = Math.abs(y1 - height) * overshootScale
                }

                if (clampedNewPosX !== undefined) {
                    context._animator.start('PosX', clampedNewPosX, duration, 'EaseOutOvershoot', overshootAmountX)
                    context._invalidate()
                }
                
                if (clampedNewPosY !== undefined) {
                    context._animator.start('PosY', clampedNewPosY, duration, 'EaseOutOvershoot', overshootAmountY)
                    context._invalidate()
                }
            }
            
            context._snapIntoView(500);
            moves = []
            
            return terminateMouseEvent(e);
        }

        var lastMoveTime;
        var moves = []
        var pointerMove = function(e, clientX, clientY) {
            if (context._dragStart) {
                var pt = getPositionFromEvent(e);
                var dx = pt[0] - context._dragStart[0];
                var dy = pt[1] - context._dragStart[1];
                context._animator.set('PosX', context._dragStartPos[0] + dx);
                context._animator.set('PosY', context._dragStartPos[1] + dy);
                context._invalidate();

                // Note: Store last N positions while moving (used for calculating the direction and magnitude of the "momentum" when the pointer events end)
                lastMoveTime = Date.now();
                moves.push(pt)
                var maxMoves = 4; // N = 4
                if (moves.length > maxMoves) {
                    moves.splice(0, moves.length - maxMoves)
                }

                return terminateMouseEvent(e);
            }
        }

        var initGestureScale;
        var initGestureRotation;
        this._canvas.addEventListener('gesturestart', function(e) {
            var ptImage = getImagePositionFromEvent(e);
            context._animator.set('ScaleCenterX', ptImage[0]);
            context._animator.set('ScaleCenterY', ptImage[1]);
            context._animator.set('RotationCenterX', ptImage[0]);
            context._animator.set('RotationCenterY', ptImage[1]);
            initGestureScale = context._animator.get('Scale');
            initGestureRotation = context._animator.get('Rotation');
        });

        this._canvas.addEventListener('gesturechange', function(e) {
            var deg2rad = function(deg) { return deg / 180 * Math.PI; }
            context._animator.set('Rotation', initGestureRotation - deg2rad(e.rotation));
            context._animator.set('Scale', initGestureScale * e.scale);
            context._invalidate();
        });

        this._canvas.addEventListener('touchstart', function(e) {
            return pointerStart(e, e.touches[0].clientX, e.touches[0].clientY);
        });

        this._canvas.addEventListener('mousedown', function(e) {
            return pointerStart(e, e.clientX, e.clientY);
        });

        this._canvas.addEventListener('touchend', function(e) {
            return pointerEnd(e);
        });

        window.addEventListener('mouseup', function(e) {
            return pointerEnd(e);
        });

        window.addEventListener('mousemove', function(e) {
           return pointerMove(e, e.clientX, e.clientY)
        });

        window.addEventListener('touchmove', function(e) {
           return pointerMove(e, e.touches[0].clientX, e.touches[0].clientY);
        });
    },

    setImageByUrl: function(url) {
        var context = this;
        return new Promise(function(resolve, reject) {
            var im = new Image();
            im.addEventListener('load', function() {
                context.setImage(im);
                resolve();
            });
            im.addEventListener('error', function() {
                reject('Failed to load image: ' + url);
            });
            im.src = url;
        });
    },

    setImage: function(im) {

        var gl = this._gl;

        // Delete old textures if they exist
        if (this._tiles) {
            for (var i = 0; i < this._tiles.length; i++) {
                gl.deleteTexture(this._tiles[i].texture);
            }
        }

        // Create tiles and geometry
        this._tiles = [];
        this._imageSize = [im.width, im.height];
        var buffer = [];
        var tileSize = this._config.tileSize;
        var roundPot = function(x) { return Math.pow(2.0, Math.ceil(Math.log(x) / Math.log(2.0))); }
        for (var y = 0; y < im.height; y += tileSize) {

            var height = Math.min(tileSize, im.height - y);
            var heightPot = roundPot(height);

            for (var x = 0; x < im.width; x += tileSize) {

                var width = Math.min(tileSize, im.width - x);
                var widthPot = roundPot(width);

                // Create tile texture
                var tileIm = this._cropImage(im, x, y, widthPot, heightPot);
                this._tiles.push({
                    texture: this._createTexture(tileIm),
                    x: x,
                    y: y,
                    pixelWidth: widthPot,
                    pixelHeight: heightPot,
                    logicalWidth: width,
                    logicalHeight: height,
                });

                // Create geometry quad and append it to vertex/UV array
                var quad = IM.GL.makeQuad(x, y, width, height, width / widthPot, height / heightPot);
                Array.prototype.push.apply(buffer, quad);
            }
        }

        // Delete old buffer if it already exists
        if (this._buffer) {
            gl.deleteBuffer(this._buffer);
        }

        // Create and initialize new buffer
        this._buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffer), gl.STATIC_DRAW);

        // Use program
        this._program.use();

        // Enable and configure buffer
        var bufferLocation = this._program.getAttributeLocation('data');
        gl.enableVertexAttribArray(bufferLocation); // Note: This operates on the currently bound ARRAY_BUFFER
        gl.vertexAttribPointer(bufferLocation, 4, gl.FLOAT, false, 0, 0);

        // Reset state
        this._resetState();

        // Zoom to fit and fade in
        this.zoomToFit(0);
        this._animator.start('Alpha', 1, 800);
        this._invalidate();
    },

    zoomToFit: function(animDuration) {

        // Scale
        var matrix = this._makeTransformMatrix({
            rotation: this._animator.getDestination('Rotation') });
        var rect = this._getImageRect(matrix);
        var sx = this._canvas.width / rect.bounds.width;
        var sy = this._canvas.height / rect.bounds.height;
        var newScale = this._animator.get('Scale') * Math.min(sx, sy);
        this._animator.start('Scale', newScale, animDuration);

        // Position
        var matrix = this._makeTransformMatrix({
            rotation: this._animator.getDestination('Rotation'),
            scale: this._animator.getDestination('Scale') });
        var rect = this._getImageRect(matrix);
        var x0 = (this._canvas.width - rect.bounds.width) * 0.5;
        var y0 = (this._canvas.height - rect.bounds.height) * 0.5;
        var newPosX = this._animator.get('PosX') + (x0 - rect.bounds.x0);
        var newPosY = this._animator.get('PosY') + (y0 - rect.bounds.y0);
        this._animator.start('PosX', newPosX, animDuration);
        this._animator.start('PosY', newPosY, animDuration);

        this._invalidate();
    },

    zoom: function(scale, animDuration) {

        var matrix = this._makeTransformMatrix({ rotation: this._animator.getDestination('Rotation') });
        var matrixInv = IM.Mat3.invert(matrix);

        var pt0 = IM.Mat3.transformPoint(matrixInv, 0, 0);
        var pt1 = IM.Mat3.transformPoint(matrixInv, this._canvas.width, this._canvas.height);

        var cx = pt0[0] + (pt1[0] - pt0[0]) * 0.5;
        var cy = pt0[1] + (pt1[1] - pt0[1]) * 0.5;

        this._animator.set('ScaleCenterX', cx);
        this._animator.set('ScaleCenterY', cy);

        this._animator.start('Scale', scale, animDuration);
        this._snapIntoView(animDuration); // Note: Maybe this doesn't belong here
        this._invalidate();
    },

    _cropImage: function(im, x, y, width, height) {
        var cvs = document.createElement('canvas');
        cvs.width = width;
        cvs.height = height;
        var ctx = cvs.getContext('2d');
        var maxWidth = im.width - x;
        var maxHeight = im.height - y;
        var w = Math.min(maxWidth, width);
        var h = Math.min(maxHeight, height);
        ctx.drawImage(im, x, y, w, h, 0, 0, w, h);
        return cvs;
    },

    _createTexture: function(im) {
        var gl = this._gl;
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return tex;
    },

    _getDpiRatio: function() {
        var gl = this._gl;
        var devicePixelRatio = window.devicePixelRatio || 1;
        var backingStorePixelRatio = gl.webkitBackingStorePixelRatio ||
                                     gl.mozBackingStorePixelRatio ||
                                     gl.msBackingStorePixelRatio ||
                                     gl.oBackingStorePixelRatio ||
                                     gl.backingStorePixelRatio || 1;
        return devicePixelRatio / backingStorePixelRatio;
    },

    _resize: function() {
        var rect = this._config.domContainer.getBoundingClientRect();

        var ratio = this._getDpiRatio();
        var pixelWidth = Math.round(rect.width * ratio);
        var pixelHeight = Math.round(rect.height * ratio);

        this._canvas.style.width = rect.width + 'px';
        this._canvas.style.height = rect.height + 'px';
        this._canvas.width = pixelWidth;
        this._canvas.height = pixelHeight;
        this._gl.viewport(0, 0, pixelWidth, pixelHeight);
        this._gl.scissor(0, 0, pixelWidth, pixelHeight);

        // Create 'base matrix' (including aspect-ratio, topleft-origin, pixel-scale)
        var m0 = IM.Mat3.makeScale(1, -1);
        var m1 = IM.Mat3.makeTranslation(-1, -1);
        var m2 = IM.Mat3.makeScale(2 / pixelWidth, 2 / pixelHeight);
        this._baseMatrix = IM.Mat3.multiply(m0, m1, m2);

        this._invalidate();
    },

    _invalidate: function() {
        if (!this._renderPending) {
            this._renderPending = true;
            var context = this;
            requestAnimationFrame(function() {
                var finished = context._render();
                context._renderPending = false;
                if (!finished) {
                    context._invalidate();
                }
            });
        }
    },

    _snapIntoView: function(duration) {

        // Compute image rectangle
        var matrix = this._makeTransformMatrix({
            scale: this._animator.getDestination('Scale'),
            rotation: this._animator.getDestination('Rotation')});
        var rect = this._getImageRect(matrix);

        // Get canvas dimension
        var width = this._canvas.width;
        var height = this._canvas.height;

        // Get current position
        var oldX = this._animator.get('PosX');
        var oldY = this._animator.get('PosY');

        // Variables
        var newX, newY, delta = 1;

        // Does the image fit within the canvas?
        var fitX = (rect.bounds.width - delta <= width);
        var fitY = (rect.bounds.height - delta <= height);

        // Handle x axis snapping
        if (fitX) {
            if (rect.bounds.x0 < 0)           { newX = oldX + Math.abs(rect.bounds.x0);  }
            else if (rect.bounds.x1 > width)  { newX = oldX - (rect.bounds.x1 - width);  }
        } else {
            if (rect.bounds.x1 < width)       { newX = oldX + (width - rect.bounds.x1);  }
            else if (rect.bounds.x0 > 0)      { newX = oldX - rect.bounds.x0;            }
        }

        // Handle y axis snapping
        if (fitY) {
            if (rect.bounds.y0 < 0)           { newY = oldY + Math.abs(rect.bounds.y0);  }
            else if (rect.bounds.y1 > height) { newY = oldY - (rect.bounds.y1 - height); }
        } else {
            if (rect.bounds.y1 < height)      { newY = oldY + (height- rect.bounds.y1);  }
            else if (rect.bounds.y0 > 0)      { newY = oldY - rect.bounds.y0;            }
        }

        // If snapping is needed, do the appropriate animation
        if (newX !== undefined) {
            this._animator.start('PosX', newX, duration);
            this._invalidate();
        }

        if (newY !== undefined) {
            this._animator.start('PosY', newY, duration);
            this._invalidate();
        }
    },

    rotate: function(duration) {

        this._animator.set('RotationCenterX', this._imageSize[0] * 0.5);
        this._animator.set('RotationCenterY', this._imageSize[1] * 0.5);

        this._intendedRotation -= Math.PI * 0.5;

        this._animator.start('Rotation', this._intendedRotation, duration);
        this._snapIntoView(duration)

        this._invalidate();
    },

    _getImageRect: function(matrix) {

        // Find transformed image coordinates (aka. the current position of the image)
        var tl = IM.Mat3.transformPoint(matrix, 0, 0);
        var tr = IM.Mat3.transformPoint(matrix, this._imageSize[0], 0);
        var br = IM.Mat3.transformPoint(matrix, this._imageSize[0], this._imageSize[1]);
        var bl = IM.Mat3.transformPoint(matrix, 0, this._imageSize[1]);
        var center = IM.Mat3.transformPoint(matrix, this._imageSize[0] * 0.5, this._imageSize[1] * 0.5);

        var distance = function(a, b) {
            var dx = a[0] - b[0];
            var dy = a[1] - b[1];
            return Math.sqrt(dx * dx + dy * dy);
        }

        // Compute axis-aligned bounds
        var bounds = {
            x0: Math.min(tl[0], Math.min(tr[0], Math.min(bl[0], br[0]))),
            x1: Math.max(tl[0], Math.max(tr[0], Math.max(bl[0], br[0]))),
            y0: Math.min(tl[1], Math.min(tr[1], Math.min(bl[1], br[1]))),
            y1: Math.max(tl[1], Math.max(tr[1], Math.max(bl[1], br[1])))
        }

        bounds.width = bounds.x1 - bounds.x0;
        bounds.height = bounds.y1 - bounds.y0;

        // Compute rotation
        var rotation = Math.PI * 2.0 - Math.atan2(tr[1] - tl[1], tr[0] - tl[0]);

        // Return values
        return {
            topLeft: tl,
            topRight: tr,
            bottomLeft: bl,
            bottomRight: br,
            width: distance(tl, tr),
            height: distance(tr, br),
            rotation: rotation,
            center: center,
            bounds: bounds};
    },

    _makeTransformMatrix: function(args) {

        // Get target values
        var scale = args && args.scale ? args.scale : this._animator.get('Scale');
        var posX = args && args.posX ? args.posX : this._animator.get('PosX');
        var posY = args && args.posY ? args.posY : this._animator.get('PosY');
        var rotation = args && args.rotation ? args.rotation : this._animator.get('Rotation');
        var updateState = args && args.updateState ? args.updateState : false;

        // Create scale delta-matrix
        var deltaScale = scale / this._currentScale;
        var deltaScaleMatrix = IM.Mat3.makeScale(deltaScale, deltaScale);

        // Create scale-center matrices
        var scaleCenterX = this._animator.get('ScaleCenterX');
        var scaleCenterY = this._animator.get('ScaleCenterY');
        var scaleCenterMatrix = IM.Mat3.makeTranslation(scaleCenterX, scaleCenterY);
        var scaleCenterInvMatrix = IM.Mat3.invert(scaleCenterMatrix);

        // Create position delta-matrix
        var deltaPosX = (posX - this._currentPosX); // Note: Rounding these coordinates fixes interpolation artifacts during animations, but it also introduces accumulating errors in the transformation matrix
        var deltaPosY = (posY - this._currentPosY);
        var deltaPosMatrix = IM.Mat3.makeTranslation(deltaPosX, deltaPosY);

        // Create rotation delta-matrix
        var deltaRotation = rotation - this._currentRotation;
        var deltaRotationMatrix = IM.Mat3.makeRotation(deltaRotation);

        // Create rotation-center matrices
        var rotationCenterX = this._animator.get('RotationCenterX');
        var rotationCenterY = this._animator.get('RotationCenterY');
        var rotationCenterMatrix = IM.Mat3.makeTranslation(rotationCenterX, rotationCenterY);
        var rotationCenterInvMatrix = IM.Mat3.invert(rotationCenterMatrix);

        // Update state, if requested
        if (updateState) {
            this._currentPosX = posX;
            this._currentPosY = posY;
            this._currentScale = scale;
            this._currentRotation = rotation;
        }

        // Compute and return transformation matrix
        return IM.Mat3.multiply(
            deltaPosMatrix,
            this._transformMatrix,
            scaleCenterMatrix,
            deltaScaleMatrix,
            scaleCenterInvMatrix,
            rotationCenterMatrix,
            deltaRotationMatrix,
            rotationCenterInvMatrix);
    },

    _render: function() {

        // Clear canvas
        var gl = this._gl;
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (this._initialized && this._tiles) {

            // Compute matrix
            this._transformMatrix = this._makeTransformMatrix({ updateState: true });
            var matrix = IM.Mat3.multiply(this._baseMatrix, this._transformMatrix);

            // Set uniforms
            this._program.setUniformMatrix3fv('matrix', matrix);
            this._program.setUniform1f('alpha', this._animator.get('Alpha'));
            this._program.setUniform1i('tex', 0);

            // Enable texture unit 0
            gl.activeTexture(gl.TEXTURE0);

            for (var i = 0; i < this._tiles.length; i++) {

                // Bind texture and draw
                gl.bindTexture(gl.TEXTURE_2D, this._tiles[i].texture);
                gl.drawArrays(gl.TRIANGLES, i * 6, 6);
            }
        }

        // Return true if ALL animations completed and no further rendering is necessary, otherwise false
        return this._animator.finished();
    },
}