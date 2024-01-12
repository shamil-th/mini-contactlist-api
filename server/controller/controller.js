const ContactDb = require('../model/model');
const path = require('path');
const multer = require('multer');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "avatars");
    },
    filename: function (req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        );
    },
});

// Multer upload configuration
const upload = multer({ storage: storage }).single("avatar");


// create and save new contact
exports.create = (req, res) => {
    console.log("init file", req.files);
    upload(req, res, async (error) => {
        if (error instanceof multer.MulterError) {
            console.log("init avatar", req.body.avatar);
            return res.status(400).json({ error: "image error" + error });
        } else if (error) {
            return res.status(500).json({ error: "server error " + error });
        } else {
            // Validate required fields
            const requiredFields = [
                "firstName",
                "lastName",
                "email",
                "phone",
            ];


            for (const field of requiredFields) {
                if (!req.body[field]) {
                    return res
                        .status(400)
                        .send({ message: `Error: Missing ${field} field` });
                }
            }

            console.log("Received Data:", req.body);
            console.log("Received File:", req.file);

            const avatarPath = req.file ? req.file.path : null;
            console.log(avatarPath);

            // new contact

            const contact = new ContactDb({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                phone: req.body.phone,
                avatar: avatarPath
            })

            // save contact in database
            contact
                .save(contact)
                .then(data => {
                    res.send(data)
                })
                .catch(err => {
                    res.status(500).send({
                        message: err.message || "Some error occured during create operation"
                    })
                })
        }
    });
};

//find a single contact
exports.findId = (req, res) => {
    const id = req.params.id;
    ContactDb.findById(id)
        .then(data => {
            if (!data) {
                res.status(404).send({ message: "contact not found with id" + id })
            }
            else {
                res.send(data)
            }
        })
        .catch(err => {
            res.status(500).send({ message: "error retriving contact with id" + id + ", " + err })
        })
}

//retrive all contact
// exports.find = (req, res) => {
//     ContactDb.find()
//         .then(contact => {
//             res.send(contact)
//         })
//         .catch(err => {
//             res.status(500).send({
//                 message: err.message || "error occured while retriving data"
//             });
//         });
// }

// exports.find = async (req, res) => {
//     try {
//         let { search } = req.query;
//         let page = req.query.page || 1;
//         let size = req.query.size || 5;
//         const limit = parseInt(size);
//         const skip = (page - 1) * size;

//         const pipeline = [];

//         if (search) {
//             pipeline.push({
//                 $match: {
//                     $or: [
//                         { firstName: { $regex: search, $options: 'i' } },
//                         { lastName: { $regex: search, $options: 'i' } },
//                         { email: { $regex: search, $options: 'i' } },
//                         { phone: { $regex: search, $options: 'i' } },
//                     ],
//                 },
//             });
//         }

//         pipeline.push(
//             { $skip: skip },
//             { $limit: limit },
//         );

//         const countStage = { $count: 'totalCount' };

//         const facetStage = {
//             $facet: {
//                 contacts: pipeline.slice(0), // Copy the pipeline to avoid recursion
//                 contactsCount: [countStage],
//             },
//         };

//         pipeline.push(facetStage);

//         const result = await ContactDb.aggregate(pipeline).exec();

//         const { contacts, contactsCount } = result[0];

//         res.status(200).json({ contacts, contactsCount });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };

exports.find = async (req, res) => {
    try {
        let { search } = req.query;
        let page = req.query.page || 1;
        let size = req.query.size || 5;
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

        const facetStage = {
            $facet: {
                contacts: [
                    ...pipeline,
                    { $skip: skip },
                    { $limit: limit },
                ],
                contactsCount: [{ $count: 'totalCount' }],
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


// exports.update = (req,res) => {
//     const id = req.params.id;

//     upload(req,res,async(error) => {
//         if(error instanceof multer.MulterError) {
//             res.status(400).json({ err:"image upload error"})
//         }
//         else if(error){
//             res.status(500).json({error: "server error"})
//         }

//         let avatarPath;
//         if(req.file){
//             avatarPath = path.join('avatars',req.file.filename)
//         }else {
//             const contact = await ContactDb.findById(id);
//             if(!contact){
//                 res.status(404).json({error: "contact not found"});
//                 return;
//             }
//              // Use the existing avatar path
//             avatarPath = contact.avatar;
//         }
//         const contact = await ContactDb.findById(id);
//         if(!contact) {
//             res.status(404);
//             throw new Error("contact not found")
//         }

//         const updateData = {
//             ...req.body,
//             ...(avatarPath ? {avatar:avatarPath} : {}),
//         };

//         console.log(avatarPath)
//         const updated = await ContactDb.findByIdAndUpdate(id,updateData,{new:true});
//         console.log(updated)
//         res.status(200).json(updated);
//     })
// };

exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, async (error) => {
        if (error instanceof multer.MulterError) {
            return res.status(400).json({ error: "Image upload error" });
        } else if (error) {
            return res.status(500).json({ error: "Server error" });
        }

        try {
            let avatarPath;
            if (req.file) {
                avatarPath = path.join('avatars', req.file.filename);
            } else {
                const contact = await ContactDb.findById(id);
                if (!contact) {
                    return res.status(404).json({ error: "Contact not found" });
                }
                // Use the existing avatar path
                avatarPath = contact.avatar;
            }

            const contact = await ContactDb.findById(id);
            if (!contact) {
                return res.status(404).json({ error: "Contact not found" });
            }

            const updateData = {
                ...req.body,
                // Set the avatar path
                avatar: avatarPath,
            };

            const updated = await ContactDb.findByIdAndUpdate(id, updateData, { new: true });

            return res.status(200).json(updated);

        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Server error" });
        }
    });
};


exports.delete = (req, res) => {
    const id = req.params.id;
    ContactDb.findByIdAndDelete(id)
        .then(data => {
            if (!data) {
                res.status(404).send({ message: `cannot delete contact with id ${id}. May be id is wrong` })
            }
            else {
                res.send({
                    message: "contact was deleted successfully"
                })
            }
        })
        .catch(err => {
            res.status(500).send({
                message: `could not delete contact with id ${id}`
            });
        });

}
