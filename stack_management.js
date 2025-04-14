// Add stack name label (A, B, C, etc.) to the top block
function addStackNameLabel(block, name) {
    // Remove any existing stack name label
    removeStackNameLabel(block);
    
    console.log(`Adding stack name to block ${block.id} with name: ${name}`);
    
    try {
        // Create new stack name element - position it much further to the left to avoid overlap
        const nameGroup = Blockly.utils.dom.createSvgElement('g', {
            'class': 'blocklyStackNameLabel',
            'transform': 'translate(-100, 20)'  // Much further to the left to avoid overlap
        }, block.getSvgRoot());
        
        // Background with rounded corners
        Blockly.utils.dom.createSvgElement('circle', {
            'cx': 18,
            'cy': 18,
            'r': 18,
            'fill': '#4285f4',  // Google blue
            'stroke': '#2a56c6', // Darker blue border
            'stroke-width': 2.5,
            'filter': 'drop-shadow(2px 2px 3px rgba(0,0,0,0.3))'
        }, nameGroup);
        
        // Stack name text
        const text = Blockly.utils.dom.createSvgElement('text', {
            'x': 18,
            'y': 23,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            'font-size': '18pt',
            'font-weight': 'bold',
            'fill': '#ffffff',  // White text
            'style': 'text-shadow: 1px 1px 2px rgba(0,0,0,0.3)'  // Text shadow
        }, nameGroup);
        
        text.textContent = name;
        
        // Store a reference to the name element on the block
        block.stackNameLabel = nameGroup;
        
        console.log("Stack name added successfully");
    } catch (e) {
        console.error("Error adding stack name:", e);
    }
}

// Remove number label from a block
function removeBlockLabel(block) {
    if (block.blockNumberLabel) {
        Blockly.utils.dom.removeNode(block.blockNumberLabel);
        block.blockNumberLabel = null;
    }
}

// Remove stack counter label from a block
function removeStackCounterLabel(block) {
    if (block.stackCounterLabel) {
        Blockly.utils.dom.removeNode(block.stackCounterLabel);
        block.stackCounterLabel = null;
    }
}

// Remove stack name label from a block
function removeStackNameLabel(block) {
    if (block.stackNameLabel) {
        Blockly.utils.dom.removeNode(block.stackNameLabel);
        block.stackNameLabel = null;
    }
}

// Assign stack names (A, B, C, etc.) to each top-level block
function assignStackNames(topLevelBlocks) {
    console.log("Assigning stack names to", topLevelBlocks.length, "top-level blocks");
    
    // First, remove any stack names for blocks that are no longer top-level
    // or don't exist in the workspace anymore
    const blocksToKeep = new Set(topLevelBlocks.map(block => block.id));
    
    // Check all existing stack names
    const namesToRemove = [];
    for (const [blockId, name] of stackNames.entries()) {
        const block = workspace.getBlockById(blockId);
        // Remove if block no longer exists or is not a top-level block
        if (!block || !blocksToKeep.has(blockId)) {
            namesToRemove.push(blockId);
        }
    }
    
    // Remove any names that were identified for removal
    namesToRemove.forEach(id => {
        console.log(`Removing name for non-existent block ${id}`);
        stackNames.delete(id);
    });
    
    // Alphabet for naming stacks
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // Find blocks that don't have names yet
    const newBlocks = topLevelBlocks.filter(block => !stackNames.has(block.id));
    
    // Get all existing stack names in use
    const usedNames = new Set(Array.from(stackNames.values()));
    
    // Find the next available letter that's not already used
    // We'll try to fill in gaps in the sequence first
    let nextAvailableName = '';
    for (let i = 0; i < alphabet.length; i++) {
        const candidateName = alphabet[i];
        if (!usedNames.has(candidateName)) {
            nextAvailableName = candidateName;
            break;
        }
    }
    
    // If we've used up all single letters, move to double letters
    if (!nextAvailableName) {
        // Find highest single letter index currently used
        let maxSingleLetterIndex = -1;
        for (const name of usedNames) {
            if (name.length === 1) {
                const index = alphabet.indexOf(name);
                maxSingleLetterIndex = Math.max(maxSingleLetterIndex, index);
            }
        }
        
        // Move to double letters starting from AA
        const firstLetterIndex = 0;
        const secondLetterIndex = 0;
        nextAvailableName = alphabet[firstLetterIndex] + alphabet[secondLetterIndex];
    }
    
    // Assign names to new blocks
    if (newBlocks.length > 0) {
        console.log(`Found ${newBlocks.length} new top-level blocks needing names`);
        console.log(`Next available name: ${nextAvailableName}`);
        
        // Sort blocks by position for consistent naming
        newBlocks.sort((a, b) => {
            const aPos = a.getRelativeToSurfaceXY();
            const bPos = b.getRelativeToSurfaceXY();
            return aPos.x - bPos.x;
        });
        
        // Assign names to each new block
        newBlocks.forEach(block => {
            // Find the next available name that's not used
            while (usedNames.has(nextAvailableName)) {
                // Move to the next letter
                const lastCharIndex = nextAvailableName.length - 1;
                const lastChar = nextAvailableName[lastCharIndex];
                const lastCharAlphabetIndex = alphabet.indexOf(lastChar);
                
                if (lastCharAlphabetIndex < alphabet.length - 1) {
                    // Just increment the last character
                    nextAvailableName = nextAvailableName.substring(0, lastCharIndex) + 
                                      alphabet[lastCharAlphabetIndex + 1];
                } else {
                    // Need to carry over to the next sequence
                    if (nextAvailableName.length === 1) {
                        // Move from Z to AA
                        nextAvailableName = 'AA';
                    } else {
                        // Increment the first character and reset the second
                        const firstChar = nextAvailableName[0];
                        const firstCharIndex = alphabet.indexOf(firstChar);
                        nextAvailableName = alphabet[firstCharIndex + 1] + 'A';
                    }
                }
            }
            
            // Assign the name
            stackNames.set(block.id, nextAvailableName);
            usedNames.add(nextAvailableName);
            console.log(`Assigned stack name ${nextAvailableName} to block ${block.id}`);
            
            // Move to the next name for the next block
            if (nextAvailableName.length === 1) {
                const index = alphabet.indexOf(nextAvailableName);
                if (index < alphabet.length - 1) {
                    nextAvailableName = alphabet[index + 1];
                } else {
                    nextAvailableName = 'AA';
                }
            } else {
                // Increment double letter name
                const lastChar = nextAvailableName[nextAvailableName.length - 1];
                const lastCharIndex = alphabet.indexOf(lastChar);
                if (lastCharIndex < alphabet.length - 1) {
                    nextAvailableName = nextAvailableName.substring(0, nextAvailableName.length - 1) + 
                                      alphabet[lastCharIndex + 1];
                } else {
                    const firstChar = nextAvailableName[0];
                    const firstCharIndex = alphabet.indexOf(firstChar);
                    nextAvailableName = alphabet[firstCharIndex + 1] + 'A';
                }
            }
        });
    }
    
    // Debug the final state
    console.log("Stack names after assignment:");
    for (const [blockId, name] of stackNames.entries()) {
        console.log(`Block ${blockId}: Stack ${name}`);
    }
}

// Make Blockly responsive
function onResize() {
    // Compute the absolute coordinates and dimensions of blocklyArea.
    let element = blocklyArea;
    let x = 0;
    let y = 0;
    do {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = element.offsetParent;
    } while (element);
    
    // Position blocklyDiv over blocklyArea.
    blocklyDiv.style.left = x + 'px';
    blocklyDiv.style.top = y + 'px';
    blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
    blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
    Blockly.svgResize(workspace);
}

// Initialization function
function initBlockly() {
    // Create the Blockly workspace
    workspace = Blockly.inject(blocklyDiv, {
        toolbox: toolboxXml,
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        grid: {
            spacing: 20,
            length: 3,
            colour: '#ccc',
            snap: true
        },
        trashcan: true
    });
    
    // Setup event listeners for workspace changes
    setupEventListeners();
    
    // Setup block numbering with our new native method
    if (typeof setupBlockNumbering === 'function') {
        setupBlockNumbering(workspace);
    }
    
    // Resize the workspace to fit the window
    window.addEventListener('resize', onResize, false);
    onResize();
}
