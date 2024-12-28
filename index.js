const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o0nwk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server
        // await client.connect();
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const database = client.db('BlogSphereDB');
        const blogsCollection = database.collection('blogs');
        const myCollection = database.collection('myblogs');
        const watchlistCollection = database.collection('watchlist'); 
        // -------------------- CRUD Operations for `blogs` --------------------
        app.get('/blogs', async (req, res) => {
            const blogs = await blogsCollection.find().toArray();
            res.json(blogs);
        });

        app.get('/blogs/:id', async (req, res) => {
            const id = req.params.id;
            const review = await blogsCollection.findOne({ _id: new ObjectId(id) });
            review ? res.json(review) : res.status(404).json({ error: 'Review not found' });
        });

        app.post('/blogs/add', async (req, res) => {
            const newReview = req.body;
            const result = await blogsCollection.insertOne(newReview);
            res.json(result);
        });

        app.put('/blogs/update/:id', async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const result = await blogsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            );
            result.matchedCount > 0
                ? res.json({ message: 'Review updated successfully' })
                : res.status(404).json({ error: 'Review not found' });
        });

        app.delete('/blogs/delete/:id', async (req, res) => {
            const id = req.params.id;
            const result = await blogsCollection.deleteOne({ _id: new ObjectId(id) });
            result.deletedCount > 0
                ? res.json({ message: 'Review deleted successfully' })
                : res.status(404).json({ error: 'Review not found' });
        });


        // -------------------- CRUD Operations for `myblogs` --------------------
        app.get('/myblogs', async (req, res) => {
            const blogs = await myCollection.find().toArray();
            res.json(blogs);
        });

        app.get('/myblogs/:id', async (req, res) => {
            const id = req.params.id;
            const review = await myCollection.findOne({ _id: new ObjectId(id) });
            review ? res.json(review) : res.status(404).json({ error: 'Review not found' });
        });

        app.post('/myblogs/add', async (req, res) => {
            const newReview = req.body;
            const result = await myCollection.insertOne(newReview);
            res.json(result);
        });

        app.put('/myblogs/update/:id', async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            delete updatedData._id;

            try {
                const result = await myCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedData }
                );
                result.matchedCount > 0
                    ? res.json({ message: 'Review updated successfully' })
                    : res.status(404).json({ error: 'Review not found' });
            } catch (error) {
                console.error('Error updating review:', error);
                res.status(500).json({ error: 'An error occurred while updating the review.' });
            }
        });

        app.delete('/myblogs/delete/:id', async (req, res) => {
            const id = req.params.id;
            const result = await myCollection.deleteOne({ _id: new ObjectId(id) });
            result.deletedCount > 0
                ? res.json({ message: 'Review deleted successfully' })
                : res.status(404).json({ error: 'Review not found' });
        });

        // -------------------- Watchlist Feature --------------------
        app.get('/watchlist', async (req, res) => {
            const userEmail = req.query.userEmail;

            if (!userEmail) {
                return res.status(400).json({ error: "User email is required." });
            }

            try {
                const watchlistItems = await watchlistCollection.find({ userEmail }).toArray();
                res.json(watchlistItems);
            } catch (error) {
                console.error("Error fetching watchlist:", error);
                res.status(500).json({ error: "Failed to fetch watchlist." });
            }
        });

        
        app.post('/watchlist/add', async (req, res) => {
            const { userEmail, reviewId, gameTitle, gameCover, reviewDescription, rating, genre, userName } = req.body;
          
            if (!userEmail || !userName || !reviewId) {
              return res.status(400).json({ error: "Missing required fields." });
            }
        
            const existingItem = await watchlistCollection.findOne({ userEmail, reviewId });
            if (existingItem) {
              return res.status(400).json({ error: "This review is already in your watchlist." });
            }
          
            const newWatchlistItem = {
              reviewId, // Add reviewId here
              gameTitle,
              gameCover,
              reviewDescription,
              rating,
              genre,
              userEmail,
              userName,
              addedAt: new Date(),
            };
          
            try {
              const result = await watchlistCollection.insertOne(newWatchlistItem);
              res.json({ message: "Review added to watchlist", result });
            } catch (error) {
              console.error("Error adding to watchlist:", error);
              res.status(500).json({ error: "Failed to add to watchlist." });
            }
        });
          

    } finally {
        // Ensure that the client will close when you finish/error
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Blogs started');
});

app.listen(port, () => {
    console.log(`Server started on port: ${port}`);
});
