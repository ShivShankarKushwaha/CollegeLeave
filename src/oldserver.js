// require('dotenv').config();
require('dotenv').config();
// const process = require('process');
const express = require('express');
const path = require('path');
const app= express();
const bp = require('body-parser');
const bcrypt = require('bcrypt');
const fileupload = require('express-fileupload');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const { response } = require('express');
const {MongoClient, ObjectId} = require('mongodb');
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
const session = require('express-session');
const cookieparser = require('cookie-parser');
const User = require(path.join(__dirname,"../Models/User.js"));
const qrcode = require('qrcode');



app.use(bp.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,"../public")));
app.use(express.static(path.join(__dirname,"../images")));
app.use(fileupload({createParentPath: true}));
app.use(cookieparser());
app.use(
    session(
        {
            key: 'secret_key',
            secret: 'This is a strong !@#$%^ striNg',
            resave: false,
            saveUninitialized: false,
            cookie: {
                expires: 300000
            }
        }
    )

);
app.use((req, res, next) => {
    if (req.cookies.secret_key && !req.session.user) {
        res.clearCookie("secret_key");
    }
    next();
});
app.set('view engine','ejs');
const sessioncheck = (req, res, next) => {
    if (req.session.user && req.cookies.secret_key) {
        res.sendFile(path.join(__dirname,"../public/services.html"));
    }
    else
        next();
}
const gatecheck =(req,res,next)=>
{
    console.log(loginemail," ",loginpassword);
    if(loginemail==process.env.GAURD_MAIL && loginpassword==process.env.GAURD_PASS)
    {
        next();
    }
    else
    {
        // res.redirect("/login");
        // next();
        res.json({status:404});
    }
}
const statuscheck = (req,res,next)=>
{
    if (req.session.user && req.cookies.secret_key) {
        next();
    }
    else
        res.redirect("/login");
}
const admincheck =(req,res,next)=>
{
    console.log('admin check:',req.body.email,req.body.password);
    console.log('saved details:',process.env.ADMIN_MAIL,process.env.ADMIN_PASS);
    if (req.body.email == process.env.ADMIN_MAIL && req.body.password == process.env.ADMIN_PASS)
    {
        loginemail = process.env.ADMIN_MAIL;
        loginpassword = process.env.ADMIN_PASS;
        res.sendFile(path.join(__dirname,"../public/admin.html"));
    }
    else if(req.body.email == process.env.GAURD_MAIL && req.body.password == process.env.GAURD_PASS)
    {
        loginemail=process.env.GAURD_MAIL;
        loginpassword = process.env.GAURD_PASS;
        res.render("scanner");
    }
    else 
    next();
}

const studentdatacheck =(req,res,next)=>
{
    if(loginemail ==process.env.ADMIN_MAIL && loginpassword == process.env.ADMIN_PASS)
    {
        next();
    }
    else
    {
        res.redirect("/login");
    }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const publicpath = path.join(__dirname,"../public");
const srcpath = __dirname;
const uploadspath = path.join(__dirname,"../uploads");
const viewspath = path.join(__dirname,"../views");
const Modelspath = path.join(__dirname,"../Models");
app.set('views',viewspath);

async function connection()
{
    let result = await client.connect();
    let database = await result.db('Practicum4');
    return database.collection('collections');
}
async function leave()
{
    let result = await client.connect();
    let database = result.db('Practicum4');
    return database.collection('leave');
}
var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    }
});
function PinGenerator() {
    pinReturn = otpGenerator.generate(5, { digits: true, upperCase: true, specialChars: false, alphabets: false });
    console.log(pinReturn);
}
PinGenerator.prototype.getPin = function () {
    return pinReturn;
};




/////////////////////////////////////////////////////////////////////////////////////////////////////////////
var signname,signemail,signgender,signpassword;
var pinReturn = "";
let loginname, loginemail,loginpassword;
let rollnumber, filename;
let studentsmail,studentfilename;


app.get("/",(req,res)=>{
    console.log(process.env.MAIL_USER)
    res.sendFile(publicpath + "/home.html");
})
app.get("/login",sessioncheck,(req,res)=>{
    res.sendFile(publicpath +"/login.html")
})
app.get("/services",sessioncheck,(req,res)=>{
    res.sendFile(publicpath +"/login.html")
})
app.get("/status",statuscheck,async(req,res)=>
{
    let qr;
    let cresult = await connection();
    let respons = await cresult.findOne({email:loginemail});
    let result = await leave();
    let responce = await result.findOne({email:loginemail},{sort:{_id:-1}});
    if(!responce)
    {
        res.send(`<center><h1>No leave form found</h1></center>`);
    }
    console.log('generating qrcode');
    if (responce.exit == 'null' && responce.status == 'Approved') 
    {
        let data = { btn: '1', id: responce._id };
        qr = await new Promise((resolve, reject) => {
            qrcode.toDataURL(JSON.stringify(data), (err, src) => 
            {
                if (err) {
                    reject(err);
                } else {
                    resolve(src);
                }
            });
        });
        // console.log('qrcode generated', qr);
    }
    else if (responce.exit == 'done' && responce.status == 'Approved' && responce.entry=='null') 
    {
        let data = { btn: '2', id: responce._id };
        qr = await new Promise((resolve, reject) => {
            qrcode.toDataURL(JSON.stringify(data), (err, src) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(src);
                }
            });
        });
        // console.log('qrcode generated', qr);
    }

    let data ={
        name:respons.name,
        email:responce.email,
        semester:responce.semester,
        reason:responce.reason,
        leaveStartDate:responce.leaveStartDate,
        leaveEndDate:responce.leaveEndDate,
        Uploadedon:responce.Uploadedon,
        filename:responce.filename,
        status:responce.status,
        exit:responce.exit,
        entry:responce.entry,
        qrcode:qr,
    }
    // console.log('rendering data',data.qrcode);
    res.render(viewspath+"/status.ejs",{data});
})
app.get("/about",(req,res)=>
{
    res.sendFile(publicpath+"/about.html");
})
app.post("/sign",async(req,res)=>{
        signemail = req.body.email;
        signname = req.body.name;
        signgender = req.body.gender;
        signpassword = req.body.password;
        let collegemailcheck = signemail.includes('iiitu.ac.in');
        let alradyemail =await User.findOne({email:signemail}).exec();
        console.log(alradyemail);
        if(alradyemail!=null)
        {
            res.send('User already exists!');
        }
        else if(!collegemailcheck)
        {
            res.send('Please use email provided by college');
        }
        else
        {
            PinGenerator();
            var mailoption = {
                from: process.env.MAIL_FROM,
                to: "21331@iiitu.ac.in",
                subject: "IIITU library management sign up otp password ",
                text: "Your Pin is:",
                html: `<h3>Your pin is:</h3><h1>${pinReturn}</h1>`
            };

            transporter.sendMail(mailoption, function (err, info) {
                if (err) {
                    console.log(process.env.MAIL_PASS);
                    console.log(err);
                }
                else {
                    console.log('Email has been sent');
                }
            })
            res.redirect("/otppage");
        }
})
app.get("/otppage",async(req,res)=>
{
    res.sendFile(publicpath +"/sign_otp.html");
})
app.post("/login",admincheck,async(req,res)=>{
    loginemail=req.body.email;
    loginpassword=req.body.password;
    let user = await User.findOne({email:req.body.email}).exec();
    let loginsavedpassword;
    if (user==null) {
        
        res.send(`<script>alert('email not found')</script>`);
    }
    else
    {
        loginsavedpassword = req.body.password;
        let data2 = await user.comparepassword(loginpassword,loginsavedpassword);
        if (data2 == null) {
            res.send(`password is incorrect`);
        }
        else {
            username = data2.name;
            usernameenable = 1;
            req.session.user = user;
            loginname = user.name;
            res.redirect("/services");
        }
    } 
    
})
app.post("/leaveformupload",statuscheck, async(req,res)=>
{
    let user = await User.findOne({ email: loginemail }).exec();
    if(!user)
    {
        res.json({status:'User not found'});
    }
    else
    {
        console.log(req.body);
        let result =await leave();
        let currentdatetime = new Date();
        let month = currentdatetime.getMonth()+1;
        let rolldata = loginemail.split('@');
        rollnumber = rolldata[0];
         filename = rollnumber + '@' + currentdatetime.getFullYear() + '@' + month + '@' + currentdatetime.getDate() + '@' + currentdatetime.getHours() + '@' + currentdatetime.getMinutes() + '@' +currentdatetime.getSeconds()+".pdf";
        let file = req.files.leavefile;
        // file.mv('../uploads/' + file.name, function (err) {
        file.mv('../uploads/' + filename, function (err) {
            if (err) {
                return res.status(500).send(err);
            }
        });
        console.log(filename);
        var mailoption = {
            from: process.env.MAIL_FROM,
            to: process.env.MAIL_FROM,
            subject: "Uploaded leave form successfully",
            // html: `<p>hello ${loginname}! You have successfully uploaded leave form, IIITU administration will send you a confirmation email after approving. <br> -by <h1>IIITU</h1> </p>`
            html: `<p>A new submission recorded, It was filled by ${loginname} and filename is ${filename}</p>`
        };

        transporter.sendMail(mailoption, function (err, info) {
            if (err) {
                console.log(err);
            }
            else {
                console.log('Email has been sent');
            }
        })
        let user = await User.findOne({email:loginemail}).exec();
        let formincrease = user.totalForms+1;
        console.log(user);
        console.log(formincrease);
        let updateuser = await User.updateOne({email:loginemail},{$set:{totalForms:formincrease}});
        let inserting = await result.insertOne({ email: loginemail, semester: req.body.semester, reason: req.body.reason, leaveStartDate: req.body.leavestart, leaveEndDate: req.body.leaveend, Uploadedon: currentdatetime,filename:filename,status:'null',exit:'null',entry:'null' });
        console.log(inserting);
        // res.json({ status: 'file successfully uploaded' })
        res.send(`<center><h3>File uploaded successfully</h3><h1><a href="/">Go to Homepage</a></h1></center>`)
    }
})
app.post("/signotp",async(req,res)=>
{
    let submittedotp = req.body.otp;
    let signhashedpass = await bcrypt.hashSync(signpassword,10);
    console.log(signhashedpass);
    if(submittedotp===pinReturn)
    {
        const user = new User(
            {
                name:signname,
                email:signemail,
                gender:signgender,
                password:signhashedpass,
            }
        );
        let saving = await user.save();
        console.log(saving);
        res.redirect('/login');
        // res.json('data saved');
    }
    else
    {
        res.send('otp is not correct');
    }
})
app.post("/studentsdata",async(req,res)=>
{
    console.log(req.body);
    studentsmail = req.body.email;
    let result1 = await connection();
    let responce1 = await result1.findOne({email:studentsmail});
    console.log(responce1);
    if(responce1!=null)
    {
        let result2 = await leave();
        let responce2 = await result2.findOne({ email: studentsmail, status: "null" });
        console.log(responce2);
        if(responce2!=null)
        {
            studentfilename = responce2.filename;
            let data ={name:responce1.name,email:studentsmail,reason:responce2.reason,leaveStartDate:responce2.leaveStartDate,leaveEndDate:responce2.leaveEndDate,Uploadedon:responce2.Uploadedon,filename:responce2.filename};
            res.render(viewspath+"/studentdata.ejs",{data});
        }
        else
        {
            res.send(`<center><h1>No leave Form Found</h1></center>`);
        }
    }
    else
    {
        res.send('email not found');
    }
})
app.post("/approvel",async(req,res)=>
{
    console.log(req.body.approval);
    let result = await leave();
    let responce = await result.findOne({filename:studentfilename});
    let resps = await result.findOne({filename:studentfilename})
    // console.log(response);
    console.log(studentfilename);
    responce = await result.updateOne({ filename: studentfilename }, { $set: { status: req.body.approval }});
    console.log(responce);
    var mailoption = {
        from: process.env.MAIL_FROM,
        to: process.env.MAIL_FROM,
        subject: "Status of Your Application",
        // html: `<p>hello ${loginname}! You have successfully uploaded leave form, IIITU administration will send you a confirmation email after approving. <br> -by <h1>IIITU</h1> </p>`
        html: `<p>Your Uploaded Application on date ${resps.Uploadedon} has been ${req.body.approval}</p>`
    };

    transporter.sendMail(mailoption, function (err, info) {
        if (err) {
            console.log(err);
        }
        else {
            console.log('Email has been sent');
        }
    })
    res.redirect('/services')
})

app.get("/allstudentdata",studentdatacheck, async(req,res)=>
{
    res.sendFile(publicpath+"/allstudentdata.html");
})
app.get('/checkdata',studentdatacheck, async(req,res)=>
{
    let result = await leave();
    let responce = await result.find({}).toArray();
    res.json(responce);
})
app.get("/scan",gatecheck,(req,res)=>
{
    res.render("scanner");
})
app.post("/scanneddata",gatecheck,async(req,res)=>
{
    console.log('getting data from scanner');
    console.log(req.body.content);
    let arr = JSON.parse(req.body.content);
    console.log(arr);
    console.log(arr.btn);
    console.log(arr.id);
    let result = await leave();
    let responce = await result.findOne({ _id:new ObjectId(arr.id) }, { sort: { _id: -1 } });
    if(!responce)
    {
        res.json('data not found');
    }
    else
    {
        if(arr.btn==1)
        {
            let upd = await result.updateOne({_id:new ObjectId(arr.id)},{$set:{exit:'done',exiton:new Date()}});
            console.log(upd);
        }
        else
        {
            let upd = await result.updateOne({ _id: new ObjectId(arr.id) }, { $set: { entry: 'done', entryon: new Date() } });
            console.log(upd); 
        }
    }
    res.json('data entered successfully');
})
app.get("/logout",async(req,res)=>
{
    req.session.destroy();
    res.clearCookie();
    res.redirect("/");
})
app.listen(5500);
