const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o0nwk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const database = client.db('BlogSphereDB');
    const blogsCollection = database.collection('blogs');
    const commentsCollection = database.collection('comments');
    const myCollection = database.collection('myblogs');
    const wishlistCollection = database.collection('wishlist');

    // -------------------- CRUD Operations for `blogs` --------------------
    app.get('/blogs', async (req, res) => {
      const { category, searchText } = req.query;

      const query = {};
      if (category) {
        query.category = category;
      }
      if (searchText) {
        query.$text = { $search: searchText };
      }

      try {
        const blogs = await blogsCollection.find(query).toArray();
        res.json(blogs);
      } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).json({ error: "Failed to fetch blogs." });
      }
    });

    app.get('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const blog = await blogsCollection.findOne({ _id: new ObjectId(id) });
      blog ? res.json(blog) : res.status(404).json({ error: 'blog not found' });
    });

    app.post('/blogs/add', async (req, res) => {
      const newBlog = req.body;
      const result = await blogsCollection.insertOne(newBlog);
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
        ? res.json({ message: 'blog updated successfully' })
        : res.status(404).json({ error: 'blog not found' });
    });

    app.delete('/blogs/delete/:id', async (req, res) => {
      const id = req.params.id;
      const result = await blogsCollection.deleteOne({ _id: new ObjectId(id) });
      result.deletedCount > 0
        ? res.json({ message: 'blog deleted successfully' })
        : res.status(404).json({ error: 'blog not found' });
    });
      

    // Fetch comments for a blog by blog ID
    app.get('/comments/:blogId', async (req, res) => {
    const { blogId } = req.params;
    try {
        const comments = await commentsCollection.find({ blogId }).toArray();
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
    });

    // Add a comment
    app.post('/comments/add', async (req, res) => {
    const { blogId, userName, userProfile, commentText } = req.body;
    if (!blogId || !userName || !userProfile || !commentText) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const newComment = {
        blogId,
        userName,
        userProfile,
        commentText,
        timestamp: new Date(),
        };
        const result = await commentsCollection.insertOne(newComment);
        res.json({ message: 'Comment added successfully', result });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
    });

    // -------------------- wishlist Feature --------------------
    app.get('/wishlist', async (req, res) => {
      const userEmail = req.query.userEmail;

      if (!userEmail) {
        return res.status(400).json({ error: "User email is required." });
      }

      try {
        const wishlistItems = await wishlistCollection.find({ userEmail }).toArray();
        res.json(wishlistItems);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        res.status(500).json({ error: "Failed to fetch wishlist." });
      }
    });

    app.post('/wishlist/add', async (req, res) => {
      const { userEmail, blogId, title, image, shortDescription, category, author, userName } = req.body;
      
      console.log('Received data:', req.body); 
    
      if (!userEmail || !userName || !blogId) {
        return res.status(400).json({ error: "Missing required fields." });
      }
    
      try {
        const existingItem = await wishlistCollection.findOne({ userEmail, blogId });
        if (existingItem) {
          return res.status(400).json({ error: "This blog is already in your wishlist." });
        }
    
        const newWishlistItem = {
          blogId,
          title,
          image,
          shortDescription,
          category,
          author,
          userEmail,
          userName,
          addedAt: new Date(),
        };
    
        const result = await wishlistCollection.insertOne(newWishlistItem);
        res.json({ message: "Blog added to wishlist", result });
      } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(500).json({ error: "Failed to add to wishlist." });
      }
    });

    app.delete('/wishlist/:blogId', async (req, res) => {
      const { blogId } = req.params;
      const { userEmail } = req.body;
    
      try {
        const result = await wishlistCollection.deleteOne({
          _id: new ObjectId(blogId),
          userEmail,
        });
    
        if (result.deletedCount === 1) {
          res.json({ message: "Blog removed from wishlist." });
        } else {
          res.status(404).json({ error: "Blog not found in wishlist." });
        }
      } catch (error) {
        console.error("Error deleting wishlist item:", error);
        res.status(500).json({ error: "Failed to delete wishlist item." });
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
