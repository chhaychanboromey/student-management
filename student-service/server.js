// 2nd microservice - Student service: DELETE student
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4002;
const MONGO_URI = process.env.MONGO_URI;

// ---------- Database schema (same collection as registration) ----------
const studentSchema = new mongoose.Schema(
  {
    Student_id: { type: Number, unique: true, index: true },
    Student_name: { type: String, required: true, trim: true },
    student_mobile: { type: String, required: true, trim: true },
    student_email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    student_password: { type: String, required: true },
  },
  { collection: 'students', versionKey: false }
);
const Student = mongoose.model('Student', studentSchema);

const publicView = (s) => ({
  Student_id: s.Student_id,
  Student_name: s.Student_name,
  student_mobile: s.student_mobile,
  student_email: s.student_email,
});

app.get('/health', (req, res) => res.json({ service: 'student-service', status: 'ok' }));

// ---------- DELETE student by Student_id ----------
app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ Student_id: Number(req.params.id) });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted successfully', student: publicView(student) });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', detail: err.message });
  }
});

// ---------- Start ----------
if (!MONGO_URI) {
  console.error('MONGO_URI is not set');
  process.exit(1);
}
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Student service connected to MongoDB');
    app.listen(PORT, () => console.log(`Student service listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });