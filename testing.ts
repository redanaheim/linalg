import { Vector, Matrix, SwapRowOp, SetRowOp, AddRowOp } from "./index.js";

let x = Vector.from_array([3, 7, 13]);

let b = [Vector.from_array([1,1,1]), Vector.from_array([0,1,1]), Vector.from_array([0,0,1])]

let x_coords = x.with_basis(3, ...b) ?? Vector.from_array([-1000000000]);
console.log(x_coords.toString())
