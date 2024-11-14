var express = require('express'); 
var app = express(); 
var bcrypt = require('bcrypt');
var session = require('express-session');
var conn = require('./dbConfig');
app.set('view engine','ejs'); 
app.use(session({
    secret: 'yoursecret',
    resave: true,
    saveUninitialized: true
}));
app.use('/public', express.static('public'));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Routes home
app.get('/', function (req, res){ 
res.render("home"); 
}); 

// Routes login
app.get('/login', function(req, res) {
    res.render('login.ejs');
});

// Routes register
app.get('/register', function (req, res) {
    res.render('register');
  });

  // Registration Process
app.post('/reg', function (request, response) {
    console.log('Register Request', request.body);
  
    if (request.body.password != request.body.password_confirm) {
      console.log('Password not match');
      response.redirect('/register');
      response.end();
    } else {
      console.log('Password match');
      // Hash the password
  
      var hashedPassword = bcrypt.hashSync(request.body.password, 10);
      console.log('Hashed Password', hashedPassword);
  
      // ADD TO DATABASE
  
      conn.query(
        'INSERT INTO users (name, password) VALUES (?, ?)',
        [request.body.username, hashedPassword],
        function (error, results, fields) {
          if (error) throw error;
          console.log('User added to database');
          response.redirect('/login');
        },
      );
    }
  });

// Login Process
app.post('/auth', function(req, res) {
    let name = req.body.username;
    let password = req.body.password;
    if (name && password) {
        conn.query('SELECT * FROM users WHERE name = ? AND password = ?', [name, password],
            function(error, results, fields) {
                if (error) throw error;
                if (results.length > 0) {
                    req.session.loggedin = true;
                    req.session.username = name;
                    res.redirect('/membersOnly');
                } else {
                    res.send('Incorrect Username and/or Password!');
                }
                    res.end();
                });
            } else {
                res.send('Please enter Username and Password!');
                res.end();
            }
        });
    

//users can access this if they are logged in
app.get('/membersOnly', function (req, res, next) {
    if (req.session.loggedin) {
        res.render('membersOnly');
    }
    else {
        res.send('Please login to view this page!');
    }

});

app.get('/blog', function (req, res){
    res.render("blog");
})

app.get('/comments', function (req, res){
    res.render("comments");
})

// Route to post comment
//app.post('/submit', (req, res) => {
  //  const { name, email, message } = req.body;
  //  const sql = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
  //  db.query(sql, [name, email, message], (err, result) => {
  //      if (err) throw err;
  //      res.send('Contact information saved!');
  //  });
//});

// Route for logout
app.get('/logout', (req,res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(3000); 
console.log('Node app is running on port 3000'); 
