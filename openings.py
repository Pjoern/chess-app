import sys
import json
import chess
import chess.engine
import os


def get_openings(fen):
    board = chess.Board(fen)
    openings = []
    book_path = os.path.join(os.path.dirname(__file__), "book.bin")
    try:
        with chess.polyglot.open_reader(book_path) as reader:
            for entry in reader.find_all(board):
                openings.append(entry.move.uci())
            print(f"Found {len(openings)} openings for FEN {fen}", file=sys.stderr)
    except Exception as e:
        print(f"Error reading polyglot book: {e}", file=sys.stderr)
        return []
    return openings


def get_move_scores(fen):
    board = chess.Board(fen)
    engine_path = "C:/Program Files/stockfish/stockfish-windows-x86-64-avx2.exe"  # Change this to the actual path of your Stockfish engine
    scores = []
    try:
        with chess.engine.SimpleEngine.popen_uci(engine_path) as engine:
            for move in board.legal_moves:
                board.push(move)
                info = engine.analyse(board, chess.engine.Limit(time=0.1))
                score = info["score"].relative.score(mate_score=10000)
                scores.append({"move": move.uci(), "score": score})
                board.pop()
            # Sort moves by score in descending order
            scores.sort(key=lambda x: x["score"], reverse=True)
            print(f"Found {len(scores)} move scores for FEN {fen}", file=sys.stderr)
    except Exception as e:
        print(f"Error using Stockfish engine: {e}", file=sys.stderr)
    return scores


if __name__ == "__main__":
    fen = sys.argv[1]
    print(f"Received FEN: {fen}", file=sys.stderr)
    if len(sys.argv) > 2 and sys.argv[2] == "moves":
        move_scores = get_move_scores(fen)
        print(json.dumps(move_scores))
    else:
        openings = get_openings(fen)
        print(json.dumps(openings))
