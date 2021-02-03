export class Color {

    h: number
    s: number
    l: number

    getStringNotation() {
        return `hsl(${this.h},${this.s}%, ${this.l}%)`
    }

    getOppositeStringNotation() {
        if (this.s == 0) {
            return `hsl(${this.h},${this.s}%, 100%)`
        } else {
            return `hsl(${this.h + 180 % 360},${this.s}%, ${this.l}%)`
        }
    }

    mergeColor(color2: Color) {
        if (color2.h != null && color2.h >= 0 && color2.h <= 360) {
            if (Math.abs(this.h - color2.h) > 180)
                this.h = (this.h + 360 + color2.h) / 2 % 360;
            else
                this.h = (this.h + color2.h) / 2 % 360;
        }
    }

    constructor(h, s, l) {
        this.h = h;
        this.s = s;
        this.l = l;
    }
}