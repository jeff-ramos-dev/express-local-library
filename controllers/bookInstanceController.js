const BookInstance = require("../models/bookinstance");
const asyncHandler = require("express-async-handler");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find().populate("book").exec();

    res.render("index", {
        title: "Book Instance List",
        bookinstance_list: allBookInstances,
        route: "bookinstance_list.ejs",
    });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id)
        .populate("book")
        .exec();

    if (bookInstance === null) {
        // No results.
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
    }

    res.render("index", {
        title: "Book:",
        bookinstance: bookInstance,
        route: "bookinstance_detail.ejs",
    });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance create GET");
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance create POST");
});

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance delete GET");
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance delete POST");
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance update GET");
});

// Handle BookInstance update on POST.
exports.bookinstance_update_post = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance update POST");
});