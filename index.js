const http  = require("http");
const express = require('express')
const bodyParser = require("body-parser");
const cors = require('cors')

const mysql = require('mysql2');

const app = express();
app.use(bodyParser.urlencoded({ extended: false,limit: '50mb' }));
app.use(bodyParser.json(({limit: '50mb'}))); // support json encoded bodies
app.use(cors());
app.use((req,res,next)=>{
    res.setHeader('Cache-Control', 'no-cache');
    next()
});



const connection = mysql.createPool({
    "host": "localhost",
    "user":"root",
    "password":"root",
    "database": "crm"
});
connection.getConnection((err,connection) =>{
    if(err){
        console.log(err);
        console.log("Error connecting  to db , quitting....");
    }
    else{
        console.log("Successfully connected to db");
        connection.release();
    }
});


function executeQuery(query, variables){
    return new Promise(resolve => {
        connection.query(query, (e,r)=>{
            if(!e){
                console.log(query);
                let insertId = null;
                if(r.insertId){
                    insertId = r.insertId
                }
                resolve({
                    status:"OK",
                    result:insertId? insertId :r,
                    rowStatus:r
                })
                
            } else {
                console.log("Error ",query, "\n Error Details: ", e);
                resolve({status:"error",error:e})
            }
        })
    })
}

app.get('/',(req,res)=> {
    res.status(200).send('Hello world')
})


app.post('/login/',async (req,res)=>{
    console.log(req.body)
    const { userID , userPass } = req.body;
    if(userID && userPass){
        let userNameQuery = `select * from users where name = '${userID}' `;
        let resultUser = await executeQuery(userNameQuery);
        if(resultUser.result.length){
            let passwordQuery = `select password from users where name = '${userID}'`
            let resultPass = await executeQuery(passwordQuery);
            console.log(resultPass.result)
            if(resultPass.result.length){
                if(resultPass.result[0].password == userPass){
                    res.status(200).send({status:'success', token:Math.floor(Math.random()*90000) + 10000})
                }
                else{
                    res.status(400).send({status:'Invalid password'})
                }
            }
            else{
                res.status(400).send({status:'Invalid password'})
            }
        }else{
            console.log("User not found");
            res.status(400).send({status:"user not found"})
        }
    }else{
        console.log("Please provide the Username");
        res.status(400).send({status:"Username not found"})
    }
})

app.post('/create/',async (req,res)=>{
    const {fname,lname,mobile,email,stats,comments} = req.body
    let insertQuery = `insert into customers(first_name,last_name,email,contact,status,comments) values('${fname}','${lname}','${email}','${mobile}','${stats}','${comments}')`;

    let resultUser = await executeQuery(insertQuery);
    console.log(resultUser)
    if(resultUser.status == 'OK'){
        res.status(201).send({status:'Created',id:resultUser.result})
    }else{
        res.status(400).send({status:'Error',id:resultUser.result})
    }
})

app.get('/allCustomer/',async (req,res)=>{
    
    let getQuery = `select id, first_name,last_name,email,contact,status,comments from customers`;

    let resultUser = await executeQuery(getQuery);
    console.log(resultUser)
    if(resultUser.status == 'OK'){
        res.status(200).send({status:'true', result:resultUser.result})
    }else{
        res.status(400).send({status:'Error',result:resultUser.result})
    }
})

http.createServer(app).listen(4000)