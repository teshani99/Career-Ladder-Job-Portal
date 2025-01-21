const userRouter = require("express").Router();
let users = require("../model/user.js");
let listedjobs = require('../model/listedjobs.js')
let becomecompay = require('../model/becomecompay.js')
let userprofile = require('../model/userprofile.js')
let jobapplies = require('../model/jobapplies.js')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const blog = require("../model/blog.js");

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


//register
userRouter.get('/register', (req, res) => {
  res.render('register', { error: req.flash('error') });
});

// About route
userRouter.get('/about', async (req, res) => {
  
  const isAuthenticated = !!req.session.userId;
  
  res.render('about', { isAuthenticated });
});

 //contact
 userRouter.get('/contact', async (req, res) => {
  
  const isAuthenticated = !!req.session.userId;
  
  res.render('contact', { isAuthenticated });
});


 




userRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, cpassword } = req.body;
    const newUser = new users({
      name,
      email,
      password,
      cpassword,


    });

    if (password.length < 6) {


      req.flash('error', 'Password should be at least 6 character');
      res.render('register', { error: req.flash('error') }); // Render register with error

    } else {
      if (password === cpassword) {
        const userExist = await users.findOne({ email: email });

        if (userExist) {
          req.flash('error', 'Email already exists');
          res.render('register', { error: req.flash('error') }); // Render register with error
        } else {
          await newUser.save();
          req.flash('error', 'Registered successfully');
          res.redirect('/login'); // Redirect to a different page or the same page
        }

      } else {
        req.flash('error', 'Passwords do not match');
        res.render('register', { error: req.flash('error') }); // Render register with error
      }
    }
  }

  catch (err) {
    req.flash('error', 'Internal server error');
    res.render('register', { error: req.flash('error') }); // Render register with error
  }
});



// Login route
userRouter.get('/login', (req, res) => {
  res.render('login', { error: req.flash('error') });
});

userRouter.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const result = await users.findOne({ email: email });

    const count = await listedjobs.countDocuments();  // total number of job postings


    if (result && result.password === password) {
      req.session.userId = result._id; // Store user ID in session upon successful login
      const isAuthenticated = !!result._id;

      if (result.role == 'company') {
        res.render('company', { userId: result._id,isAuthenticated });  // Pass the user ID to the home page
      } else if (result.role == 'admin') {
        const empData = await users.find({});
        const roleCounts = empData.reduce((acc, curr) => {
          if (curr.role === 'user') {
            acc.user++;
          } else if (curr.role === 'company') {
            acc.company++;
          } else if (curr.role === 'admin') {
            acc.admin++;
          }
          return acc;
        }, { user: 0, company: 0, admin: 0 });


        const monthCounts = await users.aggregate([
          {
            $group: {
              _id: "$month",
              count: { $sum: 1 }
            }
          }
        ]);

        const countsByMonth = {};
        monthCounts.forEach(({ _id, count }) => {
          countsByMonth[_id] = count;
        });






        // Render your view or send the retrieved data to the client
        res.render('adminPanel', { result, empData, roleCounts, count, countsByMonth });
        //res.render('adminPanel', { userId: result._id }); // Pass the user ID to the home page
      } else {
        const empData = await listedjobs.find({});
    
        const count = await listedjobs.countDocuments();
  
        const edata = await users.find({});
        const roleCounts = edata.reduce((acc, curr) => {
          if (curr.role === 'user') {
            acc.user++;
          } else if (curr.role === 'company') {
            acc.company++;
          } else if (curr.role === 'admin') {
            acc.admin++;
          }
          return acc;
        }, { user: 0, company: 0, admin: 0 });
  
        res.render('home', { empData,roleCounts,count,isAuthenticated });
      }

    } else {
      req.flash('error', 'Invalid credentials');
      res.render('login', { error: req.flash('error') }); // Render login with error
    }
  } catch (err) {
    req.flash('error', 'Internal server error');
    res.render('login', { error: req.flash('error') }); // Render login with error
  }
});










// become a company

userRouter.get('/BecomeCompany', (req, res) => {
  try {
    const userId = req.session.userId;


    if (!userId) {
      // Handle case if patient is not logged in
      req.flash('error', 'Please log in as a patient');
      res.redirect('/login');
      return;
    }

    res.render('BecomeCompany')



  } catch (error) {
    req.flash('error', 'Data has not been created in the Database');
    res.redirect('/');
  }
});


userRouter.post('/BecomeCompany', upload.single('ccertificate'), async (req, res) => {
  try {
    const userId = req.session.userId;


    if (!userId) {
      // Handle case if patient is not logged in
      req.flash('error', 'Please log in as a patient');
      res.redirect('/login');
      return;
    }


    let ccertificate = '';
    if (req.file) {
      ccertificate = req.file.filename;
    }

    const data = {
      companyname: req.body.companyname,
      email : req.body.email,
      tagline: req.body.tagline,
      ccertificate: ccertificate,

      userId: userId

    };

    await becomecompay.create(data);
    req.flash('success', 'Data has been created in the Database');
    res.redirect('/');

  } catch (error) {
    req.flash('error', 'Data has not been created in the Database');
    res.redirect('/');
  }
});









// / command

userRouter.get('/', async (req, res) => {
  try {
    const userId = req.session.userId;
    const role = await users.findById(userId);
    const result = userId
    const isAuthenticated = !!userId;

    if (role && role.role === 'company') {
      listedjobs.find({})
        .then((x) => {
          res.render('company', { x ,isAuthenticated});
        });


        

    } else if (role && role.role === 'admin') {

      const count = await listedjobs.countDocuments();

      const empData = await users.find({});
      const roleCounts = empData.reduce((acc, curr) => {
        if (curr.role === 'user') {
          acc.user++;
        } else if (curr.role === 'company') {
          acc.company++;
        } else if (curr.role === 'admin') {
          acc.admin++;
        }
        return acc;
      }, { user: 0, company: 0, admin: 0 });

      const monthCounts = await users.aggregate([
        {
          $group: {
            _id: "$month",
            count: { $sum: 1 }
          }
        }
      ]);

      const countsByMonth = {};
      monthCounts.forEach(({ _id, count }) => {
        countsByMonth[_id] = count;
      });

      // Render your view or send the retrieved data to the client
      res.render('adminPanel', { result, empData, roleCounts, count, countsByMonth });


    } else {
      const empData = await listedjobs.find({});
      const count = await listedjobs.countDocuments();

      const empData2 = await users.find({});
      
      const roleCounts = empData2.reduce((acc, curr) => {
        if (curr.role === 'user') {
          acc.user++;
        } else if (curr.role === 'company') {
          acc.company++;
        } else if (curr.role === 'admin') {
          acc.admin++;
        }
        return acc;
      }, { user: 0, company: 0, admin: 0 });

      res.render('home', { empData,roleCounts,count,isAuthenticated });

    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});


// logout

userRouter.get('/logout', async (req, res) => {
  try {

    const userId = req.session.userId;
    const empData = await listedjobs.find({});

    if (!userId) {

      req.flash('error', 'Please log in as a patient');
      return res.redirect('/login');
    }

    // Clear the session data 
    req.session.destroy(err => {
      if (err) {
        req.flash('error', 'Error logging out');
        return res.redirect('/');
      }

      // Redirect to the home page after successful logout
      res.clearCookie('session-id');
      res.locals.loggedOut = true;
      

      
      res.render('login', { empData }); // Redirect to the home page
    });
  } catch (error) {
    req.flash('error', 'Error logging out');
    res.redirect('/'); // Redirect to the desired route or handle the error accordingly
  }
});










// //test
// userRouter.get('/test', async(req, res) => {
//   try {
//     const userId = req.session.userId;


//     if (!userId) {
//       // Handle case if patient is not logged in
//       req.flash('error', 'Please log in as a patient');
//       res.redirect('/login');
//       return;
//     }
//     const empData = await listedjobs.find({});
//     res.render('test',{empData})



//   } catch (error) {
//     req.flash('error', 'Data has not been created in the Database');
//     res.redirect('/');
//   }
// });





// apply for particular job by prss view

userRouter.get('/apply/:id', async (req, res) => {
  try {
    const id = req.session.userId;
    const jobid = req.params.id; 
    
    // if (!id) {
    //   // Handle case if patient is not logged in
    //   req.flash('error', 'Please log in as a user');
    //   res.redirect('/login');
    //   return;
    // }
    const userDetails = await users.findOne({ _id: id });
    // Find empmodel data related to the 
    const jobdetails = await listedjobs.findOne({ _id: jobid });
    
    // Render your view or send the retrieved data to the client
    res.render('jobPage', { jobdetails , userDetails });
  } catch (error) {
    req.flash('error', 'Error fetching data');
    res.redirect('/'); // Redirect to the desired route or handle the error accordingly
  }
});


//aluth model ekk one job applicants kiyl 
//eeyal qulified nn requirements wlt anuwa  datadase eke store krgnnw

// applying for a job

// userRouter.post('/apply/:id', async (req, res) => {
//   try {
//     const id = req.session.userId;
//     const jobid = req.params.id; 

    
//     if (!id) {
//       // Handle case if patient is not logged in
//       req.flash('error', 'Please log in as a user');
//       res.redirect('/login');
//       return;
//     }

    
//     const jobdetails = await listedjobs.findOne({ _id: jobid });
//     const profile = await userprofile.findOne({ userid: id});
    

//       if(profile == null ){
//         req.flash('error', 'First Edit your profile');
//         res.redirect('/profile');
//       }else {
//         if(jobdetails.experience <= profile.experience){
          
//           const data = {
//             jobid : jobid,
//             companyid : jobdetails.userId.toString(), 
//             userId: id,
//             profileid : profile,
//             profilePic : profile.profilePic,
//             experience : profile.experience,
          
//           };
//          console.log(data)
//           await jobapplies.create(data);
        
//           res.redirect('/');

//         }else {
//           req.flash('error', 'Error fetching data');
          
//           res.redirect('/'); 
//         }
//       }
    
    
//     // Render your view or send the retrieved data to the client
//     // res.render('jobPage', { jobdetails });
//   } catch (error) {
//     req.flash('error', 'Error fetching data');
//     res.redirect('/'); // Redirect to the desired route or handle the error accordingly
//   }
// });

userRouter.post('/apply/:id', async (req, res) => {
  try {
    const id = req.session.userId;
    const jobid = req.params.id; 

    if (!id) {
      req.flash('error', 'Please log in as a user');
      res.redirect('/login');
      return;
    }

    const jobdetails = await listedjobs.findOne({ _id: jobid });
    const profile = await userprofile.findOne({ userid: id });

    if (profile == null) {
      req.flash('error', 'First Edit your profile');
      res.redirect('/profile');
      return;
    }

    if (jobdetails.experience <= profile.experience) {
      const data = {
        jobid: jobid,
        companyid: jobdetails.userId.toString(),
        userId: id,
        profileid: profile._id,
        profilePic: profile.profilePic,
        experience: profile.experience,
      };

      // Check if a document with the same jobid and profileid exists
      const existingApplication = await jobapplies.findOneAndUpdate(
        { jobid: jobid, profileid: profile._id },
        { $set: data },
        { upsert: true }
      );

      if (!existingApplication) {
        req.flash('success', 'Application submitted successfully');
      } else {
        req.flash('info', 'Application already exists');
      }

      res.redirect('/');
    } else {
      req.flash('error', 'Error fetching data');
      res.redirect('/');
    }
  } catch (error) {
    req.flash('error', 'Error fetching data');
    res.redirect('/');
  }
});




//applie selected
// Route to handle selecting a job application
userRouter.post('/selected/:id', async (req, res) => {
  try {
    const applicationId = req.params.id;
    await jobapplies.findByIdAndUpdate(applicationId, { selected: 1 });
    req.flash('success', 'Application selected successfully');
    res.redirect('back');
  } catch (error) {
    req.flash('error', 'Error updating application status');
    res.redirect('back');
  }
});

// Route to handle not selecting a job application
userRouter.post('/notselected/:id', async (req, res) => {
  try {
    const applicationId = req.params.id;
    await jobapplies.findByIdAndUpdate(applicationId, { selected: 2 });
    req.flash('success', 'Application not selected');
    res.redirect('back');
  } catch (error) {
    req.flash('error', 'Error updating application status');
    res.redirect('back');
  }
});




userRouter.get('/appliedjobs', async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      req.flash('error', 'Please log in as a user');
      return res.redirect('/login');
    }

    // Find all job applications for the logged-in user
    const appliedJobs = await jobapplies.find({ userId: userId }).lean();

    if (appliedJobs.length === 0) {
      req.flash('info', 'You have not applied for any jobs yet');
      return res.redirect('/');
    }

    // Extract job IDs from the applied jobs
    const jobIds = appliedJobs.map(application => application.jobid);

    // Retrieve job details for each job ID
    const jobDetails = await listedjobs.find({ _id: { $in: jobIds } }).lean();

    // Extract user IDs from the job details
    const userIds = jobDetails.map(job => job.userId);

    // Retrieve user details for each user ID
    const userDetails = await users.find({ _id: { $in: userIds } }).lean();

    // Create a map for quick lookup of job details by job ID
    const jobDetailsMap = jobDetails.reduce((acc, job) => {
      acc[job._id] = job;
      return acc;
    }, {});

    // Create a map for quick lookup of user details by user ID
    const userDetailsMap = userDetails.reduce((acc, user) => {
      acc[user._id] = user;
      return acc;
    }, {});

    // Merge job application data with job and user details
    const appliedJobDetails = appliedJobs.map(application => ({
      ...application,
      job: jobDetailsMap[application.jobid],
      user: userDetailsMap[jobDetailsMap[application.jobid].userId]
    }));

   
    res.render('AppliedJobs', { appliedJobDetails });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching applied jobs');
    res.redirect('/');
  }
});



//about
userRouter.get('/apply/:id', async (req, res) => {
  try {
    const id = req.session.userId;
   
    
    if (!id) {
      // Handle case if patient is not logged in
      req.flash('error', 'Please log in as a user');
      res.redirect('/login');
      return;
    }


    res.render('about');
  } catch (error) {
    req.flash('error', 'Error fetching data');
    res.redirect('/'); // Redirect to the desired route or handle the error accordingly
  }
});





userRouter.get('/bloguser', async (req, res) => {
  try {
    const userId = req.session.userId;
    const isAuthenticated = !!req.session.userId;


    if (!userId) {
      // Handle case if patient is not logged in
      req.flash('error', 'Please log ');
      res.redirect('/login');
      return;
    }
    const blogs = await blog.find({});
    res.render('DisplayBlog', { blogs, isAuthenticated  })



  } catch (error) {
    req.flash('error', 'Data has not been created in the Database');
    res.redirect('/');
  }
});





// Route to display a single blog
userRouter.get('/blogsuser/:id', async (req, res) => {
  try {
    const id = req.session.userId;
    const blogid = req.params.id; 
    
    if (!id) {
      // Handle case if patient is not logged in
      req.flash('error', 'Please log in as a user');
      res.redirect('/login');
      return;
    }

    // Find empmodel data related to the 
    const blogs= await blog.findOne({ _id: blogid });
    console.log(blogs)
    // Render your view or send the retrieved data to the client
    res.render('SingleBlog', { blogs });
  } catch (error) {
      req.flash('error', 'Error fetching blog');
      res.redirect('/bloguser');
  }
});



module.exports = userRouter;