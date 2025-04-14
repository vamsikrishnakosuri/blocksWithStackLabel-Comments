// Add and update block numbers
function updateBlockNumbers() {
    console.log("updateBlockNumbers called, blocks in workspace:", blockList.length);
    stackAssignmentCounter++;
    console.log("Update iteration #", stackAssignmentCounter);
    
    // Clear existing block chain tracking
    blockChains.clear();
    
    // DO NOT clear stackNames here - we need to preserve them
    // Just clean up entries for blocks that no longer exist
    for (const blockId of stackNames.keys()) {
        const block = workspace.getBlockById(blockId);
        if (!block) {
            console.log(`Removing name for non-existent block ${blockId}`);
            stackNames.delete(blockId);
        }
    }
    
    // Ensure the blockList is up to date with the current workspace
    blockList = workspace.getAllBlocks();
    console.log("Updated blockList from workspace, count:", blockList.length);
    
    // Clear all existing labels from all blocks
    blockList.forEach(block => {
        removeBlockLabel(block);
        removeStackCounterLabel(block);
        removeStackNameLabel(block);
    });
    
    // First, identify all TRULY independent blocks (not connected to anything)
    const independentRootBlocks = blockList.filter(block => {
        // A block is truly independent if it has no parent and no connected previous connection
        return !block.getParent() && 
               (!block.previousConnection || !block.previousConnection.isConnected()) &&
               (!block.outputConnection || !block.outputConnection.isConnected());
    });
    
    console.log("Found", independentRootBlocks.length, "truly independent root blocks");
    
    // Get snapshot of current stack names before assignment for comparison
    const stackNamesBefore = new Map(stackNames);
    
    // Assign stack names (A, B, C, etc.) to each independent root block
    assignStackNames(independentRootBlocks);
    
    // Verify all previously named blocks still have their names
    for (const [blockId, name] of stackNamesBefore.entries()) {
        const block = workspace.getBlockById(blockId);
        // If the block still exists and is still an independent root block
        if (block && independentRootBlocks.includes(block)) {
            // Make sure it still has the same name
            if (!stackNames.has(blockId) || stackNames.get(blockId) !== name) {
                console.error(`Block ${blockId} lost its name (was ${name}, now ${stackNames.get(blockId) || 'missing'})`);
                // Restore its name
                stackNames.set(blockId, name);
            }
        }
    }
    
    // Process each independent root block and its entire chain
    independentRootBlocks.forEach(rootBlock => {
        // Get all blocks in this stack (including nested blocks for counting purposes)
        const stackBlocks = getAllBlocksInStack(rootBlock);
        const stackCount = stackBlocks.length;
        
        console.log(`Stack with root block ${rootBlock.id} has ${stackCount} blocks (including nested)`);
        
        // Add the stack counter to the root block with the total count
        addStackCounterLabel(rootBlock, stackCount);
        
        // Add stack name to the root block
        const stackName = stackNames.get(rootBlock.id);
        if (stackName) {
            addStackNameLabel(rootBlock, stackName);
            console.log(`Applied stack name ${stackName} to block ${rootBlock.id}`);
        } else {
            console.error(`No stack name found for block ${rootBlock.id}`);
        }
        
        // Use the new embedded block numbering system
        let blockNumber = 1;
        let currentBlock = rootBlock;
        while (currentBlock) {
            // Track the block in our data structure
            blockChains.set(currentBlock.id, blockNumber);
            
            // Call the updateBlockNumber method on the block if it exists
            if (currentBlock.updateBlockNumber) {
                currentBlock.updateBlockNumber(blockNumber);
            }
            
            blockNumber++;
            currentBlock = currentBlock.getNextBlock();
        }
    });
}

// Get all blocks in a stack, including all nested blocks
function getAllBlocksInStack(rootBlock) {
    const stackBlocks = [];
    
    // Function to recursively add a block and all its descendants
    function addBlockAndDescendants(block) {
        // Add this block
        stackBlocks.push(block);
        
        // Add all blocks connected to its next connection (blocks below it)
        let nextBlock = block.getNextBlock();
        if (nextBlock) {
            addBlockAndDescendants(nextBlock);
        }
        
        // Add all blocks inside this block's inputs (nested blocks)
        const childBlocks = block.getChildren(false);
        for (const childBlock of childBlocks) {
            // Skip blocks that are connected to the next connection
            // (we already handled those above)
            if (block.getNextBlock() === childBlock) {
                continue;
            }
            
            // Add this child block and all its descendants
            addBlockAndDescendants(childBlock);
        }
    }
    
    // Start with the root block
    addBlockAndDescendants(rootBlock);
    
    return stackBlocks;
}

// Add a stack counter label to the top block showing total blocks in stack
function addStackCounterLabel(block, count) {
    // Remove any existing stack counter
    removeStackCounterLabel(block);
    
    console.log(`Adding stack counter to block ${block.id} with count: ${count}`);
    
    try {
        // Get counter width based on content
        const counterWidth = Math.max(100, 50 + (count.toString().length * 20)); // Width for better visibility
        
        // Create new stack counter element - position it much further to the left to avoid overlap
        const counterGroup = Blockly.utils.dom.createSvgElement('g', {
            'class': 'blocklyStackCounterLabel',
            'transform': 'translate(-100, 60)'  // Position to match the stack name's horizontal alignment
        }, block.getSvgRoot());
        
        // Outer glow for better visibility
        Blockly.utils.dom.createSvgElement('rect', {
            'x': 0,
            'y': 0,
            'width': counterWidth,
            'height': 36,
            'rx': 18,
            'ry': 18,
            'fill': 'none',
            'stroke': '#ffffff',
            'stroke-width': 4,
            'filter': 'blur(3px)'
        }, counterGroup);
        
        // Drop shadow
        Blockly.utils.dom.createSvgElement('rect', {
            'x': 4,
            'y': 4,
            'width': counterWidth - 8,
            'height': 36 - 8,
            'rx': 18 - 4,
            'ry': 18 - 4,
            'fill': '#000000',
            'opacity': 0.3,
            'filter': 'blur(3px)'
        }, counterGroup);
        
        // Background with rounded corners
        Blockly.utils.dom.createSvgElement('rect', {
            'x': 0,
            'y': 0,
            'width': counterWidth,
            'height': 36,
            'rx': 18,
            'ry': 18,
            'fill': '#ff4081',  // Brighter pink
            'stroke': '#c2185b', // Darker pink border
            'stroke-width': 2.5
        }, counterGroup);
        
        // Counter text
        const text = Blockly.utils.dom.createSvgElement('text', {
            'x': counterWidth / 2,
            'y': 22,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            'font-size': '16pt',
            'font-weight': 'bold',
            'fill': '#ffffff',  // White text
            'style': 'text-shadow: 1px 1px 2px rgba(0,0,0,0.5)'  // Text shadow
        }, counterGroup);
        
        text.textContent = `${count} ${count === 1 ? 'Block' : 'Blocks'}`;
        
        // Store a reference to the counter element on the block
        block.stackCounterLabel = counterGroup;
        
        console.log("Stack counter added successfully");
    } catch (e) {
        console.error("Error adding stack counter:", e);
    }
}
