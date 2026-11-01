const mongoose = require('mongoose');

const EventSchema = mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: Date,
    mode: { type: String, default: 'Online' }, // venue / platform label, e.g. "GMEET", "BIT Campus"
    link: String, // registration / details link
    image: { public_id: String, url: String },
    featured: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
}, { toJSON: { virtuals: true } });

// Events without an end date are treated as lasting 3 hours.
EventSchema.virtual('status').get(function () {
    const now = Date.now();
    const start = this.startDate?.getTime();
    const end = this.endDate ? this.endDate.getTime() : start + 3 * 60 * 60 * 1000;
    if (now < start) return 'upcoming';
    if (now <= end) return 'live';
    return 'past';
});

module.exports = mongoose.model('Event', EventSchema);
