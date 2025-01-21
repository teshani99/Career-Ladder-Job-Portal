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
      req.flash('error', 'Please log in as a user');
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
    const jobpostedDate = new Date().toISOString().split('T')[0];
    const data = {

      jobpostedDate: jobpostedDate,
      jlogo: jlogo,
      jobtitle: req.body.jobtitle,
      address: req.body.jobtitle,
      vacancy: req.body.vacancy,
      gender: req.body.gender,
      salary: req.body.salary,
      deadline: req.body.deadline,
      jobregion: req.body.jobregion,
      jobtype: req.body.jobtype,
      experience: req.body.experience,
      jobdescription: req.body.jobdescription,
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


// companyRouter.get('/companylisting', async (req, res) => {
//   try {
//     const userId = req.session.userId; // Retrieve patient ID from the session

//     if (!userId) {
//       // Handle case if patient is not logged in
//       req.flash('error', 'Please log in as a company');
//       res.redirect('/login');
//       return;
//     }

//     // Find  data related to the 
//     const listedjob = await listedjobs.find({ userId }).populate('userId');
//     console.log("Start")
//     console.log(listedjob)



//     const applicants = await jobapplies.find({ userId }).populate('userId');
//     console.log(applicants)

//     // const jobdetails = await listedjobs.findOne({ _id: jobid });
//     // const profile = await userprofile.findOne({ userid: id});
//     // console.log(jobdetails.userId)
//     console.log("end")






//     // Render your view or send the retrieved data to the client
//     res.render('companylisting', { listedjob });
//   } catch (error) {
//     req.flash('error', 'Error fetching data');
//     res.redirect('/'); // Redirect to the desired route or handle the error accordingly
//   }
// });


//
// Update the /companylisting route to fetch and display applicants for each job
// companyRouter.get('/companylisting', async (req, res) => {
//   try {
//     const userId = req.session.userId;

//     if (!userId) {
//       req.flash('error', 'Please log in as a company');
//       res.redirect('/login');
//       return;
//     }

//     // Find job listings for the current company
//     const listedjob = await listedjobs.find({ userId }).populate('userId');
    
//     if (!listedjob || listedjob.length === 0) {
//       req.flash('error', 'No job listings found for this company');
//       res.redirect('/');
//       return;
//     }

//     // Group job listings by job title
//     const groupedJobs = {};
//     listedjob.forEach(data => {
//       if (!groupedJobs[data.jobtitle]) {
//         groupedJobs[data.jobtitle] = [];
//       }
//       groupedJobs[data.jobtitle].push(data);
//     });

//     // Fetch applicants for each job
//     for (const jobtitle of Object.keys(groupedJobs)) {
//       const jobapplicants = await jobapplies.find({ jobid: groupedJobs[jobtitle][0]._id }).populate('userId');
//       groupedJobs[jobtitle].applicants = jobapplicants;
//     }
//     console.log(groupedJobs)
//     // Render the companylisting view with the grouped jobs and applicants
//     res.render('companylisting', { groupedJobs });
//   } catch (error) {
//     req.flash('error', 'Error fetching data');
//     res.redirect('/');
//   }
// });



companyRouter.get('/companylisting', async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      req.flash('error', 'Please log in as a user');
      return res.redirect('/login');
    }

    // Find all job applications for the logged-in user
    const postedjobs = await listedjobs.find({ userId: userId }).lean();

 

   
    res.render('Allcompanyjobs', { postedjobs });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching applied jobs');
    res.redirect('/');
  }
});









// show candiates


companyRouter.get('/candidates/:id', async (req, res) => {
  try {
    const userId = req.session.userId;
    const jobid = req.params.id;
    

    if (!userId) {
      req.flash('error', 'Please log in as a user');
      return res.redirect('/login');
    }

// Find all job applications for the logged-in user
const jobApplications = await jobapplies.find({ jobid: jobid }).lean();

// Extract userIds from job applications
const userIds = jobApplications.map(application => application.userId);

// Find user profiles for the extracted userIds
const userProfiles = await userprofile.find({ userid: { $in: userIds } }).lean();


// Prepare a map of userId to user profile for quick lookup
const userProfileMap = userProfiles.reduce((map, userProfile) => {
    map[userProfile.userid] = userProfile;
    return map;
}, {});

// Combine job applications with user profiles
// Combine job applications with user profiles
const postedjobs = jobApplications.map(application => {
  const userProfile = userProfileMap[application.userId];
  if (userProfile) {
      return { ...application, userProfile };
  } else {
      // Handle the case where userProfile is undefined (user not found)
      return { ...application, userProfile: { userid: application.userid, name: "Unknown" } };
  }
});

    
  



    res.render('Candidates', { postedjobs });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching applied jobs');
    res.redirect('/');
  }
});















// view profile of applicant

companyRouter.get('/viewprofile/:id', async (req, res) => {
  try {
    const uid = req.session.userId; // Retrieve patient ID from the session
    const appliecant = req.params.id;


    if (!uid) {
      // Handle case if patient is not logged in
      req.flash('error', 'Please log in as a user');
      res.redirect('/login');
      return;
    }

    // Find empmodel data related to the patientId
    const empData = await userprofile.find({ _id: appliecant }).populate('_id');

    const empData2 = await userprofile.findOne({ _id: appliecant }).lean();
    const userid = empData2.userid;

    const user = await users.findOne({ _id: userid }).lean();
    const email = user.email
    
    // const empData = await userprofile.findOne({ _id : appliecant });



    // Render your view or send the retrieved data to the client
    res.render('profileDisplay', { empData ,email });
  } catch (error) {
    req.flash('error', 'Error fetching data');
    res.redirect('/'); // Redirect to the desired route or handle the error accordingly
  }
});




// remove job

companyRouter.delete("/delete/:id", async (req, res) => {


    try {
    const uid = req.session.userId; // Retrieve patient ID from the session
    const jobid = req.params.id;


    if (!uid) {
      // Handle case if patient is not logged in
      req.flash('error', 'Please log in as a patient');
      res.redirect('/login');
      return;
    }


    const deletedUser = await listedjobs.findByIdAndDelete(jobid);
    const jobapplyed = await jobapplies.deleteMany({ jobid: jobid });


    res.redirect('/');

  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Error deleting user", error: error.message });
  }
});



module.exports = companyRouter;