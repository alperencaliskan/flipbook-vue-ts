import { Matrix3D } from "rematrix";
export default class MatrixM {
    m: Matrix3D;
    constructor(arg?: MatrixM);
    clone(): MatrixM;
    multiply(m: any): Matrix3D;
    perspective(d: any): Matrix3D;
    transformX(x: number): number;
    translate(x: any, y?: any): Matrix3D;
    translate3d(x: any, y: any, z: any): Matrix3D;
    rotateY(deg: any): Matrix3D;
    toString(): string;
}
