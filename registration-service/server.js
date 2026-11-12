// Registration microservice - POST /api/register
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4001;
const MONGO_URI = process.env.MONGO_URI;

// ---------- Database schema ----------
const studentSchema = new mongoose.Schema(
  {
    Student_id: { type: Number, unique: true, index: true },
    Student_name: { type: String, required: true, trim: true },
    student_mobile: { type: String, required: true, trim: true },
    student_email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    student_password: { type: String, required: true }, // stored hashed
  },
  { collection: 'students', versionKey: false }
);
const Student = mongoose.model('Student', studentSchema);

// Auto-increment counter for Student_id
const Counter = mongoose.model(
  'Counter',
  new mongoose.Schema({ _id: String, seq: Number }, { collection: 'counters', versionKey: false })
);
async function nextStudentId() {
  const c = await Counter.findByIdAndUpdate(
    'student_id',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return c.seq;
}

// ---------- Routes ----------
app.get('/health', (req, res) => res.json({ service: 'registration-service', status: 'ok' }));

app.post('/api/register', async (req, res) => {
  try {
    const { Student_name, student_mobile, student_email, student_password } = req.body || {};
    if (!Student_name || !student_mobile || !student_email || !student_password) {
      return res.status(400).json({
        error: 'Student_name, student_mobile, student_email and student_password are required',
      });
    }

    const exists = await Student.findOne({ student_email: student_email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: 'A student with this email already exists' });

    const hashed = await bcrypt.hash(student_password, 10);
    const student = await Student.create({
      Student_id: await nextStudentId(),
      Student_name,
      student_mobile,
      student_email,
      student_password: hashed,
    });

    res.status(201).json({
      message: 'Student registered successfully',
      student: {
        Student_id: student.Student_id,
        Student_name: student.Student_name,
        student_mobile: student.student_mobile,
        student_email: student.student_email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', detail: err.message });
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
    console.log('Registration service connected to MongoDB');
    app.listen(PORT, () => console.log(`Registration service listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
