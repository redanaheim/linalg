# linalg
FP linalg lib for hw and rote stuff like expressing a vector in another basis, etc.

## Things you can do
The class methods should be very self-explanatory, but:
### Matrix
#### Matrix.transposed()
Returns the transposed matrix.
#### Matrix.right_multiply(other: Matrix), Matrix.left_multiply(other: Matrix)
Returns the matrix product. If a dimension of one matrix is not large enough, zeros are filled in.
#### Matrix.right_multiply_vector(other: Vector)
Returns the matrix-vector product, treating the vector as a column vector. (equivalent to multiplication by an n x 1 matrix)
#### Matrix.rref()
Returns an object of the form
```ts
{
  "result": Matrix,
  "operations": RowOp[],
  "pivots": number[]
}
```
where `result` is the reduced matrix, `operations` is an in-order list of row operations as applied, and `pivots` is a list of pivot columns from left to right.
#### Matrix.inv()
Returns the inverse matrix, or undefined if it does not exist.
#### Matrix.img_basis()
Returns an array of vectors that span the image of the transformation specified by the matrix.
#### Matrix.kl_basis()
Returns an array of vectors that span the kernel of the transformation specified by the matrix, or [] if the kernel is the set with the zero vector.
#### Matrix.with_basis(...basis: Vector[])
Returns the matrix, assumed to be expressed in the standard basis, expressed in the given basis.
#### Matrix.change_basis(basis_source: Vector[], basis_target: Vector[])
Returns the matrix expressed in basis_target, where the original matrix was expressed in basis_source.
