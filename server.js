const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/get_openings', (req, res) => {
  const fen = req.body.fen;
  console.log(`Received FEN for openings: ${fen}`); // Debugging-Ausgabe hinzufügen
  exec(`python openings.py "${fen}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error (get_openings): ${error}`);
      console.error(stderr);
      return res.status(500).json({ error: 'Server error' });
    }
    try {
      console.log('Output (get_openings):', stdout); // Debugging-Ausgabe hinzufügen
      const openings = JSON.parse(stdout);
      res.json({ openings: openings });
    } catch (e) {
      console.error('JSON parse error (get_openings):', e);
      console.error('Output:', stdout);
      return res.status(500).json({ error: 'JSON parse error' });
    }
  });
});

app.post('/get_move_scores', (req, res) => {
  const fen = req.body.fen;
  console.log(`Received FEN for move scores: ${fen}`); // Debugging-Ausgabe hinzufügen
  exec(`python openings.py "${fen}" moves`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error (get_move_scores): ${error}`);
      console.error(stderr);
      return res.status(500).json({ error: 'Server error' });
    }
    try {
      console.log('Output (get_move_scores):', stdout); // Debugging-Ausgabe hinzufügen
      const moveScores = JSON.parse(stdout);
      res.json({ moveScores: moveScores });
    } catch (e) {
      console.error('JSON parse error (get_move_scores):', e);
      console.error('Output:', stdout);
      return res.status(500).json({ error: 'JSON parse error' });
    }
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
