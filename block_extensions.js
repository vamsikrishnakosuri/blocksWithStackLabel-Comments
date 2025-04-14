/**
 * Custom Blockly extensions to add block numbers directly inside blocks
 */

// Extension to add block numbers to blocks
Blockly.Extensions.register('numbered_block', function() {
  // Initialize the block number field
  this.blockNumber = 1;
  
  // Add a mixin to the block
  this.mixin({
    // Method to update the block number
    updateBlockNumber: function(number) {
      this.blockNumber = number;
      
      // Check if this block should display a number
      const shouldShowNumber = this.shouldShowBlockNumber();
      
      // Find the number field
      const numberField = this.getField('BLOCK_NUMBER');
      const separatorField = this.getField('BLOCK_NUMBER_SEPARATOR');
      
      if (numberField) {
        if (shouldShowNumber) {
          // Set value and make visible
          numberField.setValue(number.toString());
          numberField.getSvgRoot().style.display = '';
          
          // Make separator visible if it exists
          if (separatorField) {
            separatorField.getSvgRoot().style.display = '';
          }
        } else {
          // Hide for non-top-level blocks
          numberField.getSvgRoot().style.display = 'none';
          
          // Hide separator if it exists
          if (separatorField) {
            separatorField.getSvgRoot().style.display = 'none';
          }
        }
      }
    },
    
    // Get the block number
    getBlockNumber: function() {
      return this.blockNumber;
    },
    
    // Check if this block should display a block number
    // Rules:
    // 1. Show block numbers for blocks in a main sequence
    // 2. Hide block numbers for nested blocks
    shouldShowBlockNumber: function() {
      // Special case: If this block is a value input to another block, hide number
      if (this.outputConnection && this.outputConnection.isConnected()) {
        return false;
      }
      
      const parent = this.getParent();
      
      // No parent means this is a top-level block - always show number
      if (!parent) {
        return true;
      }
      
      // Now check if this is connected via statement input or regular sequence
      // Find all connections on parent that are NEXT_STATEMENT type
      const parentInputs = parent.inputList || [];
      let isNestedStatement = false;
      
      for (let i = 0; i < parentInputs.length; i++) {
        const input = parentInputs[i];
        // If this is a statement input and its connection leads to this block,
        // then this block is nested inside the parent
        if (input.type === Blockly.NEXT_STATEMENT && 
            input.connection && 
            input.connection.targetBlock() === this) {
          isNestedStatement = true;
          break;
        }
      }
      
      // If this is nested inside a statement, hide the number
      if (isNestedStatement) {
        return false;
      }
      
      // For all other cases (including blocks in a sequence), show the number
      return true;
    }
  });
  
  // Listen for connection/disconnection events
  this.setOnChange(function(event) {
    if (event.type === Blockly.Events.BLOCK_MOVE) {
      // When moved or connected, check if block number should be shown
      if (this.updateBlockNumber) {
        this.updateBlockNumber(this.blockNumber);
      }
    }
  });
});

// Helper function to override a block definition with numbered version
function overrideBlockDefinition(blockType, inputToMoveBefore) {
  // Store the original definition
  const originalDefinition = Blockly.Blocks[blockType];
  if (!originalDefinition) return; // Skip if block type doesn't exist
  
  // Create new definition with numbers
  Blockly.Blocks[blockType] = Object.assign({}, originalDefinition, {
    init: function() {
      // Call the original init function
      const originalInit = originalDefinition.init;
      originalInit.call(this);
      
      // Add the block number field at the beginning of the block
      this.appendDummyInput('BLOCK_NUMBER_INPUT')
          .appendField(new Blockly.FieldLabel('', 'blockly-block-number'), 'BLOCK_NUMBER')
          .appendField(' | ', 'BLOCK_NUMBER_SEPARATOR'); // Separator with field name for hiding
          
      // Move the BLOCK_NUMBER_INPUT to the beginning
      if (inputToMoveBefore) {
        if (this.inputList.find(input => input.name === inputToMoveBefore)) {
          this.moveInputBefore('BLOCK_NUMBER_INPUT', inputToMoveBefore);
        } else {
          // If specified input doesn't exist, move before the first input
          const firstInput = this.inputList[0] ? this.inputList[0].name : null;
          if (firstInput && firstInput !== 'BLOCK_NUMBER_INPUT') {
            this.moveInputBefore('BLOCK_NUMBER_INPUT', firstInput);
          }
        }
      } else {
        // Move before first input if no specific input specified
        const firstInput = this.inputList[0] ? this.inputList[0].name : null;
        if (firstInput && firstInput !== 'BLOCK_NUMBER_INPUT') {
          this.moveInputBefore('BLOCK_NUMBER_INPUT', firstInput);
        }
      }
      
      // Apply the numbered_block extension
      Blockly.Extensions.apply('numbered_block', this);
      
      // Check initial state - hide number if appropriate
      if (this.updateBlockNumber) {
        setTimeout(() => {
          this.updateBlockNumber(this.blockNumber);
        }, 0);
      }
    }
  });
}

// Extend the IF block definition to include a block number field
overrideBlockDefinition('controls_if', 'IF0');

// Math blocks
overrideBlockDefinition('math_number', null);
overrideBlockDefinition('math_arithmetic', null);
overrideBlockDefinition('math_single', null);
overrideBlockDefinition('math_round', null);
overrideBlockDefinition('math_modulo', null);
overrideBlockDefinition('math_constrain', null);
overrideBlockDefinition('math_random_int', null);

// Logic blocks 
overrideBlockDefinition('logic_compare', null);
overrideBlockDefinition('logic_operation', null);
overrideBlockDefinition('logic_negate', null);
overrideBlockDefinition('logic_boolean', null);
overrideBlockDefinition('logic_null', null);
overrideBlockDefinition('logic_ternary', null);

// Loop blocks
overrideBlockDefinition('controls_repeat_ext', null);
overrideBlockDefinition('controls_whileUntil', null);
overrideBlockDefinition('controls_for', null);
overrideBlockDefinition('controls_forEach', null);
overrideBlockDefinition('controls_flow_statements', null);

// Text blocks
overrideBlockDefinition('text', null);
overrideBlockDefinition('text_join', null);
overrideBlockDefinition('text_append', null);
overrideBlockDefinition('text_length', null);
overrideBlockDefinition('text_isEmpty', null);
overrideBlockDefinition('text_print', null);

// Variables blocks
overrideBlockDefinition('variables_get', null);
overrideBlockDefinition('variables_set', null);

// List blocks
overrideBlockDefinition('lists_create_empty', null);
overrideBlockDefinition('lists_create_with', null);
overrideBlockDefinition('lists_repeat', null);
overrideBlockDefinition('lists_length', null);
overrideBlockDefinition('lists_isEmpty', null);
overrideBlockDefinition('lists_indexOf', null);
overrideBlockDefinition('lists_getIndex', null);
overrideBlockDefinition('lists_setIndex', null);

// Add the custom CSS for the block number
document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.textContent = `
    .blockly-block-number {
      font-weight: bold;
      color: white;
      background-color: #4285f4;
      padding: 2px 6px;
      border-radius: 10px;
      margin-right: 5px;
    }
  `;
  document.head.appendChild(style);
});

// Function to update all block numbers in the workspace
function updateAllBlockNumbers(workspace) {
  // First, identify all top-level blocks (not connected to anything)
  const topLevelBlocks = workspace.getTopBlocks(true);
  
  // Process each top-level block
  topLevelBlocks.forEach(function(rootBlock) {
    // Get stack name (A, B, C) - this would come from your existing stack names logic
    const stackName = getStackName(rootBlock);
    
    // Start numbering from 1 for each stack
    let blockNumber = 1;
    
    // Follow the block chain (only direct connections, not nested blocks)
    let currentBlock = rootBlock;
    while (currentBlock) {
      // Update the block number if the block supports it
      if (currentBlock.updateBlockNumber) {
        currentBlock.updateBlockNumber(blockNumber);
      }
      
      // Move to the next block
      blockNumber++;
      currentBlock = currentBlock.getNextBlock();
    }
  });
}

// Helper function to get stack name - simplified placeholder, use your existing logic
function getStackName(block) {
  // This should integrate with your existing stack names map
  // Here's a simplified placeholder:
  if (!block.stackName) {
    // Assign a name based on index in top blocks
    const workspace = block.workspace;
    const topBlocks = workspace.getTopBlocks(true);
    const index = topBlocks.indexOf(block);
    block.stackName = String.fromCharCode(65 + index); // A, B, C, etc.
  }
  return block.stackName;
}

// Helper function to integrate with existing stack names map if available
function integrateWithExistingStackNames() {
  // If the global stackNames map exists, use it
  if (typeof stackNames !== 'undefined' && stackNames instanceof Map) {
    // Override the getStackName function to use the existing map
    getStackName = function(block) {
      return stackNames.get(block.id) || 'X'; // Default to 'X' if not found
    };
  }
}

// Register a change listener to update block numbers when blocks are moved or created
function setupBlockNumbering(workspace) {
  // Try to integrate with existing stack names
  integrateWithExistingStackNames();
  
  workspace.addChangeListener(function(event) {
    if (event.type === Blockly.Events.BLOCK_CREATE ||
        event.type === Blockly.Events.BLOCK_MOVE ||
        event.type === Blockly.Events.BLOCK_DELETE) {
      // Use setTimeout to batch updates
      setTimeout(function() {
        updateAllBlockNumbers(workspace);
      }, 10);
    }
  });
  
  // Initial numbering
  updateAllBlockNumbers(workspace);
}
