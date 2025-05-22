// Initialize Blockly workspace
const blocklyArea = document.getElementById('blocklyArea');
const blocklyDiv = document.getElementById('blocklyDiv');
const statusDiv = document.getElementById('status');
const currentBlockDiv = document.getElementById('currentBlock');

// Global tag tracking system
window.usedTags = new Set(); // Track all tags used in the workspace

// Global UI elements
let commentDisplayBox = null;
let tooltipContainer = null;
let tagSuggestionDropdown = null;

// Initialize the comment display box
function initCommentDisplayBox() {
    if (!commentDisplayBox) {
        commentDisplayBox = document.createElement('div');
        commentDisplayBox.id = 'block-comment-display';
        commentDisplayBox.style.position = 'absolute';
        commentDisplayBox.style.width = '220px';
        commentDisplayBox.style.minHeight = '40px';
        commentDisplayBox.style.backgroundColor = '#ffffc7'; // Yellow like Blockly comments
        commentDisplayBox.style.border = '1px solid #e0d675';
        commentDisplayBox.style.borderRadius = '6px';
        commentDisplayBox.style.padding = '8px';
        commentDisplayBox.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.2)';
        commentDisplayBox.style.zIndex = '1000';
        commentDisplayBox.style.fontFamily = 'Arial, sans-serif';
        commentDisplayBox.style.fontSize = '12px';
        commentDisplayBox.style.display = 'none'; // Hidden by default
        
        // Add a small arrow pointer to make it look like a speech bubble
        const arrow = document.createElement('div');
        arrow.style.position = 'absolute';
        arrow.style.left = '-10px';
        arrow.style.top = '10px';
        arrow.style.width = '0';
        arrow.style.height = '0';
        arrow.style.borderTop = '10px solid transparent';
        arrow.style.borderBottom = '10px solid transparent';
        arrow.style.borderRight = '10px solid #e0d675';
        
        commentDisplayBox.appendChild(arrow);
        document.body.appendChild(commentDisplayBox);
    }
    return commentDisplayBox;
}

// Call this when Blockly is ready
document.addEventListener('DOMContentLoaded', function() {
    initCommentDisplayBox();
});

// Function to update the comment display box when a block is selected
function updateCommentDisplay(block) {
    // Initialize the box if needed
    const displayBox = initCommentDisplayBox();
    
    // Re-add the arrow which might have been removed with innerHTML clearing
    let arrow = displayBox.querySelector('div[style*="border-right"]');
    if (!arrow) {
        arrow = document.createElement('div');
        arrow.style.position = 'absolute';
        arrow.style.left = '-10px';
        arrow.style.top = '10px';
        arrow.style.width = '0';
        arrow.style.height = '0';
        arrow.style.borderTop = '10px solid transparent';
        arrow.style.borderBottom = '10px solid transparent';
        arrow.style.borderRight = '10px solid #e0d675';
        displayBox.appendChild(arrow);
    }
    
    // Clear previous content except the arrow
    const contentContainer = displayBox.querySelector('.comment-content-container');
    if (contentContainer) {
        contentContainer.remove();
    }
    
    // Create a container for the actual content
    const container = document.createElement('div');
    container.className = 'comment-content-container';
    displayBox.appendChild(container);
    
    // Hide the box if no block is selected
    if (!block) {
        displayBox.style.display = 'none';
        return;
    }
    
    // Check if the block has comments or tags
    if (!block.data) {
        displayBox.style.display = 'none';
        return;
    }
    
    let hasContent = false;
    
    // Add block identifier at the top
    const blockIdDiv = document.createElement('div');
    blockIdDiv.style.fontWeight = 'bold';
    blockIdDiv.style.marginBottom = '5px';
    blockIdDiv.style.borderBottom = '1px solid #ddd';
    blockIdDiv.style.paddingBottom = '3px';
    
    // Try to get the stack name and block number
    let blockLabel = '';
    if (window.stackNames && window.stackNames.has(block.id)) {
        const stackName = window.stackNames.get(block.id);
        blockLabel += stackName;
    }
    
    if (typeof block.type === 'string') {
        blockLabel += (blockLabel ? ': ' : '') + block.type.replace(/_/g, ' ');
    }
    
    blockIdDiv.textContent = blockLabel || 'Block';
    container.appendChild(blockIdDiv);
    
    // Create content for the display box
    if (block.data.tagTooltip && block.data.tagTooltip.trim() !== '') {
        hasContent = true;
        const tagDiv = document.createElement('div');
        tagDiv.style.backgroundColor = '#4285F4';
        tagDiv.style.color = 'white';
        tagDiv.style.padding = '3px 6px';
        tagDiv.style.borderRadius = '3px';
        tagDiv.style.marginBottom = '4px';
        tagDiv.style.display = 'inline-block';
        tagDiv.style.fontSize = '11px';
        tagDiv.textContent = block.data.tagTooltip.startsWith('#') ? 
                            block.data.tagTooltip : 
                            '#' + block.data.tagTooltip;
        container.appendChild(tagDiv);
    }
    
    if (block.data.commentTooltip && block.data.commentTooltip.trim() !== '') {
        hasContent = true;
        const commentDiv = document.createElement('div');
        commentDiv.style.marginTop = '4px';
        commentDiv.style.fontSize = '12px';
        commentDiv.textContent = block.data.commentTooltip;
        container.appendChild(commentDiv);
    }
    
    // Only show and position the box if there's content
    if (hasContent) {
        // Position the box next to the block
        try {
            // Get the block's position
            const blockSvg = block.getSvgRoot();
            const blockRect = blockSvg.getBoundingClientRect();
            
            // Get the workspace position
            const workspaceDiv = workspace.getInjectionDiv();
            const workspaceRect = workspaceDiv.getBoundingClientRect();
            
            // Calculate position to place the comment box to the right of the block
            const left = blockRect.right - workspaceRect.left + 15; // 15px to the right of the block
            const top = blockRect.top - workspaceRect.top - 5; // Aligned with top, slightly above
            
            // Apply the position
            displayBox.style.left = left + 'px';
            displayBox.style.top = top + 'px';
            
            // Add the box directly to the workspace div instead of the body
            if (displayBox.parentNode !== workspaceDiv) {
                if (displayBox.parentNode) {
                    displayBox.parentNode.removeChild(displayBox);
                }
                workspaceDiv.appendChild(displayBox);
            }
            
            // Show the display box
            displayBox.style.display = 'block';
        } catch (err) {
            console.error('Error positioning comment display:', err);
            displayBox.style.display = 'none';
        }
    } else {
        displayBox.style.display = 'none';
    }
}

// Add a global event listener for Blockly's block selection events
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the comment display box
    initCommentDisplayBox();
    
    // Set up event listener once Blockly is fully loaded
    setTimeout(function() {
        if (typeof Blockly !== 'undefined') {
            // Set up the main workspace listener
            if (Blockly.mainWorkspace) {
                console.log('Setting up Blockly workspace listener for block selection');
                Blockly.mainWorkspace.addChangeListener(function(event) {
                    // Check if it's a selection event
                    if (event.type === Blockly.Events.SELECTED) {
                        console.log('Block selected:', event);
                        const block = event.newElementId ? 
                                    Blockly.mainWorkspace.getBlockById(event.newElementId) : 
                                    Blockly.selected;
                        updateCommentDisplay(block);
                    }
                });
            }
            
            // Also directly hook into the global Blockly.selected property
            // This helps with keyboard navigation which might not trigger events
            const originalSelect = Blockly.BlockSvg.prototype.select;
            Blockly.BlockSvg.prototype.select = function() {
                const result = originalSelect.apply(this, arguments);
                console.log('Block selected via method override:', this.id);
                updateCommentDisplay(this);
                return result;
            };
            
            // Add keyboard navigation handler
            document.addEventListener('keydown', function(e) {
                // Handle arrow keys for navigation
                if (e.key.startsWith('Arrow') && Blockly.selected) {
                    // Small delay to let Blockly handle the navigation first
                    setTimeout(function() {
                        updateCommentDisplay(Blockly.selected);
                    }, 50);
                }
            });
        }
    }, 1000); // Give Blockly time to initialize
});

// Function to collect all existing tags from blocks in the workspace
function collectExistingTags() {
    // Clear the global tag set
    window.usedTags = window.usedTags || new Set();
    
    // Collect tags from all blocks in the workspace
    if (workspace) {
        const blocks = workspace.getAllBlocks(false);
        blocks.forEach(block => {
            if (block.data && block.data.tagTooltip) {
                // Extract the tag text without the # prefix
                let tagText = block.data.tagTooltip;
                if (tagText.startsWith('#')) {
                    tagText = tagText.substring(1).trim();
                }
                if (tagText) {
                    window.usedTags.add(tagText);
                }
            }
        });
    }
    
    console.log('Collected tags:', Array.from(window.usedTags));
    return Array.from(window.usedTags);
}

// Function to create a tag suggestion dropdown
function createTagSuggestionDropdown(textarea, parentElement) {
    // First collect all existing tags
    const existingTags = collectExistingTags();
    
    // If no tags exist, no need for a dropdown
    if (existingTags.length === 0) return null;
    
    // Create dropdown container
    let dropdownContainer = document.getElementById('tag-suggestion-dropdown');
    
    // Create dropdown if it doesn't exist
    if (!dropdownContainer) {
        dropdownContainer = document.createElement('div');
        dropdownContainer.id = 'tag-suggestion-dropdown';
        dropdownContainer.style.position = 'absolute';
        dropdownContainer.style.zIndex = '1001';
        dropdownContainer.style.backgroundColor = 'white';
        dropdownContainer.style.border = '1px solid #ccc';
        dropdownContainer.style.borderRadius = '4px';
        dropdownContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        dropdownContainer.style.maxHeight = '150px';
        dropdownContainer.style.overflowY = 'auto';
        dropdownContainer.style.display = 'none';
        document.body.appendChild(dropdownContainer);
    }
    
    // Clear previous suggestions
    dropdownContainer.innerHTML = '';
    
    // Add heading for suggestions
    const heading = document.createElement('div');
    heading.style.padding = '5px 10px';
    heading.style.borderBottom = '1px solid #eee';
    heading.style.fontWeight = 'bold';
    heading.style.fontSize = '12px';
    heading.style.color = '#666';
    heading.textContent = 'Existing Tags:';
    dropdownContainer.appendChild(heading);
    
    // Add each tag as a suggestion
    existingTags.forEach(tag => {
        const suggestion = document.createElement('div');
        suggestion.classList.add('tag-suggestion');
        suggestion.style.padding = '8px 12px'; // Larger padding for better touch targets
        suggestion.style.cursor = 'pointer';
        suggestion.style.fontSize = '14px'; // Larger font
        suggestion.style.borderBottom = '1px solid #f0f0f0'; // Separator line
        suggestion.style.textOverflow = 'ellipsis'; // Handle overflow
        suggestion.style.overflow = 'hidden';
        suggestion.style.whiteSpace = 'nowrap';
        suggestion.textContent = '#' + tag;
        
        // Highlight on hover
        suggestion.addEventListener('mouseover', function() {
            suggestion.style.backgroundColor = '#e7f0ff'; // More visible highlight color
            suggestion.style.color = '#1a73e8'; // Blue text on highlight
        });
        suggestion.addEventListener('mouseout', function() {
            suggestion.style.backgroundColor = 'transparent';
            suggestion.style.color = 'initial';
        });
        
        // Handle click to select this tag
        suggestion.addEventListener('click', function() {
            // Get current cursor position and text
            const cursorPos = textarea.selectionStart;
            const currentText = textarea.value;
            
            // Find the start of the current tag (where the # is)
            const tagStartPos = currentText.lastIndexOf('#', cursorPos);
            if (tagStartPos !== -1) {
                // Replace the partial tag with the selected tag
                const beforeTag = currentText.substring(0, tagStartPos);
                const afterTag = currentText.substring(cursorPos);
                textarea.value = beforeTag + '#' + tag + afterTag;
                
                // Move cursor after the inserted tag
                const newCursorPos = tagStartPos + tag.length + 1; // +1 for the #
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                textarea.focus();
            }
            
            // Hide the dropdown
            dropdownContainer.style.display = 'none';
        });
        
        dropdownContainer.appendChild(suggestion);
    });
    
    // Add option to create a new tag
    const newTagOption = document.createElement('div');
    newTagOption.classList.add('tag-suggestion');
    newTagOption.style.padding = '8px 12px';
    newTagOption.style.borderTop = '2px solid #eee';
    newTagOption.style.fontStyle = 'italic';
    newTagOption.style.color = '#4285F4';
    newTagOption.style.fontSize = '14px';
    newTagOption.style.cursor = 'pointer';
    newTagOption.textContent = '+ Create new tag';
    
    // Add special class to identify this option
    newTagOption.classList.add('create-new-tag-option');
    
    newTagOption.addEventListener('mouseover', function() {
        newTagOption.style.backgroundColor = '#e7f0ff';
    });
    newTagOption.addEventListener('mouseout', function() {
        newTagOption.style.backgroundColor = 'transparent';
    });
    newTagOption.addEventListener('click', function(e) {
        // Prevent any default actions or event propagation
        e.preventDefault();
        e.stopPropagation();
        
        // Simply close the dropdown and keep the # that's already there
        // The # should already be in the textarea since that's what triggered the dropdown
        dropdownContainer.style.display = 'none';
        
        // Focus the textarea so the user can continue typing
        textarea.focus();
        
        // Return false to prevent any further event handling
        return false;
    });
    dropdownContainer.appendChild(newTagOption);
    
    // Position the dropdown relative to the textarea
    const textareaRect = textarea.getBoundingClientRect();
    
    // Calculate appropriate width based on tag lengths
    const minWidth = textareaRect.width * 0.8; // Minimum width (80% of textarea)
    let maxTagWidth = 0;
    
    // Measure the width needed for each tag
    const tempSpan = document.createElement('span');
    tempSpan.style.position = 'absolute';
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.whiteSpace = 'nowrap';
    tempSpan.style.fontSize = '12px'; // Same as dropdown items
    tempSpan.style.fontFamily = 'Arial, sans-serif';
    tempSpan.style.padding = '5px 10px'; // Same padding as dropdown items
    document.body.appendChild(tempSpan);
    
    existingTags.forEach(tag => {
        tempSpan.textContent = '#' + tag;
        const tagWidth = tempSpan.offsetWidth;
        maxTagWidth = Math.max(maxTagWidth, tagWidth);
    });
    
    document.body.removeChild(tempSpan);
    
    // Add extra padding and set the width
    const dropdownWidth = Math.max(minWidth, maxTagWidth + 40); // 40px extra for padding and margin
    dropdownContainer.style.width = dropdownWidth + 'px';
    
    // Position the dropdown
    dropdownContainer.style.left = textareaRect.left + 'px';
    dropdownContainer.style.top = (textareaRect.bottom + 5) + 'px'; // 5px below textarea
    
    return dropdownContainer;
}

// Function to set up hover-only tooltips for blocks with comments or tags
function setupBlockHoverTooltip(block, content, type) {
    if (!block || !content) return;
    
    // Initialize block data if needed
    if (!block.data) block.data = {};
    
    // Store the content in the block's data
    block.data[type === 'tag' ? 'tagTooltip' : 'commentTooltip'] = content;
    
    // Get the SVG element of the block
    const blockSvg = block.getSvgRoot();
    
    // Only add a small indicator dot to show there's a comment/tag
    if (content.trim() !== '') {
        // Remove any existing indicators of this type
        const selector = type === 'tag' ? '.blockly-custom-tag-indicator' : '.blockly-custom-comment-indicator';
        const existingDots = blockSvg.querySelectorAll(selector);
        for (let i = 0; i < existingDots.length; i++) {
            existingDots[i].remove();
        }
        
        try {
            // Create a small indicator dot
            const indicatorDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            indicatorDot.setAttribute('class', type === 'tag' ? 'blockly-custom-tag-indicator' : 'blockly-custom-comment-indicator');
            indicatorDot.setAttribute('cx', '8');
            indicatorDot.setAttribute('cy', type === 'tag' ? '8' : '20'); // Tags at top, comments below
            indicatorDot.setAttribute('r', '4');
            indicatorDot.setAttribute('fill', type === 'tag' ? '#4285F4' : '#FFD700'); // Blue for tags, gold for comments
            
            const firstChild = blockSvg.firstChild;
            blockSvg.insertBefore(indicatorDot, firstChild);
        } catch (err) {
            console.error(`Error creating ${type} indicator:`, err);
        }
    }
    
    // Add hover event to show tooltip
    blockSvg.addEventListener('mouseover', function(e) {
        // Don't show empty tooltips
        if (!block.data) return;
        
        // Determine which content to show
        let tooltipContent = '';
        let tooltipType = '';
        
        if (block.data.tagTooltip && block.data.tagTooltip.trim() !== '') {
            tooltipContent = block.data.tagTooltip;
            tooltipType = 'tag';
        }
        
        if (block.data.commentTooltip && block.data.commentTooltip.trim() !== '') {
            // If there's both a tag and comment, show both with the tag first
            if (tooltipContent) {
                tooltipContent = tooltipContent + '\n' + block.data.commentTooltip;
            } else {
                tooltipContent = block.data.commentTooltip;
                tooltipType = 'comment';
            }
        }
        
        if (!tooltipContent) return;
        
        // Style the tooltip based on content type
        tooltipContainer.style.backgroundColor = tooltipType === 'tag' ? '#4285F4' : '#ffffc7';
        tooltipContainer.style.color = tooltipType === 'tag' ? 'white' : 'black';
        tooltipContainer.style.border = '1px solid ' + (tooltipType === 'tag' ? '#3b78e7' : '#e0d675');
        
        // Format the content with line breaks if needed
        tooltipContainer.innerHTML = tooltipContent.replace(/\n/g, '<br>');
        
        // Position tooltip near the block
        const blockRect = blockSvg.getBoundingClientRect();
        tooltipContainer.style.left = (blockRect.right + 10) + 'px';
        tooltipContainer.style.top = blockRect.top + 'px';
        tooltipContainer.style.display = 'block';
    });
    
    // Add mouseout event to hide tooltip
    blockSvg.addEventListener('mouseout', function() {
        tooltipContainer.style.display = 'none';
    });
}
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
    
    // Handle Ctrl+C for opening/editing comments
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        console.log('Ctrl+C detected');
        
        // First try to get currently selected block in Blockly
        let block = Blockly.selected;
        console.log('Initially selected block:', block);
        
        // For keyboard navigation, we need to check if a block has focus
        // since Blockly.selected might not be set even when a block has keyboard focus
        if (!block) {
            console.log('No block selected, checking for keyboard highlighted blocks');
            
            // Look for blocks with the keyboard navigation highlight class
            const highlightedBlocks = document.getElementsByClassName('blocklySelected');
            if (highlightedBlocks && highlightedBlocks.length > 0) {
                // Get the first highlighted block element
                const highlightedBlockEl = highlightedBlocks[0];
                console.log('Found highlighted block element:', highlightedBlockEl);
                
                // Try to get the block ID from the element
                const blockId = highlightedBlockEl.getAttribute('data-id') || 
                                highlightedBlockEl.id.replace('blockly-', '');
                                
                if (blockId) {
                    console.log('Extracted block ID:', blockId);
                    // Get the actual block from the workspace
                    block = workspace.getBlockById(blockId);
                    if (block) {
                        console.log('Found highlighted block by ID:', block.id);
                        // Force selection so the Blockly API knows this block is selected
                        block.select();
                    }
                }
            }
            
            // If still no block, fall back to trying the current block from blockList
            if (!block && blockList.length > 0) {
                // Use the currently displayed block from updateCurrentBlock()
                const currentIndex = document.getElementById('currentBlock').getAttribute('data-index');
                if (currentIndex !== null && currentIndex < blockList.length) {
                    block = blockList[currentIndex];
                    console.log('Using current block from display:', block?.id);
                    if (block) block.select();
                }
            }
            
            // Last resort: just use the first block in the workspace
            if (!block) {
                const allBlocks = workspace.getAllBlocks();
                console.log('Total blocks in workspace:', allBlocks.length);
                if (allBlocks.length > 0) {
                    block = allBlocks[0];
                    console.log('Using first block in workspace:', block.id);
                    block.select();
                }
            }
        }
        
        console.log('Working with block:', block);
        
        if (block && block instanceof Blockly.BlockSvg) { // Check if a block is selected and is a BlockSvg
            console.log('Block is valid BlockSvg');
            
            // Check if the block has comment functionality
            if (typeof block.getCommentIcon === 'function' && typeof block.setCommentText === 'function') {
                console.log('Block supports standard comment methods');
                let commentIcon = block.getCommentIcon();
                console.log('Initial comment icon:', commentIcon);
                
                if (!commentIcon) {
                    console.log('Creating new comment text');
                    try {
                        block.setCommentText(' '); // Use a space instead of empty string
                        commentIcon = block.getCommentIcon();
                        console.log('New comment icon created:', commentIcon);
                    } catch (err) {
                        console.error('Error creating comment:', err);
                    }
                }
                
                if (commentIcon) {
                    console.log('Setting comment visible');
                    try {
                        commentIcon.setVisible(true);
                        showStatus('Opening comment editor...');
                        
                        // Attempt to focus the textarea inside the comment bubble after it's visible
                        setTimeout(() => {
                            console.log('Inside setTimeout callback');
                            const textAreas = document.getElementsByClassName('blocklyCommentTextarea');
                            console.log('Found textareas:', textAreas.length);
                            
                            if (textAreas.length > 0) {
                                // Find the one that is visible (likely the one just opened)
                                for (let i = 0; i < textAreas.length; i++) {
                                    if (textAreas[i].offsetParent !== null) { // Check if textarea is visible
                                        console.log('Found visible textarea, focusing');
                                        textAreas[i].focus();
                                        textAreas[i].select(); // Select existing text for easy overwrite
                                        break;
                                    }
                                }
                            }
                        }, 300); // 300ms delay to allow DOM to update
                    } catch (err) {
                        console.error('Error showing comment:', err);
                    }
                } else {
                    console.log('Failed to create comment icon');
                    showStatus('Could not initialize comment editor for this block.');
                }
            } else if (typeof block.setCommentText === 'function') {
                // Alternative method: create our own custom comment UI beside the block
                console.log('Creating custom comment UI beside block');
                try {
                    // Get the current comment text (if any)
                    let currentComment = '';
                    if (typeof block.getCommentText === 'function') {
                        currentComment = block.getCommentText() || '';
                    } else if (block.comment !== undefined) {
                        currentComment = block.comment || '';
                    }
                    
                    // Get the block's position and size
                    const blockSvg = block.getSvgRoot();
                    const blockRect = blockSvg.getBoundingClientRect();
                    const workspaceRect = workspace.getInjectionDiv().getBoundingClientRect();
                    
                    // Create a custom comment bubble
                    let commentBubble = document.getElementById('custom-comment-bubble');
                    if (!commentBubble) {
                        commentBubble = document.createElement('div');
                        commentBubble.id = 'custom-comment-bubble';
                        document.body.appendChild(commentBubble);
                    }
                    
                    // Position it beside the block
                    const bubbleWidth = 200;
                    const bubbleHeight = 100;
                    
                    // Position to the right of the block, but make sure it's within the viewport
                    const leftPos = Math.min(
                        blockRect.right + 10, // 10px to the right of the block
                        window.innerWidth - bubbleWidth - 20 // keep it within viewport with 20px margin
                    );
                    
                    // Align it vertically with the top of the block
                    const topPos = blockRect.top;
                    
                    // Style the comment bubble
                    commentBubble.style.position = 'absolute';
                    commentBubble.style.left = leftPos + 'px';
                    commentBubble.style.top = topPos + 'px';
                    commentBubble.style.width = bubbleWidth + 'px';
                    commentBubble.style.minHeight = bubbleHeight + 'px';
                    commentBubble.style.backgroundColor = '#ffffc7'; // Yellow like Blockly comments
                    commentBubble.style.border = '1px solid #888';
                    commentBubble.style.borderRadius = '6px';
                    commentBubble.style.padding = '8px';
                    commentBubble.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.2)';
                    commentBubble.style.zIndex = '100';
                    commentBubble.style.display = 'flex';
                    commentBubble.style.flexDirection = 'column';
                    
                    // Generate the block identifier text
                    let blockIdentifier = '';
                    
                    // First try to get stack and block numbers
                    const stackName = window.stackNames && window.stackNames.has(block.id) ? 
                                     window.stackNames.get(block.id) : '';
                                     
                    // Get the block's position in its stack (1-indexed)
                    let blockNumber = 1;
                    if (stackName && typeof window.getBlockNumberInStack === 'function') {
                        try {
                            blockNumber = window.getBlockNumberInStack(block.id) || 1;
                        } catch (err) {
                            console.error('Error getting block number:', err);
                        }
                    }
                    
                    // Get a simplified block type name
                    let simplifiedBlockType = '';
                    if (block.type) {
                        // Extract a simplified name from the block type
                        const typeStr = block.type.toLowerCase();
                        
                        if (typeStr.includes('if')) {
                            simplifiedBlockType = 'if block';
                        } else if (typeStr.includes('repeat') || typeStr.includes('loop')) {
                            simplifiedBlockType = 'repeat block';
                        } else if (typeStr.includes('var')) {
                            simplifiedBlockType = 'variable';
                        } else if (typeStr.includes('math')) {
                            simplifiedBlockType = 'math block';
                        } else if (typeStr.includes('logic')) {
                            simplifiedBlockType = 'logic block';
                        } else if (typeStr.includes('text')) {
                            simplifiedBlockType = 'text block';
                        } else if (typeStr.includes('list')) {
                            simplifiedBlockType = 'list block';
                        } else if (typeStr.includes('procedure')) {
                            simplifiedBlockType = 'function block';
                        } else {
                            // Get the last part of the block type as a fallback
                            const parts = block.type.split('_');
                            simplifiedBlockType = parts[parts.length - 1] + ' block';
                        }
                    }
                    
                    // Format the identifier as "<StackName><BlockNumber>. <SimplifiedBlockType>"
                    blockIdentifier = (stackName || '') + blockNumber + ". " + simplifiedBlockType;
                    
                    // Get existing comment or tag from the block's data
                    let userComment = '';
                    
                    // Check if the block has stored comments or tags in its data
                    if (block.data) {
                        if (block.data.tagTooltip && block.data.tagTooltip.trim() !== '') {
                            // If there's a tag, use that (tags take precedence)
                            userComment = block.data.tagTooltip;
                            console.log('Found existing tag:', userComment);
                        } else if (block.data.commentTooltip && block.data.commentTooltip.trim() !== '') {
                            // Otherwise use any existing comment
                            userComment = block.data.commentTooltip;
                            console.log('Found existing comment:', userComment);
                        }
                    }
                    
                    // If nothing in data, check if there's a comment in the standard Blockly comment
                    if (!userComment && currentComment) {
                        // Filter out default or system-generated comments
                        if (currentComment.trim() !== '' && 
                            currentComment.toLowerCase().indexOf('if block') === -1 && 
                            currentComment.toLowerCase().indexOf('block') === -1) {
                            
                            // Try to extract user's portion of the comment
                            const identifierIndex = currentComment.indexOf('.');
                            if (identifierIndex > 0) {
                                const parts = currentComment.split('.');
                                if (parts.length > 1) {
                                    userComment = parts.slice(1).join('.').trim();
                                }
                            } else if (currentComment.startsWith('#')) {
                                // Keep hashtag comments (tags) intact
                                userComment = currentComment;
                            } else {
                                // Use the comment if it's not a block description
                                const lowerComment = currentComment.toLowerCase();
                                if (lowerComment.indexOf('block') === -1) {
                                    userComment = currentComment;
                                }
                            }
                        }
                    }
                    
                    console.log('Using comment/tag for editing:', userComment);
                    
                    // Create a custom comment UI with two parts:
                    // 1. Non-editable prefix with block identifier
                    // 2. Editable area for user comments
                    commentBubble.innerHTML = `
                        <div style="margin-bottom: 8px; font-size: 12px; color: #666;">
                            <em>Start with # for a tag, otherwise it's a comment</em>
                        </div>
                        <form onsubmit="return false;" style="width: 100%;"> <!-- Wrap in form with submit prevention -->
                            <div style="display: flex; width: 100%; position: relative;">                           
                                <div id="block-identifier" style="background: #e9e9e9; padding: 6px 8px; border: 1px solid #ddd; border-right: none; border-radius: 4px 0 0 4px; font-weight: bold; color: #333; white-space: nowrap; max-width: 35%; overflow: hidden; text-overflow: ellipsis;">
                                    ${blockIdentifier}
                                </div>
                                <textarea id="custom-comment-textarea" 
                                          style="flex-grow: 1; min-width: 150px; height: 30px; border: 1px solid #ddd; background: white; resize: none; outline: none; padding: 5px; border-radius: 0 4px 4px 0;">${userComment}</textarea>
                            </div>
                            <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
                                <button id="save-comment-btn" type="button" style="margin-right: 5px; padding: 5px 10px; background: #4d90fe; color: white; border: none; border-radius: 3px; cursor: pointer;">Save</button>
                                <button id="close-comment-btn" type="button" style="padding: 5px 10px; background: #f0f0f0; border: none; border-radius: 3px; cursor: pointer;">Close</button>
                            </div>
                        </form>
                    `;
                    
                    // Focus the textarea
                    const textarea = document.getElementById('custom-comment-textarea');
                    textarea.focus();
                    
                    // Track if we're currently in tag entry mode
                    let isEnteringTag = false;
                    
                    // Add input handler to detect when user types # to show tag suggestions
                    textarea.addEventListener('input', function(e) {
                        const cursorPos = textarea.selectionStart;
                        const text = textarea.value;
                        
                        // Find where the current tag starts (if we're in one)
                        let tagStart = -1;
                        for (let i = cursorPos - 1; i >= 0; i--) {
                            // Check for tag delimiter or start of text
                            if (text[i] === '#') {
                                tagStart = i;
                                break;
                            }
                            
                            // If we hit a space or newline before finding #, we're not in a tag
                            if (text[i] === ' ' || text[i] === '\n') {
                                break;
                            }
                        }
                        
                        // If we just typed a # and not in the middle of a word
                        const justTypedHash = cursorPos > 0 && text.charAt(cursorPos - 1) === '#';
                        const hashAtWordStart = justTypedHash && (cursorPos === 1 || /\s/.test(text.charAt(cursorPos - 2)));
                        
                        if (hashAtWordStart) {
                            console.log('Hashtag detected, showing tag suggestions');
                            // Show tag suggestions
                            const dropdown = createTagSuggestionDropdown(textarea, commentBubble);
                            if (dropdown) {
                                dropdown.style.display = 'block';
                                isEnteringTag = true;
                            }
                        } else if (tagStart >= 0) {
                            // We're in the middle of entering a tag
                            isEnteringTag = true;
                            
                            // Extract what the user has typed so far for the tag
                            const currentTagText = text.substring(tagStart + 1, cursorPos);
                            
                            // Check if what's being typed matches any existing tag
                            const dropdown = document.getElementById('tag-suggestion-dropdown');
                            if (dropdown) {
                                // If the user typed a space or newline, consider the tag complete
                                if (cursorPos > 0 && (text.charAt(cursorPos - 1) === ' ' || text.charAt(cursorPos - 1) === '\n')) {
                                    isEnteringTag = false;
                                    dropdown.style.display = 'none';
                                } else {
                                    // Get the tags from our global collection
                                    const existingTags = Array.from(window.usedTags || new Set());
                                    
                                    // Check if what's being typed matches any existing tag
                                    const matchingTags = existingTags.filter(tag => 
                                        tag.toLowerCase().startsWith(currentTagText.toLowerCase()));
                                    
                                    // If there are no matching tags, hide the dropdown
                                    if (matchingTags.length === 0 && currentTagText.length > 0) {
                                        console.log('No matching tags for:', currentTagText);
                                        dropdown.style.display = 'none';
                                    } else if (matchingTags.length > 0) {
                                        // If there are matching tags, keep dropdown visible
                                        dropdown.style.display = 'block';
                                    }
                                }
                            }
                        } else {
                            // Not entering a tag, hide dropdown
                            isEnteringTag = false;
                            const dropdown = document.getElementById('tag-suggestion-dropdown');
                            if (dropdown) {
                                dropdown.style.display = 'none';
                            }
                        }
                    });
                    
                    // Handle any click outside the textarea to close dropdown
                    document.addEventListener('click', function(e) {
                        if (e.target !== textarea) {
                            const dropdown = document.getElementById('tag-suggestion-dropdown');
                            if (dropdown) {
                                dropdown.style.display = 'none';
                            }
                        }
                    });
                    
                    // Also close dropdown when user clicks the save button
                    document.getElementById('save-comment-btn').addEventListener('click', function() {
                        const dropdown = document.getElementById('tag-suggestion-dropdown');
                        if (dropdown) {
                            dropdown.style.display = 'none';
                        }
                    });
                    
                    // Close dropdown when user clicks the close button
                    document.getElementById('close-comment-btn').addEventListener('click', function() {
                        const dropdown = document.getElementById('tag-suggestion-dropdown');
                        if (dropdown) {
                            dropdown.style.display = 'none';
                        }
                    });
                    
                    // Handle keydown events for special keys in the textarea
                    textarea.addEventListener('keydown', function(e) {
                        const dropdown = document.getElementById('tag-suggestion-dropdown');
                        
                        // Close dropdown on Escape key
                        if (e.key === 'Escape') {
                            if (dropdown) {
                                dropdown.style.display = 'none';
                            }
                            return;
                        }
                        
                        // Only handle navigation keys if dropdown is visible
                        if (dropdown && dropdown.style.display === 'block') {
                            // Handle arrow keys for navigation in dropdown
                            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                e.preventDefault(); // Prevent cursor movement in textarea
                                
                                // Find all suggestion items
                                const suggestions = dropdown.querySelectorAll('.tag-suggestion');
                                if (suggestions.length === 0) return;
                                
                                // Find currently highlighted item
                                let currentIndex = -1;
                                for (let i = 0; i < suggestions.length; i++) {
                                    if (suggestions[i].classList.contains('selected-tag')) {
                                        currentIndex = i;
                                        break;
                                    }
                                }
                                
                                // If no item is selected, select the first one when pressing down
                                // or the last one when pressing up
                                if (currentIndex === -1) {
                                    currentIndex = e.key === 'ArrowDown' ? -1 : suggestions.length;
                                }
                                
                                // Calculate new index
                                let newIndex;
                                if (e.key === 'ArrowDown') {
                                    // Down arrow should move selection down (increase index)
                                    newIndex = (currentIndex + 1) % suggestions.length;
                                } else if (e.key === 'ArrowUp') {
                                    // Up arrow should move selection up (decrease index)
                                    newIndex = (currentIndex - 1 + suggestions.length) % suggestions.length;
                                }
                                
                                console.log('Moving selection from index', currentIndex, 'to', newIndex);
                                
                                // Update highlighting
                                for (let i = 0; i < suggestions.length; i++) {
                                    // Remove old highlight class and reset style
                                    suggestions[i].classList.remove('selected-tag');
                                    suggestions[i].style.backgroundColor = 'transparent';
                                    suggestions[i].style.color = i === suggestions.length - 1 ? '#4285F4' : 'initial';
                                    
                                    // Add highlight to the selected item
                                    if (i === newIndex) {
                                        suggestions[i].classList.add('selected-tag');
                                        suggestions[i].style.backgroundColor = '#e7f0ff';
                                        suggestions[i].style.color = '#1a73e8';
                                    }
                                }
                                
                                // Scroll to ensure visible
                                suggestions[newIndex].scrollIntoView({ block: 'nearest' });
                            }
                            
                            // Handle Enter to select current highlighted item
                            if (e.key === 'Enter') {
                                // Find highlighted item
                                const highlightedItem = dropdown.querySelector('.selected-tag');
                                if (highlightedItem) {
                                    // Check if this is the 'Create new tag' option
                                    if (highlightedItem.classList.contains('create-new-tag-option')) {
                                        // Just close the dropdown without triggering save
                                        dropdown.style.display = 'none';
                                        e.preventDefault(); // Prevent the default Enter action
                                        e.stopPropagation(); // Prevent the Enter key from propagating
                                        return false; // Stop further handling
                                    } else {
                                        // For regular tags, simulate click
                                        e.preventDefault(); // Prevent form submission
                                        highlightedItem.click();
                                    }
                                } else {
                                    // No item selected, just close dropdown
                                    dropdown.style.display = 'none';
                                }
                            }
                            
                            // Hide dropdown on Escape
                            if (e.key === 'Escape') {
                                dropdown.style.display = 'none';
                                e.preventDefault();
                            }
                        }
                    });
                    
                    // Set up the save button
                    document.getElementById('save-comment-btn').addEventListener('click', function() {
                        const inputText = textarea.value.trim();
                        
                        // Split the input by lines to separate tags and comments
                        const lines = inputText.split('\n');
                        let tagText = '';
                        let commentText = '';
                        
                        // Initialize block data if it doesn't exist
                        block.data = block.data || {};
                        
                        // Process each line
                        lines.forEach(line => {
                            line = line.trim();
                            if (line.startsWith('#')) {
                                // This is a tag - we'll use the first tag we find
                                if (!tagText) {
                                    tagText = line;
                                }
                            } else if (line) {
                                // This is a regular comment
                                if (commentText) commentText += ' ';
                                commentText += line;
                            }
                        });
                        
                        console.log('Parsed input - Tag:', tagText, 'Comment:', commentText);
                        
                        // Store tag and comment in block data
                        if (tagText) {
                            block.data.tagTooltip = tagText;
                            // Set up tooltip for tag
                            setupBlockHoverTooltip(block, tagText, 'tag');
                            
                            // Extract the tag text without the # prefix for the global collection
                            let cleanTagText = tagText;
                            if (cleanTagText.startsWith('#')) {
                                cleanTagText = cleanTagText.substring(1).trim();
                            }
                            
                            // Add to global tag collection for future suggestions
                            if (cleanTagText) {
                                window.usedTags.add(cleanTagText);
                                console.log('Added new tag to global collection:', cleanTagText);
                            }
                        } else {
                            delete block.data.tagTooltip;
                        }
                        
                        if (commentText) {
                            block.data.commentTooltip = commentText;
                            // Set up tooltip for comment
                            setupBlockHoverTooltip(block, commentText, 'comment');
                        } else {
                            delete block.data.commentTooltip;
                        }
                        
                        // Apply a visual indicator for tags
                        const blockSvg = block.getSvgRoot();
                        
                        // Remove any existing tag indicators
                        const existingTags = blockSvg.querySelectorAll('.blockly-custom-tag-indicator');
                        for (let i = 0; i < existingTags.length; i++) {
                            existingTags[i].remove();
                        }
                        
                        // Add visual indicators for tags and comments
                        if (tagText) {
                            try {
                                // Add a small indicator that there's a tag (just a small dot)
                                const tagDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                                tagDot.setAttribute('class', 'blockly-custom-tag-indicator');
                                tagDot.setAttribute('cx', '8');
                                tagDot.setAttribute('cy', '8');
                                tagDot.setAttribute('r', '4');
                                tagDot.setAttribute('fill', '#4285F4'); // Blue dot for tags
                                
                                const firstChild = blockSvg.firstChild;
                                blockSvg.insertBefore(tagDot, firstChild);
                            } catch (err) {
                                console.error('Error creating tag indicator:', err);
                            }
                        }
                        
                        // Set a visible Blockly comment with both tag and comment if they exist
                        let blocklyComment = '';
                        if (tagText) blocklyComment += tagText + ' ';
                        if (commentText) blocklyComment += commentText;
                        
                        // Update the block's Blockly comment text
                        if (blocklyComment.trim()) {
                            block.setCommentText(blocklyComment.trim());
                            // Make the visible comment bubble hidden - we'll show via hover
                            if (typeof block.setCommentVisible === 'function') {
                                block.setCommentVisible(false);
                            }
                        } else {
                            // Clear the comment if there's nothing to show
                            block.setCommentText('');
                        }
                        
                        // Hide the bubble and show a status message
                        commentBubble.style.display = 'none';
                        
                        // Show a status message
                        if (tagText && commentText) {
                            showStatus('Tag and comment saved');
                        } else if (tagText) {
                            showStatus('Tag saved');
                        } else if (commentText) {
                            showStatus('Comment saved');
                        } else {
                            showStatus('Comment cleared');
                        }
                        
                        // Update the comment display box if the block is still selected
                        if (Blockly.selected === block) {
                            updateCommentDisplay(block);
                        }
                    });
                    
                    // Set up the close button
                    document.getElementById('close-comment-btn').addEventListener('click', function() {
                        commentBubble.style.display = 'none';
                    });
                    
                    // Add click handler to close bubble when clicking outside
                    const closeBubbleHandler = function(event) {
                        if (!commentBubble.contains(event.target)) {
                            commentBubble.style.display = 'none';
                            document.removeEventListener('click', closeBubbleHandler, true);
                        }
                    };
                    
                    // Add with a small delay to prevent immediate closing
                    setTimeout(function() {
                        document.addEventListener('click', closeBubbleHandler, true);
                    }, 100);
                    
                    showStatus('Comment editor opened');
                } catch (err) {
                    console.error('Error creating custom comment UI:', err);
                    showStatus('Could not create comment editor.');
                    
                    // Fall back to prompt if custom UI fails
                    try {
                        const commentText = prompt('Enter a comment for this block:', 
                            typeof block.getCommentText === 'function' ? (block.getCommentText() || '') : '');
                        
                        if (commentText !== null) {
                            block.setCommentText(commentText);
                            showStatus('Comment added to block');
                        }
                    } catch (promptErr) {
                        console.error('Fallback prompt also failed:', promptErr);
                    }
                }
            } else if (block.comment !== undefined) {
                // Fallback to the block.comment property if it exists
                console.log('Using block.comment property');
                
                // Create a simple prompt for comment text if direct editing isn't available
                const commentText = prompt('Enter a comment for this block:', block.comment || '');
                if (commentText !== null) { // Only if user didn't cancel
                    block.comment = commentText;
                    showStatus('Comment added to block');
                }
            } else {
                console.log('No comment support found for this block');
                showStatus('Comments are not supported for this block type or Blockly version.');
            }
            e.preventDefault(); // Prevent default copy action
            console.log('Default copy action prevented');
        } else {
            console.log('No valid block selected or found');
            showStatus('Please select a block first to add/edit its comment.');
        }
        return; // Stop further processing for this key event
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
