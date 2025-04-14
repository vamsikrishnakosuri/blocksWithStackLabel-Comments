// Handle keyboard navigation within the toolbox
function handleToolboxNavigation(e) {
    if (!inCategoryView) {
        // Navigation within an open category
        switch (e.key) {
            case 'ArrowUp':
                // Move to previous block in category
                if (selectedBlockInCategoryIndex > 0) {
                    const blocks = toolboxBlocks.querySelectorAll('.toolbox-block');
                    blocks[selectedBlockInCategoryIndex].classList.remove('selected');
                    selectedBlockInCategoryIndex--;
                    blocks[selectedBlockInCategoryIndex].classList.add('selected');
                    updateCurrentBlock();
                }
                e.preventDefault();
                break;
                
            case 'ArrowDown':
                // Move to next block in category
                if (selectedBlockInCategoryIndex < currentCategoryBlocks.length - 1) {
                    const blocks = toolboxBlocks.querySelectorAll('.toolbox-block');
                    blocks[selectedBlockInCategoryIndex].classList.remove('selected');
                    selectedBlockInCategoryIndex++;
                    blocks[selectedBlockInCategoryIndex].classList.add('selected');
                    updateCurrentBlock();
                }
                e.preventDefault();
                break;
                
            case 'ArrowLeft':
                // Go back to category list
                backToCategories();
                e.preventDefault();
                break;
                
            case 'Enter':
            case ' ':
                // Add the selected block to the workspace
                if (selectedBlockInCategoryIndex >= 0) {
                    const blockType = currentCategoryBlocks[selectedBlockInCategoryIndex].type;
                    addBlockToWorkspace(blockType);
                }
                e.preventDefault();
                break;
                
            case 'Escape':
                // Go back to category list or close toolbox
                backToCategories();
                e.preventDefault();
                break;
        }
    } else {
        // Navigation between categories
        switch (e.key) {
            case 'ArrowUp':
                // Move to previous category
                if (selectedCategoryIndex > 0) {
                    selectCategory(selectedCategoryIndex - 1);
                }
                e.preventDefault();
                break;
                
            case 'ArrowDown':
                // Move to next category
                if (selectedCategoryIndex < categoryList.length - 1) {
                    selectCategory(selectedCategoryIndex + 1);
                }
                e.preventDefault();
                break;
                
            case 'ArrowRight':
            case 'Enter':
            case ' ':
                // Open the selected category
                openCategory();
                e.preventDefault();
                break;
                
            case 'Escape':
                // Close toolbox and return to workspace
                closeToolbox();
                e.preventDefault();
                break;
        }
    }
}

// Enter connection mode for the selected block
function enterConnectionMode() {
    if (selectedBlockIndex < 0 || selectedBlockIndex >= blockList.length) {
        showStatus('No block selected');
        return;
    }
    
    isConnectionMode = true;
    sourceBlock = blockList[selectedBlockIndex];
    connectionPoints = [];
    selectedConnectionIndex = -1;
    
    // Get all connections from the block
    // First, get input connections
    const inputList = sourceBlock.inputList || [];
    inputList.forEach(input => {
        if (input.connection) {
            connectionPoints.push({
                connection: input.connection,
                type: 'input',
                block: sourceBlock
            });
        }
    });
    
    // Get output connection if it exists
    if (sourceBlock.outputConnection) {
        connectionPoints.push({
            connection: sourceBlock.outputConnection,
            type: 'output',
            block: sourceBlock
        });
    }
    
    // Get previous connection if it exists
    if (sourceBlock.previousConnection) {
        connectionPoints.push({
            connection: sourceBlock.previousConnection,
            type: 'previous',
            block: sourceBlock
        });
    }
    
    // Get next connection if it exists
    if (sourceBlock.nextConnection) {
        connectionPoints.push({
            connection: sourceBlock.nextConnection,
            type: 'next',
            block: sourceBlock
        });
    }
    
    if (connectionPoints.length > 0) {
        selectedConnectionIndex = 0;
        sourceConnection = connectionPoints[selectedConnectionIndex].connection;
        
        // Highlight the selected connection (this is a simplified version)
        // In a real implementation, you would visually highlight the connection
        
        updateCurrentBlock();
        showStatus(`Connection mode: Use Tab to navigate connections, Enter to select, then select target block`);
    } else {
        isConnectionMode = false;
        showStatus('This block has no available connections');
    }
}

// Handle keyboard navigation in connection mode
function handleConnectionNavigation(e) {
    switch (e.key) {
        case 'Tab':
            // Navigate to the next connection point
            if (connectionPoints.length > 0) {
                selectedConnectionIndex = (selectedConnectionIndex + 1) % connectionPoints.length;
                sourceConnection = connectionPoints[selectedConnectionIndex].connection;
                updateCurrentBlock();
                showStatus(`Selected ${connectionPoints[selectedConnectionIndex].type} connection`);
            }
            e.preventDefault();
            break;
            
        case 'Enter':
            // If we have a source connection selected, now we need to select a target block
            if (sourceConnection) {
                // Store the source connection and exit connection mode
                const savedSourceConnection = sourceConnection;
                const savedSourceBlock = sourceBlock;
                
                // Exit connection mode but keep the block selected
                isConnectionMode = false;
                sourceConnection = null;
                connectionPoints = [];
                selectedConnectionIndex = -1;
                
                showStatus('Now select a target block to connect to');
                
                // Set up a one-time event handler for the next block selection
                const originalSelectBlock = selectBlock;
                selectBlock = function(index) {
                    // Call the original function
                    originalSelectBlock(index);
                    
                    // Get the target block
                    const targetBlock = blockList[index];
                    
                    // Try to connect the blocks
                    tryConnectBlocks(savedSourceBlock, savedSourceConnection, targetBlock);
                    
                    // Restore the original selectBlock function
                    selectBlock = originalSelectBlock;
                };
            }
            e.preventDefault();
            break;
            
        case 'Escape':
            // Exit connection mode
            isConnectionMode = false;
            sourceConnection = null;
            connectionPoints = [];
            selectedConnectionIndex = -1;
            updateCurrentBlock();
            showStatus('Connection mode exited');
            e.preventDefault();
            break;
    }
}

// Try to connect two blocks
function tryConnectBlocks(sourceBlock, sourceConnection, targetBlock) {
    if (!sourceBlock || !sourceConnection || !targetBlock) {
        showStatus('Invalid blocks or connection');
        return false;
    }
    
    let success = false;
    
    // Check for a compatible connection on the target block
    const targetConnections = targetBlock.getConnections_(false);
    
    for (const targetConnection of targetConnections) {
        if (sourceConnection.checkType_(targetConnection)) {
            // Found a compatible connection!
            sourceConnection.connect(targetConnection);
            success = true;
            
            // Update block numbers after connection
            updateBlockNumbers();
            
            showStatus(`Connected ${sourceBlock.type} to ${targetBlock.type}`);
            break;
        }
    }
    
    if (!success) {
        showStatus('Could not find a compatible connection', 3000);
    }
    
    return success;
}

// Navigate in a specific direction
function navigateDirection(direction) {
    if (selectedBlockIndex < 0 || blockList.length <= 1) return;
    
    const currentBlock = blockList[selectedBlockIndex];
    const currentPos = currentBlock.getRelativeToSurfaceXY();
    
    let bestBlockIndex = -1;
    let bestDistance = Infinity;
    
    // Find the closest block in the specified direction
    blockList.forEach((block, index) => {
        if (index === selectedBlockIndex) return;
        
        const blockPos = block.getRelativeToSurfaceXY();
        let isInDirection = false;
        
        // Check if the block is in the specified direction
        switch (direction) {
            case 'left':
                isInDirection = blockPos.x < currentPos.x;
                break;
            case 'right':
                isInDirection = blockPos.x > currentPos.x;
                break;
            case 'up':
                isInDirection = blockPos.y < currentPos.y;
                break;
            case 'down':
                isInDirection = blockPos.y > currentPos.y;
                break;
        }
        
        if (isInDirection) {
            // Calculate distance (Manhattan distance)
            const distance = Math.abs(blockPos.x - currentPos.x) + Math.abs(blockPos.y - currentPos.y);
            
            if (distance < bestDistance) {
                bestDistance = distance;
                bestBlockIndex = index;
            }
        }
    });
    
    // Select the best block if found
    if (bestBlockIndex >= 0) {
        selectBlock(bestBlockIndex);
    } else {
        showStatus(`No block found in that direction`);
    }
}
