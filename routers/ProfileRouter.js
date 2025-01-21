const userprofileRouter = require("express").Router();
let userProfile = require('../model/userprofile');
let patient = require("../model/user.js");
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


// render profile
userprofileRouter.get('/profile', async (req, res) => {
  try {
    const userid = req.session.userId;

    if (!userid) {
      req.flash('error', 'Please log in as user');
      return res.redirect('/login');
    }

    const profileData = await userProfile.findOne({ userid });
    

   

    res.render('profile', { profileData });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching profile data');
    res.redirect('/');
  }
});



userprofileRouter.post('/profile', upload.single('profilePic'), async (req, res) => {
  try {
    const userid = req.session.userId;

    if (!userid) {
      req.flash('error', 'Please log in as a user');
      return res.redirect('/login');
    }

    let profilePic = '';
    if (req.file) {
      profilePic = req.file.filename;
    }

    const profileData = {
      fullName: req.body.fullName,
      dob: req.body.dob,
      nic: req.body.nic,
      civilStatus: req.body.civilStatus,
      gender: req.body.gender,
      religion: req.body.religion,
      occupation: req.body.occupation,
      address: req.body.address,
      mobileNo: req.body.mobileNo,
      experience : req.body.experience,
      jobdescription : req.body.jobdescription,
      profilePic: profilePic,

      userid: userid
    };

    await userProfile.updateOne({ userid }, profileData, { upsert: true });

    req.flash('success', 'Data has been updated in the Database');
    res.redirect('/');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error updating data in the Database');
    res.redirect('/');
  }
});



// company profile
userprofileRouter.get('/companyprofile', async (req, res) => {
  try {
    const userid = req.session.userId;

    if (!userid) {
      req.flash('error', 'Please log in as user');
      return res.redirect('/login');
    }

    const profileData = await userProfile.findOne({ userid });
    

   

    res.render('companyprofile', { profileData });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching profile data');
    res.redirect('/');
  }
});






userprofileRouter.post('/companyprofile', upload.single('profilePic'), async (req, res) => {
  try {
    const userid = req.session.userId;

    if (!userid) {
      req.flash('error', 'Please log in as a user');
      return res.redirect('/login');
    }

    let profilePic = '';
    if (req.file) {
      profilePic = req.file.filename;
    }

    const profileData = {
      fullName: req.body.fullName,
      dob: req.body.dob,
      nic: req.body.nic,
      civilStatus: req.body.civilStatus,
      gender: req.body.gender,
      religion: req.body.religion,
      occupation: req.body.occupation,
      address: req.body.address,
      mobileNo: req.body.mobileNo,
      experience : req.body.experience,
      jobdescription : req.body.jobdescription,
      profilePic: profilePic,

      userid: userid
    };

    await userProfile.updateOne({ userid }, profileData, { upsert: true });

    req.flash('success', 'Data has been updated in the Database');
    res.redirect('/');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error updating data in the Database');
    res.redirect('/');
  }
});




// userprofileRouter.get('/profile', async (req, res) => {
//   try {
//     const patientId = req.session.userId; // Retrieve patient ID from the session

//     if (!patientId) {
//       // Handle case if patient is not logged in
//       req.flash('error', 'Please log in as a user');
//       res.redirect('/login');
//       return;
//     }

//     // Find empmodel data related to the patientId
//     const empData = await userProfile.find({ patientId }).populate('patientId');

//     // Render your view or send the retrieved data to the client
//     res.render('profiledisplay', { empData });
//   } catch (error) {
//     req.flash('error', 'Error fetching data');
//     res.redirect('/'); // Redirect to the desired route or handle the error accordingly
//   }
// });







module.exports = userprofileRouter;