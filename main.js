const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// =============================================
// Перед запуском устанавливаем EXPRESS и MULTER!!!
// командой npm install express multer
// =============================================
const DATA_FILE = 'posts.json';
let posts = [];

if (fs.existsSync(DATA_FILE)) {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        posts = JSON.parse(data);
    } catch (err) {
        console.error('Error reading posts file:', err);
    }
}

function savePosts() {
    fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8', (err) => {
        if (err) console.error('Error saving posts:', err);
    });
}

function getAllPosts() {
    return [...posts].reverse();
}

function addPost(post) {
    posts.push(post);
    savePosts();
}

const HTML_HEADER = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Pinterest2002</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style type="text/css">
        body {
            background-color: #f0f0f0;
            font-family: Verdana, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVQImWNgYGD4z0AswK4SAFXuAf8EPy+xAAAAAElFTkSuQmCC');
        }
        #container {
            width: 780px;
            margin: 0 auto;
            background: white;
            border-left: 1px solid #ccc;
            border-right: 1px solid #ccc;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        #header {
            background: #3a6ea5;
            color: white;
            padding: 15px 20px;
            border-bottom: 3px solid #2d4d6e;
        }
        #nav {
            background: #e0e0e0;
            padding: 5px 20px;
            border-bottom: 1px solid #ccc;
        }
        #content {
            padding: 20px;
            min-height: 400px;
        }
        .photo-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        .photo-item {
            width: 180px;
            background: white;
            border: 1px solid #ddd;
            padding: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .photo-item img {
            width: 100%;
            height: auto;
            border: 1px solid #eee;
        }
        .upload-form {
            background: #f9f9f9;
            padding: 15px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
        }
        .button {
            background: #3a6ea5;
            color: white;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
        }
        #footer {
            text-align: center;
            padding: 10px;
            font-size: 11px;
            color: #666;
            border-top: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="header">
            <h1>pinterest2002</h1>
        </div>
        <div id="nav">
            <a href="/">Home</a>
        </div>
        <div id="content">
`;

const HTML_FOOTER = `
        </div>
        <div id="footer">
            &copy; pinterest2002
        </div>
    </div>
    <script type="text/javascript">
        // Simple rollover effect
        document.addEventListener('DOMContentLoaded', function() {
            var images = document.querySelectorAll('.photo-item img');
            images.forEach(function(img) {
                img.addEventListener('mouseover', function() {
                    this.style.borderColor = '#3a6ea5';
                });
                img.addEventListener('mouseout', function() {
                    this.style.borderColor = '#eee';
                });
            });
        });
    </script>
</body>
</html>
`;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync('photos')) {
            fs.mkdirSync('photos');
        }
        cb(null, 'photos/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpe?g|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only images (JPEG, PNG, GIF) are allowed!'));
        }
    }
}).single('photo');

app.use('/photos', express.static('photos'));

app.get('/', (req, res) => {
    let photosHTML = '<div class="photo-grid">';
    
    getAllPosts().forEach(post => {
        photosHTML += `
        <div class="photo-item">
            <img src="/photos/${post.filename}" alt="${post.title}">
            <h3>${post.title}</h3>
            <p>Uploaded: ${new Date(post.timestamp).toLocaleDateString()}</p>
        </div>
        `;
    });
    
    photosHTML += '</div>';
    
    const uploadForm = `
    <div class="upload-form">
        <h2>Upload New Image</h2>
        <form action="/upload" method="post" enctype="multipart/form-data">
            <div>
                <label>Image Title: <input type="text" name="title" required></label>
            </div>
            <div>
                <label>Select Image: <input type="file" name="photo" required></label>
            </div>
            <div>
                <input type="submit" value="Upload" class="button">
            </div>
        </form>
    </div>
    `;
    
    res.send(HTML_HEADER + uploadForm + photosHTML + HTML_FOOTER);
});

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.send(HTML_HEADER + `
                <div style="color:red; padding:20px; background:#ffeeee;">
                    <h2>Upload Error</h2>
                    <p>${err.message}</p>
                    <p><a href="/">Go back</a></p>
                </div>
            ` + HTML_FOOTER);
        }
        
        if (!req.file) {
            return res.send(HTML_HEADER + `
                <div style="color:red; padding:20px; background:#ffeeee;">
                    <h2>Upload Error</h2>
                    <p>No file selected</p>
                    <p><a href="/">Go back</a></p>
                </div>
            ` + HTML_FOOTER);
        }
        
        addPost({
            title: req.body.title || 'Untitled',
            filename: req.file.filename,
            timestamp: Date.now()
        });
        
        res.redirect('/');
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Сайт запущен.');
});
