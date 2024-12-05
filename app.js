var express = require("express");
var app = express();
var bcrypt = require("bcrypt");
var session = require("express-session");
var conn = require("./dbConfig");
var session = require("express-session");

app.set("view engine", "ejs");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "yoursecret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use("/public", express.static("public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes home
app.get("/", function (req, res) {
  res.render("home");
});

// Routes login
app.get("/login", function (req, res) {
  res.render("login.ejs");
});

// Routes register
app.get("/register", function (req, res) {
  res.render("register");
});

// Registration Process - TO DO - Troubleshoot why login isn't working for new registered members
app.post("/reg", function (request, response) {
  console.log("Register Request", request.body);

  if (request.body.password != request.body.password_confirm) {
    console.log("Password not match");
    response.redirect("/register");
    response.end();
  } else {
    console.log("Password match");
    // Hash the password

    var hashedPassword = bcrypt.hashSync(request.body.password, 10);
    console.log("Hashed Password", hashedPassword);

    // ADD TO DATABASE

    conn.query(
      "INSERT INTO users (name, password) VALUES (?, ?)",
      [request.body.username, hashedPassword],
      function (error, results, fields) {
        if (error) throw error;
        console.log("User added to database");
        response.redirect("/login");
      }
    );
  }
});

// Login Process
app.post("/auth", function (req, res) {
  let name = req.body.username;
  let password = req.body.password;
  if (name && password) {
    conn.query(
      "SELECT * FROM users WHERE name = ?",
      [name],
      function (error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {
          var user = results[0];
      console.log('User', user);
      // TODO: Fix this compare -> comapreSync
          var matchPassword = bcrypt.compare(
            req.body.password,
            user.password
                    );
          console.log(results, matchPassword)
          if (matchPassword) {
            req.session.loggedin = true;
            req.session.username = name;
            res.redirect("/membersOnly");
          }else{
            res.send("Incorrect password!");
          }
        } else {
          res.send("The user name is not found!");
        }
        res.end();
      }
    );
  } else {
    res.send("Please enter Username and Password!");
    res.end();
  }
});

//users can access this if they are logged in
app.get("/membersOnly", function (req, res, next) {
  if (req.session.loggedin) {
    res.render("membersOnly");
  } else {
    res.send("Please login to view this page!");
  }
});

app.get("/vojam", function (req, res) {
  res.render("vojam");
});

// Process rating submission
app.post('/submit_ratings', function (req, res) {
  if (!req.session.loggedIn) {
    res.redirect('/membersOnly');
    res.end();
  }

  console.log('Rating Submission', req.body);
// Who rated the product
console.log('User', req.session.username);


  var ratings = [
    {
      'product_id': 1,
      'rating': req.body.rating_product1,
    },
    {
      'product_id': 2,
      'rating': req.body.rating_product2,
    },
    {
      'product_id': 3,
      'rating': req.body.rating_product3,
    },
  ];
  console.log('Ratings', ratings);
  // Add to database

  for (var i = 0; i < ratings.length; i++) {
    conn.query(
      'INSERT INTO ratings (product_id, rating) VALUES (?, ?)',
      [ratings[i].product_id, ratings[i].rating],
      function (error, results, fields) {
        if (error) throw error;
        console.log('Rating added to database');
      },
    );
  }
});

app.get('/voteresults', function (req, res) {
  res.render("voteresults");
});
  
    
  

app.get("/blog", function (req, res) {
  res.render("blog");
});

app.get("/comments", function (req, res) {
  res.render("comments");
});

// Route to post contact message

app.post("/contact", function (req, res) {
  console.log(req.body);
  conn.query(
    "INSERT INTO contact(name, email, message) VALUES (?, ?, ?)",
    [req.body.name, req.body.email, req.body.message],
    function (error, results, fields) {
      if (error) throw error;
      console.log("Message Sent");
      res.redirect("/");
    }
  );
});

// Route to post comment on blog

app.post("/comment", function (req, res) {
  console.log(req.body);
  conn.query(
    "INSERT INTO comment(name, email, comment) VALUES (?, ?, ?)",
    [req.body.name, req.body.email, req.body.comment],
    function (error, results, fields) {
      if (error) throw error;
      console.log("Comment Sent");
      res.redirect("/blog");
    }
  );
});

app.get("/admin", function (req, res) {
  // Fetch all the comments from the database

  conn.query("SELECT * FROM contact", function (error, results, fields) {
    if (error) throw error;
    console.log("Comments From database", results);
    res.render("admin", { commentsData: results });
  });
});

// Route for logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.listen(3000);
console.log("Node app is running on port 3000");
