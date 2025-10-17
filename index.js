import express from 'express';
import { Pool } from 'pg';
import flash from 'express-flash';
import session from 'express-session';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import hbs from "hbs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;

// koneksi database
const db = new Pool ({
  user: 'postgres',
  password: 'kerjahalal',
  host: 'localhost',
  port: 5432,
  database: 'final-task-stage-1-b63',
  max: 20,
});

// upload gambar
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './src/assets/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// kumpulan routing
app.set('view engine', 'hbs');
app.set('views', 'src/views');
app.set("views", path.join(__dirname, "src", "views"));

hbs.registerHelper("splitLines", function (text) {
  if (!text) return [];
  return text.split("\n");
});

app.use('/assets', express.static('src/assets/'))
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: 'kunciRahasia',
  resave: false,
  saveUninitialized: true
}));
app.use(flash());

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});

app.get('/keproject', keproject)
app.get('/ke_exp', ke_exp)
app.get('/login', login);
app.post('/login', handleLogin);
app.get('/logout', logout);
app.get('/home', home);
app.get('/project', project);
app.post('/project', upload.single('upload_img'), handleProject);
app.get('/experiences', experiences)
app.post('/experiences', upload.single('logo_perus'), handleExperiences)

// halaman login
function login(req, res) {

  res.render('login_index', { message: req.flash('error') });

};

async function handleLogin(req, res) {

  let { login_name, login_password } = req.body;

  const terdaftar = await db.query(`SELECT * FROM users WHERE name='${login_name}'`);

  if(login_password === terdaftar.rows[0].password) {

    req.session.user = {
    name : terdaftar.rows[0].name,
    };
    res.redirect('/project');

  } else {

    req.flash('error', 'Password anda salah');
    return res.redirect('/login');

  };
  
};

function logout(req, res) {

  req.session.destroy();
  res.redirect('/home');

};

// halaman utama

async function home(req, res) {

  const selectE = `SELECT * FROM experiences ORDER BY id DESC`;
  const resultE = await db.query(selectE);

  const selectP = `SELECT * FROM projects ORDER BY id DESC`;
  const resultP = await db.query(selectP);

  let profile;
  let afterLogin;
  let beforeLogin;

  if(req.session.user) {

    profile = 'profile.jpg'
    afterLogin = 'Sign out';

  } else {
    
    profile = 'profile.jpg'
    beforeLogin = 'Login';

  };
  
  res.render('index', { resultP, resultE, afterLogin, beforeLogin, profile} );
};

async function project(req, res) {

  let userSession;
  let afterLogin;
  let beforeLogin;

  if(req.session.user) {

    userSession = { 
      name: req.session.user.name, 
     };
    afterLogin = 'Sign out';

  } else {
    
    userSession = { name: 'Anonim' };
    beforeLogin = 'Login';

  };

  res.render('add_project_index', { userSession, afterLogin, beforeLogin });
};

async function handleProject(req, res) {
    
  let { project_name, upload_img, techproject, desc_project } = req.body;

  const techFilter = Array.isArray(techproject) ? techproject : [techproject];

  const insert = `INSERT INTO projects(img_project, project_name, deskripsi, tech_project) VALUES ($1, $2, $3, $4)`;
  const resultI = await db.query(insert, [req.file.filename, project_name, desc_project, techFilter]); 

  res.redirect('/home')

};

async function experiences(req, res) {

  let userSession;
  let afterLogin;
  let beforeLogin;

  if(req.session.user) {

    userSession = { 
      name: req.session.user.name, 
     };
    afterLogin = 'Sign out';

  } else {
    
    userSession = { name: 'Anonim' };
    beforeLogin = 'Login';

  };

  res.render('add_exp_index', { userSession, afterLogin, beforeLogin });
};

async function handleExperiences(req, res) {

  let { pekerjaan, perusahaan, logo_perus, s_date, e_date, techexp, desc_exp} = req.body;

  const techFilter = Array.isArray(techexp) ? techexp : [techexp];

  const insert = `INSERT INTO experiences(pekerjaan, perusahaan, logo_perusahaan, start_date, end_date, tech_stack, deskripsi) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
  const resultI = await db.query(insert, [pekerjaan, perusahaan, req.file.filename, s_date, e_date, techFilter, desc_exp]); 

  res.redirect('/home')

};

async function keproject(req, res) {

  if(req.session.user) {

    res.redirect('/project');

  } else {

    res.redirect('/login');

  };

};

async function ke_exp(req, res) {

  if(req.session.user) {

    res.redirect('/experiences');

  } else {

    res.redirect('/login');

  };

};


