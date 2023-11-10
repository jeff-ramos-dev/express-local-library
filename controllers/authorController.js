const Author = require("../models/author");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const debug = require("debug")("author");

// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {
    const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
    res.render("index", {
        title: "Author List",
        author_list: allAuthors,
        route: "author_list.ejs",
    });
});

// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
    // Get details of author and all their books (in parallel)
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (author === null) {
        // No results.
        debug(`id not found on get: ${req.params.id}`);
        const err = new Error("Author not found");
        err.status = 404;
        return next(err);
    }

    res.render("index", {
        title: "Author Detail",
        author: author,
        author_books: allBooksByAuthor,
        route: "author_detail.ejs",
    });
});

// Display Author create form on GET.
exports.author_create_get = asyncHandler(async (req, res, next) => {
    res.render("index", { title: "Create Author", route: "author_form.ejs" });
});

// Handle Author create on POST.
exports.author_create_post = [
    // Validate and sanitize fields.
    body("first_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("First name must be specified.")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("family_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("Family name must be specified.")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render("index", {
                title: "Create Author",
                author: author,
                errors: errors.array(),
                route: "author_form.ejs",
            });
            return;
        } else {
            // Data from form is valid.

            // Save author.
            await author.save();
            // Redirect to new author record.
            res.redirect(author.url);
        }
    }),
];

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
    // Get details of author and all their books (in parallel)
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (author === null) {
        // No results.
        debug(`id not found on delete: ${req.params.id}`);
        res.redirect("/catalog/authors");
    }

    res.render("index", {
        title: "Delete Author",
        author: author,
        author_books: allBooksByAuthor,
        route: "author_delete.ejs",
    });
});

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
    // Get details of author and all their books (in parallel)
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (allBooksByAuthor.length > 0) {
        // Author has books. Render in same way as for GET route.
        res.render("index", {
            title: "Delete Author",
            author: author,
            author_books: allBooksByAuthor,
            route: "author_delete.ejs",
        });
        return;
    } else {
        // Author has no books. Delete object and redirect to the list of authors.
        await Author.findByIdAndRemove(req.body.authorid);
        res.redirect("/catalog/authors");
    }
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
    // Get all Authors for form.
    const author = await Author.findById(req.params.id);

    if (author === null) {
        // No results
        debug(`id not found on update: ${req.params.id}`);
        const err = new Error("author not found");
        err.status = 404;
        return next(err);
    }

    res.render("index", {
        title: "Update Author",
        author: author,
        route: "author_form.ejs",
    });
});

// Handle Author update on POST.
exports.author_update_post = [
    // Validate and sanitize fields.
    body("first_name", "First Name must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("family_name", "Family Name must not be empty")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("date_of_birth").trim().escape(),
    body("date_of_death").trim().escape(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id, // This is required, or a new ID will be assigned!
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            res.render("index", {
                title: "Update Author",
                author: author,
                errors: errors.array(),
                route: "author_form.ejs",
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            const updatedAuthor = await Author.findByIdAndUpdate(
                req.params.id,
                author,
                {}
            );
            // Redirect to author detail page.
            res.redirect(updatedAuthor.url);
        }
    }),
];
