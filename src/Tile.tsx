import { Color } from "./Color"
import { Pop, Faction, Unit } from "./Game"
import { factionsData } from './factions.js'

export class Tile {
    x: number
    y: number
    get color(): Color {
        return this.control.color;
    }
    population: Pop[]
    units: Unit[]
    control: Faction

    canvasUpdate: Function

    constructor(x, y, population, control, canvasUpdate) {
        this.x = x;
        this.y = y;
        this.population = population;
        this.control = control;
        this.units = []

        this.canvasUpdate = canvasUpdate;
    }

    addPop() {
        // take random pop from selected tile
        // let pop = this.population[Math.ceil(Math.random() * this.population.length - 1)]

        
        let pop = {
            color: this.control.color,
            allegiance: this.control,
            loyalty: 100
        }
        if (pop != null) {
            // duplicate pop
            this.population.push(pop)
        }
    }

    deletePop(index) {
        if (index < this.population.length) {
            this.population.splice(index, 1)
        }
        // if (this.population.length <= 0 && this.units.length[0]) {
        //     this.shiftControl(0);
        // }
    }

    raiseUnit(index) {
        if (index < this.population.length) {
            let pop = this.population.splice(index, 1)
            this.units.push({ ...pop[0], strength: 100 })
        }
        this.canvasUpdate();
    }

    disbandUnit(index) {
        if (index < this.units.length) {
            let unit = this.units.splice(index, 1)
            this.population.push({ ...unit[0] })
        }
        this.canvasUpdate();
    }

    shiftControl(factionId) {
        this.control = factionsData.factions[factionId];
        this.canvasUpdate();
    }
}