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
    apply_row_op(op) {
        switch (op.type) {
            case "swap": {
                return new Vector(i => {
                    if (i === op.row_one)
                        return this.get(op.row_two);
                    else if (i === op.row_two)
                        return this.get(op.row_one);
                    else
                        return this.get(i);
                }, this.length);
            }
            case "set": {
                return new Vector(i => {
                    if (i === op.row_target)
                        return this.get(op.row_source) * op.multiple;
                    else
                        return this.get(i);
                }, this.length);
            }
            case "add": {
                return new Vector(i => {
                    if (i === op.row_target)
                        return this.get(op.row_source) * op.multiple + this.get(op.row_target);
                    else
                        return this.get(i);
                }, this.length);
            }
        }
    }
    apply_row_ops(...ops) {
        let res = this;
        for (const op of ops) {
            res = res.apply_row_op(op);
        }
        return res;
    }
    join(other) {
        const getter = (idx) => {
            if (this.length === undefined || idx < this.length)
                return this.get(idx);
            else
                return other.get(idx);
        };
        return new Vector(getter, (this.length === undefined || other.length === undefined) ? undefined : length + other.length);
    }
    elw_op(fn) {
        return new Vector(idx => fn(this.get(idx)), this.length);
    }
    elw_op_other(other, fn) {
        return new Vector(idx => fn(this.get(idx), other.get(idx)), this.length);
    }
    cross(other) {
        return this.elw_op_other(other, (x, y) => (x * y));
    }
    dot(other, max_length = 1) {
        let total = 0;
        for (let i = 0; i < (this.length ?? max_length); i++) {
            total += this.get(i) * other.get(i);
        }
        return total;
    }
    lin_comb_coefficients(column_size = this.length ?? 5, ...vectors) {
        const cv_matrix = Matrix.from_column_vectors(column_size, ...vectors);
        const reduced = cv_matrix.rref();
        const right_column = this.apply_row_ops(...reduced.operations);
        for (let c = 0; c < reduced.result.columns; c++) {
            if (reduced.pivots.includes(c) === false)
                return undefined;
        }
        return right_column;
    }
    print_item(idx, precision = 3) {
        return (+parseFloat((this.get(idx).toFixed(precision)))).toString();
    }
    toString(max_length = 5, precision = 3) {
        let buffer = [];
        for (let i = 0; (i < (this.length ?? 0)) && (i < max_length); i++) {
            buffer.push(this.print_item(i, precision));
        }
        return `[${buffer.join(", ")}]`;
    }
    toColumn(spacing = 1, max_length = 5, precision = 3) {
        let buffer = [];
        for (let i = 0; (i < (this.length ?? 0)) && (i < max_length); i++) {
            buffer.push(this.print_item(i, precision));
        }
        return buffer.join(`\n`.repeat(spacing));
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
    get_row(row) {
        return new Vector(i => this.get(row, i), this.columns);
    }
    get_column(column) {
        return new Vector(i => this.get(i, column), this.rows);
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
    static id(rows, columns) {
        const getter = (row, col) => {
            if (row === col)
                return 1;
            else
                return 0;
        };
        return new Matrix(getter, rows, columns);
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
    right_multiply(other) {
        const getter = (row, col) => {
            return this.get_row(row).dot(other.get_column(col));
        };
        return new Matrix(getter, this.rows, other.columns);
    }
    left_multiply(other) {
        return other.right_multiply(this);
    }
    adjoin_down(other) {
        const getter = (row, col) => {
            if (row >= this.rows)
                return other.get(row - this.rows, col);
            else
                return this.get(row, col);
        };
        return new Matrix(getter, this.rows + other.rows, this.columns);
    }
    adjoin_right(other) {
        const getter = (row, col) => {
            if (col >= this.columns)
                return other.get(row, col - this.columns);
            else
                return this.get(row, col);
        };
        return new Matrix(getter, this.rows, this.columns + other.columns);
    }
    adjoin_up(other) {
        return other.adjoin_down(this);
    }
    adjoin_left(other) {
        return other.adjoin_right(this);
    }
    slice(end_row, end_column, start_row = 0, start_column = 0) {
        const getter = (row, col) => {
            if (row >= (end_row - start_row))
                return 0;
            if (col >= (end_column - start_column))
                return 0;
            return this.get(row - start_row, col - start_column);
        };
        return new Matrix(getter, end_row - start_row, end_column - start_column);
    }
    elw_op(fn) {
        return new Matrix((i, j) => fn(this.get(i, j)), this.rows, this.columns);
    }
    elw_op_other(other, fn) {
        return new Matrix((i, j) => fn(this.get(i, j), other.get(i, j)), this.rows, this.columns);
    }
    add(other) {
        return this.elw_op_other(other, (a, b) => (a + b));
    }
    add_scalar(scalar) {
        return this.elw_op(x => (x + scalar));
    }
    multiply_scalar(scalar) {
        return this.elw_op(x => (x * scalar));
    }
    eq(other) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                if (this.get(r, c) !== other.get(r, c))
                    return false;
            }
        }
        return true;
    }
    apply_row_op(op) {
        switch (op.type) {
            case "swap": {
                return new Matrix((i, j) => {
                    if (i === op.row_one)
                        return this.get(op.row_two, j);
                    else if (i === op.row_two)
                        return this.get(op.row_one, j);
                    else
                        return this.get(i, j);
                }, this.rows, this.columns);
            }
            case "set": {
                return new Matrix((i, j) => {
                    if (i === op.row_target)
                        return this.get(op.row_source, j) * op.multiple;
                    else
                        return this.get(i, j);
                }, this.rows, this.columns);
            }
            case "add": {
                return new Matrix((i, j) => {
                    if (i === op.row_target)
                        return this.get(op.row_source, j) * op.multiple + this.get(op.row_target, j);
                    else
                        return this.get(i, j);
                }, this.rows, this.columns);
            }
        }
    }
    apply_row_ops(...ops) {
        let res = this;
        ops.forEach(o => res = res.apply_row_op(o));
        return res;
    }
    rref() {
        let operations = [];
        let pivots = [];
        let current_mat = this;
        const do_op = (op) => {
            current_mat = current_mat.apply_row_op(op);
            operations.push(op);
        };
        let last_pivot_spot = 0;
        for (let c = 0; c < Math.min(this.columns, this.rows); c++) {
            let min_dist = Number.POSITIVE_INFINITY;
            let row_index = -1;
            for (let r = last_pivot_spot; r < this.rows; r++) {
                let item = this.get(r, c);
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
            pivots.push(c);
            for (let r = 0; r < this.rows; r++) {
                if (r === current_row_pivot)
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
                    "row_source": current_row_pivot,
                    "multiple": -1 * value
                });
            }
        }
        return {
            result: current_mat,
            operations,
            pivots
        };
    }
    inv() {
        if (this.rows !== this.columns)
            return undefined;
        let res = this.rref();
        if (res.result.eq(Matrix.id(this.rows, this.columns))) {
            return Matrix.id(this.rows, this.columns).apply_row_ops(...res.operations);
        }
        else
            return undefined;
    }
    img_basis() {
        let res = this.rref();
        return res.pivots.map(i => this.get_column(i));
    }
    get_pivot_row(col) {
        for (let r = 0; r < this.rows; r++) {
            if (this.get(r, col) === 1)
                return r;
        }
        return -1;
    }
    kl_basis() {
        let res = this.rref();
        console.log(res.result.print());
        console.log(res);
        let res_basis = [];
        for (let c = 0; c < this.columns; c++) {
            if (res.pivots.includes(c))
                continue;
            let basis = [];
            for (let i = 0; i < this.columns; i++) {
                if (res.pivots.includes(i)) {
                    const pivot_row = res.result.get_pivot_row(i);
                    const item = res.result.get(pivot_row, c);
                    basis.push(-1 * item);
                }
                else if (i === c) {
                    basis.push(1);
                }
                else {
                    basis.push(0);
                }
            }
            res_basis.push(Vector.from_array(basis, basis.length));
        }
        return res_basis;
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
let cv_1 = Vector.from_array([1, 0, -1], 3);
let cv_2 = Vector.from_array([1, 1, 0], 3);
let cv_3 = Vector.from_array([0, -1, 1], 3);
let test_vector = Vector.from_array([9, 5, 3], 3);
let a = test_vector.lin_comb_coefficients(3, cv_1, cv_2, cv_3);
console.log(a.toString());
//# sourceMappingURL=index.js.map