const ContactDb = require('../model/model');
const path = require('path');
const multer = require('multer');

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

const upload = multer({ storage: storage }).single("avatar");

const createContact = async (req) => {
    return new Promise((resolve, reject) => {
        upload(req, {}, async (error) => {
            if (error instanceof multer.MulterError) {
                return reject({ error: "Image upload error" });
            } else if (error) {
                return reject({ error: "Server error" });
            }

            const requiredFields = [
                "firstName",
                "lastName",
                "email",
                "phone",
            ];

            for (const field of requiredFields) {
                if (!req.body[field]) {
                    return reject({ message: `Error: Missing ${field} field` });
                }
            }

            const avatarPath = req.file ? req.file.path : null;

            const contact = new ContactDb({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                phone: req.body.phone,
                avatar: avatarPath,
            });

            try {
                const data = await contact.save();
                resolve(data);
            } catch (err) {
                reject({ message: err.message || "Some error occurred during create operation" });
            }
        });
    });
};

const findContactById = (id) => {
    return ContactDb.findById(id)
        .then(data => {
            if (!data) {
                throw { message: "Contact not found with id" + id };
            } else {
                return data;
            }
        });
};

const findContacts = async (req) => {
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

        return { contacts, contactsCount };

    } catch (error) {
        console.error(error);
        throw { error: 'Internal server error' };
    }
};

const updateContact = async (req, id) => {
    return new Promise((resolve, reject) => {
        upload(req, {}, async (error) => {
            if (error instanceof multer.MulterError) {
                return reject({ error: "Image upload error" });
            } else if (error) {
                return reject({ error: "Server error" });
            }

            try {
                let avatarPath;
                if (req.file) {
                    avatarPath = path.join('avatars', req.file.filename);
                } else {
                    const contact = await ContactDb.findById(id);
                    if (!contact) {
                        return reject({ error: "Contact not found" });
                    }
                    // Use the existing avatar path
                    avatarPath = contact.avatar;
                }

                const contact = await ContactDb.findById(id);
                if (!contact) {
                    return reject({ error: "Contact not found" });
                }

                const updateData = {
                    ...req.body,
                    // Set the avatar path
                    avatar: avatarPath,
                };

                const updated = await ContactDb.findByIdAndUpdate(id, updateData, { new: true });
                resolve(updated);
            } catch (err) {
                console.error(err);
                reject({ error: "Server error" });
            }
        });
    });
};

const deleteContact = (id) => {
    return ContactDb.findByIdAndDelete(id)
        .then(data => {
            if (!data) {
                throw { message: `Cannot delete contact with id ${id}. Maybe id is wrong` };
            } else {
                return { message: "Contact was deleted successfully" };
            }
        });
};

module.exports = {
    createContact,
    findContactById,
    findContacts,
    updateContact,
    deleteContact,
};
