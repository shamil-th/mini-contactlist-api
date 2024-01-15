const contactService = require('../services/contactServices');

exports.create = (req, res) => {
    contactService.createContact(req)
        .then(data => res.send(data))
        .catch(err => res.status(500).send({ message: err.message || "Some error occurred during create operation" }));
};

exports.findId = (req, res) => {
    const id = req.params.id;
    contactService.findContactById(id)
        .then(data => res.send(data))
        .catch(err => res.status(500).send({ message: "Error retrieving contact with id " + id + ", " + err }));
};

exports.find = async (req, res) => {
    try {
        const result = await contactService.findContacts(req);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.update = (req, res) => {
    const id = req.params.id;
    contactService.updateContact(req, id)
        .then(updated => res.status(200).json(updated))
        .catch(err => res.status(500).json({ error: "Server error" }));
};

exports.delete = (req, res) => {
    const id = req.params.id;
    contactService.deleteContact(id)
        .then(data => res.send(data))
        .catch(err => res.status(500).send({ message: err.message || `Could not delete contact with id ${id}` }));
};
