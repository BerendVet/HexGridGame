
import React, { Component } from 'react'
import Canvas from './Canvas'
import { Color } from './Color';
import { Tile } from './Tile';
import { factionsData } from './factions.js'
import Sidebar from './Sidebar';
import './Game.css'


export interface Pop {
    color: Color,
    allegiance: Faction,
    control: Faction,
    loyalty: number, // loyalty to controlling faction 1-100
}

export interface Unit extends Pop {
    strength: number
}

export interface Faction {
    id: number,
    name: string,
    color: Color
}

export interface Board {
    rows: number,
    columns: number,
    grid: Tile[][],
    factions: Faction[]
}

export interface Player {
    faction: Faction,
}

export default class Game extends Component {

    board: Board;
    rows = 10;
    columns = 10;

    sidebarWidth = `200px`;

    canvas: Canvas;

    updateCanvas = () => {
        this.canvas.redrawHexGrid();
        this.canvas.drawUnitCanvas();
    }

    constructor(props) {
        super(props);

        let grid = [];

        let factions = factionsData.factions

        for (let q = 0; q < this.columns; q++) {
            grid[q] = [];
            for (let r = 0; r < this.rows; r++) {
                let faction = factions[r >= this.rows / 2 ? 1 : 2]
                grid[q][r] = new Tile(q, r,
                    [{
                        color: faction.color,
                        allegiance: faction
                    }, {
                        color: faction.color,
                        allegiance: faction
                    }],
                    faction,
                    this.updateCanvas)
            }
        }

        this.board = {
            rows: this.rows,
            columns: this.columns,
            grid: grid,
            factions: factions
        }

        this.state = {
            selectedTile: null
        }
    }

    selectTile(tile: Tile) {
        this.setState({
            selectedTile: tile
        })
    }

    moveUnits(from: Tile, to: Tile) {
        if (from.control === to.control) {
            // transfer
            to.units.push(...from.units.splice(0, from.units.length));
        } else {
            // attack
            this.battle(from, to);
        }
        console.log({ from, to })
        this.updateCanvas();
    }

    battle(attackers: Tile, defenders: Tile) {
        if (attackers.units.length > defenders.units.length) {
            // kill defenders
            defenders.units = [];

            // transfer
            defenders.units.push(...attackers.units.splice(0, attackers.units.length));

            // shift control to attackers
            defenders.shiftControl(attackers.control.id)
        } else if (attackers.units.length < defenders.units.length) {
            //kill attackers
            attackers.units = [];
        } else if (attackers.units.length === defenders.units.length) {
            attackers.units.splice(0, 1)

            defenders.units.splice(0, 1);
        }
    }

    render() {
        return (
            <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
                <div style={{ width: '100%', float: 'left', height: '100%' }}>
                    <Canvas ref={canvas => { this.canvas = canvas }} selectTile={this.selectTile.bind(this)} moveUnits={this.moveUnits.bind(this)} board={this.board} />
                </div>

                <div style={{ width: this.sidebarWidth, height: '100%', float: 'right' }}>
                    <Sidebar board={this.board} selectedTile={(this.state as any).selectedTile}></Sidebar>
                </div>
            </div>
        )
    }

    componentDidMount() {

    }
}
