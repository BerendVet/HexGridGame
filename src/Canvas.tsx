import React from 'react'
import './Canvas.css'
import { Color } from './Color';

interface CanvasProps {
    // board object
    board,

    // callback functions
    selectTile,
    moveUnits,
}


export default class Canvas extends React.Component<CanvasProps> {

    // canvas layers
    canvasHex: any;
    canvasOverlay: any;
    canvasUnits: any;

    canvasContainer: any;

    // object properties check equality function
    isEqual = (...objects: any) => objects.every((obj: any) => JSON.stringify(obj) === JSON.stringify(objects[0]));

    // hex constants
    hexSize = 40;
    hexHeight = this.hexSize * 2;
    hexWidth = Math.sqrt(3) * this.hexSize;
    vertDistance = this.hexHeight * 3 / 4;
    horizDistance = this.hexWidth;
    hexOrigin = { x: this.hexSize * 2, y: this.hexSize * 2 }

    gridWidth = this.horizDistance * (this.props.board.columns + 2);
    gridHeight = this.vertDistance * (this.props.board.rows + 2)

    canvasWidth = Math.min(this.gridWidth)
    canvasHeight = this.vertDistance * (this.props.board.rows + 2)

    // canvasOffset = { x: -0.5, y: -0.5 };

    debugMode = false;

    dragging = false;
    firstDragPosition = { x: 0, y: 0 };
    lastDragPosition = { x: 0, y: 0 };
    dragMargin = { x: 0, y: 0 }

    scale = 1;
    MIN_ZOOM = 0.1
    MAX_ZOOM = 2
    SCROLL_SENSITIVITY = 0.0005

    constructor(props) {
        super(props)
    }

    componentWillUnmount() {
    }

    componentDidMount() {
        this.canvasHex.width = this.canvasWidth;
        this.canvasHex.height = this.canvasHeight;

        this.canvasOverlay.width = this.canvasWidth;
        this.canvasOverlay.height = this.canvasHeight;

        this.canvasUnits.width = this.canvasWidth;
        this.canvasUnits.height = this.canvasHeight;

        window.addEventListener('resize', () => {
            this.updateGridTransformation();
        })
        this.clampZoom()
        this.scale = this.MIN_ZOOM;

        this.updateGridTransformation();

        this.drawUnitCanvas();

        this.drawHexGrid();
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.state != undefined) {
            if (!this.isEqual(nextState, this.state)) {
                this.clearHexOverlay()
                if ((nextState as any).highlightedHex != null) {
                    let hex = (nextState as any).highlightedHex;
                    var center = this.hexToPixel(hex)
                    var tile = this.props.board.grid[hex.x][hex.y]
                    this.drawHex(this.canvasOverlay.getContext('2d'), center, tile.color.getOppositeStringNotation(), 3)
                }
                if ((nextState as any).selectedHex != null) {
                    let hex = (nextState as any).selectedHex;
                    var center = this.hexToPixel(hex)
                    var tile = this.props.board.grid[hex.x][hex.y]
                    this.drawHex(this.canvasOverlay.getContext('2d'), center, "white", 3)

                    if (tile.units.length > 0) {
                        this.getNeighbors(hex).forEach((n) => {
                            this.drawHex(this.canvasOverlay.getContext('2d'), this.hexToPixel(n), "white", 3)
                        })
                    }

                }
                return true;
            }
        }
        return false;
    }

    retrieveHexFromMouseEvent(e) {
        var x;
        var y;
        if (e.pageX || e.pageY) {
            x = e.pageX;
            y = e.pageY;
        }
        else {
            x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        x -= this.canvasOverlay.offsetLeft;
        y -= this.canvasOverlay.offsetTop;

        x /= this.scale;
        y /= this.scale;

        x -= this.dragMargin.x;
        y -= this.dragMargin.y

        return this.pixelToHex(this.Point(x, y))
    }

    handleMouseUp(e) {
        this.dragging = false;

        var hex = this.retrieveHexFromMouseEvent(e);
        if (hex.x < 0 || hex.x >= this.props.board.columns
            || hex.y < 0 || hex.y >= this.props.board.rows) {
            return;
        }

        // if user is not dragging
        if (e.pageX == this.firstDragPosition.x && e.pageY == this.firstDragPosition.y) {

            if ((this.state as any).selectedHex == null) {
                // select clicked tile
                this.setState({
                    selectedHex: hex,
                })
                this.props.selectTile(this.props.board.grid[hex.x][hex.y])
            } else if (this.getNeighbors((this.state as any).selectedHex).some((n) => n.x === hex.x && n.y === hex.y)) {
                let selectedHex = (this.state as any).selectedHex
                let from = this.props.board.grid[selectedHex.x][selectedHex.y]
                if(from.units.length > 0) {
                    let to = this.props.board.grid[hex.x][hex.y]
                    this.props.moveUnits(from, to)
                }

                // deselect clicked tile
                this.setState({
                    selectedHex: null,
                })
                this.props.selectTile(null)
            } else {
                // deselect clicked tile
                this.setState({
                    selectedHex: null,
                })
                this.props.selectTile(null)
            }


        }
        this.firstDragPosition = null;

    }

    handleMouseDown(e) {
        this.dragging = true;

        this.firstDragPosition = { x: e.clientX, y: e.clientY }
        this.lastDragPosition = { x: e.clientX, y: e.clientY };
    }

    handleMouseOut(e) {
        this.dragging = false;
    }

    updateGridTransformation() {
        if (this.canvasContainer != null) {
            let minDragMargin = {
                x: this.clamp(this.dragMargin.x, -(((this.canvasWidth * this.scale) - this.canvasContainer.offsetWidth)) / this.scale, 0),
                y: this.clamp(this.dragMargin.y, -(((this.canvasHeight * this.scale) - window.innerHeight)) / this.scale, 0)
            }
            this.dragMargin.x = minDragMargin.x > 0 ? minDragMargin.x / 2 : this.clamp(this.dragMargin.x, minDragMargin.x, 0);
            this.dragMargin.y = minDragMargin.y > 0 ? minDragMargin.y / 2 : this.clamp(this.dragMargin.y, minDragMargin.y, 0)

            let transformOrigin = `0 0`;
            let transform = `scale(${this.scale}) translate(${this.dragMargin.x}px, ${this.dragMargin.y}px)`;

            this.canvasHex.style.transformOrigin = transformOrigin
            this.canvasHex.style.transform = transform;

            this.canvasUnits.style.transformOrigin = transformOrigin
            this.canvasUnits.style.transform = transform;

            this.canvasOverlay.style.transformOrigin = transformOrigin
            this.canvasOverlay.style.transform = transform
        }
    }

    clampZoom() {
        // get min zoom from current window size
        this.MIN_ZOOM = Math.min(window.innerWidth / this.canvasWidth, window.innerHeight / this.canvasHeight);
        // clamp current zoom level from min and max levels
        this.scale = Math.min(this.scale, this.MAX_ZOOM)
        this.scale = Math.max(this.scale, this.MIN_ZOOM)
    }

    handleWheel(e) {
        let mouse = {
            x: e.pageX,
            y: e.pageY
        }
        var hex = this.retrieveHexFromMouseEvent(e);

        let delta = e.deltaY * this.SCROLL_SENSITIVITY;
        this.scale -= delta;

        this.clampZoom()

        // var hex = this.retrieveHexFromMouseEvent(e);
        this.focusHexOnPoint(hex, mouse);

        this.updateGridTransformation()

        this.updateHighlightedHex(e);

    }

    // set screen margins so hex is on point on screen
    focusHexOnPoint(hex, point) {
        let center = this.hexToPixel(hex);
        center.x *= this.scale;
        center.y *= this.scale;

        point.x -= (this.dragMargin.x * this.scale);
        point.y -= (this.dragMargin.y * this.scale);

        this.dragMargin.x -= -(point.x - center.x) / this.scale
        this.dragMargin.y -= -(point.y - center.y) / this.scale
    }

    handleMouseMove(e) {
        if (this.dragging) {
            var delta = {
                x: (e.clientX - this.lastDragPosition.x) / this.scale,
                y: (e.clientY - this.lastDragPosition.y) / this.scale
            }
            this.lastDragPosition = { x: e.clientX, y: e.clientY }
            this.dragMargin.x += delta.x;
            this.dragMargin.y += delta.y;

            this.updateGridTransformation()
        }
        this.updateHighlightedHex(e);
    }

    drawUnitCanvas() {
        var ctx = this.canvasUnits.getContext('2d')
        ctx.clearRect(0, 0, this.canvasHex.width, this.canvasHex.height);

        ctx.font = "bold 20px Arial";
        this.props.board.grid.forEach((column, x) => {
            column.forEach((tile, y) => {
                if (tile.units.length > 0) {

                    let center = this.hexToPixel(this.HexOffset(x, y))
                    ctx.fillText(tile.units.length, center.x - 5, center.y + 7);
                }
            });
        });
    }

    updateHighlightedHex(e) {
        var hex = this.retrieveHexFromMouseEvent(e);
        if (hex == undefined) return;
        if (hex.x < 0 || hex.x >= this.props.board.columns
            || hex.y < 0 || hex.y >= this.props.board.rows) {
            return;
        }
        this.setState({
            highlightedHex: hex,
        })
    }

    redrawHexGrid() {
        this.clearHexGrid();
        this.drawHexGrid();
        this.setState({
            redrawOverlay: (this.state as any).redrawOverlay++ || 0
        })
    }

    drawHexGrid() {
        var ctx = this.canvasHex.getContext('2d');


        for (let x = 0; x < this.props.board.columns; x++) {
            for (let y = 0; y < this.props.board.rows; y++) {
                let center = this.hexToPixel(this.HexOffset(x, y))
                this.drawHex(ctx, center, 'black', '4', this.props.board.grid[x][y].color.getStringNotation())
            }
        }
    }

    clearHexOverlay() {
        var overlayCtx = this.canvasOverlay.getContext('2d')
        overlayCtx.clearRect(0, 0, this.canvasHex.width, this.canvasHex.height);
    }

    clearHexGrid() {
        var ctx = this.canvasHex.getContext('2d')
        ctx.clearRect(0, 0, this.canvasHex.width, this.canvasHex.height);
    }

    cubeDirections = [
        this.Cube(1, 0, -1), this.Cube(1, -1, 0), this.Cube(0, -1, 1),
        this.Cube(-1, 0, 1), this.Cube(-1, 1, 0), this.Cube(0, 1, -1)];

    cubeAdd(CubeA, CubeB) {
        return this.Cube(CubeA.x + CubeB.x, CubeA.y + CubeB.y, CubeA.z + CubeB.z);
    }

    cubeSubtract(CubeA, CubeB) {
        return this.Cube(CubeA.x - CubeB.x, CubeA.y - CubeB.y, CubeA.z - CubeB.z);
    }

    getNeighbor(hex, direction) {
        let cube = this.hexOffsetToCube(hex)
        return this.cubeToHexOffset(this.cubeAdd(cube, this.cubeDirections[direction]))
    }

    getNeighbors(hex) {
        let cube = this.hexOffsetToCube(hex)
        return this.cubeDirections.map((direction) => this.cubeToHexOffset(this.cubeAdd(cube, direction)))
            .filter((hex) => hex.x >= 0 && hex.x < this.props.board.columns && hex.y >= 0 && hex.y < this.props.board.rows)
    }

    getAllHexCornerCoord(center) {
        return [0, 1, 2, 3, 4, 5].map((i) => this.getHexCornerCoord(center, i))
    }

    getHexCornerCoord(center, i) {
        var angle_deg = 60 * i + 30;
        var angle_rad = Math.PI / 180 * angle_deg;
        return this.Point(center.x + this.hexSize * Math.cos(angle_rad),
            center.y + this.hexSize * Math.sin(angle_rad))
    }

    drawHex(ctx, center, lineColor, lineWidth, fillColor?, fillAlpha?) {
        let corners = this.getAllHexCornerCoord(center);
        ctx.beginPath();
        if (fillColor != null)
            ctx.fillStyle = fillColor;
        // if (fillAlpha != null)
        //     ctx.globalAlpha = fillAlpha;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;

        ctx.moveTo(corners[corners.length - 1].x, corners[corners.length - 1].y);
        corners.forEach((c) => {
            ctx.lineTo(c.x, c.y);
            ctx.stroke();
        })

        ctx.closePath();
        if (fillColor != null)
            ctx.fill();
    }

    render() {
        return (
            <div className="canvasContainer" ref={canvasContainer => this.canvasContainer = canvasContainer}>
                <canvas ref={canvasHex => this.canvasHex = canvasHex}> </canvas>
                <canvas ref={canvasUnits => this.canvasUnits = canvasUnits}></canvas>
                <canvas ref={canvasOverlay => this.canvasOverlay = canvasOverlay}
                    onMouseOut={this.handleMouseOut.bind(this)}
                    onMouseUp={this.handleMouseUp.bind(this)}
                    onMouseDown={this.handleMouseDown.bind(this)}
                    onMouseMove={this.handleMouseMove.bind(this)}
                    onWheel={this.handleWheel.bind(this)}>
                </canvas>
            </div >
        )
    }

    // oddR offset to pixel
    hexToPixel(hex) {
        var x = this.hexSize * (Math.sqrt(3) * (hex.x + 0.5 * (hex.y & 1))) + this.hexOrigin.x;
        var y = this.hexSize * (3 / 2 * hex.y) + this.hexOrigin.y;
        return this.Point(x, y)
    }

    pixelToHex(point) {
        let q = ((point.x - this.hexOrigin.x) * Math.sqrt(3) / 3 - (point.y - this.hexOrigin.y) / 3) / this.hexSize;
        let r = (point.y - this.hexOrigin.y) * 2 / 3 / this.hexSize;
        return this.cubeToHexOffset(this.cubeRound(this.Cube(q, -q - r, r)))
    }

    cubeRound(cube) {
        var rx = Math.round(cube.x)
        var ry = Math.round(cube.y)
        var rz = Math.round(cube.z)

        var x_diff = Math.abs(rx - cube.x)
        var y_diff = Math.abs(ry - cube.y)
        var z_diff = Math.abs(rz - cube.z)

        if (x_diff > y_diff && x_diff > z_diff) {
            rx = -ry - rz
        } else if (y_diff > z_diff) {
            ry = -rx - rz
        } else {
            rz = -rx - ry
        }
        return this.Cube(rx, ry, rz)
    }

    hexOffsetRound(hex) {
        return this.cubeToHexOffset(this.cubeRound(this.hexOffsetToCube(hex)));
    }

    cubeToHexOffset(cube) {
        var x = cube.x + (cube.z - (cube.z & 1)) / 2
        var y = cube.z;
        return this.HexOffset(x, y);
    }

    hexOffsetToCube(hex) {
        var x = hex.x - (hex.y - (hex.y & 1)) / 2
        var z = hex.y;
        var y = -x - z;
        return this.Cube(x, y, z);
    }

    Point(x, y) {
        return { x: x, y: y }
    }

    HexOffset(x, y) {
        return {
            x: x,
            y: y,
        }
    }

    Cube(x, y, z) {
        return {
            x: x,
            y: y,
            z: z
        }
    }

    clamp(num, min, max) {
        return num <= min ? min : num >= max ? max : num;
    }

}