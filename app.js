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
        response.redirect("/success");
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
      var hashedPassword = bcrypt.hashSync("1234",10);
      console.log(hashedPassword);
      console.log("req.body",req.body.password,user.password)
      // TODO: Fix this compare -> compareSync
          var matchPassword = bcrypt.compare(
            req.body.password,
            user.password
                    ,
         (error, result)=>{
          console.log(results, result)
          if (result) {
            req.session.loggedin = true;
            req.session.username = name;
            res.redirect("/membersOnly");
          }else{
            res.send("Incorrect password!");
            res.end();
          }
          });
        } else {
          res.send("The user name is not found!");
        }
        //res.end();
      }
    );
  } else {
    res.send("Please enter Username and Password!");
    res.end();
  }
});

//app.get('/voteresults', function (req, res) {
  //res.render("voteresults");
//});

app.get('/voteresults', function (req, res) {
   if (!req.session.loggedin) {
     res.redirect('/login');
     res.end();
   }
   //} else {
     // Check if the user is an admin
     // Get the user from the database
     //conn.query('SELECT * FROM users WHERE username = ?', [req.session.username], function (error, results, fields) {
       //if (error) throw error;
       //console.log('User found in database', results);
 
       //if (results.length > 0) {
         //var user = results[0];
         //console.log('User', user);
         //if (user.is_admin) {
           //console.log('User is admin');
 
           // Fetch all the ratings from the database
 
           conn.query('SELECT * FROM ratings', function (error, results, fields) {
             if (error) throw error;
             console.log('Ratings From database', results);
 
             // Create a histogram of the ratings
 
             var histogram = {
               '1': { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
               '2': { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
               '3': { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
             };
 
             for (var i = 0; i < results.length; i++) {
               var rating = results[i];
               histogram[rating.product_id][rating.rating]++;
             }
 
             console.log('Histogram', histogram);
 
             res.render('voteresults', { ratings: histogram });
           });
          
       }
     );
   




//users can access this if they are logged in
app.get("/membersOnly", function (req, res, next) {
  if (req.session.loggedin) {
    res.render("membersOnly");
  } else {
    res.send("Please login to view this page!");
  }
});

app.get("/vojam", function (req, res) {
  if(req.session.loggedin) {
  res.render("vojam");
} else {
  res.send("Please login to view this page!");
}
});

// Process rating submission
app.post('/submit_ratings', function (req, res) {
  if (!req.session.loggedIn) {
    res.redirect('/membersOnly');
    res.end();
  }

  console.log('Rating Submission', req.body);
// Who rated the product
console.log('User', req.session.name);


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
      [ratings[i].product_id, ratings[i].rating, req.session.name],
      function (error, results, fields) {
        if (error) throw error;
        console.log('Rating added to database');
      },
    );
  }
});
 
  

app.get("/blog", function (req, res) {
  res.render("blog");
});

app.get("/comments", function (req, res) {
  res.render("comments");
});

app.get("/success", function (req, res) {
  res.render("success");
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
      res.redirect("/success");
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
      res.redirect("/success");
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
