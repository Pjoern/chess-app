$(document).ready(function () {
  var board = Chessboard('board', {
    draggable: true,
    position: 'start',
    onDrop: handleMove,
  });

  var game = new Chess();
  var history = [];
  var currentMove = -1;
  var savedPositions = [];
  var notes = {};

  function handleMove(source, target) {
    var move = game.move({
      from: source,
      to: target,
      promotion: 'q', // always promote to a queen for simplicity
    });

    if (move === null) return 'snapback'; // illegal move

    history = game.history({ verbose: true });
    currentMove = history.length - 1;
    updateNotation();
    updateOpenings();
    updatePossibleMoves();

    // Update the board position
    console.log('Updating board position to:', game.fen());
    board.position(game.fen(), false); // update the board position without animation

    return undefined; // indicate that the move is done
  }

  function updateNotation() {
    var notation = history
      .map(function (move, index) {
        return (index % 2 === 0 ? Math.floor(index / 2) + 1 + '. ' : ' ') + move.san;
      })
      .join(' ');
    $('#notation').html(notation);
  }

  function updateOpenings() {
    var fen = game.fen();
    fetch('/get_openings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fen: fen }),
    })
      .then((response) => response.json())
      .then((data) => {
        $('#openings').html('<strong>Openings:</strong> ' + data.openings.join(', '));
      })
      .catch((error) => console.error('Error fetching openings:', error)); // Fehlerbehandlung hinzufügen
  }

  function updatePossibleMoves() {
    var fen = game.fen();
    fetch('/get_move_scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fen: fen }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Move scores:', data); // Debugging-Ausgabe hinzufügen
        if (!data.moveScores) {
          throw new Error('moveScores is undefined');
        }

        // Sort the moves by score in ascending order (best moves first) and limit to top 5
        var topMoves = data.moveScores.sort((a, b) => a.score - b.score).slice(0, 5);

        // Get the current move number
        var nextMoveNumber = Math.floor(history.length / 2) + 1;

        var movesList = topMoves
          .map(function (move) {
            var targetSquare = move.move.slice(-2); // get only the target square
            var moveNumber =
              history.length % 2 === 0 ? nextMoveNumber + '. ' : nextMoveNumber + '... ';
            return `<li>${moveNumber}${targetSquare}: ${move.score}</li>`;
          })
          .join('');
        $('#moves-list').html(`<ul>${movesList}</ul>`);
      })
      .catch((error) => console.error('Error fetching move scores:', error)); // Fehlerbehandlung hinzufügen
  }

  $('#prevBtn').on('click', function () {
    if (currentMove > 0) {
      currentMove--;
      game.undo();
      board.position(game.fen(), false); // update the board position without animation
      updateNotation();
      updatePossibleMoves();
    }
  });

  $('#nextBtn').on('click', function () {
    if (currentMove < history.length - 1) {
      currentMove++;
      game.move(history[currentMove]);
      board.position(game.fen(), false); // update the board position without animation
      updateNotation();
      updatePossibleMoves();
    }
  });

  $('#resetBtn').on('click', function () {
    game.reset();
    history = [];
    currentMove = -1;
    board.position('start', false); // reset the board to the start position without animation
    $('#notation').html('');
    $('#openings').html('');
    $('#moves-list').html('');
  });

  $('#savePositionBtn').on('click', function () {
    var fen = game.fen();
    savedPositions.push(fen);
    updateSavedPositions();
  });

  function updateSavedPositions() {
    var positionsList = savedPositions
      .map(function (fen, index) {
        return `<li data-index="${index}">${fen}</li>`;
      })
      .join('');
    $('#positions-list').html(`<ul>${positionsList}</ul>`);
  }

  $('#positions-list').on('click', 'li', function () {
    var index = $(this).data('index');
    var fen = savedPositions[index];
    game.load(fen);
    board.position(fen, false);
    updateNotation();
    updatePossibleMoves();
    updateNotes(index);
  });

  $('#saveNotesBtn').on('click', function () {
    var index = $('#positions-list li.selected').data('index');
    var note = $('#notes').val();
    if (!notes[index]) {
      notes[index] = [];
    }
    notes[index].push(note);
    updateNotes(index);
  });

  function updateNotes(index) {
    var notesList = notes[index] ? notes[index].join('<br>') : 'No notes yet.';
    $('#notes-list').html(notesList);
  }

  // Initial possible moves update
  updatePossibleMoves();
});
