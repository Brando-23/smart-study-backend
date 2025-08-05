const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { default: axios } = require('axios');
const dotenv = require('dotenv');
dotenv.config();



const app = express();
app.use(cors());
app.use(express.json());
console.log("✅ API KEY:", process.env.OPENAI_API_KEY);


mongoose.connect('mongodb+srv://newuser:smartstudy@cluster0.7pvhq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
.then(()=>{
    console.log('Connected to MongoDB');
})
.catch((err)=>{
    console.log('Error connecting to MongoDB:',err);
})
const taskSchema=new mongoose.Schema({
    task: String,
    description: String,
    dueDate: Date,
    priority: String
})
const Task = mongoose.model('Task', taskSchema);
app.post('/api/tasks',async(req,res)=>{
    try{
        const tasks=new Task({
            task:req.body.taskName,
            description:req.body.taskDescription,
            dueDate:req.body.dueDate,
            priority:req.body.priority
        })
        await tasks.save();
        console.log('Task added successfully:', tasks);
    }
    catch(error)
    {
        console.log('Error adding task:', error);
    }
})
app.get('/api/tasks',async(req,res)=>{
    try{
        const tasks = await Task.find();
        res.json(tasks);
    }
    catch(error){
        console.log('Error fetching tasks:', error);
    
    }
})

const taskcompletedSchema =new mongoose.Schema({
  taskId:String,
  taskName:String,
  description:String,
  duedate:Date,
  priority:String
});
const TaskCompleted = mongoose.model('TaskCompleted', taskcompletedSchema);
app.delete('/api/tasks/:id',async(req,res)=>{
    try{
        const taskId = req.params.id;
        const deltask=await Task.findByIdAndDelete(taskId);
        if(!deltask){
            return res.status(404).json({ message: 'Task not found' });
        }
        console.log('Task deleted successfully:', deltask);
        const completetask=new TaskCompleted({
          taskId:deltask._id,
          taskName:deltask.task,
          description:deltask.description,
          duedate:deltask.dueDate,
          priority:deltask.priority
        });
        await completetask.save();
        res.status(200).json({ message: 'Task save task completed successfully' });

    }
    catch(error)
    {
        console.log('Error deleting task:', error);
    }
})


app.post('/api/openai', async (req, res) => {
  const userMessage = req.body.message;
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: "openai/gpt-3.5-turbo", // Or any supported model
        messages: [{ role: 'user', content: userMessage }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      }
    );

    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error);
    res.status(500).json({ error: 'OpenAI API call failed' });
  }
});




//checking for models of gemini
// async function listModels() {
//   try {
//     const models = await axios.get('https://openrouter.ai/api/v1/models', {
//   headers: {
//     Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
//   }
// });
//     console.log('Available models:', models.data);
//   } catch (error) {
//     console.error('Error fetching models:', error.response?.data || error.message);
//   }
// }

// listModels();

const reviewSchema = new mongoose.Schema({
    topic: String,
    task: String,
    date: Date,
    });
const Review = mongoose.model('Review', reviewSchema);
app.post('/api/review', async (req, res) => {    
    try{
        const review = new Review({
            topic: req.body.topic,
            task: req.body.task,
            date: new Date(req.body.date),
        });
        await review.save();
        console.log('Review added successfully:', review);
        
    }
    catch(error) {
        console.error('Error adding review:', error);
        return res.status(500).json({ error: 'Failed to add review' });
    }
});

app.get('/api/review', async (req, res) => {
    try {
        const reviews = await Review.find();
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
});
const User = mongoose.model('User', userSchema);

app.post('/api/signup', async (req, res) => {
    try{
        const signupUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
        });
        await signupUser.save();
        console.log('User signed up successfully:', signupUser);
    }
    catch(error) {
        console.log('Error signing up user:', error);
    }
});

const loginSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const Login = mongoose.model('Login', loginSchema);

// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    // const { email, password } = req.body;

     const user = new Login({ email: "test@example.com", password: "123456" });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ Login successful – Send dummy token
    return res.status(200).json({ message: "Login successful", token: "dummy-token" });
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).json({ message: "Server error" });
  }
});


//Dashboard route
// Task model assumed as Task
app.get('/api/tasks/count', async (req, res) => {
  try {
    const count = await Task.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching total tasks' });
  }
});
app.get('/api/review/count', async (req, res) => {
  try {
    const count = await Review.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching total Reviews' });
  }
});
// TaskCompleted model assumed as TaskCompleted
app.get('/api/taskcompleted/count',async(req,res)=>{
  try{
    const count=await TaskCompleted.countDocuments();
    res.json({count});
  }
  catch(err) {
    res.status(500).json({ error: 'Error fetching completed tasks' });
  }
});
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
})