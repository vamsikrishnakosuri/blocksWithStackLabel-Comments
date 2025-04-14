// Set up event listeners for the Blockly workspace
function setupEventListeners() {
    // Listen for workspace changes
    workspace.addChangeListener(function(event) {
        // When blocks are created
        if (event.type === Blockly.Events.BLOCK_CREATE) {
            console.log('Block created:', event.ids);
            
            // Add newly created blocks to our blockList
            if (event.ids) {
                event.ids.forEach(id => {
                    const block = workspace.getBlockById(id);
                    if (block && !blockList.includes(block)) {
                        blockList.push(block);
                    }
                });
            }
            
            // Only trigger a full update after a short delay to allow multiple blocks
            // to be created at once (e.g., when loading a workspace)
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(updateBlockNumbers, 50);
        }
        // When blocks are deleted
        else if (event.type === Blockly.Events.BLOCK_DELETE) {
            console.log('Block deleted:', event.ids);
            
            // Remove deleted blocks from stackNames map
            if (event.ids) {
                event.ids.forEach(id => {
                    stackNames.delete(id);
                });
            }
            
            // Update our block list to match workspace reality
            blockList = workspace.getAllBlocks();
            
            // Force refresh with a delay to ensure workspace is updated
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(function() {
                // Double check our block list
                blockList = workspace.getAllBlocks();
                console.log(`After deletion: ${blockList.length} blocks remain in workspace`);
                updateBlockNumbers();
            }, 50);
        }
        // When blocks are moved
        else if (event.type === Blockly.Events.BLOCK_MOVE) {
            console.log('Block moved');
            
            // Block connections/disconnections
            if (event.newParentId !== undefined || event.oldParentId !== undefined) {
                console.log('Block connected or disconnected');
                
                // Update with delay to allow connection to complete
                clearTimeout(updateTimeout);
                updateTimeout = setTimeout(updateBlockNumbers, 50);
            }
        }
        // When blocks are changed (field edit, etc)
        else if (event.type === Blockly.Events.BLOCK_CHANGE) {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(updateBlockNumbers, 50);
        }
    });
    
    // Set up keyboard navigation event listener
    document.addEventListener('keydown', function(e) {
        // Skip keyboard navigation if focus is on the search input
        if (document.activeElement && 
            (document.activeElement.id === 'searchInput' || 
             document.activeElement.tagName === 'INPUT' || 
             document.activeElement.tagName === 'TEXTAREA' || 
             document.activeElement.tagName === 'SELECT')) {
            return; // Let the default input behavior happen
        }
        
        // Otherwise, handle keyboard navigation
        handleKeyboardNavigation(e);
    });
}

// Initialize search panel
function setupSearchPanel() {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const searchStatus = document.getElementById('searchStatus');
    
    // Focus handler to stop propagation of keyboard events
    searchInput.addEventListener('focus', function() {
        // When the search field is focused, ensure the events aren't propagated
        searchInput.style.backgroundColor = '#f0f8ff'; // Light blue to indicate focus
    });
    
    searchInput.addEventListener('blur', function() {
        // Reset styling when focus is lost
        searchInput.style.backgroundColor = '';
    });
    
    // Handle search button click
    searchButton.addEventListener('click', function() {
        performSearch();
    });
    
    // Handle Enter key in search input
    searchInput.addEventListener('keydown', function(e) {
        // Stop event propagation to prevent interference with block navigation
        e.stopPropagation();
        
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Also stop keyup events
    searchInput.addEventListener('keyup', function(e) {
        e.stopPropagation();
    });
    
    // Also stop keypress events
    searchInput.addEventListener('keypress', function(e) {
        e.stopPropagation();
    });
    
    // Perform the search
    function performSearch() {
        const searchTerm = searchInput.value.trim().toUpperCase();
        
        // Reset status
        searchStatus.textContent = '';
        
        // Parse the search term (format: stack name + block number, e.g., "A2")
        if (!searchTerm) {
            searchStatus.textContent = 'Please enter a search term.';
            return;
        }
        
        // Match pattern: one or more letters followed by one or more numbers
        const regex = /^([A-Z]+)(\d+)$/;
        const match = searchTerm.match(regex);
        
        if (!match) {
            searchStatus.textContent = 'Invalid format. Use "A2" or "B3".';
            return;
        }
        
        const stackName = match[1];
        const blockNumber = parseInt(match[2]);
        
        // Find the block with the matching stack name and block number
        let foundBlock = null;
        
        // First, find the stack
        let stackBlock = null;
        for (const [blockId, name] of stackNames.entries()) {
            if (name === stackName) {
                stackBlock = workspace.getBlockById(blockId);
                break;
            }
        }
        
        if (!stackBlock) {
            searchStatus.textContent = `Stack ${stackName} not found.`;
            return;
        }
        
        // Find the top-level blocks in this stack (only those directly connected via next/previous)
        // This matches our new numbering system that only numbers top-level blocks
        const topLevelBlocks = [];
        let currentBlock = stackBlock;
        
        // Collect all blocks in the sequence
        while (currentBlock) {
            topLevelBlocks.push(currentBlock);
            currentBlock = currentBlock.getNextBlock();
        }
        
        // Check if the requested block number is valid
        if (blockNumber <= 0 || blockNumber > topLevelBlocks.length) {
            searchStatus.textContent = `Block ${blockNumber} not found in stack ${stackName}.`;
            return;
        }
        
        // Block numbers are 1-indexed in the UI
        foundBlock = topLevelBlocks[blockNumber - 1];
        
        if (foundBlock) {
            // Highlight and scroll to the found block
            highlightBlock(foundBlock);
            searchStatus.textContent = `Found block ${stackName}${blockNumber}.`;
        } else {
            searchStatus.textContent = `Block ${stackName}${blockNumber} not found.`;
        }
    }
    
    // Function to highlight a block and scroll to it
    function highlightBlock(block) {
        // Clear any existing highlight
        workspace.highlightBlock(null);
        
        // Highlight the found block
        workspace.highlightBlock(block.id);
        
        // Center on the block
        const metrics = workspace.getMetrics();
        const blockPos = block.getRelativeToSurfaceXY();
        const blockSize = block.getHeightWidth();
        
        // Calculate the center point of the block
        const blockCenterX = blockPos.x + blockSize.width / 2;
        const blockCenterY = blockPos.y + blockSize.height / 2;
        
        // Center the workspace on the block
        workspace.scroll(
            blockCenterX - metrics.viewWidth / 2,
            blockCenterY - metrics.viewHeight / 2
        );
        
        // Optional: add a temporary visual effect to make it easier to spot
        const blockSvg = block.getSvgRoot();
        blockSvg.classList.add('blocklyHighlighted');
        setTimeout(() => {
            blockSvg.classList.remove('blocklyHighlighted');
        }, 2000);
    }
}

// Initialize Blockly after window loads
window.addEventListener('load', function() {
    initBlockly();
    setupSearchPanel();
});
