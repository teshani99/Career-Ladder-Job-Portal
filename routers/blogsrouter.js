


// routes/blog.js
const express = require('express');
const multer = require('multer');
const blog = require('../model/blog.js'); // Adjust the path as necessary
const router = express.Router();

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Render add blog form
router.get('/addblog', (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    req.flash('error', 'Please log in');
    return res.redirect('/login');
  }

  res.render('addblog'); // Adjust the view name if necessary
});

// Handle add blog form submission
router.post('/addblog', upload.single('blogimage'), async (req, res) => {
  const { blogtitle, blogdescription,blogdescriptionnew, blogauthor } = req.body;
  const blogimage = req.file ? `/uploads/${req.file.filename}` : null;

  const newBlog = new blog({
    blogtitle,
    blogdescription,
    blogdescriptionnew,
    blogauthor,
    blogimage,
  });
  try {
    await newBlog.save();
    res.redirect('/blogsuser'); // Redirect to the blog user view
  } catch (err) {
    req.flash('error', 'Error saving blog post');
    res.redirect('/addblog');
  }
});



module.exports = blogsrouter;