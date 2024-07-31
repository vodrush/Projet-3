const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const imagesDir = path.join(__dirname, '../FrontEnd/assets/images/Projets');
let imageFiles = [];

// Configuration de multer pour enregistrer les fichiers téléchargés
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, imagesDir); // Répertoire où enregistrer les fichiers
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Fonction pour mettre à jour la liste des images
const updateImageList = () => {
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            console.error('Erreur lors de la lecture du dossier "images" :', err);
            return;
        }
        imageFiles = files.filter(file => {
            return file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.gif');
        });
        console.log('Liste des images mise à jour:', imageFiles);
    });
};

// Mettre à jour immédiatement lors du démarrage
updateImageList();

app.use('/images', express.static(imagesDir));
app.use('/assets', express.static(path.join(__dirname, '../FrontEnd/assets')));
app.get('/imageNames', (req, res) => {
    res.json({ imageNames: imageFiles });
});

// Nouvelle route pour mettre à jour la liste des images
app.get('/updateImageList', (req, res) => {
    updateImageList();
    res.json({ message: 'Liste images mis a jour' });
});

app.delete('/deleteImage', (req, res) => {
    const imageName = req.body.imageName;
    const imagePath = path.join(imagesDir, imageName);

    fs.unlink(imagePath, (err) => {
        if (err) {
            console.error('Erreur lors de la suppression de l\'image :', err);
            return res.status(500).send('Erreur lors de la suppression de l\'image');
        }

        updateImageList(); // Mettre à jour la liste des images après suppression
        res.send('Image supprimée avec succès');
    });
});

// Route pour télécharger une image
app.post('/uploadImage', upload.single('photoFile'), (req, res) => {
    const { photoTitle, photoCategory } = req.body;
    const originalFileName = req.file.filename;
    const fileExtension = path.extname(req.file.originalname);

    // Corriger la catégorie pour "hotelsrestaurants"
    let cleanCategory = photoCategory.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');
    if (cleanCategory === 'hotelsrestaurant') {
        cleanCategory = 'hotelsrestaurants';
    }

    console.log('Titre:', photoTitle);  // Le titre est utilisé tel quel
    console.log('Catégorie nettoyée :', cleanCategory);

    // Lire le contenu du répertoire pour obtenir la liste des fichiers
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            console.error('Erreur lors de la lecture du répertoire :', err);
            return res.status(500).send('Erreur lors de la lecture du répertoire');
        }

        // Calculer le nouveau nom de fichier
        const maxNumber = files.reduce((max, file) => {
            const match = file.match(/^(\d+)-/);
            if (match) {
                const number = parseInt(match[1], 10);
                return number > max ? number : max;
            }
            return max;
        }, 0);

        const newFileName = `${maxNumber + 1}-${cleanCategory}-${photoTitle}${fileExtension}`;
        const newPath = path.join(imagesDir, newFileName);

        console.log('Nom de fichier d\'origine :', originalFileName);
        console.log('Nouveau nom de fichier :', newFileName);

        // Renommer le fichier
        fs.rename(path.join(imagesDir, originalFileName), newPath, (err) => {
            if (err) {
                console.error('Erreur lors du renommage du fichier :', err);
                return res.status(500).send('Erreur lors du renommage du fichier');
            }

            res.send('Image uploadée et renommée avec succès');
        });
    });
});

const normalizePort = val => {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
};

const port = normalizePort(process.env.PORT || '5678');
app.set('port', port);

const errorHandler = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges.');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use.');
            process.exit(1);
            break;
        default:
            throw error;
    }
};

const server = http.createServer(app);

server.on('error', errorHandler);
server.on('listening', () => {
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
    console.log('Listening on ' + bind);
});

server.listen(port);
