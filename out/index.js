"use strict";
class Vector {
    getter;
    length;
    constructor(getter, length) {
        this.getter = getter;
        this.length = length;
    }
    get(idx) {
        return this.getter(idx);
    }
    static from_array(arr, length) {
        const getter = (idx) => {
            if (idx >= arr.length)
                return 0;
            return arr[idx];
        };
        return new Vector(getter, length);
    }
}
class Matrix {
    getter;
    rows;
    columns;
    constructor(getter, rows, columns) {
        this.getter = getter;
        this.rows = rows;
        this.columns = columns;
    }
    get(row, col) {
        return this.getter(row, col);
    }
    static from_2d_array(arr) {
        const getter = (row, col) => {
            if (row >= arr.length)
                return 0;
            else {
                let target_row = arr[row];
                if (col >= target_row.length)
                    return 0;
                else
                    return target_row[col];
            }
        };
        return new Matrix(getter, arr.length, arr[0].length);
    }
    static from_column_vectors(column_length, ...vectors) {
        const getter = (row, col) => {
            if (col >= vectors.length)
                return 0;
            else {
                let target_column = vectors[col];
                return target_column.get(row);
            }
        };
        return new Matrix(getter, column_length, vectors.length);
    }
    static from_row_vectors(row_length, ...vectors) {
        const getter = (row, col) => {
            if (row >= vectors.length)
                return 0;
            else {
                let target_row = vectors[row];
                return target_row.get(col);
            }
        };
        return new Matrix(getter, vectors.length, row_length);
    }
    to_2d_array() {
        let rows = [];
        for (let i = 0; i < this.rows; i++) {
            let row = [];
            for (let j = 0; j < this.columns; j++) {
                row.push(this.get(i, j));
            }
            rows.push(row);
        }
        return rows;
    }
    transposed() {
        return new Matrix((i, j) => this.get(j, i), this.columns, this.rows);
    }
    print_item(r, c, precision = 3) {
        return (+parseFloat((this.get(r, c)).toFixed(precision))).toString();
    }
    print(row_spacing = 1, column_spacing = 5) {
        let buffer = "";
        let c_txt_lengths = [];
        for (let c = 0; c < this.columns; c++) {
            let max_length = 0;
            for (let r = 0; r < this.rows; r++) {
                let txt_item = this.print_item(r, c);
                if (txt_item.length > max_length)
                    max_length = txt_item.length;
            }
            c_txt_lengths.push(max_length);
        }
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                let txt_item = this.print_item(r, c);
                let l = c_txt_lengths[c];
                txt_item += `${" ".repeat(l - txt_item.length)}`;
                buffer += txt_item;
                buffer += " ".repeat(column_spacing);
            }
            buffer += "\n".repeat(row_spacing);
        }
        return buffer.trim();
    }
}
const apply_row_op = (op, mat) => {
    switch (op.type) {
        case "swap": {
            return new Matrix((i, j) => {
                if (i === op.row_one)
                    return mat.get(op.row_two, j);
                else if (i === op.row_two)
                    return mat.get(op.row_one, j);
                else
                    return mat.get(i, j);
            }, mat.rows, mat.columns);
        }
        case "set": {
            return new Matrix((i, j) => {
                if (i === op.row_target)
                    return mat.get(op.row_source, j) * op.multiple;
                else
                    return mat.get(i, j);
            }, mat.rows, mat.columns);
        }
        case "add": {
            return new Matrix((i, j) => {
                if (i === op.row_target)
                    return mat.get(op.row_source, j) * op.multiple + mat.get(op.row_target, j);
                else
                    return mat.get(i, j);
            }, mat.rows, mat.columns);
        }
    }
};
const rref = (mat) => {
    let operations = [];
    let current_mat = mat;
    const do_op = (op) => {
        current_mat = apply_row_op(op, current_mat);
        operations.push(op);
        console.log(op);
        console.log(current_mat.print());
    };
    let last_pivot_spot = 0;
    for (let c = 0; c < Math.min(mat.columns, mat.rows); c++) {
        let min_dist = Number.POSITIVE_INFINITY;
        let row_index = -1;
        for (let r = last_pivot_spot; r < mat.rows; r++) {
            let item = mat.get(r, c);
            if (item === 0) {
                continue;
            }
            let dist = Math.abs(Math.log(Math.abs(item)));
            if (dist < min_dist) {
                min_dist = dist;
                row_index = r;
            }
        }
        let current_row_pivot = last_pivot_spot;
        if (row_index === -1) {
            continue;
        }
        else if (row_index !== current_row_pivot) {
            do_op({
                "type": "swap",
                "row_one": current_row_pivot,
                "row_two": row_index
            });
        }
        last_pivot_spot++;
        do_op({
            "type": "set",
            "row_target": current_row_pivot,
            "row_source": current_row_pivot,
            "multiple": 1 / current_mat.get(current_row_pivot, c)
        });
        for (let r = 0; r < mat.rows; r++) {
            if (r === c)
                continue;
            let pivot = current_mat.get(current_row_pivot, c);
            if (pivot !== 1)
                continue;
            let value = current_mat.get(r, c);
            if (value === 0) {
                continue;
            }
            do_op({
                "type": "add",
                "row_target": r,
                "row_source": c,
                "multiple": -1 * value
            });
        }
    }
    return {
        result: current_mat,
        operations
    };
};
let cv_1 = Vector.from_array([2, -2, -1, -3], 4);
let cv_2 = Vector.from_array([-3, 2, 3, -2], 4);
let cv_3 = Vector.from_array([-2, -2, 3, -2], 4);
let cv_4 = Vector.from_array([3, 0, 2, 2], 4);
let mat = Matrix.from_column_vectors(4, cv_1, cv_2, cv_3, cv_4);
rref(mat);
//# sourceMappingURL=index.js.map