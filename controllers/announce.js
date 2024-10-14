const mongoose = require("mongoose");
const Announce = require("../models/announcement")

exports.getAnnouncements=async(req, res)=>{
    try {
        // Check if the user is an admin
    
        let announce;
        announce = await Announce.find();
    
        res.status(200).json(announce); 
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching orders", error });
      }
}

exports.postAnnouncements= async (req, res)=>{
    try{
    const {title, description}=req.body;

    
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    const currentDate = new Date().toLocaleDateString(undefined, options);
    
    const time = `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;

    const an= new Announce({
        title,
        description, 
        date: currentDate, 
        time: time, 
    })
    await an.save();
    res.status(201).json({ message: "Order placed successfully", an });
    } catch(error){
        console.error('Error placing order:', error); // Log error
        res.status(500).json({ message: "Error placing order", error });
    }
}

exports.editAnnouncement = async (req, res) => {
    try {
      const { id } = req.params; 
      const { title, description } = req.body;  

      const updatedAnnouncement = await Announce.findByIdAndUpdate(
        id,
        {
          title,
          description,
        },
        { new: true } 
      );
  
      if (!updatedAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
  
      res.status(200).json({ message: "Announcement updated successfully", updatedAnnouncement });
    } catch (error) {
      console.error('Error updating announcement:', error);  // Log error
      res.status(500).json({ message: "Error updating announcement", error });
    }
  };
  

  exports.deleteAnnouncement = async (req, res) => {
    try {
      const { id } = req.params; // Get the ID from the request parameters
  
      // Find the announcement by ID and delete it
      const deletedAnnouncement = await Announce.findByIdAndDelete(id);
  
      if (!deletedAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
  
      res.status(200).json({ message: "Announcement deleted successfully", deletedAnnouncement });
    } catch (error) {
      console.error('Error deleting announcement:', error); // Log error
      res.status(500).json({ message: "Error deleting announcement", error });
    }
  };
  