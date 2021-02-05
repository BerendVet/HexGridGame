
import React, { Component } from 'react'
import Canvas from './Canvas'
import { Color } from './Color';
import { factionsData } from './factions.js'
import Sidebar from './Sidebar';
import './Game.css'
import { Tile } from './Tile';
import { Modal, Button } from './components';


export interface Pop {
    color: Color,
    allegiance: Faction,
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
    id: number,
}

export interface Order {
    playerId: number,
}

export interface RecruitingOrder extends Order {
    location: Tile,
    pops: Pop[],
}

export interface MovementOrder extends Order {
    from: Tile,
    to: Tile,
    units: Unit[]
}

export default class Game extends Component {

    board: Board;
    rows = 10;
    columns = 10;

    sidebarWidth = `200px`;

    canvas: Canvas;

    showModal = false;

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
                        allegiance: faction,
                        loyalty: 100
                    }, {
                        color: faction.color,
                        allegiance: faction,
                        loyalty: 100
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
        this.toggleModal()

        if (from.control === to.control) {
            // transfer
            to.units.push(...from.units.splice(0, from.units.length));
        } else {
            // attack
            this.battle(from, to);
        }
        this.updateCanvas();
    }

    toggleModal() {
        this.showModal = !this.showModal;
        this.forceUpdate();
    }

    battle(attackers: Tile, defenders: Tile) {
        let attackerStrength = attackers.units.length

        let defenderStrength = defenders.units.length        

        let strengthDifference = attackerStrength - defenderStrength

        if (strengthDifference > defenderStrength) {

            // check if defenders have a tile to retreat to
            let possibleRetreatTiles = this.canvas.getNeighbors({x: defenders.x, y: defenders.y}).map((n) => {
                return this.board.grid[n.x][n.y]
            }).filter(((n) => {
                return n.control === defenders.control;
            }))

            if(possibleRetreatTiles.length == 0 ||  strengthDifference > defenderStrength * 5) {
                // kill defenders
                defenders.units = [];
            } else {
                // defenders take losses
                defenders.units.splice(0, strengthDifference * 0.3)
                
                // defenders retreat
                let retreat = possibleRetreatTiles[Math.floor(Math.random() * possibleRetreatTiles.length)];
                retreat.units.push(...defenders.units.splice(0, defenders.units.length))
            }
            
            // transfer
            defenders.units.push(...attackers.units.splice(0, attackers.units.length));

            // shift control to attackers
            defenders.shiftControl(attackers.control.id)
        } else if (attackerStrength < defenderStrength) {
            //kill attackers
            attackers.units = [];
        } else if (attackerStrength === defenderStrength) {
            attackers.units.splice(0, 1)

            defenders.units.splice(0, 1)
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


                {
                    this.showModal
                    ?  <Modal
                            header="header"
                            paragraph={
                                <div>
                                    <p>hello</p>
                                    <Button onClick={() => alert('hello')}>Move units</Button>
                                </div>
                          }
                            closeTrigger={this.toggleModal.bind(this)}
                        ></Modal>
                    : null
                }

                    
                
            </div>
        )
    }

    componentDidMount() {

    }
}
