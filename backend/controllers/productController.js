import asyncHandler from "express-async-handler"
import Product from "../models/productModel.js"
  
// @desc    Fetch all product
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async(req, res) => {
    const pageSize = 10
    const page = Number(req.query.pageNumber) || 1

    const keyword = req.query.keyword ? {
        name: {
            $regex: req.query.keyword,
            $options: "i"
        }
    } : {}

    const count = await Product.countDocuments({...keyword})
    const products = await Product.find({...keyword}).limit(pageSize).skip(pageSize * (page - 1))
    
    res.json({products, page, pages: Math.ceil(count / pageSize )})
})


// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async(req, res) => {
    const product = await Product.findById(req.params.id)

    if(product) {
        res.json(product)
    } else {
        // res.status(404).json({ message: "Product not Found"}) 
        // becuase we have the custom error handler now we can use the 
        // throw new Error() method

        res.status(404)
        throw new Error("product not found")
    }
})


// @desc    delete product
// @route   Delete /api/products/:id
// @access  Private/admin
const deleteProduct = asyncHandler(async(req, res) => {
    const product = await Product.findById(req.params.id)
 
    if(product) {
        await product.remove()
        res.json({ message: "product remove"})
    } else {
        res.status(404)
        throw new Error("product not found")
    }
})

// @desc    Create product
// @route   Post /api/products
// @access  Private/admin
const createProduct = asyncHandler(async(req, res) => {
    const product = new Product({
        name: "Sample name",
        price: 0,
        user: req.user._id,
        image: "/images/sample.jpg",
        brand: "Sample brnad",
        category: "Sample category",
        countInStock:0,
        numReviews: 0,
        description: "Sample description"
    })

    const createdProduct = await product.save()
    res.status(201).json(createdProduct)
})

// @desc    Update product
// @route   Put /api/products/:id
// @access  Private/admin
const updateProduct = asyncHandler(async(req, res) => {
   const { 
       name, 
       price, 
       description, 
       image, 
       brand,
       category,
       countInStock
    } = req.body

    const product = await Product.findById(req.params.id)

    if(product){
        product.name = name
        product.price = price
        product.description = description
        product.image = image
        product.brand = brand
        product.category = category
        product.countInStock = countInStock


        const updatedProduct = await product.save()
        res.status(201).json(updatedProduct)
    } else {
        res.status(404)
        throw new Error("Product not Found")
    }
})

// @desc    Create new product
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async(req, res) => {
    const { rating, comment } = req.body
 
     const product = await Product.findById(req.params.id)
 
     if(product){
         const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString())

         if(alreadyReviewed){
            res.status(404)
            throw new Error("Product already reviewed")
         }

         const review = {
             name: req.user.name,
             rating: Number(rating),
             comment,
             user: req.user._id
         }

         product.reviews.push(review)
         product.numReviews = product.reviews.length

         product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length

         await product.save()
         res.status(201).json({message: "Review added"})

     } else {
         res.status(404)
         throw new Error("Product not Found")
     }
 })


// @desc    Get top rated product
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async(req, res) => {
    const products = await Product.find({}).sort({ rating: -1}).limit(3)

    res.json(products)
 })

export { getProducts, getProductById, deleteProduct, createProduct, updateProduct, createProductReview, getTopProducts}