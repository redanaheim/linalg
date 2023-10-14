class Vector<Length extends number | undefined> {
    private getter: (index: number) => number;
    length: Length | undefined;

    constructor (getter: (index: number) => number, length: Length | undefined) {
        this.getter = getter;
        this.length = length;
    }

    get (idx: number) {
        return this.getter(idx)
    }

    static from_array<Length extends number>(arr: number[], length: Length | undefined) {
        const getter = (idx: number) => {
            if (idx >= arr.length) return 0;
            return arr[idx];
        }
        return new Vector<Length>(getter, length)
    }

    join<Length extends number | undefined>(other: Vector<Length>) {
        const getter = (idx: number) => {
            if (this.length === undefined || idx < this.length) return this.get(idx)
            else return other.get(idx)
        }
    }
}

class Matrix<Rows extends number, Columns extends number> {
    private getter: (row: number, column: number) => number;
    rows: Rows;
    columns: Columns;

    constructor (getter: (row: number, column: number) => number, rows: Rows, columns: Columns) {
        this.getter = getter;
        this.rows = rows;
        this.columns = columns;
    }

    get (row: number, col: number) {
        return this.getter(row, col);
    }

    static from_2d_array(arr: number[][]) {
        const getter = (row: number, col: number) => {
            if (row >= arr.length) return 0;
            else {
                let target_row = arr[row];
                if (col >= target_row.length) return 0;
                else return target_row[col];
            }
            
        }
        return new Matrix(getter, arr.length, arr[0].length)
    }

    static from_column_vectors<Length extends number>(column_length: Length, ...vectors: Vector<Length>[]) {
        const getter = (row: number, col: number) => {
            if (col >= vectors.length) return 0;
            else {
                let target_column = vectors[col];
                return target_column.get(row)
            }
        }
        return new Matrix(getter, column_length, vectors.length)
    }

    static from_row_vectors<Length extends number>(row_length: Length, ...vectors: Vector<Length>[]) {
        const getter = (row: number, col: number) => {
            if (row >= vectors.length) return 0;
            else {
                let target_row = vectors[row];
                return target_row.get(col)
            }
        }
        return new Matrix(getter, vectors.length, row_length)
    }

    to_2d_array (): number[][] {
        let rows = []
        for (let i = 0; i < this.rows; i++) {
            let row = [];
            for (let j = 0; j < this.columns; j++) {
                row.push(this.get(i, j));
            }
            rows.push(row);
        }
        return rows;
    }

    transposed (): Matrix<Columns, Rows> {
        return new Matrix((i, j) => this.get(j, i), this.columns, this.rows)
    }

    right_multiply<OtherColumns extends number>(other: Matrix<Columns, OtherColumns>): Matrix<Rows, OtherColumns> {

    }

    print_item (r: number, c: number, precision: number = 3): string {
        return (+parseFloat((this.get(r, c)).toFixed(precision))).toString()
    }

    print (row_spacing= 1, column_spacing= 5) {
        let buffer = "";
        let c_txt_lengths = [];
        for (let c = 0; c < this.columns; c++) {
            let max_length = 0;
            for (let r = 0; r < this.rows; r++) {
                let txt_item = this.print_item(r, c)
                if (txt_item.length > max_length) max_length = txt_item.length;
            }
            c_txt_lengths.push(max_length)
        }
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                let txt_item = this.print_item(r, c);
                let l = c_txt_lengths[c];
                txt_item += `${" ".repeat(l - txt_item.length)}`
                
                buffer += txt_item;
                buffer += " ".repeat(column_spacing);
            }
            buffer += "\n".repeat(row_spacing);
        }
        
        return buffer.trim()
    }
}



type SwapRowOp = {
    type: "swap",
    row_one: number,
    row_two: number
}

type SetRowOp = {
    type: "set",
    row_target: number,
    row_source: number,
    multiple: number
}

type AddRowOp = {
    type: "add",
    row_target: number,
    row_source: number,
    multiple: number
}

type RowOp = SwapRowOp | SetRowOp | AddRowOp

const apply_row_op = <R extends number, C extends number>(op: RowOp, mat: Matrix<R,C>): Matrix<R,C> => {
    switch (op.type) {
        case "swap": {
            return new Matrix((i, j) => {
                if (i === op.row_one) return mat.get(op.row_two, j)
                else if (i === op.row_two) return mat.get(op.row_one, j)
                else return mat.get(i, j)
            }, mat.rows, mat.columns)
        }
        case "set": {
            return new Matrix((i, j) => {
                if (i === op.row_target) return mat.get(op.row_source, j) * op.multiple
                else return mat.get(i, j)
            }, mat.rows, mat.columns)
        }
        case "add": {
            return new Matrix((i, j) => {
                if (i === op.row_target) return mat.get(op.row_source, j) * op.multiple + mat.get(op.row_target, j)
                else return mat.get(i, j)
            }, mat.rows, mat.columns)
        }
    }
}

// Based on gaussian elimination
const rref = <R extends number, C extends number>(mat: Matrix<R, C>): { result: Matrix<R, C>, operations: RowOp[] } => {
    let operations = [] as RowOp[];

    let current_mat = mat;

    const do_op = (op: RowOp) => {
        current_mat = apply_row_op(op, current_mat)
        operations.push(op);
        console.log(op);
        console.log(current_mat.print())
    }

    let last_pivot_spot = 0;

    for (let c = 0; c < Math.min(mat.columns, mat.rows); c++) {
        let min_dist = Number.POSITIVE_INFINITY;
        let row_index = -1;

        // Find the closest value multiplicatively to 1 so we can move it to the top row
        for (let r = last_pivot_spot; r < mat.rows; r++) {
       	    let item = mat.get(r, c);
            if (item === 0) {
                continue;
            }
            let dist = Math.abs(Math.log(Math.abs(item)))
            if (dist < min_dist) {
                min_dist = dist;
                row_index = r;
            }
        }

        let current_row_pivot = last_pivot_spot;
        
        // If the row is all zeros or already starts with a 1: do nothing
        if (row_index === -1) {
            continue;
        }
        // Otherwise swap the closest value to 1 to the diagonal spot
        else if (row_index !== current_row_pivot) {
            do_op({
                "type": "swap",
                "row_one": current_row_pivot,
                "row_two": row_index
            });
        }
        last_pivot_spot++;

        // Divide the row corresponding to the current column to have a 1
        do_op({
            "type": "set",
            "row_target": current_row_pivot,
            "row_source": current_row_pivot,
            "multiple": 1 / current_mat.get(current_row_pivot, c)
        })

        for (let r = 0; r < mat.rows; r++) {
            if (r === c) continue;
            let pivot = current_mat.get(current_row_pivot, c);
            if (pivot !== 1) continue;
            let value = current_mat.get(r, c);
            if (value === 0) {
                continue;
            }
            do_op({
                "type": "add",
                "row_target": r,
                "row_source": c,
                "multiple": -1 * value
            })
        }
    }

    return {
        result: current_mat,
        operations
    }
}

let cv_1 = Vector.from_array([2, -2, -1, -3], 4);
let cv_2 = Vector.from_array([-3, 2, 3, -2], 4);
let cv_3 = Vector.from_array([-2, -2, 3, -2], 4);
let cv_4 = Vector.from_array([3, 0, 2, 2], 4);

let mat = Matrix.from_column_vectors(4, cv_1, cv_2, cv_3, cv_4) as Matrix<4, 4>;

rref(mat)
