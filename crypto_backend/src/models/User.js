const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    wallet_address: { type: String, required: true, unique: true, lowercase: true },
    is_active: { type: Boolean, default: true },
    is_staff: { type: Boolean, default: false },
    date_joined: { type: Date, default: Date.now },
    password: { type: String } // Optional for wallet-only login
});

// You can add methods similar to Django's
userSchema.methods.has_perm = function() {
    return this.is_staff;
};

userSchema.methods.has_module_perms = function() {
    return this.is_staff;
};

module.exports = mongoose.model('User', userSchema);
