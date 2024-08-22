import mongoose from "mongoose";

const { Schema, model } = mongoose;

const productCategorySchema = new Schema(
  {
    category_name: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProductCategory = model("ProductCategory", productCategorySchema);

export default ProductCategory;
