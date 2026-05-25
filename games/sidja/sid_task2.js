// task_seega_piece_A.js
// Задача: "Сколько вариантов ходов с рубкой есть у красной фишки, обозначенной буквой А?" (Сиджа 7×7)
(() => {
    // ---------- 1. Параметры поля и координаты (7x7) – копируем из примера ----------
	const BOARD_SIZE = 3426;
	const GRID_SIZE = 2486; // размер внутренней зоны с клетками
	const GRID_OFFSET_X = (BOARD_SIZE - GRID_SIZE) / 2; // 470
	const GRID_OFFSET_Y = (BOARD_SIZE - GRID_SIZE) / 2; // 470

	const CELL_SIZE = GRID_SIZE / 7; // 355.14285714285717

	const start_x = GRID_OFFSET_X + CELL_SIZE / 2;
	const start_y = GRID_OFFSET_Y + CELL_SIZE / 2;

	const dx = CELL_SIZE;
	const dy = CELL_SIZE;

	// при необходимости можно потом слегка подвинуть вручную
	const SHIFT_X = 0;
	const SHIFT_Y = 0;

	const originalCenters = {};
	for (let row = 1; row <= 7; row++) {
		for (let col = 1; col <= 7; col++) {
			const cell = (row - 1) * 7 + col;
			const x = start_x + (col - 1) * dx + SHIFT_X;
			const y = start_y + (row - 1) * dy + SHIFT_Y;
			originalCenters[cell] = { x, y };
		}
	}

    // ---------- 2. Вспомогательные функции ----------
    function rcToNum(r, c) {
        return (r - 1) * 7 + c;
    }

    function numToRc(num) {
        const row = Math.floor((num - 1) / 7) + 1;
        const col = (num - 1) % 7 + 1;
        return { row, col };
    }

    // 8 направлений
    const DIRS = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];

    // Подсчёт срубленных фишек для хода (центр не прерывает, но сам не снимается)
    function countCapturesForMove(pos, fromCell, toCell, player) {
        if (toCell in pos) return { count: 0, captured: [] };

        const newPos = { ...pos };
        const color = newPos[fromCell];

        delete newPos[fromCell];

        newPos[toCell] = color;

        const { row: r, col: c } = numToRc(toCell);
        const capturedSet = new Set();

        for (const [dr, dc] of DIRS) {
            let step = 1;

            while (true) {
                const nr = r + dr * step;
                const nc = c + dc * step;

                if (nr < 1 || nr > 7 || nc < 1 || nc > 7) break;

                const ncell = rcToNum(nr, nc);

                if (ncell in newPos) {
                    if (newPos[ncell] === color) {
                        let allOpponent = true;

                        for (let k = 1; k < step; k++) {
                            const kr = r + dr * k;
                            const kc = c + dc * k;
                            const kcell = rcToNum(kr, kc);

                            if (kcell === 25) continue; // центр не снимается, но линия продолжается

                            const piece = newPos[kcell];

                            if (piece !== (color === 'red' ? 'yellow' : 'red')) {
                                allOpponent = false;
                                break;
                            }
                        }

                        if (allOpponent) {
                            for (let k = 1; k < step; k++) {
                                const kr = r + dr * k;
                                const kc = c + dc * k;
                                const kcell = rcToNum(kr, kc);

                                if (kcell !== 25) capturedSet.add(kcell);
                            }
                        }

                        break;
                    } else {
                        step++;
                        continue;
                    }
                } else {
                    break;
                }

                step++;
            }
        }

        return {
            count: capturedSet.size,
            captured: Array.from(capturedSet)
        };
    }

    // Получение всех рубящих ходов для фишки
    function getCapturingMovesForPiece(pos, cell, player) {
        const moves = [];
        const { row: r, col: c } = numToRc(cell);

        for (const [dr, dc] of DIRS) {
            const nr = r + dr;
            const nc = c + dc;

            if (nr >= 1 && nr <= 7 && nc >= 1 && nc <= 7) {
                const toCell = rcToNum(nr, nc);

                if (!(toCell in pos)) {
                    const { count } = countCapturesForMove(pos, cell, toCell, player);

                    if (count > 0) moves.push(toCell);
                }
            }
        }

        return moves;
    }

    function getCapturingMoveDetailsForPiece(pos, cell, player) {
        const details = [];
        const moves = getCapturingMovesForPiece(pos, cell, player);

        for (const toCell of moves) {
            const result = countCapturesForMove(pos, cell, toCell, player);
            const captured = result.captured.slice().sort((a, b) => a - b);

            if (captured.length > 0) {
                details.push({
                    to: toCell,
                    captured: captured
                });
            }
        }

        return details;
    }

    // ---------- 3. Генерация позиции (плотная, случайная) ----------
    function randomPosition(total) {
        const allCells = [...Array(49).keys()].map(i => i + 1);

        for (let i = allCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
        }

        const selected = allCells.slice(0, total);
        const redCount = Math.floor(total / 2);
        const yellowCount = total - redCount;
        const colors = [...Array(redCount).fill('red'), ...Array(yellowCount).fill('yellow')];

        for (let i = colors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [colors[i], colors[j]] = [colors[j], colors[i]];
        }

        const pos = {};

        for (let i = 0; i < selected.length; i++) {
            pos[selected[i]] = colors[i];
        }

        return pos;
    }

    function generateRichPosition() {
        const total = Math.floor(Math.random() * 5) + 20; // 20-24
        let pos = randomPosition(total);

        for (let attempt = 0; attempt < 5; attempt++) {
            const redCells = Object.keys(pos).filter(cell => pos[cell] === 'red').map(Number);

            if (redCells.length === 0) break;

            const fromCell = redCells[Math.floor(Math.random() * redCells.length)];
            const { row: r1, col: c1 } = numToRc(fromCell);

            for (const [dr, dc] of DIRS) {
                for (let step = 3; step <= 6; step++) {
                    const r2 = r1 + dr * step;
                    const c2 = c1 + dc * step;

                    if (r2 < 1 || r2 > 7 || c2 < 1 || c2 > 7) continue;

                    const toCell = rcToNum(r2, c2);

                    if (pos[toCell] === 'red') {
                        for (let k = 1; k < step; k++) {
                            const kr = r1 + dr * k;
                            const kc = c1 + dc * k;
                            const kcell = rcToNum(kr, kc);

                            if (kcell !== 25) pos[kcell] = 'yellow';
                        }

                        break;
                    }
                }
            }
        }

        return pos;
    }

    function getAnyRedPieceWithCapturingMoves(pos) {
        const redCells = Object.keys(pos)
            .filter(cell => pos[cell] === 'red')
            .map(Number);

        for (let i = redCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [redCells[i], redCells[j]] = [redCells[j], redCells[i]];
        }

        for (const candidate of redCells) {
            const moves = getCapturingMovesForPiece(pos, candidate, 'red');

            if (moves.length > 0) {
                return {
                    chosenCell: candidate,
                    moves: moves
                };
            }
        }

        return null;
    }

    function getSafeFallbackPositionWithCapture() {
        return {
            16: 'red',
            18: 'yellow',
            19: 'red',
            31: 'yellow',
            32: 'red',
            38: 'yellow',
            39: 'red'
        };
    }

    // Функция для получения позиции, где у некоторой красной фишки количество рубящих ходов равно target
    function generatePositionWithTargetMoves(target, maxAttempts = 300) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let pos;

            if (Math.random() < 0.8) {
                pos = generateRichPosition();
            } else {
                pos = randomPosition(Math.floor(Math.random() * 5) + 20);
            }

            const redCells = Object.keys(pos).filter(cell => pos[cell] === 'red').map(Number);

            // Перемешиваем, чтобы разнообразить
            for (let i = redCells.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));

                [redCells[i], redCells[j]] = [redCells[j], redCells[i]];
            }

            for (const candidate of redCells) {
                const moves = getCapturingMovesForPiece(pos, candidate, 'red');

                if (moves.length === target && moves.length > 0) {
                    return { pos, chosenCell: candidate, moves };
                }
            }
        }

        // Резервный поиск: если точный target не найден, ищем любую красную фишку с рубкой
        for (let attempt = 0; attempt < 500; attempt++) {
            let pos;

            if (Math.random() < 0.8) {
                pos = generateRichPosition();
            } else {
                pos = randomPosition(Math.floor(Math.random() * 5) + 20);
            }

            const found = getAnyRedPieceWithCapturingMoves(pos);

            if (found && found.moves.length > 0) {
                return {
                    pos: pos,
                    chosenCell: found.chosenCell,
                    moves: found.moves
                };
            }
        }

        // Жёсткий безопасный fallback: фишка 16 имеет ход с рубкой на 17
        const pos = getSafeFallbackPositionWithCapture();
        const chosenCell = 16;
        const moves = getCapturingMovesForPiece(pos, chosenCell, 'red');

        return { pos, chosenCell, moves };
    }

    // ---------- 4. Отрисовка чёрной буквы А на выбранной фишке ----------
    function drawGreenNumbers(ctx, originalCenters, numbers, pieceSize) {
        if (!ctx || !originalCenters || !numbers) return;

        ctx.save();

        ctx.font = `bold ${Math.floor(pieceSize * 0.42)}px "Inter", system-ui, sans-serif`;
        ctx.shadowBlur = 0;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';

        for (const cs in numbers) {
            const orig = originalCenters[parseInt(cs, 10)];

            if (!orig) continue;

            ctx.fillText(String(numbers[cs]), orig.x, orig.y);
        }

        ctx.restore();
    }

    // ---------- 5. Форматирование пояснений ----------
    function formatCellList(cells) {
        return cells.slice().sort((a, b) => a - b).join(', ');
    }

    function formatMoveExplanation(move) {
        const cellsText = formatCellList(move.captured);

        if (move.captured.length === 1) {
            return `На позиции ${move.to} фишка А зажимает жёлтую фишку на клетке ${cellsText}`;
        }

        return `На позиции ${move.to} фишка А зажимает жёлтые фишки на клетках ${cellsText}`;
    }

    function makeExplanation(moveDetails) {
        if (!moveDetails || !moveDetails.length) {
            return 'У фишки А нет ходов с рубкой.';
        }

        return moveDetails.map(formatMoveExplanation).join('; ');
    }

    function makeAnswerOptions(correct) {
        correct = Number(correct);

        const answersSet = new Set();

        if (correct < 1) {
            correct = 1;
        }

        answersSet.add(correct);

        const nearby = [
            correct + 1,
            correct - 1,
            correct + 2,
            correct - 2,
            correct + 3,
            correct - 3
        ];

        for (const value of nearby) {
            if (value >= 1 && value <= 8) {
                answersSet.add(value);
            }
        }

        for (let value = 1; value <= 8 && answersSet.size < 4; value++) {
            answersSet.add(value);
        }

        let answersArr = Array.from(answersSet).slice(0, 4);

        if (!answersArr.includes(correct)) {
            answersArr[0] = correct;
            answersArr = Array.from(new Set(answersArr));

            for (let value = 1; value <= 8 && answersArr.length < 4; value++) {
                if (!answersArr.includes(value)) {
                    answersArr.push(value);
                }
            }
        }

        for (let i = answersArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [answersArr[i], answersArr[j]] = [answersArr[j], answersArr[i]];
        }

        return answersArr.map(v => ({
            id: String(v),
            text: String(v)
        }));
    }

    // ---------- 6. Генератор задачи ----------
    function generatePieceATask() {
        // Целевые значения: 4,5,6,7 – очень часто; 2,3,8 – редко
        const targets = [2,2,3,3,4,4,4,4,5,5,5,5,6,6,6,6,7,7,7,7,8,8];
        const weights = [1,1,2,2,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,2,2];

        let r = Math.random() * weights.reduce((a, b) => a + b, 0);
        let cum = 0;
        let target = 4;

        for (let i = 0; i < targets.length; i++) {
            cum += weights[i];

            if (r < cum) {
                target = targets[i];
                break;
            }
        }

        let { pos, chosenCell, moves } = generatePositionWithTargetMoves(target);

        if (!moves || moves.length === 0) {
            pos = getSafeFallbackPositionWithCapture();
            chosenCell = 16;
            moves = getCapturingMovesForPiece(pos, chosenCell, 'red');
        }

        const correct = moves.length;
        const moveDetails = getCapturingMoveDetailsForPiece(pos, chosenCell, 'red');
        const options = makeAnswerOptions(correct);

        // Создаём объект меток для отрисовки буквы 'А'
        const labels = {};
        labels[chosenCell] = 'А';

        return {
            question: "Сколько вариантов ходов с рубкой есть у красной фишки, обозначенной буквой А?",
            answer_type: "single",
            options: options,
            correct: String(correct),
            position: pos,

            // Старое поле оставлено для совместимости
            labels: labels,

            // Чёрная буква А поверх нужной фишки
            green_numbers: labels,

            // Чтобы в интерфейсах с нумерацией позиций буква А не перекрывалась номером клетки
            skipPositionNumbers: [chosenCell],

            chosen_cell: chosenCell,
            moves_list: moves,
            move_details: moveDetails,
            explanation: makeExplanation(moveDetails),
            highlights: {}
        };
    }

    // ---------- 7. Регистрация в глобальном объекте ----------
    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["5"] = generatePieceATask;   // используем тип 5

    window.taskTitles = window.taskTitles || {};
    window.taskTitles["5"] = "🎯 Сколько рубящих ходов у фишки А?";

    window.originalCenters = originalCenters;
    window.drawGreenNumbers = drawGreenNumbers;
})();