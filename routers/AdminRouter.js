
const Adrouter = require("express").Router();
let users = require("../model/user.js");
let listedjobs = require('../model/listedjobs.js')
let becomecompay = require('../model/becomecompay.js')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const User = require("../model/user.js");
const blog = require("../model/blog.js");
const jobapplies = require('../model/jobapplies.js'); // Assuming jobapplies model exists
const userprofile = require('../model/userprofile.js'); // Assuming userprofile model exists


// image upload

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'upload/'); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now()) // Set the filename to be unique
  },
});

const upload = multer({ storage: storage });







// handle the Become a compay request

Adrouter.get('/AdminCom', async (req, res) => {
  try {
    const userId = req.session.userId; // Retrieve patient ID from the session

    if (!userId) {
      // Handle case if patient is not logged in
      req.flash('error', 'Please log in ');
      res.redirect('/login');
      return;
    }

    // Find empmodel data related to the patientId
    const docdata = await becomecompay.find({});

    // Render your view or send the retrieved data to the client
    res.render('AdminCom', { docdata });

  } catch (error) {
    req.flash('error', 'Error fetching data');
    res.redirect('/'); // Redirect to the desired route or handle the error accordingly
  }
});


// Accept become company request
Adrouter.get('/Accept/:id', async (req, res) => {
  try {

    const readquery = req.params.id;
    const company = await becomecompay.findById(readquery)
    const emailtest = company.email;
    const result = await User.findOne({ email: emailtest });

    if (result.email == emailtest) {

      const updatedEntry = await User.findOneAndUpdate(
        { _id: result }, // Query condition
        {
          $set: {
            role: 'company',
          }
        },
        { new: true }
      );

      const deletedUser = await becomecompay.findByIdAndDelete(readquery);

      res.redirect('/');

    } else {
      const deletedUser = await becomecompay.findByIdAndDelete(readquery);
      res.status(404).send('user not found');

    }
  } catch (error) {

    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// delete become company request
Adrouter.delete("/deleteRequest/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await becomecompay.findByIdAndDelete(userId);

    if (deletedUser) {
      res.redirect('/');

    } else {
      res.status(404).send({ status: "User not found" });
    }


  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Error deleting user", error: error.message });
  }
});




// edit user role


Adrouter.get('/adminedit/:id', async (req, res) => {
  try {
    const readquery = req.params.id;
    const record = await users.findById(readquery);

    if (record) {
      res.render('EditRole', { data: record });
    } else {
      // Handle case where the record with the given ID is not found
      res.status(404).send('Record not found');
    }
  } catch (error) {
    // Handle error if any occurs during the database operation
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
Adrouter.patch('/admintest/:id', async (req, res) => {

  try {
    // Get the user ID from the session
    const entryId = req.params.id; // Get the ID from URL parameter

    // Find the specific entry to update using its ID and the logged-in user's ID


    const updatedEntry = await users.findOneAndUpdate(
      { _id: entryId }, // Query condition
      {
        $set: {

          role: req.body.role,

          // Update other fields as needed
        }

      },
      { new: true } // To get the updated document after the update operation
    );
    0

    if (updatedEntry) {
      // Handle successful update
      req.flash('success', 'Entry updated successfully');
      res.redirect('/'); // Redirect to a success page or specific route
    } else {
      // Handle case where the entry to update wasn't found or the user isn't authorized
      req.flash('error', 'Failed to update entry');
      res.redirect('/');
    }
  } catch (error) {
    console.error(error);
    // Handle error case
    req.flash('error', 'Internal server error');
    res.redirect('/');
  }
});

Adrouter.delete("/del/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await users.findByIdAndDelete(userId);

    if (deletedUser) {
      // res.status(200).send({ status: "User deleted", user: deletedUser });
      res.redirect('/');

    } else {

      res.status(404).send({ status: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Error deleting user", error: error.message });
  }
});










// ANALYZIZ
// GET request for rendering the initial analysis page
Adrouter.get('/analysis', async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      req.flash('error', 'Please log in');
      res.redirect('/login');
      return;
    }

    // Get all users with the role 'company'
    const companies = await User.find({ role: 'company' });

    // Render the adminAnalyze.ejs view with companies list
    res.render('adminAnalyze', { companies, companyProfile: null, jobs: [], profileDetails: null });
  } catch (error) {
    req.flash('error', 'Error fetching data');
    res.redirect('/');
  }
});

// POST request for handling company selection and displaying details
// POST request for handling company selection and displaying details
Adrouter.post('/analysisdeta', async (req, res) => {
  try {
    const companyId = req.body.id;

    // Get all users with the role 'company' for the sidebar
    const companies = await User.find({ role: 'company' });

    // Find the user by companyId
    const companyProfile = await User.findById(companyId);

    // Find the corresponding profile in userprofile collection
    const profileDetails = await userprofile.findOne({ userid: companyId });

    // Find all jobs listed by this company
    const jobs = await listedjobs.find({ userId: companyId });

    // Fetch number of applicants for each job
    const jobsWithApplicants = await Promise.all(jobs.map(async (job) => {
      const applicantCount = await jobapplies.countDocuments({ jobId: job._id });
      return {
        ...job._doc,
        applicantCount
      };
    }));

    // Calculate total number of applicants and the average number of applicants per job
    const totalApplicants = jobsWithApplicants.reduce((sum, job) => sum + job.applicantCount, 0);
    const totalJobs = jobsWithApplicants.length;
    const averageApplicantsPerJob = totalJobs === 0 ? 0 : (totalApplicants / totalJobs).toFixed(2);

    // Add calculated fields to jobs data
    const jobsWithCalculatedFields = jobsWithApplicants.map(job => {
      const ratio = job.applicantCount === 0 ? 'N/A' : (job.vacancy / job.applicantCount).toFixed(2);
      return {
        ...job,
        vacancyToApplicationRatio: ratio,
        averageApplicantsPerJob
      };
    });

    // Render the adminAnalyze.ejs view with data
    res.render('adminAnalyze', { companies, companyProfile, profileDetails, jobs: jobsWithCalculatedFields });
  } catch (error) {
    req.flash('error', 'Error fetching data');
    res.redirect('/');
  }
});















Adrouter.get('/blog', async (req, res) => {
  try {
    const userId = req.session.userId;


    if (!userId) {
      // Handle case if patient is not logged in
      req.flash('error', 'Please log ');
      res.redirect('/login');
      return;
    }
    const blogs = await blog.find({});
    res.render('Addedblog', { blogs })



  } catch (error) {
    req.flash('error', 'Data has not been created in the Database');
    res.redirect('/');
  }
});





Adrouter.get('/addblog', async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      // Handle case if patient is not logged in
      req.flash('error', 'Please log in ');
      res.redirect('/login');
      return;
    }




    res.render('addnewblog');

  } catch (error) {
    req.flash('error', 'Error fetching data');
    res.redirect('/'); // Redirect to the desired route or handle the error accordingly
  }
});





Adrouter.post('/addblog', upload.single('blogimage'), async (req, res) => {
  try {
    const userId = req.session.userId;


    if (!userId) {
      // Handle case if patient is not logged in
      req.flash('error', 'Please log ');
      res.redirect('/login');
      return;
    }


    let blogimage = '';
    if (req.file) {
      blogimage = req.file.filename;
    }
    const blogdate = new Date().toISOString().split('T')[0];
    const data = {

      blogdate: blogdate,
      blogimage: blogimage,
      blogtitle: req.body.blogtitle,
      blogdescription: req.body.blogdescription,
      blogdescriptionnew : req.body.blogdescriptionnew,
      blogauthor: req.body.blogauthor,


    };

    await blog.create(data);
    req.flash('success', 'Data has been created in the Database');
    res.redirect('/')

  } catch (error) {
    req.flash('error', 'Data has not been created in the Database');
    res.redirect('/');
  }
});



Adrouter.delete("/blogdelete/:id", async (req, res) => {
  try {
    const blogid = req.params.id;

    const deletedblog = await blog.findByIdAndDelete(blogid);

    if (deletedblog) {
      // res.status(200).send({ status: "User deleted", user: deletedUser });
      res.redirect('/');

    } else {

      res.status(404).send({ status: " not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Error deleting user", error: error.message });
  }
});








module.exports = Adrouter;