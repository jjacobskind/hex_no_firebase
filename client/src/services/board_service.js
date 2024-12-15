// board.service.js

import BoardClass from './BoardClass'

export function generateBoard(num = 19) {
  const board = new BoardClass()
  board.generate(num)
  return board.tiles
}