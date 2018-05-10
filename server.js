var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
var path = require('path');

//session
const flash = require('express-flash');
app.use(flash());
var session = require('express-session');
app.use(session({
  secret: 'keyboardkittehohhhhhhyyeaaaahhhhh',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}))

var bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

//mongoose
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/secret_dashboard');


var UsersSchema = new mongoose.Schema({
    first_name: {type: String, required: [true, 'First Name is required, my man!'], minlength: [3," first name min length is 3 characters"]},
    last_name: {type: String, required: [true, "Last Name is required, my man!"], minlength: [3," last name min length is 3 characters"]},
    birthday: {type: Date, required: [true, "Please put your date of birth so we can celebrate!"]},
    password: {type: String, required: [true, "Password is required, bro!"], minlength: [10," min length 10 characters"]},
    email: {
        type: String,
        lowercase: true,
        required: true,
        unique: true
    }
});
mongoose.model('User', UsersSchema); 
var User = mongoose.model('User');


var CommentSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Please enter a name"], minlength: [6, "min length 6 characters"]},
    comment: { type: String, required: [true, "Please enter a comment"], minlength: [10," min length 10 characters"]}
})
mongoose.model('Comment', CommentSchema); 
var Comment = mongoose.model('Comment');

var MessageSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Please enter a name"], minlength: [6, "min length 6 characters"]},
    message: { type: String, required: [true, "Please enter a message"], minlength: [10," min length 10 characters"]},
    comments: [CommentSchema]
})
mongoose.model('Message', MessageSchema); 
var Message = mongoose.model('Message');

// Use native promises
mongoose.Promise = global.Promise;

app.use(express.static(path.join(__dirname, './static')));

app.set('views', path.join(__dirname, './views'));

app.set('view engine', 'ejs');


// Routes

// index get route
app.get('/', function(req, res) {
    res.render('index');  
 })
 // login success get route
 app.get("/secrets", function(req, res){
     if(req.session.user_id) {
         User.findOne({_id: req.session.user_id}, function(err, user){
             if(err) {
                 res.redirect("/");
             }
             else {
                Message.find({}, function(err, messages) {
                    console.log(messages);
                    res.render('secrets', {messages: messages});
                }) 
             }
         });
     }
     else {
         res.redirect("/");
     }
 });
 
 // Register post route
 app.post('/register', function(req, res) {
     console.log("POST DATA", req.body);
     var user = new User();
     console.log(user);
     user.first_name= req.body.first_name
     user.last_name = req.body.last_name
     user.birthday = req.body.birthday
     user.email = req.body.email
     bcrypt.hash(req.body.password, 10, function(err, hash){
         if(err) {
             res.redirect("/");
         }
         else {
             user.password = hash;
             user.save(function(err){
                 if(err) {
                     res.redirect("/");
                 }
                 else {
                     req.session.user_id = user._id;
                     res.redirect("/secrets");
                 }
             });
         }
     });
 });
  
   // login post route
 app.post('/login', (req, res) => {
     console.log(" req.body: ", req.body);
         User.findOne({email: req.body.email}, function(err, user){
         if (err) {
             console.log("user doesnt exist");
             console.log("We have an error!", err);
             res.redirect("/");
         }
         else {
             if (user){
                 console.log(user);
                 bcrypt.compare(req.body.password, user.password, function(err, result){
                     if(result) {
                         req.session.user_id = user._id;
                         res.redirect("/secrets");
                     }
                     else {
                         res.redirect("/");
                     }
                 })
             }
             else{
                 console.log('hey, this user doesnt exist, pal!');
                 res.redirect('/');
             }
     }
 })
 });
 


// messages post route
app.post('/secrets', function(req, res) {
    console.log("POST DATA", req.body);
    var message = new Message();
    message.name= req.body.name
    message.message = req.body.message 
    message.comments = [];
    message.save(function(err) {
      console.log("hello");
      if(err) {
        console.log("Error: ", err)
      for(var key in err.errors){
          req.flash('errors', err.errors[key].message);
      }
        res.redirect("/secrets");
      } else { 
        res.redirect('/secrets');
      }
    })
  })  

  // comments post route
  app.post('/comment/:id', function(req, res) {
    console.log("POST DATA", req.body);
        Message.findById({_id: req.params.id}, function(err, message){
             if(err){
                console.log("We have an error!", err);
                for(var key in err.errors){
                    req.flash('errors', err.errors[key].message);
                }
             }
             else {
                console.log("We have success!!");
                message.comments.push(({name: req.body.name, comment: req.body.comment}));
                message.save(function(err){
                    res.redirect("/secrets");
                })
            }
      })
})

// show/:id get route
app.get("/secrets/:id", (req, res) => {
    if (req.session.user_id === null || req.session.user_id === undefined) {
        console.log("error with user.id in session");
        res.redirect('/');
    }
    else {
    Message.findById({_id: req.params.id}, (err, message) => {
        if (err) {
            for(var key in err.errors){
                req.flash('errors', err.errors[key].message);
            }
        }
        else {
            res.render('show', {message: message});
        }
    })
}
})

// logout route
app.get("/logout", function(req, res){
    if(req.session.user_id) {
        delete req.session.user_id;
    }
    res.redirect("/");
})
      
// Setting our Server to Listen on Port: 8000

app.listen(8000, function() {
    console.log("listening on port 8000");
})