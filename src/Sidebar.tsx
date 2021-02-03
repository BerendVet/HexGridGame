import React, { Component } from 'react'
import { Button, Modal } from './components'
import './Sidebar.css'

interface SidebarProps {
    selectedTile,
    board,

    // callback functions
}

export default class Sidebar extends React.Component<SidebarProps> {

    constructor(props) {
        super(props)
    }

    deletePop(index) {
        this.props.selectedTile.deletePop(index);
        this.forceUpdate();
    }

    raiseUnit(index) {
        this.props.selectedTile.raiseUnit(index);
        this.forceUpdate();
    }

    disbandUnit(index) {
        this.props.selectedTile.disbandUnit(index);
        this.forceUpdate();
    }

    addPop() {
        this.props.selectedTile.addPop();
        this.forceUpdate();
    }

    render() {
        return (
            <div className="sidenav">

                {this.props.selectedTile != null &&
                    <div>
                        <h2>{this.props.selectedTile.control.name}</h2>
                        <Button onClick={() => this.addPop()}>Add Pop</Button>
                        <ul>
                            <h3>Population</h3>
                            {this.props.selectedTile.population.map((value, index) => {
                                return <li key={index}>{value.allegiance.name} <Button onClick={() => this.raiseUnit(index)}>Raise unit</Button></li>
                            })}
                        </ul>
                        <ul>
                            <h3>Units</h3>
                            {this.props.selectedTile.units.map((value, index) => {
                                return <li key={index}>{value.allegiance.name} <Button onClick={() => this.disbandUnit(index)}>Disband unit</Button></li>
                            })}
                        </ul>
                    </div>
                }
            </div>
        )
    }
}
