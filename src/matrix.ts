import {
    identity,
    multiply,
    perspective,
    translate,
    translate3d,
    rotateY,
    toString,
    Matrix,
    Matrix2D,
    Matrix3D
} from "rematrix";

export default class MatrixM {
    m: Matrix3D;
    constructor(arg?: MatrixM) {
        if (arg) {
            if (arg.m) {
                this.m = [...Array.from(arg.m)] as Matrix3D;
            } 
            else {
                this.m = [...Array.from(arg as any) as Matrix3D];
            }
        } else {
            this.m = identity();
        }
    }

    clone() { return new MatrixM(this); }

    multiply(m: any) { return this.m = multiply(this.m, m); }

    perspective(d: any) { return this.multiply(perspective(d)); }

    transformX(x: number) { return ((x * this.m[0]) + this.m[12]) / ((x * this.m[3]) + this.m[15]); }

    translate(x: any, y?: any) { return this.multiply(translate(x, y)); }

    translate3d(x: any, y: any, z: any) { return this.multiply(translate3d(x, y, z)); }

    rotateY(deg: any) { return this.multiply(rotateY(deg)); }

    toString() { return toString(this.m); }
}
