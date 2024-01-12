const getContact = asyncHandler(async (req, res) => {
  let { page, size, search } = req.query;
  const limit = parseInt(size);
  const skip = (page - 1) * size;

  const pipeline = [];

  // Match stage for search
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phonenumber: { $regex: search, $options: 'i' } },
        ],
      },
    });
  }

  // Skip and Limit stages
  pipeline.push(
    { $skip: skip },
    { $limit: limit },
  );

  // Count stage for total count
  const countStage = { $count: 'totalCount' };

  // Facet stage to execute multiple pipelines
  const facetStage = {
    $facet: {
      contacts: pipeline,
      contactsCount: [countStage],
    },
  };

  // Add the facet stage to the pipeline
  pipeline.push(facetStage);

  // Execute the aggregation pipeline
  const result = await getContactData(pipeline);

  // Extract the results from the facet stage
  const { contacts, contactsCount } = result[0];

  res.status(200).json({ contacts, contactsCount });
});

// .........................................
const contact = require("../models/Schema");

// get contact
const getContactData=async(pipeline)=>{
    
    return await contact.aggregate(pipeline);
   
}

// get one contact
const getOneContactData=async(id)=>{
    return await contact.findById(id);
   
}

// create contact
const createContactData=async(updateData)=>{
    const {
        firstName,
        lastName,
        email,
        phonenumber,
        imagepath
      } = updateData;

    return await contact.create({ 
        firstName,
        lastName,
        email,
        phonenumber,
        imagepath})

}


// update contact
const updateContactData=async(id,updateData)=>{
    return await contact.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      )

}


// delete contact
const deleteContactData=async(id)=>{
   return await contact.findByIdAndDelete(id);

}


module.exports={getContactData,getOneContactData,deleteContactData,createContactData,updateContactData}

// .........................

exports.find = async (req, res) => {
  try {
      let { page, size, search } = req.query;
      const limit = parseInt(size);
      const skip = (page - 1) * size;

      const pipeline = [];

      if (search) {
          pipeline.push({
              $match: {
                  $or: [
                      { firstName: { $regex: search, $options: 'i' } },
                      { lastName: { $regex: search, $options: 'i' } },
                      { email: { $regex: search, $options: 'i' } },
                      { phone: { $regex: search, $options: 'i' } },
                  ],
              },
          });
      }

      pipeline.push(
          { $skip: skip },
          { $limit: limit },
      );

      const countStage = { $count: 'totalCount' };

      const facetStage = {
          $facet: {
              contacts: pipeline,
              contactsCount: [countStage],
          },
      };

      pipeline.push(facetStage);

      const result = await ContactDb.aggregate(pipeline).exec();

      const { contacts, contactsCount } = result[0];

      res.status(200).json({ contacts, contactsCount });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
  }
};
