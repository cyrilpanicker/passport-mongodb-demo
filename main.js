var mongoose = require('mongoose');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('./models/user');

mongoose.connect('mongodb://127.0.0.1:27017/demo',function(error){
    if(error){
        console.log('error while connecting to database');
        process.exit(1);
    }else{
        console.log('database connection successful');
    }
});

var sessionConfig = {
    secret:'pistah.suma.kira.somari.jama.kiraya',
    resave:false,
    saveUninitialized:false
};

passport.use('local',new LocalStrategy({
    usernameField:'username',
    passwordField:'password'
},function(username,password,done){
    User.findOne({username:username},function(error,user){
        if(error){
            return done(error);
        }
        if(!user){
            return done('user not found');
        }
        if(!user.isValidPassword(password)){
            return done('incorrect password');
        }
        return done(null,user);
    });
}));

passport.serializeUser(function(user,done){
    done(null,user._id);
});

passport.deserializeUser(function(id,done){
    User.findById(id,function(error,user){
        done(error,user);
    });
});

var app = express();
app.set('view engine', 'ejs');
app.use(session(sessionConfig));
app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/',authenticate,function(request,response){
    response.render('pages/home',{user:request.user});
});

app.get('/about',authenticate,function(request,response){
    response.render('pages/about',{user:request.user});
});

app.get('/register',sendToHome,function(request,response){
    response.render('pages/register',{error:request.flash('error')});
});

app.get('/login',sendToHome,function(request,response){
    response.render('pages/login',{
        error:request.flash('error'),
        message:request.flash('message')
    });
});

app.post('/register',function(request,response){
    new User(request.body).save(function(error,user){
        if(error){
            var message = error.message;
            if(error.code==11000){
                message = 'username already exists';
            }
            if(error.name=='ValidationError'){
                message = 'fields invalid';
            }
            request.flash('error',message);
            response.redirect('/register');
        }else{
            passport.authenticate('local',function(error,user){
                request.logIn(user,function(error){
                    if(error){
                        request.flash('error',error);
                        response.redirect('/register');
                    }else{
                        response.redirect('/');
                    }
                });
            })(request,response);
        }
    });
});

app.post('/login',function(request,response){
    if(!request.body.username || !request.body.password){
        request.flash('error','missing credentials');
        return response.redirect('/login');
    }
    passport.authenticate('local',function(error,user){
        if(error){
            request.flash('error',error);
            response.redirect('/login');
        }else{
            request.logIn(user,function(error){
                if(error){
                    request.flash('error',error);
                    response.redirect('/login');
                }else{
                    response.redirect('/');
                }
            });
        }
    })(request,response);
});

app.get('/logout',function(request,response){
    request.logout();
    request.flash('message','logged out successfully');
    response.redirect('/');
});

app.listen(8080,function(){
    console.log('Listening on 8080...');
});

function authenticate(request,response,next){
    if(!request.isAuthenticated()){
        response.redirect('/login');
    }else{
        next();
    }
}

function sendToHome(request,response,next){
    if(request.isAuthenticated()){
        response.redirect('/');
    }else{
        next();
    }
}