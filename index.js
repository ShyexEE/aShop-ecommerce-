 import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session"
import passport from "passport";
import { Strategy } from "passport-local";
import env from "dotenv"
import GoogleStrategy from "passport-google-oauth2"
import bcrypt  from '@node-rs/bcrypt'

const app = express();
const port = 3000;
const saltRounds=10;
env.config()

app.use(
  session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie:{
    maxAge: 1000 *60*30
  }
}))

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


app.use(passport.initialize());
app.use(passport.session())


const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: true
});
db.connect();



app.get("/",async (req, res) => {
    const response =await axios.get("https://fakestoreapi.com/products");
    const result =  response.data;
    isAuth(req.isAuthenticated())
    res.render("index.ejs",{
    result: result.splice(0,5),
    basketSize:basket_total_quantity,
    email:authentificated[0]
  })
});

app.get("/checkout",async (req, res) => {
  if (req.isAuthenticated()){ 
    const result= await db.query("SELECT details FROM users_details WHERE id = $1 ", [
      req.user.id
    ]);
    const payment= await db.query("SELECT payment FROM users_details WHERE id = $1 ", [
      req.user.id
    ]);
  if (result.rows.length>0 || payment.rows.length>0){
    var details = JSON.parse(result.rows[0].details)
    var paymentD = JSON.parse(payment.rows[0].payment)
      res.render("checkout.ejs",{
          item: basket,
          details: details,
          payment: paymentD
      })
    }
    else{
      res.render("checkout.ejs",{
        item: basket,
    })
  }
}
  else{
    res.redirect("/login")
  }
  })
  

  app.get("/edit/address",async (req, res) => {
    isAuth(req.isAuthenticated())
    const detailsDb = await db.query("SELECT details FROM users_details WHERE id = $1 ", [
      req.user.id
    ]);
    if (detailsDb.rows.length>0){
      var databaseDetails=JSON.parse(detailsDb.rows[0].details)
      console.log(databaseDetails)
      }
     res.render("address.ejs",{
       details: databaseDetails
     })
  })
  
app.post("/edit/address",async (req, res) => {
  isAuth(req.isAuthenticated())
   const detailsDb = await db.query("SELECT details FROM users_details WHERE id = $1 ", [
    req.user.id
  ])
   const array = []
   array.push(req.body)
     const updatedAddress = JSON.stringify(array)
   if (detailsDb.rows.length<1){
    await db.query("INSERT INTO users_details (details, id) VALUES ($1, $2)",
   [updatedAddress, req.user.id]
 );
}else{
  await db.query("UPDATE users_details SET details = ($1) WHERE id = $2", [updatedAddress, req.user.id]);
   }
  res.redirect("/loading")
})



  app.get("/edit/payment",async (req, res) => {
    isAuth(req.isAuthenticated())
    const paymentDb = await db.query("SELECT payment FROM users_details WHERE id = $1 ", [
      req.user.id
    ]);
    console.log( paymentDb.rows[0].payment)
    if (paymentDb.rows.length>0 && paymentDb.rows[0].payment!==null){
      var databasePayment=JSON.parse(paymentDb.rows[0].payment)
     res.render("payment.ejs",{
       payment: databasePayment[0]
     })
    }else{
      res.render("payment.ejs")
    }
  })



  app.post("/edit/payment",async (req, res) => {
    isAuth(req.isAuthenticated())
     const array = []
     array.push(req.body)
     const updatedPayment = JSON.stringify(array)
    await db.query("UPDATE users_details SET payment = ($1) WHERE id = $2", [updatedPayment, req.user.id]);
    res.redirect("/checkout")
  })



app.get("/items/:id",async (req, res) => {
  if (req.params.id==="all"){
  const response =await axios.get("https://fakestoreapi.com/products");
  const result =  response.data;
  isAuth(req.isAuthenticated())
  res.render("items.ejs",{
    result: result,
    title: "aShop",
    basketSize:basket_total_quantity,
    email:authentificated[0]
  })
  }
else{
  isAuth(req.isAuthenticated())
  const category= req.params.id
  const response =await axios.get("https://fakestoreapi.com/products");
  const result =  response.data;
  let item = result.filter((item) => item.category === category)
  let title = category.charAt(0).toUpperCase() + category.slice(1)
  res.render("items.ejs",{
    result: item,
    title: title,
    basketSize:basket_total_quantity,
    email:authentificated[0]
  })
}
});


//Will go to the specific item page, find again in the API store it into
const items=[]
const item_found = []
app.get("/shop/:id",async (req, res) => {
  const id = parseInt(req.params.id)
  const response =await axios.get("https://fakestoreapi.com/products");
  const result =  response.data
  isAuth(req.isAuthenticated())
  result.forEach((item)=>{
    items.push(item)})
  const item = items.find((item) => item.id === id);
  item_found.push(item)
  res.render("shop.ejs", {
    item: item,
    title: item.title,
    basketSize:basket_total_quantity,
    email:authentificated[0]
  });
});
 


app.get("/basket", (req, res) => {
  console.log(basket)
  if (req.isAuthenticated()){
    res.render("basket.ejs",{
      item: basket,
      basketSize:basket_total_quantity,
      authentificated:true,
      email: req.user.email
    });
  }
  else{
  res.render("basket.ejs",{
    item: basket,
    basketSize:basket_total_quantity,
    authentificated:false,
  });
}
  })


app.get("/basket/delete/:id", (req, res) => {
   isAuth(req.isAuthenticated())
   const id = parseInt(req.params.id)
   const indexofItem = basket.findIndex((p) => p.id === id);
   basket.splice(indexofItem , 1)
   basket_quantity()
   if(basket.length>0){
   setting_total_price()
   }
   res.render("basket.ejs",{
    item: basket,
    basketSize:basket_total_quantity,
    authentificated:authentificated[0]
  });
});


//Setting quantity to specific item
app.get("/quantity/:id/", (req, res) => {
  //if items exist in the basket
  if(basket.length>0){ 
  const quantity_id=req.params.id
  var splited_quantity_id = quantity_id.split("+"); 
  let quantity= parseInt(splited_quantity_id[0])
  let id = parseInt(splited_quantity_id[1])
  
  //splited the params in 2 pieces and converted them into integer in order to find specific item index in the basket variable
  const indexofItem = basket.findIndex((p) => p.id === id);                //finding item by id
  basket[indexofItem].quantity=quantity                                    //adding the quantity 
  basket[indexofItem].quantity_price= parseInt((basket[indexofItem].price* quantity).toFixed(2))  //adding final price to specific item
  //calculating total price 
  setting_total_price()
  basket_quantity()
  res.redirect('/basket');
}
  //if basket empty
  else {
    res.redirect('/basket');
  }
})


app.get("/login", (req, res) => {
  res.render("login.ejs");
});


app.get("/register",(req, res) => {
  res.render("register.ejs");
});


const isAuth= (check) => {
  if (check){
    console.log("Authentification: GOOD")
  }
  else{
    authentificated.pop()
  }
}


app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    authentificated.splice(0,1)
    res.redirect("/");
  });
});




//Will find specific items in the api. Search Box
app.post("/items/find",async (req, res)=>{
  isAuth(req.isAuthenticated())
   const product = req.body.item.toLowerCase()
   const response =await axios.get("https://fakestoreapi.com/products");
   const result =  response.data
   let found = result.filter((item) => item.title.toLowerCase().includes(product))
   if (found[0]){
   res.render("items.ejs", {
    result: found,
    basketSize: basket_total_quantity,
    email: authentificated[0]
   })
  }
  else{
    res.render("items.ejs", {
      resultt: "Item not found",
      basketSize:basket_total_quantity,
    })
     }
    }
)

const authentificated=[]
app.get("/profile",async (req, res) => {
  if (req.isAuthenticated()){
    authentificated.push(req.user.email)
    const basketDb = await db.query("SELECT basket FROM users_details WHERE id = $1 ", [
      req.user.id
    ]);
    const detailsDb = await db.query("SELECT details FROM users_details WHERE id = $1 ", [
      req.user.id
    ]);
    if (basketDb.rows.length>0){
    var databaseBasket=JSON.parse(basketDb.rows[0].basket)
    }                                                              //This condition need to be for each cause it cand be render a or b
    if (detailsDb.rows.length>0){
    var databaseDetails=JSON.parse(detailsDb.rows[0].details)
    }
    res.render("profile.ejs",{
      email: authentificated[0],
      basketSize: basket_total_quantity,
      details: databaseDetails,
      item: databaseBasket
    })
  } else{
    authentificated.pop()
    res.redirect("/login")
  }
});


app.post("/checkout", async (req, res)=>{
  //make checkout profile and profile.ejs work
  const basketDb = await db.query("SELECT basket FROM users_details WHERE id = $1 ", [
    req.user.id
  ]);
  const detailsDb = await db.query("SELECT details FROM users_details WHERE id = $1 ", [
    req.user.id
  ]);
  const paymentDB = await db.query("SELECT payment FROM users_details WHERE id = $1 ", [
    req.user.id
  ]);
  if (basketDb.rows.length<1){
    const basket_json = JSON.stringify(basket);
     await db.query("INSERT INTO users_details (basket, id) VALUES ($1, $2)",
      [basket_json, req.user.id]
    );
    }else if(basketDb.rows[0]===undefined || basketDb.rows[0].basket===null){
      const basket_json = JSON.stringify(basket);
      await db.query("UPDATE users_details SET basket = ($1) WHERE id = $2",
      [basket_json, req.user.id]
      );}else{
      const databaseBasket = JSON.parse(basketDb.rows[0].basket)
      const updatedBasket =databaseBasket.concat(basket)
       const updatedBasketJson = JSON.stringify(updatedBasket);
       await db.query("UPDATE users_details SET basket = ($1) WHERE id = $2",
         [updatedBasketJson, req.user.id]
       );
    }
//Converting to Json. If details its empty just add. Else take detailsDB convert it to Array concat with the new details 
const array= []
array.push(req.body)
 if (detailsDb.rows.length<1 || detailsDb.rows[0].details===null){
  const details= JSON.stringify(array)
  if(array[0].fname !=='' && array[0].address!=='' && array[0].country!==''){  //if req.body its empty user forgot to insert address don't enter empty object in database
  await db.query("UPDATE users_details SET details=$1 WHERE id=$2",
  [details, req.user.id]);
 }
}
  console.log( paymentDB.rows.length, paymentDB.rows)
  if(req.body.cardName!=='' && req.body.cardName!=='' && paymentDB.rows.length===0 || paymentDB.rows[0]===undefined){
    const payment={
      cardName:req.body.cardName,
      cardNumber: req.body.cardNumber,
      expiration: req.body.expiration,
      cvv: req.body.cvv
    }
    const paymentArray = []
     paymentArray.push(payment)
     const paymentJson = JSON.stringify(paymentArray);
    await db.query("UPDATE users_details SET payment=$1 WHERE id=$2", [paymentJson, req.user.id]);
  }
  basket.length= 0
  basket_total_quantity=0
  res.redirect("/loading")
})

app.get("/loading", async (req, res)=>{
  res.render("loading.ejs")
})


const basket = [] //basket items
var basket_total_quantity=0;
//adding to the Basket (Button)
app.post("/shop/:id", (req, res) => {
  const basket_item= item_found[(item_found.length-1)] //searching button
  const id=parseInt(req.params.id)  
  const indexofItem = basket.findIndex((p) => p.id === id)  //finding item index from array              
  //if the added item(aka object) dont exist in the array add default quantity and add it into the Basket
  if (indexofItem===-1){               
    if(!("quantity" in basket_item)&& !("quantity_price" in basket_item)){  
      basket_item.quantity=1
      basket_item.quantity_price=parseInt(basket_item.price)
      }                             
    basket.push(basket_item)
  }
  if(indexofItem!==-1){
    basket[indexofItem].quantity=basket[indexofItem].quantity+1 //else if item already exist add +1 to quantity each time the add item Button its pressed
    basket[indexofItem].quantity_price=parseInt ((basket[indexofItem].price* basket[indexofItem].quantity).toFixed(2))
  }
  setting_total_price()
  basket_total_quantity++         //increasing basket size by pressing button
  res.redirect('back');
});


//function used in 2 app.posts for the space
function setting_total_price(){        
  let total_price=0; //default total price
  for(let i=0; i<basket.length;i++){
    total_price=total_price+(basket[i].price*basket[i].quantity) //taking every object from array and multiply each 2 variables price and quantity
  }
  basket[0].total_price=parseInt(total_price.toFixed(2)) //converting 10 decimals into 2 and converting into integer and adding to the first objec
}

//function used in 2 app.posts for the space
function basket_quantity(){
  basket_total_quantity=0
  for(let i=0;i<basket.length;i++){
    basket_total_quantity+=basket[i].quantity
  }
  return basket_total_quantity
}


app.get(
  "/auth/google/login",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/login",
 passport.authenticate('google'), 
  (err, req, res, next) => { 
    if (err.name === 'TokenError') {
     res.redirect('/profile');  //ignore the the error, it doesn't affect the website
    } else {
     //handle Error
    }
  },
  (req, res) => { 
    res.redirect('/');
  }
);


//app.get(
//  "/auth/google/login",
 // passport.authenticate("google", {
//    successRedirect: "/profile",
//    failureRedirect: "/login",
//  })
//  );

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
  })
);

app.post("/register",async (req, res) => {
  const email= req.body.email
  try{
    const checkAccount=await db.query("SELECT * FROM users  WHERE email=$1",
    [email]
  )
  if(checkAccount.rows.length>0){
    res.render("login.ejs")
  }else{
    //bcrypt password
    bcrypt.hash(req.body.password1, saltRounds, async (err, hash)=>{
    if (err){
     console.log(err)
    }else{
    const result = await db.query("INSERT INTO users (email, password) VALUES ($1, $2)",
    [email, hash]
  );
    res.render("login.ejs")
    }
    });
  }
   } catch (err){
      console.log(err)
    }
});




passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);



passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://ashopp.onrender.com/auth/google/login",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile);
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)",
            [profile.email, "google"]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);



passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  
