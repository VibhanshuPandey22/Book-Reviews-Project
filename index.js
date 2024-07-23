import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import env from "dotenv";

const port = 3000;
const app = express();
const API_URL = "https://covers.openlibrary.org/b";
env.config();

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });
db.connect();


//BASIC STRUCTURE OF BOOKS LIST : 

// let books = [
//  { 
//   id: 1, name: "book name",
//   author: "author name", 
//   summary: "summary of the book", 
//   notes: "review of the book",
//   rating: 10
//  },
// ];


app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

let books = [];

app.get("/", async (req, res) => {
    try{
        const result = await db.query("SELECT * FROM books");
        books = result.rows;
        res.render("index.ejs", {
            books: books,
            url: API_URL,
        });
    }catch(err){
      console.log(err);
    }
});

app.get("/sortByBest", async (req, res) => {
    try{
        const result = await db.query("SELECT * FROM books ORDER BY rating DESC");
        books = result.rows;
        res.render("index.ejs", {
            books: books,
            url: API_URL,
        });
    }catch(err){
      console.log(err);
    }
});

app.get("/sortByTitle", async (req, res) => {
    try{
        const result = await db.query("SELECT * FROM books ORDER BY name ASC");
        books = result.rows;
        res.render("index.ejs", {
            books: books,
            url: API_URL,
        });
    }catch(err){
      console.log(err);
    }
});


app.get("/new", (req, res) => {
    res.render("new.ejs");
});


app.post("/new", async (req, res) => {
    const result = req.body;
    const bookName = result.bookName;
    const authorName = result.authorName;
    const summary = result.summary;
    const notes = result.notes;
    try{
        await db.query("INSERT INTO books (name, author, summary, notes, rating, isbn_number) VALUES ($1, $2, $3, $4, $5, $6)", [bookName[0].toUpperCase() + bookName.substring(1), authorName[0].toUpperCase() + authorName.substring(1), summary[0].toUpperCase() + summary.substring(1), notes[0].toUpperCase() + notes.substring(1), result.rating, result.isbnNumber]);
        res.redirect("/");
    }catch(err){
      console.log(err);
      res.render("new.ejs", {
        error: "Please enter a valid rating (between 1 and 10)",
      });
    }
});


app.post("/editReview", async (req, res) => {
    const idToEdit = req.body.editId;
    try{
        const result = await db.query("SELECT * FROM books WHERE id = ($1)", [idToEdit]);
        const toBeEdited = result.rows[0];
        res.render("edit.ejs", {
            bookName: toBeEdited.name,
            authorName: toBeEdited.author,
            rating: toBeEdited.rating,
            summary: toBeEdited.summary,
            notes: toBeEdited.notes,
            isbn: toBeEdited.isbn_number,
            id: idToEdit,
        });
    }catch(err){
      console.log(err);
    }
});


app.post("/edit", async (req, res) => {
    const result = req.body;
    console.log(result);
    const id = req.body.editID;
    try{
        await db.query("UPDATE books SET name = $1, author = $2, summary = $3, notes = $4, rating = $5, isbn_number = $6 WHERE id = $7;", [result.bookName, result.authorName, result.summary, result.notes, result.rating, result.isbnNumber, id]);
        res.redirect("/");
    }catch(err){
      console.log(err);
      res.render("edit.ejs", {
        bookName: result.bookName,
        authorName: result.authorName,
        rating: result.rating,
        summary: result.summary,
        notes: result.notes,
        isbn: result.isbnNumber,
        id: id,
        error: "Please enter a valid rating (between 1 and 10)",
      });
    }
});


app.post("/delete", async (req, res) => {
    console.log(req.body);
    const idToDelete = req.body.deleteId;
    try{
        await db.query("DELETE FROM books WHERE id = ($1)", [idToDelete]);
        res.redirect("/");
    }catch(err){
      console.log(err);
    }
});


app.post("/bookReview", async (req, res) => {
    const id = req.body.reviewId;
    try{
        const result = await db.query("SELECT * FROM books WHERE id = ($1)", [id]);
        const review = result.rows[0];
        res.render("review.ejs", {
            id: id,
            bookName: review.name,
            authorName: review.author,
            rating: review.rating,
            summary: review.summary,
            notes: review.notes,
            url: API_URL,
            isbn: review.isbn_number,
        });
    }catch(err){
      console.log(err);
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

