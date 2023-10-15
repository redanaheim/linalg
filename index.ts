class Vector {
    private getter: (index: number) => number;
    length: number | undefined;

    constructor (getter: (index: number) => number, length: number | undefined) {
        this.getter = getter;
        this.length = length;
    }

    get (idx: number) {
        return this.getter(idx)
    }

    static from_array(arr: number[], length: number | undefined) {
        const getter = (idx: number) => {
            if (idx >= arr.length) return 0;
            return arr[idx];
        }
        return new Vector(getter, length)
    }
    
    apply_row_op (op: RowOp): Vector {
        switch (op.type) {
            case "swap": {
                return new Vector(i => {
                    if (i === op.row_one) return this.get(op.row_two)
                    else if (i === op.row_two) return this.get(op.row_one)
                    else return this.get(i)
                }, this.length)
            }
            case "set": {
                return new Vector(i => {
                    if (i === op.row_target) return this.get(op.row_source) * op.multiple
                    else return this.get(i)
                }, this.length)
            }
            case "add": {
                return new Vector(i => {
                    if (i === op.row_target) return this.get(op.row_source) * op.multiple + this.get(op.row_target)
                    else return this.get(i)
                }, this.length)
            }
        }
    }

    apply_row_ops (...ops: RowOp[]): Vector {
        let res: Vector = this;
        for (const op of ops) {
            res = res.apply_row_op(op);
        }
        return res;
    }

    join(other: Vector): Vector {
        const getter = (idx: number) => {
            if (this.length === undefined || idx < this.length) return this.get(idx)
            else return other.get(idx)
        }
        return new Vector(getter, (this.length === undefined || other.length === undefined) ? undefined : length + other.length)
    }

    elw_op (fn: (x: number) => number): Vector {
        return new Vector(idx => fn(this.get(idx)), this.length)
    }

    elw_op_other (other: Vector, fn: (x: number, y: number) => number): Vector {
        return new Vector(idx => fn(this.get(idx), other.get(idx)), this.length)
    }

    cross (other: Vector) {
        return this.elw_op_other(other, (x, y) => (x * y))
    }

    dot(other: Vector, max_length = 1) {
        let total = 0;
        for (let i = 0; i < (this.length ?? max_length); i++) {
            total += this.get(i) * other.get(i)
        }
        return total;
    }
    
    with_basis (column_size: number = this.length ?? 5, ...vectors: Vector[]): Vector | undefined {
        const cv_matrix = Matrix.from_column_vectors(column_size, ...vectors);
        const reduced = cv_matrix.rref();
        const right_column = this.apply_row_ops(...reduced.operations);

        for (let c = 0; c < reduced.result.columns; c++) {
            if (reduced.pivots.includes(c) === false) return undefined;
        }

        return right_column;
    }

    change_basis(column_size: number = this.length ?? 5, basis_source: Vector[], basis_target: Vector[]): Vector | undefined {
        let res = Vector.from_array((new Array(column_size)).fill(0), column_size);
        const source_in_target_coords = basis_source.map(x => x.with_basis(column_size, ...basis_target)) as Vector[];
        if (source_in_target_coords.some(x => x === undefined)) return undefined;
        for (let i = 0; i < source_in_target_coords.length; i++) {
            res = res.elw_op_other(source_in_target_coords[i], (x, y) => (x + this.get(i) * y))
        }
        return res;
    }

    print_item (idx: number, precision: number = 3): string {
        return (+parseFloat((this.get(idx).toFixed(precision)))).toString()
    }

    toString(max_length: number = 5, precision: number = 3): string {
        let buffer = [];
        for (let i = 0; (i < (this.length ?? 0)) && (i < max_length); i++) {
            buffer.push(this.print_item(i, precision));
        }
        return `[${buffer.join(", ")}]`
    }

    toColumn(spacing=1, max_length: number = 5, precision: number = 3): string {
        let buffer = []
        for (let i = 0; (i < (this.length ?? 0)) && (i < max_length); i++) {
            buffer.push(this.print_item(i, precision));
        }
        return buffer.join(`\n`.repeat(spacing))
    }

    static std_basis_vector(index: number, dim: number): Vector {
        return new Vector(i => (i === index) ? 1 : 0, dim);
    }

    static std_basis(dim: number): Vector[] {
        let res = [];
        for (let i = 0; i < dim; i++) {
            res.push(Vector.std_basis_vector(i, dim));
        }
        return res;
    }
    
}

class Matrix {
    private getter: (row: number, column: number) => number;
    rows: number;
    columns: number;

    constructor (getter: (row: number, column: number) => number, rows: number, columns: number) {
        this.getter = getter;
        this.rows = rows;
        this.columns = columns;
    }

    get (row: number, col: number) {
        return this.getter(row, col);
    }

    get_row (row: number) {
        return new Vector(i => this.get(row, i), this.columns);
    }

    get_column (column: number) {
        return new Vector(i => this.get(i, column), this.rows);
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

    static from_column_vectors(column_length: number, ...vectors: Vector[]) {
        const getter = (row: number, col: number) => {
            if (col >= vectors.length) return 0;
            else {
                let target_column = vectors[col];
                return target_column.get(row)
            }
        }
        return new Matrix(getter, column_length, vectors.length)
    }

    static from_row_vectors(row_length: number, ...vectors: Vector[]) {
        const getter = (row: number, col: number) => {
            if (row >= vectors.length) return 0;
            else {
                let target_row = vectors[row];
                return target_row.get(col)
            }
        }
        return new Matrix(getter, vectors.length, row_length)
    }

    static id(rows: number, columns: number): Matrix {
        const getter = (row: number, col: number) => {
            if (row === col) return 1;
            else return 0;
        }
        return new Matrix(getter, rows, columns)
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

    transposed (): Matrix {
        return new Matrix((i, j) => this.get(j, i), this.columns, this.rows)
    }

    right_multiply(other: Matrix): Matrix {
        const getter = (row: number, col: number): number => {
           return this.get_row(row).dot(other.get_column(col)); 
        }
        return new Matrix(getter, this.rows, other.columns)
    }

    left_multiply(other: Matrix): Matrix {
        return other.right_multiply(this);
    }

    right_multiply_vector(other: Vector): Vector {
        const getter = (idx: number): number => {
            return this.get_row(idx).dot(other);
        }
        return new Vector(getter, this.rows)
    }

    adjoin_down(other: Matrix): Matrix {
        const getter = (row: number, col: number): number => {
            if (row >= this.rows) return other.get(row - this.rows, col);
            else return this.get(row, col);
        }
        return new Matrix(getter, this.rows + other.rows, this.columns);
    }

    adjoin_right(other: Matrix): Matrix {
        const getter = (row: number, col: number): number => {
            if (col >= this.columns) return other.get(row, col - this.columns)
            else return this.get(row, col);
        }
        return new Matrix(getter, this.rows, this.columns + other.columns);
    }

    adjoin_up(other: Matrix): Matrix {
        return other.adjoin_down(this);
    }

    adjoin_left(other: Matrix): Matrix {
        return other.adjoin_right(this);
    }

    slice(end_row: number, end_column: number, start_row=0, start_column=0): Matrix {
        const getter = (row: number, col: number): number => {
            if (row >= (end_row - start_row)) return 0;
            if (col >= (end_column - start_column)) return 0;
            return this.get(row - start_row, col - start_column);
        }
        return new Matrix(getter, end_row - start_row, end_column - start_column);
    }

    elw_op (fn: (a: number) => number): Matrix {
        return new Matrix((i, j) => fn(this.get(i, j)), this.rows, this.columns);
    }

    elw_op_other(other: Matrix, fn: (a: number, b: number) => number): Matrix {
        return new Matrix((i, j) => fn(this.get(i, j), other.get(i, j)), this.rows, this.columns);
    }

    add (other: Matrix): Matrix {
        return this.elw_op_other(other, (a, b) => (a + b))
    }

    add_scalar (scalar: number): Matrix {
        return this.elw_op(x => (x + scalar));
    }

    multiply_scalar (scalar: number): Matrix {
        return this.elw_op(x => (x * scalar))
    }

    eq (other: Matrix): boolean {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                if (this.get(r, c) !== other.get(r, c)) return false;
            }
        }
        return true;
    }

    apply_row_op (op: RowOp): Matrix {
        switch (op.type) {
            case "swap": {
                return new Matrix((i, j) => {
                    if (i === op.row_one) return this.get(op.row_two, j)
                    else if (i === op.row_two) return this.get(op.row_one, j)
                    else return this.get(i, j)
                }, this.rows, this.columns)
            }
            case "set": {
                return new Matrix((i, j) => {
                    if (i === op.row_target) return this.get(op.row_source, j) * op.multiple
                    else return this.get(i, j)
                }, this.rows, this.columns)
            }
            case "add": {
                return new Matrix((i, j) => {
                    if (i === op.row_target) return this.get(op.row_source, j) * op.multiple + this.get(op.row_target, j)
                    else return this.get(i, j)
                }, this.rows, this.columns)
            }
        }
    }

    apply_row_ops (...ops: RowOp[]): Matrix {
        let res: Matrix = this;
        ops.forEach(o => res = res.apply_row_op(o));
        return res;
    }

    rref (): { result: Matrix, operations: RowOp[], pivots: number[] } {
        let operations = [] as RowOp[];
        let pivots = [];

        let current_mat: Matrix = this;

        const do_op = (op: RowOp) => {
            current_mat = current_mat.apply_row_op(op)
            operations.push(op);
        }

        let last_pivot_spot = 0;

        for (let c = 0; c < Math.min(this.columns, this.rows); c++) {
            let min_dist = Number.POSITIVE_INFINITY;
            let row_index = -1;

            // Find the closest value multiplicatively to 1 so we can move it to the top row
            for (let r = last_pivot_spot; r < this.rows; r++) {
                let item = this.get(r, c);
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

            pivots.push(c);

            for (let r = 0; r < this.rows; r++) {
                if (r === current_row_pivot) continue;
                let pivot = current_mat.get(current_row_pivot, c);
                if (pivot !== 1) continue;
                let value = current_mat.get(r, c);
                if (value === 0) {
                    continue;
                }
                do_op({
                    "type": "add",
                    "row_target": r,
                    "row_source": current_row_pivot,
                    "multiple": -1 * value
                })
            }
        }

        return {
            result: current_mat,
            operations,
            pivots
        }
    }

    inv (): Matrix | undefined {
        if (this.rows !== this.columns) return undefined;
        let res = this.rref();
        if (res.result.eq(Matrix.id(this.rows, this.columns))) {
            return Matrix.id(this.rows, this.columns).apply_row_ops(...res.operations);
        }
        else return undefined;
    }
    
    img_basis(): Vector[] {
        let res = this.rref();
        return res.pivots.map(i => this.get_column(i));
    }

    get_pivot_row (col: number): number {
        for (let r = 0; r < this.rows; r++) {
            if (this.get(r, col) === 1) return r;
        }
        return -1;
    }

    kl_basis(): Vector[] {
        let res = this.rref();
        console.log(res.result.print())
        console.log(res)
        let res_basis = [];
        
        for (let c = 0; c < this.columns; c++) {
            if (res.pivots.includes(c)) continue;

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

    with_basis(...basis: Vector[]) {
        return this.change_basis(Vector.std_basis(basis.length), basis);
    }

    change_basis(basis_source: Vector[], basis_target: Vector[]) {
        const getter = (row: number, col: number): number => {
            let basis_changed_basis = basis_target[col].with_basis(this.rows, ...basis_source)
            if (basis_changed_basis === undefined) return 0;
            let transformed = this.right_multiply_vector(basis_changed_basis);
            let back_transformed = transformed.change_basis(this.rows, basis_source, basis_target);
            if (back_transformed === undefined) return 0;
            return back_transformed.get(row);
        }
        return new Matrix(getter, this.rows, this.columns);
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
