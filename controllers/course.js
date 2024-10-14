const mongoose = require("mongoose");
const Course = require("../models/course")

exports.getCourses=async(req, res)=>{
    try {
        // Check if the user is an admin
    
        let courses;
          courses = await Course.find();
    
        res.status(200).json(courses); 
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching orders", error });
      }
}

exports.postCourse=async (req, res)=>{
    try{
    const {title}=req.body;

    const an= new Course({
        title,
        institute: "ITES",
        studentsEnrolled: 0,  
        fee: 0
    })
    await an.save();
    res.status(201).json({ message: "Order placed successfully", an });
    } catch(error){
        console.error('Error placing order:', error); // Log error
        res.status(500).json({ message: "Error placing order", error });
    }
}