import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // MongoDB Connection
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
      .then(() => console.log('✅ MongoDB Connected'))
      .catch(err => console.error('❌ MongoDB Connection Error:', err));
  } else {
    console.warn('⚠️ MONGODB_URI not found. Running in offline mode.');
  }

  // Schemas & Models
  const bookingSchema = new mongoose.Schema({
    service: String,
    category: String,
    date: Date,
    status: { type: String, default: 'Pending' },
    userId: String,
    price: Number,
    workerId: String,
    workerName: { type: String, default: 'Professional' },
    rating: { type: Number, default: 0 },
    cancellationReason: { type: String, default: '' },
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
  }, { timestamps: true });

  const jobApplicationSchema = new mongoose.Schema({
    name: String,
    email: String,
    service: String,
    experience: String,
    status: { type: String, default: 'Applied' },
    serviceArea: String,
    baseCoordinates: {
      lat: Number,
      lng: Number
    },
  }, { timestamps: true });

  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }
  }, { timestamps: true });

  const workerSchema = new mongoose.Schema({
    name: String,
    status: { type: String, default: 'Active' },
    coordinates: {
      lat: Number,
      lng: Number
    },
    service: String,
  }, { timestamps: true });

  let Booking: any = mongoose.model('Booking', bookingSchema);
  let JobApplication: any = mongoose.model('JobApplication', jobApplicationSchema);
  let User: any = mongoose.model('User', userSchema);
  let Worker: any = mongoose.model('Worker', workerSchema);

  // In-Memory Fallback Storage
  const memDb = {
    bookings: [] as any[],
    applications: [] as any[],
    users: [] as any[],
    workers: [
      { _id: 'w_init_1', name: 'Original Specialist', service: 'Salon for Women', coordinates: { lat: 19.0760, lng: 72.8777 }, status: 'Active' }
    ] as any[]
  };

  const isOffline = !MONGODB_URI;

  app.use(express.json());

  // API Routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      let user;

      if (isOffline) {
        user = memDb.users.find(u => u.email === email);
        if (user) return res.status(400).json({ error: 'User already exists' });
        const hashedPassword = await bcrypt.hash(password, 10);
        user = { _id: Date.now().toString(), name, email, password: hashedPassword };
        memDb.users.push(user);
      } else {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword });
        await user.save();
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret');
      res.status(201).json({ user: { id: user._id, name: user.name, email: user.email }, token });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      let user;

      if (isOffline) {
        user = memDb.users.find(u => u.email === email);
      } else {
        user = await User.findOne({ email });
      }

      if (!user) return res.status(400).json({ error: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret');
      res.json({ user: { id: user._id, name: user.name, email: user.email }, token });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/debug/state', (req, res) => {
    if (isOffline) {
      res.json({
        isOffline,
        bookingCount: memDb.bookings.length,
        bookings: memDb.bookings,
        workerCount: memDb.workers.length
      });
    } else {
      res.json({ isOffline, message: 'Running in online mode' });
    }
  });

  app.get('/api/bookings', async (req, res) => {
    try {
      let bookings;
      if (isOffline) {
        console.log(`Fetching ${memDb.bookings.length} bookings from memory`);
        bookings = [...memDb.bookings].sort((a: any, b: any) => {
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
          return bTime - aTime;
        });
      } else {
        bookings = await Booking.find().sort({ createdAt: -1 });
      }
      res.json(bookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/bookings', async (req, res) => {
    try {
      let booking;
      if (isOffline) {
        booking = { ...req.body, _id: Date.now().toString(), status: 'Pending', createdAt: new Date() };
        memDb.bookings.push(booking);
      } else {
        booking = new Booking(req.body);
        await booking.save();
      }
      res.status(201).json(booking);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch('/api/bookings/:id/rate', async (req, res) => {
    try {
      const { rating } = req.body;
      let booking;
      if (isOffline) {
        booking = memDb.bookings.find(b => b._id === req.params.id);
        if (booking) booking.rating = rating;
      } else {
        booking = await Booking.findByIdAndUpdate(req.params.id, { rating }, { new: true });
      }
      res.json(booking);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch('/api/bookings/:id/cancel', async (req, res) => {
    try {
      console.log(`Attempting to cancel booking: ${req.params.id}`);
      const { reason } = req.body;
      let booking;

      if (isOffline) {
        console.log(`Searching for booking ID in memDb: ${req.params.id}`);
        console.log(`Available IDs: ${memDb.bookings.map(b => b._id).join(', ')}`);
        booking = memDb.bookings.find(b => b._id === req.params.id);
        if (!booking) {
          console.error(`Booking NOT found in memory list for ID: ${req.params.id}`);
          return res.status(404).json({ error: 'Booking not found in simulation database' });
        }
        booking.status = 'Cancelled';
        booking.cancellationReason = reason || 'No reason provided';
      } else {
        booking = await Booking.findById(req.params.id);
        if (!booking) {
          console.error(`Booking not found in DB: ${req.params.id}`);
          return res.status(404).json({ error: 'Booking not found' });
        }
        booking.status = 'Cancelled';
        booking.cancellationReason = reason || 'No reason provided';
        await booking.save();
      }
      
      console.log(`Booking cancelled successfully: ${req.params.id}`);
      res.json(booking);
    } catch (err) {
      console.error(`Error cancelling booking ${req.params.id}:`, err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/apply', async (req, res) => {
    try {
      let application;
      if (isOffline) {
        application = { ...req.body, _id: Date.now().toString(), status: 'Applied', createdAt: new Date() };
        memDb.applications.push(application);
      } else {
        application = new JobApplication(req.body);
        await application.save();
      }
      res.status(201).json(application);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Worker Management Routes
  app.get('/api/workers', async (req, res) => {
    try {
      let workers;
      if (isOffline) {
        workers = memDb.workers;
      } else {
        workers = await Worker.find();
      }
      res.json(workers);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/workers', async (req, res) => {
    try {
      let worker;
      if (isOffline) {
        worker = { ...req.body, _id: Date.now().toString(), createdAt: new Date() };
        memDb.workers.push(worker);
      } else {
        worker = new Worker(req.body);
        await worker.save();
      }
      res.status(201).json(worker);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/workers/:id', async (req, res) => {
    try {
      if (isOffline) {
        memDb.workers = memDb.workers.filter((w: any) => w._id !== req.params.id);
      } else {
        await Worker.findByIdAndDelete(req.params.id);
      }
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Socket.io for Real-time Worker Tracking
  io.on('connection', (socket) => {
    console.log('Worker/User connected:', socket.id);

    // Simulate worker movement for demo
    const simulateWorker = async (roomId: string) => {
      let lat = 19.0760;
      let lng = 72.8777;
      let name = "Dynamic Specialist";

      // Try to find a real worker for this specific booking's service
      try {
        let booking;
        if (isOffline) {
          booking = memDb.bookings.find(b => b._id === roomId);
        } else {
          booking = await Booking.findById(roomId);
        }

        if (booking) {
          const bookedService = booking.service;
          let workers;
          if (isOffline) {
            workers = memDb.workers.filter((w: any) => w.service === bookedService);
          } else {
            workers = await Worker.find({ service: bookedService });
          }
          
          if (workers && workers.length > 0) {
            // Pick a random worker from available ones for this service
            const w = workers[Math.floor(Math.random() * workers.length)];
            lat = w.coordinates.lat;
            lng = w.coordinates.lng;
            name = w.name;
          } else {
            name = `Expert in ${bookedService}`;
          }
        }
      } catch (e) {
        console.error("Simulation retrieval failed", e);
      }

      const interval = setInterval(() => {
        lat += (Math.random() - 0.5) * 0.0005;
        lng += (Math.random() - 0.5) * 0.0005;
        io.to(roomId).emit('worker:location', { lat, lng, name });
      }, 3000);

      socket.on('disconnect', () => clearInterval(interval));
    };

    socket.on('join:room', (roomId) => {
      socket.join(roomId);
      simulateWorker(roomId);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
