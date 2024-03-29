const express = require('express');
const app = express();
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const bodyParser = require("body-parser");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');


app.use(express.json());


const port = process.env.PORT || 3000;
const mongoose = require('mongoose');


const multer = require('multer');
const { log } = require('console');


//for image storage
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

const upload = multer({ storage: storage });

app.set('view engine', 'ejs');

app.use('/static', express.static('static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const imageMimeTypes = ["image/jpeg", "image/png", "images/gif"];

app.use(session({
    secret: 'our secrets.',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
// Database
require('./database'); 
mongoose.set("useCreateIndex", true);

//models
require('./models/hospital');
require('./models/dr');

//Schema for hospital and doctor
const Hospital = mongoose.model('Hospital');
const dr = mongoose.model('Doctor');


app.get("/index", (req, res) => {
    if (req.isAuthenticated()) {
        Hospital.find({}, (err, hosp) => {
            if (err) console.log(err);
            else {
                console.log(hosp);
                res.render("index");
            }
        })
    } 
    else {
        res.render("auth");
    }

})

app.route("/hospForm")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            Hospital.find({}, (err, hosp) => {
                if (err) console.log(err);
                else {
                    res.render("hospForm");
                }

            })
        } else {
            res.render("auth");
        }

    })

app.post("/hospForm", upload.single('itemImage'), (req, res) => {

    let item = new Hospital({
        hospitalName: req.body.hospName,
        hospitalAddress: req.body.hospAd,
        bedAvilabile: req.body.bed,
        workForce: req.body.workForce,
        specialization: req.body.spec,
        facilities: req.body.desc,
        username: req.user.username,
        imgH: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            type: 'image/jpg',
        },
    });

    item.save();
    console.log("saved");
    res.redirect("/hospital");


})

app.route("/drForm")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            Hospital.find({}, (err, hosp) => {
                if (err) console.log(err);
                else {
                    res.render("drForm");
                }

            })
        } else {
            res.render("auth");
        }

    })
app.post("/drForm", upload.single('itemImage'), (req, res) => {

    let item = new dr({
        drName: req.body.drName,
        drDegree: req.body.drdeg,
        fieldexpertise: req.body.spec,
        workAddress: req.body.drAd,
        email: req.body.email,
        phone: req.body.phone,
        workExp: req.body.exp,
        desc: req.body.desc,
        username: req.user.username,
        img: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            type: 'image/jpg',
        },

    });
    // console.log(item);
    item.save();
    res.redirect("/dr");
})

app.listen(port, () => {
    console.log(`Server started at port ${port}`);
});

//User Authentication set-up


const userSchema = new mongoose.Schema({
    userSchema: {
        type: String,
        require: true,
    },
    name: {
        type: String,
        require: true,
    },
    email: {
        type: String,
        require: true,
    },
    password: {
        type: String,
        require: true,
    },
})
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });


app.route("/hospital")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            Hospital.find({}, (err, hosp) => {
                if (err) console.log(err);
                else {
                    // console.log(hosp);
                    res.render("hospital", {
                        hosp: hosp,
                    });
                }

            })
        } else {
            res.redirect("/");
        }

    })

app.route("/profile")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            Hospital.find({ username: req.user.username }, (err, hosp) => {
                if (err) console.log(err);
                else {
                    // console.log(hosp);
                    res.render("profile", {
                        hosp: hosp,
                    });
                }

            })
        } else {
            res.redirect("/");
        }

    })

app.route("/dr")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            dr.find({}, (err, hosp) => {
                if (err) console.log(err); 
                else {
                    // console.log(hosp);
                    res.render("dr", {
                        hosp: hosp,
                    });
                }

            })
        } else {
            res.redirect("/");
        }

    })
app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        Hospital.find({}, (err, hosp) => {
            if (err) console.log(err);
            else {
                // console.log(hosp);
                res.redirect("/index");
            }

        })
    } else {
        res.render("auth");
    }
})
app.get("/ambulance", (req, res) => {
    res.render("ambulance")
})

app.post('/register', (req, res) => {
    var errors = [];
    if(!req.body.email || !req.body.password) errors.push('Email and Password is required');
    if(!validateEmail(req.body.email)) errors.push('Email is not in format');
    if(!validatePassword(req.body.password)) errors.push('Password is not in format');
    console.log(errors);
    if(errors.length > 0) {
        return res.redirect('/');
    }
    User.register({ username: req.body.username, name: req.body.name, email: req.body.email }, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.render("auth");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/index")
            })
        }
    })
});

const {validateEmail, validatePassword} = require('./helper');
app.post('/login', (req, res) => {
    const user = new User({
        email: req.body.email,
        password: req.body.password,
    });
    var errors = [];
    if(!req.body.email || !req.body.password) errors.push('Email and Password is required');
    if(!validateEmail(req.body.email)) errors.push('Email is not in format');
    if(!validatePassword(req.body.password)) errors.push('Password is not in format');
    console.log(errors);
    if(errors.length > 0) {
        return res.redirect('/');
    }
    req.login(user, (err) => {

        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local", { failureRedirect: '/' })(req, res, () => {
                res.redirect("/index");
            })
        }
    })
})

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
})