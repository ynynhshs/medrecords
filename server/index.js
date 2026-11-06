require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'medilink_lab_dev';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { dbName: DB_NAME })
  .then(() => console.log(`Connected to MongoDB database: ${DB_NAME}`))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// --- MODELS ---
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  role: { type: String, enum: ['Admin', 'Doctor', 'Nurse', 'Staff'] },
  active: { type: Boolean, default: true }
}, { collection: 'emr_users' });

const PatientSchema = new mongoose.Schema({
  name: String, sex: String, birth: String, contact: String, address: String, blood: String
}, { collection: 'emr_patients' });

const RecordSchema = new mongoose.Schema({
  patientId: String, date: String, diagnosis: String, treatment: String, notes: String
}, { collection: 'emr_records' });

const AppointmentSchema = new mongoose.Schema({
  patientId: String, date: String, time: String, doctor: String, reason: String, status: String
}, { collection: 'emr_appointments' });

const ServiceSchema = new mongoose.Schema({
  patientId: String, date: String, type: String, details: String, by: String
}, { collection: 'emr_services' });

const PrescriptionSchema = new mongoose.Schema({
  patientId: String, date: String, medicine: String, dosage: String, instructions: String
}, { collection: 'emr_prescriptions' });

const User = mongoose.model('User', UserSchema);
const Patient = mongoose.model('Patient', PatientSchema);
const Record = mongoose.model('Record', RecordSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);
const Service = mongoose.model('Service', ServiceSchema);
const Prescription = mongoose.model('Prescription', PrescriptionSchema);

// --- AUTO-SEED ADMIN ---
async function seedAdmin() {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        name: 'System Admin',
        role: 'Admin',
        active: true
      });
      console.log('✅ Default Admin user created (admin / admin123)');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
}
seedAdmin();

// --- API ROUTES ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password, active: true });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getModel(table) {
  const models = { 
    users: User, 
    patients: Patient, 
    records: Record, 
    appointments: Appointment, 
    services: Service, 
    prescriptions: Prescription 
  };
  return models[table];
}

app.get('/api/:table', async (req, res) => {
  try {
    const model = getModel(req.params.table);
    if (!model) return res.status(404).json({ error: 'Table not found' });
    const data = await model.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/:table', async (req, res) => {
  try {
    const model = getModel(req.params.table);
    if (!model) return res.status(404).json({ error: 'Table not found' });
    const newItem = new model(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/:table/:id', async (req, res) => {
  try {
    const model = getModel(req.params.table);
    if (!model) return res.status(404).json({ error: 'Table not found' });
    const updated = await model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/:table/:id', async (req, res) => {
  try {
    const model = getModel(req.params.table);
    if (!model) return res.status(404).json({ error: 'Table not found' });
    await model.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// --- SERVE FRONTEND ---
// TanStack Start outputs to .output/public, standard Vite outputs to dist.
const possiblePaths = [
  path.join(__dirname, '../.output/public'),
  path.join(__dirname, '../dist')
];

let distPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(path.join(p, 'index.html'))) {
    distPath = p;
    break;
  }
}

if (distPath) {
  console.log(`✅ Found React build at: ${distPath}`);
  app.use(express.static(distPath));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('❌ Could not find index.html.');
  app.get('/{*splat}', (req, res) => {
    res.status(404).send('Frontend not built.');
  });
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`EMR Backend is running on port ${PORT}`);
});