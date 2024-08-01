
const express = require('express');
const cors = require('cors')
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookie = require('cookie-parser')
const app = express()
const port = 5000
app.use(express.json())
app.use(cookie())
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://a11-nurturing-energetics.web.app",
            "https://a11-nurturing-energetics.firebaseapp.com",
        ],
        credentials: true,
    })
);
// jwt middleware
const verify = (req, res, next) => {
    const token = req.cookies?.token;
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, (err, decodedToken) => {
            if (err) {
                res.status(403).json({ message: 'Invalid token' });
            } else {
                req.user = decodedToken;
                next();
            }
        });
    } else {
        res.status(401).json({ message: 'No token, authorization denied' });
    }
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cn1yph8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    // Connect to the MongoDB cluster
   
    try {
        const restaurantDB = client.db('restaurantCollection').collection('allFoods')
        const userDB = client.db('restaurantCollection').collection('users')
        const buyDB = client.db('restaurantCollection').collection('buyData')
        const galleryDB= client.db('restaurantCollection').collection('gallery')
        const feedbackDB= client.db('restaurantCollection').collection('feedback')
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        app.get('/', (req, res) => {
            res.send('Hello World!')
        })
        app.get('/top', async (req, res) => { 
           
            const result = await restaurantDB.find().sort({ purchase_amount: -1 }).limit(6).toArray();
            res.send(result)
        }) 
        app.get('/details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await restaurantDB.findOne(query);
            res.send(result);
        }) 
        app.post('/user', async (req, res) => {
            const email = req.body;
            console.log(email);
            const newUser = await userDB.insertOne(email)
            res.send(newUser);
        }) 
        app.post('/my-order', async (req, res) => {
            const data = req.body;
            console.log(data);
            const userData = await buyDB.insertOne(data)
            res.send(userData);
        }) 
        app.get('/my-order/:email', verify, async (req, res) => {
            const email = req.params.email

            console.log(email);
            const result = await buyDB.find({ userEmail : email }).toArray()

            res.send(result)
        })
        app.post('/add', async (req, res) => {
            const newFood = req.body;
            console.log(newFood);
            const newUser = await restaurantDB.insertOne(newFood)
            res.send(newUser);
        }) 
         
        app.get('/add/:email',verify, async (req, res) => {
            const email = req.params.email

            console.log(email);
            const result = await restaurantDB.find({ email }).toArray()

            res.send(result)
        })
        app.get('/all/:chef', async (req, res) => {
            const chef = req.params.chef

           
            const result = await restaurantDB.find({made_by:chef }).toArray()

            res.send(result)
        })
        app.get('/user/:email',async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            console.log(query);
            const result = await userDB.findOne(query);
            res.send(result);
        }) 
        app.put('/details/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedData = req.body
            console.log(updatedData);
            const data = {
                $set: {
                    quantity: updatedData.quantity,
                    purchase_amount: updatedData.purchase_amount
                }
            }
            const result = await restaurantDB.updateOne(filter, data, options);

            res.send(result);
        }) 
        app.put('/update/:id',verify, async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            console.log(filter);
            const options = { upsert: true };
            const updatedData = req.body
            console.log(updatedData);
            const data = {
                $set: {
                    food_image: updatedData.food_image,
                    food_name: updatedData.food_name,
                    food_category: updatedData.food_category,
                    description: updatedData.description,
                    price: updatedData.price,
                    quantity: updatedData.quantity,
                    food_origin: updatedData.food_origin
                }
            }
            const result = await restaurantDB.updateOne(filter, data, options);

            res.send(result);
        }) 
        app.delete('/delete/:id',verify, async (req, res) => {
            const id = req.params.id
            const result = await buyDB.deleteOne({ _id: new ObjectId(req.params.id) });
            res.send(result);
        }) 
        app.get('/all', async (req, res) => {
            
            const filter = req.query.filter
            let query ={}
            if (filter) query = { food_name:{$regex: filter,$options:'i' }}
            console.log(filter)
            const result = await restaurantDB.find(query).sort({ purchase_amount: -1 }).toArray();
            res.send(result)
        })
        //feedback
        app.post('/feedback', async (req, res) => {
            const newFeedback = req.body
            console.log(newFeedback);
            const feedback = await feedbackDB.insertOne(newFeedback)
            res.send(feedback)
        })
        app.get('/feedback', async (req, res) => {
            const result = await feedbackDB.find().toArray();
            res.send(result)
        })
        //gallery
        app.post('/gallery', async (req, res) => {
            const newFood = req.body;
            console.log(newFood);
            const newUser = await galleryDB.insertOne(newFood)
            res.send(newUser);
        })
        app.get('/gallery', async (req, res) => {

            const result = await galleryDB.find().limit(6).toArray();
            res.send(result)
        }) 

        // jwt 
        app.post('/jwt', async (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.SECRET_KEY, { expiresIn: '1h' }) 
            console.log(email);
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                })
                .send({success : true})
        })

        app.get("/logout", async (req, res) => {
            const user = req.body;
            console.log("logging out", user);
            res
                .clearCookie("token", {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                    maxAge: 0
                })
                .send({ success: true });
        });
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
   
    }
}
run().catch(console.dir);
