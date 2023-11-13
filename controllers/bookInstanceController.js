const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const debug = require("debug")("bookInstance");

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
        debug(`id not found on get: ${req.params.id}`);
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
    const allBooks = await Book.find({}, "title").exec();

    res.render("index", {
        title: "Create BookInstance",
        book_list: allBooks,
        route: "bookinstance_form.ejs",
    });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    // Validate and sanitize fields.
    body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
    body("imprint", "Imprint must be specified")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if (!errors.isEmpty()) {
            // There are errors.
            // Render form again with sanitized values and error messages.
            const allBooks = await Book.find({}, "title".exec());

            res.render("index", {
                title: "Create BookInstance",
                book_list: allBooks,
                selected_book: bookInstance.book._id,
                errors: errors.array(),
                bookinstance: bookInstance,
                route: "bookinstance_form.ejs",
            });
            return;
        } else {
            // Data from form is valid
            await bookInstance.save();
            res.redirect(bookInstance.url);
        }
    }),
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    // Get details of book instance
    const bookInstance = await BookInstance.findById(req.params.id)
        .populate("book")
        .exec();

    // if book instance doesn't exist, redirect to book instance list
    if (bookInstance === null) {
        debug(`id not found on delete: ${req.params.id}`);
        res.redirect("/catalog/bookinstances");
    }

    // render book delete page
    res.render("index", {
        title: "Delete Book Instance",
        book_instance: bookInstance,
        route: "bookinstance_delete.ejs",
    });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    // Get details of book instance
    const bookInstance = await BookInstance.findById(req.params.id)
        .populate("book")
        .exec();

    if (bookInstance === null) {
        res.redirect("/catalog/bookinstances");
    } else {
        await BookInstance.findByIdAndRemove(req.body.bookinstanceid);
        res.redirect("/catalog/bookinstances");
    }
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
    // Get book instance and list of books (in parallel)
    const [bookInstance, allBooks] = await Promise.all([
        BookInstance.findById(req.params.id).exec(),
        Book.find().exec(),
    ]);

    if (bookInstance === null) {
        // No results
        debug(`id not found on update: ${req.params.id}`);
        const err = new Error("book instance not found");
        err.status = 404;
        return next(err);
    }

    res.render("index", {
        title: "Update Book Instance",
        bookinstance: bookInstance,
        book_list: allBooks,
        route: "bookinstance_form.ejs",
    });
});

// Handle BookInstance update on POST.
exports.bookinstance_update_post = [
    // Validate and sanitize fields.
    body("book", "Book must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("imprint", "Imprint must not be empty")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("due_back", "Date must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("status", "Status must not be empty")
        .trim()
        .isLength({ min: 1 })
        .escape(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            due_back: req.body.due_back,
            status: req.body.status,
            _id: req.params.id, // This is required, or a new ID will be assigned!
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all books for form
            const allBooks = await Book.find();

            res.render("index", {
                title: "Update Book Instance",
                book_list: allBooks,
                errors: errors.array(),
                route: "bookinstance_update.ejs",
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            const updatedBookInstance = await BookInstance.findByIdAndUpdate(
                req.params.id,
                bookInstance,
                {}
            );
            // Redirect to book detail page.
            res.redirect(updatedBookInstance.url);
        }
    }),
];
