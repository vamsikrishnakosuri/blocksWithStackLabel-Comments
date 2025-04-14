// Initialize Blockly workspace
const blocklyArea = document.getElementById('blocklyArea');
const blocklyDiv = document.getElementById('blocklyDiv');
const statusDiv = document.getElementById('status');
const currentBlockDiv = document.getElementById('currentBlock');
const toolboxPanel = document.getElementById('toolboxPanel');
const toolboxCategories = document.getElementById('toolboxCategories');
const toolboxBlocks = document.getElementById('toolboxBlocks');

// Define toolbox structure
const toolboxDef = {
    'Logic': [
        { type: 'controls_if', name: 'If Block' },
        { type: 'logic_compare', name: 'Compare' },
        { type: 'logic_boolean', name: 'Boolean' }
    ],
    'Loops': [
        { type: 'controls_repeat_ext', name: 'Repeat' },
        { type: 'controls_whileUntil', name: 'While/Until' }
    ],
    'Math': [
        { type: 'math_number', name: 'Number' },
        { type: 'math_arithmetic', name: 'Arithmetic' }
    ],
    'Text': [
        { type: 'text', name: 'Text' },
        { type: 'text_print', name: 'Print' }
    ]
};

// Create the toolbox XML
const toolboxXml = `
    <xml>
        <category name="Logic" colour="210">
            <block type="controls_if"></block>
            <block type="logic_compare"></block>
            <block type="logic_boolean"></block>
        </category>
        <category name="Loops" colour="120">
            <block type="controls_repeat_ext"></block>
            <block type="controls_whileUntil"></block>
        </category>
        <category name="Math" colour="230">
            <block type="math_number"></block>
            <block type="math_arithmetic"></block>
        </category>
        <category name="Text" colour="160">
            <block type="text"></block>
            <block type="text_print"></block>
        </category>
    </xml>
`;

let workspace;
let workspaceReference;
let blockList = [];
let blockChains = new Map();
let stackNames = new Map();
let nextStackLetter = 0;
let stackAssignmentCounter = 0;
let selectedBlockIndex = -1;
let isToolboxOpen = false;
let inCategoryView = true;
let categoryList = Object.keys(toolboxDef);
let selectedCategoryIndex = 0;
let selectedBlockInCategoryIndex = 0;
let currentCategoryBlocks = [];
let isConnectionMode = false;
let connectionPoints = [];
let selectedConnectionIndex = -1;
let sourceBlock = null;
let sourceConnection = null;
let updateTimeout = null; // Timeout for batching updates

// Status display function
function showStatus(message, duration = 5000) {
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    // Hide after specified duration
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, duration);
}

// Update current block display
function updateCurrentBlock() {
    if (isConnectionMode && selectedConnectionIndex >= 0 && connectionPoints.length > 0) {
        const connection = connectionPoints[selectedConnectionIndex];
        currentBlockDiv.textContent = `Connection Mode: Selected ${connection.type} connection on ${connection.block.type}`;
        currentBlockDiv.style.display = 'block';
    } else if (isToolboxOpen) {
        if (!inCategoryView && selectedBlockInCategoryIndex >= 0) {
            const blockInfo = currentCategoryBlocks[selectedBlockInCategoryIndex];
            currentBlockDiv.textContent = `Selected in Toolbox: ${blockInfo.name}`;
            currentBlockDiv.style.display = 'block';
        } else if (selectedCategoryIndex >= 0) {
            const category = categoryList[selectedCategoryIndex];
            currentBlockDiv.textContent = `Selected Category: ${category}`;
            currentBlockDiv.style.display = 'block';
        } else {
            currentBlockDiv.style.display = 'none';
        }
    } else if (selectedBlockIndex >= 0 && selectedBlockIndex < blockList.length) {
        const block = blockList[selectedBlockIndex];
        currentBlockDiv.textContent = `Selected Block ${selectedBlockIndex + 1}: ${block.type}`;
        currentBlockDiv.style.display = 'block';
    } else {
        currentBlockDiv.style.display = 'none';
    }
}

// Select a block by index
function selectBlock(index) {
    // Deselect previous block
    if (selectedBlockIndex >= 0 && selectedBlockIndex < blockList.length) {
        blockList[selectedBlockIndex].unselect();
    }
    
    // Select new block
    if (index >= 0 && index < blockList.length) {
        selectedBlockIndex = index;
        blockList[selectedBlockIndex].select();
        
        // Center the viewport on the selected block
        workspace.centerOnBlock(blockList[selectedBlockIndex].id);
        
        updateCurrentBlock();
        showStatus(`Selected block ${index + 1}: ${blockList[index].type}`);
    }
}

// Build the custom toolbox UI
function buildToolboxUI() {
    // Clear existing content
    toolboxCategories.innerHTML = '';
    
    // Add categories
    categoryList.forEach((category, index) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'toolbox-category';
        categoryDiv.textContent = category;
        categoryDiv.dataset.index = index;
        
        if (index === selectedCategoryIndex) {
            categoryDiv.classList.add('selected');
        }
        
        categoryDiv.addEventListener('click', () => {
            selectCategory(index);
        });
        
        toolboxCategories.appendChild(categoryDiv);
    });
}

// Build the blocks UI for a category
function buildBlocksUI(categoryName) {
    // Clear existing content
    toolboxBlocks.innerHTML = '';
    
    // Get blocks for this category
    currentCategoryBlocks = toolboxDef[categoryName];
    
    // Add blocks
    currentCategoryBlocks.forEach((block, index) => {
        const blockDiv = document.createElement('div');
        blockDiv.className = 'toolbox-block';
        blockDiv.textContent = block.name;
        blockDiv.dataset.index = index;
        
        if (index === selectedBlockInCategoryIndex) {
            blockDiv.classList.add('selected');
        }
        
        blockDiv.addEventListener('click', () => {
            addBlockToWorkspace(block.type);
        });
        
        toolboxBlocks.appendChild(blockDiv);
    });
}

// Open toolbox for keyboard navigation
function openToolbox() {
    isToolboxOpen = true;
    inCategoryView = true;
    selectedCategoryIndex = 0;
    selectedBlockInCategoryIndex = 0;
    
    // Build the toolbox UI
    buildToolboxUI();
    
    // Show the toolbox panel
    toolboxPanel.style.display = 'block';
    toolboxCategories.style.display = 'block';
    toolboxBlocks.style.display = 'none';
    
    updateCurrentBlock();
    showStatus(`Toolbox opened. Use arrow keys to navigate, Enter to select.`);
}

// Close toolbox and return to workspace
function closeToolbox() {
    isToolboxOpen = false;
    toolboxPanel.style.display = 'none';
    updateCurrentBlock();
    showStatus(`Toolbox closed.`);
}

// Select a category
function selectCategory(index) {
    // Update selected category
    const categories = toolboxCategories.querySelectorAll('.toolbox-category');
    categories.forEach(cat => cat.classList.remove('selected'));
    
    selectedCategoryIndex = index;
    categories[index].classList.add('selected');
    
    updateCurrentBlock();
}

// Open the selected category
function openCategory() {
    if (selectedCategoryIndex >= 0) {
        const categoryName = categoryList[selectedCategoryIndex];
        
        // Switch to blocks view
        inCategoryView = false;
        selectedBlockInCategoryIndex = 0;
        
        // Build the blocks UI
        buildBlocksUI(categoryName);
        
        // Show blocks, hide categories
        toolboxCategories.style.display = 'none';
        toolboxBlocks.style.display = 'block';
        
        updateCurrentBlock();
        showStatus(`Category '${categoryName}' opened. Use arrow keys to navigate blocks.`);
    }
}

// Go back to category view
function backToCategories() {
    inCategoryView = true;
    toolboxCategories.style.display = 'block';
    toolboxBlocks.style.display = 'none';
    updateCurrentBlock();
    showStatus(`Returned to category list.`);
}

// Add a block to the workspace
function addBlockToWorkspace(blockType) {
    // Create the block
    const block = workspace.newBlock(blockType);
    block.initSvg();
    block.render();
    
    // Position it in the center of the visible workspace
    const metrics = workspace.getMetrics();
    const x = metrics.viewWidth / 2 + metrics.viewLeft;
    const y = metrics.viewHeight / 2 + metrics.viewTop;
    block.moveBy(x, y);
    
    // Add to our block list
    blockList.push(block);
    
    showStatus(`Added block: ${blockType}`);
    
    // Update block numbers
    updateBlockNumbers();
    
    // Close the toolbox and select the new block
    closeToolbox();
    selectBlock(blockList.length - 1);
}

// Create sample blocks
document.getElementById('createBlocksBtn').addEventListener('click', function() {
    // Clear existing blocks
    workspace.clear();
    blockList = [];
    selectedBlockIndex = -1;
    
    // Create blocks with different types and positions
    const blockData = [
        {type: 'controls_if', x: 50, y: 50, label: "1. IF Block"},
        {type: 'math_number', x: 50, y: 150, fields: {NUM: 123}, label: "2. Number Block"},
        {type: 'logic_compare', x: 200, y: 50, label: "3. Compare Block"},
        {type: 'controls_repeat_ext', x: 200, y: 150, label: "4. Repeat Block"},
        {type: 'text', x: 350, y: 50, fields: {TEXT: 'Hello World'}, label: "5. Text Block"},
        {type: 'logic_boolean', x: 350, y: 150, fields: {BOOL: 'TRUE'}, label: "6. Boolean Block"}
    ];
    
    // Add blocks to workspace
    blockData.forEach((data, index) => {
        const block = workspace.newBlock(data.type);
        block.setMovable(true);
        block.moveBy(data.x, data.y);
        block.initSvg();
        block.render();
        
        // Add a comment with the block number for easy identification
        block.setCommentText(data.label);
        
        // Set field values if specified
        if (data.fields) {
            for (const fieldName in data.fields) {
                if (block.getField(fieldName)) {
                    block.setFieldValue(data.fields[fieldName], fieldName);
                }
            }
        }
        
        // Add to our block list
        blockList.push(block);
    });
    
    // Update block numbers for all blocks
    updateBlockNumbers();
    
    showStatus('Sample blocks created! Now click "Enable Keyboard Navigation"');
});

// Enable keyboard navigation
document.getElementById('enableKeyboardBtn').addEventListener('click', function() {
    // Check if blocks exist
    if (blockList.length === 0) {
        showStatus('Please create blocks first by clicking "Create Sample Blocks"');
        return;
    }
    
    // Select the first block to start
    selectBlock(0);
    
    // Add keyboard event listener
    document.removeEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleKeyDown);
    
    showStatus('Keyboard navigation enabled! Use number keys 1-6 to select blocks, arrow keys to navigate, T for toolbox.', 8000);
});

// Handle keyboard events
function handleKeyDown(e) {
    // Handle connection mode if active
    if (isConnectionMode) {
        handleConnectionNavigation(e);
        return;
    }
    
    // Handle toolbox navigation if toolbox is open
    if (isToolboxOpen) {
        handleToolboxNavigation(e);
        return;
    }
    
    // Skip if the focus is on the search input field
    if (document.activeElement && 
        (document.activeElement.id === 'searchInput' || 
         document.activeElement.tagName === 'INPUT' || 
         document.activeElement.tagName === 'TEXTAREA' || 
         document.activeElement.tagName === 'SELECT')) {
        // Allow normal typing in input fields
        return;
    }
    
    // Number keys 1-6 select blocks directly
    if (e.key >= '1' && e.key <= '6') {
        const index = parseInt(e.key) - 1;
        if (index < blockList.length) {
            selectBlock(index);
            e.preventDefault();
        }
        return;
    }
    
    // T key opens the toolbox
    if (e.key === 't' || e.key === 'T') {
        openToolbox();
        e.preventDefault();
        return;
    }
    
    // C key enters connection mode
    if (e.key === 'c' || e.key === 'C') {
        if (selectedBlockIndex >= 0) {
            enterConnectionMode();
            e.preventDefault();
        } else {
            showStatus('Please select a block first before entering connection mode');
        }
        return;
    }
    
    // Only proceed with other keys if a block is selected
    if (selectedBlockIndex < 0) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            // Find the nearest block to the left
            navigateDirection('left');
            e.preventDefault();
            break;
            
        case 'ArrowRight':
            // Find the nearest block to the right
            navigateDirection('right');
            e.preventDefault();
            break;
            
        case 'ArrowUp':
            // Find the nearest block above
            navigateDirection('up');
            e.preventDefault();
            break;
            
        case 'ArrowDown':
            // Find the nearest block below
            navigateDirection('down');
            e.preventDefault();
            break;
            
        case 'Delete':
        case 'Backspace':
            // Delete the selected block
            if (selectedBlockIndex >= 0 && selectedBlockIndex < blockList.length) {
                const blockToDelete = blockList[selectedBlockIndex];
                
                // Remove from our list
                blockList.splice(selectedBlockIndex, 1);
                
                // If we deleted the last block, select the new last block
                if (selectedBlockIndex >= blockList.length) {
                    selectedBlockIndex = blockList.length - 1;
                }
                
                // Delete the block
                blockToDelete.dispose();
                
                // Select the next block if available
                if (blockList.length > 0) {
                    selectBlock(selectedBlockIndex);
                } else {
                    selectedBlockIndex = -1;
                    updateCurrentBlock();
                }
                
                // Update block numbers after deletion
                updateBlockNumbers();
                
                showStatus('Block deleted');
                e.preventDefault();
            }
            break;
            
        case 'Escape':
            // Deselect all blocks
            if (selectedBlockIndex >= 0 && selectedBlockIndex < blockList.length) {
                blockList[selectedBlockIndex].unselect();
                selectedBlockIndex = -1;
                updateCurrentBlock();
                showStatus('Navigation mode exited');
                e.preventDefault();
            }
            break;
    }
}
