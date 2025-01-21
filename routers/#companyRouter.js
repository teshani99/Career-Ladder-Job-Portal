const companyRouter = require("express").Router();
let users = require("../model/user.js");
let listedjobs = require('../model/listedjobs.js')

let becomecompay = require('../model/becomecompay.js')
let userprofile = require('../model/userprofile.js')
let jobapplies = require('../model/jobapplies.js')






const multer = require('multer');
const fs = require('fs');
const path = require('path');

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



// posting a Job

companyRouter.get('/comapypostjob', (req, res) => {
  try {
    const userId = req.session.userId;


    if (!userId) {
      // Handle case if patient is not logged in
      req.flash('error', 'Please log in as a patient');
      res.redirect('/login');
      return;
    }
      
    res.render('comapypostjob')



  } catch (error) {
    req.flash('error', 'Data has not been created in the Database');
    res.redirect('/');
  }
});

// posting a Job

companyRouter.post('/comapypostjob', upload.single('jlogo'), async (req, res) => {
  try {
    const userId = req.session.userId;


    if (!userId) {
      // Handle case if patient is not logged in
      req.flash('error', 'Please log in as a company');
      res.redirect('/login');
      return;
    }


    let jlogo = '';
    if (req.file) {
      jlogo = req.file.filename;
    }

    const data = {

      jlogo : jlogo,
      jobtitle: req.body.jobtitle,
      joblocation: req.body.joblocation,
      jobregion: req.body.jobregion,
      jobtype : req.body.jobtype,
      experience : req.body.experience,
      jobdescription : req.body.jobdescription,
      userId: userId

    };

    await listedjobs.create(data);
    req.flash('success', 'Data has been created in the Database');
    res.redirect('/');

  } catch (error) {
    req.flash('error', 'Data has not been created in the Database');
    res.redirect('/');
  }
});


// displaying posted jobs


companyRouter.get('/companylisting', async (req, res) => {
  try {
    const userId = req.session.userId; // Retrieve patient ID from the session

    if (!userId) {
      // Handle case if patient is not logged in
      req.flash('error', 'Please log in as a company');
      res.redirect('/login');
      return;
    }

    // Find  data related to the 
    const listedjob = await listedjobs.find({ userId }).populate('userId');
    console.log("Start")
    console.log(listedjob)

    

    const applicants = await jobapplies.find({ userId }).populate('userId');
    console.log(applicants)

    // const jobdetails = await listedjobs.findOne({ _id: jobid });
    // const profile = await userprofile.findOne({ userid: id});
    // console.log(jobdetails.userId)
    console.log("end")





    
    // Render your view or send the retrieved data to the client
    res.render('companylisting', { listedjob });
  } catch (error) {
    req.flash('error', 'Error fetching data');
    res.redirect('/'); // Redirect to the desired route or handle the error accordingly
  }
});















module.exports = companyRouter;