# Blockly with Block Numbering

A custom implementation of Google Blockly with automatic block numbering feature. This application provides a visual programming environment with keyboard navigation and automatic sequential numbering of connected blocks.

## Features

- Visual programming with interlocking blocks (Google Blockly)
- Automatic block numbering system
  - Each standalone block gets label "1"
  - Connected blocks are numbered sequentially (1, 2, 3, etc.)
  - Numbers update automatically when blocks are connected or disconnected
- Simple keyboard navigation
- Custom toolbox interface

## How to Use

1. Clone this repository
2. Open `index.html` in a web browser
3. Click "Create Sample Blocks" to add example blocks
4. Enable keyboard navigation with the "Enable Keyboard Navigation" button
5. Use number keys 1-6 to select blocks, arrow keys to navigate between blocks
6. Press 'T' to open the toolbox and add new blocks
7. Press 'C' to enter connection mode for connecting blocks

## Block Numbering

The numbering system works as follows:
- Each standalone block is labeled "1"
- When blocks are connected, the top block is "1" and each subsequent block increments by 1
- If a block is inserted at the top of a chain, it becomes "1" and all others are renumbered
